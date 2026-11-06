"""Gera as distribuições dos cartões de bingo (números 1–12 numa grelha 3×4).

Regras garantidas:
  - cada cartão usa os 12 números, sem repetição;
  - nenhum par de cartões tem a mesma disposição;
  - nenhuma linha (conjunto de 4 números) se repete em dois cartões, em qualquer ordem
    -> o "Jota Rookie" nunca coincide com outro cartão pelo mesmo padrão de linha
    -> cada par de linhas (Jota Pro) também é único, porque a 3.ª linha é única.
Uso: python3 gerar_distribuicoes.py N SEMENTE saida.csv
"""
import csv, itertools, random, sys

N = int(sys.argv[1]) if len(sys.argv) > 1 else 140
SEED = int(sys.argv[2]) if len(sys.argv) > 2 else 2026
OUT = sys.argv[3] if len(sys.argv) > 3 else 'cartoes.csv'
NUMS = list(range(1, 13))

def tentar(rng):
    usados, cartoes = set(), []
    allb = [frozenset(c) for c in itertools.combinations(NUMS, 4)]
    while len(cartoes) < N:
        # procura uma partição com blocos todos por usar
        cands_a = [b for b in allb if 1 in b and b not in usados]
        rng.shuffle(cands_a)
        achou = None
        for a in cands_a:
            resto = [n for n in NUMS if n not in a]
            m = resto[0]
            cands_b = [frozenset((m,)+c) for c in itertools.combinations(resto[1:], 3)]
            rng.shuffle(cands_b)
            for b in cands_b:
                if b in usados: continue
                c = frozenset(n for n in resto if n not in b)
                if c in usados: continue
                achou = (a, b, c); break
            if achou: break
        if not achou: return cartoes
        usados.update(achou); cartoes.append(achou)
    return cartoes

rng = random.Random(SEED)
melhor = []
for t in range(400):
    r = tentar(rng)
    if len(r) > len(melhor): melhor = r
    if len(melhor) >= N: break
print('tentativas:', t + 1, '| cartões conseguidos:', len(melhor))
if len(melhor) < N: sys.exit('Não foi possível chegar a %d' % N)

cartoes = melhor[:N]
rng.shuffle(cartoes)
linhas_out = []
vistos = set()
for i, blocos in enumerate(cartoes, 1):
    blocos = list(blocos); rng.shuffle(blocos)       # ordem das linhas
    grelha = []
    for b in blocos:
        l = list(b); rng.shuffle(l); grelha.append(l)  # ordem dos números na linha
    plano = tuple(n for l in grelha for n in l)
    assert plano not in vistos; vistos.add(plano)
    linhas_out.append((i, grelha))

with open(OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['cartao'] + ['l%d_c%d' % (r, c) for r in (1,2,3) for c in (1,2,3,4)] +
               ['linha1', 'linha2', 'linha3', 'jota_pro_1_2', 'jota_pro_1_3', 'jota_pro_2_3'])
    for i, g in linhas_out:
        flat = [n for l in g for n in l]
        s = [' '.join(map(str, sorted(l))) for l in g]
        w.writerow(['%03d' % i] + flat + s + [s[0]+' | '+s[1], s[0]+' | '+s[2], s[1]+' | '+s[2]])
print('escrito', OUT)
