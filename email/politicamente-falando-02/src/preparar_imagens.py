"""Prepara as imagens do email a partir dos originais (em originais/) e grava-as em imagens/.

- banner.jpg (2400 × 800): o topo do convite da 1.ª sessão («POLITICAMENTE FALANDO convite»), sem o texto da carta,
  reconstruído ao dobro da resolução, com as letras vetorizadas a partir do original (ver abaixo).
- orador-eva-bras-pinho.jpg e orador-alvaro-oliveira.jpg (392 × 490, 4:5): as fotos do cartaz da 2.ª sessão, sem os
  nomes escritos por cima (os nomes vão no email como texto, legíveis no telemóvel).
- assinatura-daniela-torres.png: a assinatura do convite da 1.ª sessão, em azul e com fundo transparente
  (no original é branca sobre azul; num email de fundo branco tem de ser escura).

Uso (a partir de email/politicamente-falando-02/): python3 src/preparar_imagens.py
"""
import pathlib
import numpy as np
import potrace                       # pip install potracer
from PIL import Image, ImageChops, ImageDraw, ImageFilter

AQUI = pathlib.Path(__file__).resolve().parent.parent
ORIG, IMG = AQUI / 'originais', AQUI / 'imagens'

convite = Image.open(ORIG / 'convite-01.jpg').convert('RGB')     # 1600 × 1105
cartaz = Image.open(ORIG / 'cartaz-02.jpg').convert('RGB')       # 1024 × 1280

# ------------------------------------------------------------------ banner
# 3:1, como o banner dos 50 anos: no telemóvel o título fica maior do que com a largura toda do convite (4:1).
# «POLITICAMENTE» vai de x≈370 a x≈1230 (centrado em x≈800) e de y≈62; «convite» acaba em y≈408; o texto da carta
# começa em y≈440. Margens iguais em cima e em baixo, título ao centro.
#
# Definição: o convite original é um JPEG de 1600 px muito comprimido (contornos ondulados e com halos, laranja
# esborratado porque a compressão guarda a cor a metade da resolução) e o recorte tem só 1200 px, menos do que um ecrã de
# computador. Por isso o banner é reconstruído ao dobro (2400 × 800), como um designer redesenharia um logótipo:
# 1. a forma das letras é lida do original (ampliado 4 vezes e alisado só o suficiente para tirar o ruído da compressão);
# 2. o potrace (potracer) converte essa forma em retas e curvas: as mesmas letras, sem serrilhado;
# 3. as letras são desenhadas a 9600 px e reduzidas a 2400 px (contornos suaves e limpos);
# 4. o fundo é o do original, ampliado; debaixo das letras (e dos halos) é preenchido com as cores à volta.
# Isto vale para «POLITICAMENTE FALANDO» (branco). O «convite» (laranja, caligráfico, com traços finos e grossos) não é
# vetorizado, que o deixava grosso e irregular: a sua forma vem do BRILHO do original, que a compressão guarda à
# resolução total (só a cor fica a metade), sem cortes, e é pintado com o laranja do original — a mesma caligrafia, sem
# a franja azul que a compressão deixou à volta. Onde o «convite» toca nas letras brancas (o «t» cruza o «D» e o «O»),
# ficam os píxeis do original, tal e qual. JPEG sem subamostragem de cor.
ESCALA, TRACO, SUPER = 2, 4, 4          # saída a 2×; forma lida a 4×; desenho sobreamostrado 4× (9600 px)
recorte = convite.crop((200, 34, 1400, 434))
L0, A0 = recorte.size
L, A = L0 * ESCALA, A0 * ESCALA


def desfoca(a, sigma):
    """Desfoque gaussiano aproximado (três passagens de média móvel em cada eixo), em números reais."""
    meio = max(1, int(round((np.sqrt(12 * sigma * sigma / 3 + 1) - 1) / 2)))
    a = a.astype(np.float64)
    for eixo in (0, 1):
        for _ in range(3):
            b = np.pad(a, [(meio + 1, meio) if e == eixo else (0, 0) for e in range(a.ndim)], mode='edge')
            c = np.cumsum(b, axis=eixo)
            a = (np.take(c, range(2 * meio + 1, c.shape[eixo]), axis=eixo) - np.take(c, range(0, c.shape[eixo] - 2 * meio - 1), axis=eixo)) / (2 * meio + 1)
    return a.astype(np.float32)


def dilata(m, r):
    """Dilatação de uma máscara booleana por um quadrado de lado 2r+1 (separável)."""
    for eixo in (0, 1):
        p = np.pad(m, [(r, r) if e == eixo else (0, 0) for e in range(2)])
        m = np.logical_or.reduce([np.take(p, range(k, k + m.shape[eixo]), axis=eixo) for k in range(2 * r + 1)])
    return m


def erode(m, r):
    return ~dilata(~m, r)


# 1. forma das letras a 4×
g = np.asarray(recorte.resize((L0 * TRACO, A0 * TRACO), Image.LANCZOS)).astype(np.float32)
laranja_forma = desfoca(g[..., 0] - g[..., 2], 2.0) > 55              # laranja: vermelho muito acima do azul
branco_forma = desfoca(g.min(axis=2), 2.0) > 160                       # branco: os três canais altos
# onde o «t» do «convite» passa por cima do «O», o branco por baixo não se vê: fecha-se o branco nessa zona
fechado = erode(dilata(branco_forma, 14), 14)
branco_forma |= fechado & dilata(laranja_forma, 3)


# 2. e 3. vetorizar e desenhar sobreamostrado
def desenha(forma, turdsize):
    caminho = potrace.Bitmap(~forma).trace(turdsize=turdsize, alphamax=1.0, opticurve=True, opttolerance=0.3)
    f = ESCALA * SUPER / TRACO
    tela = Image.new('1', (L * SUPER, A * SUPER), 0)
    for curva in caminho:
        pts, atual = [], curva.start_point
        pts.append((atual.x * f, atual.y * f))
        for seg in curva.segments:
            if seg.is_corner:
                pts += [(seg.c.x * f, seg.c.y * f), (seg.end_point.x * f, seg.end_point.y * f)]
            else:
                (x0, y0), (x1, y1), (x2, y2), (x3, y3) = (atual.x, atual.y), (seg.c1.x, seg.c1.y), (seg.c2.x, seg.c2.y), (seg.end_point.x, seg.end_point.y)
                for k in range(1, 33):
                    t = k / 32
                    u = 1 - t
                    pts.append(((u**3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3) * f,
                                (u**3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3) * f))
            atual = seg.end_point
        poligono = Image.new('1', tela.size, 0)
        ImageDraw.Draw(poligono).polygon(pts, fill=1)
        tela = ImageChops.logical_xor(tela, poligono)            # par-ímpar: os buracos (O, A, P, D…) ficam vazios
    return np.asarray(tela.convert('L').resize((L, A), Image.BOX)).astype(np.float32) / 255


alfa_branco = desenha(branco_forma, 40)
LARANJA_CONVITE = np.array([225, 120, 54], np.float32)               # mediana do laranja do original
# zona do laranja (só para tirar o «convite» original do fundo)
alfa_laranja = np.asarray(Image.fromarray(laranja_forma.astype(np.uint8) * 255).resize((L, A), Image.BOX)).astype(np.float32) / 255

# 4. fundo do original, sem as letras nem os halos
grande = np.asarray(recorte.resize((L, A), Image.LANCZOS)).astype(np.float32)
letras = Image.fromarray((np.maximum(alfa_branco, alfa_laranja) > 0.02).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(15))
fora = 1 - np.asarray(letras).astype(np.float32) / 255
# convolução normalizada em várias escalas: em cada ponto usa a vizinhança mais pequena que tenha fundo suficiente
# (nos espaços estreitos e fechados, como o vértice do «M», a pequena não tem quase nenhum e daria uma mancha escura)
fundo = np.zeros_like(grande)
falta = np.ones(fora.shape, bool)
for sigma in (8, 20, 50, 120):
    peso = desfoca(fora, sigma)
    escala = np.stack([desfoca(grande[..., c] * fora, sigma) for c in range(3)], axis=2) / np.maximum(peso, 1e-6)[..., None]
    usar = falta & (peso > 0.25)
    fundo[usar] = escala[usar]
    falta &= ~usar
fundo[falta] = np.median(grande[fora > 0.5], axis=0)
transicao = desfoca(1 - fora, 2)[..., None]
fundo = grande * (1 - transicao) + fundo * transicao

final = fundo * (1 - alfa_branco[..., None]) + 255 * alfa_branco[..., None]

# 5. «convite»: opacidade pelo brilho do original (à resolução do original), ampliada sem cortes
LUMA = np.array([0.299, 0.587, 0.114], np.float32)
original = np.asarray(recorte).astype(np.float32)
brilho = original @ LUMA
brilho_laranja = float(LARANJA_CONVITE @ LUMA)
reduz = lambda a: np.asarray(Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).resize((L0, A0), Image.BOX)).astype(np.float32) / 255
brilho_fundo = np.asarray(Image.fromarray(np.clip(fundo, 0, 255).astype(np.uint8)).resize((L0, A0), Image.BOX)).astype(np.float32) @ LUMA
sobre_branco = reduz(alfa_branco)
zona = dilata(desfoca(original[..., 0] - original[..., 2], 1.0) > 15, 3)          # onde há laranja (pela cor), com margem
opac = (np.clip((brilho - brilho_fundo) / np.maximum(brilho_laranja - brilho_fundo, 20), 0, 1) * (1 - sobre_branco) +
        np.clip((255 - brilho) / (255 - brilho_laranja), 0, 1) * sobre_branco) * desfoca(zona.astype(np.float32), 1.0)
opac = np.asarray(Image.fromarray((opac * 255).astype(np.uint8)).resize((L, A), Image.LANCZOS)).astype(np.float32)[..., None] / 255
final = final * (1 - opac) + LARANJA_CONVITE * opac

# 6. onde o «convite» toca nas letras brancas: os píxeis do original, tal e qual (com uma transição suave)
zona_grande = np.asarray(Image.fromarray(zona.astype(np.uint8) * 255).resize((L, A), Image.NEAREST)) > 127
cruz = dilata(zona_grande, 4) & dilata(alfa_branco > 0.5, 12)
M = np.clip(desfoca(dilata(cruz, 4).astype(np.float32), 2.5) * 1.6, 0, 1)[..., None]
final = final * (1 - M) + np.asarray(recorte.resize((L, A), Image.LANCZOS)).astype(np.float32) * M
banner = Image.fromarray(np.clip(final + 0.5, 0, 255).astype(np.uint8))
banner.save(IMG / 'banner.jpg', quality=90, subsampling=0, optimize=True, progressive=True)
media = banner.resize((1, 1), Image.BOX).getpixel((0, 0))
print('banner.jpg', banner.size, (IMG / 'banner.jpg').stat().st_size // 1024, 'KB', 'cor média #%02X%02X%02X' % media)

# ------------------------------------------------------------------ oradores
# Recortes 4:5 por cima dos nomes (que começam em y≈975) e abaixo do «#02» (que acaba em y≈465).
ORADORES = {
    'orador-eva-bras-pinho.jpg': (74, 474, 466, 964),
    'orador-alvaro-oliveira.jpg': (526, 474, 918, 964),
}
for nome, caixa in ORADORES.items():
    foto = cartaz.crop(caixa)
    foto.save(IMG / nome, quality=86, optimize=True, progressive=True)
    print(nome, foto.size)

# ------------------------------------------------------------------ assinatura
# Branca sobre fundo azul (canal vermelho do fundo até ≈100; o traço, acima de ≈185). A opacidade sai do canal
# vermelho: o traço passa a azul.
COR = (0x0B, 0x72, 0xB8)
zona = convite.crop((250, 730, 600, 835))
alfa = zona.getchannel('R').point(lambda r: max(0, min(255, round((r - 105) * 255 / (185 - 105)))))
assinatura = Image.new('RGBA', zona.size, COR + (0,))
assinatura.putalpha(alfa)
assinatura = assinatura.crop(alfa.getbbox())
assinatura.save(IMG / 'assinatura-daniela-torres.png', optimize=True)
print('assinatura-daniela-torres.png', assinatura.size)
