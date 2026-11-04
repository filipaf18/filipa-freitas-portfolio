# Gera 2 tomadas por fala na Fish Audio (referências da cadeia), escolhe a mais inteligível com o faster-whisper.
import os, sys, re, json, time, subprocess, unicodedata, difflib, urllib.request, urllib.error, msgpack, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import script_final as S
H = os.path.dirname(os.path.abspath(__file__)); A = H + '/audio'; K = os.environ['FK']
REFTXT = "Isso é um insulto! Eu consigo dizer uma frase sem reunião! Ouçam: Que se… Antes de dizer, proponho uma reunião para decidir se digo!"
REF = {'ap': 'C', 'cav': 'A', 'pas': 'F', 'por': 'B', 'mon': 'D'}
refbytes = {c: open(f'/tmp/fish/chain/ref_{v}.wav', 'rb').read() for c, v in REF.items()}
def synth(l, take):
    out = f"{A}/{l['id']}_t{take}.mp3"
    if os.path.exists(out) and os.path.getsize(out) > 2000: return out
    body = {'text': l['text'], 'format': 'mp3', 'references': [{'audio': refbytes[l['ch']], 'text': REFTXT}], 'prosody': {'speed': l['speed'], 'volume': 0}}
    if take == 2: body.update({'temperature': 0.9, 'top_p': 0.9})
    for att in range(4):
        try:
            r = urllib.request.Request('https://api.fish.audio/v1/tts', data=msgpack.packb(body), headers={'Authorization': 'Bearer ' + K, 'Content-Type': 'application/msgpack', 'model': 's2.1-pro-free'})
            open(out, 'wb').write(urllib.request.urlopen(r, timeout=180).read()); return out
        except Exception as e: time.sleep(3 * (att + 1))
    return None
T = [int(x) for x in os.environ.get('TAKES','1').split(',')]
jobs = [(l, t) for l in S.L if l['ch'] for t in T]
with cf.ThreadPoolExecutor(int(os.environ.get('NT','8'))) as ex: res = list(ex.map(lambda j: synth(*j), jobs))
print('geradas', sum(1 for r in res if r), '/', len(jobs))
