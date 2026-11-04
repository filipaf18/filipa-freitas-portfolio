const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const { PRESETS, suspeito, wrapBust } = require('./suspeitos.js');
const R = path.join(__dirname, '..'), OUT = path.join(R, 'png_personagens'); fs.mkdirSync(OUT, { recursive: true });
const P = (n) => `file://${R}/png_brand/${n}.png`;
const order = ['cavaco', 'passos', 'portas', 'montenegro'];
const lineup = (expr) => {
  const xs = [330, 780, 1230, 1680];
  const busts = order.map((k, i) => { const s = suspeito(k, expr, k + i); return `<svg style="position:absolute;left:${xs[i] - 180}px;top:-20px" width="360" height="720" viewBox="0 -300 600 1200">${s.body}</svg>`; }).join('');
  const props = order.map((k, i) => { const s = suspeito(k, expr, k + 'p' + i); return `<svg style="position:absolute;left:${xs[i] - 150}px;top:600px;overflow:visible" width="300" height="200" viewBox="-150 0 300 200"><g transform="scale(1.05)">${s.props}</g>${s.body.includes('defs') ? s.body.match(/<defs>[\s\S]*?<\/defs>/)[0] : ''}</svg>`; }).join('');
  const NOMES = ['Cavaco Silva', 'Passos Coelho', 'Paulo Portas', 'Luís Montenegro'];
  const cards = xs.map((x, i) => `<div class=glass style="position:absolute;left:${x - 170}px;top:860px;width:340px;padding:14px 22px;display:flex;gap:14px;border-radius:22px;font-family:M"><i style="width:5px;border-radius:3px;background:#F58220"></i><div><div style="font-size:32px;font-weight:700">${NOMES[i]}</div><div style="font-size:20px;font-weight:700;opacity:.85;letter-spacing:2px">SUSPEITO N.º ${i + 1}</div></div></div>`).join('');
  return `<body style="margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:#111">
  <style>@font-face{font-family:M;font-weight:700;src:url(file://${__dirname}/fonts/montserrat-latin-700-normal.woff2)}.glass{background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.45);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.25)}</style>
  <img src="${P('fundo_estudio_16x9')}" style="position:absolute;inset:0">${busts}
  <img src="${P('mesa_estudio_16x9')}" style="position:absolute;inset:0">${props}
  <img src="${P('overlay_gradiente_16x9')}" style="position:absolute;inset:0">${cards}
  <img src="${P('cartao_vidro_ficcional')}" style="position:absolute;left:1400px;top:24px;width:460px"></body>`;
};
(async () => {
  const b = await chromium.launch(); const tmp = path.join(__dirname, '_t.html');
  const shot = async (html, w, h, file, transparent) => { fs.writeFileSync(tmp, html); const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto('file://' + tmp); await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, file), omitBackground: transparent }); await p.close(); };
  for (const k of [...order, 'apresentador']) for (const e of ['neutro', 'nega']) {
    const svg = wrapBust(suspeito(k, e), 1);
    fs.writeFileSync(path.join(R, 'svg', `3d_${k}_${e}.svg`), svg);
    await shot(`<body style="margin:0;background:transparent">${svg}</body>`, 600, 1200, `${k}_${e}.png`, true);
  }
  await shot(lineup('neutro'), 1920, 1080, 'teste_quatro_juntos_neutro.png');
  await shot(lineup('nega'), 1920, 1080, 'teste_quatro_juntos_nega.png');
  fs.unlinkSync(tmp); await b.close(); console.log('done');
})();
