// Tokens do Aquenda, tirados da logo (o elefante de kiwi com a tromba de arco-íris):
// texto marrom de casca de kiwi, fundo branco, e cada aba com um tom pastel do arco-íris
// da tromba. Juntas, as abas formam o arco inteiro: a comunidade toda.
// Todo par texto/fundo daqui passa de 4,5:1 (conferido em __tests__/contraste.test.ts).

export type Paleta = {
  papel: string;
  superficie: string;
  superficieForte: string;
  tinta: string;
  tintaSuave: string;
  linha: string;
  aviso: string;
  avisoFundo: string;
  ok: string;
  okFundo: string;
  perigo: string;
};

export const claro: Paleta = {
  papel: '#FFFFFF',
  superficie: '#F7F2EC',
  superficieForte: '#EEE5DA',
  tinta: '#3A2A1F',
  tintaSuave: '#6B5847',
  linha: '#E9DFD3',
  aviso: '#7A4E00',
  avisoFundo: '#FFF1D2',
  ok: '#3F6B12',
  okFundo: '#E3F2CF',
  perigo: '#A8322D',
};

export const escuro: Paleta = {
  papel: '#1C1612',
  superficie: '#2A221C',
  superficieForte: '#352B23',
  tinta: '#F5EEE6',
  tintaSuave: '#CDBFB1',
  linha: '#3D332A',
  aviso: '#FFD58A',
  avisoFundo: '#3A2C12',
  ok: '#B5DE7E',
  okFundo: '#243318',
  perigo: '#FF9C94',
};

/** Cores de uma seção: o topo pintado, a forma decorativa e a cor de ação. */
export type CoresSecao = {
  /** fundo do topo da tela */
  topo: string;
  /** formas decorativas no topo */
  forma: string;
  /** texto sobre o topo */
  sobreTopo: string;
  /** botões, chips ativos, links */
  acao: string;
  /** texto sobre o botão */
  sobreAcao: string;
  /** fundo suave (blocos de destaque, selos) */
  suave: string;
  /** texto sobre o fundo suave */
  sobreSuave: string;
};

export type NomeSecao = 'casa' | 'saude' | 'vagas' | 'agenda' | 'rodas' | 'roles';

/** As listras do arco-íris pastel da logo (a tromba). Cada aba pega uma. */
export const ARCO_IRIS = ['#F08A8A', '#F6A85A', '#F7D35E', '#9BCB5A', '#78AEE0', '#B39DDB'] as const;

const MARROM = '#3A2A1F';

export const SECOES_CLARO: Record<NomeSecao, CoresSecao> = {
  casa: { topo: '#FFDDBE', forma: '#F6A85A', sobreTopo: MARROM, acao: '#A84B0C', sobreAcao: '#FFFFFF', suave: '#FFEEDE', sobreSuave: '#733306' },
  saude: { topo: '#DCEFBF', forma: '#9BCB5A', sobreTopo: MARROM, acao: '#4A7314', sobreAcao: '#FFFFFF', suave: '#EDF6DE', sobreSuave: '#36560D' },
  vagas: { topo: '#D3E5F7', forma: '#78AEE0', sobreTopo: MARROM, acao: '#2C61A3', sobreAcao: '#FFFFFF', suave: '#E7F0FA', sobreSuave: '#1E4878' },
  agenda: { topo: '#E6DCF6', forma: '#B39DDB', sobreTopo: MARROM, acao: '#6547AA', sobreAcao: '#FFFFFF', suave: '#F2ECFA', sobreSuave: '#48308A' },
  rodas: { topo: '#FBD6D5', forma: '#F08A8A', sobreTopo: MARROM, acao: '#AC3636', sobreAcao: '#FFFFFF', suave: '#FDE8E7', sobreSuave: '#842424' },
  roles: { topo: '#FCEDB3', forma: '#F7D35E', sobreTopo: MARROM, acao: '#856000', sobreAcao: '#FFFFFF', suave: '#FDF5D6', sobreSuave: '#664900' },
};

export const SECOES_ESCURO: Record<NomeSecao, CoresSecao> = {
  casa: { topo: '#4A2C14', forma: '#8A5321', sobreTopo: '#FFE7D2', acao: '#F8B57A', sobreAcao: '#2A1405', suave: '#3A2516', sobreSuave: '#FFCFA6' },
  saude: { topo: '#2E3F18', forma: '#4E6B22', sobreTopo: '#E6F5D0', acao: '#B5DE7E', sobreAcao: '#1A2808', suave: '#263319', sobreSuave: '#C9E9A0' },
  vagas: { topo: '#1D3350', forma: '#3A6290', sobreTopo: '#DDEAF8', acao: '#9CC3EC', sobreAcao: '#0C1E33', suave: '#1E2B3B', sobreSuave: '#B9D4F1' },
  agenda: { topo: '#33284D', forma: '#5C4A8A', sobreTopo: '#ECE4FA', acao: '#C8B6EC', sobreAcao: '#1D1236', suave: '#2A2338', sobreSuave: '#D8CBF2' },
  rodas: { topo: '#4D2020', forma: '#8A3E3E', sobreTopo: '#FDE2E1', acao: '#F5A8A8', sobreAcao: '#3A0D0D', suave: '#3A2121', sobreSuave: '#F9C4C3' },
  roles: { topo: '#4A3C0E', forma: '#75611A', sobreTopo: '#FFF2C8', acao: '#F7D774', sobreAcao: '#2E2300', suave: '#363016', sobreSuave: '#F9E49C' },
};

// Fredoka (redonda, simpática) só nos títulos; Atkinson Hyperlegible, feita para baixa
// visão, em todo o resto.
export const fontes = {
  titulo: 'Fredoka_600SemiBold',
  normal: 'AtkinsonHyperlegible_400Regular',
  forte: 'AtkinsonHyperlegible_700Bold',
} as const;

// Escala em pontos. O sistema multiplica pelo tamanho de fonte escolhido no aparelho.
export const tipo = {
  enorme: 44,
  titulo: 30,
  subtitulo: 21,
  corpo: 17,
  apoio: 15,
} as const;

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const raio = { botao: 999, bloco: 24, topo: 36, chip: 999, campo: 16 } as const;

// 48 dp é o mínimo de alvo de toque recomendado no Android.
export const ALVO_MINIMO = 48;
