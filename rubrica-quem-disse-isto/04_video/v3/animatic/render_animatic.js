// Renderiza os PNG de storyboard (1 por plano) e junta num vídeo cru com o áudio provisório.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), cp = require('child_process');
const H = __dirname, R = path.join(H, '..', '..', '..', '01_imagem'), CACHE = path.join(H, 'cache'), SB = path.join(H, 'storyboard');
const { suspeito, EXPR } = require(path.join(R, 'build/suspeitos.js'));
[CACHE, SB].forEach((p) => fs.mkdirSync(p, { recursive: true }));
const T = JSON.parse(fs.readFileSync(H + '/animatic_timeline.json'));
const KEY = { ap: 'apresentador', cav: 'cavaco', pas: 'passos', por: 'portas', mon: 'montenegro' }, SUS = ['cavaco', 'passos', 'portas', 'montenegro'], XS = [460, 830, 1200, 1570];
const NOMES = { cavaco: 'CAVACO', passos: 'PASSOS', portas: 'PORTAS', montenegro: 'MONTENEGRO', apresentador: 'APRESENTADOR' }; const P = (n) => `file://${R}/png_brand/${n}.png`;
const FRASE = 'Se algum dia tiver de perder umas eleições em Portugal para salvar o país, que se lixem as eleições. O que interessa é Portugal.';
(async () => {
  const b = await chromium.launch(); const sp = await b.newPage({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 2 });
  const state = async (c, em, v = 'vX') => { const f = path.join(CACHE, `${c}_${em}_${v}.png`); if (fs.existsSync(f)) return f;
    const base = em === 'fala' ? { brow: [-6, 6], raiseL: -6, raiseR: -10, boca: v, olhos: 1.05 } : { ...EXPR[em] }; const s = suspeito(c, base, `${c}${em}${v}`);
    await sp.setContent(`<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="360" height="720" viewBox="0 -300 600 1200">${s.body}</svg></body>`); await sp.screenshot({ path: f, omitBackground: true }); return f; };
  const css = `@font-face{font-family:M;font-weight:700;src:url(file://${R}/build/fonts/montserrat-latin-700-normal.woff2)}@font-face{font-family:M;font-weight:800;src:url(file://${R}/build/fonts/montserrat-latin-800-normal.woff2)}body{margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:#111;font-family:M;color:#fff}.abs{position:absolute}.glass{position:absolute;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.45);border-radius:22px}.grad{background:linear-gradient(95deg,#22BBCB,#F58220 48%,#D8482E);-webkit-background-clip:text;color:transparent;font-weight:800}`;
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const monUpFrom = T.events.find((e) => e.id === 'c6').s, optT = T.shots.find((s) => s.plan === 'OPTIONS').t;
  for (let i = 0; i < T.shots.length; i++) {
    const s = T.shots[i]; let body = '', plan = s.plan; const spkName = s.spk ? KEY[s.spk] : null; const up = s.t >= monUpFrom && s.t < optT;
    const img = async (c, w, x, top, extra = '') => { const em = spkName === c ? 'fala' : (s.expr[c] || 'neutro'); const f = await state(c, em, em === 'fala' ? 'vC' : 'vX'); return `<img class=abs src="file://${f}" style="width:${w}px;left:${x - w / 2}px;top:${top}px;${extra}">`; };
    if (plan === 'PG') { for (let k = 0; k < 4; k++) { const c = SUS[k]; body += await img(c, 360, XS[k], -20, (c === 'montenegro' && up) ? 'transform:translateY(-34px) scale(1.12);transform-origin:50% 90%' : ''); } const apF = await state('apresentador', spkName === 'apresentador' ? 'fala' : 'neutro', spkName === 'apresentador' ? 'vC' : 'vX'); body = `<img class=abs src="${P('fundo_estudio_16x9')}">` + body + `<img class=abs src="${P('mesa_estudio_16x9')}"><div class=glass style="left:30px;top:30px;width:230px;height:330px;overflow:hidden"><img src="file://${apF}" style="position:absolute;left:-8px;top:-12px;width:250px"></div>`; }
    else if (plan.startsWith('MP:')) body = `<img class=abs src="${P('fundo_estudio_16x9')}">` + await img('apresentador', 640, 960, -60) + `<img class=abs src="${P('mesa_estudio_16x9')}" style="opacity:.0">`;
    else if (plan.startsWith('PM:')) { const c = KEY[plan.slice(3)]; body = `<img class=abs src="${P('fundo_estudio_16x9')}">` + await img(c, 640, 960, -60, (c === 'montenegro' && up) ? 'transform:translateY(-30px)' : ''); }
    else if (plan.startsWith('CU:')) { const c = KEY[plan.slice(3)]; body = `<img class=abs src="${P('fundo_estudio_16x9')}">` + await img(c, 1000, 960, -230); }
    else if (plan.startsWith('2S:')) body = `<img class=abs src="${P('fundo_estudio_16x9')}">` + await img('apresentador', 520, 620, 0) + await img('cavaco', 520, 1300, 0);
    else if (plan === 'TITLE') body = `<div class=abs style="inset:0;background:#171717"></div><div class=abs style="left:0;right:0;top:300px;text-align:center;font-size:150px;line-height:1.05" ><span class=grad>QUEM É QUE<br>DISSE ISTO?</span></div>`;
    else if (plan === 'LED') body = `<img class=abs src="${P('fundo_estudio_16x9')}"><div class=abs style="left:210px;top:260px;width:1500px;padding:60px;background:rgba(23,42,58,.9);border:6px solid #F58220;border-radius:30px;box-sizing:border-box"><div style="font-size:26px;letter-spacing:8px;font-weight:700;color:#F58220">A FRASE EM CAUSA</div><div style="font-size:58px;font-weight:800;line-height:1.24;margin-top:20px">«${FRASE}»</div></div>`;
    else if (plan === 'SFXBURST') body = `<img class=abs src="${P('fundo_estudio_16x9')}"><div class=abs style="left:0;right:0;top:420px;text-align:center;font-size:120px;font-weight:800;color:#F58220">♪ ding ding ding ♪</div>`;
    else if (plan === 'OPTIONS') body = `<div class=abs style="inset:0;background:#0f1419"></div><div class=abs style="left:0;right:0;top:150px;text-align:center;font-size:70px;font-weight:800">QUEM DISSE ISTO?</div>` + ['A · Cavaco Silva', 'B · Passos Coelho', 'C · Paulo Portas', 'D · Luís Montenegro'].map((t, k) => `<div class=glass style="left:${150 + k * 430}px;top:380px;width:400px;height:300px;font-size:38px;font-weight:700;text-align:center;line-height:300px">${t}</div>`).join('');
    else if (plan === 'FINAL') body = `<div class=abs style="inset:0;background:#F58220"></div><div class=abs style="left:0;right:0;top:360px;text-align:center;font-size:170px;font-weight:800">VOTEM NO<br>KAHOOT!</div>`;
    const label = `<div class=glass style="left:30px;top:${plan === 'PG' ? 380 : 30}px;padding:8px 18px;font-size:26px;font-weight:800;border-radius:10px;background:#F58220">${i + 1} · ${plan.replace(':', ' ').toUpperCase()}</div>`;
    const cap = s.text ? `<div class=abs style="left:160px;right:160px;bottom:60px;padding:16px 30px;background:rgba(0,0,0,.72);border-radius:16px;font-size:36px;font-weight:700;text-align:center">${s.spk ? `<span style="color:#F58220">${NOMES[KEY[s.spk]]}:</span> ` : ''}${s.text.length > 150 ? s.text.slice(0, 147) + '…' : s.text}</div>` : (s.spk === null && s.expr && Object.keys(s.expr).length ? `<div class=abs style="left:160px;right:160px;bottom:60px;text-align:center;font-size:30px;font-weight:700;opacity:.85">(reação: ${Object.entries(s.expr).map(([c, e]) => c + ' ' + e).join(', ')})</div>` : '');
    const tc = `<div class=abs style="right:30px;top:30px;font-size:26px;font-weight:700;opacity:.85">${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, '0')} · ${s.d.toFixed(1)}s${s.opc ? ' · OPC' : ''}</div>`;
    fs.writeFileSync(path.join(H, '_s.html'), `<style>${css}</style><body>${body}${label}${cap}${tc}</body>`); await page.goto('file://' + path.join(H, '_s.html'));
    await page.screenshot({ path: path.join(SB, String(i).padStart(3, "0") + ".png") });
  }
  await b.close(); fs.unlinkSync(path.join(H, '_s.html'));
  const list = T.shots.map((s, i) => `file '${path.join(SB, String(i).padStart(3, '0') + '.png')}'\nduration ${s.d}`).join('\n') + `\nfile '${path.join(SB, String(T.shots.length - 1).padStart(3, '0') + '.png')}'\n`;
  fs.writeFileSync(path.join(H, 'concat.txt'), list);
  cp.execSync(`ffmpeg -loglevel error -y -f concat -safe 0 -i ${path.join(H, 'concat.txt')} -i ${path.join(H, 'audio/animatic_mix.wav')} -vf "fps=25,format=yuv420p" -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 160k -shortest ${path.join(H, '..', 'animatic.mp4')}`);
  console.log('ok', T.shots.length);
})();
