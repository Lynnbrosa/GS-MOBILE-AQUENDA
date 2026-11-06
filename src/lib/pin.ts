// Regras do PIN, sem dependência nativa (dá para testar).

export const PIN_MIN = 4;
export const PIN_MAX = 6;

export function validarPin(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return 'Use só números.';
  if (pin.length < PIN_MIN || pin.length > PIN_MAX) return `O PIN tem de ${PIN_MIN} a ${PIN_MAX} números.`;
  if (/^(\d)\1+$/.test(pin)) return 'Evite repetir o mesmo número (ex.: 1111).';
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return 'Evite sequências (ex.: 1234).';
  return null;
}

/** Depois de 5 erros, espera 30 s; a cada erro a mais, dobra (até 15 min). */
export function esperaAposErros(erros: number): number {
  if (erros < 5) return 0;
  return Math.min(30_000 * 2 ** (erros - 5), 15 * 60_000);
}

export function textoEspera(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `Tente de novo em ${s} segundos.`;
  const m = Math.ceil(s / 60);
  return `Tente de novo em ${m} ${m === 1 ? 'minuto' : 'minutos'}.`;
}

/** Comparação que leva o mesmo tempo acerte ou erre. */
export function iguaisTempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}
