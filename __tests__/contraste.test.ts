// Acessibilidade: todo par de texto e fundo usado no app passa do mínimo AA (4,5:1),
// nos dois temas e nas seis cores de aba.
import { claro, escuro, SECOES_CLARO, SECOES_ESCURO, type CoresSecao, type NomeSecao, type Paleta } from '@/tema/tokens';

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const BASE: [keyof Paleta, keyof Paleta][] = [
  ['tinta', 'papel'],
  ['tinta', 'superficie'],
  ['tinta', 'superficieForte'],
  ['tintaSuave', 'papel'],
  ['tintaSuave', 'superficie'],
  ['ok', 'okFundo'],
  ['aviso', 'avisoFundo'],
  ['perigo', 'papel'],
];

const SECAO: [keyof CoresSecao, keyof CoresSecao][] = [
  ['sobreTopo', 'topo'],
  ['sobreTopo', 'forma'],
  ['sobreAcao', 'acao'],
  ['sobreSuave', 'suave'],
];

describe.each([
  ['claro', claro, SECOES_CLARO],
  ['escuro', escuro, SECOES_ESCURO],
] as const)('tema %s', (_nome, p, secoes) => {
  it.each(BASE)('%s sobre %s passa de 4,5:1', (frente, fundo) => {
    expect(contraste(p[frente], p[fundo])).toBeGreaterThanOrEqual(4.5);
  });

  const casos = (Object.keys(secoes) as NomeSecao[]).flatMap((n) => SECAO.map(([f, b]) => [n, f, b] as const));
  it.each(casos)('aba %s: %s sobre %s passa de 4,5:1', (n, frente, fundo) => {
    expect(contraste(secoes[n][frente], secoes[n][fundo])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(Object.keys(secoes) as NomeSecao[])('aba %s: a cor de ação também se lê sobre o papel', (n) => {
    expect(contraste(secoes[n].acao, p.papel)).toBeGreaterThanOrEqual(4.5);
  });
});

it('a tela de clima também é legível (branco sobre o céu)', () => {
  expect(contraste('#FFFFFF', '#2F6CA3')).toBeGreaterThanOrEqual(4.5);
});
