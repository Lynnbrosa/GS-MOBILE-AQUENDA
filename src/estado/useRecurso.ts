// Busca um dado da API com a regra do cache: mostra na hora o que está guardado,
// atualiza pela rede e, se a rede falhar, segue mostrando o guardado com a data.
import { useCallback, useEffect, useRef, useState } from 'react';
import { armazemSqlite } from '@/lib/banco';
import { lerDoCache, obterComCache, SemDados } from '@/lib/cache';

export type EstadoRecurso<T> = {
  dados: T | null;
  carregando: boolean;
  /** Preenchido quando o que aparece veio do cache porque a API não respondeu. */
  doCacheDesde: string | null;
  /** Sem dados para mostrar: explica o motivo. */
  erro: string | null;
  /** Erro por API fora do ar (true) ou resposta de verdade, como 404 (false). */
  indisponivel: boolean;
  recarregar: () => Promise<void>;
};

export function useRecurso<T>(chave: string | null, buscar: () => Promise<T>): EstadoRecurso<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [doCacheDesde, setDoCacheDesde] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [indisponivel, setIndisponivel] = useState(false);
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;
  const ultimaChave = useRef<string | null>(null);

  const carregar = useCallback(async () => {
    if (!chave) return;
    ultimaChave.current = chave;
    setCarregando(true);
    setErro(null);

    const guardado = await lerDoCache<T>(chave, armazemSqlite).catch(() => null);
    if (ultimaChave.current !== chave) return;
    if (guardado) setDados(guardado.dados);
    else setDados(null);

    try {
      const r = await obterComCache(chave, () => buscarRef.current(), armazemSqlite);
      if (ultimaChave.current !== chave) return;
      setDados(r.dados);
      setDoCacheDesde(r.tipo === 'cache' ? r.guardadoEm : null);
    } catch (e) {
      if (ultimaChave.current !== chave) return;
      setDados(null);
      setDoCacheDesde(null);
      setErro(e instanceof SemDados ? e.motivo : 'Algo deu errado ao carregar.');
      setIndisponivel(e instanceof SemDados ? e.indisponivel : true);
    } finally {
      if (ultimaChave.current === chave) setCarregando(false);
    }
  }, [chave]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { dados, carregando, doCacheDesde, erro, indisponivel, recarregar: carregar };
}
