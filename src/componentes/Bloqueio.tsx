import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessao } from '@/estado/Sessao';
import { conferirPin } from '@/lib/discreto';
import { esperaAposErros, PIN_MIN, textoEspera } from '@/lib/pin';
import { espaco } from '@/tema/tokens';
import { useTema } from '@/tema/useTema';
import { Botao, Texto } from './base';
import { TecladoPin } from './TecladoPin';

/** Tela de PIN. Não mostra o nome Aquenda: quem pega o celular vê só "Digite o PIN". */
export function Bloqueio() {
  const { cor } = useTema();
  const { desbloquear, sairRapido } = useSessao();
  const [pin, setPin] = useState('');
  const [erros, setErros] = useState(0);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [esperaAte, setEsperaAte] = useState(0);
  const [, setTique] = useState(0);
  const conferindo = useRef(false);

  const esperando = esperaAte > Date.now();

  useEffect(() => {
    if (!esperando) return;
    const t = setInterval(() => setTique((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [esperando]);

  async function conferir(valor: string) {
    if (conferindo.current || valor.length < PIN_MIN) return;
    conferindo.current = true;
    const ok = await conferirPin(valor);
    conferindo.current = false;
    if (ok) {
      setPin('');
      setErros(0);
      setMensagem(null);
      desbloquear();
      return;
    }
    const n = erros + 1;
    setErros(n);
    setPin('');
    const espera = esperaAposErros(n);
    if (espera > 0) {
      setEsperaAte(Date.now() + espera);
      setMensagem(`PIN errado. ${textoEspera(espera)}`);
    } else setMensagem('PIN errado. Tente de novo.');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cor.papel }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: espaco.xl, padding: espaco.l }}>
        <View style={{ gap: espaco.s, alignItems: 'center' }}>
          <Texto v="titulo">Digite o PIN</Texto>
          <Texto suave style={{ textAlign: 'center' }}>
            {esperando ? textoEspera(esperaAte - Date.now()) : 'Toque em Entrar quando terminar.'}
          </Texto>
          {mensagem && !esperando ? (
            <Texto v="apoioForte" cor={cor.perigo} accessibilityLiveRegion="assertive">
              {mensagem}
            </Texto>
          ) : null}
        </View>
        <TecladoPin valor={pin} onMudar={setPin} desativado={esperando} />
        <View style={{ flexDirection: 'row', gap: espaco.m, alignSelf: 'stretch' }}>
          <Botao
            titulo="Ver o clima"
            tipo="secundario"
            onPress={sairRapido}
            style={{ flex: 1 }}
          />
          <Botao titulo="Entrar" onPress={() => conferir(pin)} desativado={pin.length < PIN_MIN || esperando} style={{ flex: 1 }} />
        </View>
      </View>
    </SafeAreaView>
  );
}
