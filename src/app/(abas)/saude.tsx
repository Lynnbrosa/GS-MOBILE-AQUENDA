import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AvisoCache, Carregando, Cartao, Chip, ComoEntrar, ErroSemCache, LinhaDeChips, Secao, Selo, SemNada, Texto } from '@/componentes/base';
import { BuscaServicos, type OpcaoFiltro } from '@/componentes/BuscaServicos';
import { useRecurso } from '@/estado/useRecurso';
import { apiSoa, HABILITACOES, IBGE_SAO_PAULO, type CodigoHabilitacao } from '@/lib/api/soa';
import type { Estabelecimento, EstabelecimentosDoMunicipio } from '@/lib/api/tipos';
import { haQuanto, nomeProprio } from '@/lib/formato';
import { espaco } from '@/tema/tokens';

const OPCOES: OpcaoFiltro[] = [
  { chave: 'tudo', titulo: 'Tudo', categoria: 'Saude' },
  { chave: 'hormonio', titulo: 'Hormonização', categoria: 'Saude', atendimento: ['Hormonizacao'] },
  { chave: 'mental', titulo: 'Saúde mental', categoria: 'Saude', atendimento: ['SaudeMental'] },
];

function rotuloEstabelecimento(e: Estabelecimento): string {
  const habs = e.habilitacoes.map((h) => HABILITACOES[h as CodigoHabilitacao] ?? h).join('; ');
  return `${nomeProprio(e.nome)}. ${e.bairro ? `Bairro ${nomeProprio(e.bairro)}. ` : ''}${habs}`;
}

function UnidadesSus() {
  const [hab, setHab] = useState<CodigoHabilitacao | undefined>(undefined);
  const r = useRecurso<EstabelecimentosDoMunicipio>(`cnes:${IBGE_SAO_PAULO}:${hab ?? 'todas'}`, () =>
    apiSoa.estabelecimentos(IBGE_SAO_PAULO, hab),
  );
  return (
    <Secao titulo="Habilitados no SUS para o processo transexualizador">
      <Texto suave>
        Unidades da cidade de São Paulo com habilitação do Ministério da Saúde, segundo o CNES. O acesso é por
        encaminhamento da UBS.
      </Texto>
      <LinhaDeChips>
        <Chip titulo="Todas" ativo={!hab} onPress={() => setHab(undefined)} />
        <Chip titulo="Ambulatório e hormônio" ativo={hab === '30.02'} onPress={() => setHab('30.02')} />
        <Chip titulo="Cirurgia" ativo={hab === '30.03'} onPress={() => setHab('30.03')} />
      </LinhaDeChips>
      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}
      {r.carregando && !r.dados ? (
        <Carregando texto="Consultando o CNES…" />
      ) : r.erro ? (
        <ErroSemCache erro={r.erro} indisponivel={r.indisponivel} servico="o serviço de saúde e vagas" onTentar={r.recarregar} />
      ) : !r.dados || r.dados.itens.length === 0 ? (
        <SemNada titulo="Nenhuma unidade com essa habilitação" texto="Escolha outra opção acima para ver as demais." />
      ) : (
        <View style={{ gap: espaco.m }}>
          {r.dados.itens.map((e) => (
            <Cartao
              key={e.codigo_cnes}
              rotulo={rotuloEstabelecimento(e)}
              dica="Abre endereço, telefone e o que a unidade faz"
              onPress={() => router.push({ pathname: '/cnes/[codigo]', params: { codigo: String(e.codigo_cnes) } })}
            >
              <Texto v="forte">{nomeProprio(e.nome)}</Texto>
              {e.bairro ? (
                <Texto v="apoio" suave>
                  {nomeProprio(e.bairro)}
                </Texto>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
                {e.habilitacoes.map((h) => (
                  <Selo key={h} tom="azul" texto={HABILITACOES[h as CodigoHabilitacao] ?? h} />
                ))}
              </View>
            </Cartao>
          ))}
        </View>
      )}
    </Secao>
  );
}

export default function Saude() {
  return (
    <BuscaServicos
      titulo="Saúde trans no SUS"
      apoio="Rede SAMPA Trans, hormonização e saúde mental, com o caminho para entrar."
      topo={
        <ComoEntrar
          titulo="Por onde começar"
          texto="Vá à UBS de referência da sua casa e peça para entrar na Rede SAMPA Trans. Você pode usar o nome social, é seu direito."
        />
      }
      opcoes={OPCOES}
      permitidas={['Saude']}
      depois={<UnidadesSus />}
    />
  );
}
