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

const STOPS = [[0,[30,188,232]],[.14,[84,207,201]],[.38,[248,180,81]],[.62,[248,100,32]],[1,[232,69,42]]];
const lum = c => { const f = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126*f(c[0]) + .7152*f(c[1]) + .0722*f(c[2]); };
function corGrad(t, contraste) {
  let c = STOPS[STOPS.length-1][1];
  for (let i = 0; i < STOPS.length - 1; i++) { const [t0,c0] = STOPS[i], [t1,c1] = STOPS[i+1];
    if (t <= t1) { const u = (t - t0) / (t1 - t0); c = c0.map((v,k) => v + (c1[k] - v) * u); break; } }
  let k = 1; while (1.05 / (lum(c.map(v => v*k)) + .05) < contraste && k > .2) k -= .01;
  return '#' + c.map(v => Math.round(v*k).toString(16).padStart(2,'0')).join('');
}
// cada letra leva a cor do degradê na sua posição, escurecida o necessário para se ler em papel
const gt = (txt, contraste = 3.4) => { const a = [...txt]; return a.map((ch,i) => ch === ' ' ? ' ' : `<span style="color:${corGrad(a.length > 1 ? i/(a.length-1) : 0, contraste)}">${ch}</span>`).join(''); };

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
.f .sub{display:inline-block;margin-top:1.4mm;font-size:7pt;font-weight:700;letter-spacing:.2em}
.right{display:flex;flex-direction:column;align-items:flex-end;gap:2mm}
.nr{font-size:7pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.nr b{font-weight:800;font-size:12pt;letter-spacing:.1em;margin-left:1.4mm}
.grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(0,1fr);border-top:.3mm solid #0A0701;border-bottom:.3mm solid #0A0701;padding:1mm 0}
.n{display:flex;align-items:center;justify-content:center}
.ball{width:19mm;height:19mm;border-radius:50%;background:${G};padding:.9mm;display:flex}
.ball i{flex:1;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:31pt;line-height:1;letter-spacing:-.02em}
footer{flex-shrink:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;height:10.5mm;margin:1.5mm 0 7.6mm}
.d1{font-size:7pt;font-weight:300;letter-spacing:.05em}
.d2{font-size:7pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-top:.4mm}
.motto{text-align:center;font-size:8.6pt;line-height:1.12;text-transform:uppercase}
.motto>span{display:block;font-weight:300}.motto>b{display:block;font-weight:800}
.sede{text-align:right;font-size:7pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.5}
/* verso */
.v header{height:16.2mm}
.kick{display:inline-block;font-size:7pt;font-weight:700;letter-spacing:.22em;text-transform:uppercase}
.v h1{font-weight:300;font-size:22pt;line-height:1;letter-spacing:-.01em;margin-top:2mm}
.v h1 b{font-weight:800}
.body{flex:1;min-height:0;display:grid;grid-template-columns:.86fr 1.14fr;gap:6mm;border-top:.3mm solid #0A0701;padding-top:3.6mm}
h2{font-size:7pt;font-weight:800;letter-spacing:.22em;text-transform:uppercase;margin-bottom:2.2mm}
ol{list-style:none;counter-reset:s}
ol li{counter-increment:s;display:grid;grid-template-columns:7mm 1fr;gap:2.4mm;margin-bottom:3.8mm;font-size:8pt;line-height:1.36;font-weight:500;align-items:center}
ol li::before{content:counter(s);width:6.4mm;height:6.4mm;border-radius:50%;background:${G};color:#fff;font-weight:800;font-size:8pt;display:flex;align-items:center;justify-content:center}
ol b{font-weight:800}
.t{display:grid;grid-template-columns:1fr 12mm;gap:2mm;align-items:center;padding:1.5mm 3mm;border:.3mm solid #0A0701;margin-bottom:2mm}
.t.top{background:#0A0701;color:#fff}
.t .nm{font-size:7pt;font-weight:300;letter-spacing:.3em;text-transform:uppercase;line-height:1}
.t .nm b{display:block;font-weight:800;font-size:13pt;letter-spacing:-.005em;text-transform:none;margin-top:.5mm}
.t p{font-size:7pt;font-weight:500;line-height:1.28;margin-top:.7mm}
.mini{display:grid;grid-template-columns:repeat(4,1fr);gap:.8mm}
.mini i{aspect-ratio:1;border-radius:50%;border:.25mm solid currentColor;display:block}
.mini i.on{border:0;background:${G}}
.note{margin-top:.4mm;font-size:7pt;font-weight:500;line-height:1.3;color:#3E352B}
.mt{position:absolute;left:0;right:0;bottom:8mm;text-align:center;font-size:7pt;letter-spacing:.2em;text-transform:uppercase}
.mt b{font-weight:800}
`;
const frente = (c) => `<div class="pg f"><header><div><h1>Bingo<b>Cinco Jotas</b></h1><div class="sub">${gt('Rookie · Pro · Premium')}</div></div><div class="right"><div class="logo"></div><div class="nr">Nº<b>${c.n}</b></div></div></header>
<div class="grid">${c.nums.map(n=>`<div class="n"><div class="ball"><i>${n}</i></div></div>`).join('')}</div>
<footer><div><div class="d1">1976_2026</div><div class="d2">7 de novembro de 2026</div></div><div class="motto"><span>${gt('Cinco Décadas',4.2)}</span><b>${gt('Uma Identidade')}</b></div><div class="sede">Sunset House<br>Famalicão</div></footer></div>`;
const mini = (n) => `<div class="mini">${Array.from({length:12},(_,i)=>`<i class="${i<n*4?'on':''}"></i>`).join('')}</div>`;
const titulo = (n, nome, desc, top) => `<div class="t${top?' top':''}"><div><div class="nm">Jota<b>${nome}</b></div><p>${desc}</p></div>${mini(n)}</div>`;
const verso = `<div class="pg v"><header><div><span class="kick">${gt('Bingo Cinco Jotas')}</span><h1>Como <b>jogar</b></h1></div><div class="logo"></div></header>
<div class="body"><div><h2>Em 4 passos</h2><ol>
<li><div>Cada <b>número</b> é uma experiência vivida na Jota.</div></li>
<li><div>O animador <b>sorteia um número</b> e diz a experiência.</div></li>
<li><div>Já viveste? <b>Põe um feijão</b> no número.</div></li>
<li><div>Completaste um título? <b>Levanta o cartão</b> e grita!</div></li></ol></div>
<div><h2>Os títulos</h2>
${titulo(1,'Rookie','O primeiro a completar uma linha.')}
${titulo(2,'Pro','O primeiro a completar duas linhas.')}
${titulo(3,'Premium','O primeiro a completar o cartão.',true)}
<div class="note">Só vale feijão no que já viveste.<br>A organização confere o nº do cartão.</div></div></div>
<div class="mt"><span>${gt('Cinco Décadas',4.2)}</span> · <b>${gt('Uma Identidade')}</b></div></div>`;

const _gtcheck = 1;
const doc = (paginas) => `<!doctype html><meta charset=utf-8><style>${css}</style>${paginas.join('')}`;
async function pdf(browser, paginas, ficheiro) {
  const p = await browser.newPage();
  await p.setContent(doc(paginas), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(OUT, ficheiro), width: '154mm', height: '111mm', printBackground: true, preferCSSPageSize: true });
  await p.close();
}
async function verificar(browser, paginas, rotulo) {
  const p = await browser.newPage();
  await p.setContent(doc(paginas), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const problemas = await p.evaluate(() => {
    const mm = 96 / 25.4, out = [], SAFE = 3 + 4.5; // sangria 3 mm + 4,5 mm de margem de segurança
    document.querySelectorAll('.pg').forEach((pg, pi) => {
      const o = pg.getBoundingClientRect();
      pg.querySelectorAll('*').forEach(el => {
        if (el.matches('span[style*="color"]')) return; // letras do degradê: verificadas pelo contentor
        if (!el.textContent.trim() && el.tagName !== 'IMG' && !el.matches('.logo,.ball,.mini i')) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const L = (r.left - o.left) / mm, T = (r.top - o.top) / mm, R = (o.right - r.right) / mm, B = (o.bottom - r.bottom) / mm;
        const cont = el.matches('.body,.grid,header,footer'); if (L < SAFE - .01 || T < SAFE - .01 || R < SAFE - .01 || (!cont && B < SAFE - .01)) out.push(`pág ${pi+1}: <${el.tagName.toLowerCase()} class="${el.className}"> "${el.textContent.trim().slice(0,30)}" margens L${L.toFixed(1)} T${T.toFixed(1)} R${R.toFixed(1)} B${B.toFixed(1)}`);
        if (el.clientHeight && (el.scrollHeight > el.clientHeight + 3 || el.scrollWidth > el.clientWidth + 3)) out.push(`pág ${pi+1}: conteúdo a transbordar em <${el.tagName.toLowerCase()} class="${el.className}">`);
      });
    });
    return out;
  });
  console.log(rotulo + ':', problemas.length ? '\n  ' + problemas.join('\n  ') : 'tudo dentro da área segura');
  await p.close();
  return problemas.length;
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const f0 = cartoes.map(frente);
  const alvos = [cartoes.find(c => c.nums.includes(12) && c.nums.includes(10)), cartoes[0]].map(frente);
  await verificar(b, [alvos[0], verso], 'Verificação de margens (frente com 2 dígitos + verso)');
  const f = f0;
  await pdf(b, f.flatMap(x => [x, verso]), 'cartoes-bingo-140-frente-e-verso.pdf');
  await pdf(b, f, 'cartoes-bingo-140-so-frentes.pdf');
  await pdf(b, [verso], 'cartoes-bingo-verso.pdf');
  await b.close();
})();
