# 2.ª passagem: refs mais fiáveis, falas curtas repetidas (corte pela 1.ª ocorrência via timestamps), voz grave por pós-processamento.
import os, sys, re, json, time, subprocess, unicodedata, difflib, urllib.request, msgpack, numpy as np, wave, concurrent.futures as cf
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H); import script_final as S
A = H + '/audio'; K = os.environ['FK']; SR = 44100
REFTXT = "Isso é um insulto! Eu consigo dizer uma frase sem reunião! Ouçam: Que se… Antes de dizer, proponho uma reunião para decidir se digo!"
SUF = os.environ.get('SUF', ''); ONLY = os.environ.get('ONLY'); IDS = set(os.environ.get('IDS', '').split(',')) - {''}
REF = {'ap': 'C', 'cav': 'D', 'pas': 'C', 'por': 'D' if (ONLY == 'por' or IDS) else 'B', 'mon': 'D'}
POST = {'cav': 'rubberband=pitch=0.64', 'pas': 'rubberband=pitch=0.80:formant=preserved', 'por': 'rubberband=pitch=0.76:formant=preserved'}
rb = {v: open(f'/tmp/fish/chain/ref_{v}.wav', 'rb').read() for v in set(REF.values())}
norm = lambda s: re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).split()
plain = lambda t: re.sub(r'\[[^\]]*\]', '', t).replace('«', '').replace('»', '').strip()
sel1 = json.load(open(H + '/selecao.json'))
todo = [l for l in S.L if l['ch'] and ((IDS and l['id'] in IDS) or (not IDS and (ONLY and l['ch'] == ONLY) or (not ONLY and (l['ch'] in ('cav', 'pas') or sel1[l['id']]['acc'] < 0.92))))]
def text_for(l):
    t = l['text']; p = plain(t)
    return (' '.join([t] * 3), 3) if len(p) < 60 else (t, 1)
def gen(l, take):
    out = f"{A}/{l['id']}_r{take}{SUF}.mp3"
    if os.path.exists(out) and os.path.getsize(out) > 2000: return out
    txt, _ = text_for(l); body = {'text': txt, 'format': 'mp3', 'references': [{'audio': rb[REF[l['ch']]], 'text': REFTXT}], 'prosody': {'speed': l['speed'] * ((0.95 if take == 1 else 1.06) if IDS else 1), 'volume': 0}}
    if IDS: body.update({'temperature': 0.8 if take == 1 else 1.0, 'top_p': 0.9})
    elif take == 2: body.update({'temperature': 0.95, 'top_p': 0.9})
    for att in range(4):
        try:
            r = urllib.request.Request('https://api.fish.audio/v1/tts', data=msgpack.packb(body), headers={'Authorization': 'Bearer ' + K, 'Content-Type': 'application/msgpack', 'model': 's2.1-pro-free'})
            open(out, 'wb').write(urllib.request.urlopen(r, timeout=200).read()); return out
        except Exception as e: time.sleep(3 * (att + 1))
    return None
if os.environ.get('PHASE', 'gen') == 'gen':
    jobs = [(l, t) for l in todo for t in (1, 2)]
    with cf.ThreadPoolExecutor(8) as ex: r = list(ex.map(lambda j: gen(*j), jobs))
    print('geradas', sum(1 for x in r if x), '/', len(jobs)); sys.exit()
from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8'); res = {}
def load(path, sr): return np.frombuffer(subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True).stdout, np.float32)
for l in todo:
    tg = norm(plain(l['text'])); best = None
    for take in (1, 2):
        p = f"{A}/{l['id']}_r{take}{SUF}.mp3"
        if not os.path.exists(p): continue
        x = load(p, 16000); seg, _ = m.transcribe(x, language='pt', beam_size=5, word_timestamps=True); words = [w for s in seg for w in s.words]
        hw = [(norm(w.word), w.start, w.end) for w in words]; flat = [(t, w[1], w[2]) for w in hw for t in w[0]]
        reps = text_for(l)[1]; n = len(tg); bk, bacc = None, -1
        for k in range(max(1, n - 2), (n + 3 if reps > 1 else len(flat) + 1)):
            if k > len(flat): break
            a = [f[0] for f in flat[:k]]; acc = sum(bl.size for bl in difflib.SequenceMatcher(None, tg, a).get_matching_blocks()) / max(1, n)
            if acc > bacc: bacc, bk = acc, k
        if bk is None: continue
        end = (flat[bk - 1][2] + .12) if reps > 1 else None
        if best is None or bacc > best[1]: best = (take, bacc, end, ' '.join(f[0] for f in flat[:bk]))
        if bacc >= .98: break
    if best is None: continue
    take, acc, end, hyp = best; src = f"{A}/{l['id']}_r{take}{SUF}.mp3"; out = f"{A}/{l['id']}_best.wav"
    af = (f'atrim=end={end:.3f},' if end else '') + (POST.get(l['ch'], 'anull'))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-ac', '1', '-ar', str(SR), '-af', af, out], check=True)
    res[l['id']] = dict(take=take, acc=round(acc, 3), hyp=hyp[:120]); print(l['id'], l['ch'], take, round(acc, 2), flush=True)
old = json.load(open(H + '/selecao2.json')) if os.path.exists(H + '/selecao2.json') else {}
old.update(res); json.dump(old, open(H + '/selecao2.json', 'w'), ensure_ascii=False, indent=1)
