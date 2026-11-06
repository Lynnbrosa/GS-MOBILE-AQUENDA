import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { Botao, Campo, Cartao, Secao, Texto } from '@/componentes/base';
import { TecladoPin } from '@/componentes/TecladoPin';
import { TelaDetalhe } from '@/componentes/Tela';
import { useSessao } from '@/estado/Sessao';
import { apagarTudo, desbloquear, gravarPreferencia, listarBloqueados } from '@/lib/banco';
import { definirUrlPersonalizada, urlBase, urlPadraoAtual, urlValida, type NomeApi } from '@/lib/config';
import { definirPin, removerPin, trocaIconeDisponivel } from '@/lib/discreto';
import { cancelarTodas } from '@/lib/notificacoes';
import { lerParticipante, sairDasSalas, type EuNasSalas } from '@/lib/participante';
import { PIN_MIN, validarPin } from '@/lib/pin';
import { espaco } from '@/tema/tokens';
import { useSecao, useTema } from '@/tema/useTema';

function LinhaInterruptor({ titulo, texto, valor, onMudar }: { titulo: string; texto: string; valor: boolean; onMudar: (v: boolean) => void }) {
  const { cor } = useTema();
  const s = useSecao();
  return (
    <View style={{ flexDirection: 'row', gap: espaco.m, alignItems: 'center' }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Texto v="forte">{titulo}</Texto>
        <Texto v="apoio" suave>
          {texto}
        </Texto>
      </View>
      <Switch
        accessibilityLabel={titulo}
        accessibilityHint={texto}
        value={valor}
        onValueChange={onMudar}
        trackColor={{ true: s.acao, false: cor.linha }}
        thumbColor={cor.superficie}
      />
    </View>
  );
}

function CriarPin({ onPronto, onCancelar }: { onPronto: () => void; onCancelar: () => void }) {
  const { cor } = useTema();
  const [primeiro, setPrimeiro] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function continuar() {
    if (primeiro === null) {
      const problema = validarPin(pin);
      if (problema) {
        setErro(problema);
        setPin('');
        return;
      }
      setPrimeiro(pin);
      setPin('');
      setErro(null);
      return;
    }
    if (pin !== primeiro) {
      setErro('Os dois PINs não batem. Comece de novo.');
      setPrimeiro(null);
      setPin('');
      return;
    }
    await definirPin(pin);
    onPronto();
  }

  return (
    <Cartao style={{ alignItems: 'center', gap: espaco.l }}>
      <Texto v="forte">{primeiro === null ? 'Escolha um PIN de 4 a 6 números' : 'Digite o PIN de novo'}</Texto>
      {erro ? (
        <Texto v="apoioForte" cor={cor.perigo} accessibilityLiveRegion="assertive">
          {erro}
        </Texto>
      ) : null}
      <TecladoPin valor={pin} onMudar={setPin} />
      <View style={{ flexDirection: 'row', gap: espaco.m, alignSelf: 'stretch' }}>
        <Botao titulo="Cancelar" tipo="secundario" onPress={onCancelar} style={{ flex: 1 }} />
        <Botao titulo="Continuar" onPress={continuar} desativado={pin.length < PIN_MIN} style={{ flex: 1 }} />
      </View>
    </Cartao>
  );
}

function Salas() {
  const [eu, setEu] = useState<EuNasSalas | null>(null);
  const [bloqueados, setBloqueados] = useState<string[]>([]);
  const carregar = useCallback(() => {
    lerParticipante().then(setEu).catch(() => setEu(null));
    listarBloqueados().then(setBloqueados).catch(() => setBloqueados([]));
  }, []);
  useFocusEffect(carregar);

  function sair() {
    Alert.alert('Sair das salas?', 'Este celular esquece seu apelido. Suas mensagens somem do servidor em até 7 dias.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await sairDasSalas(); carregar(); } },
    ]);
  }

  return (
    <Secao titulo="Salas de conversa">
      <Texto>{eu ? `Você entra como ${eu.apelido}.` : 'Você ainda não entrou em nenhuma sala.'}</Texto>
      {bloqueados.map((b) => (
        <View key={b} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Texto style={{ flex: 1 }}>{b} (bloqueade)</Texto>
          <Botao titulo="Desbloquear" tipo="discreto" onPress={async () => { await desbloquear(b); carregar(); }} />
        </View>
      ))}
      {eu ? <Botao titulo="Sair das salas" tipo="secundario" icone="log-out-outline" onPress={sair} /> : null}
    </Secao>
  );
}

function Enderecos() {
  const [cs, setCs] = useState(urlBase('csharp'));
  const [soa, setSoa] = useState(urlBase('soa'));
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!urlValida(cs) || !urlValida(soa)) {
      setErro('Use um endereço completo, como http://192.168.0.10:5000');
      return;
    }
    setErro(null);
    const pares: [NomeApi, string][] = [
      ['csharp', cs],
      ['soa', soa],
    ];
    for (const [api, url] of pares) {
      const personalizado = url.trim() !== urlPadraoAtual(api) ? url.trim() : null;
      definirUrlPersonalizada(api, personalizado);
      await gravarPreferencia(`url.${api}`, personalizado);
    }
    Alert.alert('Endereços salvos', 'As próximas buscas usam esses endereços.');
  }

  async function restaurar() {
    for (const api of ['csharp', 'soa'] as NomeApi[]) {
      definirUrlPersonalizada(api, null);
      await gravarPreferencia(`url.${api}`, null);
    }
    setCs(urlPadraoAtual('csharp'));
    setSoa(urlPadraoAtual('soa'));
  }

  return (
    <Secao titulo="Endereço dos serviços">
      <Texto v="apoio" suave>
        Para testar no celular, use o IP do computador onde as APIs estão rodando, na mesma rede Wi-Fi.
      </Texto>
      <Campo rotulo="Catálogo, casas e rodas (API C#)" value={cs} onChangeText={setCs} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      <Campo rotulo="Vagas e CNES (FastAPI)" value={soa} onChangeText={setSoa} autoCapitalize="none" autoCorrect={false} keyboardType="url" erro={erro} />
      <View style={{ flexDirection: 'row', gap: espaco.m }}>
        <Botao titulo="Restaurar" tipo="secundario" onPress={restaurar} style={{ flex: 1 }} />
        <Botao titulo="Salvar" onPress={salvar} style={{ flex: 1 }} />
      </View>
    </Secao>
  );
}

export default function Ajustes() {
  const { discreto, definirDiscreto, temPin, atualizarPin } = useSessao();
  const [criandoPin, setCriandoPin] = useState(false);

  async function mudarDiscreto(v: boolean) {
    await definirDiscreto(v);
    if (v) {
      Alert.alert(
        'Modo discreto ligado',
        trocaIconeDisponivel()
          ? 'Na tela inicial do celular, o app passa a se chamar Clima, com ícone de tempo. O launcher pode levar alguns segundos para trocar. O app agora abre na tela de clima: toque e segure no nome da cidade para entrar.'
          : 'O app agora abre na tela de clima: toque e segure no nome da cidade para entrar. As notificações ficam com texto neutro.',
      );
    }
  }

  function tirarPin() {
    Alert.alert('Tirar o PIN?', 'Qualquer pessoa com o celular vai conseguir abrir o app.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Tirar',
        style: 'destructive',
        onPress: async () => {
          await removerPin();
          await atualizarPin();
        },
      },
    ]);
  }

  function apagarDados() {
    Alert.alert(
      'Apagar tudo deste celular?',
      'Somem a agenda, as consultas, os salvos, o PIN e o que foi guardado das buscas. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: async () => {
            await cancelarTodas();
            await sairDasSalas();
            await apagarTudo();
            await removerPin();
            await atualizarPin();
            if (discreto) await definirDiscreto(false);
            router.replace('/');
          },
        },
      ],
    );
  }

  return (
    <TelaDetalhe>
      <Secao titulo="Proteção">
        <LinhaInterruptor
          titulo="Modo discreto"
          texto='Nome e ícone "Clima" na tela inicial, app abre numa previsão do tempo e notificações sem detalhes.'
          valor={discreto}
          onMudar={mudarDiscreto}
        />
        {criandoPin ? (
          <CriarPin
            onCancelar={() => setCriandoPin(false)}
            onPronto={async () => {
              setCriandoPin(false);
              await atualizarPin();
              Alert.alert('PIN criado', 'O app pede o PIN ao abrir e quando volta do fundo.');
            }}
          />
        ) : temPin ? (
          <View style={{ gap: espaco.s }}>
            <Texto>O PIN está ligado. Ele fica guardado de forma protegida só neste celular.</Texto>
            <View style={{ flexDirection: 'row', gap: espaco.m }}>
              <Botao titulo="Trocar PIN" tipo="secundario" onPress={() => setCriandoPin(true)} style={{ flex: 1 }} />
              <Botao titulo="Tirar PIN" tipo="secundario" onPress={tirarPin} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <Botao titulo="Criar PIN" icone="lock-closed-outline" onPress={() => setCriandoPin(true)} />
        )}
        <Texto v="apoio" suave>
          O botão Sair, no topo de todas as abas, troca na hora para a tela de clima.
        </Texto>
      </Secao>

      <Salas />

      <Enderecos />

      <Secao titulo="Seus dados">
        <Texto>
          Agenda, consultas, salvos e PIN ficam só neste celular. Nas buscas, o app manda o filtro e, se você pedir
          "perto de mim", a posição aproximada, que não é guardada. Os toques em "como chegar" e "ligar" são contados
          sem nada sobre você.
        </Texto>
        <Botao titulo="Apagar meus dados" tipo="secundario" icone="trash-outline" onPress={apagarDados} />
      </Secao>

      <Secao titulo="Sobre">
        <Texto>
          Aquenda é um projeto da Global Solution FIAP 2026 (CitizenTech), feito por Giovanne Charelli Zaniboni Silva,
          Gustavo Oliveira de Moura e Lynn Bueno Rosa.
        </Texto>
        <Texto v="apoio" suave>
          Dados da Prefeitura de São Paulo, CNES/DATASUS, IBGE, Gupy, Adzuna e da curadoria do grupo. Cada item mostra
          a fonte e a data em que foi conferido.
        </Texto>
      </Secao>
    </TelaDetalhe>
  );
}
