# Mistura áudio (falas + campainha sintetizada), calcula visemas por frame (15 fps) e guarda timeline.json
import wave, json, os, subprocess, numpy as np
D = os.path.join(os.path.dirname(__file__), '..'); A = D + '/audio'; SR = 44100; FPS = 15
dur = json.load(open(A + '/duracoes.json'))
# (id, personagem, início em s)
seq = ['ap1','ap2','cav','pas','por','mon1','mon2']; CH = {i: dur[i]['ch'] for i in dur}
EV = []; t = 3.4
for i in seq:
    EV.append((i, CH[i], round(t, 2))); t += dur[i]['dur'] + (0.5 if i in ('ap1', 'ap2', 'cav', 'pas', 'por') else 0.12)
t0 = t + 0.3
for k, (i, o) in enumerate([('x_cav', 0), ('x_pas', .25), ('x_por', .5), ('x_mon', .65)]): EV.append((i, CH[i], round(t0 + o, 2)))
bell2 = max(s + dur[i]['dur'] for i, c, s in EV[-4:]) + 0.25
EV.append(('ap3', 'ap', round(bell2 + 0.9, 2)))
ENDC = round(bell2 + 0.9 + dur['ap3']['dur'] + 0.5, 2); TOTAL = round(ENDC + 5.0, 2)
def rd(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768; return x
stems = {k: np.zeros(int(TOTAL * SR), np.float32) for k in ['ap','cav','pas','por','mon']}
for i, ch, t in EV:
    x = rd(f'{A}/{i}.wav'); s = int(t * SR); stems[ch][s:s + len(x)] += x[:len(stems[ch]) - s]
# campainha sintetizada (original): 2 harmónicos com decaimento
subprocess.run(['ffmpeg','-loglevel','error','-y','-f','lavfi','-i','sine=f=1850:d=1.4','-f','lavfi','-i','sine=f=2790:d=1.4','-filter_complex',
  "[0]volume=0.6[a];[1]volume=0.35[b];[a][b]amix=inputs=2:normalize=0,afade=t=out:st=0.05:d=1.3,aecho=0.6:0.5:60:0.3,volume=1.2",'-ar',str(SR),'-ac','1',f'{A}/campainha.wav'],check=True)
bell = rd(f'{A}/campainha.wav'); bellmix = np.zeros(int(TOTAL * SR), np.float32)
for t in (2.9, bell2):
    s = int(t * SR); bellmix[s:s + len(bell)] += bell[:len(bellmix) - s] * 0.5
master = sum(stems.values()) * 0.9 + bellmix
master = master / max(1, np.abs(master).max() * 1.05)
with wave.open(f'{A}/master.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((master * 32767).astype(np.int16).tobytes())
# visemas por frame
n = int(TOTAL * FPS); tl = {k: [] for k in stems}
for k, x in stems.items():
    win = SR // FPS; rms = np.array([np.sqrt(np.mean(x[i*win:(i+1)*win] ** 2) + 1e-12) for i in range(n)]); pk = np.percentile(rms[rms > 1e-3], 95) if (rms > 1e-3).any() else 1
    for i in range(n):
        l = rms[i] / pk; speaking = rms[i] > 0.004
        v = None if not speaking else ('vA' if l < .12 else 'vB' if l < .28 else 'vC' if l < .48 else 'vE' if l < .7 else 'vD')
        tl[k].append(v)
json.dump({'fps': FPS, 'n': n, 'total': TOTAL, 'vis': tl, 'events': [(i, c, s, round(s + dur[i]['dur'], 2)) for i, c, s in EV], 'bell2': bell2, 'endcard': ENDC}, open(D + '/timeline.json', 'w'))
print('frames', n, {k: sum(1 for v in tl[k] if v) for k in tl})
