import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Cartao, Fita, Secao, Texto } from '@/componentes/base';
import { BuscaServicos, type OpcaoFiltro } from '@/componentes/BuscaServicos';
import { listarFavoritos, type Favorito } from '@/lib/banco';
import { CATEGORIAS } from '@/lib/formato';
import { espaco } from '@/tema/tokens';

const OPCOES: OpcaoFiltro[] = [
  { chave: 'tudo', titulo: 'Tudo' },
  { chave: 'acolhimento', titulo: 'Onde dormir', categoria: 'Acolhimento' },
  { chave: 'centro', titulo: 'Centro de Referência', categoria: 'CentroReferencia' },
  { chave: 'juridico', titulo: 'Jurídico', categoria: 'Juridico' },
];

function Marca() {
  return (
    <View style={{ gap: espaco.s }}>
      <View style={{ alignSelf: 'flex-start', gap: 6 }}>
        <Texto v="marca" accessibilityLabel="Aquenda">
          aquenda
        </Texto>
        <Fita espessura={4} />
      </View>
      <Texto v="apoio" suave>
        Do pajubá: prestar atenção, olhar por alguém.
      </Texto>
    </View>
  );
}

function Salvos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  useFocusEffect(
    useCallback(() => {
      listarFavoritos().then(setFavoritos).catch(() => setFavoritos([]));
    }, []),
  );
  if (favoritos.length === 0) return null;
  return (
    <Secao titulo="Você salvou">
      {favoritos.map((f) => (
        <Cartao
          key={f.servicoId}
          onPress={() => router.push({ pathname: '/servico/[id]', params: { id: String(f.servicoId) } })}
          rotulo={`${f.nome}, ${CATEGORIAS[f.categoria]}`}
        >
          <Texto v="forte">{f.nome}</Texto>
          <Texto v="apoio" suave>
            {CATEGORIAS[f.categoria]}
          </Texto>
        </Cartao>
      ))}
      <Texto v="apoio" suave>
        Os salvos ficam só neste celular.
      </Texto>
    </Secao>
  );
}

export default function Casa() {
  return (
    <BuscaServicos
      topo={<Marca />}
      titulo="Do que você precisa agora?"
      apoio="Acolhimento, Centros de Referência LGBTI+ e defesa de direitos em São Paulo. Não precisa de cadastro."
      opcoes={OPCOES}
      permitidas={['Acolhimento', 'CentroReferencia', 'Juridico']}
      vagasCasas
      depois={<Salvos />}
    />
  );
}
