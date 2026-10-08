"""Prepara as imagens do email a partir dos originais (em originais/) e grava-as em imagens/.

- banner.jpg (2400 × 800): o topo do convite da 1.ª sessão («POLITICAMENTE FALANDO convite»), sem o texto da carta,
  reconstruído ao dobro da resolução com as letras redesenhadas nítidas (ver abaixo).
- orador-eva-bras-pinho.jpg e orador-alvaro-oliveira.jpg (392 × 490, 4:5): as fotos do cartaz da 2.ª sessão, sem os
  nomes escritos por cima (os nomes vão no email como texto, legíveis no telemóvel).
- assinatura-daniela-torres.png: a assinatura do convite da 1.ª sessão, em azul e com fundo transparente
  (no original é branca sobre azul; num email de fundo branco tem de ser escura).

Uso (a partir de email/politicamente-falando-02/): python3 src/preparar_imagens.py
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter

AQUI = pathlib.Path(__file__).resolve().parent.parent
ORIG, IMG = AQUI / 'originais', AQUI / 'imagens'

convite = Image.open(ORIG / 'convite-01.jpg').convert('RGB')     # 1600 × 1105
cartaz = Image.open(ORIG / 'cartaz-02.jpg').convert('RGB')       # 1024 × 1280

# ------------------------------------------------------------------ banner
# 3:1, como o banner dos 50 anos: no telemóvel o título fica maior do que com a largura toda do convite (4:1).
# «POLITICAMENTE» vai de x≈370 a x≈1230 (centrado em x≈800) e de y≈62; «convite» acaba em y≈408; o texto da carta
# começa em y≈440. Margens iguais em cima e em baixo, título ao centro.
#
# Definição: o convite original é um JPEG de 1600 px muito comprimido (halos à volta das letras, laranja esborratado
# porque a compressão guarda a cor a metade da resolução) e o recorte tem só 1200 px, menos do que um ecrã de computador.
# Por isso o banner é reconstruído ao dobro (2400 × 800): o fundo é ampliado e, debaixo das letras, preenchido com as
# cores à volta; «POLITICAMENTE FALANDO» (branco) e «convite» (laranja) são redesenhados com contornos nítidos, a partir
# da forma das letras do original (ampliada e cortada no meio da transição letra/fundo). JPEG sem subamostragem de cor.
ESCALA = 2
recorte = convite.crop((200, 34, 1400, 434))
L, A = recorte.size[0] * ESCALA, recorte.size[1] * ESCALA
grande = np.asarray(recorte.resize((L, A), Image.LANCZOS)).astype(np.float32)


def degrau(x, centro, largura):
    """0 → 1 numa transição de «largura» níveis à volta de «centro» (contorno nítido, mas sem serrilhado)."""
    return np.clip((x - centro) / largura + 0.5, 0, 1)


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


minimo = grande.min(axis=2)                       # branco: os três canais altos; fundo azul e laranja: pelo menos um baixo
alfa_branco = degrau(minimo, 160, 40)

# laranja: vermelho muito acima do azul. Os traços do «convite» são finos e a compressão esborratou-os, por isso o
# canal é alisado antes do corte e a transição é mais suave do que a das letras brancas (senão os traços ficam irregulares)
alfa_laranja = degrau(desfoca(grande[..., 0] - grande[..., 2], 1.3), 50, 70)
alfa_branco *= 1 - alfa_laranja
LARANJA_CONVITE = np.array([225, 120, 54], np.float32)               # mediana do laranja do original

# fundo sem letras: as zonas das letras (alargadas, para levar também os halos) são preenchidas com a média das cores à
# volta (convolução normalizada: desfocar a imagem sem as letras e dividir pelo desfoque da máscara)
letras = Image.fromarray((np.maximum(alfa_branco, alfa_laranja) > 0.02).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(15))
fora = 1 - np.asarray(letras).astype(np.float32) / 255


peso = desfoca(fora, 28)
fundo = np.stack([desfoca(grande[..., c] * fora, 28) / np.maximum(peso, 1e-3) for c in range(3)], axis=2)
transicao = desfoca(1 - fora, 2)[..., None]
fundo = grande * (1 - transicao) + fundo * transicao

final = fundo * (1 - alfa_branco[..., None]) + 255 * alfa_branco[..., None]
final = final * (1 - alfa_laranja[..., None]) + LARANJA_CONVITE * alfa_laranja[..., None]
banner = Image.fromarray(np.clip(final + 0.5, 0, 255).astype(np.uint8))
banner.save(IMG / 'banner.jpg', quality=88, subsampling=0, optimize=True, progressive=True)
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
