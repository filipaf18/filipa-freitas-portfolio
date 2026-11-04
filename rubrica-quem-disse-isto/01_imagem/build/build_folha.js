// Folhas de expressões e visemas por personagem + bustos em alta resolução (≥3000 px de altura)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const { suspeito, wrapBust } = require('./suspeitos.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'png_v5'); fs.mkdirSync(OUT, { recursive: true });
const chars = ['cavaco', 'passos', 'portas', 'montenegro', 'apresentador'];
const exprs = ['neutro', 'nega', 'ironico', 'surpresa', 'calase', 'empolgado'];
const vis = ['vA', 'vB', 'vC', 'vD', 'vE', 'vF', 'vX'];
const cell = (k, e, w) => { const s = suspeito(k, e, `${k}_${e}`); return `<div style="display:inline-block;margin:4px;background:#1b2733;border-radius:10px;position:relative"><svg width="${w}" height="${w * 1.37}" viewBox="0 -260 600 820">${s.body}</svg><div style="position:absolute;bottom:6px;left:0;right:0;text-align:center;color:#fff;font:700 18px sans-serif;opacity:.85">${e}</div></div>`; };
(async () => {
  const b = await chromium.launch(); const tmp = path.join(__dirname, '_f.html');
  const page = async (html, w, h, file, dsf = 1, transparent = false) => { fs.writeFileSync(tmp, `<body style="margin:0;background:${transparent ? 'transparent' : '#0d1218'}">${html}</body>`); const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dsf }); await p.goto('file://' + tmp); await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, file), omitBackground: transparent }); await p.close(); };
  for (const k of chars) {
    await page(exprs.map((e) => cell(k, e, 300)).join(''), 936, 870, `${k}_folha_expressoes.png`);
    await page(vis.map((e) => cell(k, e, 200)).join(''), 7 * 216, 300, `${k}_folha_visemas.png`);
    for (const e of ['neutro', 'nega']) { const svg = wrapBust(suspeito(k, e), 1); await page(svg, 600, 1200, `${k}_${e}_3000px.png`, 2.5, true); }
  }
  fs.unlinkSync(tmp); await b.close(); console.log('ok');
})();
