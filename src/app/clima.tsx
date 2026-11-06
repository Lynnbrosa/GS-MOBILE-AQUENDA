// Tela de "previsão do tempo" da saída rápida. Parece um app de clima comum e não fala
// em Aquenda. Para voltar: tocar e segurar no nome da cidade (e digitar o PIN, se houver).
// Os números são gerados a partir da data, sem rede: não revela nada a ninguém.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Texto, type NomeIcone } from '@/componentes/base';
import { useSessao } from '@/estado/Sessao';
import { DIAS_CURTOS } from '@/lib/agenda';
import { previsaoDoDia } from '@/lib/clima';
import { espaco } from '@/tema/tokens';

const CEU = { fundo: '#2F6CA3', cartao: 'rgba(255,255,255,0.16)', texto: '#FFFFFF', suave: '#E3EEF8' };

const ICONES: Record<string, NomeIcone> = {
  sol: 'sunny-outline',
  nuvens: 'partly-sunny-outline',
  nublado: 'cloudy-outline',
  chuva: 'rainy-outline',
};

export default function Clima() {
  const { temPin, bloqueado, desbloquear } = useSessao();
  const agora = new Date();
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => previsaoDoDia(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i))), [agora.getDate()]);
  const hoje = dias[0];

  // Voltar no Android fecha o app em vez de revelar a tela anterior.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, []);

  function entrar() {
    if (!temPin && bloqueado) desbloquear();
    router.replace('/');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CEU.fundo }}>
      <ScrollView contentContainerStyle={{ padding: espaco.xl, gap: espaco.xl }}>
        <View style={{ alignItems: 'center', gap: espaco.xs, paddingTop: espaco.xl }}>
          <Pressable onLongPress={entrar} delayLongPress={700} accessibilityRole="text" accessibilityLabel="São Paulo">
            <Texto v="subtitulo" cor={CEU.texto}>
              São Paulo
            </Texto>
          </Pressable>
          <Texto cor={CEU.texto} style={{ fontSize: 88, lineHeight: 96 }} maxFontSizeMultiplier={1.2}>
            {hoje.agora}°
          </Texto>
          <Texto v="forte" cor={CEU.suave}>
            {hoje.descricao}
          </Texto>
          <Texto cor={CEU.suave}>
            Máx. {hoje.max}° Mín. {hoje.min}°
          </Texto>
        </View>

        <View style={[s.cartao, { backgroundColor: CEU.cartao }]}>
          <Texto v="apoioForte" cor={CEU.suave}>
            Próximas horas
          </Texto>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {hoje.horas.map((h) => (
              <View key={h.hora} style={{ alignItems: 'center', gap: 6 }}>
                <Texto v="apoio" cor={CEU.suave}>
                  {String(h.hora).padStart(2, '0')}h
                </Texto>
                <Ionicons name={ICONES[h.ceu]} size={24} color={CEU.texto} />
                <Texto v="forte" cor={CEU.texto}>
                  {h.temp}°
                </Texto>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.cartao, { backgroundColor: CEU.cartao }]}>
          <Texto v="apoioForte" cor={CEU.suave}>
            Próximos 7 dias
          </Texto>
          {dias.map((d, i) => (
            <View key={i} style={s.dia}>
              <Texto v="forte" cor={CEU.texto} style={{ width: 64 }}>
                {i === 0 ? 'Hoje' : DIAS_CURTOS[d.data.getDay()]}
              </Texto>
              <Ionicons name={ICONES[d.ceu]} size={24} color={CEU.texto} />
              <Texto cor={CEU.suave} style={{ width: 52, textAlign: 'right' }}>
                {d.chuva}%
              </Texto>
              <Texto cor={CEU.texto} style={{ flex: 1, textAlign: 'right' }}>
                {d.min}° / {d.max}°
              </Texto>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  cartao: { borderRadius: 20, padding: espaco.l, gap: espaco.m },
  dia: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, minHeight: 40 },
});
