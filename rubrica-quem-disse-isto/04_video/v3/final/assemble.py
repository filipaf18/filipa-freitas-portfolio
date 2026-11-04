# Escolhe tomadas, monta linha do tempo, mistura áudio (voz + SFX + música sintetizada) e calcula visemas com antecipação.
import os, sys, re, json, subprocess, unicodedata, difflib, wave, numpy as np
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H); import script_final as S
A = H + '/audio'; SR = 44100; FPS = 25
norm = lambda s: re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).split()
plain = lambda t: re.sub(r'\[[^\]]*\]', '', t).replace('«', '').replace('»', '').strip()
def load(path, sr):
    return np.frombuffer(subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True).stdout, np.float32)
# ---------- 1. escolha de tomadas (inteligibilidade) ----------
SEL = H + '/selecao.json'
if not os.path.exists(SEL):
    from faster_whisper import WhisperModel
    m = WhisperModel('small', device='cpu', compute_type='int8'); sel = {}
    for l in S.L:
        if not l['ch']: continue
        best = None
        for t in (1, 2):
            p = f"{A}/{l['id']}_t{t}.mp3"
            if not os.path.exists(p): continue
            seg, _ = m.transcribe(load(p, 16000), language='pt', beam_size=5); hyp = ' '.join(s.text for s in seg)
            a, b = norm(plain(l['text'])), norm(hyp); acc = sum(bl.size for bl in difflib.SequenceMatcher(None, a, b).get_matching_blocks()) / max(1, len(a))
            if best is None or acc > best[1]: best = (t, acc, hyp)
            if acc >= .97: break
        sel[l['id']] = dict(take=best[0], acc=round(best[1], 3), hyp=best[2][:140])
        print(l['id'], best[0], round(best[1], 2), flush=True)
    json.dump(sel, open(SEL, 'w'), ensure_ascii=False, indent=1)
sel = json.load(open(SEL)); S2 = H + '/selecao2.json'; sel2 = json.load(open(S2)) if os.path.exists(S2) else {}
USE2 = {i for i, v in sel2.items() if os.path.exists(f'{A}/{i}_best.wav') and (dict((l['id'], l['ch']) for l in S.L if l['ch'])[i] in ('cav', 'pas') or v['acc'] > sel[i]['acc'])}
for i in USE2: sel[i] = dict(take='best', acc=sel2[i]['acc'], hyp=sel2[i]['hyp'])
# ---------- 2. vozes: aparar, nivelar, ganho ----------
voice = {}
for l in S.L:
    if not l['ch']: continue
    x = load(f"{A}/{l['id']}_best.wav", SR) if l['id'] in USE2 else load(f"{A}/{l['id']}_t{sel[l['id']]['take']}.mp3", SR); idx = np.where(np.abs(x) > 0.012)[0]
    x = x[max(0, idx[0] - int(.03 * SR)):idx[-1] + int(.09 * SR)]; r = np.sqrt(np.mean(x[np.abs(x) > 0.02] ** 2)) if (np.abs(x) > .02).any() else .05
    x = x * (0.09 / r) * 10 ** (l['vol'] / 20); voice[l['id']] = np.clip(x, -1, 1).astype(np.float32)
# ---------- 3. linha do tempo ----------
ev = []; cards = []; cur = 0.0
for l in S.L:
    if not l['ch']:
        t = cur + l['gap']; cards.append(dict(name=l['id'][1:], t=round(t, 3), dur=l['dur'])); cur = t + l['dur']; continue
    d = len(voice[l['id']]) / SR; t = cur + l['gap']
    ev.append(dict(id=l['id'], ch=l['ch'], s=round(t, 3), e=round(t + d, 3), shot=l['shot'], react=l['react'], sfx=l['sfx'], shout=l['shout'], text=plain(l['text']), acc=sel[l['id']]['acc']))
    cur = t + d + sum(r[2] for r in l['react'])
TOTAL = round(cur + 0.8, 2); N = int(TOTAL * SR); rng = np.random.default_rng(11)
# ---------- 4. SFX e música (sintetizados, originais) ----------
tt = lambda d: np.arange(int(d * SR)) / SR
def put(buf, x, at, g=1.0):
    s = int(at * SR); e = min(len(buf), s + len(x))
    if e > s and s >= 0: buf[s:e] += x[:e - s] * g
def sweep(d, f0, f1): x = rng.standard_normal(int(d * SR)); ph = np.cumsum(2 * np.pi * np.linspace(f0, f1, len(x)) / SR); return (x * np.sin(ph) * np.hanning(len(x))).astype(np.float32)
boom = lambda d=1., f=55: (np.sin(2 * np.pi * (f + 90 * np.exp(-tt(d) * 14)) * tt(d)) * np.exp(-tt(d) * 3.5)).astype(np.float32)
tone = lambda f, d, dec=6: (np.sin(2 * np.pi * f * tt(d)) * np.exp(-tt(d) * dec)).astype(np.float32)
def buzz(d=.55): t = tt(d); x = (np.sign(np.sin(2 * np.pi * 135 * t)) * .5 + np.sign(np.sin(2 * np.pi * 142 * t)) * .5) * np.minimum(1, t * 80) * np.minimum(1, (d - t) * 40); return (x * .55).astype(np.float32)
def cough(): t = tt(.35); return (sweep(.35, 400, 1200) * np.exp(-t * 7) * (1 + .6 * np.sin(2 * np.pi * 14 * t))).astype(np.float32) * .6
def cricket(d=1.8): t = tt(d); x = np.sin(2 * np.pi * 4200 * t) * (np.sin(2 * np.pi * 9 * t) > .55) * np.minimum(1, t * 4) * np.minimum(1, (d - t) * 4); return (x * .12).astype(np.float32)
sfx = np.zeros(N, np.float32)
def card(n): return next(c for c in cards if c['name'] == n)
ti = card('title')['t']
for k, f in enumerate((392, 494, 587, 784, 988)): put(sfx, tone(f, .5, 5) * .35, ti + .25 + k * .09)
put(sfx, boom(1.0, 48) * 1.2, ti + .1); put(sfx, sweep(.5, 400, 4500) * .35, ti)
for e in ev:
    for nm, off in e['sfx']:
        at = e['s'] + off if isinstance(off, (int, float)) and nm == 'buzz' else e['s']
        if nm == 'buzz': put(sfx, buzz(), at, 1.0)
        if nm == 'sting': put(sfx, tone(60, 2.2, 1.1) * .55 + tone(63, 2.2, 1.1) * .4, at - .1)
    if e['id'] in ('c05',): put(sfx, buzz(.4), e['s'] - .2, .8)
    if e['shot'] != 'AP' and e['s'] - 0.0 > 0 and e['id'] in ('c03', 'c11', 'd21', 'd22', 'e10', 'e11'): put(sfx, sweep(.28, 600, 3000) * .5, e['s'] - .1)
for c in cards:
    if c['name'].startswith('sil_pas'): put(sfx, cricket(min(c['dur'], 2.2)), c['t'] + .3); put(sfx, cough(), c['t'] + max(.5, c['dur'] * .5))
fi = card('final')['t']; put(sfx, boom(1.3, 48) * 1.2, fi); put(sfx, sweep(.8, 300, 6000) * .35, fi); [put(sfx, tone(f, 1.2, 3) * .35, fi + .15 + k * .12) for k, f in enumerate((523, 659, 784, 1047))]
# leito musical suave (acordes em loop, ducked sob a voz)
mus = np.zeros(N, np.float32); bar = 4 * 60 / 96; chords = [(220, 261.6, 329.6), (174.6, 220, 261.6), (261.6, 329.6, 392), (196, 246.9, 293.7)]
for b in range(int(TOTAL / bar) + 1):
    c = chords[b % 4]; seg = sum(np.sin(2 * np.pi * f * tt(bar)) * .3 for f in c) * np.minimum(1, tt(bar) * 8) * np.minimum(1, (bar - tt(bar)) * 8); put(mus, seg.astype(np.float32) * .5, b * bar)
    for k in range(4): put(mus, (np.sin(2 * np.pi * c[0] / 2 * tt(.3)) * np.exp(-tt(.3) * 9)).astype(np.float32) * .6, b * bar + k * bar / 4)
mus *= .035
duck = np.ones(N, np.float32)
for e in ev: duck[int(e['s'] * SR):int(e['e'] * SR)] = .35
duck = np.convolve(duck, np.ones(int(.12 * SR)) / int(.12 * SR), 'same')
stems = {c: np.zeros(N, np.float32) for c in ('ap', 'cav', 'pas', 'por', 'mon')}
for e in ev: put(stems[e['ch']], voice[e['id']], e['s'])
room = (rng.standard_normal(N) * .0015).astype(np.float32)
mix = sum(stems.values()) + sfx * .6 + mus * duck + room
np.save(H + '/_mix_raw.npy', mix.astype(np.float32))
with wave.open(H + '/mix_raw.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix / max(1, np.abs(mix).max() * 1.02), -1, 1) * 32767).astype(np.int16).tobytes())
# ---------- 5. visemas com antecipação de 1 fotograma ----------
n = int(TOTAL * FPS); win = SR // FPS; vis = {}
for c, x in stems.items():
    r = np.array([np.sqrt(np.mean(x[i * win:(i + 1) * win] ** 2) + 1e-12) for i in range(n + 3)]); pk = np.percentile(r[r > 2e-3], 95) if (r > 2e-3).any() else 1
    lv = r / pk; out = []
    for i in range(n):
        v = lv[min(i + 1, len(lv) - 1)]                      # antecipa: a boca mexe 1 fotograma (40 ms) antes do som
        out.append(None if v < .045 else 'vA' if v < .13 else 'vB' if v < .3 else 'vC' if v < .5 else 'vE' if v < .72 else 'vD')
    for i in range(1, n - 1):                                  # remove tremeliques de 1 fotograma
        if out[i] and out[i - 1] and out[i + 1] and out[i] != out[i - 1] and out[i - 1] == out[i + 1]: out[i] = out[i - 1]
    vis[c] = out
json.dump(dict(fps=FPS, n=n, total=TOTAL, events=ev, cards=cards, vis=vis), open(H + '/timeline_final.json', 'w'), ensure_ascii=False)
print('TOTAL', TOTAL, 'falas', len(ev), '| acerto médio %.1f%%' % (100 * np.mean([e['acc'] for e in ev])), '| falas ≥97%%: %d/%d' % (sum(e['acc'] >= .97 for e in ev), len(ev)))
