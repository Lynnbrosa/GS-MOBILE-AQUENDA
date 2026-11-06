import { router } from 'expo-router';
import { memo } from 'react';
import { Linking } from 'react-native';
import { apiCsharp } from '@/lib/api/csharp';
import type { ServicoResumo, TipoInteracao, VagasCasa } from '@/lib/api/tipos';
import { CATEGORIAS, distancia, distanciaFalada, linkMapa, linkSeguro, linkTelefone, textoAberto } from '@/lib/formato';
import { useTema } from '@/tema/useTema';
import { Linha, Selo } from './base';

/** Abre o link e conta o toque no indicador de impacto (sem nada sobre a pessoa). */
export async function abrirEContar(url: string, tipo: TipoInteracao, servicoId: number): Promise<boolean> {
  apiCsharp.registrarInteracao(tipo, servicoId).catch(() => undefined);
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export function acoesDoServico(s: ServicoResumo): { tipo: TipoInteracao; url: string }[] {
  const acoes: { tipo: TipoInteracao; url: string }[] = [];
  // endereço sigiloso (casa de acolhimento) não tem "como chegar": o caminho é o encaminhamento
  if (!s.endereco.sigiloso && (s.endereco.latitude !== null || s.endereco.logradouro)) {
    acoes.push({ tipo: 'ComoChegar', url: linkMapa(s.nome, s.endereco.texto, s.endereco.latitude, s.endereco.longitude) });
  }
  const tel = s.telefone ? linkTelefone(s.telefone) : null;
  if (tel) acoes.push({ tipo: 'Ligar', url: tel });
  const site = linkSeguro(s.site);
  if (site) acoes.push({ tipo: 'AbrirSite', url: site });
  return acoes;
}

export const ServicoItem = memo(function ServicoItem({ servico, vagas }: { servico: ServicoResumo; vagas?: VagasCasa }) {
  const { cor } = useTema();
  const aberto = textoAberto(servico.abertoAgora);
  const onde = servico.endereco.sigiloso ? servico.endereco.bairro : servico.endereco.bairro || servico.endereco.texto;
  const partesFaladas = [
    servico.nome,
    CATEGORIAS[servico.categoria],
    distanciaFalada(servico.distanciaKm),
    aberto.texto,
    vagas?.situacao === 'Disponivel' || vagas?.situacao === 'Lotada' ? vagas.mensagem : null,
    servico.endereco.sigiloso ? `Endereço protegido, ${servico.endereco.bairro}` : servico.endereco.texto,
  ];
  return (
    <Linha
      titulo={servico.nome}
      apoio={onde}
      direita={distancia(servico.distanciaKm)}
      marca={servico.abertoAgora === true ? cor.ok : servico.abertoAgora === false ? cor.linha : ''}
      rotulo={partesFaladas.filter(Boolean).join('. ')}
      dica="Abre os detalhes e como entrar"
      onPress={() => router.push({ pathname: '/servico/[id]', params: { id: String(servico.id) } })}
      selo={
        vagas && (vagas.situacao === 'Disponivel' || vagas.situacao === 'Lotada') ? (
          <Selo texto={vagas.mensagem} tom={vagas.situacao === 'Disponivel' ? 'secao' : 'fechado'} icone="bed-outline" />
        ) : servico.abertoAgora === true ? (
          <Selo texto="Aberto agora" tom="ok" />
        ) : null
      }
    />
  );
});
