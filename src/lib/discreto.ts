// Modo discreto: nome e ícone "Clima" na tela inicial do celular, PIN e saída rápida.
// O PIN nunca sai do aparelho: fica como hash (SHA-256 com sal) no armazenamento seguro do sistema.
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { getAppIconName, setAlternateAppIcon, supportsAlternateIcons } from 'expo-alternate-app-icons';
import { iguaisTempoConstante } from './pin';

const CHAVE_HASH = 'aquenda.pin.hash';
const CHAVE_SAL = 'aquenda.pin.sal';
const OPCOES: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const ICONE_DISCRETO = 'Clima';

async function hash(pin: string, sal: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sal}:${pin}`);
}

export async function temPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(CHAVE_HASH, OPCOES)) !== null;
}

export async function definirPin(pin: string): Promise<void> {
  const sal = Crypto.randomUUID();
  await SecureStore.setItemAsync(CHAVE_SAL, sal, OPCOES);
  await SecureStore.setItemAsync(CHAVE_HASH, await hash(pin, sal), OPCOES);
}

export async function conferirPin(pin: string): Promise<boolean> {
  const [guardado, sal] = await Promise.all([
    SecureStore.getItemAsync(CHAVE_HASH, OPCOES),
    SecureStore.getItemAsync(CHAVE_SAL, OPCOES),
  ]);
  if (!guardado || !sal) return false;
  return iguaisTempoConstante(await hash(pin, sal), guardado);
}

export async function removerPin(): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE_HASH, OPCOES);
  await SecureStore.deleteItemAsync(CHAVE_SAL, OPCOES);
}

export function trocaIconeDisponivel(): boolean {
  try {
    return supportsAlternateIcons;
  } catch {
    return false;
  }
}

/** Troca o ícone e o nome na tela inicial. No Android o launcher pode levar alguns segundos. */
export async function aplicarIcone(discreto: boolean): Promise<boolean> {
  if (!trocaIconeDisponivel()) return false;
  try {
    const atual = getAppIconName();
    const desejado = discreto ? ICONE_DISCRETO : null;
    if (atual === desejado) return true;
    await setAlternateAppIcon(desejado);
    return true;
  } catch {
    return false;
  }
}
