const O='#F58220',OD='#D96516',W='#FFFFFF',K='#171717',N='#172A3A',G='#E9E9E9',PELE='#F1C7A3';
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
    <path d="M110 880 q-10 -250 60 -340 q60 -50 130 -50 q70 0 130 50 q70 90 60 340z" fill="${N}"/>
    <path d="M240 492 l60 120 l60 -120 q-60 -30 -120 0z" fill="${W}"/>
    <path d="M285 520 h30 l14 40 l-29 90 l-29 -90z" fill="${O}"/>
    <path d="M180 520 l60 -28 l40 130 l-70 30z M420 520 l-60 -28 l-40 130 l70 30z" fill="${K}" opacity=".25"/>
    <rect x="378" y="640" width="36" height="30" rx="6" fill="${G}"/>
  </g>
  <g id="pescoco"><path d="M262 440 h76 v60 q-38 26 -76 0z" fill="${PELE}"/></g>
  <g id="cabeca_base">
    <ellipse cx="190" cy="290" rx="26" ry="38" fill="${PELE}"/>
    <ellipse cx="410" cy="290" rx="26" ry="38" fill="${PELE}"/>
    <path d="M196 240 q0 -150 104 -150 q104 0 104 150 q0 150 -104 190 q-104 -40 -104 -190z" fill="${PELE}"/>
    <path d="M190 232 q-6 -138 112 -150 q112 -8 112 150 q-30 -64 -110 -70 q-80 4 -114 70z" fill="${K}"/>
    <path d="M214 156 q70 -40 150 -6" fill="none" stroke="${G}" stroke-width="6" stroke-linecap="round" opacity=".5"/>
  </g>
  <g id="sobrancelhas">${sobrs[sobr]}</g>
  <g id="olhos">
    <ellipse cx="260" cy="246" rx="22" ry="${sino ? 28 : 24}" fill="${W}"/>
    <ellipse cx="340" cy="246" rx="22" ry="${sino ? 28 : 24}" fill="${W}"/>
    <circle cx="266" cy="${pupY}" r="9" fill="${K}"/><circle cx="346" cy="${pupY}" r="9" fill="${K}"/>
  </g>
  <path d="M300 90 q104 0 104 150 q0 150 -104 190 q60 -70 60 -190 q0 -110 -60 -150z" fill="#000" opacity=".08"/><path id="nariz" d="M300 250 q-16 38 4 52 q10 4 14 -4" fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"/>
  <g id="boca">${bocas[boca]}</g>
  <g id="objeto">
    ${cartao ? `<g transform="rotate(-6 150 640)"><rect x="70" y="560" width="170" height="120" rx="10" fill="${W}"/><rect x="86" y="580" width="110" height="12" rx="6" fill="${O}"/><rect x="86" y="604" width="138" height="9" rx="4" fill="${G}"/><rect x="86" y="624" width="120" height="9" rx="4" fill="${G}"/><circle cx="212" cy="660" r="9" fill="${O}"/></g>
    <circle cx="150" cy="690" r="30" fill="${PELE}"/>` : ''}
    ${sino ? `<g transform="translate(470 560)"><path d="M0 70 q-10 -70 44 -78 q54 8 44 78z" fill="${O}"/><rect x="-6" y="70" width="100" height="16" rx="8" fill="${OD}"/><circle cx="44" cy="102" r="12" fill="${K}"/><rect x="38" y="-26" width="12" height="18" fill="${K}"/><path d="M-30 20 l-22 -14 M-32 52 l-26 4 M120 20 l22 -14 M122 52 l26 4" stroke-linecap="round"/></g>
    <circle cx="520" cy="700" r="32" fill="${PELE}"/>` : ''}
  </g>
</svg>`;
}


module.exports=apresentador;
