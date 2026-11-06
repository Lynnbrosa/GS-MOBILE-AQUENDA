import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Botao, Campo, Chip, LinhaDeChips, Texto } from '@/componentes/base';
import { TelaDetalhe } from '@/componentes/Tela';
import { useSessao } from '@/estado/Sessao';
import { ANTECEDENCIAS, dataBrParaIso, isoParaBr, lerDataIso, lerHorario, validarConsulta, type Consulta } from '@/lib/agenda';
import { apagarConsulta, obterConsulta, salvarConsulta } from '@/lib/banco';
import { agendarConsulta, cancelarConsulta, pedirPermissao } from '@/lib/notificacoes';
import { espaco } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';

function dois(n: number) {
  return String(n).padStart(2, '0');
}

export default function FormConsulta() {
  const { cor } = useTema();
  const { discreto } = useSessao();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = id ? Number(id) : null;

  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [antecedencia, setAntecedencia] = useState(1440);
  const [anotacao, setAnotacao] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    obterConsulta(editando).then((c) => {
      if (!c) return;
      const d = new Date(c.dataHora);
      setTitulo(c.titulo);
      setLocal(c.local);
      setData(isoParaBr(`${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`));
      setHorario(`${dois(d.getHours())}:${dois(d.getMinutes())}`);
      setAntecedencia(c.antecedenciaMin);
      setAnotacao(c.anotacao);
    });
  }, [editando]);

  async function salvar() {
    const iso = dataBrParaIso(data);
    const h = lerHorario(horario);
    const problemas: string[] = [];
    if (!iso) problemas.push('Escreva a data assim: 14/11/2026.');
    if (!h) problemas.push('Escreva o horário assim: 14:30.');
    let c: Consulta | null = null;
    if (iso && h) {
      const d = lerDataIso(iso)!;
      const quando = new Date(d.a, d.m - 1, d.d, h.hora, h.minuto);
      c = { id: editando ?? undefined, titulo, local, dataHora: quando.toISOString(), antecedenciaMin: antecedencia, anotacao };
      problemas.push(...validarConsulta(c, new Date()));
    } else if (!titulo.trim()) problemas.push('Diga que consulta é (ex.: endocrinologista).');
    if (problemas.length || !c) {
      setErros(problemas);
      return;
    }
    setErros([]);
    setSalvando(true);
    try {
      if (antecedencia > 0) await pedirPermissao();
      const novoId = await salvarConsulta(c);
      await agendarConsulta({ ...c, id: novoId }, discreto);
      router.back();
    } catch {
      Alert.alert('Não deu para salvar', 'Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  function apagar() {
    if (!editando) return;
    Alert.alert('Apagar esta consulta?', 'Ela some deste celular.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await cancelarConsulta(editando);
          await apagarConsulta(editando);
          router.back();
        },
      },
    ]);
  }

  return (
    <TelaDetalhe secao="agenda">
      <Texto v="titulo">{editando ? 'Editar consulta' : 'Nova consulta'}</Texto>
      <Campo rotulo="Que consulta é" placeholder="Ex.: endocrinologista" value={titulo} onChangeText={setTitulo} maxLength={60} />
      <Campo rotulo="Onde (opcional)" placeholder="Ex.: UBS República" value={local} onChangeText={setLocal} maxLength={120} />
      <View style={{ flexDirection: 'row', gap: espaco.m }}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Dia" placeholder="14/11/2026" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Hora" placeholder="14:30" value={horario} onChangeText={setHorario} keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
      </View>
      <View style={{ gap: espaco.s }}>
        <Texto v="forte">Avisar</Texto>
        <LinhaDeChips>
          {ANTECEDENCIAS.map((a) => (
            <Chip key={a.min} titulo={a.texto} ativo={antecedencia === a.min} onPress={() => setAntecedencia(a.min)} />
          ))}
        </LinhaDeChips>
      </View>
      <Campo rotulo="Anotação (opcional)" ajuda="Ex.: levar exames. Fica só neste celular." value={anotacao} onChangeText={setAnotacao} multiline maxLength={300} />
      {erros.length ? (
        <View style={{ gap: 4 }} accessibilityLiveRegion="assertive">
          {erros.map((e) => (
            <Texto key={e} v="apoioForte" cor={cor.perigo}>
              {e}
            </Texto>
          ))}
        </View>
      ) : null}
      <Botao titulo="Salvar consulta" icone="checkmark" onPress={salvar} carregando={salvando} />
      {editando ? <Botao titulo="Apagar consulta" tipo="discreto" icone="trash-outline" onPress={apagar} /> : null}
    </TelaDetalhe>
  );
}
