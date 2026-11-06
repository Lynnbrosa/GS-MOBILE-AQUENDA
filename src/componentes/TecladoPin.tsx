import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { PIN_MAX } from '@/lib/pin';
import { espaco, fontes } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';
import { Texto } from './base';

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'apagar'];

/** Teclado numérico grande (72 dp por tecla), com os pontos do PIN digitado. */
export function TecladoPin({ valor, onMudar, desativado }: { valor: string; onMudar: (v: string) => void; desativado?: boolean }) {
  const { cor } = useTema();
  return (
    <View style={{ gap: espaco.xl, alignItems: 'center' }}>
      <View
        style={s.pontos}
        accessible
        accessibilityLabel={valor.length === 0 ? 'Nenhum número digitado' : `${valor.length} de até ${PIN_MAX} números digitados`}
        accessibilityLiveRegion="polite"
      >
        {Array.from({ length: Math.max(4, valor.length) }).map((_, i) => (
          <View
            key={i}
            style={[s.ponto, { borderColor: cor.tinta, backgroundColor: i < valor.length ? cor.tinta : 'transparent' }]}
          />
        ))}
      </View>
      <View style={s.grade}>
        {TECLAS.map((t, i) =>
          t === '' ? (
            <View key={i} style={s.tecla} />
          ) : (
            <Pressable
              key={i}
              disabled={desativado}
              accessibilityRole="button"
              accessibilityLabel={t === 'apagar' ? 'Apagar último número' : t}
              onPress={() => {
                if (t === 'apagar') onMudar(valor.slice(0, -1));
                else if (valor.length < PIN_MAX) onMudar(valor + t);
              }}
              style={({ pressed }) => [
                s.tecla,
                { backgroundColor: pressed ? cor.superficieForte : t === 'apagar' ? 'transparent' : cor.superficie, opacity: desativado ? 0.4 : 1 },
              ]}
            >
              {t === 'apagar' ? (
                <Ionicons name="backspace-outline" size={28} color={cor.tinta} />
              ) : (
                <Texto style={{ fontFamily: fontes.forte, fontSize: 28, lineHeight: 34 }} maxFontSizeMultiplier={1.3}>
                  {t}
                </Texto>
              )}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pontos: { flexDirection: 'row', gap: espaco.m, minHeight: 20 },
  ponto: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', width: 3 * 72 + 2 * 20, gap: 20, justifyContent: 'center' },
  tecla: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
