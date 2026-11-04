// Sistema de personagens "3D estilizado" (sombreado volumétrico em SVG).
// Mesmas camadas e proporções para os 4 suspeitos + Apresentador → "igualmente suspeitos".
// Tons de pele e cabelo são EXTRA à paleta (a aprovar). Fato/gravata/mesa usam a paleta.
const O = '#F58220', OD = '#D96516', W = '#FFFFFF', K = '#171717', N = '#172A3A', G = '#E9E9E9';

const PRESETS = {
  // Traços baseados nas fotos de referência (cabelo, sobrancelhas, óculos, forma da cara).
  cavaco: { nome: 'Cavaco Silva', pele: ['#F2CDAE', '#E2B08C', '#B9835F'], cabelo: ['#C9CED3', '#8E959C', '#5C636A'],
    w: 122, h: 250, jaw: .5, hl: -26, vol: 34, lid: .45, nl: 1.1, exm: .8, mw: .62, chin: 26, bgap: 14, nw: .85, estilo: 'atras', sobr: { t: 24, w: 80, cor: '#3B4045' }, oculos: 'nenhum', nariz: 1.1, orelha: 1.3,
    rugas: true, sorriso: -.9, fato: N, gravata: OD, camisa: G, prop: 'caneta', brilho: 1 },
  passos: { nome: 'Passos Coelho', pele: ['#F3CBAA', '#E4B08C', '#B98562'], cabelo: ['#6B4A36', '#3E2A1F', '#22160F'],
    w: 120, h: 244, jaw: .64, hl: 46, vol: 44, lid: .2, nl: 1.25, exm: 1.07, erm: 1.18, mw: .75, myo: 12, bgap: -6, estilo: 'lado', sobr: { t: 20, w: 76, cor: '#2A1B13' }, oculos: 'fino', nariz: 1.05, orelha: 1,
    rugas: false, sorriso: .0, fato: N, gravata: O, camisa: W, prop: 'copo', brilho: 1 },
  // PROVISÓRIO: sem foto utilizável → só adereços do briefing, traços genéricos (sem semelhança).
  portas: { nome: 'Paulo Portas (PROVISÓRIO)', pele: ['#F1C9A8', '#E1AE8A', '#B6805D'], cabelo: ['#9A9A9A', '#6E6E6E', '#444'],
    w: 140, h: 200, jaw: .64, hl: 22, estilo: 'lado', sobr: { t: 13, w: 66, cor: '#555' }, oculos: 'nenhum', nariz: 1.0, orelha: 1,
    rugas: false, sorriso: .1, fato: N, gravata: G, camisa: W, prop: 'pasta', brilho: 1 },
  montenegro: { nome: 'Luís Montenegro', pele: ['#EDBF9B', '#D9A07A', '#AD7653'], cabelo: ['#4A3B33', '#2B211C', '#15100D'],
    w: 176, h: 180, jaw: .88, hl: -4, vol: 26, lid: .3, nl: 1.0, exm: 1.12, nw: 1.25, bgap: -6, chin: -10, estilo: 'lado', sobr: { t: 22, w: 80, cor: '#1c1411' }, oculos: 'nenhum', nariz: 1.0, orelha: 1,
    rugas: false, sorriso: .75, fato: N, gravata: W, camisa: W, prop: 'microfone', brilho: 1 },
  apresentador: { nome: 'Apresentador', pele: ['#F5D3B5', '#E6B796', '#BC8A67'], cabelo: ['#3B3B3B', '#171717', '#050505'],
    w: 140, h: 200, jaw: .62, hl: 8, estilo: 'curto', sobr: { t: 14, w: 66, cor: '#171717' }, oculos: 'nenhum', nariz: .95, orelha: 1,
    rugas: false, sorriso: .5, fato: '#0f1d29', gravata: O, camisa: W, prop: 'cartao', brilho: 1 },
};

const EXPR = {
  neutro: { brow: [0, 0], raiseL: 0, raiseR: 0, boca: 'base', olhos: 1 },
  nega: { brow: [-10, 10], raiseL: -4, raiseR: -14, boca: 'aberta', olhos: 1.12 },       // «Eu?! Nunca disse isso!»
  ironico: { brow: [4, 8], raiseL: 0, raiseR: -16, boca: 'ironico', olhos: .9 },
};

function suspeito(key, expr = 'neutro', uid = key) {
  const P = PRESETS[key], E = EXPR[expr], cx = 300, cy = 300, w = P.w, h = P.h, j = P.jaw;
  const [s1, s2, s3] = P.pele, [h1, h2, h3] = P.cabelo;
  const id = (n) => `${uid}_${n}`;
  const head = `M${cx} ${cy - h} C${cx + w * 1.02} ${cy - h} ${cx + w * 1.02} ${cy - h * .05} ${cx + w * .93} ${cy + h * .28} C${cx + w * .82} ${cy + h * .8} ${cx + w * j * .55} ${cy + h * 1.02 + (P.chin || 0)} ${cx} ${cy + h * 1.03 + (P.chin || 0)} C${cx - w * j * .55} ${cy + h * 1.02 + (P.chin || 0)} ${cx - w * .82} ${cy + h * .8} ${cx - w * .93} ${cy + h * .28} C${cx - w * 1.02} ${cy - h * .05} ${cx - w * 1.02} ${cy - h} ${cx} ${cy - h}Z`;
  const ex = 56 * (P.exm || 1), ey = cy - 8, er = 27 * E.olhos * (P.erm || 1);
  const sm = P.sorriso;
  // boca
  let boca = '';
  const my = cy + 100;
  if (E.boca === 'aberta') boca = `<path d="M${cx - 44} ${my - 4} Q${cx} ${my + 8} ${cx + 44} ${my - 4} Q${cx + 40} ${my + 58} ${cx} ${my + 58} Q${cx - 40} ${my + 58} ${cx - 44} ${my - 4}Z" fill="#3a1410"/>
     <path d="M${cx - 40} ${my - 2} Q${cx} ${my + 8} ${cx + 40} ${my - 2} L${cx + 38} ${my + 12} Q${cx} ${my + 20} ${cx - 38} ${my + 12}Z" fill="#fff"/>
     <ellipse cx="${cx}" cy="${my + 44}" rx="22" ry="11" fill="#D9604C"/>`;
  else if (E.boca === 'ironico') boca = `<path d="M${cx - 38} ${my + 6} Q${cx - 4} ${my + 14} ${cx + 40} ${my - 8}" fill="none" stroke="#7a3a2e" stroke-width="7" stroke-linecap="round"/><path d="M${cx + 40} ${my - 8} q8 -6 10 -14" fill="none" stroke="#7a3a2e" stroke-width="5" stroke-linecap="round"/>`;
  else if (sm > .5) boca = `<path d="M${cx - 50} ${my - 10} Q${cx} ${my + 10} ${cx + 50} ${my - 10} Q${cx + 40} ${my + 44} ${cx} ${my + 44} Q${cx - 40} ${my + 44} ${cx - 50} ${my - 10}Z" fill="#3a1410"/><path d="M${cx - 46} ${my - 8} Q${cx} ${my + 8} ${cx + 46} ${my - 8} L${cx + 42} ${my + 10} Q${cx} ${my + 20} ${cx - 42} ${my + 10}Z" fill="#fff"/>`;
  else boca = `<path d="M${cx - 36} ${my} Q${cx} ${my + 10 + sm * 14} ${cx + 36} ${my}" fill="none" stroke="#7a3a2e" stroke-width="7" stroke-linecap="round"/><path d="M${cx - 30} ${my + 12} Q${cx} ${my + 22} ${cx + 30} ${my + 12}" fill="none" stroke="${s3}" stroke-width="5" stroke-linecap="round" opacity=".55"/>`;
  // sobrancelhas
  const b = P.sobr;
  const brow = (sx, ang, raise) => `<g transform="translate(${cx + sx * ex * 1.05} ${cy - 52 - (P.bgap || 0) + raise}) rotate(${ang * sx})"><path d="M${-b.w / 2} ${b.t * .5} Q0 ${-b.t * 1.2} ${b.w / 2} ${b.t * .2} L${b.w / 2} ${b.t * 1.0} Q0 ${-b.t * .1} ${-b.w / 2} ${b.t * 1.1}Z" fill="${b.cor}"/></g>`;
  // cabelo
  const top = cy - h;
  const vol0 = P.vol || 0; const hairOuter = `M${cx - w - 10} ${cy + 22} C${cx - w - 24 - vol0 * .3} ${top + 40} ${cx - w * .6} ${top - 36 - vol0} ${cx} ${top - 30 - vol0} C${cx + w * .6} ${top - 36 - vol0} ${cx + w + 24 + vol0 * .3} ${top + 40} ${cx + w + 10} ${cy + 22}`;
  const hl = P.hl; const vol = P.vol || 0;
  let hair = '';
  if (P.estilo === 'atras') {
    hair = `<path d="${hairOuter} L${cx + w - 14} ${cy - 62} C${cx + w * .8} ${cy - 128} ${cx + w * .45} ${cy - 150 + hl} ${cx} ${cy - 150 + hl} C${cx - w * .45} ${cy - 150 + hl} ${cx - w * .8} ${cy - 128} ${cx - w + 14} ${cy - 62}Z" fill="url(#${id('hair')})"/>
      <path d="M${cx - w * .7} ${top + 16} Q${cx} ${top - 16} ${cx + w * .7} ${top + 10}" fill="none" stroke="${h1}" stroke-width="10" stroke-linecap="round" opacity=".7" filter="url(#${id('bl3')})"/>`;
  } else if (P.estilo === 'lado') {
    hair = `<path d="${hairOuter} L${cx + w - 12} ${cy - 60} C${cx + w * .6} ${cy - 118} ${cx + w * .1} ${cy - 120 + hl} ${cx - w * .5} ${cy - 112 + hl} C${cx - w * .8} ${cy - 106} ${cx - w + 18} ${cy - 70} ${cx - w + 14} ${cy - 40}Z" fill="url(#${id('hair')})"/>
      <path d="M${cx - w * .3} ${top - 18} C${cx - w * .1} ${top + 20} ${cx + w * .2} ${top + 40} ${cx + w * .75} ${top + 70}" fill="none" stroke="${h1}" stroke-width="9" stroke-linecap="round" opacity=".55" filter="url(#${id('bl3')})"/>`;
  } else {
    hair = `<path d="${hairOuter} L${cx + w - 8} ${cy - 36} C${cx + w * .6} ${cy - 110} ${cx + w * .2} ${cy - 122 + hl} ${cx - w * .1} ${cy - 118 + hl} C${cx - w * .6} ${cy - 112} ${cx - w + 10} ${cy - 76} ${cx - w + 8} ${cy - 36}Z" fill="url(#${id('hair')})"/>
      <path d="M${cx - w * .6} ${top + 6} Q${cx} ${top - 24} ${cx + w * .6} ${top + 4}" fill="none" stroke="${h1}" stroke-width="10" stroke-linecap="round" opacity=".5" filter="url(#${id('bl3')})"/>`;
  }
  // óculos
  let oculos = '';
  if (P.oculos === 'fino') oculos = `<g fill="rgba(255,255,255,.08)" stroke="#2a2a2a" stroke-width="4"><rect x="${cx - ex - 40}" y="${ey - 26}" width="80" height="54" rx="14"/><rect x="${cx + ex - 40}" y="${ey - 26}" width="80" height="54" rx="14"/><path d="M${cx - ex + 40} ${ey - 4} Q${cx} ${ey - 14} ${cx + ex - 40} ${ey - 4}" fill="none"/><path d="M${cx - ex - 40} ${ey - 6} L${cx - w + 6} ${ey - 12}M${cx + ex + 40} ${ey - 6} L${cx + w - 6} ${ey - 12}" fill="none"/></g>
    <path d="M${cx - ex - 30} ${ey - 18} L${cx - ex - 4} ${ey - 20}" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`;
  // rugas subtis (dignidade: só nasolabiais suaves)
  const rugas = P.rugas ? `<g fill="none" stroke="${s3}" stroke-width="5" stroke-linecap="round" opacity=".38"><path d="M${cx - 62} ${cy + 40} Q${cx - 74} ${cy + 80} ${cx - 54} ${cy + 108}"/><path d="M${cx + 62} ${cy + 40} Q${cx + 74} ${cy + 80} ${cx + 54} ${cy + 108}"/><path d="M${cx - 60} ${cy - 118 + 6} Q${cx} ${cy - 130 + 6} ${cx + 60} ${cy - 118 + 6}" opacity=".5"/></g>` : '';
  // adereço (retornado separado p/ ficar sobre a mesa)
  const props = {
    caneta: `<g><rect x="-110" y="22" width="150" height="100" rx="6" fill="url(#${id('pap')})" transform="rotate(-4)"/><rect x="-96" y="40" width="100" height="6" rx="3" fill="${O}" opacity=".8" transform="rotate(-4)"/><rect x="-96" y="58" width="120" height="5" rx="2" fill="#c9c9c9" transform="rotate(-4)"/><rect x="-60" y="2" width="130" height="12" rx="6" fill="url(#${id('pen')})" transform="rotate(-4)"/><rect x="34" y="4" width="26" height="9" rx="4" fill="${K}" transform="rotate(-4)"/></g>`,
    copo: `<g><ellipse cx="0" cy="108" rx="46" ry="12" fill="rgba(0,0,0,.3)"/><path d="M-38 12 L-30 106 Q0 118 30 106 L38 12Z" fill="rgba(210,235,245,.45)" stroke="rgba(255,255,255,.8)" stroke-width="3"/><path d="M-34 52 L-29 104 Q0 114 29 104 L34 52Q0 62 -34 52Z" fill="rgba(120,190,215,.55)"/><path d="M-26 20 L-22 90" stroke="#fff" stroke-width="5" opacity=".7" stroke-linecap="round"/></g>`,
    pasta: `<g><ellipse cx="0" cy="112" rx="96" ry="12" fill="rgba(0,0,0,.3)"/><rect x="-92" y="26" width="184" height="86" rx="12" fill="url(#${id('pasta')})"/><rect x="-40" y="12" width="80" height="20" rx="8" fill="none" stroke="#3b1d0d" stroke-width="7"/><rect x="-14" y="52" width="28" height="18" rx="4" fill="${O}"/><g transform="translate(66 18) rotate(10)"><rect width="76" height="52" fill="#fff" stroke="#ccc"/><rect x="8" y="10" width="46" height="4" fill="#bbb"/><rect x="8" y="22" width="56" height="4" fill="#bbb"/></g><g transform="translate(-130 22) rotate(-8)"><rect width="70" height="48" fill="#f5f5f5" stroke="#ccc"/><rect x="8" y="10" width="44" height="4" fill="#bbb"/></g></g>`,
    microfone: `<g><ellipse cx="0" cy="112" rx="60" ry="10" fill="rgba(0,0,0,.3)"/><rect x="-6" y="40" width="12" height="70" fill="#2a2a2a"/><ellipse cx="0" cy="110" rx="34" ry="8" fill="#111"/><rect x="-18" y="-6" width="36" height="58" rx="18" fill="url(#${id('mic')})"/><path d="M-18 14 H18M-18 26 H18M-18 38 H18" stroke="#555" stroke-width="3" opacity=".7"/></g>`,
    cartao: `<g transform="rotate(-8)"><rect x="-80" y="20" width="160" height="100" rx="10" fill="url(#${id('pap')})"/><rect x="-62" y="40" width="100" height="10" rx="5" fill="${O}"/><rect x="-62" y="62" width="124" height="6" rx="3" fill="#cfcfcf"/><rect x="-62" y="78" width="100" height="6" rx="3" fill="#cfcfcf"/></g>`,
  }[P.prop];
  const defs = `<defs>
    <radialGradient id="${id('skin')}" cx="38%" cy="30%" r="85%"><stop offset="0" stop-color="${s1}"/><stop offset=".55" stop-color="${s2}"/><stop offset="1" stop-color="${s3}"/></radialGradient>
    <radialGradient id="${id('ear')}" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="${s2}"/><stop offset="1" stop-color="${s3}"/></radialGradient>
    <linearGradient id="${id('hair')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${h1}"/><stop offset=".5" stop-color="${h2}"/><stop offset="1" stop-color="${h3}"/></linearGradient>
    <linearGradient id="${id('suit')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.fato}"/><stop offset="1" stop-color="#0b1219"/></linearGradient>
    <linearGradient id="${id('tie')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.gravata}"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
    <radialGradient id="${id('eye')}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfd6dc"/></radialGradient>
    <radialGradient id="${id('iris')}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#8a6a4a"/><stop offset="1" stop-color="#2d1d12"/></radialGradient>
    <linearGradient id="${id('pap')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d6d6d6"/></linearGradient>
    <linearGradient id="${id('pen')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#555"/><stop offset=".5" stop-color="#111"/><stop offset="1" stop-color="#000"/></linearGradient>
    <linearGradient id="${id('pasta')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4a2a"/><stop offset="1" stop-color="#3b1d0d"/></linearGradient>
    <linearGradient id="${id('mic')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#999"/><stop offset=".5" stop-color="#eee"/><stop offset="1" stop-color="#555"/></linearGradient>
    <filter id="${id('bl')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="${id('bl2')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="${id('bl3')}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <clipPath id="${id('hc')}"><path d="${head}"/></clipPath>
  </defs>`;
  const body = `${defs}
  <ellipse cx="300" cy="884" rx="230" ry="16" fill="#000" opacity=".25"/>
  <path d="M60 900 Q50 640 150 560 Q220 520 300 520 Q380 520 450 560 Q550 640 540 900Z" fill="url(#${id('suit')})"/>
  <path d="M60 900 Q50 640 150 560 Q170 600 178 700 Q150 800 150 900Z" fill="#000" opacity=".18"/>
  <path d="M230 520 L300 650 L370 520 Q300 560 230 520Z" fill="${P.camisa}"/>
  <path d="M230 520 L292 654 L250 600Z M370 520 L308 654 L350 600Z" fill="#000" opacity=".12"/>
  <path d="M283 556 H317 L330 600 L308 720 L300 740 L292 720 L270 600Z" fill="url(#${id('tie')})"/>
  <path d="M232 520 L170 590 L250 700 L300 650Z M368 520 L430 590 L350 700 L300 650Z" fill="url(#${id('suit')})" opacity=".92"/>
  <path d="M232 520 L170 590 L250 700 L300 650Z" fill="#fff" opacity=".05"/>
  <rect x="262" y="420" width="76" height="120" rx="30" fill="url(#${id('skin')})"/>
  <ellipse cx="300" cy="${cy + h * .98 + 18}" rx="64" ry="22" fill="#000" opacity=".3" filter="url(#${id('bl2')})"/>
  <g transform="translate(300 500) scale(${P.escala || 1.3}) translate(-300 -${500 + Math.round(1.03 * h + (P.chin || 0) - 200 - 20 / 1.3)})">
  <ellipse cx="${cx - w * .97}" cy="${cy + 8}" rx="${24 * P.orelha}" ry="${42 * P.orelha}" fill="url(#${id('ear')})"/>
  <ellipse cx="${cx + w * .97}" cy="${cy + 8}" rx="${24 * P.orelha}" ry="${42 * P.orelha}" fill="url(#${id('ear')})"/>
  <path d="${head}" fill="url(#${id('skin')})"/>
  <g clip-path="url(#${id('hc')})">
    <ellipse cx="${cx + w * 1.0}" cy="${cy}" rx="16" ry="${h * .8}" fill="#F58220" opacity=".6" filter="url(#${id('bl2')})"/>
    <ellipse cx="${cx - w * 1.0}" cy="${cy}" rx="14" ry="${h * .7}" fill="#22BBCB" opacity=".45" filter="url(#${id('bl2')})"/>
    <ellipse cx="${cx + w * .95}" cy="${cy + 30}" rx="${w * .5}" ry="${h}" fill="${s3}" opacity=".45" filter="url(#${id('bl')})"/>
    <ellipse cx="${cx - w * .35}" cy="${cy - h * .38}" rx="${w * .42}" ry="${h * .2}" fill="#fff" opacity=".28" filter="url(#${id('bl')})"/>
    <ellipse cx="${cx - w * .46}" cy="${cy + 52}" rx="34" ry="24" fill="#fff" opacity=".18" filter="url(#${id('bl2')})"/>
    <ellipse cx="${cx + w * .46}" cy="${cy + 56}" rx="34" ry="24" fill="#E0735F" opacity=".22" filter="url(#${id('bl2')})"/>
    <ellipse cx="${cx - w * .46}" cy="${cy + 56}" rx="34" ry="24" fill="#E0735F" opacity=".18" filter="url(#${id('bl2')})"/>
    <ellipse cx="${cx}" cy="${cy + h * 1.0}" rx="${w * .6}" ry="26" fill="${s3}" opacity=".4" filter="url(#${id('bl2')})"/>
    <path d="M${cx - w - 10} ${cy - 60} Q${cx} ${cy - 190} ${cx + w + 10} ${cy - 60}" fill="none" stroke="#000" stroke-width="22" opacity=".08" filter="url(#${id('bl2')})"/>
  </g>
  ${rugas}
  <g id="olhos">
    <ellipse cx="${cx - ex}" cy="${ey}" rx="${er * 1.05}" ry="${er * .95}" fill="url(#${id('eye')})"/><ellipse cx="${cx + ex}" cy="${ey}" rx="${er * 1.05}" ry="${er * .95}" fill="url(#${id('eye')})"/>
    <circle cx="${cx - ex + 5}" cy="${ey + 2}" r="${er * .5}" fill="url(#${id('iris')})"/><circle cx="${cx + ex + 5}" cy="${ey + 2}" r="${er * .5}" fill="url(#${id('iris')})"/>
    <circle cx="${cx - ex + 5}" cy="${ey + 2}" r="${er * .22}" fill="#000"/><circle cx="${cx + ex + 5}" cy="${ey + 2}" r="${er * .22}" fill="#000"/>
    <circle cx="${cx - ex + 11}" cy="${ey - 5}" r="${er * .13}" fill="#fff"/><circle cx="${cx + ex + 11}" cy="${ey - 5}" r="${er * .13}" fill="#fff"/>
    <path d="M${cx - ex - er} ${ey - 4} Q${cx - ex} ${ey - er * 1.25} ${cx - ex + er} ${ey - 4}" fill="none" stroke="${s3}" stroke-width="6" stroke-linecap="round" opacity=".7"/>
    <path d="M${cx + ex - er} ${ey - 4} Q${cx + ex} ${ey - er * 1.25} ${cx + ex + er} ${ey - 4}" fill="none" stroke="${s3}" stroke-width="6" stroke-linecap="round" opacity=".7"/>
  </g>
  ${P.lid ? [-1, 1].map((sx) => `<g><clipPath id="${id('lc' + sx)}"><ellipse cx="${cx + sx * ex}" cy="${ey}" rx="${er * 1.05}" ry="${er * .95}"/></clipPath><rect clip-path="url(#${id('lc' + sx)})" x="${cx + sx * ex - er * 1.1}" y="${ey - er}" width="${er * 2.2}" height="${er * (.25 + P.lid)}" fill="${s2}"/><path d="M${cx + sx * ex - er} ${ey - er + er * (.25 + P.lid)} Q${cx + sx * ex} ${ey - er + er * (.25 + P.lid) + 4} ${cx + sx * ex + er} ${ey - er + er * (.25 + P.lid)}" fill="none" stroke="${s3}" stroke-width="4" opacity=".8" clip-path="url(#${id('lc' + sx)})"/></g>`).join('') : ''}
  <g id="sobrancelhas">${brow(-1, E.brow[0], E.raiseL)}${brow(1, E.brow[1], E.raiseR)}</g>
  <g id="nariz" transform="translate(${cx} ${cy + 46}) scale(${P.nariz * (P.nw || 1)} ${P.nariz * (P.nl || 1)})"><ellipse cx="6" cy="14" rx="34" ry="30" fill="${s3}" opacity=".35" filter="url(#${id('bl2')})"/><ellipse cx="0" cy="12" rx="24" ry="20" fill="url(#${id('skin')})"/><ellipse cx="-6" cy="4" rx="8" ry="6" fill="#fff" opacity=".4"/><ellipse cx="-10" cy="24" rx="4" ry="3" fill="#000" opacity=".45"/><ellipse cx="10" cy="24" rx="4" ry="3" fill="#000" opacity=".45"/></g>
  <g id="boca" transform="translate(${cx} ${my + (P.myo || 0)}) scale(${P.mw || 1} 1) translate(${-cx} ${-my})">${boca}</g>
  ${oculos}
  <g id="cabelo">${hair}</g>
  </g>`;
  return { body, props, uid };
}

const wrapBust = (s, scale = 1) => `<svg xmlns="http://www.w3.org/2000/svg" width="${600 * scale}" height="${1200 * scale}" viewBox="0 -300 600 1200">${s.body}<g transform="translate(300 700)">${s.props}</g></svg>`;
module.exports = { PRESETS, EXPR, suspeito, wrapBust, O, OD, W, K, N, G };
