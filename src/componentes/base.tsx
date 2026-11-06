import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { ALVO_MINIMO, espaco, fontes, raio, tipo } from '@/tema/tokens';
import { useSecao, useTema } from '@/tema/useTema';
import { Mascote } from './Mascote';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

// ---------- texto ----------

type Variante = 'enorme' | 'titulo' | 'subtitulo' | 'corpo' | 'forte' | 'apoio' | 'apoioForte';

const ESTILO_TEXTO: Record<Variante, TextStyle> = {
  enorme: { fontFamily: fontes.titulo, fontSize: tipo.enorme, lineHeight: tipo.enorme * 1.1 },
  titulo: { fontFamily: fontes.titulo, fontSize: tipo.titulo, lineHeight: tipo.titulo * 1.15 },
  subtitulo: { fontFamily: fontes.titulo, fontSize: tipo.subtitulo, lineHeight: tipo.subtitulo * 1.25 },
  corpo: { fontFamily: fontes.normal, fontSize: tipo.corpo, lineHeight: tipo.corpo * 1.45 },
  forte: { fontFamily: fontes.forte, fontSize: tipo.corpo, lineHeight: tipo.corpo * 1.4 },
  apoio: { fontFamily: fontes.normal, fontSize: tipo.apoio, lineHeight: tipo.apoio * 1.45 },
  apoioForte: { fontFamily: fontes.forte, fontSize: tipo.apoio, lineHeight: tipo.apoio * 1.4 },
};

export function Texto({
  v = 'corpo',
  suave,
  cor: corForcada,
  style,
  ...resto
}: TextProps & { v?: Variante; suave?: boolean; cor?: string }) {
  const { cor } = useTema();
  const ehTitulo = v === 'titulo' || v === 'enorme' || v === 'subtitulo';
  return (
    <Text
      accessibilityRole={ehTitulo ? 'header' : undefined}
      maxFontSizeMultiplier={ehTitulo ? 1.5 : 2.2}
      {...resto}
      style={[ESTILO_TEXTO[v], { color: corForcada ?? (suave ? cor.tintaSuave : cor.tinta) }, style]}
    />
  );
}

// ---------- botões ----------

type TipoBotao = 'principal' | 'secundario' | 'discreto';

export function Botao({
  titulo,
  icone,
  onPress,
  tipo: t = 'principal',
  dica,
  rotulo,
  desativado,
  carregando,
  style,
}: {
  titulo: string;
  icone?: NomeIcone;
  onPress: () => void;
  tipo?: TipoBotao;
  dica?: string;
  rotulo?: string;
  desativado?: boolean;
  carregando?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const s = useSecao();
  const fundo = t === 'principal' ? s.acao : t === 'secundario' ? s.suave : 'transparent';
  const frente = t === 'principal' ? s.sobreAcao : t === 'secundario' ? s.sobreSuave : s.acao;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!desativado, busy: !!carregando }}
      disabled={desativado || carregando}
      onPress={onPress}
      style={({ pressed }) => [
        est.botao,
        { backgroundColor: fundo, opacity: desativado ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        t === 'discreto' && { paddingHorizontal: espaco.s, minHeight: ALVO_MINIMO },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={frente} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={21} color={frente} /> : null}
          <Texto v="forte" cor={frente} style={est.textoBotao}>
            {titulo}
          </Texto>
        </>
      )}
    </Pressable>
  );
}

export function BotaoIcone({
  icone,
  rotulo,
  dica,
  onPress,
  ativo,
  cor: corForcada,
  fundo,
}: {
  icone: NomeIcone;
  rotulo: string;
  dica?: string;
  onPress: () => void;
  ativo?: boolean;
  cor?: string;
  fundo?: string;
}) {
  const { cor } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      accessibilityState={ativo === undefined ? undefined : { selected: ativo }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        est.botaoIcone,
        fundo ? { backgroundColor: fundo, borderRadius: 999 } : null,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={icone} size={24} color={corForcada ?? cor.tinta} />
    </Pressable>
  );
}

// ---------- chips de filtro ----------

export function Chip({ titulo, ativo, onPress, icone }: { titulo: string; ativo: boolean; onPress: () => void; icone?: NomeIcone }) {
  const { cor } = useTema();
  const s = useSecao();
  const frente = ativo ? s.sobreAcao : cor.tinta;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ selected: ativo }}
      onPress={onPress}
      style={({ pressed }) => [est.chip, { backgroundColor: ativo ? s.acao : cor.superficie, opacity: pressed ? 0.8 : 1 }]}
    >
      {icone ? <Ionicons name={icone} size={17} color={frente} /> : null}
      <Texto v="apoioForte" cor={frente}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

/** Chips numa linha que rola de lado: ocupa pouco espaço vertical. */
export function LinhaDeChips({ children, quebrar }: { children: ReactNode; quebrar?: boolean }) {
  if (quebrar) return <View style={est.chipsQuebra}>{children}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={est.chipsRolagem} style={{ marginHorizontal: -espaco.l }}>
      {children}
    </ScrollView>
  );
}

// ---------- superfícies ----------

/** Bloco macio, sem borda. Use pouco: a maior parte da tela é lista. */
export function Cartao({
  children,
  onPress,
  rotulo,
  dica,
  style,
  tom = 'neutro',
}: {
  children: ReactNode;
  onPress?: () => void;
  rotulo?: string;
  dica?: string;
  style?: StyleProp<ViewStyle>;
  tom?: 'neutro' | 'secao';
}) {
  const { cor } = useTema();
  const s = useSecao();
  const base = [est.bloco, { backgroundColor: tom === 'secao' ? s.suave : cor.superficie }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} accessibilityHint={dica} onPress={onPress} style={({ pressed }) => [...base, { opacity: pressed ? 0.85 : 1 }]}>
      {children}
    </Pressable>
  );
}

/** Uma linha de lista: título, uma linha de apoio e um selo. Sem caixa em volta. */
export function Linha({
  titulo,
  apoio,
  direita,
  selo,
  onPress,
  rotulo,
  dica,
  marca,
}: {
  titulo: string;
  apoio?: string | null;
  direita?: string | null;
  selo?: ReactNode;
  onPress: () => void;
  rotulo?: string;
  dica?: string;
  /** bolinha colorida à esquerda (ex.: aberto agora). String vazia reserva o espaço sem cor. */
  marca?: string;
}) {
  const { cor } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? [titulo, apoio, direita].filter(Boolean).join('. ')}
      accessibilityHint={dica}
      onPress={onPress}
      style={({ pressed }) => [est.linha, { opacity: pressed ? 0.6 : 1 }]}
    >
      {marca !== undefined ? <View style={[est.marca, { backgroundColor: marca || 'transparent' }]} /> : null}
      <View style={{ flex: 1, gap: 3 }}>
        <Texto v="forte">{titulo}</Texto>
        {apoio ? (
          <Texto v="apoio" suave numberOfLines={2}>
            {apoio}
          </Texto>
        ) : null}
        {selo ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s, marginTop: 4 }}>{selo}</View> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {direita ? (
          <Texto v="apoioForte" suave>
            {direita}
          </Texto>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color={cor.tintaSuave} />
      </View>
    </Pressable>
  );
}

export function Selo({ texto, tom = 'neutro', icone }: { texto: string; tom?: 'ok' | 'fechado' | 'neutro' | 'secao' | 'aviso'; icone?: NomeIcone }) {
  const { cor } = useTema();
  const s = useSecao();
  const mapa = {
    ok: [cor.okFundo, cor.ok],
    fechado: [cor.superficieForte, cor.tintaSuave],
    neutro: [cor.superficie, cor.tintaSuave],
    secao: [s.suave, s.sobreSuave],
    aviso: [cor.avisoFundo, cor.aviso],
  } as const;
  const [fundo, frente] = mapa[tom];
  return (
    <View style={[est.selo, { backgroundColor: fundo }]}>
      {icone ? <Ionicons name={icone} size={14} color={frente} /> : null}
      <Texto v="apoioForte" cor={frente} style={{ fontSize: 14, lineHeight: 19 }}>
        {texto}
      </Texto>
    </View>
  );
}

/** O passo de entrada do serviço: a informação mais importante do detalhe. */
export function ComoEntrar({ texto, titulo = 'Como entrar' }: { texto: string; titulo?: string }) {
  const s = useSecao();
  return (
    <View accessible accessibilityLabel={`${titulo}: ${texto}`} style={[est.bloco, { backgroundColor: s.suave }]}>
      <Texto v="apoioForte" cor={s.sobreSuave}>
        {titulo}
      </Texto>
      <Texto v="subtitulo" cor={s.sobreSuave} style={{ fontFamily: fontes.normal, fontSize: 19, lineHeight: 27 }}>
        {texto}
      </Texto>
    </View>
  );
}

// ---------- estados da tela ----------

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  const s = useSecao();
  return (
    <View style={est.centro} accessibilityLiveRegion="polite" accessible accessibilityLabel={texto}>
      <ActivityIndicator size="large" color={s.acao} />
    </View>
  );
}

/** Faixa curta: o dado é guardado, e de quando ele é. */
export function AvisoCache({ desde, onTentar }: { desde: string; onTentar: () => void }) {
  const { cor } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sem conexão. Mostrando o que foi guardado ${desde}. Toque para tentar atualizar.`}
      onPress={onTentar}
      style={[est.aviso, { backgroundColor: cor.avisoFundo }]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="cloud-offline-outline" size={20} color={cor.aviso} />
      <Texto v="apoio" cor={cor.aviso} style={{ flex: 1 }}>
        Sem conexão. Mostrando o que foi guardado {desde}.
      </Texto>
      <Ionicons name="refresh" size={20} color={cor.aviso} />
    </Pressable>
  );
}

/** Nada para mostrar: sempre diz por quê, curto, e o que dá para fazer. */
export function SemNada({ titulo, texto, acao }: { titulo: string; texto?: string; icone?: NomeIcone; acao?: { titulo: string; onPress: () => void } }) {
  return (
    <View style={est.semNada} accessibilityLiveRegion="polite">
      <Mascote tamanho={84} />
      <Texto v="subtitulo" style={{ textAlign: 'center' }}>
        {titulo}
      </Texto>
      {texto ? (
        <Texto suave style={{ textAlign: 'center' }}>
          {texto}
        </Texto>
      ) : null}
      {acao ? <Botao titulo={acao.titulo} tipo="secundario" onPress={acao.onPress} /> : null}
    </View>
  );
}

export function ErroSemCache({ erro, indisponivel, onTentar }: { erro: string; indisponivel: boolean; servico?: string; onTentar: () => void }) {
  return (
    <SemNada
      titulo={indisponivel ? 'Sem conexão agora' : 'Não deu para abrir'}
      texto={indisponivel ? 'E ainda não tem nada guardado aqui. Confira a internet.' : erro}
      acao={{ titulo: 'Tentar de novo', onPress: onTentar }}
    />
  );
}

// ---------- formulário ----------

export function Campo({ rotulo, ajuda, erro, ...props }: TextInputProps & { rotulo: string; ajuda?: string; erro?: string | null }) {
  const { cor } = useTema();
  return (
    <View style={{ gap: espaco.xs }}>
      <Texto v="apoioForte">{rotulo}</Texto>
      <TextInput
        accessibilityLabel={rotulo}
        accessibilityHint={ajuda}
        placeholderTextColor={cor.tintaSuave}
        maxFontSizeMultiplier={2}
        {...props}
        style={[
          est.campo,
          { color: cor.tinta, backgroundColor: cor.superficie, borderColor: erro ? cor.perigo : 'transparent' },
          props.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: espaco.m },
        ]}
      />
      {ajuda ? (
        <Texto v="apoio" suave>
          {ajuda}
        </Texto>
      ) : null}
      {erro ? (
        <Texto v="apoioForte" cor={cor.perigo} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

/** Campo de busca com lupa. O rótulo vai só para o leitor de tela. */
export function Busca({ rotulo, ...props }: TextInputProps & { rotulo: string }) {
  const { cor } = useTema();
  return (
    <View style={[est.busca, { backgroundColor: cor.superficie }]}>
      <Ionicons name="search" size={20} color={cor.tintaSuave} />
      <TextInput
        accessibilityLabel={rotulo}
        placeholder={rotulo}
        placeholderTextColor={cor.tintaSuave}
        returnKeyType="search"
        maxFontSizeMultiplier={2}
        {...props}
        style={{ flex: 1, color: cor.tinta, fontFamily: fontes.normal, fontSize: tipo.corpo, minHeight: ALVO_MINIMO }}
      />
    </View>
  );
}

export function Secao({ titulo, children, direita }: { titulo: string; children: ReactNode; direita?: ReactNode }) {
  return (
    <View style={{ gap: espaco.s }}>
      <View style={est.secaoTopo}>
        <Texto v="subtitulo" style={{ flex: 1 }}>
          {titulo}
        </Texto>
        {direita}
      </View>
      {children}
    </View>
  );
}

export function LinhaInfo({ icone, children, rotulo }: { icone: NomeIcone; children: ReactNode; rotulo?: string }) {
  const { cor } = useTema();
  return (
    <View style={est.linhaInfo} accessible={!!rotulo} accessibilityLabel={rotulo}>
      <Ionicons name={icone} size={20} color={cor.tintaSuave} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const est = StyleSheet.create({
  botao: {
    minHeight: ALVO_MINIMO + 6,
    borderRadius: raio.botao,
    paddingHorizontal: espaco.xl,
    paddingVertical: espaco.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.s,
  },
  textoBotao: { textAlign: 'center', flexShrink: 1 },
  botaoIcone: { minWidth: ALVO_MINIMO, minHeight: ALVO_MINIMO, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: ALVO_MINIMO - 4, borderRadius: raio.chip, paddingHorizontal: espaco.l, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipsRolagem: { gap: espaco.s, paddingHorizontal: espaco.l },
  chipsQuebra: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  bloco: { borderRadius: raio.bloco, padding: espaco.l + 4, gap: espaco.s },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, paddingVertical: espaco.m + 2, minHeight: 64 },
  marca: { width: 10, height: 10, borderRadius: 5, alignSelf: 'flex-start', marginTop: 8 },
  selo: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: espaco.xxl },
  aviso: { flexDirection: 'row', gap: espaco.s, paddingHorizontal: espaco.l, paddingVertical: espaco.m, borderRadius: raio.bloco, alignItems: 'center', minHeight: ALVO_MINIMO },
  semNada: { alignItems: 'center', gap: espaco.s, paddingVertical: espaco.xl, paddingHorizontal: espaco.l },
  campo: { minHeight: ALVO_MINIMO + 6, borderWidth: 1.5, borderRadius: raio.campo, paddingHorizontal: espaco.l, fontFamily: fontes.normal, fontSize: tipo.corpo },
  busca: { flexDirection: 'row', alignItems: 'center', gap: espaco.s, borderRadius: raio.chip, paddingHorizontal: espaco.l },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  linhaInfo: { flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' },
});
