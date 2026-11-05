// Fase 1 (v3) — cartão de bingo clássico, A5 horizontal 300 dpi, identidade dos materiais dos 50 anos.
// Uso: node gerar_fase1_v2.js [pasta_saida]   (env: DESAFIOS='[...12 textos...]', NUM='001', SUFIXO='')
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'fase1');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w) => b64(`assets/fonts/montserrat-latin-${w}-normal.woff2`, 'font/woff2');
const logoPreto = b64('assets/logo-h-preto.png', 'image/png');
const logoDeg = b64('assets/logo-h-degrade.png', 'image/png');
const logoCorImg = b64('assets/logo-cor.png', 'image/png');
const desafios = process.env.DESAFIOS ? JSON.parse(process.env.DESAFIOS) : ['Selfie com um ex-presidente','Brindar com um fundador','Cantar o hino da JSD','Dançar com um dirigente','Trocar contacto com um novo militante','Foto com alguém de outra concelhia','Ouvir uma história dos 50 anos','Fazer um brinde aos 50 anos','Falar com quem tem mais anos de JSD','Foto de grupo da tua mesa','Conhecer um militante novo','Assinar o cartão de outro convidado'];
const NUM = process.env.NUM || '001';
// degradê dos materiais: ciano/turquesa em baixo à esquerda → laranja → vermelho
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';

const css = `
${[300,500,700,800].map(w=>`@font-face{font-family:M;font-weight:${w};src:url(${font(w)}) format('woff2')}`).join('')}
@page{size:210mm 148mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:148mm;font-family:M,sans-serif;color:#0A0701}
.card{position:relative;width:210mm;height:148mm;overflow:hidden;background:#fff;padding:9mm 11mm 7mm;display:flex;flex-direction:column}
.gt{background:${G};-webkit-background-clip:text;background-clip:text;color:transparent}
header{flex-shrink:0;position:relative;height:25mm;display:flex;justify-content:space-between;align-items:flex-start}
h1{font-weight:300;font-size:21pt;line-height:1.08;text-transform:uppercase;letter-spacing:.005em}
h1 b{font-weight:800;display:block}
.sub{margin-top:2.4mm;font-size:7.5pt;font-weight:700;letter-spacing:.3em;text-transform:uppercase}
.right{display:flex;flex-direction:column;align-items:flex-end;gap:3mm}
.right img{height:10.5mm;display:block}
.nr{font-size:8pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.nr b{font-weight:800;font-size:12pt;letter-spacing:.1em;margin-left:1.5mm}
.grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,minmax(0,1fr));gap:0;border:.9mm solid #0A0701;position:relative;z-index:1}
.cell{position:relative;display:flex;align-items:center;justify-content:center;text-align:center;padding:5mm 3.5mm 3mm;background:transparent;border-right:.45mm solid #0A0701;border-bottom:.45mm solid #0A0701;font-weight:700;font-size:13.5pt;line-height:1.14;overflow-wrap:anywhere;hyphens:auto}
.cell i{position:absolute;top:2mm;left:2.6mm;font-style:normal;font-size:6.5pt;font-weight:500;letter-spacing:.12em;color:#3E352B}
.cell u{position:absolute;top:1.8mm;right:2.2mm;width:4.4mm;height:4.4mm;border:.3mm solid #0A0701;border-radius:50%}
header,footer{position:relative;z-index:1}
.cell:nth-child(4n){border-right:0}.cell:nth-child(n+9){border-bottom:0}
.wm{position:absolute;white-space:nowrap;line-height:.8;pointer-events:none;z-index:0}
footer{flex-shrink:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;height:13mm;margin-top:3.2mm}
.d1{font-size:8pt;font-weight:300;letter-spacing:.05em}
.d2{font-size:7.5pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-top:.6mm}
.motto{text-align:center;font-size:11pt;line-height:1.12;text-transform:uppercase}
.motto span{display:block;font-weight:300}.motto b{display:block;font-weight:800}
.sede{text-align:right;font-size:7.5pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.5}
`;
const cells = () => desafios.map((t,i)=>`<div class="cell"><i>${String(i+1).padStart(2,'0')}</i><u></u>${t}</div>`).join('');
const title = `<h1>Bingo da<b>Militância</b></h1><div class="sub gt">Jota Premium</div>`;
const nr = `<div class="nr">Nº<b>${NUM}</b></div>`;
const footer = `<footer><div><div class="d1">1976_2026</div><div class="d2">7 de novembro de 2026</div></div><div class="motto"><span class="gt">Cinco Décadas</span><b class="gt">Uma Identidade</b></div><div class="sede">Sunset House<br>Famalicão</div></footer>`;

const variants = {
 // A — "50" em marca de água, centrado atrás da grelha
 'A-50': `<style>.wm{font-weight:300;font-size:330pt;left:50%;top:84mm;transform:translate(-50%,-50%);opacity:.34;background-image:linear-gradient(115deg,#1EBCE8 0%,#54CFC9 16%,#F8B451 40%,#F86420 68%,#E8452A 88%,#4A4FA8 100%)}</style>
   <div class="card"><div class="wm gt">50</div><header><div>${title}</div><div class="right"><img src="${logoPreto}">${nr}</div></header><div class="grid">${cells()}</div>${footer}</div>`,
 // B — "76–26" em marca de água, centrado atrás da grelha
 'B-7626': `<style>.wm{font-weight:300;font-size:168pt;left:50%;top:84mm;transform:translate(-50%,-50%);opacity:.34;background-image:linear-gradient(100deg,#1EBCE8 0%,#54CFC9 16%,#F8B451 40%,#F86420 68%,#E8452A 88%,#4A4FA8 100%)}</style>
   <div class="card"><div class="wm gt">76–26</div><header><div>${title}</div><div class="right"><img src="${logoPreto}">${nr}</div></header><div class="grid">${cells()}</div>${footer}</div>`,
 // C — marca "50" do logótipo, a cores, em marca de água (recortada sem o "ANOS")
 'C-logo50': `<style>.mark{position:absolute;z-index:0;opacity:.30;right:-4mm;top:30mm;width:150mm;height:78mm;overflow:hidden}.mark img{width:150mm;display:block}</style>
   <div class="card"><div class="mark"><img src="${logoCorImg}"></div><header><div>${title}</div><div class="right"><img src="${logoPreto}">${nr}</div></header><div class="grid">${cells()}</div>${footer}</div>`,
};

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:794,height:560},deviceScaleFactor:3.125});
  for (const [k,v] of Object.entries(variants)) {
    await p.setContent(`<!doctype html><meta charset=utf-8><style>${css}</style>${v}`);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(OUT,`bingo-${k}${process.env.SUFIXO||''}.png`),clip:{x:0,y:0,width:793.7,height:559.37}});
  }
  await b.close();
})();
