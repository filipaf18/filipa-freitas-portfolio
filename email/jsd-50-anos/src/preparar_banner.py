"""Prepara o banner das versões finais (banner-jantar.jpg) a partir do original (banner-jantar-original.jpg).

1. Largura de 1200 px e recorte para 3:1 (1200 × 400), centrado na vertical no bloco de texto branco
   («JANTAR COMEMORATIVO / 50 ANOS / JSD FAMALICÃO»). No computador o banner mede no máximo 1040 × 347 px
   (a largura da coluna de texto); no telemóvel ocupa a largura do ecrã. Se o original já for 3:1, não corta.
2. JPEG progressivo com a maior qualidade que fica abaixo de 44 KB. O banner vai embutido em base64 (+33 %)
   e o email tem de ficar abaixo dos 102 KB, a partir dos quais o Gmail corta a mensagem.

Uso: python3 src/preparar_banner.py  (a partir de email/jsd-50-anos/)
"""
import io, pathlib
import numpy as np
from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent.parent
LARGURA, PROPORCAO, LIMITE = 1200, 3, 44 * 1024

im = Image.open(AQUI / 'banner-jantar-original.jpg').convert('RGB')
im = im.resize((LARGURA, round(im.size[1] * LARGURA / im.size[0])), Image.LANCZOS) if im.size[0] != LARGURA else im
altura = LARGURA // PROPORCAO
if im.size[1] > altura:
    branco = np.asarray(im).min(axis=2) > 225                     # letras brancas
    ys = np.nonzero(branco.any(axis=1))[0]
    centro = (ys.min() + ys.max()) / 2 if len(ys) else im.size[1] / 2
    topo = int(round(min(max(centro - altura / 2, 0), im.size[1] - altura)))
    im = im.crop((0, topo, LARGURA, topo + altura))
    print('recorte: linhas', topo, 'a', topo + altura)

for q in range(85, 49, -1):
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=2)
    if len(b.getvalue()) <= LIMITE:
        break
(AQUI / 'banner-jantar.jpg').write_bytes(b.getvalue())
print('banner-jantar.jpg', im.size, 'qualidade', q, len(b.getvalue()) // 1024, 'KB')
