// Cartão de bingo A6 horizontal (148×105 mm), 300 dpi → 1748×1240 px. Variante "bolas", números 1–12.
// Uso: node gerar_cartao_a6.js [pasta_saida]   (env: NUMEROS='[12 números por linhas]', NUM='001', NOME='bingo-A6')
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'fase1-v8');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w) => b64(`assets/fonts/montserrat-latin-${w}-normal.woff2`, 'font/woff2');
const logoPreto = b64('assets/logo-h-preto.png', 'image/png');
const numeros = process.env.NUMEROS ? JSON.parse(process.env.NUMEROS) : [7,2,11,5, 9,12,3,8, 1,6,10,4];
const NUM = process.env.NUM || '001';
const NOME = process.env.NOME || 'bingo-A6';
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';

const css = `
${[300,500,700,800].map(w=>`@font-face{font-family:M;font-weight:${w};src:url(${font(w)}) format('woff2')}`).join('')}
@page{size:148mm 105mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:148mm;height:105mm;font-family:M,sans-serif;color:#0A0701;background:#fff}
.card{position:relative;width:148mm;height:105mm;overflow:hidden;background:#fff;padding:6.5mm 8mm 0;display:flex;flex-direction:column}
.card::after{content:'';position:absolute;left:0;right:0;bottom:0;height:2.4mm;background:${G}}
.gt{background:${G};-webkit-background-clip:text;background-clip:text;color:transparent}
header{flex-shrink:0;height:18mm;display:flex;justify-content:space-between;align-items:flex-start}
h1{font-weight:300;font-size:11pt;line-height:1;letter-spacing:.32em;text-transform:uppercase}
h1 b{font-weight:800;display:block;font-size:23pt;letter-spacing:-.01em;line-height:1;margin-top:.8mm;text-transform:none}
.sub{display:inline-block;margin-top:1.4mm;font-size:5.6pt;font-weight:700;letter-spacing:.24em;text-transform:none}
.right{display:flex;flex-direction:column;align-items:flex-end;gap:2mm}
.right img{height:7.6mm;display:block}
.nr{font-size:5.8pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.nr b{font-weight:800;font-size:9pt;letter-spacing:.1em;margin-left:1.2mm}
.grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(0,1fr);border-top:.3mm solid #0A0701;border-bottom:.3mm solid #0A0701;padding:1mm 0}
.n{display:flex;align-items:center;justify-content:center}
.ball{width:19mm;height:19mm;border-radius:50%;background:${G};padding:.9mm;display:flex}
.ball i{flex:1;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:31pt;line-height:1;letter-spacing:-.02em}
footer{flex-shrink:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;height:10mm;margin:2mm 0 5mm}
.d1{font-size:5.8pt;font-weight:300;letter-spacing:.05em}
.d2{font-size:5.4pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-top:.4mm}
.motto{text-align:center;font-size:8pt;line-height:1.12;text-transform:uppercase}
.motto span{display:block;font-weight:300}.motto b{display:block;font-weight:800}
.sede{text-align:right;font-size:5.4pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.5}
`;
const html = `<div class="card"><header><div><h1>Bingo<b>Cinco Jotas</b></h1><div class="sub gt">Rookie · Pro · Premium</div></div><div class="right"><img src="${logoPreto}"><div class="nr">Nº<b>${NUM}</b></div></div></header>
<div class="grid">${numeros.map(n=>`<div class="n"><div class="ball"><i>${n}</i></div></div>`).join('')}</div>
<footer><div><div class="d1">1976_2026</div><div class="d2">7 de novembro de 2026</div></div><div class="motto"><span class="gt">Cinco Décadas</span><b class="gt">Uma Identidade</b></div><div class="sede">Sunset House<br>Famalicão</div></footer></div>`;

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:560,height:397},deviceScaleFactor:3.125});
  await p.setContent(`<!doctype html><meta charset=utf-8><style>${css}</style>${html}`);
  await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:path.join(OUT,`${NOME}.png`),clip:{x:0,y:0,width:559.37,height:396.85}});
  await b.close();
})();
