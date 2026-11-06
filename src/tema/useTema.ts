import { useColorScheme } from 'react-native';
import { claro, escuro, type Paleta } from './tokens';

export function useTema(): { cor: Paleta; escuro: boolean } {
  const esquema = useColorScheme();
  const ehEscuro = esquema === 'dark';
  return { cor: ehEscuro ? escuro : claro, escuro: ehEscuro };
}
