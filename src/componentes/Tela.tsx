import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessao } from '@/estado/Sessao';
import { ALVO_MINIMO, espaco, raio, type NomeSecao } from '@/tema/tokens';
import { ContextoSecao, useSecao, useTema } from '@/tema/useTema';
import { BotaoIcone, Texto } from './base';
import { FormaSecao } from './Formas';

/** Botão de saída rápida: sempre no mesmo lugar, em todas as abas. */
export function SaidaRapida() {
  const { cor } = useTema();
  const { sairRapido } = useSessao();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Saída rápida"
      accessibilityHint="Troca na hora para uma tela de previsão do tempo"
      onPress={sairRapido}
      style={({ pressed }) => [est.saida, { backgroundColor: cor.tinta, opacity: pressed ? 0.8 : 1 }]}
    >
      <Ionicons name="partly-sunny" size={18} color={cor.papel} />
      <Texto v="apoioForte" cor={cor.papel} maxFontSizeMultiplier={1.4}>
        Sair
      </Texto>
    </Pressable>
  );
}

function Topo({ secao, titulo, apoio, extra }: { secao: NomeSecao; titulo: string; apoio?: string; extra?: ReactNode }) {
  const s = useSecao(secao);
  const insets = useSafeAreaInsets();
  return (
    <View style={[est.topo, { backgroundColor: s.topo, paddingTop: insets.top + espaco.xs }]}>
      <View style={est.forma}>
        <FormaSecao secao={secao} cor={s.forma} tamanho={170} />
      </View>
      <View style={est.barra}>
        <BotaoIcone icone="settings-outline" rotulo="Ajustes" dica="Modo discreto, PIN e seus dados" cor={s.sobreTopo} onPress={() => router.push('/ajustes')} />
        <View style={{ flex: 1 }} />
        <SaidaRapida />
      </View>
      {extra}
      <View style={{ gap: espaco.xs, paddingRight: 90 }}>
        <Texto v="titulo" cor={s.sobreTopo}>
          {titulo}
        </Texto>
        {apoio ? (
          <Texto cor={s.sobreTopo} style={{ opacity: 0.85 }}>
            {apoio}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

export function Tela({
  secao,
  titulo,
  apoio,
  children,
  topo,
  recarregando,
  onRecarregar,
}: {
  secao: NomeSecao;
  titulo: string;
  apoio?: string;
  children: ReactNode;
  /** Algo dentro do topo, acima do título (ex.: o mascote na aba casa). */
  topo?: ReactNode;
  recarregando?: boolean;
  onRecarregar?: () => void;
}) {
  const { cor } = useTema();
  const s = useSecao(secao);
  return (
    <ContextoSecao.Provider value={secao}>
      <View style={{ flex: 1, backgroundColor: cor.papel }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: espaco.xxl * 2 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRecarregar ? <RefreshControl refreshing={!!recarregando} onRefresh={onRecarregar} tintColor={s.acao} colors={[s.acao]} /> : undefined
          }
        >
          <Topo secao={secao} titulo={titulo} apoio={apoio} extra={topo} />
          <View style={est.conteudo}>{children}</View>
        </ScrollView>
      </View>
    </ContextoSecao.Provider>
  );
}

/** Tela de detalhe, aberta por cima das abas (o voltar vem do Stack). */
export function TelaDetalhe({ children, secao = 'casa' }: { children: ReactNode; secao?: NomeSecao }) {
  const { cor } = useTema();
  return (
    <ContextoSecao.Provider value={secao}>
      <ScrollView style={{ backgroundColor: cor.papel }} contentContainerStyle={[est.conteudo, { paddingBottom: espaco.xxl * 2 }]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </ContextoSecao.Provider>
  );
}

const est = StyleSheet.create({
  topo: {
    paddingHorizontal: espaco.l,
    paddingBottom: espaco.xl + 4,
    borderBottomLeftRadius: raio.topo,
    borderBottomRightRadius: raio.topo,
    overflow: 'hidden',
    gap: espaco.m,
  },
  forma: { position: 'absolute', right: -26, bottom: -64 },
  barra: { flexDirection: 'row', alignItems: 'center', marginLeft: -espaco.s },
  saida: {
    minHeight: ALVO_MINIMO - 4,
    minWidth: ALVO_MINIMO + 24,
    borderRadius: raio.chip,
    paddingHorizontal: espaco.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  conteudo: { padding: espaco.l, gap: espaco.l },
});
