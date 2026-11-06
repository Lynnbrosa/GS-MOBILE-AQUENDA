import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { useTema } from '@/tema/useTema';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

// ---------- texto ----------

type Variante = 'marca' | 'titulo' | 'subtitulo' | 'corpo' | 'forte' | 'apoio' | 'apoioForte';

const ESTILO_TEXTO: Record<Variante, TextStyle> = {
  marca: { fontFamily: fontes.forte, fontSize: tipo.marca, lineHeight: tipo.marca * 1.1, letterSpacing: -0.5 },
  titulo: { fontFamily: fontes.forte, fontSize: tipo.titulo, lineHeight: tipo.titulo * 1.2 },
  subtitulo: { fontFamily: fontes.forte, fontSize: tipo.subtitulo, lineHeight: tipo.subtitulo * 1.3 },
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
  const ehTitulo = v === 'titulo' || v === 'marca' || v === 'subtitulo';
  return (
    <Text
      accessibilityRole={ehTitulo ? 'header' : undefined}
      maxFontSizeMultiplier={ehTitulo ? 1.6 : 2.2}
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
  /** O que acontece ao tocar, lido pelo leitor de tela depois do nome. */
  dica?: string;
  /** Nome para o leitor de tela, quando o título visível não basta. */
  rotulo?: string;
  desativado?: boolean;
  carregando?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { cor } = useTema();
  const fundo = t === 'principal' ? cor.acao : t === 'secundario' ? cor.acaoSuave : 'transparent';
  const frente = t === 'principal' ? cor.sobreAcao : cor.acao;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!desativado, busy: !!carregando }}
      disabled={desativado || carregando}
      onPress={onPress}
      style={({ pressed }) => [
        s.botao,
        { backgroundColor: fundo, opacity: desativado ? 0.5 : pressed ? 0.85 : 1 },
        t === 'discreto' && { paddingHorizontal: espaco.s },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={frente} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={22} color={frente} /> : null}
          <Texto v="forte" cor={frente} style={s.textoBotao}>
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
}: {
  icone: NomeIcone;
  rotulo: string;
  dica?: string;
  onPress: () => void;
  ativo?: boolean;
  cor?: string;
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
      style={({ pressed }) => [s.botaoIcone, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icone} size={26} color={corForcada ?? cor.tinta} />
    </Pressable>
  );
}

// ---------- chips de filtro ----------

export function Chip({
  titulo,
  ativo,
  onPress,
  icone,
}: {
  titulo: string;
  ativo: boolean;
  onPress: () => void;
  icone?: NomeIcone;
}) {
  const { cor } = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ selected: ativo }}
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        {
          backgroundColor: ativo ? cor.tinta : cor.superficie,
          borderColor: ativo ? cor.tinta : cor.linha,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icone ? <Ionicons name={icone} size={18} color={ativo ? cor.papel : cor.tinta} /> : null}
      <Texto v="apoioForte" cor={ativo ? cor.papel : cor.tinta}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

export function LinhaDeChips({ children }: { children: ReactNode }) {
  return <View style={s.linhaChips}>{children}</View>;
}

// ---------- superfícies ----------

export function Cartao({
  children,
  onPress,
  rotulo,
  dica,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  rotulo?: string;
  dica?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { cor } = useTema();
  const base = [s.cartao, { backgroundColor: cor.superficie, borderColor: cor.linha }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      onPress={onPress}
      style={({ pressed }) => [...base, pressed && { backgroundColor: cor.superficieForte }]}
    >
      {children}
    </Pressable>
  );
}

/** Etiqueta curta de estado: "Aberto agora", "3 vagas agora", "Afirmativa". */
export function Selo({ texto, tom = 'neutro', icone }: { texto: string; tom?: 'ok' | 'fechado' | 'neutro' | 'azul' | 'aviso'; icone?: NomeIcone }) {
  const { cor } = useTema();
  const mapa = {
    ok: [cor.okFundo, cor.ok],
    fechado: [cor.acaoSuave, cor.acao],
    neutro: [cor.superficieForte, cor.tintaSuave],
    azul: [cor.azulSuave, cor.azul],
    aviso: [cor.avisoFundo, cor.aviso],
  } as const;
  const [fundo, frente] = mapa[tom];
  return (
    <View style={[s.selo, { backgroundColor: fundo }]}>
      {icone ? <Ionicons name={icone} size={15} color={frente} /> : null}
      <Texto v="apoioForte" cor={frente}>
        {texto}
      </Texto>
    </View>
  );
}

/**
 * A fita: duas listras, rosa e azul. É o único enfeite do app e aparece em três lugares:
 * sob o nome na abertura, na aba ativa e na lateral do "como entrar".
 */
export function Fita({ vertical, espessura = 4, comprimento }: { vertical?: boolean; espessura?: number; comprimento?: number }) {
  const { cor } = useTema();
  const ocultar = { importantForAccessibility: 'no-hide-descendants' as const, accessibilityElementsHidden: true };
  if (vertical) {
    return (
      <View {...ocultar} style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
        <View style={{ width: espessura, backgroundColor: cor.fitaAzul }} />
        <View style={{ width: espessura, backgroundColor: cor.fitaRosa }} />
      </View>
    );
  }
  return (
    <View {...ocultar} style={comprimento ? { width: comprimento } : { alignSelf: 'stretch' }}>
      <View style={{ height: espessura, backgroundColor: cor.fitaAzul }} />
      <View style={{ height: espessura, backgroundColor: cor.fitaRosa }} />
    </View>
  );
}

/** O passo de entrada do serviço. É o que mais importa no cartão, então tem destaque próprio. */
export function ComoEntrar({ texto, titulo = 'Como entrar' }: { texto: string; titulo?: string }) {
  const { cor } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={`${titulo}: ${texto}`}
      style={[s.comoEntrar, { backgroundColor: cor.superficieForte }]}
    >
      <Fita vertical espessura={4} />
      <View style={{ flex: 1, padding: espaco.m, gap: 2 }}>
        <Texto v="apoioForte" suave>
          {titulo}
        </Texto>
        <Texto>{texto}</Texto>
      </View>
    </View>
  );
}

// ---------- estados da tela ----------

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  const { cor } = useTema();
  return (
    <View style={s.centro} accessibilityLiveRegion="polite" accessible accessibilityLabel={texto}>
      <ActivityIndicator size="large" color={cor.acao} />
      <Texto suave>{texto}</Texto>
    </View>
  );
}

/** Faixa que diz que o dado é guardado e de quando ele é. */
export function AvisoCache({ desde, onTentar }: { desde: string; onTentar: () => void }) {
  const { cor } = useTema();
  return (
    <View
      style={[s.aviso, { backgroundColor: cor.avisoFundo }]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="cloud-offline-outline" size={22} color={cor.aviso} />
      <View style={{ flex: 1, gap: 2 }}>
        <Texto v="apoioForte" cor={cor.aviso}>
          Sem conexão com o serviço agora
        </Texto>
        <Texto v="apoio" cor={cor.aviso}>
          Você está vendo o que foi guardado {desde}. Pode ter mudado desde então.
        </Texto>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tentar atualizar"
        onPress={onTentar}
        style={s.avisoBotao}
      >
        <Texto v="apoioForte" cor={cor.aviso} style={{ textDecorationLine: 'underline' }}>
          Atualizar
        </Texto>
      </Pressable>
    </View>
  );
}

/** Nada para mostrar: sempre diz por quê e o que dá para fazer. */
export function SemNada({
  titulo,
  texto,
  icone = 'leaf-outline',
  acao,
}: {
  titulo: string;
  texto: string;
  icone?: NomeIcone;
  acao?: { titulo: string; onPress: () => void };
}) {
  const { cor } = useTema();
  return (
    <View style={[s.semNada, { borderColor: cor.linha }]} accessibilityLiveRegion="polite">
      <Ionicons name={icone} size={32} color={cor.tintaSuave} />
      <Texto v="forte" style={{ textAlign: 'center' }}>
        {titulo}
      </Texto>
      <Texto suave style={{ textAlign: 'center' }}>
        {texto}
      </Texto>
      {acao ? <Botao titulo={acao.titulo} tipo="secundario" onPress={acao.onPress} /> : null}
    </View>
  );
}

/** Erro sem cache: explica de um jeito que dá para agir. */
export function ErroSemCache({ erro, indisponivel, servico, onTentar }: { erro: string; indisponivel: boolean; servico: string; onTentar: () => void }) {
  return (
    <SemNada
      icone={indisponivel ? 'cloud-offline-outline' : 'alert-circle-outline'}
      titulo={indisponivel ? `Não deu para falar com ${servico}` : 'Não foi possível abrir'}
      texto={
        indisponivel
          ? 'E ainda não há nada guardado neste celular para mostrar. Confira a internet e tente de novo. Se continuar, o serviço pode estar fora do ar.'
          : erro
      }
      acao={{ titulo: 'Tentar de novo', onPress: onTentar }}
    />
  );
}

// ---------- formulário ----------

export function Campo({ rotulo, ajuda, erro, ...props }: TextInputProps & { rotulo: string; ajuda?: string; erro?: string | null }) {
  const { cor } = useTema();
  return (
    <View style={{ gap: espaco.xs }}>
      <Texto v="forte" nativeID={`rotulo-${rotulo}`}>
        {rotulo}
      </Texto>
      {ajuda ? <Texto v="apoio" suave>{ajuda}</Texto> : null}
      <TextInput
        accessibilityLabel={rotulo}
        accessibilityHint={ajuda}
        placeholderTextColor={cor.tintaSuave}
        maxFontSizeMultiplier={2}
        {...props}
        style={[
          s.campo,
          { color: cor.tinta, backgroundColor: cor.superficie, borderColor: erro ? cor.perigo : cor.linha },
          props.multiline && { minHeight: 96, textAlignVertical: 'top' },
        ]}
      />
      {erro ? (
        <Texto v="apoioForte" cor={cor.perigo} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

export function Secao({ titulo, children, direita }: { titulo: string; children: ReactNode; direita?: ReactNode }) {
  return (
    <View style={{ gap: espaco.m }}>
      <View style={s.secaoTopo}>
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
    <View style={s.linhaInfo} accessible={!!rotulo} accessibilityLabel={rotulo}>
      <Ionicons name={icone} size={20} color={cor.tintaSuave} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  botao: {
    minHeight: ALVO_MINIMO + 4,
    borderRadius: raio.botao,
    paddingHorizontal: espaco.l,
    paddingVertical: espaco.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.s,
  },
  textoBotao: { textAlign: 'center', flexShrink: 1 },
  botaoIcone: { minWidth: ALVO_MINIMO, minHeight: ALVO_MINIMO, alignItems: 'center', justifyContent: 'center' },
  chip: {
    minHeight: ALVO_MINIMO,
    borderRadius: raio.chip,
    borderWidth: 1,
    paddingHorizontal: espaco.l,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.s },
  cartao: { borderRadius: raio.cartao, borderWidth: 1, padding: espaco.l, gap: espaco.s },
  selo: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: espaco.s,
    paddingVertical: 3,
  },
  comoEntrar: { flexDirection: 'row', borderRadius: 6, overflow: 'hidden' },
  centro: { alignItems: 'center', justifyContent: 'center', gap: espaco.m, paddingVertical: espaco.xxl },
  aviso: { flexDirection: 'row', gap: espaco.m, padding: espaco.m, borderRadius: raio.botao, alignItems: 'flex-start' },
  avisoBotao: { minHeight: ALVO_MINIMO, justifyContent: 'center', paddingHorizontal: espaco.xs },
  semNada: {
    alignItems: 'center',
    gap: espaco.s,
    padding: espaco.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: raio.cartao,
  },
  campo: {
    minHeight: ALVO_MINIMO + 4,
    borderWidth: 1,
    borderRadius: raio.botao,
    paddingHorizontal: espaco.m,
    paddingVertical: espaco.s,
    fontFamily: fontes.normal,
    fontSize: tipo.corpo,
  },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.s },
  linhaInfo: { flexDirection: 'row', gap: espaco.s, alignItems: 'flex-start' },
});
