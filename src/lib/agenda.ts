// Agenda de hormônio e consultas. Tudo aqui é lógica pura (sem banco, sem notificação),
// para dar para testar. O app guarda o horário que a pessoa escolheu e nunca sugere dose.

export type Frequencia = 'diaria' | 'semanal' | 'intervalo';

export type Lembrete = {
  id?: number;
  titulo: string;
  anotacao: string;
  frequencia: Frequencia;
  hora: number;
  minuto: number;
  /** 0 = domingo ... 6 = sábado (igual ao Date.getDay). Só vale para 'semanal'. */
  diasSemana: number[];
  /** A cada quantos dias. Só vale para 'intervalo' (ex.: aplicação a cada 14 ou 21 dias). */
  intervaloDias: number;
  /** Primeiro dia, AAAA-MM-DD. Para 'intervalo' é o dia da primeira aplicação. */
  inicio: string;
  ativo: boolean;
};

export type Consulta = {
  id?: number;
  titulo: string;
  local: string;
  /** Data e hora em ISO 8601. */
  dataHora: string;
  /** Quantos minutos antes avisar. 0 = sem aviso. */
  antecedenciaMin: number;
  anotacao: string;
};

export const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const MS_DIA = 86_400_000;

function dois(n: number): string {
  return String(n).padStart(2, '0');
}

export function hojeIso(agora: Date): string {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export function lerDataIso(iso: string): { a: number; m: number; d: number } | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!r) return null;
  const a = Number(r[1]);
  const m = Number(r[2]);
  const d = Number(r[3]);
  const teste = new Date(a, m - 1, d);
  if (teste.getFullYear() !== a || teste.getMonth() !== m - 1 || teste.getDate() !== d) return null;
  return { a, m, d };
}

/** Número do dia no calendário, sem fuso nem horário de verão no meio. */
function numeroDoDia(a: number, m: number, d: number): number {
  return Math.round(Date.UTC(a, m - 1, d) / MS_DIA);
}

export function validarLembrete(l: Lembrete): string[] {
  const erros: string[] = [];
  const titulo = l.titulo.trim();
  if (!titulo) erros.push('Dê um nome para o lembrete.');
  else if (titulo.length > 60) erros.push('Use até 60 letras no nome.');
  if (!Number.isInteger(l.hora) || l.hora < 0 || l.hora > 23) erros.push('A hora vai de 0 a 23.');
  if (!Number.isInteger(l.minuto) || l.minuto < 0 || l.minuto > 59) erros.push('Os minutos vão de 0 a 59.');
  if (l.frequencia === 'semanal' && l.diasSemana.filter((d) => d >= 0 && d <= 6).length === 0)
    erros.push('Escolha pelo menos um dia da semana.');
  if (l.frequencia === 'intervalo' && (!Number.isInteger(l.intervaloDias) || l.intervaloDias < 2 || l.intervaloDias > 90))
    erros.push('O intervalo vai de 2 a 90 dias.');
  if (!lerDataIso(l.inicio)) erros.push('A data de início não é válida.');
  if (l.anotacao.length > 300) erros.push('A anotação pode ter até 300 letras.');
  return erros;
}

function caiNoDia(l: Lembrete, a: number, m: number, d: number, diaSemana: number): boolean {
  const ini = lerDataIso(l.inicio)!;
  const diff = numeroDoDia(a, m, d) - numeroDoDia(ini.a, ini.m, ini.d);
  if (diff < 0) return false;
  switch (l.frequencia) {
    case 'diaria':
      return true;
    case 'semanal':
      return l.diasSemana.includes(diaSemana);
    case 'intervalo':
      return diff % l.intervaloDias === 0;
  }
}

/** Próximos horários do lembrete a partir de agora (inclusive o minuto atual). */
export function proximasOcorrencias(l: Lembrete, agora: Date, quantidade: number): Date[] {
  if (!l.ativo || validarLembrete(l).length > 0 || quantidade <= 0) return [];
  const saida: Date[] = [];
  const limite = 400 + (l.frequencia === 'intervalo' ? l.intervaloDias * quantidade : 0);
  for (let i = 0; i <= limite && saida.length < quantidade; i++) {
    const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i, l.hora, l.minuto, 0, 0);
    if (dia.getTime() < agora.getTime() - 59_000) continue;
    if (caiNoDia(l, dia.getFullYear(), dia.getMonth() + 1, dia.getDate(), dia.getDay())) saida.push(dia);
  }
  return saida;
}

export function proximaOcorrencia(l: Lembrete, agora: Date): Date | null {
  return proximasOcorrencias(l, agora, 1)[0] ?? null;
}

export function horaTexto(hora: number, minuto: number): string {
  return `${dois(hora)}h${dois(minuto)}`;
}

export function textoFrequencia(l: Lembrete): string {
  const h = horaTexto(l.hora, l.minuto);
  switch (l.frequencia) {
    case 'diaria':
      return `Todo dia às ${h}`;
    case 'semanal': {
      const dias = [...new Set(l.diasSemana)].sort((x, y) => x - y);
      if (dias.length === 7) return `Todo dia às ${h}`;
      const nomes = dias.map((d) => DIAS_CURTOS[d]);
      const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0];
      return `Toda ${lista} às ${h}`;
    }
    case 'intervalo':
      return `A cada ${l.intervaloDias} dias às ${h}`;
  }
}

// ---------- consultas ----------

export function validarConsulta(c: Consulta, agora: Date): string[] {
  const erros: string[] = [];
  if (!c.titulo.trim()) erros.push('Diga que consulta é (ex.: endocrinologista).');
  else if (c.titulo.trim().length > 60) erros.push('Use até 60 letras no nome.');
  const quando = new Date(c.dataHora);
  if (Number.isNaN(quando.getTime())) erros.push('A data e a hora não são válidas.');
  else if (quando.getTime() < agora.getTime()) erros.push('Essa data já passou.');
  if (c.antecedenciaMin < 0 || c.antecedenciaMin > 7 * 24 * 60) erros.push('O aviso pode ser de até 7 dias antes.');
  if (c.local.length > 120) erros.push('O local pode ter até 120 letras.');
  return erros;
}

/** Quando avisar da consulta. Se o horário do aviso já passou, avisa nenhum (null). */
export function avisoDaConsulta(c: Consulta, agora: Date): Date | null {
  if (c.antecedenciaMin <= 0) return null;
  const quando = new Date(c.dataHora).getTime() - c.antecedenciaMin * 60_000;
  if (Number.isNaN(quando) || quando <= agora.getTime()) return null;
  return new Date(quando);
}

export const ANTECEDENCIAS = [
  { min: 0, texto: 'Sem aviso' },
  { min: 60, texto: '1 hora antes' },
  { min: 180, texto: '3 horas antes' },
  { min: 1440, texto: '1 dia antes' },
] as const;

// ---------- notificações ----------

export type PlanoNotificacao =
  | { tipo: 'diaria'; hora: number; minuto: number }
  | { tipo: 'semanal'; diaSemana: number; hora: number; minuto: number }
  | { tipo: 'data'; data: Date };

/** Quantas datas futuras deixar agendadas para o lembrete por intervalo (reagendado ao abrir o app). */
export const DATAS_AGENDADAS_INTERVALO = 8;

/**
 * Traduz o lembrete nos gatilhos do expo-notifications.
 * Semanal usa 1 = domingo ... 7 = sábado, como a biblioteca pede.
 */
export function planoDeNotificacoes(l: Lembrete, agora: Date): PlanoNotificacao[] {
  if (!l.ativo || validarLembrete(l).length > 0) return [];
  const ini = lerDataIso(l.inicio)!;
  const comecaNoFuturo = numeroDoDia(ini.a, ini.m, ini.d) > numeroDoDia(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());
  // Um gatilho repetido não sabe "a partir de quando". Se começa no futuro, agenda datas.
  if (l.frequencia === 'intervalo' || comecaNoFuturo) {
    return proximasOcorrencias(l, agora, DATAS_AGENDADAS_INTERVALO).map((data) => ({ tipo: 'data', data }));
  }
  if (l.frequencia === 'diaria') return [{ tipo: 'diaria', hora: l.hora, minuto: l.minuto }];
  return [...new Set(l.diasSemana)]
    .sort((x, y) => x - y)
    .map((d) => ({ tipo: 'semanal', diaSemana: d + 1, hora: l.hora, minuto: l.minuto }));
}

/** Texto da notificação. No modo discreto não aparece nome nem a palavra hormônio. */
export function conteudoLembrete(l: Pick<Lembrete, 'titulo'>, discreto: boolean): { titulo: string; corpo: string } {
  if (discreto) return { titulo: 'Lembrete', corpo: 'Você marcou um lembrete para agora.' };
  return { titulo: l.titulo.trim(), corpo: 'Hora do seu lembrete, conforme sua prescrição.' };
}

export function conteudoConsulta(c: Pick<Consulta, 'titulo' | 'local' | 'dataHora'>, discreto: boolean): { titulo: string; corpo: string } {
  if (discreto) return { titulo: 'Compromisso', corpo: 'Você tem um compromisso marcado em breve.' };
  const d = new Date(c.dataHora);
  const quando = `${DIAS_CURTOS[d.getDay()]}, ${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${horaTexto(d.getHours(), d.getMinutes())}`;
  return { titulo: c.titulo.trim(), corpo: c.local.trim() ? `${quando}, ${c.local.trim()}` : quando };
}
