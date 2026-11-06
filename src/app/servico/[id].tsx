import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import {
  AvisoCache,
  Botao,
  BotaoIcone,
  Carregando,
  Cartao,
  ComoEntrar,
  ErroSemCache,
  LinhaInfo,
  Secao,
  Selo,
  Texto,
} from '@/componentes/base';
import { abrirEContar, acoesDoServico } from '@/componentes/Servico';
import { TelaDetalhe } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiCsharp } from '@/lib/api/csharp';
import { ErroApi } from '@/lib/api/http';
import type { ServicoDetalhe, TipoInteracao, VagasCasa } from '@/lib/api/tipos';
import { alternarFavorito, ehFavorito } from '@/lib/banco';
import { CATEGORIAS, dataDaApi, faixaPreco, haQuanto, linkSeguro, rotuloAtendimento, textoAberto, tomVagas } from '@/lib/formato';
import { espaco } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';

const ACAO: Record<TipoInteracao, { titulo: string; icone: 'navigate-outline' | 'call-outline' | 'globe-outline'; dica: string }> = {
  ComoChegar: { titulo: 'Como chegar', icone: 'navigate-outline', dica: 'Abre o mapa com o endereço' },
  Ligar: { titulo: 'Ligar', icone: 'call-outline', dica: 'Abre o discador com o número' },
  AbrirSite: { titulo: 'Abrir site', icone: 'globe-outline', dica: 'Abre o site no navegador' },
};

function VagasAgora({ casaId }: { casaId: number }) {
  const { cor } = useTema();
  const r = useRecurso<VagasCasa>(`vagas-casa:${casaId}`, () => apiCsharp.vagasDaCasa(casaId));
  if (!r.dados) return null;
  const v = r.dados;
  const tom = tomVagas(v.situacao);
  return (
    <Cartao style={{ backgroundColor: tom === 'ok' ? cor.azulSuave : cor.superficie }}>
      <Texto v="apoioForte" suave>
        Vagas agora
      </Texto>
      <Texto v="subtitulo" accessibilityLiveRegion="polite">
        {v.mensagem}
      </Texto>
      {v.atualizadoEm ? (
        <Texto v="apoio" suave>
          Contagem {haQuanto(v.atualizadoEm, new Date())}
          {v.origem === 'Sensor' ? ', pelo sensor da casa' : v.origem === 'Simulado' ? ', dado de exemplo' : ', informada pela equipe'}.
          {r.doCacheDesde ? ` Guardado ${haQuanto(r.doCacheDesde, new Date())}.` : ''}
        </Texto>
      ) : null}
    </Cartao>
  );
}

export default function DetalheServico() {
  const { cor } = useTema();
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

  async function salvar() {
    if (!s) return;
    const agora = await alternarFavorito({ servicoId: s.id, nome: s.nome, categoria: s.categoria });
    setFavorito(agora);
  }

  function avisarFechou() {
    if (!s) return;
    Alert.alert(
      'Avisar que fechou?',
      'Use quando o lugar não existe mais ou mudou de endereço. O aviso é anônimo. Com 3 avisos, a equipe confere de novo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Avisar',
          onPress: async () => {
            setAvisando(true);
            try {
              const res = await apiCsharp.avisarFechamento(s.id);
              Alert.alert(
                'Aviso enviado',
                res.entrouEmRevisao ? 'Obrigado. O lugar entrou em revisão.' : 'Obrigado. A equipe vai conferir.',
              );
            } catch (e) {
              Alert.alert('Não deu para avisar agora', e instanceof ErroApi ? e.message : 'Tente de novo mais tarde.');
            } finally {
              setAvisando(false);
            }
          },
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: s ? CATEGORIAS[s.categoria] : 'Serviço',
          headerRight: () =>
            s ? (
              <BotaoIcone
                icone={favorito ? 'bookmark' : 'bookmark-outline'}
                rotulo={favorito ? 'Tirar dos salvos' : 'Salvar neste celular'}
                ativo={favorito}
                onPress={salvar}
              />
            ) : null,
        }}
      />
      <TelaDetalhe>
        {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}
        {r.carregando && !d ? (
          <Carregando />
        ) : r.erro || !d || !s ? (
          <ErroSemCache erro={r.erro ?? 'Serviço não encontrado.'} indisponivel={r.indisponivel} servico="o catálogo do Aquenda" onTentar={r.recarregar} />
        ) : (
          <>
            <View style={{ gap: espaco.s }}>
              <Texto v="titulo">{s.nome}</Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
                <Selo texto={textoAberto(s.abertoAgora).texto} tom={textoAberto(s.abertoAgora).tom} />
                {s.atendimentos.map((a) => (
                  <Selo key={a} texto={rotuloAtendimento(a)} />
                ))}
              </View>
              {d.descricao ? <Texto>{d.descricao}</Texto> : null}
            </View>

            <ComoEntrar texto={s.comoAcessar} />

            {s.categoria === 'Acolhimento' ? <VagasAgora casaId={s.id} /> : null}

            <View style={{ gap: espaco.s }}>
              {acoesDoServico(s).map((a, i) => (
                <Botao
                  key={a.tipo}
                  titulo={ACAO[a.tipo].titulo}
                  icone={ACAO[a.tipo].icone}
                  dica={ACAO[a.tipo].dica}
                  tipo={i === 0 ? 'principal' : 'secundario'}
                  onPress={async () => {
                    const ok = await abrirEContar(a.url, a.tipo, s.id);
                    if (!ok) Alert.alert('Não deu para abrir', 'Este celular não tem um app para isso.');
                  }}
                />
              ))}
            </View>

            <Secao titulo="Onde fica">
              <LinhaInfo icone="location-outline">
                <Texto>{s.endereco.sigiloso ? `${s.endereco.bairro}, ${s.endereco.cidade}` : s.endereco.texto}</Texto>
                {s.endereco.sigiloso ? (
                  <Texto v="apoio" suave>
                    O endereço desta casa é protegido para a segurança de quem mora lá. O caminho é o encaminhamento.
                  </Texto>
                ) : null}
              </LinhaInfo>
              {s.telefone ? (
                <LinhaInfo icone="call-outline">
                  <Texto>{s.telefone}</Texto>
                </LinhaInfo>
              ) : null}
            </Secao>

            {d.horarios.length > 0 ? (
              <Secao titulo="Horário">
                <Cartao>
                  {d.horarios.map((h) => (
                    <View
                      key={h.dia}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', gap: espaco.m, minHeight: 28 }}
                      accessible
                      accessibilityLabel={`${h.dia}: ${h.diaInteiro ? '24 horas' : h.abre ? `das ${h.abre} às ${h.fecha}` : 'fechado'}`}
                    >
                      <Texto style={{ textTransform: 'capitalize' }}>{h.dia}</Texto>
                      <Texto suave={!h.abre && !h.diaInteiro}>
                        {h.diaInteiro ? '24 horas' : h.abre ? `${h.abre} às ${h.fecha}` : 'Fechado'}
                      </Texto>
                    </View>
                  ))}
                </Cartao>
              </Secao>
            ) : (
              <Texto suave>O horário ainda não foi confirmado. Ligue ou confira o site antes de ir.</Texto>
            )}

            {d.acolhimento ? (
              <Secao titulo="Para quem é">
                <Texto>{d.acolhimento.publicoAlvo}</Texto>
                {d.acolhimento.exigeEncaminhamento ? <Texto suave>Precisa de encaminhamento.</Texto> : null}
              </Secao>
            ) : null}
            {d.centroReferencia?.inscreveTranscidadania ? (
              <ComoEntrar titulo="Transcidadania" texto="Aqui também é feita a inscrição no Transcidadania, o programa de renda e estudo da Prefeitura." />
            ) : null}
            {d.saude ? (
              <Secao titulo="Na rede de saúde">
                <Texto>{d.saude.tipoAtencao === 'Primaria' ? 'Atenção básica (porta de entrada).' : 'Atenção especializada.'}</Texto>
                {d.saude.redeSampaTrans ? <Texto>Faz parte da Rede SAMPA Trans.</Texto> : null}
                {d.saude.exigeEncaminhamento ? <Texto suave>Precisa de encaminhamento da UBS.</Texto> : null}
              </Secao>
            ) : null}
            {d.juridico ? (
              <Secao titulo="O que resolve">
                <Texto>{d.juridico.orgao}</Texto>
                {d.juridico.atendeRetificacao ? <Texto>Ajuda na retificação de nome e gênero.</Texto> : null}
                {d.juridico.recebeDenuncia ? <Texto>Recebe denúncia de LGBTfobia.</Texto> : null}
              </Secao>
            ) : null}
            {d.role ? (
              <Secao titulo="Sobre o lugar">
                <Texto>{faixaPreco(d.role.faixaPreco)}</Texto>
                <Texto>{d.role.acessivel ? 'Tem acessibilidade para cadeira de rodas.' : 'Sem informação de acessibilidade.'}</Texto>
              </Secao>
            ) : null}

            <View style={{ gap: espaco.s }}>
              <Texto v="apoio" suave>
                Conferido em {dataDaApi(s.verificadoEm)}.{s.precisaRevisao ? ' Em revisão: pode ter mudado.' : ''}
              </Texto>
              {linkSeguro(s.fonte) ? (
                <Botao
                  titulo="Ver a fonte pública"
                  tipo="discreto"
                  icone="document-text-outline"
                  onPress={() => Linking.openURL(s.fonte)}
                  style={{ alignSelf: 'flex-start' }}
                />
              ) : null}
              <Botao
                titulo="Avisar que fechou"
                tipo="discreto"
                icone="flag-outline"
                carregando={avisando}
                onPress={avisarFechou}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
            <View style={{ height: 1, backgroundColor: cor.linha }} />
          </>
        )}
      </TelaDetalhe>
    </>
  );
}
