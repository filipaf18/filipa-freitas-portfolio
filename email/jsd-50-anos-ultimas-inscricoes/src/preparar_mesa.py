"""Extrai a ilustração da mesa do menu (originais/menu.jpg) como PNG com fundo transparente: imagens/mesa.png.
O traço é laranja e o fundo cinzento claro: a opacidade sai da saturação (os cinzentos ficam transparentes)."""
import pathlib, numpy as np
from PIL import Image
AQUI = pathlib.Path(__file__).resolve().parent.parent
m = Image.open(AQUI / 'originais' / 'menu.jpg').convert('RGB')     # 1932 × 2576
f = m.size[0] / 1500
a = np.asarray(m.crop((int(810 * f), int(735 * f), m.size[0], int(1800 * f)))).astype(np.float32)
chroma = a.max(2) - a.min(2)
alfa = np.clip((chroma - 18) / 70, 0, 1)
fundo = np.array([233, 233, 232], np.float32)
a3 = np.maximum(alfa, 1e-3)[..., None]
cor = np.clip((a - (1 - a3) * fundo) / a3, 0, 255)
rgba = np.dstack([cor, alfa * 255]).astype(np.uint8)
im = Image.fromarray(rgba, 'RGBA')
im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
im = im.resize((600, round(600 * im.size[1] / im.size[0])), Image.LANCZOS)
# o desenho vem cortado à direita (é o limite da imagem original): desvanece-se nos 22 % da direita, para parecer intencional
al = np.asarray(im.getchannel('A')).astype(np.float32)
w = al.shape[1]
fade = np.clip((w - np.arange(w)) / (0.22 * w), 0, 1)[None, :]
im.putalpha(Image.fromarray((al * fade).astype(np.uint8)))
im.save(AQUI / 'imagens' / 'mesa.png', optimize=True)
print('mesa.png', im.size)
