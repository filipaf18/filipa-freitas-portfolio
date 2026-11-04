// Gera SVG + PNG (transparente) do Apresentador, estúdio, logótipo e kit gráfico.
// Uso: node build.js   (precisa de playwright; Chromium pré-instalado)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'png');
const SVG = path.join(__dirname, '..', 'svg');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SVG, { recursive: true });

// Paleta obrigatória
const O = '#F58220', OD = '#D96516', W = '#FFFFFF', K = '#171717', N = '#172A3A', G = '#E9E9E9';
// EXTRA (fora da paleta, a aprovar pela Filipa): tom de pele do Apresentador
const PELE = '#F1C7A3';
const FONT = "font-family=\"'Arial Black','Helvetica Neue',Arial,sans-serif\" font-weight=\"900\"";

// ---------- APRESENTADOR (original, sem semelhança com ninguém real) ----------
function apresentador({ boca = 'neutra', sobr = 'neutra', cartao = true, sino = false }) {
  const bocas = {
    neutra: `<path d="M262 318 q38 14 76 0" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/>`,
    aberta: `<path d="M258 312 q42 4 84 0 q-6 46 -42 46 q-36 0 -42 -46z" fill="${K}"/><path d="M276 344 q24 -14 48 0 q-8 12 -24 12 q-16 0 -24 -12z" fill="${OD}"/>`,
    ironica: `<path d="M262 322 q30 10 76 -8" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/>`,
  };
  const sobrs = {
    neutra: `<path d="M228 218 q32 -14 62 -2 M310 216 q30 -12 62 2" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/>`,
    erguida: `<path d="M226 206 q32 -22 64 -8 M310 214 q30 -8 62 6" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/>`,
    franzida: `<path d="M228 208 q34 6 62 16 M310 224 q28 -10 62 -16" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round"/>`,
  };
  const pupY = sino ? 246 : 250;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <g id="sombra"><ellipse cx="300" cy="880" rx="190" ry="14" fill="${K}" opacity=".18"/></g>
  <g id="corpo">
    <path d="M110 880 q-10 -250 60 -340 q60 -50 130 -50 q70 0 130 50 q70 90 60 340z" fill="${N}" stroke="${K}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M240 492 l60 120 l60 -120 q-60 -30 -120 0z" fill="${W}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M285 520 h30 l14 40 l-29 90 l-29 -90z" fill="${O}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M180 520 l60 -28 l40 130 l-70 30z M420 520 l-60 -28 l-40 130 l70 30z" fill="${K}" opacity=".25"/>
    <rect x="378" y="640" width="36" height="30" rx="6" fill="${G}" stroke="${K}" stroke-width="5"/>
  </g>
  <g id="pescoco"><path d="M262 440 h76 v60 q-38 26 -76 0z" fill="${PELE}" stroke="${K}" stroke-width="7" stroke-linejoin="round"/></g>
  <g id="cabeca_base">
    <ellipse cx="190" cy="290" rx="26" ry="38" fill="${PELE}" stroke="${K}" stroke-width="8"/>
    <ellipse cx="410" cy="290" rx="26" ry="38" fill="${PELE}" stroke="${K}" stroke-width="8"/>
    <path d="M196 240 q0 -150 104 -150 q104 0 104 150 q0 150 -104 190 q-104 -40 -104 -190z" fill="${PELE}" stroke="${K}" stroke-width="9" stroke-linejoin="round"/>
    <path d="M190 232 q-6 -128 112 -138 q112 -6 112 138 q-30 -64 -110 -70 q-80 4 -114 70z" fill="${K}"/>
    <path d="M214 156 q70 -40 150 -6" fill="none" stroke="${G}" stroke-width="6" stroke-linecap="round" opacity=".5"/>
  </g>
  <g id="sobrancelhas">${sobrs[sobr]}</g>
  <g id="olhos">
    <ellipse cx="260" cy="246" rx="22" ry="${sino ? 28 : 24}" fill="${W}" stroke="${K}" stroke-width="6"/>
    <ellipse cx="340" cy="246" rx="22" ry="${sino ? 28 : 24}" fill="${W}" stroke="${K}" stroke-width="6"/>
    <circle cx="266" cy="${pupY}" r="9" fill="${K}"/><circle cx="346" cy="${pupY}" r="9" fill="${K}"/>
  </g>
  <path id="nariz" d="M300 250 q-16 38 4 52 q10 4 14 -4" fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"/>
  <g id="boca">${bocas[boca]}</g>
  <g id="objeto">
    ${cartao ? `<g transform="rotate(-6 150 640)"><rect x="70" y="560" width="170" height="120" rx="10" fill="${W}" stroke="${K}" stroke-width="7"/><rect x="86" y="580" width="110" height="12" rx="6" fill="${O}"/><rect x="86" y="604" width="138" height="9" rx="4" fill="${G}"/><rect x="86" y="624" width="120" height="9" rx="4" fill="${G}"/><circle cx="212" cy="660" r="9" fill="${O}"/></g>
    <circle cx="150" cy="690" r="30" fill="${PELE}" stroke="${K}" stroke-width="7"/>` : ''}
    ${sino ? `<g transform="translate(470 560)"><path d="M0 70 q-10 -70 44 -78 q54 8 44 78z" fill="${O}" stroke="${K}" stroke-width="7" stroke-linejoin="round"/><rect x="-6" y="70" width="100" height="16" rx="8" fill="${OD}" stroke="${K}" stroke-width="7"/><circle cx="44" cy="102" r="12" fill="${K}"/><rect x="38" y="-26" width="12" height="18" fill="${K}"/><path d="M-30 20 l-22 -14 M-32 52 l-26 4 M120 20 l22 -14 M122 52 l26 4" stroke="${K}" stroke-width="6" stroke-linecap="round"/></g>
    <circle cx="520" cy="700" r="32" fill="${PELE}" stroke="${K}" stroke-width="7"/>` : ''}
  </g>
</svg>`;
}

// ---------- ESTÚDIO (1920x1080, fundo opaco) ----------
function estudio() {
  const lugar = (x) => `<g transform="translate(${x} 0)"><rect x="-120" y="640" width="240" height="26" rx="8" fill="${W}" stroke="${K}" stroke-width="6"/><path d="M-110 666 h220 l-18 120 h-184z" fill="${G}" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><rect x="-70" y="684" width="140" height="34" rx="6" fill="${N}"/><text x="0" y="710" text-anchor="middle" ${FONT} font-size="20" fill="${O}">LUGAR</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="${N}"/>
  <path d="M0 760 h1920 v320 h-1920z" fill="${K}"/>
  <rect y="758" width="1920" height="8" fill="${O}"/>
  <g id="paineis_laranja">
    <path d="M0 0 h300 l-150 760 h-150z" fill="${O}"/><path d="M0 0 h220 l-150 760 h-70z" fill="${OD}"/>
    <path d="M1920 0 h-300 l150 760 h150z" fill="${O}"/><path d="M1920 0 h-220 l150 760 h70z" fill="${OD}"/>
  </g>
  <g id="painel_central">
    <rect x="360" y="70" width="1200" height="520" rx="22" fill="${K}" stroke="${O}" stroke-width="10"/>
    <rect x="392" y="102" width="1136" height="456" rx="12" fill="${N}"/>
    <path d="M392 102 h1136 v60 h-1136z" fill="${O}"/>
    <text x="960" y="146" text-anchor="middle" ${FONT} font-size="34" fill="${K}">A FRASE EM CAUSA</text>
    <g id="ecra_frase"><rect x="440" y="200" width="1040" height="300" rx="10" fill="${K}" opacity=".35"/>
    <text x="960" y="360" text-anchor="middle" ${FONT} font-size="64" fill="${W}">«  A FRASE VAI AQUI  »</text></g>
    <g opacity=".5"><circle cx="440" cy="530" r="7" fill="${O}"/><circle cx="480" cy="530" r="7" fill="${W}"/><circle cx="520" cy="530" r="7" fill="${O}"/></g>
  </g>
  <g id="mesa_angular">
    <path d="M140 640 L960 590 L1780 640 L1880 760 L40 760z" fill="${W}" stroke="${K}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M40 760 L1880 760 L1880 1080 L40 1080z" fill="${O}" stroke="${K}" stroke-width="8"/>
    <path d="M40 760 L1880 760 L1880 800 L40 800z" fill="${OD}"/>
    <text x="960" y="940" text-anchor="middle" ${FONT} font-size="76" fill="${K}">QUEM É QUE DISSE ISTO?</text>
  </g>
  <g id="lugares" opacity="0">${[360, 760, 1160, 1560].map(lugar).join('')}</g>
  <g id="aviso"><rect x="560" y="1010" width="800" height="48" rx="24" fill="${K}"/>
    <text x="960" y="1044" text-anchor="middle" ${FONT} font-size="26" fill="${W}">HUMOR · FALAS FICCIONAIS</text></g>
</svg>`;
}

// ---------- LOGÓTIPO ----------
function logo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="520" viewBox="0 0 1400 520">
  <g transform="rotate(-3 700 260)">
    <rect x="40" y="60" width="1320" height="400" rx="40" fill="${K}"/>
    <rect x="20" y="40" width="1320" height="400" rx="40" fill="${O}" stroke="${K}" stroke-width="10"/>
    <text x="570" y="210" text-anchor="middle" ${FONT} font-size="136" fill="${K}">QUEM É QUE</text>
    <text x="570" y="360" text-anchor="middle" ${FONT} font-size="136" fill="${W}" stroke="${K}" stroke-width="10" paint-order="stroke">DISSE ISTO</text>
    <g transform="translate(1160 250)"><path d="M-110 -150 h220 q40 0 40 40 v140 q0 40 -40 40 h-90 l-50 60 l-10 -60 h-70 q-40 0 -40 -40 v-140 q0 -40 40 -40z" fill="${W}" stroke="${K}" stroke-width="10" stroke-linejoin="round"/>
      <text x="0" y="40" text-anchor="middle" ${FONT} font-size="190" fill="${OD}">?</text></g>
  </g>
  <text x="690" y="500" text-anchor="middle" ${FONT} font-size="30" fill="${N}" letter-spacing="8">JSD FAMALICÃO · 50 ANOS</text>
</svg>`;
}

// ---------- KIT GRÁFICO (cada peça = 1 PNG transparente) ----------
const kit = {
  kit_etiqueta_nome: [900, 200, `<rect x="14" y="20" width="872" height="160" rx="16" fill="${K}"/><rect x="0" y="6" width="872" height="160" rx="16" fill="${W}" stroke="${K}" stroke-width="8"/><rect x="0" y="6" width="40" height="160" rx="16" fill="${O}" stroke="${K}" stroke-width="8"/><text x="80" y="82" ${FONT} font-size="62" fill="${K}">NOME DO SUSPEITO</text><rect x="80" y="104" width="360" height="40" rx="20" fill="${N}"/><text x="260" y="134" text-anchor="middle" ${FONT} font-size="24" fill="${O}">SUSPEITO N.º 1</text>`],
  kit_indicador_fala: [260, 260, `<circle cx="130" cy="130" r="108" fill="none" stroke="${O}" stroke-width="22"/><circle cx="130" cy="130" r="82" fill="none" stroke="${K}" stroke-width="6"/><circle cx="130" cy="130" r="122" fill="none" stroke="${K}" stroke-width="6"/><path d="M96 124 q0 -44 34 -44 q34 0 34 44 v24 q0 40 -34 40 q-34 0 -34 -40z" fill="${O}" stroke="${K}" stroke-width="7"/>`],
  kit_barra_debate: [1200, 120, `<rect x="0" y="10" width="1200" height="100" rx="50" fill="${K}"/><rect x="12" y="22" width="1176" height="76" rx="38" fill="${G}"/><rect x="12" y="22" width="700" height="76" rx="38" fill="${O}"/><rect x="12" y="22" width="700" height="30" rx="15" fill="${OD}" opacity=".5"/><text x="360" y="74" text-anchor="middle" ${FONT} font-size="34" fill="${K}">TEMPERATURA DO DEBATE</text>`],
  kit_alerta_interrupcao: [900, 220, `<path d="M20 40 L880 20 L860 190 L40 200z" fill="${K}"/><path d="M0 30 L870 10 L850 180 L20 190z" fill="${O}" stroke="${K}" stroke-width="10" stroke-linejoin="round"/><text x="435" y="130" text-anchor="middle" ${FONT} font-size="86" fill="${W}" stroke="${K}" stroke-width="10" paint-order="stroke">INTERRUPÇÃO!</text>`],
  kit_contador: [360, 360, `<circle cx="180" cy="190" r="160" fill="${K}"/><circle cx="170" cy="180" r="160" fill="${W}" stroke="${K}" stroke-width="10"/><circle cx="170" cy="180" r="128" fill="none" stroke="${G}" stroke-width="26"/><path d="M170 52 a128 128 0 1 1 -90 36" fill="none" stroke="${O}" stroke-width="26" stroke-linecap="round"/><text x="170" y="218" text-anchor="middle" ${FONT} font-size="66" fill="${K}">00:30</text>`],
  kit_aviso_ficcional: [900, 90, `<rect x="0" y="0" width="900" height="90" rx="45" fill="${K}" opacity=".92"/><text x="450" y="60" text-anchor="middle" ${FONT} font-size="38" fill="${W}">HUMOR · FALAS FICCIONAIS</text>`],
  kit_campainha: [260, 260, `<path d="M40 190 q-14 -110 90 -120 q104 10 90 120z" fill="${O}" stroke="${K}" stroke-width="9" stroke-linejoin="round"/><rect x="26" y="190" width="208" height="26" rx="13" fill="${OD}" stroke="${K}" stroke-width="9"/><circle cx="130" cy="232" r="16" fill="${K}"/><rect x="120" y="36" width="20" height="34" rx="6" fill="${K}"/><path d="M20 100 l-16 -20 M236 100 l16 -20 M12 150 l-10 0 M248 150 l10 0" stroke="${K}" stroke-width="9" stroke-linecap="round"/>`],
  kit_pergunta_kahoot: [700, 200, `<rect x="12" y="18" width="676" height="170" rx="26" fill="${K}"/><rect x="0" y="4" width="676" height="170" rx="26" fill="${N}" stroke="${K}" stroke-width="8"/><rect x="0" y="4" width="170" height="170" rx="26" fill="${O}" stroke="${K}" stroke-width="8"/><text x="85" y="132" text-anchor="middle" ${FONT} font-size="120" fill="${W}">?</text><text x="420" y="104" text-anchor="middle" ${FONT} font-size="48" fill="${W}">QUEM DISSE ISTO?</text><text x="420" y="146" text-anchor="middle" ${FONT} font-size="26" fill="${O}">VOTA NO KAHOOT</text>`],
};
const wrap = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;

const items = [
  ['apresentador_neutro', 600, 900, apresentador({ boca: 'neutra', sobr: 'neutra' })],
  ['apresentador_cartao_ironico', 600, 900, apresentador({ boca: 'ironica', sobr: 'erguida' })],
  ['apresentador_campainha', 600, 900, apresentador({ boca: 'aberta', sobr: 'franzida', cartao: false, sino: true })],
  ['estudio_cenario', 1920, 1080, estudio()],
  ['logo_quem_disse_isto', 1400, 520, logo()],
  ...Object.entries(kit).map(([n, [w, h, s]]) => [n, w, h, wrap(w, h, s)]),
];

(async () => {
  const b = await chromium.launch();
  for (const [name, w, h, svg] of items) {
    fs.writeFileSync(path.join(SVG, name + '.svg'), svg);
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await p.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
    await p.screenshot({ path: path.join(OUT, name + '.png'), omitBackground: true });
    await p.close();
    console.log('ok', name);
  }
  await b.close();
})();
