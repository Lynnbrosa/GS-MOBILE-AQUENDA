// De onde vêm os endereços das duas APIs, em ordem:
// 1. o que a pessoa salvou em Ajustes (útil no celular físico);
// 2. EXPO_PUBLIC_API_CSHARP_URL / EXPO_PUBLIC_API_SOA_URL;
// 3. no emulador Android, 10.0.2.2 (o "localhost" do computador visto de dentro do emulador);
// 4. no celular físico em desenvolvimento, o IP do computador que serve o Metro;
// 5. localhost.

export type NomeApi = 'csharp' | 'soa';

export const PORTAS: Record<NomeApi, number> = { csharp: 5000, soa: 8000 };

export type Ambiente = {
  env: Partial<Record<NomeApi, string | undefined>>;
  hostDoMetro?: string | null;
  plataforma: string;
  ehEmulador: boolean;
};

export function limparUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function urlValida(url: string): boolean {
  return /^https?:\/\/[^\s/]+(:\d+)?(\/.*)?$/i.test(url.trim());
}

/** "192.168.0.12:8081" -> "192.168.0.12". Ignora localhost, que no celular não leva ao computador. */
export function ipDoMetro(hostUri?: string | null): string | null {
  if (!hostUri) return null;
  const host = hostUri.split('/')[0].split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

export function urlPadrao(api: NomeApi, amb: Ambiente): string {
  const doEnv = amb.env[api];
  if (doEnv && urlValida(doEnv)) return limparUrl(doEnv);
  const porta = PORTAS[api];
  if (amb.plataforma === 'android' && amb.ehEmulador) return `http://10.0.2.2:${porta}`;
  const ip = ipDoMetro(amb.hostDoMetro);
  if (ip) return `http://${ip}:${porta}`;
  return `http://localhost:${porta}`;
}

// Estado em memória: o padrão calculado na subida e o que veio de Ajustes.
const padroes: Record<NomeApi, string> = {
  csharp: `http://localhost:${PORTAS.csharp}`,
  soa: `http://localhost:${PORTAS.soa}`,
};
const personalizadas: Partial<Record<NomeApi, string>> = {};

export function configurarPadroes(amb: Ambiente): void {
  padroes.csharp = urlPadrao('csharp', amb);
  padroes.soa = urlPadrao('soa', amb);
}

export function definirUrlPersonalizada(api: NomeApi, url: string | null): void {
  if (url && urlValida(url)) personalizadas[api] = limparUrl(url);
  else delete personalizadas[api];
}

export function urlBase(api: NomeApi): string {
  return personalizadas[api] ?? padroes[api];
}

export function urlPadraoAtual(api: NomeApi): string {
  return padroes[api];
}
