// Renderiza o vídeo 1920x1080 a 15 fps (animação "on twos") e junta com o áudio.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), cp = require('child_process');
const { suspeito, wrapBust } = require(path.join(__dirname, '../../01_imagem/build/suspeitos.js'));
const D = path.join(__dirname, '..'), R = path.join(D, '..', '01_imagem'), CACHE = path.join(D, 'cache'), FR = path.join(D, 'frames');
[CACHE, FR].forEach((p) => fs.mkdirSync(p, { recursive: true }));
const T = JSON.parse(fs.readFileSync(D + '/timeline.json')); const FPS = T.fps;
const SUS = ['cavaco', 'passos', 'portas', 'montenegro'], KEY = { cavaco: 'cav', passos: 'pas', portas: 'por', montenegro: 'mon', apresentador: 'ap' };
const NOMES = { cavaco: 'Cavaco Silva', passos: 'Passos Coelho', portas: 'Paulo Portas', montenegro: 'Luís Montenegro' };
const XS = [460, 830, 1200, 1570]; const P = (n) => `file://${R}/png_brand/${n}.png`;
// ordem de falas (início/fim em s) para destacar quem fala
const CHN = { cavaco: 'cav', passos: 'pas', portas: 'por', montenegro: 'mon', apresentador: 'ap' }; const FALA = {}; for (const c in CHN) FALA[c] = T.events.filter((e) => e[1] === CHN[c]).map((e) => [e[2], e[3]]);
const speaking = (c, t) => FALA[c].some(([a, b]) => t >= a && t <= b);
const eb = (c, t, i) => { const o = { cavaco: 0, passos: 1.1, portas: 2.3, montenegro: 0.6, apresentador: 1.7 }[c]; const ph = ((t + o) % 3.4); return ph < 0.13 || (i % 97 === 0); };
(async () => {
  const b = await chromium.launch();
  // 1) cache de estados (PNG transparente 360x720)
  const need = new Set(); const stateOf = (c, t, i) => {
    const sp = speaking(c, t), blink = eb(c, t, i) ? 1 : 0; const v = T.vis[KEY[c]][i];
    if (sp && v) return `${c}|fala|${v}|${blink}`; return `${c}|${i >= 575 && c === 'passos' ? 'ironico' : 'neutro'}|vX|${blink}`; };
  const cachePage = await b.newPage({ viewport: { width: 360, height: 720 } });
  const render = async (st) => { const f = path.join(CACHE, st.replace(/\|/g, '_') + '.png'); if (fs.existsSync(f)) return f; const [c, em, v, bl] = st.split('|');
    const base = em === 'fala' ? { brow: [-6, 6], raiseL: -6, raiseR: -10, boca: v, olhos: 1.05 } : em === 'ironico' ? { brow: [4, 8], raiseL: 0, raiseR: -16, boca: 'ironico', olhos: .9 } : { brow: [0, 0], raiseL: 0, raiseR: 0, boca: v === 'vX' ? 'base' : v, olhos: 1 };
    const key = c === 'apresentador' ? 'apresentador' : c; const s = suspeito(key, { ...base, piscar: bl === '1' }, st.replace(/\W/g, ''));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="720" viewBox="0 -300 600 1200">${s.body}</svg>`;
    await cachePage.setContent(`<body style="margin:0;background:transparent">${svg}</body>`); await cachePage.screenshot({ path: f, omitBackground: true }); return f; };
  for (let i = 0; i < T.n; i++) { const t = i / FPS; for (const c of [...SUS, 'apresentador']) need.add(stateOf(c, t, i)); }
  console.log('estados', need.size); for (const st of need) await render(st);
  // adereços (PNG)
  const propF = {}; for (const c of SUS) { const s = suspeito(c, 'neutro', c + 'pp'); const f = path.join(CACHE, `prop_${c}.png`); const defs = s.body.match(/<defs>[\s\S]*?<\/defs>/)[0];
    await cachePage.setContent(`<body style="margin:0;background:transparent"><svg width="315" height="210" viewBox="-150 0 300 200" style="overflow:visible">${s.props}${defs}</svg></body>`); await cachePage.screenshot({ path: f, omitBackground: true, clip: { x: 0, y: 0, width: 315, height: 210 } }); propF[c] = f; }
  await cachePage.close();
  // 2) frames
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const css = `@font-face{font-family:M;font-weight:700;src:url(file://${path.join(D, '../01_imagem/build/fonts/montserrat-latin-700-normal.woff2')})}@font-face{font-family:M;font-weight:800;src:url(file://${path.join(D, '../01_imagem/build/fonts/montserrat-latin-800-normal.woff2')})}
  body{margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:#111;font-family:M}.abs{position:absolute}.glass{position:absolute;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.45);color:#fff;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .grad{background:linear-gradient(95deg,#22BBCB,#F58220 48%,#D8482E);-webkit-background-clip:text;color:transparent;font-weight:800}`;
  const frameHTML = (i) => { const t = i / FPS;
    if (t < 3.0) { const a = Math.min(1, t / .5); return `<style>${css}</style><body><img class=abs src="${P('fundo_estudio_16x9')}"><div class=abs style="left:0;right:0;top:190px;text-align:center;opacity:${a}"><div class=grad style="font-size:170px;line-height:1.02">QUEM É QUE<br>DISSE ISTO?</div><div style="color:#fff;font-size:34px;font-weight:700;letter-spacing:10px;margin-top:26px">DEBATE · ESPECIAL 50 ANOS</div></div><img class=abs src="${P('overlay_gradiente_16x9')}"><img class=abs src="${P('cartao_vidro_ficcional')}" style="left:40px;top:960px;width:420px"></body>`; }
    if (t >= T.endcard) { const a = Math.min(1, (t - T.endcard) / .5); return `<style>${css}</style><body style="background:#E9E9E9"><div class=abs style="left:160px;top:170px;opacity:${a}"><div class=grad style="font-size:150px;line-height:1.02">QUEM É QUE<br>DISSE ISTO?</div><div style="display:inline-block;margin-top:50px;background:#F58220;color:#fff;border-radius:22px;padding:20px 40px;font-size:60px;font-weight:800">VOTA NO KAHOOT</div><div style="color:#171717;font-size:36px;font-weight:700;margin-top:36px">A revelação, no próximo vídeo.</div></div><img class=abs src="file://${R}/brand/logo_50anos_preto.png" style="left:1360px;top:830px;width:400px"></body>`; }
    const sway = (c, k) => Math.sin(t * 1.4 + k) * 1.1;
    const bust = (c, x, k, w, extra = '') => { const st = stateOf(c, t, i); const f = path.join(CACHE, st.replace(/\|/g, '_') + '.png'); const sp = speaking(c, t);
      return `<img class=abs src="file://${f}" style="left:${x - w / 2}px;top:-20px;width:${w}px;transform-origin:50% 90%;transform:rotate(${sway(c, k)}deg) scale(${sp ? 1.035 : 1});filter:${sp ? 'none' : 'brightness(.82)'}${extra}">`; };
    const busts = SUS.map((c, k) => bust(c, XS[k], k, 360)).join('');
    const props = SUS.map((c, k) => `<img class=abs src="file://${propF[c]}" style="left:${XS[k] - 158}px;top:610px;width:315px">`).join('');
    const cards = SUS.map((c, k) => { const sp = speaking(c, t); return `<div class=glass style="left:${XS[k] - 178}px;top:868px;width:356px;padding:12px 18px;white-space:nowrap;box-sizing:border-box;${sp ? 'border-color:#F58220;box-shadow:0 0 24px #F58220;' : ''}"><div style="display:flex;gap:14px"><i style="width:5px;border-radius:3px;background:#F58220"></i><div><div style="font-size:28px;font-weight:700">${NOMES[c]}</div><div style="font-size:19px;font-weight:700;letter-spacing:2px;opacity:.9">SUSPEITO N.º ${k + 1}${sp ? ' ●' : ''}</div></div></div></div>`; }).join('');
    const apSp = speaking('apresentador', t); const apSt = stateOf('apresentador', t, i); const apF = path.join(CACHE, apSt.replace(/\|/g, '_') + '.png');
    const pip = `<div class=glass style="left:30px;top:40px;width:270px;height:400px;overflow:hidden;padding:0;${apSp ? 'border-color:#F58220;box-shadow:0 0 24px #F58220;' : ''}"><img src="file://${apF}" style="position:absolute;left:-10px;top:-14px;width:290px"></div><div class=glass style="left:30px;top:448px;width:270px;padding:8px 0;text-align:center;font-size:24px;font-weight:700;letter-spacing:2px">APRESENTADOR</div>`;
    const bell = (t >= T.bell2 && t < T.bell2 + .7) ? `<img class=abs src="${P('pilula_alerta_interrupcao')}" style="left:510px;top:70px;transform:rotate(${Math.sin(t*40)*2}deg)">` : '';
    const frase = `<div class=glass style="left:310px;top:765px;width:1300px;height:92px;display:flex;align-items:center;justify-content:center;gap:22px;border-radius:26px"><span style="font-size:22px;font-weight:700;letter-spacing:5px;color:#F58220">A FRASE EM CAUSA</span><span style="font-size:36px;font-weight:700">«[ FRASE A INSERIR PELA FILIPA ]»</span></div>`;
    return `<style>${css}</style><body><img class=abs src="${P('fundo_estudio_16x9')}">${busts}<img class=abs src="${P('mesa_estudio_16x9')}">${props}<img class=abs src="${P('overlay_gradiente_16x9')}">${pip}${frase}${cards}<img class=abs src="${P('cartao_vidro_ficcional')}" style="left:40px;top:960px;width:420px">${bell}</body>`; };
  const t0 = Date.now(); const A0 = parseInt(process.argv[2] || '0'), A1 = parseInt(process.argv[3] || String(T.n)); const only = null;
  for (let i = A0; i < A1; i++) { const f = path.join(FR, String(i).padStart(5, '0') + '.png'); if (fs.existsSync(f)) fs.unlinkSync(f);
    const hf = path.join(D, `_fr${A0}.html`); fs.writeFileSync(hf, frameHTML(i)); await page.goto('file://' + hf); await page.screenshot({ path: f }); if (i % 50 === 0) console.log(i, ((Date.now() - t0) / 1000).toFixed(0) + 's'); }
  await b.close();
})();
