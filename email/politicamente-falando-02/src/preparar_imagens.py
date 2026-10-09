"""Prepara as imagens do email a partir dos originais (em originais/) e grava-as em imagens/.

- banner.jpg (2000 × 667, 3:1): o banner da 2.ª sessão feito pela JSD (originais/banner-02.webp), convertido para JPEG
  sem perder definição: tamanho original (sem ampliar nem reduzir), qualidade 92 e sem subamostragem de cor. JPEG
  porque o WebP não aparece em todos os clientes de email (o Outlook para Windows, por exemplo).
- assinatura-daniela-torres.png: a assinatura do convite da 1.ª sessão, em azul e com fundo transparente
  (no original é branca sobre azul; num email de fundo branco tem de ser escura).

Uso (a partir de email/politicamente-falando-02/): python3 src/preparar_imagens.py
"""
import pathlib
from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent.parent
ORIG, IMG = AQUI / 'originais', AQUI / 'imagens'

convite = Image.open(ORIG / 'convite-01.jpg').convert('RGB')     # 1600 × 1105 (para a assinatura)

# ------------------------------------------------------------------ banner
# O WebP tem canal alfa, mas opaco (a última linha tem 251 em 255): a imagem fica tal e qual, sem a transparência.
banner = Image.open(ORIG / 'banner-02.webp').convert('RGB')
banner.save(IMG / 'banner.jpg', quality=92, subsampling=0, optimize=True, progressive=True)
media = banner.resize((1, 1), Image.BOX).getpixel((0, 0))
print('banner.jpg', banner.size, (IMG / 'banner.jpg').stat().st_size // 1024, 'KB', 'cor média #%02X%02X%02X' % media)

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
