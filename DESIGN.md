# Aquenda: direção visual

O app é para alguém que pode estar com pressa, com medo ou sem lugar para dormir. Ele precisa parecer um bilhete de alguém que conhece o caminho, e não um painel de sistema. As escolhas abaixo valem para todas as telas e estão no código em `src/tema/tokens.ts`.

## Cor

| Nome | Claro | Escuro | Para quê |
|---|---|---|---|
| papel | `#F4F2F7` | `#17121C` | fundo de todas as telas: um lilás quase branco, frio o bastante para não virar "creme" |
| tinta | `#22172B` | `#F1ECF4` | texto principal: ameixa, mais macio que o preto |
| tinta suave | `#574B61` | `#C4BACC` | texto de apoio (passa de 4,5:1 nos dois temas) |
| rosa-cravo | `#A3305A` | `#F39BB9` | o que se toca: botões principais, links, chip ativo |
| azul | `#245F7C` | `#92D2EC` | informação boa: "3 vagas agora", vaga afirmativa, próximo lembrete |
| fita | `#8DD3EE` + `#F2A7BB` | iguais | o único enfeite (ver abaixo) |

Todo par de texto e fundo é testado em `__tests__/contraste.test.ts` (WCAG AA, 4,5:1).

## Tipo

Uma família só: **Atkinson Hyperlegible**, do Braille Institute, feita para baixa visão (I, l e 1 não se confundem; nem O e 0). Regular para ler, Bold para títulos e ações. O corpo é 17 pt, e tudo cresce com o tamanho de fonte do celular.

## A fita

Duas listras finas, azul e rosa. Quem é da comunidade reconhece a bandeira; para quem está de fora, é só um detalhe gráfico. Ela aparece em três lugares e mais nenhum:

1. sob o nome *aquenda* na aba casa;
2. em cima do ícone da aba em que você está;
3. na lateral da caixa **Como entrar**, o passo de entrada de cada serviço, que é a informação mais importante do app.

## Layout

Lista alinhada à esquerda, um cartão por lugar. O cartão diz nome, endereço (ou "Endereço protegido" para casas de acolhimento), selos de estado e, sempre, o "Como entrar". Os raios mudam com a hierarquia: cartão 18, botão 12, chip redondo, a fita reta. Sem sombras: bordas finas na cor `linha`.

## O que evitamos de propósito

- rótulo em caixa alta acima de título, números 01/02/03 decorativos, seta "→" em botão;
- uma palavra colorida no meio do título;
- gradiente, sombra cinza igual em tudo, ícone dentro de quadrado arredondado;
- creme com terracota, preto com verde-limão.

## Escrita

Você, frases curtas, verbo no começo do botão ("Salvar lembrete", "Avisar que fechou"). Linguagem neutra em gênero quando precisa ("encaminhade"). Erro diz o que houve e o que fazer; tela vazia diz por que está vazia.
