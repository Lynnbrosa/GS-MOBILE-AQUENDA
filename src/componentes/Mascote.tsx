// A marca do Aquenda: um elefantinho com a pele de casca de kiwi e a orelha de kiwi cortado,
// que levanta a tromba e faz a letra "a" com um arco-íris pastel.
// assets/mascote.png sai de assets/logo-original.png (scripts/logo/recortar.py).
import { Image } from 'react-native';

const IMAGEM = require('../../assets/mascote.png');

export function Mascote({ tamanho = 96 }: { tamanho?: number }) {
  return (
    <Image
      source={IMAGEM}
      style={{ width: tamanho, height: tamanho }}
      resizeMode="contain"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
