// Verso do cartão A6 horizontal (148×105 mm), 300 dpi: regras e títulos. Uso: node gerar_verso_a6.js [pasta_saida]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'fase1-v8');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w) => b64(`assets/fonts/montserrat-latin-${w}-normal.woff2`, 'font/woff2');
const logoPreto = b64('assets/logo-h-preto.png', 'image/png');
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';

const css = `
${[300,500,700,800].map(w=>`@font-face{font-family:M;font-weight:${w};src:url(${font(w)}) format('woff2')}`).join('')}
@page{size:148mm 105mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:148mm;height:105mm;font-family:M,sans-serif;color:#0A0701;background:#fff}
.card{position:relative;width:148mm;height:105mm;overflow:hidden;padding:6.5mm 8mm 0;display:flex;flex-direction:column}
.card::after{content:'';position:absolute;left:0;right:0;bottom:0;height:2.4mm;background:${G}}
.gt{background:${G};-webkit-background-clip:text;background-clip:text;color:transparent}
header{flex-shrink:0;height:16.2mm;display:flex;justify-content:space-between;align-items:flex-start}
.kick{display:inline-block;font-size:5.6pt;font-weight:700;letter-spacing:.3em;text-transform:uppercase}
h1{font-weight:300;font-size:22pt;line-height:1;letter-spacing:-.01em;margin-top:2mm}
h1 b{font-weight:800}
header img{height:7.6mm;display:block}
.body{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1.02fr;gap:7mm;border-top:.3mm solid #0A0701;padding-top:3.6mm}
h2{font-size:5.8pt;font-weight:800;letter-spacing:.24em;text-transform:uppercase;margin-bottom:2.4mm}
ol{list-style:none;counter-reset:s}
ol li{counter-increment:s;display:grid;grid-template-columns:7mm 1fr;gap:2.4mm;margin-bottom:4.3mm;font-size:7.8pt;line-height:1.38;font-weight:500;align-items:center}
ol li::before{content:counter(s);width:6.4mm;height:6.4mm;border-radius:50%;background:${G};color:#fff;font-weight:800;font-size:8pt;display:flex;align-items:center;justify-content:center}
ol b{font-weight:800}
.t{display:grid;grid-template-columns:1fr 13.5mm;gap:2mm;align-items:center;padding:1.7mm 3mm;border:.3mm solid #0A0701;margin-bottom:2mm}
.t.top{background:#0A0701;color:#fff}
.t .nm{font-size:6pt;font-weight:300;letter-spacing:.3em;text-transform:uppercase;line-height:1}
.t .nm b{display:block;font-weight:800;font-size:12.5pt;letter-spacing:-.005em;text-transform:none;margin-top:.5mm}
.t p{font-size:6.1pt;font-weight:500;line-height:1.3;margin-top:.8mm}
.mini{display:grid;grid-template-columns:repeat(4,1fr);gap:.8mm}
.mini i{aspect-ratio:1;border-radius:50%;border:.25mm solid currentColor;display:block}
.mini i.on{border:0;background:${G}}
.note{margin-top:.6mm;font-size:5.6pt;font-weight:500;line-height:1.35;color:#3E352B}
.motto{position:absolute;left:0;right:0;bottom:4.4mm;text-align:center;font-size:6.4pt;letter-spacing:.24em;text-transform:uppercase}
.motto b{font-weight:800}
`;
const mini = (n) => `<div class="mini">${Array.from({length:12},(_,i)=>`<i class="${i<n*4?'on':''}"></i>`).join('')}</div>`;
const titulo = (n, nome, desc, top) => `<div class="t${top?' top':''}"><div><div class="nm">Jota<b>${nome}</b></div><p>${desc}</p></div>${mini(n)}</div>`;

const html = `<div class="card">
 <header><div><span class="kick gt">Bingo Cinco Jotas</span><h1>Como <b>jogar</b></h1></div><img src="${logoPreto}"></header>
 <div class="body">
  <div>
   <h2>Em 4 passos</h2>
   <ol>
    <li><div>Cada <b>número</b> do teu cartão é uma experiência de militância.</div></li>
    <li><div>O animador <b>sorteia um número</b> e lê a experiência em voz alta.</div></li>
    <li><div>Já viveste? <b>Risca o número.</b> Se não, deixa em branco.</div></li>
    <li><div>Completaste um título? <b>Levanta o cartão</b> e grita!</div></li>
   </ol>
  </div>
  <div>
   <h2>Os títulos</h2>
   ${titulo(1,'Rookie','O primeiro a completar uma linha de 4 casas (horizontal).')}
   ${titulo(2,'Pro','O primeiro a completar duas linhas completas.')}
   ${titulo(3,'Premium','O primeiro a completar o cartão inteiro, as 12 casas.',true)}
   <div class="note">Só vale riscar o que já viveste.<br>A organização confere o nº do cartão.</div>
  </div>
 </div>
 <div class="motto"><span class="gt">Cinco Décadas</span> · <b class="gt">Uma Identidade</b></div>
</div>`;

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:560,height:397},deviceScaleFactor:3.125});
  await p.setContent(`<!doctype html><meta charset=utf-8><style>${css}</style>${html}`);
  await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:path.join(OUT,'bingo-A6-verso.png'),clip:{x:0,y:0,width:559.37,height:396.85}});
  await b.close();
})();
