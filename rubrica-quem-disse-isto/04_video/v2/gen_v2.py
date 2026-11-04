# V2 «O Debate»: vozes por segmentos (ritmo/tom/pausa por frase), cortes de silêncio, SFX sintetizados, timeline a 25 fps.
import subprocess, json, os, wave, numpy as np
H = os.path.dirname(os.path.abspath(__file__)); A = H + '/audio'; SR = 44100; FPS = 25
PD = '/tmp/claude-0/-home-user-filipa-freitas-portfolio/4de4662f-09eb-5fea-9c5e-f939f393f88c/scratchpad/piper/'
V = {'ap': dict(m='dii_pt-PT.onnx', rate=10, rb=1.00, fm=1.10), 'cav': dict(m='miro_pt-PT.onnx', rate=-26, rb=0.90, fm=0.88),
     'pas': dict(m='tuga-tts-train-synthetic-voice4.onnx', rate=-18, rb=0.97, fm=0.95), 'por': dict(m='tuga-tts-train-synthetic-voice3.onnx', rate=26, rb=0.90, fm=1.02),
     'mon': dict(m='v.onnx', rate=2, rb=0.80, fm=1.0)}
S = lambda t, **k: (t, {**k, 'p': k.get('p', .18) * .65, 'rate': k.get('rate', 0) + 14})          # segmento: texto + overrides (rate, rb, gain, p=pausa depois em s)
# (id, personagem, [segmentos], gap, opções) · gap<0 = fala por cima · react={personagem:expressão} · cu=personagem em plano fechado
L = [
 ('a1','ap',[S('As declarações são reais. Os debates são imaginários.',p=.7),S('E o que vai acontecer a seguir… também, esperemos.',rate=-8)],0.8,{}),
 ('b1','ap',[S('Boa noite. Esta noite temos quatro convidados,',p=.15),S('uma frase…',p=.55,rate=-8),S('e nenhum responsável.',rate=-14)],'S1',{}),
 ('@frase_on',None,None,.4,{}),
 ('b2','ap',[S('A frase é a seguinte.',rate=-6)],.3,{'react':{'cavaco':'calase','portas':'ironico','montenegro':'surpresa'}}),
 ('b3','ap',[S('Dita em voz alta, tem uma certa dignidade.',rate=-4)],3.6,{'react':{'cavaco':'calase','portas':'ironico'}}),
 ('b4','ap',[S('Reparem.',p=.25),S('“Umas” eleições.',p=.7,rate=-14),S('Como quem perde umas meias.',rate=-10,rb=.97)],1.0,{'react':{'portas':'ironico','montenegro':'surpresa'}}),
 ('b5','ap',[S('E depois o verbo.',p=.2),S('“Lixar.”',p=.7,rate=-18),S('Um verbo com grande tradição política…',p=.6),S('mas habitualmente usado em privado.',rate=-10)],2.2,{'react':{'cavaco':'calase','montenegro':'surpresa','passos':'ironico'}}),
 ('b6','ap',[S('Diz a frase que o que interessa é Portugal.',p=.6),S('É uma excelente notícia para Portugal, que até aqui andava convencido de que interessavam as eleições.',rate=-6)],2.0,{'react':{'portas':'ironico'}}),
 ('b7','ap',[S('Quem disse isto?',p=.7),S('Não precisam de levantar a mão.',p=.4),S('Já sei que ninguém vai levantar.',rate=-12)],2.4,{'react':{'cavaco':'calase','portas':'calase','montenegro':'calase','passos':'calase'}}),
 ('@frase_off',None,None,1.6,{}),
 ('c1','ap',[S('Começamos pelo professor Cavaco Silva.')],.4,{}),
 ('c2','cav',[S('Deixe-me terminar.',rate=-6)],.5,{}),
 ('c3','ap',[S('Ainda não começou.',rate=-4)],.45,{'react':{'cavaco':'calase'}}),
 ('c4','cav',[S('Então deixe-me começar.',p=.6),S('Para depois terminar.',rate=-8)],.6,{}),
 ('c5','cav',[S('Convém distinguir entre dizer uma frase e ter dito uma frase.',p=.6),S('Eu não disse.',p=.7,rate=-10),S('E se tivesse dito, tê-lo-ia dito melhor.',rate=-8)],.9,{'react':{'portas':'ironico','montenegro':'calase'}}),
 ('d1','por',[S('Objeção!',rate=10,rb=1.06,gain=1.3)],-.55,{'react':{'cavaco':'surpresa'}}),
 ('d2','ap',[S('Ainda ninguém o acusou.',rate=-4)],.35,{}),
 ('d3','por',[S('Gosto de chegar cedo.',p=.15),S('Tenho aqui a minha defesa.',rate=4)],.3,{}),
 ('@tum',None,None,.15,{}),
 ('d4','por',[S('Tem três anexos.',rate=-6)],.35,{'react':{'cavaco':'calase','passos':'calase','montenegro':'surpresa'}}),
 ('d5','por',[S('O terceiro é um pedido de desculpas,',p=.15),S('para o caso de ser necessário.',rate=-4)],.7,{'react':{'cavaco':'calase','montenegro':'surpresa','passos':'ironico'}}),
 ('e1','cav',[S('Não está a respeitar o uso da palavra.',rate=-4)],.4,{'react':{'portas':'ironico'}}),
 ('e2','mon',[S('Calma! Calma!',p=.1,rate=8,rb=.9,gain=1.25),S('Vamos pôr ordem nisto!',rate=0,rb=.86,gain=1.2)],-.15,{'react':{'cavaco':'calase'}}),
 ('e3','ap',[S('Está a moderar o meu debate?',rate=-4)],.45,{'react':{'montenegro':'surpresa'}}),
 ('e4','mon',[S('Estou só a ajudar.',rate=-4)],.45,{}),
 ('e5','ap',[S('Ajudar é quando se pede.',p=.5),S('Isto é invadir.',rate=-12)],.35,{'react':{'portas':'ironico','passos':'ironico'}}),
 ('e6','mon',[S('Então…',p=.6,rate=-14),S('peço desculpa,',p=.3),S('e continuo a ajudar.',rate=14)],1.0,{'react':{'cavaco':'calase','portas':'ironico'}}),
 ('f1','pas',[S('Eu só queria dizer uma coisa.',rate=-8)],1.4,{'react':{'cavaco':'calase','portas':'calase','montenegro':'calase'}}),
 ('f2','pas',[S('Já me esqueci.',rate=-12)],2.4,{'react':{'cavaco':'surpresa','portas':'surpresa','montenegro':'surpresa'}}),
 ('f3','ap',[S('É a intervenção mais curta da noite.',p=.5),S('E a mais honesta.',rate=-12)],.7,{}),
 ('f4','pas',[S('Não fui eu.',p=.8,rate=-10),S('Mas admito que a frase tem boa estrutura: hipótese, sacrifício, país.',p=.8),S('É quase um filme português.',rate=-8)],1.3,{'react':{'cavaco':'calase','portas':'ironico'}}),
 ('f5','ap',[S('É a melhor crítica de cinema que ouvi esta semana.',rate=-2)],1.2,{}),
 ('g1','mon',[S('Quem tem ar de ter dito isto é o senhor Portas.',p=.5),S('Gosta de subordinadas.',rate=-6)],.85,{'react':{'portas':'surpresa'}}),
 ('g2','por',[S('Calúnia!',p=.2,gain=1.3,rb=1.05),S('Se eu tivesse dito, tinha dito com muito mais vírgulas!',rate=12)],.35,{'react':{'montenegro':'calase'}}),
  ('g4','pas',[S('Eu acho que foi o Montenegro.',rate=-10)],.75,{'react':{'montenegro':'surpresa'}}),
 ('g5','mon',[S('Porquê?!',gain=1.3,rb=.95)],.15,{}),
 ('g6','pas',[S('Porque se levantou primeiro.',rate=-14)],.55,{}),
 ('g7','mon',[S('Mas eu ainda estou sentado!',rate=14,gain=1.2,rb=.9)],.25,{}),
 ('g8','pas',[S('É o que um culpado diria.',rate=-18)],.75,{'react':{'cavaco':'surpresa','portas':'ironico'}}),
 ('@stand_on',None,None,.25,{}),
 ('g9','mon',[S('Agora estou de pé!',p=.15,rate=18,rb=.95,gain=1.3),S('E não fui eu!',rate=20,rb=.98,gain=1.35)],.1,{}),
 ('h1','por',[S('Peço a palavra!',rate=30,rb=1.05,gain=1.25)],.25,{}),
 ('h2','cav',[S('Peço-a eu há mais tempo!',rate=-2,gain=1.3)],-.45,{}),
 ('h3','mon',[S('UM DE CADA VEZ!',rate=22,rb=1.0,gain=1.6)],-.55,{}),
 ('h4','pas',[S('Não fui eu.',rate=-18)],-.4,{}),
 ('h5','por',[S('Objeção! Objeção ao que quer que seja!',rate=34,rb=1.06,gain=1.3)],-.7,{}),
 ('h6','cav',[S('Deixem-me terminar!',rate=4,gain=1.35,rb=.97)],-.55,{}),
 ('@bell',None,None,.3,{}),
 ('i1','ap',[S('Obrigado.',p=.5),S('Reparo que, ao fim de dez minutos de debate, ninguém perdeu umas eleições.',rate=-4)],1.3,{}),
 ('i2','ap',[S('Já é um progresso.',rate=-12)],1.7,{}),
  ('j1','ap',[S('A decisão está nas vossas mãos.',p=.5,rate=-6,rb=.93),S('Quem disse isto?',rate=-12,rb=.9)],.9,{}),
 ('k1','ap',[S('Cavaco Silva.',p=.3,rate=-6),S('Garante que não foi.',p=.3),S('Mas teria dito melhor.',rate=-6)],.7,{'cu':'cavaco'}),
 ('k2','ap',[S('Passos Coelho.',p=.3,rate=-6),S('Garante que não foi.',p=.3),S('E já se esqueceu do resto.',rate=-6)],.7,{'cu':'passos'}),
 ('k3','ap',[S('Paulo Portas.',p=.3,rate=-6),S('Garante que não foi.',p=.3),S('E tem três anexos.',rate=-6)],.7,{'cu':'portas'}),
 ('k4','ap',[S('Luís Montenegro.',p=.3,rate=-6),S('Garante que não foi.',p=.3),S('Está de pé por precaução.',rate=-6)],.9,{'cu':'montenegro'}),
 ('@opt',None,None,.2,{}),
 ('l1','ap',[S('Votem no Kahoot.',p=.7),S('E lembrem-se: o que interessa é Portugal.',p=.7),S('As eleições…',p=.5,rate=-8),S('essas, que se lixem.',p=.5,rate=-8),S('Só esta noite.',rate=-12)],.6,{}),
 ('@fin',None,None,.5,{}),
]
SIL = ',silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05,areverse'
def synth(i, ch, segs):
    parts = []
    for n, (txt, ov) in enumerate(segs):
        p = {**V[ch], **{k: v for k, v in ov.items() if k in ('rb', 'gain', 'fm')}}; p['rate'] = V[ch]['rate'] + ov.get('rate', 14); raw = f'{A}/{i}_{n}_raw.wav'; out = f'{A}/{i}_{n}.wav'
        subprocess.run(['python','-m','piper','-m',PD+p['m'],'-f',raw,'--length-scale',f"{1/(1+p['rate']/100):.3f}",'--noise-scale','0.7','--noise-w','0.9'],input=txt.encode(),check=True,capture_output=True)
        af = f"rubberband=pitch={p['rb']}:formant=preserved,aresample=44100,highpass=f=90,acompressor=threshold=-20dB:ratio=3"
        if abs(p['fm']-1) > .005: af = f"asetrate=22050*{p['fm']},aresample=44100,atempo={1/p['fm']:.4f}," + af
        af += SIL + (f",volume={p['gain']}" if p.get('gain') else '')
        subprocess.run(['ffmpeg','-loglevel','error','-y','-i',raw,'-ac','1','-af',af,'-ar','44100',out],check=True)
        w = wave.open(out); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; parts.append((x, ov.get('p', .18)))
    full = np.concatenate([np.concatenate([x, np.zeros(int(pp * SR), np.float32)]) for x, pp in parts])[:-int(parts[-1][1] * SR)]
    full = full / max(1e-6, np.abs(full).max()) * .8 * (1.0)          # normaliza por fala
    return full
CACHE = A + '/lines.json'; audio = {}
for i, ch, segs, gap, o in L:
    if ch is None: continue
    f = f'{A}/{i}.npy'
    if not os.path.exists(f) or os.environ.get('REGEN'): np.save(f, synth(i, ch, segs))
    audio[i] = np.load(f)
# ganho relativo por fala (gritos mais fortes)
GAIN = {k: max(s[1].get('gain', 1) for s in segs) for k, ch, segs, g, o in L if ch}
# ---- linha do tempo ----
ev = []; mk = {}; cur = 0.0; S1 = None
for i, ch, segs, gap, o in L:
    if gap == 'S1': cur = max(cur + .6, 6.4); mk['S1'] = cur; gap = .5
    gap = gap if (gap == 'S1' or gap <= .5) else .5 + (gap - .5) * .55
    start = cur + gap
    if ch is None: mk[i[1:]] = start; cur = start; continue
    d = len(audio[i]) / SR; ev.append(dict(id=i, ch=ch, s=round(start, 3), e=round(start + d, 3), react=o.get('react', {}), cu=o.get('cu'))); cur = start + d
FIN = mk['fin']; TOTAL = round(FIN + 3.8, 2); N = int(TOTAL * SR); t_ = lambda s: np.arange(int(s * SR)) / SR; rng = np.random.default_rng(7)
def put(buf, x, at, g=1.0): s = int(at * SR); e = min(len(buf), s + len(x)); (e > s) and buf.__setitem__(slice(s, e), buf[s:e] + x[:e - s] * g)
def sweep(dur, f0, f1): x = rng.standard_normal(int(dur * SR)); ph = np.cumsum(2 * np.pi * np.linspace(f0, f1, len(x)) / SR); return x * np.sin(ph) * np.hanning(len(x))
boom = lambda d=1., f=55: np.sin(2 * np.pi * (f + 90 * np.exp(-t_(d) * 14)) * t_(d)) * np.exp(-t_(d) * 3.5)
tone = lambda f, d, dec=6: np.sin(2 * np.pi * f * t_(d)) * np.exp(-t_(d) * dec)
sfx = np.zeros(N, np.float32); S1t = mk['S1']
for k in range(int((S1t - .5) / .5)):
    at = .5 + k * .5; put(sfx, boom(.3, 50) * .8, at); put(sfx, rng.standard_normal(int(.04 * SR)) * np.exp(-t_(.04) * 90) * .18, at + .25); put(sfx, tone(55 if k % 4 < 2 else 73.4, .45, 3) * .35, at)
for at in (.35, .9, 1.5, 2.0): put(sfx, sweep(.45, 300, 3000) * .35, at)
put(sfx, boom(1.2, 45) * 1.1, 3.0); put(sfx, sweep(.5, 800, 5000) * .3, 3.0)
put(sfx, tone(60, 2.2, 1.0) * .5 + tone(63, 2.2, 1.0) * .4, mk['frase_on'] - .1)
put(sfx, boom(.4, 70) * 1.3, mk['tum'])
bell = tone(1850, 1.6, 2.6) * .6 + tone(2790, 1.6, 3.2) * .35 + tone(925, 1.6, 2.0) * .2; put(sfx, bell, mk['bell'], .9)
for e in ev:
    if e['cu']: [put(sfx, tone(1500 if k % 2 == 0 else 1100, .07, 60) * .5, e['s'] + k * .5) for k in range(int((e['e'] - e['s']) / .5))]
put(sfx, sweep(3.0, 200, 4000) * .2, mk['opt']); put(sfx, boom(1.3, 48) * 1.1, FIN); put(sfx, sweep(.7, 2000, 9000) * .3, FIN)
stems = {c: np.zeros(N, np.float32) for c in V}
for e in ev: put(stems[e['ch']], audio[e['id']], e['s'], .9 * GAIN[e['id']] ** .5)
voices = sum(stems.values()); duck = np.ones(N, np.float32)
for e in ev: duck[int(e['s'] * SR):int(e['e'] * SR)] = .4
master = voices * .95 + sfx * duck * .6; master /= max(1, np.abs(master).max() * 1.03)
with wave.open(A + '/master.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((master * 32767).astype(np.int16).tobytes())
n = int(TOTAL * FPS); vis = {}
for c, x in stems.items():
    win = SR // FPS; r = np.array([np.sqrt(np.mean(x[i*win:(i+1)*win] ** 2) + 1e-12) for i in range(n)]); pk = np.percentile(r[r > 1e-3], 95) if (r > 1e-3).any() else 1
    vis[c] = [None if r[i] < .004 else ('vA' if r[i]/pk < .12 else 'vB' if r[i]/pk < .28 else 'vC' if r[i]/pk < .48 else 'vE' if r[i]/pk < .7 else 'vD') for i in range(n)]
json.dump(dict(fps=FPS, n=n, total=TOTAL, vis=vis, events=ev, mk=mk), open(H + '/timeline_v2.json', 'w'))
print('total', TOTAL, 'frames', n, 'falas', len(ev)); print({k: round(v, 1) for k, v in mk.items()})
