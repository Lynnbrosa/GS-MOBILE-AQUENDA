import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { Botao, Campo, Carregando, Texto } from '@/componentes/base';
import { Mascote } from '@/componentes/Mascote';
import { TelaDetalhe } from '@/componentes/Tela';
import { useRecurso } from '@/estado/useRecurso';
import { apiChat } from '@/lib/api/chat';
import { ErroApi } from '@/lib/api/http';
import { validarApelido } from '@/lib/conversa';
import { entrarNasSalas } from '@/lib/participante';
import { espaco } from '@/tema/tokens';
import { useSecao, useTema } from '@/tema/useTema';

function Interruptor({ titulo, valor, onMudar }: { titulo: string; valor: boolean; onMudar: (v: boolean) => void }) {
  const { cor } = useTema();
  const s = useSecao('rodas');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.m, minHeight: 48 }}>
      <Texto v="forte" style={{ flex: 1 }}>
        {titulo}
      </Texto>
      <Switch accessibilityLabel={titulo} value={valor} onValueChange={onMudar} trackColor={{ true: s.acao, false: cor.linha }} thumbColor={cor.superficie} />
    </View>
  );
}

export default function Entrar() {
  const { cor } = useTema();
  const s = useSecao('rodas');
  const { sala, nome } = useLocalSearchParams<{ sala?: string; nome?: string }>();
  const regras = useRecurso<string[]>('chat:regras', () => apiChat.regras());
  const [apelido, setApelido] = useState('');
  const [aceito, setAceito] = useState(false);
  const [maior, setMaior] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    const problema = validarApelido(apelido);
    if (problema) return setErro(problema);
    if (!aceito) return setErro('Para entrar, confirme que leu as regras.');
    if (!maior) return setErro('As salas são só para quem tem 18 anos ou mais.');
    setErro(null);
    setEntrando(true);
    try {
      await entrarNasSalas(apelido);
      if (sala) router.replace({ pathname: '/sala/[id]', params: { id: sala, nome: nome ?? '' } });
      else router.back();
    } catch (e) {
      setErro(e instanceof ErroApi ? (e.indisponivel ? 'Sem conexão agora. Tente de novo.' : e.message) : 'Não deu para entrar agora.');
    } finally {
      setEntrando(false);
    }
  }

  return (
    <TelaDetalhe secao="rodas">
      <View style={{ alignItems: 'center', gap: espaco.s }}>
        <Mascote tamanho={110} />
        <Texto v="titulo" style={{ textAlign: 'center' }}>
          {nome ? `Entrar em ${nome}` : 'Entrar nas salas'}
        </Texto>
      </View>
      <View style={{ gap: espaco.m, backgroundColor: s.suave, borderRadius: 24, padding: espaco.l }}>
        <Texto v="apoioForte" cor={s.sobreSuave}>
          Combinados
        </Texto>
        {regras.carregando && !regras.dados ? (
          <Carregando />
        ) : (
          (regras.dados ?? ['Só para 18+.', 'Só apelido: sem foto, telefone, e-mail ou link.', 'Sem conversa privada.', 'Viu algo errado? Denuncie.']).map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' }}>
              <Ionicons name="heart" size={16} color={s.sobreSuave} style={{ marginTop: 4 }} />
              <Texto cor={s.sobreSuave} style={{ flex: 1 }}>
                {r}
              </Texto>
            </View>
          ))
        )}
      </View>
      <Campo rotulo="Seu apelido" placeholder="Como quer ser chamade" value={apelido} onChangeText={setApelido} maxLength={24} autoCorrect={false} ajuda="Não use seu nome de registro." />
      <Interruptor titulo="Li e aceito os combinados" valor={aceito} onMudar={setAceito} />
      <Interruptor titulo="Tenho 18 anos ou mais" valor={maior} onMudar={setMaior} />
      {erro ? (
        <Texto v="apoioForte" cor={cor.perigo} accessibilityLiveRegion="assertive">
          {erro}
        </Texto>
      ) : null}
      <Botao titulo="Entrar" onPress={entrar} carregando={entrando} desativado={!apelido.trim()} />
    </TelaDetalhe>
  );
}
