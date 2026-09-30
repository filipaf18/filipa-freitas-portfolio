"""Prepara o logo do rodapé (logo-50-anos.png) a partir do original a cores (logos/logo-50-anos-cor.jpg).

1. Recorte SIMÉTRICO em torno do centro das letras «ANOS / JSD FAMALICÃO» (medido no original);
   assim as letras ficam no eixo do email (o desenho do «50» fica, como no original, ligeiramente
   para a direita por causa da seta).
2. Fundo #F8F8F8 → transparente (alfa pela distância ao fundo; o grão do JPEG no fundo desaparece).
3. Cor sem contaminação do fundo nas orlas (a cor do interior é estendida para a orla).
4. Contorno claro subtil só à volta das letras pretas: invisível sobre fundo claro, torna-as legíveis
   se um cliente de email escurecer o rodapé (modo escuro das apps do Gmail).

Uso: python3 src/preparar_logo.py  (a partir de email/jsd-50-anos/)
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter

AQUI = pathlib.Path(__file__).resolve().parent.parent
FUNDO = 248.0            # #F8F8F8
LARGURA = 340            # 2× os 170 px com que aparece no email

src = Image.open(AQUI / 'logos' / 'logo-50-anos-cor.jpg').convert('RGB')
W, H = src.size
rgb = np.asarray(src).astype(int)
tinta = np.abs(rgb - FUNDO).max(axis=2) > 40
ys, xs = np.nonzero(tinta)
# eixo = centro das letras pretas «ANOS / JSD FAMALICÃO» (por baixo do desenho)
letras_orig = tinta & (rgb.max(axis=2) < 80)            # preto sem cor (exclui os vermelhos escuros do «5»)
lx = np.nonzero(letras_orig)[1]
cx = round((lx.min() + lx.max()) / 2)
meia = max(cx - xs.min(), xs.max() - cx) + 24                       # recorte simétrico, 24 px de folga
caixa = (cx - meia, ys.min() - 24, cx + meia, ys.max() + 24)
assert caixa[0] >= 0 and caixa[2] <= W, 'o recorte não pode sair da imagem'
im = np.asarray(src.crop(caixa)).astype(np.float64)

d = np.abs(im - FUNDO).max(axis=2)
a = np.clip((d - 10) / (60 - 10), 0, 1)
A = (Image.fromarray((a * 255).astype(np.uint8), 'L')
     .filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6)))
a = np.asarray(A).astype(np.float64) / 255

cor, mascara = im.copy(), a > 0.97
for _ in range(12):
    acc, n = np.zeros_like(cor), np.zeros(mascara.shape)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            sm = np.roll(np.roll(mascara, dy, 0), dx, 1)
            acc += np.roll(np.roll(cor, dy, 0), dx, 1) * sm[..., None]
            n += sm
    novo = (~mascara) & (n > 0)
    cor[novo] = acc[novo] / n[novo][:, None]
    mascara |= novo

logo = Image.fromarray(np.dstack([cor, a * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
logo = logo.resize((LARGURA, round(logo.size[1] * LARGURA / logo.size[0])), Image.LANCZOS)

arr = np.asarray(logo).astype(np.float64)
lum = 0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]
letras = ((lum < 80) & (arr[..., 3] > 128)).astype(np.uint8) * 255
halo = Image.new('RGBA', logo.size, (255, 255, 255, 0))
halo.putalpha(Image.fromarray(letras, 'L').filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.7)))
final = Image.alpha_composite(halo, logo)
final.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(AQUI / 'logo-50-anos.png', optimize=True)
print('logo-50-anos.png', final.size, 'recorte', caixa)
