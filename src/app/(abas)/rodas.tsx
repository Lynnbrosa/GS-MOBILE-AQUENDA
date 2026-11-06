import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AvisoCache, Carregando, ErroSemCache, Linha, Secao, Selo, SemNada, Texto } from '@/componentes/base';
import { Tela } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiChat } from '@/lib/api/chat';
import { apiCsharp } from '@/lib/api/csharp';
import type { Roda, Sala } from '@/lib/api/tipos';
import { haQuanto, quandoFuturo } from '@/lib/formato';
import { lerParticipante, type EuNasSalas } from '@/lib/participante';

export default function Conversa() {
  const salas = useRecurso<Sala[]>('salas', () => apiChat.salas());
  const rodas = useRecurso<Roda[]>('rodas:todas', () => apiCsharp.rodas({}));
  const [eu, setEu] = useState<EuNasSalas | null>(null);
  const agora = new Date();
  const recarregarSalas = salas.recarregar;

  useFocusEffect(
    useCallback(() => {
      lerParticipante().then(setEu).catch(() => setEu(null));
      recarregarSalas();
    }, [recarregarSalas]),
  );

  function abrir(s: Sala) {
    if (eu) router.push({ pathname: '/sala/[id]', params: { id: String(s.id), nome: s.nome } });
    else router.push({ pathname: '/salas/entrar', params: { sala: String(s.id), nome: s.nome } });
  }

  return (
    <Tela
      secao="rodas"
      titulo="Conversa"
      apoio={eu ? `Você entra como ${eu.apelido}.` : 'Salas 18+ com moderação. Só apelido.'}
      recarregando={salas.carregando && !!salas.dados}
      onRecarregar={() => {
        salas.recarregar();
        rodas.recarregar();
      }}
    >
      <Secao titulo="Salas">
        {salas.doCacheDesde ? <AvisoCache desde={haQuanto(salas.doCacheDesde, agora)} onTentar={salas.recarregar} /> : null}
        {salas.carregando && !salas.dados ? (
          <Carregando />
        ) : salas.erro ? (
          <ErroSemCache erro={salas.erro} indisponivel={salas.indisponivel} onTentar={salas.recarregar} />
        ) : (
          <View>
            {(salas.dados ?? []).map((s) => (
              <Linha
                key={s.id}
                titulo={s.nome}
                apoio={s.descricao}
                rotulo={`Sala ${s.nome}. ${s.descricao}. ${s.aberta ? `${s.mensagensUltimas24h} mensagens nas últimas 24 horas` : 'Fechada agora'}.`}
                dica={eu ? 'Abre a conversa' : 'Escolha um apelido para entrar'}
                onPress={() => (s.aberta ? abrir(s) : undefined)}
                selo={!s.aberta ? <Selo texto="Fechada agora" /> : s.mensagensUltimas24h > 0 ? <Selo tom="secao" texto={s.mensagensUltimas24h === 1 ? '1 mensagem hoje' : `${s.mensagensUltimas24h} hoje`} /> : null}
              />
            ))}
          </View>
        )}
      </Secao>

      <Secao titulo="Rodas presenciais">
        {rodas.carregando && !rodas.dados ? (
          <Carregando />
        ) : !rodas.dados || rodas.dados.length === 0 ? (
          <SemNada titulo="Nenhuma roda marcada" texto="Os Centros de Referência têm atividades toda semana." />
        ) : (
          <View>
            {rodas.dados.map((r) => (
              <Linha
                key={r.id}
                titulo={r.titulo}
                apoio={`${quandoFuturo(new Date(r.inicio), agora)}${r.local ? `, ${r.local.nome}` : ''}`}
                onPress={() => router.push({ pathname: '/roda/[id]', params: { id: String(r.id) } })}
                selo={r.exemplo ? <Selo tom="aviso" texto="Exemplo" /> : null}
              />
            ))}
          </View>
        )}
      </Secao>
      <Texto v="apoio" suave>
        Não tem conversa privada. Na sala, toque e segure uma mensagem para denunciar ou bloquear.
      </Texto>
    </Tela>
  );
}
