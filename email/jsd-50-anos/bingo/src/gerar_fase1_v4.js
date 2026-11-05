// Fase 1 (v4) — cartão de bingo clássico só com números. A5 horizontal, 300 dpi.
// Uso: node gerar_fase1_v4.js [pasta_saida]   (env: NUMEROS='[12 números, por linhas]', NUM='001', SUFIXO='')
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'fase1');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w) => b64(`assets/fonts/montserrat-latin-${w}-normal.woff2`, 'font/woff2');
const logoPreto = b64('assets/logo-h-preto.png', 'image/png');
// por linhas (3 linhas × 4 colunas); cada coluna crescente, como num cartão clássico
const numeros = process.env.NUMEROS ? JSON.parse(process.env.NUMEROS) : [4,27,48,71, 11,33,55,79, 19,42,63,88];
const NUM = process.env.NUM || '001';
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';
const COR = ['#0E87D9','#1EBCE8','#F8B451','#F86420'];

const css = `
${[300,500,700,800].map(w=>`@font-face{font-family:M;font-weight:${w};src:url(${font(w)}) format('woff2')}`).join('')}
@page{size:210mm 148mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:148mm;font-family:M,sans-serif;color:#0A0701;background:#fff}
.card{position:relative;width:210mm;height:148mm;overflow:hidden;background:#fff;padding:9mm 12mm 0;display:flex;flex-direction:column}
.card::after{content:'';position:absolute;left:0;right:0;bottom:0;height:3.2mm;background:${G}}
.gt{background:${G};-webkit-background-clip:text;background-clip:text;color:transparent}
header{flex-shrink:0;height:24mm;display:flex;justify-content:space-between;align-items:flex-start}
h1{font-weight:300;font-size:21pt;line-height:1.08;text-transform:uppercase}
h1 b{font-weight:800;display:block}
.sub{margin-top:2.4mm;font-size:7.5pt;font-weight:700;letter-spacing:.3em;text-transform:uppercase}
.right{display:flex;flex-direction:column;align-items:flex-end;gap:3mm}
.right img{height:10.5mm;display:block}
.nr{font-size:8pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.nr b{font-weight:800;font-size:12pt;letter-spacing:.1em;margin-left:1.5mm}
.grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(0,1fr)}
.n{display:flex;align-items:center;justify-content:center;font-weight:700;font-size:44pt;line-height:1;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
footer{flex-shrink:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;height:14mm;margin:3mm 0 6.5mm}
.d1{font-size:8pt;font-weight:300;letter-spacing:.05em}
.d2{font-size:7.5pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-top:.6mm}
.motto{text-align:center;font-size:11pt;line-height:1.12;text-transform:uppercase}
.motto span{display:block;font-weight:300}.motto b{display:block;font-weight:800}
.sede{text-align:right;font-size:7.5pt;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1.5}
`;
const head = `<header><div><h1>Bingo da<b>Militância</b></h1><div class="sub gt">Jota Premium</div></div><div class="right"><img src="${logoPreto}"><div class="nr">Nº<b>${NUM}</b></div></div></header>`;
const foot = `<footer><div><div class="d1">1976_2026</div><div class="d2">7 de novembro de 2026</div></div><div class="motto"><span class="gt">Cinco Décadas</span><b class="gt">Uma Identidade</b></div><div class="sede">Sunset House<br>Famalicão</div></footer>`;

const variants = {
 // A — clássico: tabela de linhas pretas
 'A-classico': `<style>.grid{border:.9mm solid #0A0701}.n{border-right:.45mm solid #0A0701;border-bottom:.45mm solid #0A0701}.n:nth-child(4n){border-right:0}.n:nth-child(n+9){border-bottom:0}</style>
   <div class="card">${head}<div class="grid">${numeros.map(n=>`<div class="n">${n}</div>`).join('')}</div>${foot}</div>`,
 // B — com cabeçalho de colunas B I N G, cada uma numa cor da marca
 'B-BING': `<style>.grid{grid-template-rows:9mm repeat(3,minmax(0,1fr));border:.9mm solid #0A0701}.l{display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15pt;letter-spacing:.3em;padding-left:.3em;border-right:.45mm solid #0A0701}.l:nth-child(4){border-right:0}.n{border-right:.45mm solid #0A0701;border-top:.45mm solid #0A0701}.n:nth-child(4n){border-right:0}.n:nth-child(4n+0){}</style>
   <div class="card">${head}<div class="grid">${['B','I','N','G'].map((l,i)=>`<div class="l" style="background:${COR[i]}${i==2?';color:#0A0701':''}">${l}</div>`).join('')}${numeros.map(n=>`<div class="n">${n}</div>`).join('')}</div>${foot}</div>`,
 // C — números em "bolas" com anel em degradê, sem linhas
 'C-bolas': `<style>.grid{gap:2.2mm 0}.n{background:none}.ball{width:21mm;height:21mm;border-radius:50%;background:${G};padding:1mm;display:flex}.ball i{flex:1;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:30pt}.grid{border-top:.4mm solid #0A0701;border-bottom:.4mm solid #0A0701;padding:1.5mm 0}</style>
   <div class="card">${head}<div class="grid">${numeros.map(n=>`<div class="n"><div class="ball"><i>${n}</i></div></div>`).join('')}</div>${foot}</div>`,
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
