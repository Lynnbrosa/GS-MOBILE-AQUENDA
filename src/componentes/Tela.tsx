import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessao } from '@/estado/Sessao';
import { ALVO_MINIMO, espaco, raio } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';
import { BotaoIcone, Texto } from './base';

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
      style={({ pressed }) => [s.saida, { backgroundColor: cor.tinta, opacity: pressed ? 0.8 : 1 }]}
    >
      <Ionicons name="partly-sunny-outline" size={20} color={cor.papel} />
      <Texto v="apoioForte" cor={cor.papel} maxFontSizeMultiplier={1.4}>
        Sair
      </Texto>
    </Pressable>
  );
}

export function Tela({
  titulo,
  apoio,
  children,
  topo,
  recarregando,
  onRecarregar,
}: {
  titulo: string;
  apoio?: string;
  children: ReactNode;
  /** Algo acima do título (ex.: a marca na aba casa). */
  topo?: ReactNode;
  recarregando?: boolean;
  onRecarregar?: () => void;
}) {
  const { cor } = useTema();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: cor.papel }}>
      <View style={[s.barra, { borderBottomColor: cor.linha }]}>
        <BotaoIcone
          icone="settings-outline"
          rotulo="Ajustes"
          dica="Modo discreto, PIN e seus dados"
          onPress={() => router.push('/ajustes')}
        />
        <View style={{ flex: 1 }} />
        <SaidaRapida />
      </View>
      <ScrollView
        contentContainerStyle={s.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRecarregar ? (
            <RefreshControl refreshing={!!recarregando} onRefresh={onRecarregar} tintColor={cor.acao} colors={[cor.acao]} />
          ) : undefined
        }
      >
        {topo}
        <View style={{ gap: espaco.xs }}>
          <Texto v="titulo">{titulo}</Texto>
          {apoio ? <Texto suave>{apoio}</Texto> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Tela de detalhe, aberta por cima das abas (o cabeçalho com voltar vem do Stack). */
export function TelaDetalhe({ children }: { children: ReactNode }) {
  const { cor } = useTema();
  return (
    <ScrollView style={{ backgroundColor: cor.papel }} contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espaco.s,
    paddingVertical: espaco.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saida: {
    minHeight: ALVO_MINIMO - 4,
    minWidth: ALVO_MINIMO + 24,
    borderRadius: raio.chip,
    paddingHorizontal: espaco.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginRight: espaco.xs,
  },
  conteudo: { padding: espaco.l, paddingBottom: espaco.xxl * 2, gap: espaco.xl },
});
