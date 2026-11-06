"""Define MediaBox/CropBox/BleedBox (154×111 mm, sangria 3 mm) e TrimBox (148×105 mm) nos PDF de impressão.
Uso: python3 caixas_pdf.py ficheiro.pdf [...]"""
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
mm = 72 / 25.4
for f in sys.argv[1:]:
    w = PdfWriter(clone_from=PdfReader(f))
    for p in w.pages:
        top = float(p.mediabox.top); W, H = 154 * mm, 111 * mm
        box = RectangleObject([0, top - H, W, top])
        p.mediabox = box; p.cropbox = box; p.bleedbox = box
        p.trimbox = RectangleObject([3 * mm, top - H + 3 * mm, W - 3 * mm, top - 3 * mm])
    w.add_metadata({'/Title': 'Bingo Cinco Jotas — cartões A6 (sangria 3 mm)', '/Author': 'JSD Famalicão'})
    w.write(f)
    print(f, len(w.pages), 'páginas')
