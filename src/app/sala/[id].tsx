import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvisoCache, Carregando, Selo, Texto } from '@/componentes/base';
import { Folha, type OpcaoFolha } from '@/componentes/Folha';
import { apiChat } from '@/lib/api/chat';
import { ErroApi } from '@/lib/api/http';
import type { Mensagem } from '@/lib/api/tipos';
import { armazemSqlite, bloquear, listarBloqueados } from '@/lib/banco';
import { lerDoCache } from '@/lib/cache';
import { ehMinha, horaDaMensagem, mesclar, proximoIntervalo, remover, semBloqueados, temContato } from '@/lib/conversa';
import { haQuanto } from '@/lib/formato';
import { esquecerParticipante, lerParticipante, type EuNasSalas } from '@/lib/participante';
import { conectarSala } from '@/lib/tempoReal';
import { ALVO_MINIMO, espaco, fontes, tipo } from '@/tema/tokens';
import { ContextoSecao, useSecao, useTema } from '@/tema/useTema';

function Bolha({ m, minha, onSegurar, agora }: { m: Mensagem; minha: boolean; onSegurar: () => void; agora: Date }) {
  const { cor } = useTema();
  const s = useSecao('rodas');
  const hora = horaDaMensagem(m.enviadaEm, agora);
  return (
    <Pressable
      onLongPress={minha ? undefined : onSegurar}
      delayLongPress={350}
      accessibilityRole={minha ? 'text' : 'button'}
      accessibilityLabel={`${minha ? 'Você' : m.apelido}, ${hora}: ${m.texto}`}
      accessibilityHint={minha ? undefined : 'Toque duas vezes e segure para denunciar ou bloquear'}
      accessibilityActions={minha ? undefined : [{ name: 'longpress', label: 'Denunciar ou bloquear' }]}
      onAccessibilityAction={minha ? undefined : onSegurar}
      style={[est.linhaBolha, minha ? { justifyContent: 'flex-end' } : null]}
    >
      <View style={[est.bolha, minha ? { backgroundColor: s.acao, borderBottomRightRadius: 6 } : { backgroundColor: cor.superficie, borderBottomLeftRadius: 6 }]}>
        {!minha ? (
          <Texto v="apoioForte" cor={s.sobreSuave}>
            {m.apelido}
          </Texto>
        ) : null}
        <Texto cor={minha ? s.sobreAcao : cor.tinta}>{m.texto}</Texto>
        <Texto v="apoio" cor={minha ? s.sobreAcao : cor.tintaSuave} style={{ fontSize: 12, lineHeight: 16, alignSelf: 'flex-end', opacity: 0.85 }}>
          {hora}
        </Texto>
      </View>
    </Pressable>
  );
}

export default function SalaConversa() {
  const { cor } = useTema();
  const s = useSecao('rodas');
  const insets = useSafeAreaInsets();
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const salaId = Number(id);
  const chaveCache = `sala:${salaId}`;

  const [eu, setEu] = useState<EuNasSalas | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [bloqueados, setBloqueados] = useState<Set<string>>(new Set());
  const [enviadas, setEnviadas] = useState<Set<number>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [aoVivo, setAoVivo] = useState(false);
  const [semConexaoDesde, setSemConexaoDesde] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [folha, setFolha] = useState<{ titulo: string; opcoes: OpcaoFolha[] } | null>(null);
  const lista = useRef<FlatList<Mensagem>>(null);
  const aoVivoRef = useRef(false);
  aoVivoRef.current = aoVivo;
  const agora = new Date();

  const guardar = useCallback(
    (ms: Mensagem[]) => armazemSqlite.gravar(chaveCache, JSON.stringify(ms.slice(-80)), new Date().toISOString()).catch(() => undefined),
    [chaveCache],
  );

  useEffect(() => {
    lerParticipante().then((p) => {
      if (!p) router.replace({ pathname: '/salas/entrar', params: { sala: String(salaId), nome: nome ?? '' } });
      setEu(p);
    });
    listarBloqueados().then((b) => setBloqueados(new Set(b))).catch(() => undefined);
    lerDoCache<Mensagem[]>(chaveCache, armazemSqlite).then((g) => {
      if (g) setMensagens((atuais) => (atuais.length ? atuais : g.dados));
    });
  }, [salaId, nome, chaveCache]);

  /** Busca as últimas 50 e junta com o que já está na tela. */
  const buscar = useCallback(async (): Promise<number> => {
    try {
      const recentes = await apiChat.mensagens(salaId);
      let novas = 0;
      setMensagens((atuais) => {
        const conhecidas = new Set(atuais.map((m) => m.id));
        novas = recentes.filter((m) => !conhecidas.has(m.id)).length;
        // o que sumiu das recentes foi ocultado pela moderação
        const ids = new Set(recentes.map((m) => m.id));
        const menor = recentes.length ? recentes[0].id : Infinity;
        const juntas = mesclar(atuais.filter((m) => m.id < menor || ids.has(m.id)), recentes);
        guardar(juntas);
        return juntas;
      });
      setSemConexaoDesde(null);
      return novas;
    } catch (e) {
      if (e instanceof ErroApi && e.indisponivel) {
        const g = await armazemSqlite.ler(chaveCache).catch(() => null);
        setSemConexaoDesde((atual) => atual ?? g?.guardadoEm ?? new Date().toISOString());
      }
      return 0;
    } finally {
      setCarregando(false);
    }
  }, [salaId, chaveCache, guardar]);

  // tempo real pelo SignalR; se cair, consulta de tempos em tempos até voltar
  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      let quietas = 0;
      let timer: ReturnType<typeof setTimeout>;
      buscar();
      const conexao = conectarSala(salaId, {
        onMensagem: (m) =>
          setMensagens((atuais) => {
            const juntas = mesclar(atuais, [m]);
            guardar(juntas);
            return juntas;
          }),
        onRestaurada: (m) => setMensagens((atuais) => mesclar(atuais, [m])),
        onRemovida: (mid) => setMensagens((atuais) => remover(atuais, mid)),
        onConectado: (ligado) => {
          setAoVivo(ligado);
          if (ligado) buscar(); // pega o que chegou enquanto estava fora
        },
      });
      const reserva = async () => {
        if (!vivo) return;
        if (!aoVivoRef.current) {
          const n = await buscar();
          quietas = n > 0 ? 0 : quietas + 1;
        }
        timer = setTimeout(reserva, proximoIntervalo(quietas));
      };
      timer = setTimeout(reserva, proximoIntervalo(0));
      return () => {
        vivo = false;
        clearTimeout(timer);
        conexao.parar();
      };
    }, [buscar, salaId, guardar]),
  );

  const visiveis = useMemo(() => semBloqueados(mensagens, bloqueados), [mensagens, bloqueados]);

  async function enviar() {
    if (!eu || !texto.trim()) return;
    if (temContato(texto)) {
      setErro('Para a segurança de todo mundo, não dá para mandar link, telefone, e-mail ou CPF.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const m = await apiChat.enviar(eu.token, salaId, texto);
      setEnviadas((e) => new Set(e).add(m.id));
      setMensagens((atuais) => mesclar(atuais, [m]));
      setTexto('');
      setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) {
        await esquecerParticipante();
        router.replace({ pathname: '/salas/entrar', params: { sala: String(salaId), nome: nome ?? '' } });
        return;
      }
      setErro(e instanceof ErroApi ? (e.indisponivel ? 'Sem conexão. A mensagem não foi enviada.' : e.message) : 'Não deu para enviar.');
    } finally {
      setEnviando(false);
    }
  }

  function opcoesDe(m: Mensagem) {
    setFolha({
      titulo: m.apelido,
      opcoes: [
        {
          texto: 'Denunciar mensagem',
          icone: 'flag-outline',
          perigo: true,
          onPress: async () => {
            if (!eu) return;
            try {
              const r = await apiChat.denunciar(eu.token, m.id);
              if (r.oculta) setMensagens((atuais) => remover(atuais, m.id));
              Alert.alert('Denúncia enviada', 'Obrigado. A ONG que modera vai olhar. Ninguém fica sabendo que foi você.');
            } catch (e) {
              Alert.alert('Não deu para denunciar', e instanceof ErroApi ? e.message : 'Tente de novo.');
            }
          },
        },
        {
          texto: `Bloquear ${m.apelido}`,
          icone: 'eye-off-outline',
          onPress: async () => {
            await bloquear(m.apelido);
            setBloqueados((b) => new Set(b).add(m.apelido));
          },
        },
      ],
    });
  }

  return (
    <ContextoSecao.Provider value="rodas">
      <Stack.Screen options={{ title: nome || 'Sala' }} />
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cor.papel }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {semConexaoDesde ? (
          <View style={{ padding: espaco.s }}>
            <AvisoCache desde={haQuanto(semConexaoDesde, agora)} onTentar={buscar} />
          </View>
        ) : null}
        {carregando && visiveis.length === 0 ? (
          <Carregando />
        ) : (
          <FlatList
            ref={lista}
            data={visiveis}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ padding: espaco.l, gap: espaco.s, flexGrow: 1 }}
            onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              <View style={{ alignItems: 'center', gap: 4, marginBottom: espaco.m }}>
                <Selo tom="secao" icone={aoVivo ? 'radio-outline' : 'shield-checkmark-outline'} texto={aoVivo ? 'Ao vivo, 18+, com moderação' : 'Sala 18+ com moderação'} />
                <Texto v="apoio" suave style={{ textAlign: 'center' }}>
                  Segure uma mensagem para denunciar ou bloquear.
                </Texto>
              </View>
            }
            ListEmptyComponent={
              <Texto suave style={{ textAlign: 'center', marginTop: espaco.xl }}>
                Ninguém falou ainda. Que tal começar?
              </Texto>
            }
            renderItem={({ item }) => <Bolha m={item} minha={ehMinha(item, eu?.apelido, enviadas)} agora={agora} onSegurar={() => opcoesDe(item)} />}
          />
        )}
        {erro ? (
          <Texto v="apoioForte" cor={cor.perigo} style={{ paddingHorizontal: espaco.l }} accessibilityLiveRegion="assertive">
            {erro}
          </Texto>
        ) : null}
        <View style={[est.barra, { paddingBottom: insets.bottom + espaco.s, borderTopColor: cor.linha, backgroundColor: cor.papel }]}>
          <TextInput
            value={texto}
            onChangeText={(t) => {
              setTexto(t);
              if (erro) setErro(null);
            }}
            placeholder="Escreva com cuidado"
            placeholderTextColor={cor.tintaSuave}
            accessibilityLabel="Mensagem"
            multiline
            maxLength={500}
            maxFontSizeMultiplier={1.8}
            style={[est.entrada, { backgroundColor: cor.superficie, color: cor.tinta }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            accessibilityState={{ disabled: !texto.trim() || enviando }}
            disabled={!texto.trim() || enviando}
            onPress={enviar}
            style={[est.enviar, { backgroundColor: texto.trim() ? s.acao : cor.superficieForte }]}
          >
            <Ionicons name="arrow-up" size={24} color={texto.trim() ? s.sobreAcao : cor.tintaSuave} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <Folha visivel={!!folha} titulo={folha?.titulo} opcoes={folha?.opcoes ?? []} onFechar={() => setFolha(null)} />
    </ContextoSecao.Provider>
  );
}

const est = StyleSheet.create({
  linhaBolha: { flexDirection: 'row' },
  bolha: { maxWidth: '82%', borderRadius: 20, paddingHorizontal: espaco.m + 2, paddingVertical: espaco.s + 2, gap: 2 },
  barra: { flexDirection: 'row', alignItems: 'flex-end', gap: espaco.s, paddingHorizontal: espaco.m, paddingTop: espaco.s, borderTopWidth: StyleSheet.hairlineWidth },
  entrada: { flex: 1, minHeight: ALVO_MINIMO, maxHeight: 140, borderRadius: 24, paddingHorizontal: espaco.l, paddingTop: 12, paddingBottom: 12, fontFamily: fontes.normal, fontSize: tipo.corpo },
  enviar: { width: ALVO_MINIMO, height: ALVO_MINIMO, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
