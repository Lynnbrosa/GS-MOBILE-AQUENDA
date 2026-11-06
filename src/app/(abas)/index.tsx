import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Linha, Secao } from '@/componentes/base';
import { BuscaServicos, type OpcaoFiltro } from '@/componentes/BuscaServicos';
import { Mascote } from '@/componentes/Mascote';
import { listarFavoritos, type Favorito } from '@/lib/banco';
import { CATEGORIAS } from '@/lib/formato';

const OPCOES: OpcaoFiltro[] = [
  { chave: 'tudo', titulo: 'Tudo' },
  { chave: 'acolhimento', titulo: 'Onde dormir', categoria: 'Acolhimento' },
  { chave: 'centro', titulo: 'Centro de Referência', categoria: 'CentroReferencia' },
  { chave: 'juridico', titulo: 'Jurídico', categoria: 'Juridico' },
];

function Salvos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  useFocusEffect(
    useCallback(() => {
      listarFavoritos().then(setFavoritos).catch(() => setFavoritos([]));
    }, []),
  );
  if (favoritos.length === 0) return null;
  return (
    <Secao titulo="Salvos">
      {favoritos.map((f) => (
        <Linha
          key={f.servicoId}
          titulo={f.nome}
          apoio={CATEGORIAS[f.categoria]}
          onPress={() => router.push({ pathname: '/servico/[id]', params: { id: String(f.servicoId) } })}
        />
      ))}
    </Secao>
  );
}

export default function Casa() {
  return (
    <BuscaServicos
      secao="casa"
      topo={
        <View accessible accessibilityLabel="Aquenda">
          <Mascote tamanho={92} />
        </View>
      }
      titulo="Do que você precisa?"
      opcoes={OPCOES}
      permitidas={['Acolhimento', 'CentroReferencia', 'Juridico']}
      vagasCasas
      comMapa
      depois={<Salvos />}
    />
  );
}
