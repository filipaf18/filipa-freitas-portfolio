"""Monta o artefacto do sorteador: junta o modelo, os logótipos e os 140 cartões do CSV.
Uso: python3 gerar_sorteio.py"""
import csv, json, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
rows = list(csv.DictReader(open(raiz/'impressao/cartoes-bingo-140.csv', encoding='utf-8')))
cartoes = {str(int(r['cartao'])): [int(r['l%d_c%d' % (a, b)]) for a in (1,2,3) for b in (1,2,3,4)] for r in rows}
t = (raiz/'sorteio/sorteio.template.html').read_text(encoding='utf-8')
t = t.replace('/*CARDS*/{}', json.dumps(cartoes, separators=(',', ':')))
t = t.replace('__LOGO_PRETO__', (raiz/'sorteio/logo-preto.b64').read_text()).replace('__LOGO_BRANCO__', (raiz/'sorteio/logo-branco.b64').read_text())
(raiz/'sorteio/sorteio.html').write_text(t, encoding='utf-8')
print('sorteio.html:', len(t) // 1024, 'KB |', len(cartoes), 'cartões')
