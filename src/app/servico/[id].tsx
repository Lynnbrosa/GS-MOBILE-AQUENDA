import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { AvisoCache, Botao, BotaoIcone, Carregando, Cartao, ComoEntrar, ErroSemCache, LinhaInfo, Secao, Selo, Texto } from '@/componentes/base';
import { abrirEContar, acoesDoServico } from '@/componentes/Servico';
import { TelaDetalhe } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiCsharp } from '@/lib/api/csharp';
import { ErroApi } from '@/lib/api/http';
import type { Categoria, ServicoDetalhe, TipoInteracao, VagasCasa } from '@/lib/api/tipos';
import { alternarFavorito, ehFavorito } from '@/lib/banco';
import { dataDaApi, faixaPreco, haQuanto, linkSeguro, rotuloAtendimento, textoAberto } from '@/lib/formato';
import { espaco, type NomeSecao } from '@/tema/tokens';
import { useSecao } from '@/tema/useTema';

const ACAO: Record<TipoInteracao, { titulo: string; icone: 'navigate' | 'call' | 'globe-outline' }> = {
  ComoChegar: { titulo: 'Como chegar', icone: 'navigate' },
  Ligar: { titulo: 'Ligar', icone: 'call' },
  AbrirSite: { titulo: 'Site', icone: 'globe-outline' },
};

const SECAO_DA_CATEGORIA: Record<Categoria, NomeSecao> = {
  Acolhimento: 'casa',
  CentroReferencia: 'casa',
  Juridico: 'casa',
  Saude: 'saude',
  Role: 'roles',
};

function VagasAgora({ casaId, secao }: { casaId: number; secao: NomeSecao }) {
  const s = useSecao(secao);
  const r = useRecurso<VagasCasa>(`vagas-casa:${casaId}`, () => apiCsharp.vagasDaCasa(casaId));
  if (!r.dados || r.dados.situacao === 'SemLeitura') return null;
  const v = r.dados;
  return (
    <View style={{ gap: 2 }} accessible accessibilityLabel={`Vagas agora: ${v.mensagem}`} accessibilityLiveRegion="polite">
      <Texto v="enorme" cor={s.acao}>
        {v.situacao === 'Disponivel' ? v.livres : v.situacao === 'Lotada' ? 'Lotada' : '?'}
      </Texto>
      <Texto v="forte">{v.situacao === 'Disponivel' ? (v.livres === 1 ? 'vaga agora' : 'vagas agora') : v.mensagem}</Texto>
      {v.atualizadoEm ? (
        <Texto v="apoio" suave>
          Contado {haQuanto(v.atualizadoEm, new Date())}
          {v.origem === 'Sensor' ? ' pelo sensor da casa' : v.origem === 'Simulado' ? ' (exemplo)' : ''}
        </Texto>
      ) : null}
    </View>
  );
}

export default function DetalheServico() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const servicoId = Number(id);
  const r = useRecurso<ServicoDetalhe>(Number.isFinite(servicoId) ? `servico:${servicoId}` : null, () => apiCsharp.servico(servicoId));
  const [favorito, setFavorito] = useState(false);
  const [avisando, setAvisando] = useState(false);

  useEffect(() => {
    ehFavorito(servicoId).then(setFavorito).catch(() => undefined);
  }, [servicoId]);

  const d = r.dados;
  const s = d?.resumo;
  const secao = s ? SECAO_DA_CATEGORIA[s.categoria] : 'casa';

  function avisarFechou() {
    if (!s) return;
    Alert.alert('Avisar que fechou?', 'É anônimo. Com 3 avisos, a equipe confere de novo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Avisar',
        onPress: async () => {
          setAvisando(true);
          try {
            const res = await apiCsharp.avisarFechamento(s.id);
            Alert.alert('Obrigado', res.entrouEmRevisao ? 'O lugar entrou em revisão.' : 'A equipe vai conferir.');
          } catch (e) {
            Alert.alert('Não deu agora', e instanceof ErroApi ? e.message : 'Tente mais tarde.');
          } finally {
            setAvisando(false);
          }
        },
      },
    ]);
  }

  const acoes = s ? acoesDoServico(s) : [];

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () =>
            s ? (
              <BotaoIcone
                icone={favorito ? 'bookmark' : 'bookmark-outline'}
                rotulo={favorito ? 'Tirar dos salvos' : 'Salvar neste celular'}
                ativo={favorito}
                onPress={async () => setFavorito(await alternarFavorito({ servicoId: s.id, nome: s.nome, categoria: s.categoria }))}
              />
            ) : null,
        }}
      />
      <TelaDetalhe secao={secao}>
        {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}
        {r.carregando && !d ? (
          <Carregando />
        ) : r.erro || !d || !s ? (
          <ErroSemCache erro={r.erro ?? 'Serviço não encontrado.'} indisponivel={r.indisponivel} onTentar={r.recarregar} />
        ) : (
          <>
            <View style={{ gap: espaco.s }}>
              <Texto v="titulo">{s.nome}</Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
                <Selo texto={textoAberto(s.abertoAgora).texto} tom={s.abertoAgora ? 'ok' : 'neutro'} />
                {s.atendimentos.slice(0, 3).map((a) => (
                  <Selo key={a} texto={rotuloAtendimento(a)} />
                ))}
              </View>
            </View>

            {s.categoria === 'Acolhimento' ? <VagasAgora casaId={s.id} secao={secao} /> : null}

            <ComoEntrar texto={s.comoAcessar} />

            {acoes.length ? (
              <View style={{ flexDirection: 'row', gap: espaco.s, flexWrap: 'wrap' }}>
                {acoes.map((a, i) => (
                  <Botao
                    key={a.tipo}
                    titulo={ACAO[a.tipo].titulo}
                    icone={ACAO[a.tipo].icone}
                    tipo={i === 0 ? 'principal' : 'secundario'}
                    style={i === 0 ? { flexGrow: 1 } : undefined}
                    onPress={async () => {
                      if (!(await abrirEContar(a.url, a.tipo, s.id))) Alert.alert('Não deu para abrir');
                    }}
                  />
                ))}
              </View>
            ) : null}

            <View style={{ gap: espaco.m }}>
              <LinhaInfo icone="location-outline">
                <Texto>{s.endereco.sigiloso ? `${s.endereco.bairro} (endereço protegido)` : s.endereco.texto}</Texto>
              </LinhaInfo>
              {s.telefone ? (
                <LinhaInfo icone="call-outline">
                  <Texto>{s.telefone}</Texto>
                </LinhaInfo>
              ) : null}
              {d.acolhimento ? (
                <LinhaInfo icone="people-outline">
                  <Texto>{d.acolhimento.publicoAlvo}</Texto>
                </LinhaInfo>
              ) : null}
              {d.role ? (
                <LinhaInfo icone="pricetag-outline">
                  <Texto>
                    {faixaPreco(d.role.faixaPreco)}
                    {d.role.acessivel ? ', acessível' : ''}
                  </Texto>
                </LinhaInfo>
              ) : null}
              {d.centroReferencia?.inscreveTranscidadania ? (
                <LinhaInfo icone="school-outline">
                  <Texto>Inscrição no Transcidadania</Texto>
                </LinhaInfo>
              ) : null}
              {d.juridico?.atendeRetificacao ? (
                <LinhaInfo icone="document-text-outline">
                  <Texto>Retificação de nome e gênero</Texto>
                </LinhaInfo>
              ) : null}
            </View>

            {d.horarios.length > 0 ? (
              <Secao titulo="Horário">
                <Cartao>
                  {d.horarios.map((h) => (
                    <View
                      key={h.dia}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 30 }}
                      accessible
                      accessibilityLabel={`${h.dia}: ${h.diaInteiro ? '24 horas' : h.abre ? `das ${h.abre} às ${h.fecha}` : 'fechado'}`}
                    >
                      <Texto style={{ textTransform: 'capitalize' }}>{h.dia}</Texto>
                      <Texto suave={!h.abre && !h.diaInteiro}>{h.diaInteiro ? '24 horas' : h.abre ? `${h.abre}–${h.fecha}` : 'Fechado'}</Texto>
                    </View>
                  ))}
                </Cartao>
              </Secao>
            ) : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
              <Texto v="apoio" suave style={{ flex: 1, minWidth: 160 }}>
                Conferido em {dataDaApi(s.verificadoEm)}
                {s.precisaRevisao ? ', em revisão' : ''}
              </Texto>
              {linkSeguro(s.fonte) ? <Botao titulo="Fonte" tipo="discreto" onPress={() => Linking.openURL(s.fonte)} /> : null}
              <Botao titulo="Avisar que fechou" tipo="discreto" carregando={avisando} onPress={avisarFechou} />
            </View>
          </>
        )}
      </TelaDetalhe>
    </>
  );
}
