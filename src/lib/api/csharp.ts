// API C# (.NET 8, porta 5000): catálogo, vagas das casas, rodas e indicador de impacto.
import { urlBase } from '../config';
import { montarQuery, pedirJson } from './http';
import type {
  Atendimento,
  AvisoFechamento,
  Categoria,
  Pagina,
  Roda,
  ServicoDetalhe,
  ServicoResumo,
  TipoInteracao,
  VagasCasa,
} from './tipos';

export type FiltroServicos = {
  categoria?: Categoria;
  atendimento?: Atendimento[];
  texto?: string;
  bairro?: string;
  lat?: number;
  lon?: number;
  raioKm?: number;
  abertos?: boolean;
  pagina?: number;
  tamanho?: number;
};

const base = () => `${urlBase('csharp')}/api`;

export function urlServicos(f: FiltroServicos): string {
  const temPosicao = f.lat !== undefined && f.lon !== undefined;
  return `${base()}/servicos${montarQuery({
    categoria: f.categoria,
    atendimento: f.atendimento,
    texto: f.texto?.trim(),
    bairro: f.bairro?.trim(),
    lat: temPosicao ? Number(f.lat!.toFixed(4)) : undefined,
    lon: temPosicao ? Number(f.lon!.toFixed(4)) : undefined,
    // a API recusa raio sem posição (400), então o app nem manda
    raioKm: temPosicao ? f.raioKm : undefined,
    abertos: f.abertos ? true : undefined,
    pagina: f.pagina,
    tamanho: f.tamanho ?? 30,
  })}`;
}

export const apiCsharp = {
  buscarServicos: (f: FiltroServicos) => pedirJson<Pagina<ServicoResumo>>(urlServicos(f)),

  servico: (id: number, pos?: { lat: number; lon: number }) =>
    pedirJson<ServicoDetalhe>(
      `${base()}/servicos/${id}${montarQuery({ lat: pos?.lat.toFixed(4), lon: pos?.lon.toFixed(4) })}`,
    ),

  casas: () => pedirJson<VagasCasa[]>(`${base()}/casas`),

  vagasDaCasa: (id: number) => pedirJson<VagasCasa>(`${base()}/casas/${id}/vagas`),

  rodas: (filtro: { dias?: number; presencial?: boolean } = {}) =>
    pedirJson<Roda[]>(`${base()}/rodas${montarQuery({ dias: filtro.dias ?? 60, presencial: filtro.presencial })}`),

  roda: (id: number) => pedirJson<Roda>(`${base()}/rodas/${id}`),

  /** Conta o toque sem nada sobre quem tocou: só o tipo e o serviço. */
  registrarInteracao: (tipo: TipoInteracao, servicoId: number) =>
    pedirJson<void>(`${base()}/metricas/interacoes`, { metodo: 'POST', corpo: { tipo, servicoId }, tempoLimiteMs: 5000 }),

  avisarFechamento: (servicoId: number) =>
    pedirJson<AvisoFechamento>(`${base()}/servicos/${servicoId}/avisos-fechamento`, { metodo: 'POST' }),
};
