// Regras do chat que rodam no celular (lógica pura, testada em __tests__/conversa.test.ts).
import type { Mensagem } from './api/tipos';

/** Junta as mensagens novas às que já estão na tela, sem repetir e em ordem de chegada. */
export function mesclar(atuais: Mensagem[], novas: Mensagem[]): Mensagem[] {
  if (novas.length === 0) return atuais;
  const porId = new Map(atuais.map((m) => [m.id, m]));
  for (const m of novas) porId.set(m.id, m);
  return [...porId.values()].sort((a, b) => a.id - b.id);
}

export function ultimoId(mensagens: Mensagem[]): number | null {
  return mensagens.length ? mensagens[mensagens.length - 1].id : null;
}

/** Some uma mensagem (a moderação ocultou ou ela recebeu 3 denúncias). */
export function remover(mensagens: Mensagem[], mensagemId: number): Mensagem[] {
  return mensagens.filter((m) => m.id !== mensagemId);
}

function normalizar(apelido: string): string {
  return apelido.trim().toLocaleLowerCase('pt-BR');
}

/**
 * Bloquear é só seu: some da sua tela tudo o que aquele apelido escreveu.
 * A API não expõe id de quem escreveu, então o bloqueio é pelo apelido.
 */
export function semBloqueados(mensagens: Mensagem[], bloqueados: ReadonlySet<string>): Mensagem[] {
  if (bloqueados.size === 0) return mensagens;
  const alvo = new Set([...bloqueados].map(normalizar));
  return mensagens.filter((m) => !alvo.has(normalizar(m.apelido)));
}

/** É minha? Pelo id das que enviei deste celular ou, se não, pelo apelido. */
export function ehMinha(m: Mensagem, meuApelido: string | undefined, enviadas: ReadonlySet<number>): boolean {
  if (enviadas.has(m.id)) return true;
  return !!meuApelido && normalizar(m.apelido) === normalizar(meuApelido);
}

/**
 * Mesmas regras do servidor (ModeradorAutomatico, na API C#): link, telefone, e-mail e CPF
 * não entram. Aqui serve para avisar antes de enviar; quem decide é a API.
 */
export function temContato(texto: string): boolean {
  const numeros = texto.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
  if (numeros.some((t) => (t.match(/\d/g) ?? []).length >= 8)) return true; // telefone ou CPF
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(texto)) return true;
  return /(https?:\/\/|www\.|\b[\w-]+\.(com|br|net|org|io|me|ly|gg|app|link)\b|wa\.me|t\.me)/i.test(texto);
}

export function validarApelido(apelido: string): string | null {
  const a = apelido.trim().replace(/\s+/g, ' ');
  if (a.length < 3 || a.length > 24) return 'O apelido tem de 3 a 24 letras.';
  if (!/^[\p{L}\p{N} _.-]+$/u.test(a)) return 'Use só letras, números, espaço, ponto, traço ou sublinhado.';
  if (temContato(a)) return 'O apelido não pode ter telefone, e-mail ou link.';
  return null;
}

/** Sem tempo real (SignalR caiu), consulta de tempos em tempos, cada vez mais devagar. */
export function proximoIntervalo(semNovidadeSeguidas: number): number {
  if (semNovidadeSeguidas < 3) return 4000;
  if (semNovidadeSeguidas < 10) return 8000;
  return 15000;
}

/** Hora curta da mensagem: "14h05" hoje, "ontem 22h10" ou "03/11 09h00". */
export function horaDaMensagem(iso: string, agora: Date): string {
  const d = new Date(iso);
  const hh = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.toDateString() === agora.toDateString()) return hh;
  const ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return `ontem ${hh}`;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${hh}`;
}
