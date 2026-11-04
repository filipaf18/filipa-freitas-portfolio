import json, numpy as np, re, wave, difflib, os, unicodedata, sys
H = os.path.dirname(os.path.abspath(__file__)); T = json.load(open(H + '/animatic_timeline.json')); ev = T['events']; shots = T['shots']
norm = lambda s: re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).split()
# --- ritmo ---
opc = sum(1 for _ in [])
def dur_wo_opc():
    cut = 0; 
    for s in shots:
        if s.get('opc'): cut += s['d']
    return cut
cutopc = dur_wo_opc(); tot = T['total']
spk = {}; spk2 = {}
for e in ev:
    d = e['e'] - e['s']; spk[e['ch']] = spk.get(e['ch'], 0) + d
    if not e['opc']: spk2[e['ch']] = spk2.get(e['ch'], 0) + d
gaps = [(ev[i]['id'], round(ev[i]['s'] - ev[i - 1]['e'], 2)) for i in range(1, len(ev))]
long_sil = [(a, g) for a, g in gaps if g > 2.0]
long_shots = [(i + 1, s['plan'], s['d']) for i, s in enumerate(shots) if s['d'] > 5.0]
ap_runs = []; run = 0; start = None
for e in ev:
    if e['ch'] == 'ap':
        run += e['e'] - e['s']
    else:
        if run: ap_runs.append(round(run, 1)); run = 0
# monólogos contínuos do apresentador (linhas AP consecutivas)
ap_mon = []; i = 0
while i < len(ev):
    if ev[i]['ch'] == 'ap':
        j = i; a0 = ev[i]['s']
        while j + 1 < len(ev) and ev[j + 1]['ch'] == 'ap': j += 1
        ap_mon.append((ev[i]['id'], ev[j]['id'], round(ev[j]['e'] - a0, 1))); i = j + 1
    else: i += 1
deb = [s for s in shots if s['t'] > 70 and s['t'] < tot - 30]
rep = []
rep.append(f"# RELATÓRIO DO ANIMATIC (Fase 2)\n\n**Duração total: {tot:.0f} s ({int(tot//60)}:{int(tot%60):02d})**. Das quais ≈ {cutopc:.0f} s são linhas/planos **[OPC]** → sem OPC ≈ {tot-cutopc:.0f} s ({int((tot-cutopc)//60)}:{int((tot-cutopc)%60):02d}).")
rep.append(f"\n- Planos (cortes): **{len(shots)}** no total; **{len(deb)}** na secção de debate (alvo da V3: ≥ 35 no total; V2 tinha 6). Duração média do plano: {np.mean([s['d'] for s in shots]):.1f} s · média no debate: {np.mean([s['d'] for s in deb]):.1f} s.")
rep.append(f"- Planos parados > 5 s: {long_shots if long_shots else 'nenhum'}. *(O LED com a frase dura 4 s por desenho.)*")
rep.append(f"- Silêncios entre falas > 2 s: {long_sil}. *(Os 2,0 s do «Que se lixe… para futuro» e do «Já me esqueci» são cómicos por desenho.)*")
rep.append(f"- Monólogos contínuos do apresentador (linhas seguidas): {ap_mon}. **Alvo ≤ 25 s.**")
rep.append("\n**Tempo de fala por suspeito (s)**, com / sem OPC:\n\n| Personagem | com OPC | sem OPC |\n|---|---|---|")
for c in ('cav', 'pas', 'por', 'mon', 'ap'): rep.append(f"| {c.upper()} | {spk.get(c,0):.1f} | {spk2.get(c,0):.1f} |")
# --- inteligibilidade (faster-whisper small, pt) ---
from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8'); ok = []; bad = []
SR = 44100; script = {}
lines = {}
src = open(H + '/gen_animatic.py').read()
for mt in re.finditer(r"L\('(\w+)','(\w+)',\[(.*?)\],", src): 
    segs = re.findall(r"S\((?:'((?:[^'\\]|\\.)*)'|(PHR))", mt.group(3)); lines[mt.group(1)] = ' '.join((a if a else 'Se algum dia tiver de perder umas eleições em Portugal para salvar o país, que se lixem as eleições. O que interessa é Portugal.') for a, b in segs)
res = []
for e in ev:
    x = np.load(f"{H}/audio/{e['id']}.npy"); wv = f"{H}/audio/{e['id']}_tmp.wav"
    n16 = int(len(x) * 16000 / SR); x16 = np.interp(np.linspace(0, len(x) - 1, n16), np.arange(len(x)), x).astype(np.float32)
    seg, _ = m.transcribe(x16, language='pt', beam_size=5); hyp = ' '.join(s.text for s in seg); ref = lines.get(e['id'], '')
    a, b = norm(ref), norm(hyp); sm = difflib.SequenceMatcher(None, a, b); hit = sum(bl.size for bl in sm.get_matching_blocks()); acc = hit / max(1, len(a))
    res.append((e['id'], e['ch'], acc, ref, hyp))
mean = np.mean([r[2] for r in res]); good = sum(1 for r in res if r[2] >= .98)
rep.append(f"\n## Inteligibilidade das vozes provisórias (faster-whisper «small», pt)\nMédia de palavras corretas: **{mean*100:.1f} %** · falas ≥ 98 %: **{good}/{len(res)}** (alvo da Fase 3: ≥ 98 % em cada fala).\n\n| Fala | Voz | Acerto | Texto do guião → o que o reconhecimento ouviu |\n|---|---|---|---|")
for i, c, a, ref, hyp in sorted(res, key=lambda r: r[2])[:15]: rep.append(f"| {i} | {c} | {a*100:.0f} % | {ref[:70]} → *{hyp.strip()[:70]}* |")
open(H + '/../animatic_report_raw.md', 'w').write('\n'.join(rep)); print('\n'.join(rep[:14])); print('MEAN', round(mean*100, 1), good, len(res))
