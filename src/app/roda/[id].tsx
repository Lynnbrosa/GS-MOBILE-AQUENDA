import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, View } from 'react-native';
import { AvisoCache, Botao, Carregando, ComoEntrar, ErroSemCache, LinhaInfo, Selo, Texto } from '@/componentes/base';
import { TelaDetalhe } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiCsharp } from '@/lib/api/csharp';
import type { Roda } from '@/lib/api/tipos';
import { haQuanto, linkSeguro, quandoFuturo } from '@/lib/formato';
import { horaTexto } from '@/lib/agenda';
import { espaco } from '@/tema/tokens';

export default function DetalheRoda() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rodaId = Number(id);
  const r = useRecurso<Roda>(Number.isFinite(rodaId) ? `roda:${rodaId}` : null, () => apiCsharp.roda(rodaId));
  const roda = r.dados;
  const agora = new Date();

  return (
    <TelaDetalhe secao="rodas">
      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, agora)} onTentar={r.recarregar} /> : null}
      {r.carregando && !roda ? (
        <Carregando />
      ) : r.erro || !roda ? (
        <ErroSemCache erro={r.erro ?? 'Roda não encontrada.'} indisponivel={r.indisponivel} servico="a agenda de rodas" onTentar={r.recarregar} />
      ) : (
        <>
          <View style={{ gap: espaco.s }}>
            <Texto v="titulo">{roda.titulo}</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
              <Selo tom="secao" texto={roda.presencial ? 'Presencial' : 'Online'} />
              <Selo texto={roda.idadeMinima > 0 ? `A partir de ${roda.idadeMinima} anos` : 'Livre'} />
              {roda.exemplo ? <Selo tom="aviso" texto="Exemplo" /> : null}
            </View>
            {roda.descricao ? <Texto>{roda.descricao}</Texto> : null}
          </View>
          <LinhaInfo icone="time-outline">
            <Texto>
              {quandoFuturo(new Date(roda.inicio), agora)}, até {horaTexto(new Date(roda.fim).getHours(), new Date(roda.fim).getMinutes())}
            </Texto>
          </LinhaInfo>
          {roda.local ? (
            <LinhaInfo icone="location-outline">
              <Texto>{roda.local.nome}</Texto>
              <Texto v="apoio" suave>
                {roda.local.endereco}
              </Texto>
            </LinhaInfo>
          ) : null}
          <LinhaInfo icone="people-outline">
            <Texto>Organizado por {roda.organizador}</Texto>
          </LinhaInfo>
          <ComoEntrar
            titulo="Combinado da roda"
            texto="Respeite o nome e os pronomes de cada pessoa. O que é contado na roda fica na roda."
          />
          {roda.local ? (
            <Botao
              titulo="Ver o local"
              icone="home-outline"
              onPress={() => router.push({ pathname: '/servico/[id]', params: { id: String(roda.local!.id) } })}
            />
          ) : null}
          {linkSeguro(roda.linkGrupo) ? (
            <Botao
              titulo="Entrar no grupo da ONG"
              icone="open-outline"
              dica="Abre o grupo moderado pela organização"
              onPress={() => Linking.openURL(roda.linkGrupo!).catch(() => Alert.alert('Não deu para abrir o link'))}
            />
          ) : null}
        </>
      )}
    </TelaDetalhe>
  );
}
