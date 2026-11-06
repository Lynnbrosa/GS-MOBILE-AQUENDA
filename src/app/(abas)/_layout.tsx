import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NomeIcone } from '@/componentes/base';
import { fontes } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';

const ABAS: { nome: string; titulo: string; icone: NomeIcone; iconeAtivo: NomeIcone; dica: string }[] = [
  { nome: 'index', titulo: 'Casa', icone: 'home-outline', iconeAtivo: 'home', dica: 'Acolhimento, Centros de Referência e jurídico' },
  { nome: 'saude', titulo: 'Saúde', icone: 'medkit-outline', iconeAtivo: 'medkit', dica: 'Saúde trans no SUS' },
  { nome: 'vagas', titulo: 'Vagas', icone: 'briefcase-outline', iconeAtivo: 'briefcase', dica: 'Vagas de emprego afirmativas' },
  { nome: 'agenda', titulo: 'Agenda', icone: 'calendar-outline', iconeAtivo: 'calendar', dica: 'Lembretes e consultas, só neste celular' },
  { nome: 'rodas', titulo: 'Rodas', icone: 'people-outline', iconeAtivo: 'people', dica: 'Rodas de conversa e grupos' },
  { nome: 'roles', titulo: 'Rolês', icone: 'sparkles-outline', iconeAtivo: 'sparkles', dica: 'Bares, baladas e espaços LGBT+' },
];

export default function LayoutAbas() {
  const { cor } = useTema();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cor.tinta,
        tabBarInactiveTintColor: cor.tintaSuave,
        tabBarStyle: {
          backgroundColor: cor.superficie,
          borderTopColor: cor.linha,
          height: 66 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontFamily: fontes.forte, fontSize: 12 },
        tabBarAllowFontScaling: true,
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      {ABAS.map((a) => (
        <Tabs.Screen
          key={a.nome}
          name={a.nome}
          options={{
            title: a.titulo,
            tabBarAccessibilityLabel: `${a.titulo}. ${a.dica}`,
            tabBarIcon: ({ focused, color }) => (
              <View style={{ alignItems: 'center', gap: 3 }}>
                {/* a fita marca a aba em que você está, além da cor e do ícone cheio */}
                <View style={{ flexDirection: 'row', height: 3, width: 26, opacity: focused ? 1 : 0 }}>
                  <View style={{ flex: 1, backgroundColor: cor.fitaAzul }} />
                  <View style={{ flex: 1, backgroundColor: cor.fitaRosa }} />
                </View>
                <Ionicons name={focused ? a.iconeAtivo : a.icone} size={24} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
