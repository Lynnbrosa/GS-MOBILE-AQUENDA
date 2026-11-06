import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AvisoCache, Carregando, Cartao, Chip, ErroSemCache, LinhaDeChips, Selo, SemNada, Texto } from '@/componentes/base';
import { Tela } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiCsharp } from '@/lib/api/csharp';
import type { Roda } from '@/lib/api/tipos';
import { dataHoraCurta, haQuanto, quandoFuturo } from '@/lib/formato';
import { espaco } from '@/tema/tokens';

export default function Rodas() {
  const [presencial, setPresencial] = useState<boolean | undefined>(undefined);
  const r = useRecurso<Roda[]>(`rodas:${presencial ?? 'todas'}`, () => apiCsharp.rodas({ presencial }));
  const agora = new Date();

  return (
    <Tela
      titulo="Rodas de conversa"
      apoio="Encontros dos Centros de Referência e grupos que ONGs parceiras já moderam. Aqui não tem chat: você vai ao encontro ou entra no grupo da ONG."
      recarregando={r.carregando && !!r.dados}
      onRecarregar={r.recarregar}
    >
      <LinhaDeChips>
        <Chip titulo="Todas" ativo={presencial === undefined} onPress={() => setPresencial(undefined)} />
        <Chip titulo="Presenciais" icone="location-outline" ativo={presencial === true} onPress={() => setPresencial(true)} />
        <Chip titulo="Online" icone="chatbubbles-outline" ativo={presencial === false} onPress={() => setPresencial(false)} />
      </LinhaDeChips>

      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, agora)} onTentar={r.recarregar} /> : null}

      {r.carregando && !r.dados ? (
        <Carregando texto="Buscando a agenda de rodas…" />
      ) : r.erro ? (
        <ErroSemCache erro={r.erro} indisponivel={r.indisponivel} servico="a agenda de rodas" onTentar={r.recarregar} />
      ) : !r.dados || r.dados.length === 0 ? (
        <SemNada
          icone="people-outline"
          titulo="Nenhuma roda marcada nos próximos 60 dias"
          texto="Os Centros de Referência LGBTI+ também têm atividades toda semana. Vale ligar ou passar lá."
        />
      ) : (
        <View style={{ gap: espaco.m }}>
          {r.dados.map((roda) => {
            const inicio = new Date(roda.inicio);
            return (
              <Cartao
                key={roda.id}
                onPress={() => router.push({ pathname: '/roda/[id]', params: { id: String(roda.id) } })}
                rotulo={`${roda.titulo}. ${dataHoraCurta(inicio)}. ${roda.presencial ? `Presencial, ${roda.local?.nome ?? ''}` : 'Online'}. Organizado por ${roda.organizador}.`}
                dica="Abre os detalhes da roda"
              >
                <Texto v="apoioForte" cor={undefined} suave>
                  {quandoFuturo(inicio, agora)}
                </Texto>
                <Texto v="forte">{roda.titulo}</Texto>
                <Texto v="apoio" suave>
                  {roda.presencial ? roda.local?.nome ?? 'Local a confirmar' : 'Online, no grupo da ONG'}
                </Texto>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
                  <Selo texto={roda.presencial ? 'Presencial' : 'Online'} tom="azul" />
                  {roda.idadeMinima > 0 ? <Selo texto={`${roda.idadeMinima}+`} /> : <Selo texto="Livre" />}
                  {roda.exemplo ? <Selo texto="Exemplo" tom="aviso" /> : null}
                </View>
              </Cartao>
            );
          })}
        </View>
      )}
    </Tela>
  );
}
