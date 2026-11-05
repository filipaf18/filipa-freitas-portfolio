// Fase 1 — variantes do cartão de bingo (A5 horizontal, 300 dpi). Uso: node gerar_fase1.js [pasta_saida]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'fase1');
const grad = 'linear-gradient(90deg,#0E87D9 0%,#1EBCE8 25%,#54CFC9 40%,#F8B451 60%,#F86420 100%)';
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const logoCor = b64('assets/logo-cor.png');
const logoBr = b64('assets/logo-branco.png');
const desafios = process.env.DESAFIOS ? JSON.parse(process.env.DESAFIOS) : Array.from({length:12},(_,i)=>`Desafio ${i+1}`);
const NUM = process.env.NUM || '001';

const base = `
@page{size:210mm 148mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:148mm;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;width:210mm;height:148mm;overflow:hidden;display:flex;flex-direction:column;padding:8mm 9mm 7mm}
header{flex-shrink:0;display:flex;align-items:flex-end;justify-content:space-between;height:22mm}
h1{font-weight:800;font-size:25pt;line-height:1;letter-spacing:.02em;text-transform:uppercase}
.sub{display:flex;gap:3mm;align-items:center;margin-top:2.6mm;font-size:8.5pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.tag{font-weight:800;padding:1mm 3mm;border-radius:10mm;color:#fff;background:#F86420}
.nr{font-weight:800;font-size:11pt;letter-spacing:.08em;padding:1.6mm 3.6mm;border-radius:2mm;border:.4mm solid currentColor}
.bar{height:1.6mm;border-radius:1mm;background:${grad};margin:3.2mm 0 3.6mm}
.grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,minmax(0,1fr));gap:3mm}
.cell{position:relative;display:flex;align-items:center;justify-content:center;text-align:center;padding:3mm 3mm 2mm;border-radius:3mm;font-weight:700;font-size:14pt;line-height:1.12;overflow-wrap:anywhere;hyphens:auto}
.cell i{position:absolute;top:2mm;left:2.6mm;font-style:normal;font-size:7.5pt;font-weight:800;letter-spacing:.05em;opacity:.9}
footer{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;height:13mm;margin-top:3mm}
footer img{height:11mm;display:block}
.motto{font-size:8pt;letter-spacing:.2em;text-transform:uppercase;text-align:center;line-height:1.55}
.motto b{font-weight:800}
.info{font-size:7.5pt;letter-spacing:.08em;text-align:right;line-height:1.55;text-transform:uppercase;font-weight:600}
`;
const cells = (cls) => desafios.map((t,i)=>`<div class="cell ${cls}" style="--c:${['#0E87D9','#1EBCE8','#54CFC9','#F86420'][i%4]}"><i>${String(i+1).padStart(2,'0')}</i>${t}</div>`).join('');
const head = (nrCls='') => `<header><div><h1>Bingo da Militância</h1><div class="sub"><span class="tag">Jota Premium</span><span>50 Anos · JSD Famalicão</span></div></div><div class="nr ${nrCls}">Nº ${NUM}</div></header><div class="bar"></div>`;
const foot = (logo) => `<footer><img src="${logo}"><div class="motto">Cinco Décadas<br><b>Uma Identidade</b></div><div class="info">7 de novembro de 2026<br>Sunset House</div></footer>`;

const variants = {
 'A-claro': { css:`.card{background:#F6F3EE;color:#1B130C}.nr{color:#1B130C}.cell{background:#fff;border:.35mm solid #E4D9CB;color:#1B130C}.cell::before{content:'';position:absolute;left:0;right:0;top:0;height:1.5mm;background:var(--c)}.cell i{color:#6B6054;top:3.2mm}.motto,.info{color:#3E352B}`,
   html:`<div class="card">${head()}<div class="grid">${cells('')}</div>${foot(logoCor)}</div>` },
 'B-noite': { css:`.card{background:#14181F;color:#fff}.nr{color:#F8B451}.tag{background:#F86420}.cell{background:#1E252F;border:.35mm solid #3A3F47;border-left:1.4mm solid var(--c);color:#fff}.cell i{color:#F8B451}.motto,.info{color:#E4D9CB}.bar{margin-bottom:3.6mm}`,
   html:`<div class="card">${head()}<div class="grid">${cells('')}</div>${foot(logoBr)}</div>` },
 'C-degrade': { css:`html,body{background:${grad.replace('90deg','135deg')}}.frame{position:absolute;inset:0;background:${grad.replace('90deg','135deg')}}.card{background:transparent;padding:0}.panel{position:absolute;inset:4.5mm;background:#FBF9F5;border-radius:4mm;padding:6mm 7mm 5mm;display:flex;flex-direction:column;color:#1B130C}.nr{color:#F86420}.cell{background:#fff;border:.35mm solid #E4D9CB;box-shadow:0 .5mm 0 #E4D9CB;color:#1B130C}.cell i{color:#fff;background:var(--c);width:5.2mm;height:5.2mm;border-radius:50%;display:flex;align-items:center;justify-content:center;top:2mm;left:2mm;font-size:6.5pt}.motto,.info{color:#3E352B}header{height:20mm}`,
   html:`<div class="card"><div class="frame"></div><div class="panel">${head()}<div class="grid">${cells('')}</div>${foot(logoCor)}</div></div>` },
};

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:794,height:560},deviceScaleFactor:3.125});
  for (const [k,v] of Object.entries(variants)) {
    await p.setContent(`<!doctype html><meta charset=utf-8><style>${base}${v.css}</style>${v.html}`);
    await p.evaluate(()=>document.fonts.ready);
    await p.screenshot({path:path.join(OUT,`bingo-${k}${process.env.SUFIXO||''}.png`),clip:{x:0,y:0,width:793.7,height:559.37}});
  }
  await b.close();
})();
