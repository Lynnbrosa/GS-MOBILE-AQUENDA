import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AvisoCache, Busca, Carregando, Chip, ErroSemCache, Linha, LinhaDeChips, Selo, SemNada } from '@/componentes/base';
import { Tela } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiSoa, type FiltroVagas } from '@/lib/api/soa';
import type { Modalidade, PaginaVagas } from '@/lib/api/tipos';
import { haQuanto, MODALIDADES } from '@/lib/formato';

const MODOS: { valor: Modalidade; titulo: string }[] = [
  { valor: 'presencial', titulo: 'Presencial' },
  { valor: 'hibrido', titulo: 'Híbrido' },
  { valor: 'remoto', titulo: 'Remoto' },
];

export default function Vagas() {
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [soAfirmativas, setSoAfirmativas] = useState(true);
  const [modalidade, setModalidade] = useState<Modalidade | undefined>(undefined);

  const filtro: FiltroVagas = {
    texto: busca || undefined,
    cidade: modalidade === 'remoto' ? undefined : 'São Paulo',
    afirmativa: soAfirmativas ? true : undefined,
    modalidade,
    tamanho: 50,
  };
  const r = useRecurso<PaginaVagas>(`vagas:${JSON.stringify(filtro)}`, () => apiSoa.vagas(filtro));

  return (
    <Tela secao="vagas" titulo="Trabalho" apoio="Vagas que querem você." recarregando={r.carregando && !!r.dados} onRecarregar={r.recarregar}>
      <Busca rotulo="Cargo ou palavra" value={texto} onChangeText={setTexto} onSubmitEditing={() => setBusca(texto.trim())} onBlur={() => setBusca(texto.trim())} />
      <LinhaDeChips>
        <Chip titulo="Afirmativas" icone="heart" ativo={soAfirmativas} onPress={() => setSoAfirmativas((v) => !v)} />
        {MODOS.map((m) => (
          <Chip key={m.valor} titulo={m.titulo} ativo={modalidade === m.valor} onPress={() => setModalidade((atual) => (atual === m.valor ? undefined : m.valor))} />
        ))}
      </LinhaDeChips>

      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}

      {r.carregando && !r.dados ? (
        <Carregando />
      ) : r.erro ? (
        <ErroSemCache erro={r.erro} indisponivel={r.indisponivel} onTentar={r.recarregar} />
      ) : !r.dados || r.dados.itens.length === 0 ? (
        <SemNada titulo="Nenhuma vaga" texto="Tente outra palavra ou o remoto." acao={{ titulo: 'Limpar', onPress: () => { setTexto(''); setBusca(''); setModalidade(undefined); } }} />
      ) : (
        <View>
          {r.dados.itens.map((v) => (
            <Linha
              key={v.id}
              titulo={v.titulo}
              apoio={v.empresa}
              rotulo={`${v.titulo}. ${v.empresa}. ${MODALIDADES[v.modalidade]}.${v.afirmativa ? ' Vaga afirmativa.' : ''}`}
              dica="Abre a vaga e o link para se candidatar"
              onPress={() => router.push({ pathname: '/vaga/[id]', params: { id: String(v.id) } })}
              selo={
                <>
                  {v.afirmativa ? <Selo tom="secao" icone="heart" texto="Afirmativa" /> : null}
                  {v.modalidade !== 'nao_informada' ? <Selo texto={MODALIDADES[v.modalidade]} /> : null}
                </>
              }
            />
          ))}
        </View>
      )}
    </Tela>
  );
}
