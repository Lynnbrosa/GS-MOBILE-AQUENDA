// Textos que a pessoa lê: datas, distâncias, rótulos. Linguagem simples, sem sigla solta.
import type { Atendimento, Categoria, Modalidade, OrigemVaga, SituacaoVagas } from './api/tipos';
import { DIAS_CURTOS, horaTexto } from './agenda';

function dois(n: number): string {
  return String(n).padStart(2, '0');
}

export function dataCurta(d: Date): string {
  return `${DIAS_CURTOS[d.getDay()]}, ${dois(d.getDate())}/${dois(d.getMonth() + 1)}`;
}

export function dataHoraCurta(d: Date): string {
  return `${dataCurta(d)} às ${horaTexto(d.getHours(), d.getMinutes())}`;
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "há 5 minutos", "hoje às 14h05", "ontem às 09h00", "em 03/11 às 18h30". */
export function haQuanto(iso: string, agora: Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'em data desconhecida';
  const min = Math.floor((agora.getTime() - d.getTime()) / 60_000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return min === 1 ? 'há 1 minuto' : `há ${min} minutos`;
  const h = horaTexto(d.getHours(), d.getMinutes());
  if (mesmoDia(d, agora)) return `hoje às ${h}`;
  const ontem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1);
  if (mesmoDia(d, ontem)) return `ontem às ${h}`;
  return `em ${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${h}`;
}

/** "em 20 minutos", "hoje às 20h00", "amanhã às 08h30", "sex, 14/11 às 09h00". */
export function quandoFuturo(d: Date, agora: Date): string {
  const min = Math.round((d.getTime() - agora.getTime()) / 60_000);
  if (min <= 0) return 'agora';
  if (min < 60) return min === 1 ? 'em 1 minuto' : `em ${min} minutos`;
  const h = horaTexto(d.getHours(), d.getMinutes());
  if (mesmoDia(d, agora)) return `hoje às ${h}`;
  const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  if (mesmoDia(d, amanha)) return `amanhã às ${h}`;
  return dataHoraCurta(d);
}

/** Data AAAA-MM-DD da API em "05/11/2026". */
export function dataDaApi(iso: string): string {
  const r = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return r ? `${r[3]}/${r[2]}/${r[1]}` : iso;
}

export function distancia(km: number | null | undefined): string | null {
  if (km === null || km === undefined || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/** Leitores de tela leem "km" como "quilômetros" só às vezes; aqui fica por extenso. */
export function distanciaFalada(km: number | null | undefined): string | null {
  if (km === null || km === undefined || Number.isNaN(km)) return null;
  if (km < 1) return `a ${Math.max(10, Math.round((km * 1000) / 10) * 10)} metros`;
  return `a ${km.toFixed(1).replace('.', ',')} quilômetros`;
}

export const CATEGORIAS: Record<Categoria, string> = {
  Acolhimento: 'Casa de acolhimento',
  CentroReferencia: 'Centro de Referência',
  Saude: 'Saúde',
  Juridico: 'Jurídico',
  Role: 'Rolê',
};

const ATENDIMENTOS: Record<Atendimento, string> = {
  Psicossocial: 'Apoio psicossocial',
  Juridico: 'Orientação jurídica',
  Hormonizacao: 'Hormonização',
  SaudeMental: 'Saúde mental',
  Retificacao: 'Retificação de nome',
  Denuncia: 'Denúncia',
  Acolhida: 'Acolhida',
  Trabalho: 'Trabalho',
  Convivencia: 'Convivência',
};

export function rotuloAtendimento(a: string): string {
  return ATENDIMENTOS[a as Atendimento] ?? a;
}

export const MODALIDADES: Record<Modalidade, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
  nao_informada: 'Modalidade não informada',
};

export const ORIGENS_VAGA: Record<OrigemVaga, string> = {
  gupy: 'Gupy',
  adzuna: 'Adzuna',
  curadoria: 'Curadoria do Aquenda',
};

export function textoAberto(aberto: boolean | null): { texto: string; tom: 'ok' | 'neutro' | 'fechado' } {
  if (aberto === true) return { texto: 'Aberto agora', tom: 'ok' };
  if (aberto === false) return { texto: 'Fechado agora', tom: 'fechado' };
  return { texto: 'Horário a confirmar', tom: 'neutro' };
}

export function tomVagas(s: SituacaoVagas): 'ok' | 'fechado' | 'neutro' {
  if (s === 'Disponivel') return 'ok';
  if (s === 'Lotada') return 'fechado';
  return 'neutro';
}

export function faixaPreco(n: number): string {
  if (n <= 0) return 'Grátis';
  if (n === 1) return 'Barato';
  if (n === 2) return 'Preço médio';
  return 'Mais caro';
}

/** Deixa só dígitos e o + inicial. "(11) 5087-9911" -> "tel:+551150879911". */
export function linkTelefone(tel: string): string | null {
  const digitos = tel.replace(/\D/g, '');
  if (digitos.length < 8) return null;
  const comPais = digitos.startsWith('55') && digitos.length >= 12 ? digitos : `55${digitos}`;
  return `tel:+${comPais}`;
}

/** Abre no app de mapas. Com coordenada é mais preciso; sem, busca pelo endereço. */
export function linkMapa(nome: string, endereco: string, lat: number | null, lon: number | null): string {
  if (lat !== null && lon !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nome}, ${endereco}`)}`;
}

/** Só abre link http(s). Um anúncio malicioso não consegue mandar "javascript:". */
export function linkSeguro(url: string | null | undefined): string | null {
  if (!url) return null;
  const limpo = url.trim();
  return /^https?:\/\//i.test(limpo) ? limpo : null;
}

/** Nomes do CNES vêm em caixa alta. "CENTRO DE REFERENCIA E TREINAMENTO" -> "Centro de Referencia e Treinamento". */
export function nomeProprio(texto: string): string {
  const minusculas = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'na', 'no']);
  const siglas = new Set(['DST', 'AIDS', 'IST', 'SUS', 'UBS', 'CTA', 'CEI', 'HC', 'FMUSP', 'SP', 'LGBTI+', 'AME', 'CR', 'POP', 'TT']);
  return texto
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => {
      if (siglas.has(p.toUpperCase())) return p.toUpperCase();
      if (i > 0 && minusculas.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ');
}
