import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NomeIcone } from '@/componentes/base';
import { fontes, SECOES_CLARO, SECOES_ESCURO, type NomeSecao } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';

const ABAS: { nome: string; secao: NomeSecao; titulo: string; icone: NomeIcone; iconeAtivo: NomeIcone; dica: string }[] = [
  { nome: 'index', secao: 'casa', titulo: 'Casa', icone: 'home-outline', iconeAtivo: 'home', dica: 'Acolhimento, Centros de Referência e jurídico' },
  { nome: 'saude', secao: 'saude', titulo: 'Saúde', icone: 'leaf-outline', iconeAtivo: 'leaf', dica: 'Saúde trans no SUS' },
  { nome: 'vagas', secao: 'vagas', titulo: 'Vagas', icone: 'briefcase-outline', iconeAtivo: 'briefcase', dica: 'Vagas de emprego afirmativas' },
  { nome: 'agenda', secao: 'agenda', titulo: 'Agenda', icone: 'moon-outline', iconeAtivo: 'moon', dica: 'Lembretes e consultas, só neste celular' },
  { nome: 'rodas', secao: 'rodas', titulo: 'Rodas', icone: 'chatbubbles-outline', iconeAtivo: 'chatbubbles', dica: 'Salas de conversa e rodas' },
  { nome: 'roles', secao: 'roles', titulo: 'Rolês', icone: 'sparkles-outline', iconeAtivo: 'sparkles', dica: 'Bares, baladas e cultura' },
];

export default function LayoutAbas() {
  const { cor } = useTema();
  const secoes = useColorScheme() === 'dark' ? SECOES_ESCURO : SECOES_CLARO;
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: cor.tintaSuave,
        tabBarStyle: {
          backgroundColor: cor.papel,
          borderTopWidth: 0,
          elevation: 0,
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontFamily: fontes.forte, fontSize: 12 },
        tabBarAllowFontScaling: true,
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      {ABAS.map((a) => {
        const s = secoes[a.secao];
        return (
          <Tabs.Screen
            key={a.nome}
            name={a.nome}
            options={{
              title: a.titulo,
              tabBarActiveTintColor: cor.tinta,
              tabBarAccessibilityLabel: `${a.titulo}. ${a.dica}`,
              tabBarIcon: ({ focused }) => (
                <View style={{ width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? s.topo : 'transparent' }}>
                  <Ionicons name={focused ? a.iconeAtivo : a.icone} size={22} color={focused ? s.sobreTopo : cor.tintaSuave} />
                </View>
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
