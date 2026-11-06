import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold, useFonts } from '@expo-google-fonts/atkinson-hyperlegible';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Bloqueio } from '@/componentes/Bloqueio';
import { ProvedorSessao, useSessao } from '@/estado/Sessao';
import { lerPreferencia } from '@/lib/banco';
import { configurarPadroes, definirUrlPersonalizada } from '@/lib/config';
import { prepararCanal } from '@/lib/notificacoes';
import { fontes } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

configurarPadroes({
  env: {
    csharp: process.env.EXPO_PUBLIC_API_CSHARP_URL,
    soa: process.env.EXPO_PUBLIC_API_SOA_URL,
  },
  hostDoMetro: Constants.expoConfig?.hostUri ?? null,
  plataforma: Platform.OS,
  ehEmulador: !Device.isDevice,
});

function Navegacao() {
  const { cor, escuro } = useTema();
  const { pronto, bloqueado, discreto } = useSessao();
  const caminho = usePathname();
  const abriu = useRef(false);

  // No modo discreto o app abre direto na tela de clima.
  useEffect(() => {
    if (!pronto || abriu.current) return;
    abriu.current = true;
    if (discreto) router.replace('/clima');
  }, [pronto, discreto]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(cor.papel).catch(() => undefined);
  }, [cor.papel]);

  if (!pronto) return <View style={{ flex: 1, backgroundColor: cor.papel }} />;

  // A tela de clima nunca fica atrás do PIN: é para onde a saída rápida leva.
  const mostrarBloqueio = bloqueado && caminho !== '/clima';

  return (
    <>
      <StatusBar style={escuro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cor.papel },
          headerTintColor: cor.tinta,
          headerTitleStyle: { fontFamily: fontes.forte },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: cor.papel },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(abas)" options={{ headerShown: false }} />
        <Stack.Screen name="clima" options={{ headerShown: false, animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="servico/[id]" options={{ title: 'Serviço' }} />
        <Stack.Screen name="vaga/[id]" options={{ title: 'Vaga' }} />
        <Stack.Screen name="cnes/[codigo]" options={{ title: 'Unidade do SUS' }} />
        <Stack.Screen name="roda/[id]" options={{ title: 'Roda de conversa' }} />
        <Stack.Screen name="agenda/lembrete" options={{ title: 'Lembrete', presentation: 'modal' }} />
        <Stack.Screen name="agenda/consulta" options={{ title: 'Consulta', presentation: 'modal' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      </Stack>
      {mostrarBloqueio ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Bloqueio />
        </View>
      ) : null}
    </>
  );
}

export default function RootLayout() {
  const [fontesProntas, erroFontes] = useFonts({ AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });
  const [urlsProntas, setUrlsProntas] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cs, soa] = await Promise.all([lerPreferencia('url.csharp'), lerPreferencia('url.soa')]);
        definirUrlPersonalizada('csharp', cs);
        definirUrlPersonalizada('soa', soa);
      } catch {
        // banco indisponível: seguem os endereços padrão
      }
      setUrlsProntas(true);
      prepararCanal().catch(() => undefined);
    })();
  }, []);

  const pronto = (fontesProntas || !!erroFontes) && urlsProntas;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => undefined);
  }, [pronto]);

  if (!pronto) return null;

  return (
    <SafeAreaProvider>
      <ProvedorSessao>
        <Navegacao />
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}
