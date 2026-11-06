import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRecurso } from '@/estado/useRecurso';
import { apiCsharp, type FiltroServicos } from '@/lib/api/csharp';
import type { Atendimento, Categoria, Pagina, ServicoResumo, VagasCasa } from '@/lib/api/tipos';
import { haQuanto } from '@/lib/formato';
import { pedirPosicao, type Posicao } from '@/lib/localizacao';
import { espaco } from '@/tema/tokens';
import { AvisoCache, Campo, Carregando, Chip, ErroSemCache, LinhaDeChips, SemNada, Texto } from './base';
import { ServicoItem } from './Servico';
import { Tela } from './Tela';

export type OpcaoFiltro = { chave: string; titulo: string; categoria?: Categoria; atendimento?: Atendimento[] };

/**
 * Tela de busca no catálogo da API C#. Usada nas abas casa, saúde e rolês.
 * `permitidas` limita o que aparece quando a opção não fixa uma categoria.
 */
export function BuscaServicos({
  titulo,
  apoio,
  opcoes,
  permitidas,
  vagasCasas,
  topo,
  depois,
  textoBusca = 'Buscar pelo nome',
}: {
  titulo: string;
  apoio: string;
  opcoes: OpcaoFiltro[];
  permitidas: Categoria[];
  vagasCasas?: boolean;
  topo?: ReactNode;
  depois?: ReactNode;
  textoBusca?: string;
}) {
  const [opcao, setOpcao] = useState(opcoes[0].chave);
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [abertos, setAbertos] = useState(false);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [avisoPosicao, setAvisoPosicao] = useState<string | null>(null);

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
    } else if ('negado' in res) setAvisoPosicao('Sem acesso à localização. Dá para buscar pelo nome ou bairro.');
    else setAvisoPosicao(res.erro);
  }

  return (
    <Tela
      titulo={titulo}
      apoio={apoio}
      topo={topo}
      recarregando={r.carregando && !!r.dados}
      onRecarregar={() => {
        r.recarregar();
        casas.recarregar();
      }}
    >
      <View style={{ gap: espaco.m }}>
        <LinhaDeChips>
          {opcoes.map((o) => (
            <Chip key={o.chave} titulo={o.titulo} ativo={o.chave === opcao} onPress={() => setOpcao(o.chave)} />
          ))}
        </LinhaDeChips>
        <Campo
          rotulo={textoBusca}
          placeholder="Ex.: República, hormonização"
          value={texto}
          onChangeText={setTexto}
          returnKeyType="search"
          onSubmitEditing={() => setBusca(texto.trim())}
          onBlur={() => setBusca(texto.trim())}
        />
        <LinhaDeChips>
          <Chip titulo="Aberto agora" icone="time-outline" ativo={abertos} onPress={() => setAbertos((v) => !v)} />
          <Chip titulo="Perto de mim" icone="navigate-outline" ativo={!!posicao} onPress={alternarPerto} />
        </LinhaDeChips>
        {avisoPosicao ? (
          <Texto v="apoio" suave accessibilityLiveRegion="polite">
            {avisoPosicao}
          </Texto>
        ) : null}
      </View>

      {r.doCacheDesde ? <AvisoCache desde={haQuanto(r.doCacheDesde, new Date())} onTentar={r.recarregar} /> : null}

      {r.carregando && !r.dados ? (
        <Carregando texto="Procurando serviços…" />
      ) : r.erro ? (
        <ErroSemCache erro={r.erro} indisponivel={r.indisponivel} servico="o catálogo do Aquenda" onTentar={r.recarregar} />
      ) : itens.length === 0 ? (
        <SemNada
          titulo="Nada encontrado com esses filtros"
          texto={
            abertos
              ? 'Pode ser que nada esteja aberto neste horário. Tire o filtro "Aberto agora" para ver tudo.'
              : 'Tente outra palavra ou tire algum filtro.'
          }
          acao={{
            titulo: 'Limpar filtros',
            onPress: () => {
              setTexto('');
              setBusca('');
              setAbertos(false);
              setPosicao(null);
              setOpcao(opcoes[0].chave);
            },
          }}
        />
      ) : (
        <View style={{ gap: espaco.m }}>
          <Texto v="apoio" suave accessibilityLiveRegion="polite">
            {itens.length === 1 ? '1 lugar' : `${itens.length} lugares`}
            {posicao ? ', do mais perto para o mais longe' : ''}
          </Texto>
          {itens.map((s) => (
            <ServicoItem key={s.id} servico={s} vagas={vagasPorCasa.get(s.id)} />
          ))}
        </View>
      )}
      {depois}
    </Tela>
  );
}
