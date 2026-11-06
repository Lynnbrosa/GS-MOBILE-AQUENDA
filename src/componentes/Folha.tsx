// Folha de opções que sobe de baixo (denunciar, bloquear...). O Alert do Android só aceita
// 3 botões, e a denúncia tem 6 motivos, por isso esta folha própria.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALVO_MINIMO, espaco, raio } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';
import { Texto, type NomeIcone } from './base';

export type OpcaoFolha = { texto: string; icone?: NomeIcone; perigo?: boolean; onPress: () => void };

export function Folha({ visivel, titulo, opcoes, onFechar }: { visivel: boolean; titulo?: string; opcoes: OpcaoFolha[]; onFechar: () => void }) {
  const { cor } = useTema();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <Pressable style={est.fundo} onPress={onFechar} accessibilityLabel="Fechar" accessibilityRole="button" />
      <View style={[est.folha, { backgroundColor: cor.papel, paddingBottom: insets.bottom + espaco.l }]} accessibilityViewIsModal>
        <View style={[est.puxador, { backgroundColor: cor.linha }]} />
        {titulo ? (
          <Texto v="subtitulo" style={{ marginBottom: espaco.s }}>
            {titulo}
          </Texto>
        ) : null}
        {opcoes.map((o) => (
          <Pressable
            key={o.texto}
            accessibilityRole="button"
            accessibilityLabel={o.texto}
            onPress={() => {
              onFechar();
              o.onPress();
            }}
            style={({ pressed }) => [est.opcao, { opacity: pressed ? 0.6 : 1 }]}
          >
            {o.icone ? <Ionicons name={o.icone} size={22} color={o.perigo ? cor.perigo : cor.tinta} /> : null}
            <Texto v="forte" cor={o.perigo ? cor.perigo : cor.tinta}>
              {o.texto}
            </Texto>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={onFechar} style={[est.opcao, { justifyContent: 'center' }]}>
          <Texto v="forte" suave>
            Cancelar
          </Texto>
        </Pressable>
      </View>
    </Modal>
  );
}

const est = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(20,16,26,0.45)' },
  folha: { borderTopLeftRadius: raio.topo, borderTopRightRadius: raio.topo, paddingHorizontal: espaco.l, paddingTop: espaco.s, gap: 2 },
  puxador: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: espaco.m },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, minHeight: ALVO_MINIMO + 4 },
});
