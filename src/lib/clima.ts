// Previsão de faz-de-conta para a tela da saída rápida. Determinística: o mesmo dia
// sempre dá o mesmo tempo, então não "pisca" ao abrir de novo e não usa a rede.

export type Ceu = 'sol' | 'nuvens' | 'nublado' | 'chuva';

export type Previsao = {
  data: Date;
  min: number;
  max: number;
  agora: number;
  ceu: Ceu;
  descricao: string;
  chuva: number;
  horas: { hora: number; temp: number; ceu: Ceu }[];
};

const DESCRICOES: Record<Ceu, string> = {
  sol: 'Ensolarado',
  nuvens: 'Parcialmente nublado',
  nublado: 'Nublado',
  chuva: 'Pancadas de chuva',
};

/** Gerador simples a partir de um número (mulberry32). */
function semente(n: number): () => number {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function previsaoDoDia(data: Date, horaAgora: number = new Date().getHours()): Previsao {
  const r = semente(data.getFullYear() * 1000 + data.getMonth() * 40 + data.getDate());
  // São Paulo: mais quente e chuvoso de novembro a março
  const verao = [10, 11, 0, 1, 2].includes(data.getMonth());
  const min = Math.round((verao ? 18 : 13) + r() * 4);
  const max = min + Math.round(6 + r() * 7);
  const sorteio = r();
  const ceu: Ceu = sorteio < 0.3 ? 'sol' : sorteio < 0.6 ? 'nuvens' : sorteio < 0.8 ? 'nublado' : 'chuva';
  const chuva = ceu === 'chuva' ? Math.round(60 + r() * 35) : ceu === 'nublado' ? Math.round(20 + r() * 30) : Math.round(r() * 15);
  const tempNaHora = (h: number) => Math.round(min + (max - min) * Math.max(0, Math.sin(((h - 6) / 24) * 2 * Math.PI * 0.95)));
  const horas = Array.from({ length: 5 }, (_, i) => {
    const hora = (horaAgora + i * 2) % 24;
    return { hora, temp: tempNaHora(hora), ceu: hora >= 19 || hora < 6 ? (ceu === 'chuva' ? 'chuva' : 'nublado') : ceu };
  });
  return { data, min, max, agora: tempNaHora(horaAgora), ceu, descricao: DESCRICOES[ceu], chuva, horas };
}
