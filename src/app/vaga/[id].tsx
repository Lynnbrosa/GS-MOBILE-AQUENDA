import { useLocalSearchParams } from 'expo-router';
import { Alert, Linking, View } from 'react-native';
import { AvisoCache, Botao, Carregando, ComoEntrar, ErroSemCache, LinhaInfo, Secao, Selo, Texto } from '@/componentes/base';
import { TelaDetalhe } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiSoa } from '@/lib/api/soa';
import type { VagaDetalhe } from '@/lib/api/tipos';
import { haQuanto, linkSeguro, MODALIDADES, ORIGENS_VAGA } from '@/lib/formato';
import { espaco } from '@/tema/tokens';

function salario(min: number | null, max: number | null): string | null {
  const f = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  if (min && max && min !== max) return `${f(min)} a ${f(max)}`;
  if (min || max) return f((min ?? max)!);
  return null;
}

export default function DetalheVaga() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vagaId = Number(id);
  const r = useRecurso<VagaDetalhe>(Number.isFinite(vagaId) ? `vaga:${vagaId}` : null, () => apiSoa.vaga(vagaId));
  const v = r.dados;
  const link = linkSeguro(v?.url_candidatura);
  const agora = new Date();

  return (
    <TelaDetalhe secao="vagas">
      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, agora)} onTentar={r.recarregar} /> : null}
      {r.carregando && !v ? (
        <Carregando />
      ) : r.erro || !v ? (
        <ErroSemCache erro={r.erro ?? 'Vaga não encontrada.'} indisponivel={r.indisponivel} servico="o serviço de vagas" onTentar={r.recarregar} />
      ) : (
        <>
          <View style={{ gap: espaco.s }}>
            <Texto v={v.titulo.length > 60 ? 'subtitulo' : 'titulo'}>{v.titulo}</Texto>
            <Texto suave>{v.empresa}</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
              {v.afirmativa ? <Selo tom="secao" icone="heart-outline" texto="Afirmativa" /> : null}
              <Selo texto={MODALIDADES[v.modalidade]} />
              {v.exemplo ? <Selo tom="aviso" texto="Exemplo" /> : null}
            </View>
          </View>

          {v.afirmativa ? (
            <ComoEntrar
              titulo="Por que é afirmativa"
              texto={
                v.termo_afirmativo
                  ? `O anúncio cita “${v.termo_afirmativo}”. Foi esse trecho que fez o Aquenda marcar a vaga como afirmativa.`
                  : 'O anúncio fala em ação afirmativa para o público LGBTQIAPN+.'
              }
            />
          ) : null}

          <View style={{ gap: espaco.s }}>
            <Botao
              titulo={`Candidatar no site ${v.origem === 'curadoria' ? 'do programa' : `da ${ORIGENS_VAGA[v.origem]}`}`}
              icone="open-outline"
              dica="Abre o site de origem da vaga no navegador"
              desativado={!link}
              onPress={async () => {
                try {
                  await Linking.openURL(link!);
                } catch {
                  Alert.alert('Não deu para abrir o link', 'Copie o endereço da vaga no site de origem.');
                }
              }}
            />
            <Texto v="apoio" suave>
              {v.aviso}
            </Texto>
          </View>

          <Secao titulo="Detalhes">
            {v.cidade || v.uf ? (
              <LinhaInfo icone="location-outline">
                <Texto>{[v.cidade, v.uf].filter(Boolean).join(', ')}</Texto>
              </LinhaInfo>
            ) : null}
            {salario(v.salario_min, v.salario_max) ? (
              <LinhaInfo icone="cash-outline">
                <Texto>{salario(v.salario_min, v.salario_max)}</Texto>
              </LinhaInfo>
            ) : null}
            {v.publicada_em ? (
              <LinhaInfo icone="time-outline">
                <Texto>Publicada {haQuanto(v.publicada_em, agora)}</Texto>
              </LinhaInfo>
            ) : null}
          </Secao>

          {v.descricao ? (
            <Secao titulo="Sobre a vaga">
              <Texto>{v.descricao.length > 1800 ? `${v.descricao.slice(0, 1800)}…` : v.descricao}</Texto>
            </Secao>
          ) : null}

          <Texto v="apoio" suave>
            Fonte: {v.fonte}. Coletada {haQuanto(v.coletada_em, agora)}.
          </Texto>
        </>
      )}
    </TelaDetalhe>
  );
}
