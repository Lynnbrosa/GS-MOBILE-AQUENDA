// Salas de conversa da API C# (/api/chat). O token vai no cabeçalho X-Token-Chat.
// As mensagens novas chegam em tempo real pelo SignalR (src/lib/tempoReal.ts).
import { urlBase } from '../config';
import { montarQuery, pedirJson } from './http';
import type { Entrada, Mensagem, ResultadoDenuncia, Sala } from './tipos';

export const CABECALHO_TOKEN = 'X-Token-Chat';

const base = () => `${urlBase('csharp')}/api/chat`;

export function urlMensagens(salaId: number, antesDe?: number | null, limite?: number): string {
  return `${base()}/salas/${salaId}/mensagens${montarQuery({ antesDe: antesDe ?? undefined, limite })}`;
}

export function urlHub(): string {
  return `${urlBase('csharp')}/hubs/chat`;
}

export const apiChat = {
  regras: () => pedirJson<string[]>(`${base()}/regras`),

  salas: () => pedirJson<Sala[]>(`${base()}/salas`),

  /** As últimas mensagens visíveis (ou as anteriores a `antesDe`), da mais antiga para a mais nova.
   * Só quem entrou nas salas lê: a API pede o token, porque as conversas falam de saúde e transição. */
  mensagens: (token: string, salaId: number, antesDe?: number | null) =>
    pedirJson<Mensagem[]>(urlMensagens(salaId, antesDe), { cabecalhos: { [CABECALHO_TOKEN]: token } }),

  entrar: (apelido: string) =>
    pedirJson<Entrada>(`${base()}/participantes`, {
      metodo: 'POST',
      corpo: { apelido: apelido.trim(), aceitoRegras: true, tenhoMaisDe18: true },
    }),

  enviar: (token: string, salaId: number, texto: string) =>
    pedirJson<Mensagem>(`${base()}/salas/${salaId}/mensagens`, {
      metodo: 'POST',
      corpo: { texto: texto.trim() },
      cabecalhos: { [CABECALHO_TOKEN]: token },
    }),

  /** Denúncia em 1 toque. Com 3 denúncias a mensagem some até a ONG revisar. */
  denunciar: (token: string, mensagemId: number) =>
    pedirJson<ResultadoDenuncia>(`${base()}/mensagens/${mensagemId}/denuncias`, {
      metodo: 'POST',
      cabecalhos: { [CABECALHO_TOKEN]: token },
    }),
};
