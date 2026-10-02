"""Imagens de prova dos alinhamentos: o email tal como o Gmail o mostra depois de colado (sem <head>), no
computador (1400 px) e no telemóvel (390 px), com o eixo da página a magenta e as margens da coluna de texto a
azul. Mostra três zonas: cabeçalho («CONVITE» e traço), dados + botão, e rodapé com o logo.

Uso (a partir de email/jsd-50-anos/):  python3 src/imagens_alinhamento.py [ficheiro.html ...]
Grava alinhamentos-<ficheiro>.png ao lado do HTML.
"""
import sys
from PIL import Image, ImageDraw, ImageFont
from verificar_alinhamento import *

FONTE = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
ESC = 2


def zonas(d):
    """(topo, fundo) em px CSS das três zonas."""
    barras = sorted(d['barras'], key=lambda x: x['box']['t'])
    fil = sorted(d['filetes'], key=lambda x: x['box']['t'])
    tds = sorted([t for t in d['tds'] if t['unico']], key=lambda t: t['box']['t'])
    nota = max((t for t in tds if t['box']['b'] < barras[-1]['box']['t']), key=lambda t: t['box']['b'])
    return [(barras[0]['box']['b'], barras[0]['box']['b'] + 150),
            (fil[0]['box']['t'] - 14, nota['box']['b'] + 6),
            (barras[-1]['box']['t'] - 6, d['scrollH'])]


def desenhar(f, w, recorte_x=None):
    html = sem_head((AQUI / f).read_text(encoding='utf-8'))
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=EXE, args=['--no-sandbox'])
        pg = b.new_context(device_scale_factor=ESC, viewport={'width': w, 'height': 900}).new_page()
        imagens_locais(pg)
        d, img = medir(pg, html, w)
        d['scrollH'] = pg.evaluate('document.documentElement.scrollHeight')
        b.close()
    im = Image.fromarray(img).convert('RGB')
    dr = ImageDraw.Draw(im)
    W = d['W']
    fil = d['filetes'][0]['box']
    for x, cor in [(W / 2, (255, 0, 200)), (fil['l'], (0, 150, 255)), (fil['r'], (0, 150, 255))]:
        dr.line([(x * ESC, 0), (x * ESC, im.size[1])], fill=cor, width=2)
    partes = []
    for t, b_ in zonas(d):
        c = im.crop((0, int(t * ESC), im.size[0], int(b_ * ESC)))
        if recorte_x:
            c = c.crop((int(recorte_x[0] * ESC), 0, int(recorte_x[1] * ESC), c.size[1]))
        partes.append(c)
    return partes


def compor(partes, titulo):
    fonte = ImageFont.truetype(FONTE, 30)
    larg = max(p.size[0] for p in partes)
    alt = sum(p.size[1] for p in partes) + 16 * (len(partes) - 1) + 56
    tela = Image.new('RGB', (larg, alt), (233, 228, 220))
    ImageDraw.Draw(tela).text((12, 10), titulo, fill=(27, 19, 12), font=fonte)
    y = 56
    for p in partes:
        tela.paste(p, (0, y))
        y += p.size[1] + 16
    return tela


def main(argv):
    for f in argv or PADRAO:
        pc = compor(desenhar(f, 1400, (350, 1050)), 'Computador (1400 px)  |  magenta = eixo da página')
        tel = compor(desenhar(f, 390), 'Telemóvel (390 px)')
        tela = Image.new('RGB', (pc.size[0] + 24 + tel.size[0], max(pc.size[1], tel.size[1])), (233, 228, 220))
        tela.paste(pc, (0, 0))
        tela.paste(tel, (pc.size[0] + 24, 0))
        saida = AQUI / f'alinhamentos-{f[:2]}.png'
        tela.save(saida, optimize=True)
        print(saida.name, tela.size)


if __name__ == '__main__':
    main(sys.argv[1:])
