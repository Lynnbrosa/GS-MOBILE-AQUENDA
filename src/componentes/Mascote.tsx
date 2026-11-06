// A marca do Aquenda: um elefante que é a letra "a". A tromba faz a voltinha de cima,
// a pele tem a textura da casca do kiwi e a orelha mostra a polpa verde.
// O desenho original é vetorial (scripts/logo/logo.js); aqui entra a versão já rasterizada,
// porque a textura usa filtros SVG que o react-native-svg não desenha.
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
