// Monta respostas falsas a partir das gravadas em __tests__/respostas.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function gravada(nome: string): string {
  return readFileSync(join(__dirname, 'respostas', nome), 'utf8');
}

export function resposta(status: number, corpo: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(corpo),
    text: async () => corpo,
  };
}

/** Faz o fetch responder pelo arquivo gravado e guarda as URLs pedidas. */
export function prepararFetch(rotas: Record<string, [number, string]>) {
  const pedidas: { url: string; init?: RequestInit }[] = [];
  (globalThis as { fetch: unknown }).fetch = jest.fn(async (url: string, init?: RequestInit) => {
    pedidas.push({ url, init });
    const chave = Object.keys(rotas).find((k) => url.includes(k));
    if (!chave) throw new Error(`sem resposta gravada para ${url}`);
    const [status, arquivo] = rotas[chave];
    return resposta(status, arquivo === '' ? '' : gravada(arquivo));
  });
  return pedidas;
}

export function redeFora() {
  (globalThis as { fetch: unknown }).fetch = jest.fn(async () => {
    throw new TypeError('Network request failed');
  });
}
