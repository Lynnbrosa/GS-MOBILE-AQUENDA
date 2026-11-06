// Contratos JSON das duas APIs, copiados dos DTOs:
// API C#: src/Aquenda.Api/Contratos (camelCase, enums como texto)
// FastAPI: app/api/schemas.py (snake_case)

// ---------- API C# ----------

export type Categoria = 'Acolhimento' | 'CentroReferencia' | 'Saude' | 'Juridico' | 'Role';

export type Atendimento =
  | 'Psicossocial'
  | 'Juridico'
  | 'Hormonizacao'
  | 'SaudeMental'
  | 'Retificacao'
  | 'Denuncia'
  | 'Acolhida'
  | 'Trabalho'
  | 'Convivencia';

export type Endereco = {
  texto: string;
  bairro: string;
  cidade: string;
  logradouro: string | null;
  sigiloso: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type ServicoResumo = {
  id: number;
  nome: string;
  categoria: Categoria;
  endereco: Endereco;
  distanciaKm: number | null;
  abertoAgora: boolean | null;
  comoAcessar: string;
  atendimentos: string[];
  telefone: string | null;
  site: string | null;
  fonte: string;
  verificadoEm: string;
  precisaRevisao: boolean;
};

export type Horario = { dia: string; abre: string | null; fecha: string | null; diaInteiro: boolean };

export type ServicoDetalhe = {
  resumo: ServicoResumo;
  descricao: string;
  horarios: Horario[];
  acolhimento: { publicoAlvo: string; capacidadeDeclarada: number | null; exigeEncaminhamento: boolean } | null;
  centroReferencia: { inscreveTranscidadania: boolean } | null;
  saude: {
    codigoCnes: string | null;
    tipoAtencao: 'Primaria' | 'Secundaria';
    redeSampaTrans: boolean;
    habilitadaProcessoTransexualizador: boolean;
    exigeEncaminhamento: boolean;
  } | null;
  juridico: { orgao: string; atendeRetificacao: boolean; recebeDenuncia: boolean } | null;
  role: { tipo: 'Bar' | 'Balada' | 'Cultural' | 'EspacoPublico'; faixaPreco: number; acessivel: boolean; tagOsm: string | null } | null;
};

export type Pagina<T> = { itens: T[]; total: number; pagina: number; tamanho: number; totalPaginas: number };

export type SituacaoVagas = 'SemLeitura' | 'Disponivel' | 'Lotada' | 'Desatualizada';

export type VagasCasa = {
  casaId: number;
  casa: string;
  situacao: SituacaoVagas;
  mensagem: string;
  total: number | null;
  ocupadas: number | null;
  livres: number | null;
  atualizadoEm: string | null;
  origem: 'Sensor' | 'Manual' | 'Simulado' | null;
  comoAcessar: string;
};

export type Roda = {
  id: number;
  titulo: string;
  descricao: string;
  organizador: string;
  inicio: string;
  fim: string;
  presencial: boolean;
  local: { id: number; nome: string; endereco: string } | null;
  linkGrupo: string | null;
  idadeMinima: number;
  exemplo: boolean;
};

export type TipoInteracao = 'ComoChegar' | 'Ligar' | 'AbrirSite';

export type AvisoFechamento = { servicoId: number; avisos: number; entrouEmRevisao: boolean };

// ---------- FastAPI ----------

export type Modalidade = 'presencial' | 'hibrido' | 'remoto' | 'nao_informada';
export type OrigemVaga = 'adzuna' | 'gupy' | 'curadoria';

export type VagaResumo = {
  id: number;
  titulo: string;
  empresa: string;
  cidade: string | null;
  uf: string | null;
  modalidade: Modalidade;
  afirmativa: boolean;
  termo_afirmativo: string | null;
  origem: OrigemVaga;
  publicada_em: string | null;
  url_candidatura: string;
  exemplo: boolean;
};

export type VagaDetalhe = VagaResumo & {
  descricao: string;
  fonte: string;
  coletada_em: string;
  salario_min: number | null;
  salario_max: number | null;
  aviso: string;
};

export type PaginaVagas = { itens: VagaResumo[]; total: number; pagina: number; tamanho: number; total_paginas: number };

export type Estabelecimento = {
  codigo_cnes: number;
  nome: string;
  razao_social: string;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  telefone: string | null;
  latitude: number | null;
  longitude: number | null;
  atende_sus: boolean | null;
  turno: string | null;
  habilitacoes: string[];
  fonte: string;
  coletado_em: string;
  atualizado_no_cnes: string | null;
};

export type EstabelecimentosDoMunicipio = {
  codigo_ibge: number;
  municipio: { codigo_ibge: number; nome: string; uf: string } | null;
  habilitacoes: string[] | null;
  total: number;
  itens: Estabelecimento[];
};
