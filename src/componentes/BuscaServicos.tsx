import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRecurso } from '@/estado/useRecurso';
import { apiCsharp, type FiltroServicos } from '@/lib/api/csharp';
import type { Atendimento, Categoria, Pagina, ServicoResumo, VagasCasa } from '@/lib/api/tipos';
import { haQuanto } from '@/lib/formato';
import { pedirPosicao, type Posicao } from '@/lib/localizacao';
import type { NomeSecao } from '@/tema/tokens';
import { AvisoCache, Busca, Carregando, Chip, ErroSemCache, LinhaDeChips, SemNada, Texto } from './base';
import { Mapa } from './Mapa';
import { ServicoItem } from './Servico';
import { Tela } from './Tela';

export type OpcaoFiltro = { chave: string; titulo: string; categoria?: Categoria; atendimento?: Atendimento[] };

/** Busca no catálogo da API C#. Usada nas abas casa, saúde e rolês. */
export function BuscaServicos({
  secao,
  titulo,
  apoio,
  opcoes,
  permitidas,
  vagasCasas,
  topo,
  antes,
  depois,
  textoBusca = 'Buscar por nome ou bairro',
  comMapa,
}: {
  secao: NomeSecao;
  titulo: string;
  apoio?: string;
  opcoes: OpcaoFiltro[];
  permitidas: Categoria[];
  vagasCasas?: boolean;
  topo?: ReactNode;
  antes?: ReactNode;
  depois?: ReactNode;
  textoBusca?: string;
  /** mostra o botão Mapa (OpenStreetMap) */
  comMapa?: boolean;
}) {
  const [opcao, setOpcao] = useState(opcoes[0].chave);
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [abertos, setAbertos] = useState(false);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [avisoPosicao, setAvisoPosicao] = useState<string | null>(null);
  const [verMapa, setVerMapa] = useState(false);

  const escolhida = opcoes.find((o) => o.chave === opcao) ?? opcoes[0];
  const filtro: FiltroServicos = {
    categoria: escolhida.categoria,
    atendimento: escolhida.atendimento,
    texto: busca || undefined,
    abertos,
    lat: posicao?.lat,
    lon: posicao?.lon,
    raioKm: posicao ? 15 : undefined,
    tamanho: 50,
  };
  // a chave do cache arredonda a posição (~1 km) para reaproveitar o guardado
  const chave = `servicos:${JSON.stringify({ ...filtro, lat: posicao?.lat.toFixed(2), lon: posicao?.lon.toFixed(2) })}`;
  const r = useRecurso<Pagina<ServicoResumo>>(chave, () => apiCsharp.buscarServicos(filtro));
  const casas = useRecurso<VagasCasa[]>(vagasCasas ? 'casas' : null, () => apiCsharp.casas());

  const itens = useMemo(
    () => (r.dados?.itens ?? []).filter((s) => escolhida.categoria || permitidas.includes(s.categoria)),
    [r.dados, escolhida.categoria, permitidas],
  );
  const vagasPorCasa = useMemo(() => new Map((casas.dados ?? []).map((c) => [c.casaId, c])), [casas.dados]);

  async function alternarPerto() {
    if (posicao) {
      setPosicao(null);
      setAvisoPosicao(null);
      return;
    }
    const res = await pedirPosicao();
    if ('posicao' in res) {
      setPosicao(res.posicao);
      setAvisoPosicao(null);
    } else if ('negado' in res) setAvisoPosicao('Sem acesso à localização. Busque pelo bairro.');
    else setAvisoPosicao(res.erro);
  }

  function limpar() {
    setTexto('');
    setBusca('');
    setAbertos(false);
    setPosicao(null);
    setOpcao(opcoes[0].chave);
  }

  return (
    <Tela
      secao={secao}
      titulo={titulo}
      apoio={apoio}
      topo={topo}
      recarregando={r.carregando && !!r.dados}
      onRecarregar={() => {
        r.recarregar();
        casas.recarregar();
      }}
    >
      <Busca rotulo={textoBusca} value={texto} onChangeText={setTexto} onSubmitEditing={() => setBusca(texto.trim())} onBlur={() => setBusca(texto.trim())} />
      <LinhaDeChips>
        {opcoes.length > 1
          ? opcoes.map((o) => <Chip key={o.chave} titulo={o.titulo} ativo={o.chave === opcao} onPress={() => setOpcao(o.chave)} />)
          : null}
        <Chip titulo="Aberto agora" icone="time-outline" ativo={abertos} onPress={() => setAbertos((v) => !v)} />
        <Chip titulo="Perto de mim" icone="navigate-outline" ativo={!!posicao} onPress={alternarPerto} />
        {comMapa ? <Chip titulo="Mapa" icone="map-outline" ativo={verMapa} onPress={() => setVerMapa((v) => !v)} /> : null}
      </LinhaDeChips>
      {avisoPosicao ? (
        <Texto v="apoio" suave accessibilityLiveRegion="polite">
          {avisoPosicao}
        </Texto>
      ) : null}

      {antes}

      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}

      {r.carregando && !r.dados ? (
        <Carregando texto="Procurando…" />
      ) : r.erro ? (
        <ErroSemCache erro={r.erro} indisponivel={r.indisponivel} onTentar={r.recarregar} />
      ) : itens.length === 0 ? (
        <SemNada titulo="Nada por aqui" texto={abertos ? 'Nada aberto neste horário.' : 'Tente outra palavra.'} acao={{ titulo: 'Limpar filtros', onPress: limpar }} />
      ) : (
        <View style={{ gap: 8 }}>
        {verMapa ? <Mapa servicos={itens} /> : null}
        <View accessibilityLabel={posicao ? `${itens.length} lugares, do mais perto para o mais longe` : `${itens.length} lugares`}>
          {itens.map((s) => (
            <ServicoItem key={s.id} servico={s} vagas={vagasPorCasa.get(s.id)} />
          ))}
        </View>
        </View>
      )}
      {depois}
    </Tela>
  );
}
