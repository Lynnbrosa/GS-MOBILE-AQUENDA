import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AvisoCache, Campo, Carregando, Cartao, Chip, ErroSemCache, LinhaDeChips, Selo, SemNada, Texto } from '@/componentes/base';
import { Tela } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiSoa, type FiltroVagas } from '@/lib/api/soa';
import type { Modalidade, PaginaVagas, VagaResumo } from '@/lib/api/tipos';
import { haQuanto, MODALIDADES, ORIGENS_VAGA } from '@/lib/formato';
import { espaco } from '@/tema/tokens';

const MODOS: { valor?: Modalidade; titulo: string }[] = [
  { titulo: 'Qualquer' },
  { valor: 'presencial', titulo: 'Presencial' },
  { valor: 'hibrido', titulo: 'Híbrido' },
  { valor: 'remoto', titulo: 'Remoto' },
];

function ItemVaga({ v }: { v: VagaResumo }) {
  const onde = [v.cidade, v.uf].filter(Boolean).join(', ');
  return (
    <Cartao
      onPress={() => router.push({ pathname: '/vaga/[id]', params: { id: String(v.id) } })}
      rotulo={`${v.titulo}. ${v.empresa}. ${onde}. ${MODALIDADES[v.modalidade]}.${v.afirmativa ? ' Vaga afirmativa.' : ''}`}
      dica="Abre a vaga e o link para se candidatar no site de origem"
    >
      <Texto v="forte" numberOfLines={3}>
        {v.titulo}
      </Texto>
      <Texto v="apoio" suave>
        {v.empresa}
        {onde ? `, ${onde}` : ''}
      </Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
        {v.afirmativa ? <Selo tom="azul" icone="heart-outline" texto="Afirmativa" /> : null}
        <Selo texto={MODALIDADES[v.modalidade]} />
        <Selo texto={`Via ${ORIGENS_VAGA[v.origem]}`} />
      </View>
      {v.termo_afirmativo ? (
        <Texto v="apoio" suave>
          O anúncio cita “{v.termo_afirmativo}”.
        </Texto>
      ) : null}
    </Cartao>
  );
}

export default function Vagas() {
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [cidade, setCidade] = useState('São Paulo');
  const [cidadeBusca, setCidadeBusca] = useState('São Paulo');
  const [soAfirmativas, setSoAfirmativas] = useState(true);
  const [modalidade, setModalidade] = useState<Modalidade | undefined>(undefined);

  const filtro: FiltroVagas = {
    texto: busca || undefined,
    cidade: modalidade === 'remoto' ? undefined : cidadeBusca || undefined,
    afirmativa: soAfirmativas ? true : undefined,
    modalidade,
    tamanho: 50,
  };
  const r = useRecurso<PaginaVagas>(`vagas:${JSON.stringify(filtro)}`, () => apiSoa.vagas(filtro));

  return (
    <Tela
      titulo="Vagas de trabalho"
      apoio="Vagas afirmativas para pessoas trans, travestis e LGBTQIAPN+, juntadas da Gupy, da Adzuna e da curadoria do grupo. A candidatura é sempre no site de origem."
      recarregando={r.carregando && !!r.dados}
      onRecarregar={r.recarregar}
    >
      <View style={{ gap: espaco.m }}>
        <Campo
          rotulo="Cargo ou palavra"
          placeholder="Ex.: atendimento, enfermagem"
          value={texto}
          onChangeText={setTexto}
          returnKeyType="search"
          onSubmitEditing={() => setBusca(texto.trim())}
          onBlur={() => setBusca(texto.trim())}
        />
        <Campo
          rotulo="Cidade"
          value={cidade}
          onChangeText={setCidade}
          returnKeyType="search"
          onSubmitEditing={() => setCidadeBusca(cidade.trim())}
          onBlur={() => setCidadeBusca(cidade.trim())}
        />
        <LinhaDeChips>
          {MODOS.map((m) => (
            <Chip key={m.titulo} titulo={m.titulo} ativo={modalidade === m.valor} onPress={() => setModalidade(m.valor)} />
          ))}
        </LinhaDeChips>
        <LinhaDeChips>
          <Chip
            titulo="Só afirmativas"
            icone="heart-outline"
            ativo={soAfirmativas}
            onPress={() => setSoAfirmativas((v) => !v)}
          />
        </LinhaDeChips>
      </View>

      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}

      {r.carregando && !r.dados ? (
        <Carregando texto="Procurando vagas…" />
      ) : r.erro ? (
        <ErroSemCache erro={r.erro} indisponivel={r.indisponivel} servico="o serviço de vagas" onTentar={r.recarregar} />
      ) : !r.dados || r.dados.itens.length === 0 ? (
        <SemNada
          icone="briefcase-outline"
          titulo="Nenhuma vaga com esses filtros"
          texto="Tente outra palavra, outra cidade ou a modalidade remota."
          acao={{
            titulo: 'Limpar filtros',
            onPress: () => {
              setTexto('');
              setBusca('');
              setModalidade(undefined);
            },
          }}
        />
      ) : (
        <View style={{ gap: espaco.m }}>
          <Texto v="apoio" suave accessibilityLiveRegion="polite">
            {r.dados.total === 1 ? '1 vaga' : `${r.dados.total} vagas`}
          </Texto>
          {r.dados.itens.map((v) => (
            <ItemVaga key={v.id} v={v} />
          ))}
        </View>
      )}
    </Tela>
  );
}
