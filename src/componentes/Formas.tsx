// O arco-íris pastel da tromba do elefante, repetido no topo de cada aba.
// A listra da cor da aba vem por fora; as outras seguem a ordem do arco da logo.
// Decorativo, escondido do leitor de tela.
import Svg, { Path } from 'react-native-svg';
import { ARCO_IRIS, type NomeSecao } from '@/tema/tokens';

const PRIMEIRA: Record<NomeSecao, number> = { rodas: 0, casa: 1, roles: 2, saude: 3, vagas: 4, agenda: 5 };

/** Meio arco com centro em (cx, cy) e raio r, abrindo para baixo, como a voltinha do "a". */
function meioArco(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
}

export function FormaSecao({ secao, tamanho = 170 }: { secao: NomeSecao; cor?: string; tamanho?: number }) {
  const inicio = PRIMEIRA[secao];
  const listras = ARCO_IRIS.map((_, i) => ARCO_IRIS[(inicio + i) % ARCO_IRIS.length]);
  const espessura = 7;
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {listras.map((c, i) => (
        <Path key={c} d={meioArco(55, 80, 44 - i * espessura)} stroke={c} strokeWidth={espessura + 0.4} strokeLinecap="round" fill="none" />
      ))}
    </Svg>
  );
}
