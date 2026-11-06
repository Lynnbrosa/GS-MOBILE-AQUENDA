// Cliente HTTP mínimo em cima do fetch: tempo limite, JSON e erros no formato
// ProblemDetails (RFC 7807), que as duas APIs do Aquenda usam.

export type TipoErro = 'rede' | 'tempo' | 'http' | 'formato';

export class ErroApi extends Error {
  readonly tipo: TipoErro;
  readonly status?: number;

  constructor(tipo: TipoErro, mensagem: string, status?: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.tipo = tipo;
    this.status = status;
  }

  /** Vale a pena cair para o cache? Rede, tempo e servidor fora (5xx) sim; 404 e 400 não. */
  get indisponivel(): boolean {
    return this.tipo === 'rede' || this.tipo === 'tempo' || (this.status ?? 0) >= 500;
  }
}

type Valor = string | number | boolean | null | undefined | (string | number)[];

/** Monta "?a=1&b=2", pulando vazios. Listas viram chaves repetidas (atendimento=A&atendimento=B). */
export function montarQuery(params: Record<string, Valor>): string {
  const partes: string[] = [];
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue;
    const lista = Array.isArray(valor) ? valor : [valor];
    for (const v of lista) partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(String(v))}`);
  }
  return partes.length ? `?${partes.join('&')}` : '';
}

async function lerProblema(resp: Response): Promise<string> {
  try {
    const corpo = await resp.json();
    if (corpo && typeof corpo === 'object') {
      if (typeof corpo.detail === 'string' && corpo.detail) return corpo.detail;
      if (typeof corpo.title === 'string' && corpo.title) return corpo.title;
    }
  } catch {
    // corpo vazio ou sem JSON: fica a mensagem padrão
  }
  return `O serviço respondeu com erro ${resp.status}.`;
}

export type OpcoesPedido = {
  metodo?: 'GET' | 'POST';
  corpo?: unknown;
  tempoLimiteMs?: number;
};

export async function pedirJson<T>(url: string, opcoes: OpcoesPedido = {}): Promise<T> {
  const { metodo = 'GET', corpo, tempoLimiteMs = 8000 } = opcoes;
  const controle = new AbortController();
  let estourou = false;
  const timer = setTimeout(() => {
    estourou = true;
    controle.abort();
  }, tempoLimiteMs);

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: metodo,
      headers: corpo !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw estourou
      ? new ErroApi('tempo', 'O serviço demorou demais para responder.')
      : new ErroApi('rede', 'Não foi possível falar com o serviço.');
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) throw new ErroApi('http', await lerProblema(resp), resp.status);
  if (resp.status === 204) return undefined as T;

  try {
    const texto = await resp.text();
    return (texto ? JSON.parse(texto) : undefined) as T;
  } catch {
    throw new ErroApi('formato', 'A resposta do serviço veio num formato inesperado.', resp.status);
  }
}
