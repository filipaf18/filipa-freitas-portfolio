"""Prepara as imagens do email a partir dos originais (em originais/) e grava-as em imagens/.

- banner.jpg (1200 × 400): o topo do convite da 1.ª sessão («POLITICAMENTE FALANDO convite»), sem o texto da carta.
- orador-eva-bras-pinho.jpg e orador-alvaro-oliveira.jpg (392 × 490, 4:5): as fotos do cartaz da 2.ª sessão, sem os
  nomes escritos por cima (os nomes vão no email como texto, legíveis no telemóvel).
- assinatura-daniela-torres.png: a assinatura do convite da 1.ª sessão, em azul e com fundo transparente
  (no original é branca sobre azul; num email de fundo branco tem de ser escura).

Uso (a partir de email/politicamente-falando-02/): python3 src/preparar_imagens.py
"""
import pathlib
from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent.parent
ORIG, IMG = AQUI / 'originais', AQUI / 'imagens'

convite = Image.open(ORIG / 'convite-01.jpg').convert('RGB')     # 1600 × 1105
cartaz = Image.open(ORIG / 'cartaz-02.jpg').convert('RGB')       # 1024 × 1280

# ------------------------------------------------------------------ banner
# 3:1, como o banner dos 50 anos: no telemóvel o título fica maior do que com a largura toda do convite (4:1).
# «POLITICAMENTE» vai de x≈370 a x≈1230 (centrado em x≈800) e de y≈62; «convite» acaba em y≈408; o texto da carta
# começa em y≈440. Margens iguais em cima e em baixo, título ao centro.
banner = convite.crop((200, 34, 1400, 434))
banner.save(IMG / 'banner.jpg', quality=84, optimize=True, progressive=True)
media = banner.resize((1, 1), Image.BOX).getpixel((0, 0))
print('banner.jpg', banner.size, 'cor média #%02X%02X%02X' % media)

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
