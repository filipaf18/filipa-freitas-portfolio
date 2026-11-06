// PDF para impressão: 140 cartões A6 horizontal (148×105 mm) + 3 mm de sangria de cada lado (154×111 mm).
// Gera: frente+verso alternados, só frentes e o verso. Uso: node gerar_pdf_impressao.js cartoes.csv pasta_saida
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CSV = process.argv[2] || path.join(ROOT, 'impressao/cartoes-bingo-140.csv');
const OUT = process.argv[3] || path.join(ROOT, 'impressao');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w) => b64(`assets/fonts/montserrat-latin-${w}-normal.woff2`, 'font/woff2');
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';

const linhas = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).map(l => l.split(','));
const cartoes = linhas.map(c => ({ n: c[0], nums: c.slice(1, 13).map(Number) }));

const css = `
${[300,500,700,800].map(w=>`@font-face{font-family:M;font-weight:${w};src:url(${font(w)}) format('woff2')}`).join('')}
@page{size:154mm 111mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:M,sans-serif;color:#0A0701;background:#fff}
.logo{background:url(${b64('assets/logo-h-preto-print.png','image/png')}) no-repeat right top/contain;width:21.5mm;height:7.6mm}
.pg{position:relative;width:154mm;height:111mm;overflow:hidden;background:#fff;page-break-after:always;padding:9.5mm 11mm 0;display:flex;flex-direction:column}
.pg::after{content:'';position:absolute;left:0;right:0;bottom:0;height:5.4mm;background:${G}}
.gt{background:${G};-webkit-background-clip:text;background-clip:text;color:transparent}
header{flex-shrink:0;display:flex;justify-content:space-between;align-items:flex-start}
/* frente */
.f header{height:18mm}
.f h1{font-weight:300;font-size:11pt;line-height:1;letter-spacing:.32em;text-transform:uppercase}
.f h1 b{font-weight:800;display:block;font-size:23pt;letter-spacing:-.01em;line-height:1;margin-top:.8mm;text-transform:none}
.f .sub{display:inline-block;margin-top:1.4mm;font-size:5.6pt;font-weight:700;letter-spacing:.24em}
.right{display:flex;flex-direction:column;align-items:flex-end;gap:2mm}
.nr{font-size:5.8pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.nr b{font-weight:800;font-size:9pt;letter-spacing:.1em;margin-left:1.2mm}
.grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(0,1fr);border-top:.3mm solid #0A0701;border-bottom:.3mm solid #0A0701;padding:1mm 0}
.n{display:flex;align-items:center;justify-content:center}
.ball{width:19mm;height:19mm;border-radius:50%;background:${G};padding:.9mm;display:flex}
.ball i{flex:1;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:31pt;line-height:1;letter-spacing:-.02em}
footer{flex-shrink:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;height:10mm;margin:2mm 0 8mm}
.d1{font-size:5.8pt;font-weight:300;letter-spacing:.05em}
.d2{font-size:5.4pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-top:.4mm}
.motto{text-align:center;font-size:8pt;line-height:1.12;text-transform:uppercase}
.motto span{display:block;font-weight:300}.motto b{display:block;font-weight:800}
.sede{text-align:right;font-size:5.4pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.5}
/* verso */
.v header{height:16.2mm}
.kick{display:inline-block;font-size:5.6pt;font-weight:700;letter-spacing:.3em;text-transform:uppercase}
.v h1{font-weight:300;font-size:22pt;line-height:1;letter-spacing:-.01em;margin-top:2mm}
.v h1 b{font-weight:800}
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
.mt{position:absolute;left:0;right:0;bottom:7.4mm;text-align:center;font-size:6.4pt;letter-spacing:.24em;text-transform:uppercase}
.mt b{font-weight:800}
`;
const frente = (c) => `<div class="pg f"><header><div><h1>Bingo<b>Cinco Jotas</b></h1><div class="sub gt">Rookie · Pro · Premium</div></div><div class="right"><div class="logo"></div><div class="nr">Nº<b>${c.n}</b></div></div></header>
<div class="grid">${c.nums.map(n=>`<div class="n"><div class="ball"><i>${n}</i></div></div>`).join('')}</div>
<footer><div><div class="d1">1976_2026</div><div class="d2">7 de novembro de 2026</div></div><div class="motto"><span class="gt">Cinco Décadas</span><b class="gt">Uma Identidade</b></div><div class="sede">Sunset House<br>Famalicão</div></footer></div>`;
const mini = (n) => `<div class="mini">${Array.from({length:12},(_,i)=>`<i class="${i<n*4?'on':''}"></i>`).join('')}</div>`;
const titulo = (n, nome, desc, top) => `<div class="t${top?' top':''}"><div><div class="nm">Jota<b>${nome}</b></div><p>${desc}</p></div>${mini(n)}</div>`;
const verso = `<div class="pg v"><header><div><span class="kick gt">Bingo Cinco Jotas</span><h1>Como <b>jogar</b></h1></div><div class="logo"></div></header>
<div class="body"><div><h2>Em 4 passos</h2><ol>
<li><div>Cada <b>número</b> do teu cartão é uma experiência de militância.</div></li>
<li><div>O animador <b>sorteia um número</b> e lê a experiência em voz alta.</div></li>
<li><div>Já viveste? <b>Risca o número.</b> Se não, deixa em branco.</div></li>
<li><div>Completaste um título? <b>Levanta o cartão</b> e grita!</div></li></ol></div>
<div><h2>Os títulos</h2>
${titulo(1,'Rookie','O primeiro a completar uma linha de 4 casas (horizontal).')}
${titulo(2,'Pro','O primeiro a completar duas linhas completas.')}
${titulo(3,'Premium','O primeiro a completar o cartão inteiro, as 12 casas.',true)}
<div class="note">Só vale riscar o que já viveste.<br>A organização confere o nº do cartão.</div></div></div>
<div class="mt"><span class="gt">Cinco Décadas</span> · <b class="gt">Uma Identidade</b></div></div>`;

const doc = (paginas) => `<!doctype html><meta charset=utf-8><style>${css}</style>${paginas.join('')}`;
async function pdf(browser, paginas, ficheiro) {
  const p = await browser.newPage();
  await p.setContent(doc(paginas), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(OUT, ficheiro), width: '154mm', height: '111mm', printBackground: true, preferCSSPageSize: true });
  await p.close();
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const f = cartoes.map(frente);
  await pdf(b, f.flatMap(x => [x, verso]), 'cartoes-bingo-140-frente-e-verso.pdf');
  await pdf(b, f, 'cartoes-bingo-140-so-frentes.pdf');
  await pdf(b, [verso], 'cartoes-bingo-verso.pdf');
  await b.close();
})();
