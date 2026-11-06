"""Valida o CSV dos cartões. Uso: python3 validar_cartoes.py cartoes.csv"""
import csv, sys, itertools
rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8')))
erros = []
ids = [r['cartao'] for r in rows]
if ids != ['%03d' % i for i in range(1, len(rows) + 1)]: erros.append('numeração não é sequencial 001..N')
cartoes, linhas_set, linhas_ord, pares = {}, {}, {}, {}
for r in rows:
    nums = [int(r['l%d_c%d' % (a, b)]) for a in (1,2,3) for b in (1,2,3,4)]
    if sorted(nums) != list(range(1, 13)): erros.append('cartão %s não tem 1..12 sem repetição' % r['cartao'])
    cartoes.setdefault(tuple(nums), []).append(r['cartao'])
    ls = [nums[0:4], nums[4:8], nums[8:12]]
    for l in ls:
        linhas_set.setdefault(frozenset(l), []).append(r['cartao'])
        linhas_ord.setdefault(tuple(l), []).append(r['cartao'])
    for a, b in itertools.combinations(range(3), 2):
        pares.setdefault(frozenset(ls[a]) | frozenset(ls[b]), []).append(r['cartao'])
for nome, d in (('disposição completa', cartoes), ('linha (conjunto de 4)', linhas_set), ('linha (ordem)', linhas_ord), ('par de linhas (Jota Pro)', pares)):
    rep = {k: v for k, v in d.items() if len(v) > 1}
    print('%-26s únicos: %4d | repetidos: %d' % (nome, len(d), len(rep)))
    if rep: erros.append('%s repetida(o): %s' % (nome, list(rep.values())[:3]))
print('cartões:', len(rows), '|', 'OK' if not erros else 'ERROS: ' + '; '.join(erros))
sys.exit(1 if erros else 0)
