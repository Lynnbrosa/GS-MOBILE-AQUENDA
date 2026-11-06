import { router } from 'expo-router';
import { memo } from 'react';
import { Linking, View } from 'react-native';
import { apiCsharp } from '@/lib/api/csharp';
import type { ServicoResumo, TipoInteracao, VagasCasa } from '@/lib/api/tipos';
import { CATEGORIAS, distancia, distanciaFalada, linkMapa, linkSeguro, linkTelefone, rotuloAtendimento, textoAberto, tomVagas } from '@/lib/formato';
import { espaco } from '@/tema/tokens';
import { Cartao, ComoEntrar, Selo, Texto } from './base';

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

function rotuloDoItem(s: ServicoResumo, vagas?: VagasCasa): string {
  const partes = [s.nome, CATEGORIAS[s.categoria]];
  const d = distanciaFalada(s.distanciaKm);
  if (d) partes.push(d);
  partes.push(textoAberto(s.abertoAgora).texto);
  if (vagas) partes.push(vagas.mensagem);
  partes.push(s.endereco.sigiloso ? `Endereço protegido, bairro ${s.endereco.bairro}` : s.endereco.texto);
  return partes.join('. ');
}

export const ServicoItem = memo(function ServicoItem({ servico, vagas }: { servico: ServicoResumo; vagas?: VagasCasa }) {
  const aberto = textoAberto(servico.abertoAgora);
  const dist = distancia(servico.distanciaKm);
  return (
    <Cartao
      onPress={() => router.push({ pathname: '/servico/[id]', params: { id: String(servico.id) } })}
      rotulo={rotuloDoItem(servico, vagas)}
      dica="Abre os detalhes, o horário e como entrar"
    >
      <View style={{ flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto v="forte">{servico.nome}</Texto>
          <Texto v="apoio" suave>
            {servico.endereco.sigiloso ? `Endereço protegido, ${servico.endereco.bairro}` : servico.endereco.texto}
          </Texto>
        </View>
        {dist ? (
          <Texto v="apoioForte" suave>
            {dist}
          </Texto>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s }}>
        <Selo texto={aberto.texto} tom={aberto.tom} />
        {vagas ? <Selo texto={vagas.mensagem} tom={vagas.situacao === 'Disponivel' ? 'azul' : tomVagas(vagas.situacao)} icone="bed-outline" /> : null}
        {servico.atendimentos.slice(0, 2).map((a) => (
          <Selo key={a} texto={rotuloAtendimento(a)} />
        ))}
      </View>
      <ComoEntrar texto={servico.comoAcessar} />
    </Cartao>
  );
});
