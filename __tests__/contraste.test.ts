// Acessibilidade: todo par de texto e fundo usado no app passa do mínimo AA (4,5:1), nos dois temas.
import { claro, escuro, type Paleta } from '@/tema/tokens';

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const PARES: [keyof Paleta, keyof Paleta][] = [
  ['tinta', 'papel'],
  ['tinta', 'superficie'],
  ['tinta', 'superficieForte'],
  ['tintaSuave', 'papel'],
  ['tintaSuave', 'superficie'],
  ['tintaSuave', 'superficieForte'],
  ['sobreAcao', 'acao'],
  ['acao', 'acaoSuave'],
  ['acao', 'papel'],
  ['acao', 'superficie'],
  ['azul', 'azulSuave'],
  ['ok', 'okFundo'],
  ['aviso', 'avisoFundo'],
  ['perigo', 'papel'],
  ['papel', 'tinta'],
];

describe.each([
  ['claro', claro],
  ['escuro', escuro],
])('tema %s', (_nome, p) => {
  it.each(PARES)('%s sobre %s passa de 4,5:1', (frente, fundo) => {
    expect(contraste(p[frente], p[fundo])).toBeGreaterThanOrEqual(4.5);
  });
});

it('a tela de clima também é legível (branco sobre o céu)', () => {
  expect(contraste('#FFFFFF', '#2F6CA3')).toBeGreaterThanOrEqual(4.5);
});
