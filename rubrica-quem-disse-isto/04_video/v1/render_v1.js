// Renderiza o Vídeo 1 (1920x1080, 15 fps). Uso: node render_v1.js [ini fim]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const H = __dirname, R = path.join(H, '..', '..', '01_imagem'), CACHE = path.join(H, 'cache'), FR = path.join(H, 'frames');
const { suspeito, EXPR } = require(path.join(R, 'build/suspeitos.js'));
[CACHE, FR].forEach((p) => fs.mkdirSync(p, { recursive: true }));
const T = JSON.parse(fs.readFileSync(H + '/timeline_v1.json')), FPS = T.fps;
const FRASE = process.env.FRASE || 'Se algum dia tiver de perder umas eleições em Portugal para salvar o país, que se lixem as eleições. O que interessa é Portugal.'; // ⚠ POR CONFIRMAR (ver conversa)
const SUS = ['cavaco', 'passos', 'portas', 'montenegro'], ALL = [...SUS, 'apresentador'], KEY = { cavaco: 'cav', passos: 'pas', portas: 'por', montenegro: 'mon', apresentador: 'ap' };
const NOMES = { cavaco: 'Cavaco Silva', passos: 'Passos Coelho', portas: 'Paulo Portas', montenegro: 'Luís Montenegro' };
const XS = [460, 830, 1200, 1570]; const P = (n) => `file://${R}/png_brand/${n}.png`; const ev = (k) => T.events.find((e) => e[0] === k);
const FALA = {}; for (const c of ALL) FALA[c] = T.events.filter((e) => e[1] === KEY[c]).map((e) => [e[2], e[3]]);
const speaking = (c, t) => FALA[c].some(([a, b]) => t >= a && t <= b);
// reações (personagem, início, fim, expressão)
const RE = []; const R_ = (c, k, em, off = 0) => { const e = ev(k); RE.push([c, e[2] + off, e[3], em]); };
R_('portas', 'cav', 'ironico'); R_('montenegro', 'cav', 'calase', 1.5); R_('cavaco', 'por2', 'calase'); R_('passos', 'por1', 'calase'); R_('passos', 'mon', 'ironico', 2.2);
R_('cavaco', 'mon', 'calase'); R_('portas', 'mon', 'surpresa', 2.5); { const e = ev('pas'); for (const c of ['cavaco', 'portas', 'montenegro']) { RE.push([c, e[2] + 3.4, e[3], 'surpresa']); RE.push([c, e[3], e[3] + 0.9, 'calase']); } }
RE.push(['passos', T.E0, T.BELL, 'calase']); for (const c of ['cavaco', 'portas', 'montenegro', 'passos']) RE.push([c, T.CU, T.CU + 4.2, 'calase']);
const reac = (c, t) => { const r = RE.find((x) => x[0] === c && t >= x[1] && t <= x[2]); return r ? r[3] : 'neutro'; };
const blink = (c, t, i) => { const o = { cavaco: 0, passos: 1.1, portas: 2.3, montenegro: .6, apresentador: 1.7 }[c]; return ((t + o) % 3.4) < 0.13 ? 1 : 0; };
const stateOf = (c, t, i) => { const v = T.vis[KEY[c]][i], b = blink(c, t, i); return speaking(c, t) && v ? `${c}|fala|${v}|${b}` : `${c}|${reac(c, t)}|vX|${b}`; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
(async () => {
  const b = await chromium.launch(); const cp = await b.newPage({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 2 });
  const render = async (st) => { const f = path.join(CACHE, st.replace(/\|/g, '_') + '.png'); if (fs.existsSync(f)) return; const [c, em, v, bl] = st.split('|');
    const base = em === 'fala' ? { brow: [-6, 6], raiseL: -6, raiseR: -10, boca: v, olhos: 1.05 } : { ...EXPR[em] };
    const s = suspeito(c, { ...base, piscar: bl === '1' }, st.replace(/\W/g, '')); await cp.setContent(`<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="360" height="720" viewBox="0 -300 600 1200">${s.body}</svg></body>`); await cp.screenshot({ path: f, omitBackground: true }); };
  const need = new Set(); for (let i = 0; i < T.n; i++) for (const c of ALL) need.add(stateOf(c, i / FPS, i)); for (const st of need) await render(st);
  const propF = {}; for (const c of SUS) { const s = suspeito(c, 'neutro', c + 'pp'), f = path.join(CACHE, `prop_${c}.png`), defs = s.body.match(/<defs>[\s\S]*?<\/defs>/)[0];
    await cp.setContent(`<body style="margin:0;background:transparent"><svg width="315" height="210" viewBox="-150 0 300 200" style="overflow:visible">${s.props}${defs}</svg></body>`); await cp.screenshot({ path: f, omitBackground: true, clip: { x: 0, y: 0, width: 315, height: 210 } }); propF[c] = f; }
  await cp.close();
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const css = ['700', '800'].map((w) => `@font-face{font-family:M;font-weight:${w};src:url(file://${R}/build/fonts/montserrat-latin-${w}-normal.woff2)}`).join('') + `body{margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:#111;font-family:M;color:#fff}.abs{position:absolute}.glass{position:absolute;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.45);color:#fff;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.25)}.grad{background:linear-gradient(95deg,#22BBCB,#F58220 48%,#D8482E);-webkit-background-clip:text;color:transparent;font-weight:800}`;
  const aviso = `<img class=abs src="${P('cartao_vidro_ficcional')}" style="left:40px;top:960px;width:420px">`;
  let cam = { s: 1, x: 960, y: 300, r: 0 };
  const frame = (i) => { const t = i / FPS;
    // ---------- CENA 1: abertura ----------
    if (t < T.S1) { const shapes = [[-900, 120, 900, 70, 0, '#F58220'], [1920, 220, 820, 60, 0, '#D96516'], [-700, 760, 760, 64, 0, '#D96516'], [1920, 860, 900, 70, 0, '#F58220'], [-300, 480, 20, 20, 0, '#F58220']];
      const sh = shapes.slice(0, 4).map(([x0, y, w, h, , col], k) => { const p = ease((t - 0.3 - k * .22) / .7); const tx = k % 2 === 0 ? x0 + (60 - x0) * p : x0 + (1920 - w - 60 - x0) * p; return `<div class=abs style="left:${tx}px;top:${y}px;width:${w}px;height:${h}px;background:${col};transform:skewX(-18deg)"></div>`; }).join('');
      const pt = ease((t - 2.8) / .35), qb = t > 3.1 ? Math.abs(Math.sin((t - 3.1) * 7)) * (t < 4.2 ? 1 : .15) : 0;
      return `<style>${css}</style><body style="background:#171717">${sh}<div class=abs style="left:0;right:0;top:300px;text-align:center;opacity:${pt};transform:scale(${1.25 - .25 * pt})"><div class=grad style="font-size:150px;line-height:1.03">QUEM É QUE</div><div style="display:flex;justify-content:center;align-items:center;gap:6px;font-size:150px;line-height:1.03"><span class=grad>DISSE ISTO</span><span class=grad style="display:inline-block;transform:translateY(${-qb * 24}px) scale(${1 + qb * .12})">?</span></div></div><img class=abs src="${P('overlay_gradiente_16x9')}">${aviso}</body>`; }
    // ---------- câmara ----------
    let tg = { s: 1.0, x: 960, y: 300, r: 0 }; const sp = SUS.find((c) => speaking(c, t));
    if (t < T.S3) tg = { s: 1 + .06 * clamp((t - T.S2) / 9), x: 960, y: 260, r: 0 };
    else if (t < T.E0) { if (sp) tg = { s: 1.14, x: XS[SUS.indexOf(sp)], y: 260, r: 0 }; else tg = { s: 1.0, x: 960, y: 300, r: 0 }; }
    else if (t < T.BELL) { const j = (Math.sin(i * 12.9) + Math.sin(i * 7.3)) * .5; tg = { s: 1.06 + Math.abs(j) * .05, x: 960 + j * 120, y: 280, r: j * 1.2 }; }
    else if (t >= T.CU && t < T.CU + 4) { const k = clamp(Math.floor((t - T.CU) / 1), 0, 3); tg = { s: 2.0, x: XS[k], y: 250, r: 0 }; }
    const a = (t >= T.CU && t < T.CU + 4) ? .6 : .22; cam = { s: cam.s + (tg.s - cam.s) * a, x: cam.x + (tg.x - cam.x) * a, y: cam.y + (tg.y - cam.y) * a, r: cam.r + (tg.r - cam.r) * a };
    const shake = (t >= T.T_TUM && t < T.T_TUM + .5) ? Math.sin(i * 9) * 14 * (1 - (t - T.T_TUM) / .5) : 0;
    const camCSS = `transform-origin:${cam.x}px ${cam.y}px;transform:translate(${shake}px,${-shake * .6}px) scale(${cam.s}) rotate(${cam.r}deg)`;
    const esc = t >= T.E0 && t < T.BELL, stand = esc ? 1 : 0;
    const busts = SUS.map((c, k) => { const st = stateOf(c, t, i), f = path.join(CACHE, st.replace(/\|/g, '_') + '.png'), s2 = speaking(c, t);
      const ex = (c === 'montenegro' && stand) ? 'translateY(-34px) scale(1.12)' : ''; const hi = (t >= T.CU && t < T.CU + 4) || t < T.S3 || s2 || esc;
      return `<img class=abs src="${f}" style="left:${XS[k] - 180}px;top:-20px;width:360px;transform-origin:50% 90%;transform:${ex} rotate(${Math.sin(t * 1.4 + k) * 1.1 + (esc ? Math.sin(i * 5 + k) * 1.5 : 0)}deg) scale(${s2 ? 1.035 : 1});filter:${hi ? 'none' : 'brightness(.8)'}">`; }).join('');
    const drop = t >= T.T_TUM - .35 && t < T.T_TUM ? -90 * (1 - (t - (T.T_TUM - .35)) / .35) : 0; const pasta = t < T.T_TUM - .35 ? 'opacity:0' : '';
    const props = SUS.map((c, k) => `<img class=abs src="${propF[c]}" style="left:${XS[k] - 158}px;top:${610 + (c === 'portas' ? drop : 0)}px;width:315px;${c === 'portas' && t < T.T_TUM - .35 ? 'opacity:.0' : ''}">`).join('');
    const world = `<div class=abs style="inset:0;${camCSS}"><img class=abs src="${P('fundo_estudio_16x9')}">${busts}<img class=abs src="${P('mesa_estudio_16x9')}">${props}</div>`;
    const apSp = speaking('apresentador', t), apF = path.join(CACHE, stateOf('apresentador', t, i).replace(/\|/g, '_') + '.png');
    const pip = `<div class=glass style="left:30px;top:40px;width:270px;height:400px;overflow:hidden;${apSp ? 'border-color:#F58220;box-shadow:0 0 24px #F58220;' : ''}"><img src="${apF}" style="position:absolute;left:-10px;top:-14px;width:290px"></div><div class=glass style="left:30px;top:448px;width:270px;padding:8px 0;text-align:center;font-size:24px;font-weight:700;letter-spacing:2px">APRESENTADOR</div>`;
    const inCU = t >= T.CU && t < T.CU + 4, ck = clamp(Math.floor((t - T.CU) / 1), 0, 3);
    const cards = SUS.map((c, k) => { const s2 = speaking(c, t) || (inCU && ck === k); return `<div class=glass style="left:${XS[k] - 178}px;top:868px;width:356px;padding:12px 18px;white-space:nowrap;${s2 ? 'border-color:#F58220;box-shadow:0 0 24px #F58220;' : ''}"><div style="display:flex;gap:14px"><i style="width:5px;border-radius:3px;background:#F58220"></i><div><div style="font-size:28px;font-weight:700">${NOMES[c]}</div><div style="font-size:19px;font-weight:700;letter-spacing:2px;opacity:.9">SUSPEITO N.º ${k + 1}${s2 ? ' ●' : ''}</div></div></div></div>`; }).join('');
    let over = '';
    if (t >= T.FR_ON && t < T.T_C + 1.2) { const a2 = ease((t - T.FR_ON) / .4); over += `<div class=glass style="left:210px;top:180px;width:1500px;padding:44px 60px;opacity:${a2};transform:scale(${.94 + .06 * a2});border-radius:34px;background:rgba(23,42,58,.78)"><div style="font-size:26px;letter-spacing:8px;font-weight:700;color:#F58220">A FRASE EM CAUSA</div><div style="font-size:58px;font-weight:800;line-height:1.22;margin-top:20px">«${FRASE}»</div></div>`; }
    else if (t >= T.T_C + 1.2 && t < T.OPT) over += `<div class=glass style="left:310px;top:765px;width:1300px;height:84px;display:flex;align-items:center;justify-content:center;gap:20px;border-radius:26px;background:rgba(23,42,58,.6)"><span style="font-size:20px;font-weight:700;letter-spacing:5px;color:#F58220">A FRASE</span><span style="font-size:24px;font-weight:700;overflow:hidden;white-space:nowrap">«${FRASE.length > 80 ? FRASE.slice(0, 77) + '…' : FRASE}»</span></div>`;
    if (esc) over += `<img class=abs src="${P('pilula_alerta_interrupcao')}" style="left:520px;top:60px;opacity:${.6 + .4 * Math.abs(Math.sin(i))}"><img class=abs src="${P('barra_debate_placeholder')}" style="display:none">` + `<div class=abs style="left:560px;top:760px;width:800px;height:34px;background:rgba(255,255,255,.2);border-radius:17px;overflow:hidden"><div style="width:${40 + 55 * clamp((t - T.E0) / (T.BELL - T.E0))}%;height:100%;background:#F58220"></div></div>`;
    if (t >= T.BELL && t < T.BELL + .35) over += `<div class=abs style="inset:0;background:#fff;opacity:${1 - (t - T.BELL) / .35}"></div>`;
    if (t >= T.OPT && t < T.FIN) { const q = ['A', 'B', 'C', 'D'], nm = ['Cavaco Silva', 'Pedro Passos Coelho', 'Paulo Portas', 'Luís Montenegro'];
      over += `<div class=abs style="inset:0;background:rgba(10,15,20,.82)"></div><div class=abs style="left:0;right:0;top:150px;text-align:center;font-size:70px;font-weight:800">QUEM DISSE ISTO?</div>` + q.map((l, k) => { const p = ease((t - T.OPT - k * .18) / .4); return `<div class=glass style="left:${150 + k * 430}px;top:380px;width:400px;height:300px;text-align:center;opacity:${p};transform:translateY(${(1 - p) * 60}px);background:rgba(255,255,255,.14)"><div style="margin:34px auto 0;width:96px;height:96px;border-radius:50%;background:#F58220;font-size:62px;font-weight:800;line-height:96px">${l}</div><div style="font-size:34px;font-weight:700;margin-top:34px;padding:0 14px">${nm[k]}</div></div>`; }).join(''); }
    if (t >= T.FIN) { const p = t - T.FIN, pulse = 1 + .04 * Math.sin(p * 10); over += `<div class=abs style="inset:0;background:#F58220"></div><div class=abs style="inset:0;background:#fff;opacity:${Math.max(0, 1 - p / .25)}"></div><div class=abs style="left:0;right:0;top:360px;text-align:center;font-size:170px;font-weight:800;transform:scale(${pulse})">VOTEM NO<br>KAHOOT!</div><img class=abs src="${P('overlay_gradiente_16x9')}" style="opacity:.5">`; }
    return `<style>${css}</style><body>${world}<img class=abs src="${P('overlay_gradiente_16x9')}">${pip}${cards}${over}${aviso}</body>`; };
  const A0 = parseInt(process.argv[2] || '0'), A1 = parseInt(process.argv[3] || String(T.n)); const hf = path.join(H, `_f${A0}.html`);
  for (let i = A0; i < A1; i++) { const f = path.join(FR, String(i).padStart(5, '0') + '.png'); fs.writeFileSync(hf, frame(i)); await page.goto('file://' + hf); await page.screenshot({ path: f }); }
  await b.close(); fs.unlinkSync(hf);
})();
