# V3 · Fase 2 · animatic: vozes provisórias (Piper), SFX mínimos, linha do tempo real e lista de planos.
import subprocess, json, os, wave, numpy as np
H = os.path.dirname(os.path.abspath(__file__)); A = H + '/audio'; SR = 44100
PD = '/tmp/claude-0/-home-user-filipa-freitas-portfolio/4de4662f-09eb-5fea-9c5e-f939f393f88c/scratchpad/piper/'
V = {'ap': dict(m='dii_pt-PT.onnx', rate=10, rb=1.00, fm=1.10), 'cav': dict(m='miro_pt-PT.onnx', rate=-22, rb=0.90, fm=0.88),
     'pas': dict(m='tuga-tts-train-synthetic-voice4.onnx', rate=-16, rb=0.97, fm=0.95), 'por': dict(m='tuga-tts-train-synthetic-voice3.onnx', rate=24, rb=0.90, fm=1.02),
     'mon': dict(m='v.onnx', rate=4, rb=0.80, fm=1.0)}
NAME = {'ap': 'apresentador', 'cav': 'cavaco', 'pas': 'passos', 'por': 'portas', 'mon': 'montenegro'}
S = lambda t, p=.2, r=0, g=1.0: (t, p, r, g)
items = []
def L(i, ch, segs, gap=.4, plan=None, react=(), opc=False, sfx=()): items.append(dict(k='line', id=i, ch=ch, segs=segs, gap=gap, plan=plan or ('MP:ap' if ch == 'ap' else 'PM:' + ch), react=list(react), opc=opc, sfx=list(sfx)))
def C(kind, dur, gap=0.0, text=''): items.append(dict(k='card', card=kind, dur=dur, gap=gap, text=text))
PHR = 'Se algum dia tiver de perder umas eleições em Portugal para salvar o país, que se lixem as eleições. O que interessa é Portugal.'
# ---------- ATO 1 ----------
L('a1','ap',[S('As declarações são reais. Os debates são imaginários.',.5,-6)],.5,'PG')
L('a2','ap',[S('O bar aberto, felizmente, também é real.',.1,-4)],.5,'MP:ap',[('PM:pas',{'passos':'neutro'},1.0)])
C('TITLE',3.0,.4)
L('a3','ap',[S('Boa noite, Famalicão. Quatro convidados, uma frase…',.4,0),S('e nenhum responsável.',.1,-10)],.2,'PG',[('PM:cav',{'cavaco':'calase'},.5),('PM:pas',{'passos':'neutro'},.5),('PM:por',{'portas':'ironico'},.5),('PM:mon',{'montenegro':'neutro'},.5)])
L('a4','ap',[S('A frase é a seguinte.',.1,-8)],.3,'MP:ap')
L('a5','ap',[S(PHR,.1,-12)],.3,'LED',[('PM:cav',{'cavaco':'calase'},.6),('PM:por',{'portas':'ironico'},.6),('PM:mon',{'montenegro':'neutro'},.6),('PM:pas',{'passos':'neutro'},.6)])
L('a6','ap',[S('Dita em voz alta, tem uma certa dignidade.',.7,-4),S('Tem só um defeito: ninguém assinou.',.1,-8)],.5,'MP:ap',[('PG',{},.8)])
L('a7','ap',[S('Reparem. “Umas” eleições. Como quem perde umas meias.',.6,-6),S('Que, ao menos, reaparecem na máquina de lavar.',.1,-4)],.6,'MP:ap',[('PM:por',{'portas':'ironico'},1.0)])
L('a7b','pas',[S('Espuma dos dias.',.1,-14)],.5)
L('a8','ap',[S('E depois o verbo. “Lixar.” Um verbo com grande tradição política…',.7,-4),S('mas habitualmente usado em privado.',.1,-10)],.6,'MP:ap',[('PM:cav',{'cavaco':'calase'},1.0)])
L('a8b','cav',[S('Convém dizer “prescindir”.',.1,-6)],.4)
L('a8c','ap',[S('Anotado.',.1,-4)],.3,'MP:ap')
L('a9','ap',[S('Regra da noite: sempre que alguém disser “Portugal”, toco a campainha.',.1,0)],.5,'MP:ap')
L('a9b','por',[S('Respeito, mas discordo.',.1,0)],-.1)
L('a9c','ap',[S('Ainda não acabei.',.1,-4)],.3,'MP:ap')
L('a9d','ap',[S('Pelo bem de Portugal.',.2,-4),S('Perdão. É um risco profissional.',.1,-6)],.4,'MP:ap',[('PG',{},.8)],sfx=[('ding_after',0)])
# ---------- ATO 2 · R1 ----------
L('b1','ap',[S('Começamos pelo professor Cavaco Silva.')],.8,'MP:ap')
L('b2','cav',[S('Deixe-me terminar.',.1,-4)],.2)
L('b3','ap',[S('Ainda não começou.',.1,-4)],.35,'2S:ap+cav',[('PM:cav',{'cavaco':'calase'},.6)])
L('b4','cav',[S('Então deixe-me começar.',.5),S('Para depois terminar.',.1,-6)],.3)
L('b5','cav',[S('Não fui eu. Dedico cinco minutos de manhã e cinco minutos à tarde a ler os jornais.',.5,-4),S('A frase saiu ao meio-dia.',.1,-8)],.6,react=[('PM:por',{'portas':'ironico'},1.0)])
L('b6','ap',[S('Um álibi com horário.',.1,-4)],.3,'MP:ap')
L('b7','por',[S('Objeção!',.1,8,1.3)],-.2)
L('b8','ap',[S('Ainda ninguém o acusou.',.1,-4)],.3,'MP:ap')
L('b9','por',[S('Prefiro chegar cedo. Tenho aqui a minha defesa.',.2,0),S('Tem três anexos. O terceiro é um pedido de desculpas…',.5,0),S('para o caso de ser necessário.',.1,-6)],.3,react=[('PG',{'montenegro':'surpresa','passos':'calase'},1.0)],sfx=[('tum_after_seg',0)])
L('b12','ap',[S('Senhor Montenegro, vai evitar a palavra proibida?',.1)],.5,'MP:ap')
L('b13','mon',[S('Não é não.',.1,-4)],.3)
L('b14','ap',[S('Não é não o quê?',.1)],.3,'MP:ap')
L('b15','mon',[S('Não é… proponho uma reunião de trabalho. Com agenda. E ata.',.3,4),S('Para o bem de Portugal.',.1,8)],.2,react=[('PM:mon',{'montenegro':'calase'},.8)],sfx=[('ding_after',1)])
L('b16','mon',[S('Isso não conta. Foi figura de estilo.',.1,0)],.3)
L('b17','ap',[S('Foi figura de campainha. A reunião é agora.',.3),S('Chama-se debate.',.1,-8)],.5,'MP:ap',[('PM:mon',{'montenegro':'surpresa'},.8)])
L('b18','pas',[S('Eu só queria dizer uma coisa.',.1,-8)],.8,react=[('PG',{},2.0)])
L('b19','pas',[S('Já me esqueci.',.1,-12)],.4,react=[('PG',{},.8)])
L('b20','ap',[S('É a intervenção mais curta da noite.',.3),S('E a mais honesta.',.1,-10)],.3,'MP:ap',[('PM:pas',{'passos':'neutro'},.8)])
# ---------- R2 ----------
L('c1','pas',[S('Eu acho que foi o Montenegro.',.1,-8)],.8)
L('c2','mon',[S('Porquê?!',.1,0,1.2)],.15)
L('c3','pas',[S('Porque se levantou primeiro.',.1,-12)],.4)
L('c4','mon',[S('Mas eu ainda estou sentado!',.1,12,1.2)],.2)
L('c5','pas',[S('É o que um culpado diria.',.1,-14)],.5,react=[('PG',{'montenegro':'surpresa'},.8)])
L('c6','mon',[S('Agora estou de pé!',.1,14,1.3),S('E não fui eu!',.1,16,1.3)],.3)
L('c7','mon',[S('Tenho de me rir de si.',.1,0)],.4,'PM:mon')
L('c8','cav',[S('Não está a respeitar o uso da palavra.',.1,-4)],.2)
L('c11','mon',[S('Ah ah ah ah ah ah!',.1,20)],.2,'PM:mon')
L('c12','pas',[S('Isso fica para futuro.',.1,-14)],.5)
L('c12b','por',[S('Foi o professor. Só ele diria “conjuntivo”.',.1,0)],.4)
L('c13','cav',[S('Tenho muito pouco apetite para utilizar a bomba atómica.',.1,-6)],.5)
L('c14','ap',[S('Tem uma bomba atómica?',.1,-4)],.3,'MP:ap')
L('c15','cav',[S('Tenho a gramática.',.1,-8)],.3)
L('c16','por',[S('Respeito, mas discordo da gramática.',.1,0)],.5)
# ---------- R3 · colapso ----------
L('d1','por',[S('Peço a palavra!',.1,30,1.2)],.5,'PG')
L('d2','cav',[S('Em nome de Portugal, deixem-me terminar!',.1,0,1.3)],-.3,sfx=[('ding_after',1)])
L('d3','por',[S('Por Portugal, objeção!',.1,26,1.3)],-.3,sfx=[('ding_after',1)])
C('SFXBURST',1.6,-.2,'campainha sem parar')
L('d5','cav',[S('Que se lixem os jornais.',.1,-18,0.8)],.7,react=[('PM:cav',{'cavaco':'surpresa'},.6)])
L('d6','por',[S('Que se lixem os anexos!',.1,20,1.3)],.2,sfx=[('tum_after_seg',0)])
L('d7','mon',[S('Que se lixem as reuniões!',.1,20,1.3)],.2)
L('d8','pas',[S('Que se lixe.',.6,-20),S('Para futuro.',.1,-20)],2.0,react=[('PG',{},1.0)])
# ---------- remate ----------
L('e1','ap',[S('Quatro suspeitos. Quatro verbos. E nenhuma assinatura.',.3,-8)],.9,'MP:ap')
L('e2','ap',[S('Ao fim de dez minutos de debate, ninguém perdeu umas eleições.',.7,-6),S('Já é um progresso.',.1,-10)],.6,'MP:ap')
L('e3','pas',[S('Portugal.',.1,-14)],.9,sfx=[('ding_after',1)])
L('e4','ap',[S('Estava a ver que não dizia.',.1,-4)],.4,'MP:ap')
L('e5','cav',[S('Posso terminar?',.1,-6)],.5)
L('e6','ap',[S('Não.',.1,0,1.1)],.1,'MP:ap')
# ---------- votação ----------
L('f1','ap',[S('A decisão está nas vossas mãos.',.4,-8),S('Quem disse isto?',.1,-12)],.8,'MP:ap')
L('f2','ap',[S('Cavaco Silva. Garante que não foi. Já leu os jornais para provar.',.1,-6)],.4,'CU:cav')
L('f2t','cav',[S('Não fui eu.',.1,-4)],.3,'CU:cav')
L('f3','ap',[S('Passos Coelho. Garante que não foi. E já se esqueceu do resto.',.1,-6)],.4,'CU:pas')
L('f3t','pas',[S('Não fui eu.',.1,-4)],.3,'CU:pas')
L('f4','ap',[S('Paulo Portas. Garante que não foi. A inocência é irrevogável. Em princípio.',.1,-6)],.4,'CU:por')
L('f4t','por',[S('Não fui eu.',.1,-4)],.3,'CU:por')
L('f5','ap',[S('Luís Montenegro. Garante que não foi. Está de pé por precaução.',.1,-6)],.5,'CU:mon')
L('f5t','mon',[S('Não é não.',.1,-4)],.3,'CU:mon')
C('OPTIONS',2.0,.2)
L('f6','ap',[S('Votem no Kahoot. E lembrem-se: o que interessa é Portugal.',.3,0),S('Perdão.',.5,-6),S('As eleições… essas, que se lixem. Só esta noite.',.4,-6),S('O bar, esse, continua aberto.',.1,-6)],.2,'MP:ap',sfx=[('ding_after',0)])
C('FINAL',3.0,.5)
SIL = ',silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05,areverse'
def synth(i, ch, segs):
    parts = []
    for n, (txt, pa, r, g) in enumerate(segs):
        p = V[ch]; raw = f'{A}/{i}_{n}_raw.wav'; out = f'{A}/{i}_{n}.wav'
        subprocess.run(['python','-m','piper','-m',PD+p['m'],'-f',raw,'--length-scale',f"{1/(1+(p['rate']+r+14)/100):.3f}",'--noise-scale','0.7','--noise-w','0.9'],input=txt.encode(),check=True,capture_output=True)
        af = f"rubberband=pitch={p['rb']}:formant=preserved,aresample=44100,highpass=f=90,acompressor=threshold=-20dB:ratio=3"
        if abs(p['fm']-1) > .005: af = f"asetrate=22050*{p['fm']},aresample=44100,atempo={1/p['fm']:.4f}," + af
        subprocess.run(['ffmpeg','-loglevel','error','-y','-i',raw,'-ac','1','-af',af+SIL,'-ar','44100',out],check=True)
        w = wave.open(out); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; parts.append((x * g, pa * .7))
    return np.concatenate([np.concatenate([x, np.zeros(int(pp * SR), np.float32)]) for x, pp in parts])[:-int(parts[-1][1] * SR)]
audio = {}
for it in items:
    if it['k'] != 'line': continue
    f = f"{A}/{it['id']}.npy"
    if not os.path.exists(f): np.save(f, synth(it['id'], it['ch'], it['segs']))
    audio[it['id']] = np.load(f)
# ---------- linha do tempo + planos ----------
shots = []; ev = []; sfxt = []; cur = 0.0; mon_up = False
def shot(t, plan, expr=None, spk=None, text='', card=None, opc=False): shots.append(dict(t=round(t, 3), plan=plan, expr=expr or {}, spk=spk, text=text, card=card, opc=opc))
for it in items:
    if it['k'] == 'card':
        t = cur + it['gap']; shot(t, it['card'], text=it.get('text', ''), card=it['card']); cur = t + it['dur']
        for sh in it.get('after', []): shot(cur, sh[0], sh[1]); cur += sh[2]
        if it['card'] == 'SFXBURST': sfxt += [('ding', t + .15 * k) for k in range(10)]
        continue
    a = audio[it['id']]; d = len(a) / SR; t = cur + it['gap']; ev.append(dict(id=it['id'], ch=it['ch'], s=round(t, 3), e=round(t + d, 3), opc=it['opc']))
    ex = {}; shot(t, it['plan'], ex, it['ch'], ' '.join(s[0] for s in it['segs']), opc=it['opc'])
    end = t + d; cur = end
    for sx in it['sfx']:
        if sx[0] == 'ding_after': sfxt.append(('ding', end + .05))
        if sx[0] == 'tum_after_seg':
            n0 = int(sum(len(x) for x in [a])*0)  # posição do primeiro segmento
            sfxt.append(('tum', t + 0.55 * d if sx[1] == 0 else end))
    for r in it['react']: shot(cur, r[0], r[1], None, '', opc=it['opc']); cur += r[2]
N = int((cur + 1.0) * SR); buf = np.zeros(N, np.float32); rng = np.random.default_rng(3)
buf += (rng.standard_normal(N) * .002).astype(np.float32)                      # room tone provisório (~−54 dB), evita silêncio digital
for e in ev: s = int(e['s'] * SR); x = audio[e['id']]; buf[s:s + len(x)] += x[:N - s] * .9
def tone(f, d, dec=6): t = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * t) * np.exp(-t * dec)
for k, t in sfxt:
    x = (tone(1850, 1.2, 3) * .5 + tone(2790, 1.2, 3.4) * .3) if k == 'ding' else (np.sin(2 * np.pi * (60 + 80 * np.exp(-np.arange(int(.4*SR)) / SR * 14)) * np.arange(int(.4*SR)) / SR) * np.exp(-np.arange(int(.4*SR)) / SR * 6)) * 1.2
    s = int(t * SR); buf[s:s + len(x)] += x[:N - s] * .5
buf /= max(1, np.abs(buf).max() * 1.03)
with wave.open(A + '/animatic_mix.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf * 32767).astype(np.int16).tobytes())
shots.sort(key=lambda s: s['t']); total = round(cur + 1.0, 2)
for i, s in enumerate(shots): s['d'] = round((shots[i + 1]['t'] if i + 1 < len(shots) else total) - s['t'], 3)
json.dump(dict(total=total, shots=shots, events=ev), open(H + '/animatic_timeline.json', 'w'), ensure_ascii=False)
print('total', total, 'planos', len(shots), 'falas', len(ev))
