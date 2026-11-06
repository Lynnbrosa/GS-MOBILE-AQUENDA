import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AvisoCache, Carregando, Chip, ComoEntrar, ErroSemCache, Linha, LinhaDeChips, Secao, SemNada } from '@/componentes/base';
import { BuscaServicos, type OpcaoFiltro } from '@/componentes/BuscaServicos';
import { useRecurso } from '@/estado/useRecurso';
import { apiSoa, HABILITACOES, IBGE_SAO_PAULO, type CodigoHabilitacao } from '@/lib/api/soa';
import type { EstabelecimentosDoMunicipio } from '@/lib/api/tipos';
import { haQuanto, nomeProprio } from '@/lib/formato';

const OPCOES: OpcaoFiltro[] = [
  { chave: 'tudo', titulo: 'Tudo', categoria: 'Saude' },
  { chave: 'hormonio', titulo: 'Hormonização', categoria: 'Saude', atendimento: ['Hormonizacao'] },
  { chave: 'mental', titulo: 'Saúde mental', categoria: 'Saude', atendimento: ['SaudeMental'] },
];

const CURTO: Record<CodigoHabilitacao, string> = {
  '30.01': 'Atenção especializada',
  '30.02': 'Ambulatório e hormônio',
  '30.03': 'Cirurgia',
};

function UnidadesSus() {
  const [hab, setHab] = useState<CodigoHabilitacao | undefined>(undefined);
  const r = useRecurso<EstabelecimentosDoMunicipio>(`cnes:${IBGE_SAO_PAULO}:${hab ?? 'todas'}`, () => apiSoa.estabelecimentos(IBGE_SAO_PAULO, hab));
  return (
    <Secao titulo="Habilitados no SUS">
      <LinhaDeChips>
        <Chip titulo="Todas" ativo={!hab} onPress={() => setHab(undefined)} />
        <Chip titulo={CURTO['30.02']} ativo={hab === '30.02'} onPress={() => setHab('30.02')} />
        <Chip titulo={CURTO['30.03']} ativo={hab === '30.03'} onPress={() => setHab('30.03')} />
      </LinhaDeChips>
      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}
      {r.carregando && !r.dados ? (
        <Carregando />
      ) : r.erro ? (
        <ErroSemCache erro={r.erro} indisponivel={r.indisponivel} onTentar={r.recarregar} />
      ) : !r.dados || r.dados.itens.length === 0 ? (
        <SemNada titulo="Nenhuma unidade" texto="Escolha outra opção." />
      ) : (
        <View>
          {r.dados.itens.map((e) => (
            <Linha
              key={e.codigo_cnes}
              titulo={nomeProprio(e.nome)}
              apoio={e.habilitacoes.map((h) => CURTO[h as CodigoHabilitacao] ?? h).join(', ')}
              rotulo={`${nomeProprio(e.nome)}. ${e.habilitacoes.map((h) => HABILITACOES[h as CodigoHabilitacao] ?? h).join('; ')}`}
              onPress={() => router.push({ pathname: '/cnes/[codigo]', params: { codigo: String(e.codigo_cnes) } })}
            />
          ))}
        </View>
      )}
    </Secao>
  );
}

export default function Saude() {
  return (
    <BuscaServicos
      secao="saude"
      titulo="Saúde trans no SUS"
      antes={<ComoEntrar titulo="Por onde começar" texto="Vá à UBS perto da sua casa e peça a Rede SAMPA Trans. Use seu nome social." />}
      opcoes={OPCOES}
      permitidas={['Saude']}
      depois={<UnidadesSus />}
    />
  );
}
