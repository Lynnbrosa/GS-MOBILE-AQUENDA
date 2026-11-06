// Banco local (expo-sqlite). Tudo que está aqui fica só neste celular:
// agenda de hormônio, consultas, favoritos, preferências e o cache das APIs.
// O PIN não fica aqui: vai para o expo-secure-store (ver discreto.ts).
import * as SQLite from 'expo-sqlite';
import type { Consulta, Lembrete } from './agenda';
import type { ArmazemCache } from './cache';
import type { Categoria } from './api/tipos';

let aberto: Promise<SQLite.SQLiteDatabase> | null = null;

/** Cada item é uma versão. Nunca editar uma que já foi publicada: criar a próxima. */
const MIGRACOES: string[] = [
  // 1: estrutura inicial
  `
  CREATE TABLE IF NOT EXISTS preferencias (
    chave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS cache_api (
    chave TEXT PRIMARY KEY NOT NULL,
    corpo TEXT NOT NULL,
    guardado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lembretes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    anotacao TEXT NOT NULL DEFAULT '',
    frequencia TEXT NOT NULL CHECK (frequencia IN ('diaria', 'semanal', 'intervalo')),
    hora INTEGER NOT NULL CHECK (hora BETWEEN 0 AND 23),
    minuto INTEGER NOT NULL CHECK (minuto BETWEEN 0 AND 59),
    dias_semana TEXT NOT NULL DEFAULT '',
    intervalo_dias INTEGER NOT NULL DEFAULT 1,
    inicio TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lembrete_id INTEGER NOT NULL REFERENCES lembretes(id) ON DELETE CASCADE,
    feito_em TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS ix_registros_lembrete ON registros (lembrete_id, feito_em);
  CREATE TABLE IF NOT EXISTS consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    local TEXT NOT NULL DEFAULT '',
    data_hora TEXT NOT NULL,
    antecedencia_min INTEGER NOT NULL DEFAULT 0,
    anotacao TEXT NOT NULL DEFAULT '',
    criado_em TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS ix_consultas_data ON consultas (data_hora);
  CREATE TABLE IF NOT EXISTS favoritos (
    servico_id INTEGER PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    salvo_em TEXT NOT NULL
  );
  `,
  // 2: quem você bloqueou nas salas (fica só neste celular; a outra pessoa não fica sabendo)
  `
  CREATE TABLE IF NOT EXISTS bloqueados (
    apelido TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
    bloqueado_em TEXT NOT NULL
  );
  `,
];

async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let versao = linha?.user_version ?? 0;
  while (versao < MIGRACOES.length) {
    const sql = MIGRACOES[versao];
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(sql);
    });
    versao += 1;
    await db.execAsync(`PRAGMA user_version = ${versao}`);
  }
}

export function banco(): Promise<SQLite.SQLiteDatabase> {
  if (!aberto) {
    aberto = (async () => {
      const db = await SQLite.openDatabaseAsync('aquenda.db');
      await migrar(db);
      return db;
    })();
    aberto.catch(() => {
      aberto = null;
    });
  }
  return aberto;
}

// ---------- preferências ----------

export async function lerPreferencia(chave: string): Promise<string | null> {
  const db = await banco();
  const r = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM preferencias WHERE chave = ?', chave);
  return r?.valor ?? null;
}

export async function gravarPreferencia(chave: string, valor: string | null): Promise<void> {
  const db = await banco();
  if (valor === null) await db.runAsync('DELETE FROM preferencias WHERE chave = ?', chave);
  else
    await db.runAsync(
      'INSERT INTO preferencias (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
      chave,
      valor,
    );
}

// ---------- cache das APIs ----------

export const armazemSqlite: ArmazemCache = {
  async ler(chave) {
    const db = await banco();
    const r = await db.getFirstAsync<{ corpo: string; guardado_em: string }>(
      'SELECT corpo, guardado_em FROM cache_api WHERE chave = ?',
      chave,
    );
    return r ? { corpo: r.corpo, guardadoEm: r.guardado_em } : null;
  },
  async gravar(chave, corpo, guardadoEm) {
    const db = await banco();
    await db.runAsync(
      `INSERT INTO cache_api (chave, corpo, guardado_em) VALUES (?, ?, ?)
       ON CONFLICT(chave) DO UPDATE SET corpo = excluded.corpo, guardado_em = excluded.guardado_em`,
      chave,
      corpo,
      guardadoEm,
    );
  },
};

// ---------- lembretes ----------

type LinhaLembrete = {
  id: number;
  titulo: string;
  anotacao: string;
  frequencia: Lembrete['frequencia'];
  hora: number;
  minuto: number;
  dias_semana: string;
  intervalo_dias: number;
  inicio: string;
  ativo: number;
};

export function deLinhaLembrete(r: LinhaLembrete): Lembrete {
  return {
    id: r.id,
    titulo: r.titulo,
    anotacao: r.anotacao,
    frequencia: r.frequencia,
    hora: r.hora,
    minuto: r.minuto,
    diasSemana: r.dias_semana ? r.dias_semana.split(',').map(Number).filter((n) => !Number.isNaN(n)) : [],
    intervaloDias: r.intervalo_dias,
    inicio: r.inicio,
    ativo: r.ativo === 1,
  };
}

export async function listarLembretes(): Promise<Lembrete[]> {
  const db = await banco();
  const linhas = await db.getAllAsync<LinhaLembrete>('SELECT * FROM lembretes ORDER BY hora, minuto, id');
  return linhas.map(deLinhaLembrete);
}

export async function obterLembrete(id: number): Promise<Lembrete | null> {
  const db = await banco();
  const r = await db.getFirstAsync<LinhaLembrete>('SELECT * FROM lembretes WHERE id = ?', id);
  return r ? deLinhaLembrete(r) : null;
}

export async function salvarLembrete(l: Lembrete): Promise<number> {
  const db = await banco();
  const dias = [...new Set(l.diasSemana)].sort((a, b) => a - b).join(',');
  if (l.id) {
    await db.runAsync(
      `UPDATE lembretes SET titulo = ?, anotacao = ?, frequencia = ?, hora = ?, minuto = ?,
       dias_semana = ?, intervalo_dias = ?, inicio = ?, ativo = ? WHERE id = ?`,
      l.titulo.trim(), l.anotacao.trim(), l.frequencia, l.hora, l.minuto, dias, l.intervaloDias, l.inicio, l.ativo ? 1 : 0, l.id,
    );
    return l.id;
  }
  const r = await db.runAsync(
    `INSERT INTO lembretes (titulo, anotacao, frequencia, hora, minuto, dias_semana, intervalo_dias, inicio, ativo, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    l.titulo.trim(), l.anotacao.trim(), l.frequencia, l.hora, l.minuto, dias, l.intervaloDias, l.inicio, l.ativo ? 1 : 0,
    new Date().toISOString(),
  );
  return r.lastInsertRowId;
}

export async function apagarLembrete(id: number): Promise<void> {
  const db = await banco();
  await db.runAsync('DELETE FROM lembretes WHERE id = ?', id);
}

export async function marcarFeito(lembreteId: number, em: Date = new Date()): Promise<void> {
  const db = await banco();
  await db.runAsync('INSERT INTO registros (lembrete_id, feito_em) VALUES (?, ?)', lembreteId, em.toISOString());
}

export async function ultimosRegistros(lembreteId: number, limite = 5): Promise<string[]> {
  const db = await banco();
  const linhas = await db.getAllAsync<{ feito_em: string }>(
    'SELECT feito_em FROM registros WHERE lembrete_id = ? ORDER BY feito_em DESC LIMIT ?',
    lembreteId,
    limite,
  );
  return linhas.map((l) => l.feito_em);
}

// ---------- consultas ----------

type LinhaConsulta = { id: number; titulo: string; local: string; data_hora: string; antecedencia_min: number; anotacao: string };

const deLinhaConsulta = (r: LinhaConsulta): Consulta => ({
  id: r.id,
  titulo: r.titulo,
  local: r.local,
  dataHora: r.data_hora,
  antecedenciaMin: r.antecedencia_min,
  anotacao: r.anotacao,
});

export async function listarConsultas(): Promise<Consulta[]> {
  const db = await banco();
  const linhas = await db.getAllAsync<LinhaConsulta>('SELECT * FROM consultas ORDER BY data_hora');
  return linhas.map(deLinhaConsulta);
}

export async function obterConsulta(id: number): Promise<Consulta | null> {
  const db = await banco();
  const r = await db.getFirstAsync<LinhaConsulta>('SELECT * FROM consultas WHERE id = ?', id);
  return r ? deLinhaConsulta(r) : null;
}

export async function salvarConsulta(c: Consulta): Promise<number> {
  const db = await banco();
  if (c.id) {
    await db.runAsync(
      'UPDATE consultas SET titulo = ?, local = ?, data_hora = ?, antecedencia_min = ?, anotacao = ? WHERE id = ?',
      c.titulo.trim(), c.local.trim(), c.dataHora, c.antecedenciaMin, c.anotacao.trim(), c.id,
    );
    return c.id;
  }
  const r = await db.runAsync(
    'INSERT INTO consultas (titulo, local, data_hora, antecedencia_min, anotacao, criado_em) VALUES (?, ?, ?, ?, ?, ?)',
    c.titulo.trim(), c.local.trim(), c.dataHora, c.antecedenciaMin, c.anotacao.trim(), new Date().toISOString(),
  );
  return r.lastInsertRowId;
}

export async function apagarConsulta(id: number): Promise<void> {
  const db = await banco();
  await db.runAsync('DELETE FROM consultas WHERE id = ?', id);
}

// ---------- favoritos ----------

export type Favorito = { servicoId: number; nome: string; categoria: Categoria };

export async function listarFavoritos(): Promise<Favorito[]> {
  const db = await banco();
  const linhas = await db.getAllAsync<{ servico_id: number; nome: string; categoria: Categoria }>(
    'SELECT servico_id, nome, categoria FROM favoritos ORDER BY salvo_em DESC',
  );
  return linhas.map((l) => ({ servicoId: l.servico_id, nome: l.nome, categoria: l.categoria }));
}

export async function ehFavorito(servicoId: number): Promise<boolean> {
  const db = await banco();
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM favoritos WHERE servico_id = ?', servicoId);
  return (r?.n ?? 0) > 0;
}

export async function alternarFavorito(f: Favorito): Promise<boolean> {
  const db = await banco();
  if (await ehFavorito(f.servicoId)) {
    await db.runAsync('DELETE FROM favoritos WHERE servico_id = ?', f.servicoId);
    return false;
  }
  await db.runAsync(
    'INSERT INTO favoritos (servico_id, nome, categoria, salvo_em) VALUES (?, ?, ?, ?)',
    f.servicoId, f.nome, f.categoria, new Date().toISOString(),
  );
  return true;
}

// ---------- bloqueios nas salas ----------

export async function listarBloqueados(): Promise<string[]> {
  const db = await banco();
  const linhas = await db.getAllAsync<{ apelido: string }>('SELECT apelido FROM bloqueados ORDER BY bloqueado_em DESC');
  return linhas.map((l) => l.apelido);
}

export async function bloquear(apelido: string): Promise<void> {
  const db = await banco();
  await db.runAsync('INSERT INTO bloqueados (apelido, bloqueado_em) VALUES (?, ?) ON CONFLICT(apelido) DO NOTHING', apelido.trim(), new Date().toISOString());
}

export async function desbloquear(apelido: string): Promise<void> {
  const db = await banco();
  await db.runAsync('DELETE FROM bloqueados WHERE apelido = ?', apelido);
}

// ---------- apagar tudo ----------

/** "Apagar meus dados": some com agenda, consultas, favoritos, cache e preferências. */
export async function apagarTudo(): Promise<void> {
  const db = await banco();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync(
      'DELETE FROM registros; DELETE FROM lembretes; DELETE FROM consultas; DELETE FROM favoritos; DELETE FROM bloqueados; DELETE FROM cache_api; DELETE FROM preferencias;',
    );
  });
}
