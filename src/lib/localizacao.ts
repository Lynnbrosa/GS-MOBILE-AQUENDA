// "Perto de mim": pede a posição uma vez, só enquanto o app está aberto.
// A posição vai na busca (lat/lon com 4 casas, uns 10 m) e não é guardada em lugar nenhum.
import * as Location from 'expo-location';

export type Posicao = { lat: number; lon: number };

export type ResultadoPosicao = { posicao: Posicao } | { negado: true } | { erro: string };

export async function pedirPosicao(): Promise<ResultadoPosicao> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { negado: true };
    const ultima = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
    const pos = ultima ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { posicao: { lat: pos.coords.latitude, lon: pos.coords.longitude } };
  } catch {
    return { erro: 'Não deu para saber onde você está agora.' };
  }
}

/** Centro de Referência LGBTI+ Brunna Valin (República), usado quando a pessoa não compartilha a posição. */
export const CENTRO_SP: Posicao = { lat: -23.5431, lon: -46.643 };
