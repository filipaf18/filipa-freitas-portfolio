// Kit gráfico no estilo visual da JSD Famalicão 50 anos (vertical 1080x1920).
// Observado nos vídeos: Montserrat-like bold, legenda em pílula laranja com palavra destacada,
// cartões de vidro fosco com barra laranja, gradiente escuro em baixo com logo 50 ANOS,
// título em gradiente azul-verde→laranja→vermelho, cartão final cinza claro.
// Uso: node build_brand.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'png_brand');
fs.mkdirSync(OUT, { recursive: true });
const F = (w) => `@font-face{font-family:M;font-weight:${w};src:url(file://${__dirname}/fonts/montserrat-latin-${w}-normal.woff2)}`;
const css = `${[400, 600, 700, 800].map(F).join('')}
*{box-sizing:border-box;margin:0}
body{font-family:M,sans-serif;color:#fff;background:transparent}
.grad{background:linear-gradient(95deg,#22BBCB 0%,#F58220 48%,#D8482E 100%);-webkit-background-clip:text;color:transparent}
.pill{display:inline-block;background:#F58220;border-radius:16px;padding:14px 26px;font-weight:700;font-size:42px;color:#fff;letter-spacing:.2px;box-shadow:0 6px 18px rgba(0,0,0,.25)}
.pill b{color:#FFD9B0;font-weight:700}
.glass{background:rgba(255,255,255,.20);border:1.5px solid rgba(255,255,255,.45);border-radius:26px;box-shadow:0 10px 30px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.5);color:#fff}
.name{display:flex;gap:18px;padding:22px 34px 22px 26px;align-items:stretch}
.name i{width:6px;border-radius:3px;background:#F58220}
.name h1{font-size:40px;font-weight:700}.name p{font-size:25px;font-weight:400;opacity:.92;margin-top:4px;line-height:1.25}
.tag{display:inline-block;font-weight:700;font-size:24px;letter-spacing:5px;padding:12px 30px;border-radius:999px}
`;
const wrap = (w, h, body, extra = '') => `<!doctype html><meta charset=utf-8><style>${css}${extra}</style><body style="width:${w}px;height:${h}px;position:relative;overflow:hidden">${body}</body>`;
const logoW = `file://${ROOT}/brand/logo_50anos_branco.png`, logoK = `file://${ROOT}/brand/logo_50anos_preto.png`;
const overlay = `file://${ROOT}/brand/overlay_gradiente_9x16.png`;

const items = {
  // elementos soltos (transparentes)
  pilula_legenda: [1000, 110, `<div class=pill style="margin:20px">Quem é que <b>disse isto?</b></div>`],
  pilula_alerta_interrupcao: [900, 130, `<div class=pill style="margin:20px;font-size:56px;font-weight:800;padding:16px 40px">INTERRUPÇÃO!</div>`],
  cartao_nome_suspeito: [760, 190, `<div class="glass name" style="margin:20px"><i></i><div><h1>Suspeito n.º 1</h1><p>Nome da personagem<br>Rubrica «Quem é que disse isto?»</p></div></div>`],
  cartao_vidro_votacao: [640, 260, `<div class="glass" style="margin:20px;padding:26px 40px;text-align:center"><div style="font-size:24px;letter-spacing:6px;font-weight:600;opacity:.9">VOTA NO KAHOOT</div><div class=grad style="font-size:110px;font-weight:800;line-height:1.1;background-image:linear-gradient(95deg,#22BBCB,#F58220 55%,#D8482E);-webkit-background-clip:text">00:30</div></div>`],
  cartao_vidro_ficcional: [760, 100, `<div class="glass" style="margin:16px;padding:16px 34px;text-align:center;font-size:26px;font-weight:700;letter-spacing:4px;border-radius:999px">HUMOR · FALAS FICCIONAIS</div>`],
  cartao_vidro_frase: [940, 420, `<div class="glass" style="margin:20px;padding:34px 44px"><div style="font-size:24px;letter-spacing:6px;font-weight:600;color:#F58220">A FRASE EM CAUSA</div><div style="font-size:54px;font-weight:700;line-height:1.2;margin-top:18px">«Aqui vai a frase que alguém disse»</div></div>`],
  titulo_rubrica: [1000, 440, `<div style="padding:20px"><div class=grad style="font-size:150px;font-weight:800;line-height:1.0">QUEM É<br>QUE DISSE<br>ISTO?</div><div style="font-size:30px;font-weight:600;letter-spacing:8px;color:#fff;margin-top:20px;opacity:.9">JSD FAMALICÃO · 50 ANOS</div></div>`],
  // fundos / composições 16:9 (TV)
  overlay_gradiente_16x9: [1920, 1080, `
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(28,26,24,0) 55%,rgba(28,26,24,.55) 78%,rgba(28,26,24,.85) 100%)"></div>
    <img src="${logoW}" style="position:absolute;left:810px;top:960px;width:300px">`],
  fundo_estudio_16x9: [1920, 1080, `
    <div style="position:absolute;inset:0;background:radial-gradient(1100px 700px at 82% 8%,rgba(245,130,32,.5),transparent 60%),radial-gradient(900px 700px at 6% 70%,rgba(34,187,203,.28),transparent 62%),linear-gradient(180deg,#1b2733,#12161b 72%,#0d0f11)"></div>
    <div style="position:absolute;left:0;right:0;top:700px;height:14px;background:#E9E9E9"></div>`],
  mesa_estudio_16x9: [1920, 1080, `
    <div style="position:absolute;left:0;right:0;top:700px;height:26px;background:#E9E9E9"></div>
    <div style="position:absolute;left:0;right:0;top:726px;height:354px;background:linear-gradient(180deg,#F58220,#D96516)"></div>
    <div style="position:absolute;left:0;right:0;top:726px;height:14px;background:rgba(0,0,0,.25)"></div>`],
  cartao_final_16x9: [1920, 1080, `
    <div style="position:absolute;inset:0;background:#E9E9E9"></div>
    <div class=grad style="position:absolute;left:160px;top:190px;font-size:150px;font-weight:800;line-height:1.02">QUEM É QUE<br>DISSE ISTO?</div>
    <div style="position:absolute;left:160px;top:560px;color:#171717;font-size:48px;font-weight:800">REVELAÇÃO</div>
    <div style="position:absolute;left:160px;top:626px;color:#171717;font-size:36px;font-weight:400">JANTAR 50 ANOS · JSD FAMALICÃO</div>
    <div style="position:absolute;left:160px;top:720px;color:#171717;font-size:36px;font-weight:700">7 DE NOVEMBRO · SUNSET HOUSE</div>
    <img src="${logoK}" style="position:absolute;left:1360px;top:830px;width:400px">`],
};

(async () => {
  const b = await chromium.launch();
  for (const [name, [w, h, body]] of Object.entries(items)) {
    const transparent = !/^(fundo|cartao_final)/.test(name);
    const html = wrap(w, h, body);
    const f = path.join(__dirname, `_${name}.html`);
    fs.writeFileSync(f, html);
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.goto('file://' + f); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, name + '.png'), omitBackground: transparent });
    await p.close(); fs.unlinkSync(f);
    console.log('ok', name);
  }
  await b.close();
})();
