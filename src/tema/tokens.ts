// Tokens do Aquenda. A direção visual está em DESIGN.md: papel lilás-claro,
// tinta ameixa, rosa-cravo para ação e a "fita" rosa e azul como único enfeite.
// Todo par texto/fundo daqui passa de 4,5:1 (conferido em __tests__/contraste.test.ts).

export type Paleta = {
  papel: string;
  superficie: string;
  superficieForte: string;
  tinta: string;
  tintaSuave: string;
  linha: string;
  acao: string;
  sobreAcao: string;
  acaoSuave: string;
  azul: string;
  azulSuave: string;
  fitaRosa: string;
  fitaAzul: string;
  aviso: string;
  avisoFundo: string;
  ok: string;
  okFundo: string;
  perigo: string;
};

export const claro: Paleta = {
  papel: '#F4F2F7',
  superficie: '#FFFFFF',
  superficieForte: '#ECE7F1',
  tinta: '#22172B',
  tintaSuave: '#574B61',
  linha: '#DCD4E3',
  acao: '#A3305A',
  sobreAcao: '#FFFFFF',
  acaoSuave: '#F7E3EA',
  azul: '#245F7C',
  azulSuave: '#E1EFF6',
  fitaRosa: '#F2A7BB',
  fitaAzul: '#8DD3EE',
  aviso: '#7A4E00',
  avisoFundo: '#FFF1D2',
  ok: '#22603A',
  okFundo: '#E2F2E7',
  perigo: '#A2261F',
};

export const escuro: Paleta = {
  papel: '#17121C',
  superficie: '#221A29',
  superficieForte: '#2D2335',
  tinta: '#F1ECF4',
  tintaSuave: '#C4BACC',
  linha: '#3B3045',
  acao: '#F39BB9',
  sobreAcao: '#2A0E1A',
  acaoSuave: '#3D2230',
  azul: '#92D2EC',
  azulSuave: '#1D3440',
  fitaRosa: '#F2A7BB',
  fitaAzul: '#8DD3EE',
  aviso: '#FFD58A',
  avisoFundo: '#3A2C12',
  ok: '#9BDDB1',
  okFundo: '#183324',
  perigo: '#FF9C94',
};

// Atkinson Hyperlegible foi desenhada pelo Braille Institute para baixa visão:
// letras que não se confundem (I, l, 1; O, 0). É a fonte do app inteiro.
export const fontes = {
  normal: 'AtkinsonHyperlegible_400Regular',
  forte: 'AtkinsonHyperlegible_700Bold',
} as const;

// Escala em pontos. O sistema multiplica pelo tamanho de fonte escolhido no aparelho.
export const tipo = {
  marca: 34,
  titulo: 26,
  subtitulo: 20,
  corpo: 17,
  apoio: 15,
} as const;

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

// Raios diferentes por hierarquia: o cartão é mais macio que o botão, a fita é reta.
export const raio = { botao: 12, cartao: 18, chip: 999 } as const;

// 48 dp é o mínimo de alvo de toque recomendado no Android.
export const ALVO_MINIMO = 48;
