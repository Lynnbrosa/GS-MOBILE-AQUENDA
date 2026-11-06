import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { claro, escuro, SECOES_CLARO, SECOES_ESCURO, type CoresSecao, type NomeSecao, type Paleta } from './tokens';

export function useTema(): { cor: Paleta; escuro: boolean } {
  const ehEscuro = useColorScheme() === 'dark';
  return { cor: ehEscuro ? escuro : claro, escuro: ehEscuro };
}

/** Em qual seção (aba) a tela está. Botões e chips pegam a cor dela. */
export const ContextoSecao = createContext<NomeSecao>('casa');

export function useSecao(nome?: NomeSecao): CoresSecao & { nome: NomeSecao } {
  const doContexto = useContext(ContextoSecao);
  const ehEscuro = useColorScheme() === 'dark';
  const n = nome ?? doContexto;
  return { ...(ehEscuro ? SECOES_ESCURO : SECOES_CLARO)[n], nome: n };
}
