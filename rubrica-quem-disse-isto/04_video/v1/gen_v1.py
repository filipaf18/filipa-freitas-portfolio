# Vídeo 1 «Todos negam»: vozes (Piper pt-PT, 5 modelos) + SFX sintetizados + timeline. Uso: python gen_v1.py
import subprocess, json, os, wave, numpy as np
H = os.path.dirname(os.path.abspath(__file__)); A = H + '/audio'; SR = 44100; FPS = 15
PD = '/tmp/claude-0/-home-user-filipa-freitas-portfolio/4de4662f-09eb-5fea-9c5e-f939f393f88c/scratchpad/piper/'
V = {'ap': dict(m='dii_pt-PT.onnx', rate=14, rb=1.00, fm=1.10), 'cav': dict(m='miro_pt-PT.onnx', rate=-24, rb=0.92, fm=0.90),
     'pas': dict(m='tuga-tts-train-synthetic-voice4.onnx', rate=-12, rb=1.00, fm=0.97), 'por': dict(m='tuga-tts-train-synthetic-voice3.onnx', rate=22, rb=0.88, fm=1.00),
     'mon': dict(m='v.onnx', rate=0, rb=0.78, fm=1.00)}
L = [('ap_a','ap','As declarações são reais. Os debates são imaginários. E hoje… ninguém quer assumir nada!',{}),
 ('ap_b','ap','Quatro suspeitos. Uma frase. E um estúdio prestes a aquecer.',{}),
 ('ap_c','ap','Quem é que disse isto?',{}),
 ('cav','cav','Não fui eu. E gostava de perceber como se chega a essa conclusão sem antes analisar os factos.',{}),
 ('por1','por','Eu?! Jamais! Tenho aqui, desde ontem, a minha declaração de inocência.',{}),
 ('por2','por','Tem três anexos.',{}),
 ('mon','mon','Vamos lá pôr ordem nisto. Não fui eu. E também não me parece que tenha sido o do lado!',{}),
 ('pas','pas','Também não fui eu. Mas, olhando para esta mesa… toda a gente tem ar de quem podia ter sido.',{}),
 ('e_por','por','Peço a palavra!',{'rate':35}), ('e_cav','cav','Peço-a eu há mais tempo.',{'rate':-8}), ('e_mon','mon','Um de cada vez!',{'rate':30,'rb':0.9,'gain':1.5}),
 ('ap_d','ap','Um de cada vez. Aliás… ninguém.',{}),
 ('ap_e','ap','A decisão está nas vossas mãos. Quem disse isto?',{'rate':0,'rb':0.9})]
def tts(i, ch, txt, ov):
    p = {**V[ch], **ov}; raw = f'{A}/{i}_raw.wav'; wav = f'{A}/{i}.wav'
    subprocess.run(['python','-m','piper','-m',PD+p['m'],'-f',raw,'--length-scale',f"{1/(1+p['rate']/100):.3f}",'--noise-scale','0.6'],input=txt.encode(),check=True,capture_output=True)
    af = f"rubberband=pitch={p['rb']}:formant=preserved,aresample=44100,highpass=f=90,acompressor=threshold=-20dB:ratio=3,loudnorm=I=-16:TP=-1.5"
    if abs(p['fm']-1) > .005: af = f"asetrate=22050*{p['fm']},aresample=44100,atempo={1/p['fm']:.4f}," + af
    if p.get('gain'): af += f",volume={p['gain']}"
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',raw,'-ac','1','-af',af,'-ar','44100',wav],check=True)
    w = wave.open(wav); return w.getnframes() / w.getframerate()
if not os.path.exists(A + '/dur.json') or os.environ.get('REGEN'):
    D = {i: dict(ch=ch, dur=tts(i, ch, t, o)) for i, ch, t, o in L}; json.dump(D, open(A + '/dur.json', 'w'))
D = json.load(open(A + '/dur.json')); d = lambda k: D[k]['dur']
# ---- linha do tempo ----
E = []; add = lambda k, t: (E.append((k, D[k]['ch'], round(t, 2), round(t + d(k), 2))), t + d(k))[1]
S1 = max(6.0, 0.8 + d('ap_a') + 0.5); add('ap_a', 0.8)
S2 = S1; t = add('ap_b', S2 + 0.6); FR_ON = S2 + 0.3; t_c = FR_ON + max(4.6, d('ap_b') + 1.6); t = add('ap_c', t_c)
S3 = t + 0.8; t = add('cav', S3 + 0.3) + 0.5; t = add('por1', t); t_tum = t + 0.15; t = add('por2', t_tum) + 0.5
t = add('mon', t) + 0.5; t = add('pas', t) + 1.0
E0 = t; add('e_por', E0); add('e_cav', E0 + 1.1); add('e_mon', E0 + 1.7); BELL = max(e[3] for e in E[-3:]) + 0.35
t = add('ap_d', BELL + 1.2); S4 = t + 0.5; t = add('ap_e', S4); CU = S4 + 0.9
OPT = max(t + 0.4, CU + 4.2); FIN = OPT + 3.2; TOTAL = round(FIN + 3.6, 2)
# ---- SFX sintetizados (originais) ----
N = int(TOTAL * SR); rng = np.random.default_rng(7); tt = lambda s: np.arange(int(s * SR)) / SR
def put(buf, x, at, g=1.0): s = int(at * SR); e = min(len(buf), s + len(x)); buf[s:e] += x[:e - s] * g
def noise_sweep(dur, f0, f1):
    x = rng.standard_normal(int(dur * SR)); y = np.zeros_like(x); f = np.linspace(f0, f1, len(x)); ph = np.cumsum(2 * np.pi * f / SR)
    return (x * np.sin(ph)) * np.hanning(len(x))
def boom(dur=1.0, f=55): x = tt(dur); return np.sin(2 * np.pi * (f + 90 * np.exp(-x * 14)) * x) * np.exp(-x * 3.5)
def tone(f, dur, dec=6): x = tt(dur); return np.sin(2 * np.pi * f * x) * np.exp(-x * dec)
sfx = np.zeros(N, np.float32)
for k in range(int((S1 - 0.5) / 0.5)):                                   # batida de abertura
    at = 0.5 + k * 0.5; put(sfx, boom(0.3, 50) * 0.8, at); put(sfx, rng.standard_normal(int(0.04 * SR)) * np.exp(-tt(0.04) * 90) * 0.18, at + 0.25)
    put(sfx, tone(55 if k % 4 < 2 else 73.4, 0.45, 3) * 0.35, at)
for at in (0.35, 0.9, 1.5, 2.0): put(sfx, noise_sweep(0.45, 300, 3000) * 0.35, at)   # whoosh das formas
put(sfx, boom(1.2, 45) * 1.1, 3.0); put(sfx, noise_sweep(0.5, 800, 5000) * 0.3, 3.0)  # estalo do título
put(sfx, tone(60, 1.6, 1.2) * 0.5 + tone(63, 1.6, 1.2) * 0.4, t_c - 0.3)              # sting suspense
put(sfx, boom(0.4, 70) * 1.2, t_tum)  # TUM
bell = (tone(1850, 1.5, 2.8) * 0.6 + tone(2790, 1.5, 3.4) * 0.35 + tone(925, 1.5, 2.2) * 0.2)
put(sfx, bell, BELL, 0.9)
for k in range(8): put(sfx, tone(1500 if k % 2 == 0 else 1100, 0.07, 60) * 0.5, CU + k * 0.5)  # tique-taque
put(sfx, noise_sweep(OPT + 3.0 - OPT, 200, 4000) * 0.2, OPT)
put(sfx, boom(1.3, 48) * 1.1, FIN); put(sfx, noise_sweep(0.7, 2000, 9000) * 0.3, FIN)
stems = {c: np.zeros(N, np.float32) for c in V}
for k, c, s, e in E:
    w = wave.open(f'{A}/{k}.wav'); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; put(stems[c], x, s)
voices = sum(stems.values()); duck = np.ones(N, np.float32)
for k, c, s, e in E: duck[int(s * SR):int(e * SR)] = 0.45                       # música/SFX baixam sob a voz
master = voices * 0.95 + sfx * duck * 0.55 + sfx * (1 - duck) * 0.0
master /= max(1, np.abs(master).max() * 1.03)
with wave.open(A + '/master.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((master * 32767).astype(np.int16).tobytes())
n = int(TOTAL * FPS); vis = {}
for c, x in stems.items():
    win = SR // FPS; r = np.array([np.sqrt(np.mean(x[i*win:(i+1)*win] ** 2) + 1e-12) for i in range(n)]); pk = np.percentile(r[r > 1e-3], 95) if (r > 1e-3).any() else 1
    vis[c] = [None if r[i] < .004 else ('vA' if r[i]/pk < .12 else 'vB' if r[i]/pk < .28 else 'vC' if r[i]/pk < .48 else 'vE' if r[i]/pk < .7 else 'vD') for i in range(n)]
json.dump(dict(fps=FPS, n=n, total=TOTAL, vis=vis, events=E, S1=S1, S2=S2, S3=S3, E0=E0, BELL=BELL, S4=S4, CU=CU, OPT=OPT, FIN=FIN, FR_ON=FR_ON, T_TUM=t_tum, T_C=t_c), open(H + '/timeline_v1.json', 'w'))
print('total', TOTAL, 'frames', n); [print(e) for e in E]
