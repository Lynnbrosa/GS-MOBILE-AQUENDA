import { useLocalSearchParams } from 'expo-router';
import { Alert, Linking, View } from 'react-native';
import { AvisoCache, Botao, Carregando, ComoEntrar, ErroSemCache, LinhaInfo, Secao, Selo, Texto } from '@/componentes/base';
import { TelaDetalhe } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiSoa, HABILITACOES, type CodigoHabilitacao } from '@/lib/api/soa';
import type { Estabelecimento } from '@/lib/api/tipos';
import { dataDaApi, haQuanto, linkMapa, linkTelefone, nomeProprio } from '@/lib/formato';
import { espaco } from '@/tema/tokens';

export default function DetalheCnes() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const cod = Number(codigo);
  const r = useRecurso<Estabelecimento>(Number.isFinite(cod) ? `cnes:${cod}` : null, () => apiSoa.estabelecimento(cod));
  const e = r.dados;

  async function abrir(url: string | null) {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Não deu para abrir', 'Este celular não tem um app para isso.');
    }
  }

  return (
    <TelaDetalhe secao="saude">
      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}
      {r.carregando && !e ? (
        <Carregando />
      ) : r.erro || !e ? (
        <ErroSemCache erro={r.erro ?? 'Unidade não encontrada.'} indisponivel={r.indisponivel} servico="o serviço de saúde" onTentar={r.recarregar} />
      ) : (
        <>
          <View style={{ gap: espaco.s }}>
            <Texto v="titulo">{nomeProprio(e.nome)}</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
              {e.atende_sus ? <Selo tom="ok" texto="Atende pelo SUS" /> : null}
              {e.habilitacoes.map((h) => (
                <Selo key={h} tom="secao" texto={HABILITACOES[h as CodigoHabilitacao] ?? h} />
              ))}
            </View>
          </View>
          <ComoEntrar texto="O atendimento aqui é por encaminhamento. Comece pela UBS da sua casa e peça para ser encaminhade." />
          <View style={{ gap: espaco.s }}>
            {e.endereco ? (
              <Botao
                titulo="Como chegar"
                icone="navigate-outline"
                onPress={() => abrir(linkMapa(e.nome, `${e.endereco}, ${e.bairro ?? ''}, São Paulo`, e.latitude, e.longitude))}
              />
            ) : null}
            {e.telefone && linkTelefone(e.telefone) ? (
              <Botao titulo="Ligar" icone="call-outline" tipo="secundario" onPress={() => abrir(linkTelefone(e.telefone!))} />
            ) : null}
          </View>
          <Secao titulo="Onde fica">
            <LinhaInfo icone="location-outline">
              <Texto>{[e.endereco && nomeProprio(e.endereco), e.bairro && nomeProprio(e.bairro)].filter(Boolean).join(', ')}</Texto>
            </LinhaInfo>
            {e.telefone ? (
              <LinhaInfo icone="call-outline">
                <Texto>{e.telefone}</Texto>
              </LinhaInfo>
            ) : null}
            {e.turno ? (
              <LinhaInfo icone="time-outline">
                <Texto>{e.turno.charAt(0) + e.turno.slice(1).toLowerCase()}</Texto>
              </LinhaInfo>
            ) : null}
          </Secao>
          <Texto v="apoio" suave>
            Código CNES {e.codigo_cnes}.{e.atualizado_no_cnes ? ` Atualizado no CNES em ${dataDaApi(e.atualizado_no_cnes)}.` : ''} Fonte: {e.fonte}.
          </Texto>
        </>
      )}
    </TelaDetalhe>
  );
}
