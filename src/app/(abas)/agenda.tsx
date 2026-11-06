import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Botao, Cartao, ComoEntrar, Secao, Selo, SemNada, Texto } from '@/componentes/base';
import { Tela } from '@/componentes/Tela';
import { useSessao } from '@/estado/Sessao';
import { proximaOcorrencia, textoFrequencia, type Consulta, type Lembrete } from '@/lib/agenda';
import { listarConsultas, listarLembretes, marcarFeito, ultimosRegistros } from '@/lib/banco';
import { dataHoraCurta, haQuanto, quandoFuturo } from '@/lib/formato';
import { espaco } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';

type ItemLembrete = { l: Lembrete; proxima: Date | null; ultimo: string | null };

export default function Agenda() {
  const { cor } = useTema();
  const { discreto } = useSessao();
  const [lembretes, setLembretes] = useState<ItemLembrete[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [agora, setAgora] = useState(new Date());

  const carregar = useCallback(async () => {
    const n = new Date();
    const [ls, cs] = await Promise.all([listarLembretes(), listarConsultas()]);
    const itens = await Promise.all(
      ls.map(async (l) => ({ l, proxima: proximaOcorrencia(l, n), ultimo: (await ultimosRegistros(l.id!, 1))[0] ?? null })),
    );
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

  const proximo = useMemo(() => {
    const ativos = lembretes.filter((i) => i.proxima).sort((a, b) => a.proxima!.getTime() - b.proxima!.getTime());
    return ativos[0] ?? null;
  }, [lembretes]);

  async function feito(i: ItemLembrete) {
    await marcarFeito(i.l.id!);
    await carregar();
    Alert.alert('Anotado', 'Ficou registrado neste celular.');
  }

  return (
    <Tela titulo={discreto ? 'Lembretes' : 'Minha agenda'} apoio="Lembretes de hormônio e consultas no horário que você escolher.">
      <ComoEntrar
        titulo="Fica só neste celular"
        texto="Nada da agenda vai para a internet. O app não sugere dose nem horário: siga o que combinou com quem te acompanha."
      />

      {proximo ? (
        <Cartao style={{ backgroundColor: cor.azulSuave, borderColor: cor.azulSuave }}>
          <Texto v="apoioForte" cor={cor.azul}>
            Próximo lembrete
          </Texto>
          <Texto v="subtitulo">{proximo.l.titulo}</Texto>
          <Texto>{quandoFuturo(proximo.proxima!, agora)}</Texto>
        </Cartao>
      ) : null}

      <Secao titulo="Lembretes">
        {carregado && lembretes.length === 0 ? (
          <SemNada
            icone="alarm-outline"
            titulo="Nenhum lembrete ainda"
            texto="Crie um para o horário do seu hormônio ou de qualquer remédio. Pode ser todo dia, alguns dias da semana ou a cada tantos dias."
          />
        ) : (
          lembretes.map((i) => (
            <Cartao
              key={i.l.id}
              onPress={() => router.push({ pathname: '/agenda/lembrete', params: { id: String(i.l.id) } })}
              rotulo={`${i.l.titulo}. ${textoFrequencia(i.l)}.${i.l.ativo ? '' : ' Pausado.'}`}
              dica="Abre para editar ou apagar"
            >
              <Texto v="forte">{i.l.titulo}</Texto>
              <Texto v="apoio" suave>
                {textoFrequencia(i.l)}
              </Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
                {i.l.ativo ? (
                  i.proxima ? <Selo tom="azul" icone="alarm-outline" texto={quandoFuturo(i.proxima, agora)} /> : null
                ) : (
                  <Selo texto="Pausado" />
                )}
                {i.ultimo ? <Selo tom="ok" icone="checkmark" texto={`Feito ${haQuanto(i.ultimo, agora)}`} /> : null}
              </View>
              {i.l.ativo ? (
                <Botao
                  titulo="Marcar como feito"
                  icone="checkmark-circle-outline"
                  tipo="secundario"
                  dica="Registra agora neste celular"
                  onPress={() => feito(i)}
                />
              ) : null}
            </Cartao>
          ))
        )}
        <Botao titulo="Novo lembrete" icone="add" onPress={() => router.push('/agenda/lembrete')} />
      </Secao>

      <Secao titulo="Consultas">
        {carregado && consultas.length === 0 ? (
          <SemNada
            icone="calendar-outline"
            titulo="Nenhuma consulta marcada"
            texto="Anote a próxima consulta e o app avisa antes, no tempo que você escolher."
            acao={{ titulo: 'Onde começar no SUS', onPress: () => router.navigate('/saude') }}
          />
        ) : (
          consultas.map((c) => (
            <Cartao
              key={c.id}
              onPress={() => router.push({ pathname: '/agenda/consulta', params: { id: String(c.id) } })}
              rotulo={`${c.titulo}. ${dataHoraCurta(new Date(c.dataHora))}. ${c.local}`}
              dica="Abre para editar ou apagar"
            >
              <Texto v="apoioForte" suave>
                {quandoFuturo(new Date(c.dataHora), agora)}
              </Texto>
              <Texto v="forte">{c.titulo}</Texto>
              {c.local ? (
                <Texto v="apoio" suave>
                  {c.local}
                </Texto>
              ) : null}
            </Cartao>
          ))
        )}
        <Botao titulo="Nova consulta" icone="add" tipo="secundario" onPress={() => router.push('/agenda/consulta')} />
      </Secao>
    </Tela>
  );
}
