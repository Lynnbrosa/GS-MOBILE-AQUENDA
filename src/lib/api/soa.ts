// FastAPI (porta 8000): vagas de emprego afirmativas e estabelecimentos do CNES.
import { urlBase } from '../config';
import { montarQuery, pedirJson } from './http';
import type { Estabelecimento, EstabelecimentosDoMunicipio, Modalidade, PaginaVagas, VagaDetalhe } from './tipos';

/** Código IBGE de São Paulo (capital). */
export const IBGE_SAO_PAULO = 3550308;

/** Habilitações do processo transexualizador no SUS (Portaria GM/MS nº 2.803/2013). */
export const HABILITACOES = {
  '30.01': 'Atenção especializada no processo transexualizador',
  '30.02': 'Ambulatório: acompanhamento e hormonização',
  '30.03': 'Hospital: cirurgias e acompanhamento',
} as const;

export type CodigoHabilitacao = keyof typeof HABILITACOES;

export type FiltroVagas = {
  texto?: string;
  cidade?: string;
  afirmativa?: boolean;
  modalidade?: Modalidade;
  pagina?: number;
  tamanho?: number;
};

const base = () => `${urlBase('soa')}/api`;

export function urlVagas(f: FiltroVagas): string {
  return `${base()}/vagas${montarQuery({
    texto: f.texto?.trim(),
    cidade: f.cidade?.trim(),
    afirmativa: f.afirmativa === undefined ? undefined : f.afirmativa,
    modalidade: f.modalidade,
    pagina: f.pagina,
    tamanho: f.tamanho ?? 30,
  })}`;
}

export const apiSoa = {
  vagas: (f: FiltroVagas) => pedirJson<PaginaVagas>(urlVagas(f)),

  vaga: (id: number) => pedirJson<VagaDetalhe>(`${base()}/vagas/${id}`),

  estabelecimentos: (codigoIbge: number, habilitacao?: CodigoHabilitacao) =>
    pedirJson<EstabelecimentosDoMunicipio>(
      `${base()}/municipios/${codigoIbge}/estabelecimentos${montarQuery({ habilitacao })}`,
    ),

  estabelecimento: (codigoCnes: number) => pedirJson<Estabelecimento>(`${base()}/cnes/estabelecimentos/${codigoCnes}`),
};
