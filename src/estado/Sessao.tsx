// Estado que o app inteiro precisa: modo discreto, PIN e se a tela está bloqueada.
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { gravarPreferencia, lerPreferencia, listarConsultas, listarLembretes } from '@/lib/banco';
import { aplicarIcone, temPin as lerTemPin } from '@/lib/discreto';
import { reagendarTudo } from '@/lib/notificacoes';

type Sessao = {
  pronto: boolean;
  discreto: boolean;
  temPin: boolean;
  bloqueado: boolean;
  definirDiscreto: (ligado: boolean) => Promise<void>;
  atualizarPin: () => Promise<void>;
  desbloquear: () => void;
  /** Saída rápida: troca para a tela de clima e, se houver PIN, bloqueia. */
  sairRapido: () => void;
};

const Contexto = createContext<Sessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [discreto, setDiscreto] = useState(false);
  const [temPin, setTemPin] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const temPinRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [d, p] = await Promise.all([lerPreferencia('discreto').catch(() => null), lerTemPin().catch(() => false)]);
      const ligado = d === '1';
      setDiscreto(ligado);
      setTemPin(p);
      temPinRef.current = p;
      setBloqueado(p);
      setPronto(true);
      // renova as datas dos lembretes por intervalo, que são agendadas uma a uma
      Promise.all([listarLembretes(), listarConsultas()])
        .then(([l, c]) => reagendarTudo(l, c, ligado))
        .catch(() => undefined);
    })();
  }, []);

  // Foi para o fundo com PIN: volta bloqueado.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'background' && temPinRef.current) setBloqueado(true);
    });
    return () => sub.remove();
  }, []);

  const definirDiscreto = useCallback(async (ligado: boolean) => {
    setDiscreto(ligado);
    await gravarPreferencia('discreto', ligado ? '1' : '0');
    await aplicarIcone(ligado);
    const [l, c] = await Promise.all([listarLembretes(), listarConsultas()]);
    await reagendarTudo(l, c, ligado);
  }, []);

  const atualizarPin = useCallback(async () => {
    const p = await lerTemPin();
    temPinRef.current = p;
    setTemPin(p);
  }, []);

  const desbloquear = useCallback(() => setBloqueado(false), []);

  const sairRapido = useCallback(() => {
    if (temPinRef.current) setBloqueado(true);
    router.replace('/clima');
  }, []);

  const valor = useMemo(
    () => ({ pronto, discreto, temPin, bloqueado, definirDiscreto, atualizarPin, desbloquear, sairRapido }),
    [pronto, discreto, temPin, bloqueado, definirDiscreto, atualizarPin, desbloquear, sairRapido],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(Contexto);
  if (!s) throw new Error('useSessao fora do ProvedorSessao');
  return s;
}
