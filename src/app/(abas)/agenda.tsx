import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Botao, Cartao, Linha, Secao, Texto } from '@/componentes/base';
import { Tela } from '@/componentes/Tela';
import { horaTexto, proximaOcorrencia, textoFrequencia, type Consulta, type Lembrete } from '@/lib/agenda';
import { listarConsultas, listarLembretes, marcarFeito, ultimosRegistros } from '@/lib/banco';
import { dataHoraCurta, haQuanto, quandoFuturo } from '@/lib/formato';
import { ALVO_MINIMO, espaco } from '@/tema/tokens';
import { useSecao, useTema } from '@/tema/useTema';

type ItemLembrete = { l: Lembrete; proxima: Date | null; ultimo: string | null };

function feitoHoje(iso: string | null, agora: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.toDateString() === agora.toDateString();
}

function BotaoFeito({ feito, onPress, nome }: { feito: boolean; onPress: () => void; nome: string }) {
  const { cor } = useTema();
  const s = useSecao('agenda');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={feito ? `${nome}: feito hoje` : `Marcar ${nome} como feito`}
      accessibilityState={{ checked: feito }}
      onPress={onPress}
      disabled={feito}
      style={{ width: ALVO_MINIMO, height: ALVO_MINIMO, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: feito ? s.acao : cor.superficie }}
    >
      <Ionicons name="checkmark" size={26} color={feito ? s.sobreAcao : cor.tintaSuave} />
    </Pressable>
  );
}

export default function Agenda() {
  const { cor } = useTema();
  const s = useSecao('agenda');
  const [lembretes, setLembretes] = useState<ItemLembrete[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [agora, setAgora] = useState(new Date());

  const carregar = useCallback(async () => {
    const n = new Date();
    const [ls, cs] = await Promise.all([listarLembretes(), listarConsultas()]);
    const itens = await Promise.all(ls.map(async (l) => ({ l, proxima: proximaOcorrencia(l, n), ultimo: (await ultimosRegistros(l.id!, 1))[0] ?? null })));
    setLembretes(itens);
    setConsultas(cs.filter((c) => new Date(c.dataHora).getTime() > n.getTime() - 2 * 3600_000));
    setAgora(n);
    setCarregado(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar().catch(() => setCarregado(true));
    }, [carregar]),
  );

  const proximo = useMemo(
    () => lembretes.filter((i) => i.proxima).sort((a, b) => a.proxima!.getTime() - b.proxima!.getTime())[0] ?? null,
    [lembretes],
  );

  return (
    <Tela secao="agenda" titulo="Agenda" apoio="Fica só neste celular.">
      {proximo ? (
        <Cartao tom="secao" style={{ alignItems: 'flex-start' }}>
          <Texto v="apoioForte" cor={s.sobreSuave}>
            Próximo
          </Texto>
          <Texto v="enorme" cor={s.sobreSuave} accessibilityLabel={`Próximo lembrete ${quandoFuturo(proximo.proxima!, agora)}`}>
            {horaTexto(proximo.proxima!.getHours(), proximo.proxima!.getMinutes())}
          </Texto>
          <Texto v="forte" cor={s.sobreSuave}>
            {proximo.l.titulo}, {quandoFuturo(proximo.proxima!, agora).replace(/ às .*/, '')}
          </Texto>
        </Cartao>
      ) : carregado && lembretes.length === 0 ? (
        <Cartao tom="secao">
          <Texto v="subtitulo" cor={s.sobreSuave}>
            Seu horário, do seu jeito
          </Texto>
          <Texto cor={s.sobreSuave}>O app lembra na hora que você escolher e nunca sugere dose.</Texto>
        </Cartao>
      ) : null}

      <Secao titulo="Lembretes" direita={<Botao titulo="Novo" icone="add" tipo="secundario" onPress={() => router.push('/agenda/lembrete')} />}>
        {lembretes.map((i) => (
          <View key={i.l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.s }}>
            <View style={{ flex: 1 }}>
              <Linha
                titulo={i.l.titulo}
                apoio={i.l.ativo ? textoFrequencia(i.l) : 'Pausado'}
                rotulo={`${i.l.titulo}. ${textoFrequencia(i.l)}.${i.ultimo ? ` Último feito ${haQuanto(i.ultimo, agora)}.` : ''}`}
                dica="Abre para editar"
                onPress={() => router.push({ pathname: '/agenda/lembrete', params: { id: String(i.l.id) } })}
              />
            </View>
            {i.l.ativo ? (
              <BotaoFeito
                nome={i.l.titulo}
                feito={feitoHoje(i.ultimo, agora)}
                onPress={async () => {
                  await marcarFeito(i.l.id!);
                  await carregar();
                }}
              />
            ) : null}
          </View>
        ))}
      </Secao>

      <Secao titulo="Consultas" direita={<Botao titulo="Nova" icone="add" tipo="secundario" onPress={() => router.push('/agenda/consulta')} />}>
        {carregado && consultas.length === 0 ? (
          <Texto suave>Nenhuma marcada.</Texto>
        ) : (
          consultas.map((c) => (
            <Linha
              key={c.id}
              titulo={c.titulo}
              apoio={[dataHoraCurta(new Date(c.dataHora)), c.local].filter(Boolean).join(', ')}
              onPress={() => router.push({ pathname: '/agenda/consulta', params: { id: String(c.id) } })}
            />
          ))
        )}
      </Secao>
      <View style={{ height: 1, backgroundColor: cor.papel }} />
    </Tela>
  );
}
