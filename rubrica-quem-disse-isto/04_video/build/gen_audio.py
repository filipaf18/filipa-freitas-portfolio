import asyncio, subprocess, json, os, wave, struct, math
A = os.path.join(os.path.dirname(__file__), '..', 'audio'); os.makedirs(A, exist_ok=True)
# personagem: (voz, rate, pitch_edge, rubberband pitch, formante)  -> timbres ORIGINAIS de desenho animado
V = {
 'ap':  dict(voz='pt-PT-DuarteNeural', rate='+14%', pitch='+3Hz',  rb=1.12, fm=1.10),
 'cav': dict(voz='pt-PT-DuarteNeural', rate='-24%', pitch='-6Hz',  rb=0.86, fm=0.90),
 'pas': dict(voz='pt-PT-DuarteNeural', rate='-12%', pitch='-3Hz',  rb=0.93, fm=0.96),
 'por': dict(voz='pt-PT-DuarteNeural', rate='+22%', pitch='+4Hz',  rb=1.07, fm=1.06),
 'mon': dict(voz='pt-PT-DuarteNeural', rate='+0%',  pitch='+0Hz',  rb=1.00, fm=1.00),
}
# (id, personagem, texto, overrides) — pausas com vírgulas/reticências
L = [
 ('ap1','ap','Boa noite, Famalicão! Esta noite, uma frase. Quatro suspeitos. E ninguém se lembra de nada. Senhores, a frase!',{}),
 ('ap2','ap','Primeiro suspeito, a sua defesa.',{}),
 ('cav','cav','Ora… convém, antes de mais, esclarecer a pergunta. Eu? Não. Não disse. E peço que me deixem terminar.',{}),
 ('pas','pas','Com calma. Nem me lembro desta frase. Mas se me perguntam se a disse… não. Digo-o com toda a tranquilidade.',{}),
 ('por','por','Senhor apresentador, a minha defesa já estava preparada: não disse, não ia dizer e, tecnicamente, estava a meio de uma subordinada! Está tudo aqui nos papéis!',{}),
 ('mon1','mon','Calma, calma, deixem-me só dizer. Vamos pôr ordem nisto.',{}),
 ('mon2','mon','Eu não disse. Ponto. Agora, quem é que disse isto?!',{'rate':'+30%','pitch':'+6Hz','rb':1.06}),
 ('x_cav','cav','Eu não disse!',{}), ('x_pas','pas','Não fui eu.',{}), ('x_por','por','Nem pensar!',{}), ('x_mon','mon','Ponto!',{'rate':'+30%'}),
 ('ap3','ap','Ordem! Ordem! A sala decide. Quem é que disse isto? Votem no Kahoot!',{}),
]
PIPER='/tmp/claude-0/-home-user-filipa-freitas-portfolio/4de4662f-09eb-5fea-9c5e-f939f393f88c/scratchpad/piper/v.onnx'
def rate_to_ls(r): return 1/(1+int(r.replace('%',''))/100)
async def tts(i, ch, txt, ov):
    p = {**V[ch], **ov}
    raw = f'{A}/{i}_raw.wav'
    subprocess.run(['python','-m','piper','-m',PIPER,'-f',raw,'--length-scale',f"{rate_to_ls(p['rate']):.3f}",'--noise-scale','0.6'],input=txt.encode(),check=True,capture_output=True)
    wav = f'{A}/{i}.wav'
    af = f"rubberband=pitch={p['rb']}:formant=preserved,aresample=44100,highpass=f=90,acompressor=threshold=-20dB:ratio=3,loudnorm=I=-16:TP=-1.5"
    if abs(p['fm']-1) > 0.005:
        af = f"asetrate=22050*{p['fm']},aresample=44100,atempo={1/p['fm']:.4f}," + af
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',raw,'-ac','1','-af',af,'-ar','44100',wav], check=True)
    out = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',wav],capture_output=True,text=True).stdout
    return i, ch, float(out)
async def main():
    res = await asyncio.gather(*[tts(*x) for x in L])
    json.dump({i:{'ch':ch,'dur':d} for i,ch,d in res}, open(f'{A}/duracoes.json','w'), indent=1)
    print({i:round(d,2) for i,_,d in res})
asyncio.run(main())
