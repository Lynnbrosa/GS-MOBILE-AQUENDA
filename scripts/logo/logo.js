// Logo do Aquenda: um elefante que é a letra "a" de dois andares.
// A cabeça fica no alto, à direita; a tromba faz a voltinha de cima do "a" e termina
// curvada à esquerda. A pele tem a textura da casca do kiwi (marrom e felpuda) e a orelha,
// por dentro, mostra a polpa verde com sementes.
//
// Uso: node scripts/logo/logo.js <pasta-dos-conceitos> [pasta-assets]
// Gera os SVGs dos conceitos e os PNGs (precisa de @resvg/resvg-js no NODE_PATH ou instalado).

const fs = require('node:fs');
const path = require('node:path');

const COR = {
  casca: '#7B5530',
  cascaEscura: '#5E3E21',
  cascaClara: '#A67B4E',
  polpa: '#8CC63F',
  polpaClara: '#C6E58A',
  miolo: '#F3F6D6',
  semente: '#2A1E14',
  olho: '#1E1B24',
  brilho: '#FFFFFF',
  bochecha: '#F49AB2',
  presa: '#FFF6E6',
};

// Linha central da letra, em viewBox 0..200. Espessura do traço: 34.
const TRACO = 27;
const ARCO_TROMBA = 'M142 108 C142 64 122 40 92 40 C66 40 50 54 48 72 C47 83 54 90 63 87';
const HASTE = 'M142 100 V152 C142 163 151 168 162 165';
const BARRIGA = 'M142 120 H104 C78 120 62 131 62 146 C62 161 76 171 97 171 C118 171 134 161 142 148';

// Ruído de casca: pontinhos claros e escuros (feTurbulence) sobre o marrom.
function defsCasca(id, forte = 1) {
  return `
  <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="1.25" numOctaves="2" seed="7" result="ruido"/>
    <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.66  0 0 0 0 0.42  0 0 0 ${1.5 * forte} -0.78" result="claros"/>
    <feComposite in="claros" in2="SourceAlpha" operator="in" result="claros2"/>
    <feTurbulence type="fractalNoise" baseFrequency="2.1" numOctaves="1" seed="3" result="ruido2"/>
    <feColorMatrix in="ruido2" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 ${1.6 * forte} -0.9" result="escuros"/>
    <feComposite in="escuros" in2="SourceAlpha" operator="in" result="escuros2"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="escuros2"/><feMergeNode in="claros2"/></feMerge>
  </filter>`;
}

// Borda felpuda: o contorno treme de leve, como a penugem do kiwi.
function defsPenugem(id) {
  return `
  <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="11" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
}

function sementes(cx, cy, r, n, rx = 1.6, ry = 3.4) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const graus = (a * 180) / Math.PI + 90;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx}" ry="${ry}" fill="${COR.semente}" transform="rotate(${graus.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return s;
}

/** Orelha: uma fatia de kiwi atrás da cabeça. */
function orelha() {
  return `
  <g>
    <ellipse cx="166" cy="70" rx="26" ry="32" fill="${COR.casca}" filter="url(#casca)"/>
    <ellipse cx="167" cy="70" rx="20" ry="26" fill="${COR.polpa}"/>
    <ellipse cx="167" cy="70" rx="11" ry="15" fill="${COR.polpaClara}"/>
    <ellipse cx="167" cy="70" rx="4.5" ry="7" fill="${COR.miolo}"/>
    ${sementes(167, 70, 12.5, 9, 1.2, 2.6)}
  </g>`;
}

/** O corpo-letra, com a textura de casca. */
function letra({ penugem = true } = {}) {
  const f = penugem ? 'url(#penugem)' : 'none';
  return `
  <g filter="${f}">
    <g filter="url(#casca)" fill="none" stroke="${COR.casca}" stroke-width="${TRACO}" stroke-linecap="round" stroke-linejoin="round">
      <path d="${BARRIGA}"/>
      <path d="${HASTE}"/>
      <path d="${ARCO_TROMBA}"/>
      <!-- cabeça: o alto da haste fica mais cheio -->
      <circle cx="130" cy="64" r="17" fill="${COR.casca}" stroke="none"/>
    </g>
  </g>`;
}

function rosto() {
  return `
  <!-- dobrinhas da tromba -->
  <path d="M84 29 q3 7 0 14 M72 33 q4 7 1 14 M61 42 q5 5 3 12" stroke="${COR.cascaEscura}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.7"/>
  <!-- ponta da tromba -->
  <ellipse cx="60" cy="84" rx="2.4" ry="1.8" fill="${COR.cascaEscura}"/>
  <!-- presa -->
  <path d="M116 82 q-7 11 -19 11 q9 -5 12 -14 z" fill="${COR.presa}"/>
  <!-- olho -->
  <ellipse cx="127" cy="60" rx="5.6" ry="6.6" fill="${COR.olho}"/>
  <circle cx="129" cy="57.8" r="2" fill="${COR.brilho}"/>
  <ellipse cx="122" cy="75" rx="5.4" ry="3.2" fill="${COR.bochecha}" opacity="0.85"/>`;
}

/** Miolo da barriga do "a" como uma fatia de kiwi (conceito B). */
function barrigaDeKiwi() {
  return `
  <g>
    <ellipse cx="100" cy="146" rx="22" ry="10.5" fill="${COR.polpa}"/>
    <ellipse cx="100" cy="146" rx="12.5" ry="5.8" fill="${COR.polpaClara}"/>
    <ellipse cx="100" cy="146" rx="5.5" ry="2.7" fill="${COR.miolo}"/>
    ${sementes(100, 146, 9, 10, 0.9, 1.9)}
  </g>`;
}

function svg({ fundo, extra = '', penugem = true, canto = 44, semFundo = false, escala = 1, branco = false }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Aquenda">
  <title>Aquenda</title>
  <defs>${defsCasca('casca')}${defsPenugem('penugem')}</defs>
  ${branco ? '<filter id="branco"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>' : ''}
  ${semFundo ? '' : `<rect width="200" height="200" rx="${canto}" fill="${fundo}"/>`}
  <g transform="translate(100 100) scale(${escala}) translate(-104 -98)" ${branco ? 'filter="url(#branco)"' : ''}>
    ${orelha()}
    ${letra({ penugem })}
    ${extra}
    ${rosto()}
  </g>
</svg>`;
}

const CONCEITOS = {
  'A-casca': svg({ fundo: '#FFE7D4' }),
  'B-barriga-de-kiwi': svg({ fundo: '#FFF3CF', extra: barrigaDeKiwi() }),
  'C-sobre-verde': svg({ fundo: '#DDF5EA', penugem: false }),
};

// Arquivos do app (assets/). O ícone do Android é adaptativo: o desenho fica no centro,
// dentro da zona segura de 66%, e o fundo vem do app.json.
const ASSETS = {
  'icon.png': svg({ fundo: '#FFE7D4', canto: 0 }),
  'android-icon-foreground.png': svg({ semFundo: true, escala: 0.62 }),
  'android-icon-monochrome.png': svg({ semFundo: true, escala: 0.62, branco: true }),
  'splash-icon.png': svg({ semFundo: true, escala: 0.92 }),
  'mascote.png': svg({ semFundo: true, escala: 1.0 }),
};

async function main() {
  const saida = process.argv[2] || '.';
  fs.mkdirSync(saida, { recursive: true });
  let Resvg;
  try {
    ({ Resvg } = require('@resvg/resvg-js'));
  } catch {
    console.log('sem @resvg/resvg-js: só os SVGs foram gerados');
  }
  for (const [nome, conteudo] of Object.entries(CONCEITOS)) {
    fs.writeFileSync(path.join(saida, `${nome}.svg`), conteudo);
    if (Resvg) {
      const png = new Resvg(conteudo, { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
      fs.writeFileSync(path.join(saida, `${nome}.png`), png);
    }
    console.log('ok', nome);
  }
  if (Resvg && process.argv[3]) {
    for (const [nome, conteudo] of Object.entries(ASSETS)) {
      const png = new Resvg(conteudo, { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
      fs.writeFileSync(path.join(process.argv[3], nome), png);
      console.log('asset', nome);
    }
  }
}

module.exports = { svg, COR, barrigaDeKiwi };
if (require.main === module) main();
