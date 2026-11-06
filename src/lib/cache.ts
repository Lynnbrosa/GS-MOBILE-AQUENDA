// Regra do app: se uma API cair, mostra o último dado guardado e diz de quando ele é.
// Nunca uma tela vazia sem explicação.
import { ErroApi } from './api/http';

export type Guardado = { corpo: string; guardadoEm: string };

/** Onde as respostas ficam guardadas. No app é a tabela cache_api do SQLite; nos testes, um Map. */
export interface ArmazemCache {
  ler(chave: string): Promise<Guardado | null>;
  gravar(chave: string, corpo: string, guardadoEm: string): Promise<void>;
}

export type Resultado<T> =
  | { tipo: 'rede'; dados: T; guardadoEm: string }
  | { tipo: 'cache'; dados: T; guardadoEm: string; motivo: string };

/** Sem rede e sem nada guardado: a tela explica o que houve e oferece tentar de novo. */
export class SemDados extends Error {
  readonly motivo: string;
  readonly indisponivel: boolean;
  constructor(motivo: string, indisponivel: boolean) {
    super(motivo);
    this.name = 'SemDados';
    this.motivo = motivo;
    this.indisponivel = indisponivel;
  }
}

export async function lerDoCache<T>(chave: string, armazem: ArmazemCache): Promise<{ dados: T; guardadoEm: string } | null> {
  try {
    const g = await armazem.ler(chave);
    if (!g) return null;
    return { dados: JSON.parse(g.corpo) as T, guardadoEm: g.guardadoEm };
  } catch {
    return null; // cache corrompido conta como vazio
  }
}

export async function obterComCache<T>(
  chave: string,
  buscar: () => Promise<T>,
  armazem: ArmazemCache,
  agora: () => Date = () => new Date(),
): Promise<Resultado<T>> {
  try {
    const dados = await buscar();
    const guardadoEm = agora().toISOString();
    try {
      await armazem.gravar(chave, JSON.stringify(dados), guardadoEm);
    } catch {
      // não conseguir guardar não impede de mostrar
    }
    return { tipo: 'rede', dados, guardadoEm };
  } catch (e) {
    const erro = e instanceof ErroApi ? e : new ErroApi('rede', 'Não foi possível falar com o serviço.');
    // 404 e 400 são respostas de verdade: não faz sentido mostrar uma versão velha.
    if (!erro.indisponivel) throw new SemDados(erro.message, false);
    const guardado = await lerDoCache<T>(chave, armazem);
    if (!guardado) throw new SemDados(erro.message, true);
    return { tipo: 'cache', dados: guardado.dados, guardadoEm: guardado.guardadoEm, motivo: erro.message };
  }
}

export function memoriaCache(): ArmazemCache & { mapa: Map<string, Guardado> } {
  const mapa = new Map<string, Guardado>();
  return {
    mapa,
    ler: async (chave) => mapa.get(chave) ?? null,
    gravar: async (chave, corpo, guardadoEm) => void mapa.set(chave, { corpo, guardadoEm }),
  };
}
