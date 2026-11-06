// Notificações locais da agenda. São agendadas no próprio aparelho: nenhum servidor
// sabe que existe um lembrete, nem o horário dele.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  avisoDaConsulta,
  conteudoConsulta,
  conteudoLembrete,
  planoDeNotificacoes,
  type Consulta,
  type Lembrete,
  type PlanoNotificacao,
} from './agenda';

const CANAL = 'agenda';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepararCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // Nome neutro: aparece nas configurações do Android.
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Lembretes',
    importance: Notifications.AndroidImportance.HIGH,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

export async function pedirPermissao(): Promise<boolean> {
  await prepararCanal();
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

export function gatilho(p: PlanoNotificacao): Notifications.NotificationTriggerInput {
  const canal = Platform.OS === 'android' ? { channelId: CANAL } : {};
  switch (p.tipo) {
    case 'diaria':
      return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: p.hora, minute: p.minuto, ...canal };
    case 'semanal':
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: p.diaSemana,
        hour: p.hora,
        minute: p.minuto,
        ...canal,
      };
    case 'data':
      return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.data, ...canal };
  }
}

async function cancelarComPrefixo(prefixo: string): Promise<void> {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    agendadas
      .filter((n) => n.identifier.startsWith(prefixo))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function agendarLembrete(l: Lembrete, discreto: boolean, agora = new Date()): Promise<number> {
  if (!l.id) return 0;
  await cancelarComPrefixo(`lembrete-${l.id}-`);
  const plano = planoDeNotificacoes(l, agora);
  const conteudo = conteudoLembrete(l, discreto);
  for (let i = 0; i < plano.length; i++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `lembrete-${l.id}-${i}`,
      content: { title: conteudo.titulo, body: conteudo.corpo, data: { rota: '/agenda' } },
      trigger: gatilho(plano[i]),
    });
  }
  return plano.length;
}

export async function cancelarLembrete(id: number): Promise<void> {
  await cancelarComPrefixo(`lembrete-${id}-`);
}

export async function agendarConsulta(c: Consulta, discreto: boolean, agora = new Date()): Promise<boolean> {
  if (!c.id) return false;
  await cancelarComPrefixo(`consulta-${c.id}`);
  const quando = avisoDaConsulta(c, agora);
  if (!quando) return false;
  const conteudo = conteudoConsulta(c, discreto);
  await Notifications.scheduleNotificationAsync({
    identifier: `consulta-${c.id}`,
    content: { title: conteudo.titulo, body: conteudo.corpo, data: { rota: '/agenda' } },
    trigger: gatilho({ tipo: 'data', data: quando }),
  });
  return true;
}

export async function cancelarConsulta(id: number): Promise<void> {
  await cancelarComPrefixo(`consulta-${id}`);
}

/** Refaz tudo: ao abrir o app (renova as datas dos lembretes por intervalo) e ao trocar o modo discreto. */
export async function reagendarTudo(lembretes: Lembrete[], consultas: Consulta[], discreto: boolean): Promise<void> {
  const agora = new Date();
  for (const l of lembretes) await agendarLembrete(l, discreto, agora);
  for (const c of consultas) await agendarConsulta(c, discreto, agora);
}

export async function cancelarTodas(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
