// Tempo real das salas pelo SignalR da API C# (/hubs/chat).
// O app entra no grupo da sala e recebe "mensagem", "mensagemRemovida" e "mensagemRestaurada".
// Enviar continua sendo pelo POST, que passa por todas as validações da API.
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import { urlHub } from './api/chat';
import type { Mensagem } from './api/tipos';

export type EventosSala = {
  onMensagem: (m: Mensagem) => void;
  onRemovida: (mensagemId: number) => void;
  onRestaurada: (m: Mensagem) => void;
  /** true quando o tempo real está ligado; false quando caiu (o app passa a consultar de tempos em tempos). */
  onConectado: (ligado: boolean) => void;
};

export type ConexaoSala = { parar: () => Promise<void> };

export function conectarSala(salaId: number, ev: EventosSala): ConexaoSala {
  const conexao: HubConnection = new HubConnectionBuilder()
    .withUrl(urlHub())
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(LogLevel.None)
    .build();

  conexao.on('mensagem', (m: Mensagem) => m.salaId === salaId && ev.onMensagem(m));
  conexao.on('mensagemRestaurada', (m: Mensagem) => m.salaId === salaId && ev.onRestaurada(m));
  conexao.on('mensagemRemovida', (r: { salaId: number; mensagemId: number }) => r.salaId === salaId && ev.onRemovida(r.mensagemId));
  conexao.onreconnecting(() => ev.onConectado(false));
  conexao.onreconnected(async () => {
    await conexao.invoke('EntrarNaSala', salaId).catch(() => undefined);
    ev.onConectado(true);
  });
  conexao.onclose(() => ev.onConectado(false));

  let parado = false;
  (async () => {
    try {
      await conexao.start();
      if (parado) return;
      await conexao.invoke('EntrarNaSala', salaId);
      ev.onConectado(true);
    } catch {
      ev.onConectado(false);
    }
  })();

  return {
    parar: async () => {
      parado = true;
      if (conexao.state === HubConnectionState.Connected) await conexao.invoke('SairDaSala', salaId).catch(() => undefined);
      await conexao.stop().catch(() => undefined);
    },
  };
}
