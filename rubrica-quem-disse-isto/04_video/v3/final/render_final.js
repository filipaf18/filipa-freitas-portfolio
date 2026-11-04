// Renderizador do vídeo final (1920x1080, 25 fps). Uso: node render_final.js [ini fim]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const H = __dirname, R = path.join(H, '..', '..', '..', '01_imagem'), CACHE = path.join(H, 'cache'), FR = path.join(H, 'frames');
const { suspeito, EXPR } = require(path.join(R, 'build/suspeitos.js')); [CACHE, FR].forEach((p) => fs.mkdirSync(p, { recursive: true }));
const T = JSON.parse(fs.readFileSync(H + '/timeline_final.json')), FPS = T.fps, N = T.n;
const KEY = { ap: 'apresentador', cav: 'cavaco', pas: 'passos', por: 'portas', mon: 'montenegro' }, REV = { apresentador: 'ap', cavaco: 'cav', passos: 'pas', portas: 'por', montenegro: 'mon' };
const SUS = ['cavaco', 'passos', 'portas', 'montenegro'], XS = [460, 830, 1200, 1570], NOME = { cavaco: 'Cavaco Silva', passos: 'Passos Coelho', portas: 'Paulo Portas', montenegro: 'Luís Montenegro', apresentador: 'Apresentador' };
const P = (n) => `file://${R}/png_brand/${n}.png`, PIN = process.env.KAHOOT_PIN || '[ PIN A INSERIR ]';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const C = (n) => T.cards.find((c) => c.name === n);
// ---------- lista de planos ----------
const shots = []; const add = (t, plan, o = {}) => shots.push({ t, plan, spk: null, expr: {}, whip: false, ...o });
const ev = T.events; const cycle = ['calase', 'ironico', 'surpresa', 'neutro'];
add(0, 'BLACK'); add(C('title').t, 'TITLE'); 
ev.forEach((e, k) => {
  const whip = k > 0 && ev[k - 1] && e.s < ev[k - 1].e + .05 && e.ch !== ev[k - 1].ch;
  const sp = KEY[e.ch]; const plan = e.shot === 'AP' ? 'AP' : e.shot === 'WIDE' ? 'WIDE' : e.shot === 'CU' ? 'CU:' + sp : 'PM:' + sp;
  add(e.s, plan, { spk: sp, whip, id: e.id, shout: e.shout });
  const dur = e.e - e.s;
  if (dur > 4.8 && (plan === 'AP' || plan.startsWith('PM'))) for (let t = e.s + 3.6, q = 0; t < e.e - 1.5; t += 4.4, q++) {
    const others = SUS.filter((c) => c !== sp); const who = others[(k + q) % others.length];
    add(t, 'PM:' + who, { expr: { [who]: cycle[(k + q) % 4] }, cutaway: true }); add(t + 1.05, plan, { spk: sp, id: e.id, shout: e.shout });
  }
  let tr = e.e; for (const r of e.react) { const who = r[0] === 'AP' ? 'apresentador' : r[0]; add(tr, who === 'apresentador' ? 'AP' : 'PM:' + who, { expr: { [who]: r[1] }, react: true }); tr += r[2]; }
});
T.cards.forEach((c) => {
  if (c.name.startsWith('sil_pas')) { add(c.t, 'PM:passos', { silent: true }); const o = SUS.filter((x) => x !== 'passos'); add(c.t + c.dur * .42, 'PM:' + o[Math.floor(c.t) % 3], { expr: { [o[Math.floor(c.t) % 3]]: 'calase' }, cutaway: true }); add(c.t + c.dur * .42 + 1.0, 'PM:passos', { silent: true }); }
  if (c.name === 'final') { add(c.t, 'OPTIONS'); add(c.t + 2.4, 'FINAL'); }
});
shots.sort((a, b) => a.t - b.t);
// regra: nunca mais de ~5 s sem mudança de plano -> corte de reação (a voz continua por cima, como em televisão)
const inserted = []; { const tot = T.total; const base = shots.slice(); const cover = (t) => { let c = base[0]; for (const x of base) if (x.t <= t) c = x; else break; return c; };
  const runs = []; for (let k = 0; k < base.length; k++) { const sh = base[k]; const nx = k + 1 < base.length ? base[k + 1].t : tot; const last = runs[runs.length - 1]; if (last && last.plan === sh.plan && Math.abs(last.end - sh.t) < .06 && !sh.cutaway) last.end = nx; else runs.push({ plan: sh.plan, start: sh.t, end: nx, cut: !!sh.cutaway }); }
  let q = 0; for (const r of runs) { if (!(r.plan === 'AP' || r.plan.startsWith('PM:') || r.plan.startsWith('CU:')) || r.cut) continue;
    for (let t0 = r.start + 3.7; t0 + 1.05 < r.end - 0.6; t0 += 4.75) { const sp = (cover(t0).spk) || null; const others = SUS.filter((c) => KEY[c ? REV[c] : ''] !== sp && !r.plan.endsWith(c)); const who = others[q % others.length]; q++;
      shots.push({ ...cover(t0), t: t0, plan: 'PM:' + who, spk: null, expr: { [who]: cycle[(q + 1) % 4] }, cutaway: true, id: undefined, shout: false }); shots.push({ ...cover(t0 + 1.05), t: t0 + 1.05 }); inserted.push([t0, t0 + 1.05]); } }
  shots.sort((a, b) => a.t - b.t); }
if (process.env.DUMP) { fs.writeFileSync(H + '/_inserted.json', JSON.stringify(inserted)); console.log('inseridos', inserted.length); process.exit(0); }
// ---------- estados de personagem ----------
const evAt = (c, t) => ev.find((e) => KEY[e.ch] === c && t >= e.s && t <= e.e + .05);
const blink = (c, t) => { const o = { cavaco: 0, passos: 1.1, portas: 2.3, montenegro: .6, apresentador: 1.7 }[c]; return ((t + o) % 3.4) < 0.13 ? 1 : 0; };
const shotIdx = (t) => { let lo = 0; for (let i = 0; i < shots.length; i++) if (shots[i].t <= t) lo = i; else break; return lo; };
const stand = (t) => { const a = ev.find((e) => e.id === 'c16'), b = ev.find((e) => e.id === 'c21'); return a && b && t >= a.s && t < b.e + .3; };
const stateOf = (c, t, i) => { const v = T.vis[REV[c]][i], bl = blink(c, t), e = evAt(c, t), sh = shots[shotIdx(t)];
  if (e && v) return `${c}|${e.shout ? 'grito' : 'fala'}|${v}|${bl}`;
  if (sh.expr && sh.expr[c]) return `${c}|${sh.expr[c]}|vX|${bl}`;
  const act = ev.find((x) => t >= x.s && t <= x.e && KEY[x.ch] !== c);
  if (act && act.shout && c !== 'apresentador') return `${c}|surpresa|vX|${bl}`; if (act && act.e - act.s > 5 && c !== 'apresentador') return `${c}|calase|vX|${bl}`;
  return `${c}|neutro|vX|${bl}`; };
(async () => {
  const b = await chromium.launch(); const cp = await b.newPage({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 2 });
  const render = async (st) => { const f = path.join(CACHE, st.replace(/\|/g, '_') + '.png'); if (fs.existsSync(f)) return; const [c, em, v, bl] = st.split('|');
    const base = em === 'fala' ? { brow: [-6, 6], raiseL: -6, raiseR: -10, boca: v, olhos: 1.05 } : em === 'grito' ? { brow: [-10, 10], raiseL: -4, raiseR: -16, boca: v, olhos: 1.18 } : { ...EXPR[em] };
    const s = suspeito(c, { ...base, piscar: bl === '1' }, st.replace(/\W/g, '')); await cp.setContent(`<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="360" height="720" viewBox="0 -300 600 1200">${s.body}</svg></body>`); await cp.screenshot({ path: f, omitBackground: true }); };
  const A0 = parseInt(process.argv[2] || '0'), A1 = parseInt(process.argv[3] || String(N)); const need = new Set();
  for (let i = A0; i < A1; i++) for (const c of [...SUS, 'apresentador']) need.add(stateOf(c, i / FPS, i)); for (const st of need) await render(st);
  const propF = {}; for (const c of SUS) { const f = path.join(CACHE, `prop_${c}.png`); if (!fs.existsSync(f)) { const s = suspeito(c, 'neutro', c + 'pp'), defs = s.body.match(/<defs>[\s\S]*?<\/defs>/)[0]; await cp.setContent(`<body style="margin:0;background:transparent"><svg width="315" height="210" viewBox="-150 0 300 200" style="overflow:visible">${s.props}${defs}</svg></body>`); await cp.screenshot({ path: f, omitBackground: true, clip: { x: 0, y: 0, width: 315, height: 210 } }); } propF[c] = f; }
  await cp.close(); const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const css = ['700', '800'].map((w) => `@font-face{font-family:M;font-weight:${w};src:url(file://${R}/build/fonts/montserrat-latin-${w}-normal.woff2)}`).join('') + `body{margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:#0d0f11;font-family:M;color:#fff}.abs{position:absolute}.glass{position:absolute;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.45);color:#fff;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.3)}.grad{background:linear-gradient(95deg,#22BBCB,#F58220 48%,#D8482E);-webkit-background-clip:text;color:transparent;font-weight:800}`;
  const img = (c, t, i, w, x, top, extra = '') => `<img class=abs src="file://${path.join(CACHE, stateOf(c, t, i).replace(/\|/g, '_') + '.png')}" style="width:${w}px;left:${x - w / 2}px;top:${top}px;${extra}">`;
  const strap = `<div class=glass style="left:36px;top:30px;padding:8px 18px;font-size:24px;font-weight:800;letter-spacing:3px;border-radius:10px;background:rgba(200,30,30,.88);border-color:rgba(255,255,255,.5)">● EM DIRETO</div><div class=glass style="left:40px;top:972px;padding:12px 26px;font-size:24px;font-weight:700;letter-spacing:3px;border-radius:999px">HUMOR · FALAS FICCIONAIS</div>`;
  let cam = { s: 1, x: 960, y: 300 };
  const camTarget = (t, sh) => { if (sh.plan === 'WIDE') { const sp = sh.spk; const k = SUS.indexOf(sp); return k >= 0 ? { s: 1.2, x: XS[k], y: 270 } : { s: 1.03, x: 960, y: 300 }; } return { s: 1, x: 960, y: 300 }; };
  const frame = (i, upd = true) => { const t = i / FPS, sh = shots[shotIdx(t)], tin = t - sh.t; let body = '', cardNow = null;
    const tg = camTarget(t, sh); const a = sh.plan === 'WIDE' ? .22 : 1; cam = { s: cam.s + (tg.s - cam.s) * a, x: cam.x + (tg.x - cam.x) * a, y: cam.y + (tg.y - cam.y) * a };
    const wp = sh.whip && tin < .2 ? 1 - tin / .2 : 0; const whip = wp ? `filter:blur(${wp * 16}px);transform:translateX(${wp * -260}px);` : '';
    const buzz = ev.some((e) => e.sfx.some((s) => s[0] === 'buzz' && t >= e.s + (typeof s[1] === 'number' ? s[1] : 0) && t < e.s + (typeof s[1] === 'number' ? s[1] : 0) + .3)) || (ev.find((e) => e.id === 'c05') && t >= ev.find((e) => e.id === 'c05').s - .25 && t < ev.find((e) => e.id === 'c05').s + .15);
    if (sh.plan === 'BLACK') return `<style>${css}</style><body style="background:#0d0f11"></body>`;
    if (sh.plan === 'TITLE') { const p = ease(tin / .5), bump = 1 + .04 * Math.sin(tin * 9) * (tin < .7 ? 1 : 0); return `<style>${css}</style><body style="background:#171717"><div class=abs style="inset:0;background:radial-gradient(900px 600px at 50% 40%,rgba(245,130,32,.35),transparent 70%)"></div>${[0, 1].map((k) => `<div class=abs style="left:${k % 2 ? 1920 - 900 - ease((tin - k * .12) / .5) * 60 + (1 - ease((tin - k * .12) / .5)) * 900 : -900 + ease((tin - k * .12) / .5) * 960}px;top:${[110, 880][k]}px;width:900px;height:46px;background:${k % 2 ? '#D96516' : '#F58220'};transform:skewX(-18deg)"></div>`).join('')}<div class=abs style="left:0;right:0;top:300px;text-align:center;opacity:${p};transform:scale(${bump})"><div class=grad style="font-size:150px;line-height:1.03">QUEM É QUE<br>DISSE ISTO?</div><div style="font-size:34px;font-weight:700;letter-spacing:10px;margin-top:24px;color:#fff">O DEBATE</div></div><img class=abs src="${P('overlay_gradiente_16x9')}">${strap}</body>`; }
    if (sh.plan === 'OPTIONS') { const nm = ['Cavaco Silva', 'Pedro Passos Coelho', 'Paulo Portas', 'Luís Montenegro']; return `<style>${css}</style><body style="background:#0f1419"><div class=abs style="left:0;right:0;top:140px;text-align:center;font-size:76px;font-weight:800">QUEM DISSE ISTO?</div>${['A', 'B', 'C', 'D'].map((l, k) => { const p = ease((tin - k * .15) / .4); return `<div class=glass style="left:${150 + k * 430}px;top:380px;width:400px;height:300px;text-align:center;opacity:${p};transform:translateY(${(1 - p) * 60}px)"><div style="margin:34px auto 0;width:96px;height:96px;border-radius:50%;background:#F58220;font-size:62px;font-weight:800;line-height:96px">${l}</div><div style="font-size:34px;font-weight:700;margin-top:34px;padding:0 14px">${nm[k]}</div></div>`; }).join('')}${strap}</body>`; }
    if (sh.plan === 'FINAL') { const p = tin, pulse = 1 + .03 * Math.sin(p * 9); return `<style>${css}</style><body style="background:#F58220"><div class=abs style="inset:0;background:#fff;opacity:${Math.max(0, 1 - p / .25)}"></div><div class=abs style="left:0;right:0;top:250px;text-align:center;font-size:170px;font-weight:800;line-height:1.02;transform:scale(${pulse})">VOTEM NO<br>KAHOOT!</div><div class=abs style="left:0;right:0;top:700px;text-align:center;font-size:54px;font-weight:700">kahoot.it &nbsp;·&nbsp; PIN: ${PIN}</div><img class=abs src="${P('overlay_gradiente_16x9')}" style="opacity:.5">${strap}</body>`; }
    const dim = (c) => (sh.spk && sh.spk !== c && sh.plan === 'WIDE') ? 'filter:brightness(.8);' : '';
    if (sh.plan === 'WIDE') { const busts = SUS.map((c, k) => { const sp = sh.spk === c, mon = c === 'montenegro' && stand(t); return img(c, t, i, 360, XS[k], -20, `transform-origin:50% 90%;transform:${mon ? 'translateY(-34px) scale(1.12) ' : ''}rotate(${Math.sin(t * 1.4 + k) * 1.1}deg) scale(${sp ? 1.03 : 1});${dim(c)}`); }).join(''); const props = SUS.map((c, k) => `<img class=abs src="file://${propF[c]}" style="left:${XS[k] - 158}px;top:610px;width:315px">`).join(''); const plates = SUS.map((c, k) => { const s2 = sh.spk === c; return `<div class=glass style="left:${XS[k] - 170}px;top:872px;width:340px;padding:10px 18px;font-size:27px;font-weight:700;white-space:nowrap;${s2 ? 'border-color:#F58220;box-shadow:0 0 24px #F58220;' : ''}">${NOME[c]}</div>`; }).join(''); body = `<div class=abs style="inset:0;transform-origin:${cam.x}px ${cam.y}px;transform:scale(${cam.s});${whip}"><img class=abs src="${P('fundo_estudio_16x9')}">${busts}<img class=abs src="${P('mesa_estudio_16x9')}">${props}</div><img class=abs src="${P('overlay_gradiente_16x9')}">${plates}`; }
    else if (sh.plan === 'AP') { const phr = ev.filter((e) => ['b01', 'b02', 'b03'].includes(e.id)); const onPhrase = phr.length && t >= phr[0].s - .3 && t < phr[phr.length - 1].e + .5; const led = onPhrase ? `<div style="font-size:21px;letter-spacing:6px;font-weight:700;color:#F58220">A FRASE EM CAUSA</div><div style="font-size:35px;font-weight:800;line-height:1.28;margin-top:14px">«Se algum dia tiver de perder umas eleições em Portugal para salvar o país, que se lixem as eleições. O que interessa é Portugal.»</div>` : `<div class=grad style="font-size:64px;line-height:1.05;text-align:center">QUEM É QUE<br>DISSE ISTO?</div><div style="text-align:center;font-size:24px;letter-spacing:8px;font-weight:700;margin-top:12px">O DEBATE · 50 ANOS</div>`;
      body = `<div class=abs style="inset:0;${whip}"><img class=abs src="${P('fundo_estudio_16x9')}"><div class=glass style="left:1130px;top:150px;width:700px;min-height:380px;padding:34px 40px;box-sizing:border-box;background:rgba(23,42,58,.86);border-color:#F58220;display:flex;flex-direction:column;justify-content:center">${led}</div>${img('apresentador', t, i, 640, 640, 30, `transform-origin:50% 90%;transform:rotate(${Math.sin(t * 1.6) * 1.0}deg) scale(${1 + .012 * Math.sin(t * 2.2)})`)}<div class=abs style="left:210px;top:905px;width:860px;height:300px;background:linear-gradient(180deg,#F58220,#D96516);border-radius:26px 26px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.4)"></div><div class=abs style="left:210px;top:905px;width:860px;height:16px;background:#E9E9E9;border-radius:26px 26px 0 0"></div></div><img class=abs src="${P('overlay_gradiente_16x9')}"><div class=glass style="left:40px;top:872px;padding:10px 22px;font-size:27px;font-weight:700">Apresentador</div>`; }
    else { const m = sh.plan.match(/^(PM|CU):(\w+)/), c = m[2], w = m[1] === 'CU' ? 1050 : 720, top = m[1] === 'CU' ? -250 : -90, mon = c === 'montenegro' && stand(t); const zoom = m[1] === 'CU' ? 1 + .05 * clamp(tin / 2) : 1 + .03 * clamp(tin / 3);
      body = `<div class=abs style="inset:0;transform-origin:50% 40%;transform:scale(${zoom});${whip}"><img class=abs src="${P('fundo_estudio_16x9')}">${img(c, t, i, w, 960, top, `transform-origin:50% 90%;transform:${mon ? 'translateY(-30px) ' : ''}rotate(${Math.sin(t * 1.3) * (sh.shout ? 1.8 : .9)}deg)`)}</div><img class=abs src="${P('overlay_gradiente_16x9')}"><div class=glass style="left:40px;top:860px;padding:12px 26px;font-size:34px;font-weight:700"><span style="color:#F58220">●</span> ${NOME[c]}</div>`; }
    const flash = buzz ? `<div class=abs style="inset:0;box-shadow:inset 0 0 0 26px rgba(230,30,30,.85)"></div>` : '';
    return `<style>${css}</style><body>${body}${flash}${strap}</body>`; };
  for (let i = Math.max(0, A0 - 10); i < A0; i++) frame(i);
  const hf = path.join(H, `_f${A0}.html`);
  for (let i = A0; i < A1; i++) { const f = path.join(FR, String(i).padStart(5, '0') + '.png'); if (fs.existsSync(f) && fs.statSync(f).size > 5000 && !process.env.FORCE) { frame(i); continue; } fs.writeFileSync(hf, frame(i)); await page.goto('file://' + hf); await page.screenshot({ path: f }); }
  await b.close(); if (fs.existsSync(hf)) fs.unlinkSync(hf);
})();
