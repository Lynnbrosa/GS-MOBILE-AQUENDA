// Quem você é nas salas: só o apelido e o token que a API C# entregou ao entrar.
// O token fica no armazenamento seguro do sistema, como o PIN.
import * as SecureStore from 'expo-secure-store';
import { apiChat } from './api/chat';

const CHAVE = 'aquenda.salas.participante';
const OPCOES: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export type EuNasSalas = { id: number; apelido: string; token: string };

/** O servidor não guarda nada que te identifique; sair é o celular esquecer o token.
 * As mensagens somem sozinhas do servidor depois de 7 dias. */

export async function lerParticipante(): Promise<EuNasSalas | null> {
  const bruto = await SecureStore.getItemAsync(CHAVE, OPCOES);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as EuNasSalas;
  } catch {
    return null;
  }
}

export async function entrarNasSalas(apelido: string): Promise<EuNasSalas> {
  const e = await apiChat.entrar(apelido);
  const eu = { id: e.participanteId, apelido: e.apelido, token: e.token };
  await SecureStore.setItemAsync(CHAVE, JSON.stringify(eu), OPCOES);
  return eu;
}

/** Sai das salas: o celular esquece o token. Sem ele, ninguém escreve mais com o seu apelido. */
export async function sairDasSalas(): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE, OPCOES);
}

export async function esquecerParticipante(): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE, OPCOES);
}
