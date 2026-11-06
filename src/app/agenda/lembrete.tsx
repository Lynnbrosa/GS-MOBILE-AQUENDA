import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { Botao, Campo, Chip, LinhaDeChips, Texto } from '@/componentes/base';
import { TelaDetalhe } from '@/componentes/Tela';
import { useSessao } from '@/estado/Sessao';
import {
  dataBrParaIso,
  DIAS_CURTOS,
  DIAS_LONGOS,
  hojeIso,
  isoParaBr,
  lerHorario,
  textoFrequencia,
  validarLembrete,
  type Frequencia,
  type Lembrete,
} from '@/lib/agenda';
import { apagarLembrete, obterLembrete, salvarLembrete } from '@/lib/banco';
import { agendarLembrete, cancelarLembrete, pedirPermissao } from '@/lib/notificacoes';
import { espaco } from '@/tema/tokens';
import { useSecao, useTema } from '@/tema/useTema';

const FREQUENCIAS: { valor: Frequencia; titulo: string }[] = [
  { valor: 'diaria', titulo: 'Todo dia' },
  { valor: 'semanal', titulo: 'Alguns dias da semana' },
  { valor: 'intervalo', titulo: 'A cada tantos dias' },
];

export default function FormLembrete() {
  const { cor } = useTema();
  const s = useSecao('agenda');
  const { discreto } = useSessao();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = id ? Number(id) : null;

  const [titulo, setTitulo] = useState('');
  const [anotacao, setAnotacao] = useState('');
  const [frequencia, setFrequencia] = useState<Frequencia>('diaria');
  const [horario, setHorario] = useState('20:00');
  const [dias, setDias] = useState<number[]>([]);
  const [intervalo, setIntervalo] = useState('14');
  const [inicio, setInicio] = useState(isoParaBr(hojeIso(new Date())));
  const [ativo, setAtivo] = useState(true);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    obterLembrete(editando).then((l) => {
      if (!l) return;
      setTitulo(l.titulo);
      setAnotacao(l.anotacao);
      setFrequencia(l.frequencia);
      setHorario(`${String(l.hora).padStart(2, '0')}:${String(l.minuto).padStart(2, '0')}`);
      setDias(l.diasSemana);
      setIntervalo(String(l.intervaloDias));
      setInicio(isoParaBr(l.inicio));
      setAtivo(l.ativo);
    });
  }, [editando]);

  function montar(): Lembrete | string[] {
    const h = lerHorario(horario);
    const ini = dataBrParaIso(inicio);
    const problemas: string[] = [];
    if (!h) problemas.push('Escreva o horário assim: 20:00.');
    if (!ini) problemas.push('Escreva a data assim: 14/11/2026.');
    const l: Lembrete = {
      id: editando ?? undefined,
      titulo,
      anotacao,
      frequencia,
      hora: h?.hora ?? 0,
      minuto: h?.minuto ?? 0,
      diasSemana: dias,
      intervaloDias: Number(intervalo) || 0,
      inicio: ini ?? '',
      ativo,
    };
    const todos = [...problemas, ...validarLembrete(l).filter((e) => !(ini === null && e.includes('início')))];
    return todos.length ? todos : l;
  }

  async function salvar() {
    const r = montar();
    if (Array.isArray(r)) {
      setErros(r);
      return;
    }
    setErros([]);
    setSalvando(true);
    try {
      const permitido = await pedirPermissao();
      const novoId = await salvarLembrete(r);
      await agendarLembrete({ ...r, id: novoId }, discreto);
      if (!permitido) {
        Alert.alert(
          'Lembrete salvo, mas sem aviso',
          'As notificações estão desligadas para este app. Ligue nas configurações do celular para receber o aviso.',
        );
      }
      router.back();
    } catch {
      Alert.alert('Não deu para salvar', 'Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  function apagar() {
    if (!editando) return;
    Alert.alert('Apagar este lembrete?', 'Os registros de "feito" dele também somem deste celular.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await cancelarLembrete(editando);
          await apagarLembrete(editando);
          router.back();
        },
      },
    ]);
  }

  const previa = montar();

  return (
    <TelaDetalhe secao="agenda">
      <Texto v="titulo">{editando ? 'Editar lembrete' : 'Novo lembrete'}</Texto>
      <Campo
        rotulo="Nome do lembrete"
        ajuda={'Pode ser algo só seu, como "meu remédio". No modo discreto, a notificação só diz "Lembrete".'}
        value={titulo}
        onChangeText={setTitulo}
        maxLength={60}
      />

      <View style={{ gap: espaco.s }}>
        <Texto v="forte">Repetir</Texto>
        <LinhaDeChips>
          {FREQUENCIAS.map((f) => (
            <Chip key={f.valor} titulo={f.titulo} ativo={frequencia === f.valor} onPress={() => setFrequencia(f.valor)} />
          ))}
        </LinhaDeChips>
      </View>

      {frequencia === 'semanal' ? (
        <View style={{ gap: espaco.s }}>
          <Texto v="forte">Em quais dias</Texto>
          <LinhaDeChips>
            {DIAS_CURTOS.map((d, i) => (
              <View key={d} accessibilityLabel={DIAS_LONGOS[i]}>
                <Chip
                  titulo={d}
                  ativo={dias.includes(i)}
                  onPress={() => setDias((atual) => (atual.includes(i) ? atual.filter((x) => x !== i) : [...atual, i]))}
                />
              </View>
            ))}
          </LinhaDeChips>
        </View>
      ) : null}

      {frequencia === 'intervalo' ? (
        <Campo
          rotulo="A cada quantos dias"
          ajuda="Use o intervalo da sua prescrição."
          value={intervalo}
          onChangeText={(t) => setIntervalo(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={2}
        />
      ) : null}

      <Campo
        rotulo="Horário"
        ajuda="Formato 24 horas, por exemplo 20:00."
        value={horario}
        onChangeText={setHorario}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
      <Campo
        rotulo={frequencia === 'intervalo' ? 'Dia da próxima aplicação' : 'Começa em'}
        ajuda="Dia/mês/ano."
        value={inicio}
        onChangeText={setInicio}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <Campo
        rotulo="Anotação (opcional)"
        ajuda="Só para você. Fica neste celular."
        value={anotacao}
        onChangeText={setAnotacao}
        multiline
        maxLength={300}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.m, minHeight: 48 }}>
        <Texto v="forte" style={{ flex: 1 }}>
          Avisar no horário
        </Texto>
        <Switch
          accessibilityLabel="Avisar no horário"
          value={ativo}
          onValueChange={setAtivo}
          trackColor={{ true: s.acao, false: cor.linha }}
          thumbColor={cor.superficie}
        />
      </View>

      {!Array.isArray(previa) ? (
        <Texto suave accessibilityLiveRegion="polite">
          {previa.ativo ? `${textoFrequencia(previa)}.` : 'Pausado: fica salvo, mas sem aviso.'}
        </Texto>
      ) : null}

      {erros.length ? (
        <View style={{ gap: 4 }} accessibilityLiveRegion="assertive">
          {erros.map((e) => (
            <Texto key={e} v="apoioForte" cor={cor.perigo}>
              {e}
            </Texto>
          ))}
        </View>
      ) : null}

      <Botao titulo="Salvar lembrete" icone="checkmark" onPress={salvar} carregando={salvando} />
      {editando ? <Botao titulo="Apagar lembrete" tipo="discreto" icone="trash-outline" onPress={apagar} /> : null}
      <Texto v="apoio" suave>
        O Aquenda não sugere dose nem horário. Ele só lembra no horário que você escolheu.
      </Texto>
    </TelaDetalhe>
  );
}
