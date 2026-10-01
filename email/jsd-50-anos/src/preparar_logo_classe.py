"""Logo do Classe Bar: extrai as letras douradas do JPEG original e grava um PNG com fundo realmente transparente.

O ficheiro recebido (dresscode/originais/classe-bar-logo-original.jpg) traz o axadrezado cinzento e branco
«de transparência» desenhado nos próprios píxeis. As letras são douradas (saturadas) e o axadrezado é neutro
(cinzento/branco), por isso a opacidade de cada píxel sai da saturação. Nas margens das letras usa-se a cor do
dourado da mesma coluna, para não ficar halo cinzento. Pura PIL, sem numpy.

Uso: python3 src/preparar_logo_classe.py  (a partir de email/jsd-50-anos/). Escreve dresscode/classe-bar-logo.png.
"""
import pathlib
from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent.parent
ORIGINAL = AQUI / 'dresscode' / 'originais' / 'classe-bar-logo-original.jpg'
SAIDA = AQUI / 'dresscode' / 'classe-bar-logo.png'
LARGURA_FINAL = 480            # mostrado a 240 px no email: nítido em ecrãs retina
SAT_OURO = 100                 # saturação (max-min) do dourado no interior das letras
MARGEM = 24


def main():
    im = Image.open(ORIGINAL).convert('RGB')
    w, h = im.size
    px = im.load()
    sat = lambda p: max(p) - min(p)

    # caixa das letras (amostra de 4 em 4 px)
    xs, ys = zip(*[(x, y) for y in range(0, h, 4) for x in range(0, w, 4) if sat(px[x, y]) > 60])
    x0, y0, x1, y1 = max(min(xs) - MARGEM, 0), max(min(ys) - MARGEM, 0), min(max(xs) + MARGEM, w), min(max(ys) + MARGEM, h)
    corte = im.crop((x0, y0, x1, y1))
    cw, ch = corte.size
    cp = corte.load()

    alfa = [[min(1.0, sat(cp[x, y]) / SAT_OURO) for x in range(cw)] for y in range(ch)]
    # cor do dourado por coluna (média das letras «sólidas» numa janela de ±10 colunas)
    soma = [[0, 0, 0, 0] for _ in range(cw)]
    for x in range(cw):
        for y in range(ch):
            if alfa[y][x] > 0.95:
                r, g, b = cp[x, y]
                s = soma[x]; s[0] += r; s[1] += g; s[2] += b; s[3] += 1
    cor_col = []
    for x in range(cw):
        t = [0, 0, 0, 0]
        for k in range(max(0, x - 10), min(cw, x + 11)):
            for i in range(4):
                t[i] += soma[k][i]
        cor_col.append(tuple(round(t[i] / t[3]) for i in range(3)) if t[3] else None)
    # colunas sem letras: herdam a cor da coluna mais próxima com dourado
    ultima = next(c for c in cor_col if c)
    for x in range(cw):
        if cor_col[x]: ultima = cor_col[x]
        else: cor_col[x] = ultima

    out = Image.new('RGBA', (cw, ch))
    op = out.load()
    for y in range(ch):
        for x in range(cw):
            a = alfa[y][x]
            if a < 0.06:
                op[x, y] = (0, 0, 0, 0)                                  # ruído do axadrezado
            else:
                r, g, b = cp[x, y] if a > 0.95 else cor_col[x]
                op[x, y] = (r, g, b, round(a * 255))
    altura = round(ch * LARGURA_FINAL / cw)
    out = out.resize((LARGURA_FINAL, altura), Image.LANCZOS)
    out = out.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    out.save(SAIDA, optimize=True)
    print(SAIDA.name, out.size, SAIDA.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
