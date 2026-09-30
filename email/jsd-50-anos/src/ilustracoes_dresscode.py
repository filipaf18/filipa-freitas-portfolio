"""Ilustrações dos looks do dress code («casual chique português»), desenhadas em SVG e exportadas para PNG.

Estilo: peças planas, em «quadro de roupa» (sem rosto), nas cores exatas da paleta do guia, sobre um fundo bege claro.
Os clientes de email não mostram SVG, por isso cada ilustração é exportada para PNG com o dobro da resolução
(440 × 560 px, mostrada a 220 px): nítida em ecrãs retina e com poucos KB (cores chapadas → PNG de paleta).

Uso: python3 src/ilustracoes_dresscode.py  (a partir de email/jsd-50-anos/). Escreve em dresscode/*.png.
"""
import io, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent.parent
SAIDA = AQUI / 'dresscode'
L, A = 440, 560                      # largura e altura (unidades = píxeis do PNG)

# ------------------------------------------------------------------ cores (paleta do guia, com tons de apoio para volume)
FUNDO = '#F3EDE3'
AZUL, AZUL_S, AZUL_C = '#1F2E50', '#16223D', '#2C4070'
CASTANHO, CASTANHO_S, CASTANHO_C = '#61402D', '#4A2C1D', '#7A553D'
BEGE, BEGE_S = '#CDB394', '#B89C7B'
CAMEL = '#B89574'
BRANCO, BRANCO_S = '#F9F5EE', '#E4DBCC'
LARANJA, LARANJA_C = '#B1461F', '#CE6332'
DOURADO, DOURADO_C, DOURADO_S = '#B08A45', '#D3AE65', '#8C6A30'
PRETO = '#151311'


def espelho(frag):
    """Desenha o lado esquerdo e devolve-o com o espelho (lado direito)."""
    return f'{frag}<g transform="translate({L},0) scale(-1,1)">{frag}</g>'


def sombra_chao(cx=220, y=534, rx=110):
    return f'<ellipse cx="{cx}" cy="{y}" rx="{rx}" ry="7" fill="#000" opacity=".07"/>'


# ------------------------------------------------------------------ peças
def camisa_v(y_fim=200):
    """Camisa visível no V do blazer: triângulo, colarinho aberto, botões."""
    return f'''
    <path d="M196,64 L244,64 L220,{y_fim + 2} Z" fill="{BRANCO}"/>
    <path d="M220,106 L220,{y_fim}" stroke="{BRANCO_S}" stroke-width="2"/>
    <g fill="{BRANCO_S}"><circle cx="220" cy="124" r="2.3"/><circle cx="220" cy="152" r="2.3"/><circle cx="220" cy="180" r="2.3"/></g>
    <path d="M200,62 L222,78 L208,100 L198,66 Z" fill="{BRANCO}" stroke="{BRANCO_S}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M240,62 L218,78 L232,100 L242,66 Z" fill="{BRANCO}" stroke="{BRANCO_S}" stroke-width="1.6" stroke-linejoin="round"/>'''


def blazer(cor, sombra, claro, aberto=False, hem=306):
    """Blazer de peito simples, frente (simétrico). aberto=True: frentes caídas, deixam ver a blusa e o cinto."""
    if aberto:
        corpo_e = f'M192,64 L124,84 C134,112 141,140 141,166 L139,{hem - 4} L194,{hem} C199,262 206,226 215,190 L198,68 Z'
        lapela_e = 'M196,64 L150,116 L170,128 L206,168 L215,190 L198,68 Z'
    else:
        corpo_e = f'M192,64 L124,84 C134,112 141,140 141,166 L139,{hem - 2} L211,{hem} C217,{hem - 4} 220,{hem - 12} 220,{hem - 18} L220,200 L198,68 Z'
        lapela_e = 'M196,64 L150,116 L170,128 L216,190 L220,200 L198,68 Z'
    manga_e = f'''<path d="M122,86 C106,120 100,210 96,{hem - 2} L133,{hem + 2} C135,250 137,196 143,160 Z" fill="{cor}"/>
      <path d="M122,86 C106,120 100,210 96,{hem - 2} L133,{hem + 2} C135,250 137,196 143,160 Z" fill="#000" opacity=".10"/>
      <path d="M96,{hem - 2} L133,{hem + 2} L132,{hem + 13} L95,{hem + 9} Z" fill="{BRANCO}"/>
      <path d="M95,{hem + 9} L132,{hem + 13}" stroke="{BRANCO_S}" stroke-width="1.6"/>
      <path d="M98,{hem - 18} L132,{hem - 14}" stroke="{claro}" stroke-width="1.6" opacity=".55"/>'''
    lado = f'''
      <path d="{corpo_e}" fill="{cor}"/>
      <path d="M141,166 L139,{hem - 2} L154,{hem - 1} L154,172 Z" fill="#000" opacity=".07"/>
      <path d="{lapela_e}" fill="{claro}" stroke="{sombra}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M152,256 L196,261 L196,269 L152,264 Z" fill="{sombra}" opacity=".7"/>'''
    colarinho = f'<path d="M190,62 Q220,46 250,62 L247,72 Q220,58 193,72 Z" fill="{sombra}"/>'
    botoes = '' if aberto else f'''<g fill="{sombra}"><circle cx="211" cy="205" r="3.6"/><circle cx="211" cy="246" r="3.6"/></g>
      <g fill="{claro}" opacity=".5"><circle cx="210" cy="204" r="1.3"/><circle cx="210" cy="245" r="1.3"/></g>'''
    return (f'<g>{espelho(manga_e)}</g>', colarinho, espelho(lado), botoes)


def lenco_bolso(cor, claro):
    """Lenço no bolso do peito (lado direito da imagem): dobra de 3 pontas, arestas nítidas (é a peça de cor do look)."""
    return f'''
    <path d="M262,166 L265,138 L275,153 L283,124 L291,153 L299,133 L300,164 L263,169 Z" fill="{cor}"/>
    <path d="M275,153 L283,124 L291,153 Z" fill="{claro}"/>
    <path d="M265,138 L275,153 L266,160 Z" fill="#000" opacity=".12"/>
    <path d="M299,133 L291,153 L300,160 Z" fill="#000" opacity=".12"/>'''


def bolso_peito(sombra):
    return f'<path d="M260,164 L301,156 L302,162 L261,171 Z" fill="{sombra}"/>'


def calcas_retas(cor, sombra, topo=268, fundo=500):
    return f'''
    <path d="M146,{topo} L294,{topo} L284,{fundo} L227,{fundo} L220,350 L213,{fundo} L156,{fundo} Z" fill="{cor}"/>
    <path d="M186,330 L185,{fundo - 2}" stroke="{sombra}" stroke-width="2" opacity=".55"/>
    <path d="M255,330 L256,{fundo - 2}" stroke="{sombra}" stroke-width="2" opacity=".55"/>
    <path d="M156,{fundo - 12} L213,{fundo - 12} L213,{fundo} L156,{fundo} Z" fill="{sombra}" opacity=".35"/>
    <path d="M227,{fundo - 12} L284,{fundo - 12} L284,{fundo} L227,{fundo} Z" fill="{sombra}" opacity=".35"/>'''


def mocassins(cor='#3B2418'):
    e = (f'<path d="M152,500 L213,500 L215,514 C215,526 206,531 190,531 L158,531 C146,531 141,524 145,516 C149,509 151,505 152,500 Z" fill="{cor}"/>'
         f'<path d="M145,525 L212,525 L211,531 L158,531 C148,531 143,528 145,525 Z" fill="#000" opacity=".28"/>'
         f'<path d="M162,507 C176,503 192,504 204,508" stroke="#fff" opacity=".13" stroke-width="2" fill="none"/>')
    return f'{e}<g transform="translate({L},0) scale(-1,1)">{e}</g>'


def clutch(x, y, larg=88, alt=54):
    return f'''
    <g transform="translate({x},{y}) rotate(-6 {larg / 2} {alt / 2})">
      <rect x="0" y="0" width="{larg}" height="{alt}" rx="9" fill="{DOURADO}"/>
      <path d="M0,{alt * .42} Q{larg / 2},{alt * .62} {larg},{alt * .42} L{larg},9 Q{larg},0 {larg - 9},0 L9,0 Q0,0 0,9 Z" fill="{DOURADO_C}"/>
      <circle cx="{larg / 2}" cy="{alt * .52}" r="5.5" fill="{DOURADO_S}"/>
      <circle cx="{larg / 2 - 1.2}" cy="{alt * .52 - 1.2}" r="2" fill="{DOURADO_C}"/>
    </g>'''


def argolas(x, y):
    return f'''
    <g fill="none" stroke="{DOURADO}" stroke-width="6">
      <circle cx="{x}" cy="{y}" r="17"/><circle cx="{x + 52}" cy="{y + 4}" r="17"/>
    </g>
    <g fill="none" stroke="{DOURADO_C}" stroke-width="1.6" opacity=".8">
      <path d="M{x - 11},{y - 9} A14,14 0 0 1 {x + 6},{y - 14}"/><path d="M{x + 41},{y - 5} A14,14 0 0 1 {x + 58},{y - 10}"/>
    </g>'''


# ------------------------------------------------------------------ looks
def look_homem(blazer_cor, blazer_sombra, blazer_claro, lenco_cor, lenco_claro):
    mangas, colarinho, frente, botoes = blazer(blazer_cor, blazer_sombra, blazer_claro)
    return ''.join([
        sombra_chao(), mocassins(), calcas_retas(BEGE, BEGE_S),
        camisa_v(), mangas, colarinho, frente, botoes,
        lenco_bolso(lenco_cor, lenco_claro), bolso_peito(blazer_sombra)])


def look_mulher_blazer():
    """Blazer castanho aberto + blusa branca + calças bege de corte largo + cinto e clutch dourados."""
    calcas = f'''
    <path d="M150,262 L290,262 L324,506 L229,506 L220,348 L211,506 L116,506 Z" fill="{BEGE}"/>
    <path d="M172,300 L150,504" stroke="{BEGE_S}" stroke-width="2" opacity=".55"/>
    <path d="M268,300 L290,504" stroke="{BEGE_S}" stroke-width="2" opacity=".55"/>
    <path d="M118,494 L211,494 L211,506 L116,506 Z" fill="{BEGE_S}" opacity=".35"/>
    <path d="M229,494 L322,494 L324,506 L229,506 Z" fill="{BEGE_S}" opacity=".35"/>'''
    sapatos = f'''
    <path d="M136,506 L206,506 C206,520 192,528 168,528 C146,528 134,520 136,506 Z" fill="{DOURADO}"/>
    <path d="M234,506 L304,506 C306,520 294,528 272,528 C248,528 234,520 234,506 Z" fill="{DOURADO}"/>'''
    cinto = f'''
    <path d="M150,256 L290,256 L290,268 L150,268 Z" fill="{CASTANHO_S}"/>
    <rect x="210" y="253" width="20" height="18" rx="2.5" fill="none" stroke="{DOURADO_C}" stroke-width="3.5"/>'''
    blusa = f'''
    <path d="M196,64 L244,64 L250,262 L190,262 Z" fill="{BRANCO}"/>
    <path d="M220,104 L220,260" stroke="{BRANCO_S}" stroke-width="2"/>
    <g fill="{BRANCO_S}"><circle cx="220" cy="124" r="2.3"/><circle cx="220" cy="156" r="2.3"/><circle cx="220" cy="188" r="2.3"/><circle cx="220" cy="220" r="2.3"/></g>
    <path d="M200,62 L222,78 L208,100 L198,66 Z" fill="{BRANCO}" stroke="{BRANCO_S}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M240,62 L218,78 L232,100 L242,66 Z" fill="{BRANCO}" stroke="{BRANCO_S}" stroke-width="1.6" stroke-linejoin="round"/>'''
    mangas, colarinho, frente, _ = blazer(CASTANHO, CASTANHO_S, CASTANHO_C, aberto=True, hem=300)
    return ''.join([sombra_chao(rx=130), sapatos, calcas, blusa, cinto, mangas, colarinho, frente, clutch(330, 372)])


def look_mulher_vestido():
    """Vestido midi azul-marinho de cruzar, mangas curtas + cinto, sapatos e argolas dourados + clutch."""
    silhueta = ('M220,158 L194,64 L158,74 C144,80 132,90 124,104 L118,150 L152,160 C156,200 160,244 162,270 '
                'C146,330 116,420 100,486 C150,498 190,496 220,494 Z')
    lado = f'''
    <path d="{silhueta}" fill="{AZUL}"/>
    <path d="M124,104 L118,150 L152,160 L150,128 Z" fill="#000" opacity=".12"/>
    <path d="M158,74 C144,80 132,90 124,104" fill="none" stroke="{AZUL_C}" stroke-width="2"/>
    <path d="M152,160 C156,200 160,244 162,270 L176,270 C176,244 174,200 170,166 Z" fill="#000" opacity=".10"/>
    <path d="M162,270 C146,330 116,420 100,486 C118,490 134,493 150,495 C148,424 156,344 174,286 Z" fill="#000" opacity=".10"/>
    <path d="M220,158 L194,64 L204,66 L224,140 Z" fill="{AZUL_S}"/>'''
    cruzado = f'<path d="M246,68 L224,150 L178,268" fill="none" stroke="{AZUL_C}" stroke-width="2.6" stroke-linecap="round"/>'
    pregas = f'''<g stroke="{AZUL_S}" stroke-width="2" opacity=".6" fill="none">
      <path d="M192,286 C186,360 178,430 170,492"/><path d="M220,286 L220,494"/><path d="M248,286 C254,360 262,430 270,492"/></g>'''
    cinto = f'''
    <path d="M161,268 L279,268 L279,282 L161,282 Z" fill="{DOURADO}"/>
    <path d="M161,268 L279,268 L279,273 L161,273 Z" fill="{DOURADO_C}" opacity=".7"/>
    <rect x="209" y="264" width="22" height="22" rx="3" fill="none" stroke="{DOURADO_C}" stroke-width="3.5"/>'''
    sapatos = f'''
    <path d="M142,506 C162,499 192,501 200,513 C204,523 194,529 176,529 C154,529 138,522 142,506 Z" fill="{DOURADO}"/>
    <path d="M240,513 C248,501 278,499 298,506 C302,522 286,529 264,529 C246,529 236,523 240,513 Z" fill="{DOURADO}"/>'''
    return ''.join([sombra_chao(rx=120), sapatos, espelho(lado), cruzado, pregas, cinto, argolas(50, 396), clutch(334, 388, 82, 50)])


LOOKS = {
    'elas-blazer-castanho': look_mulher_blazer,
    'elas-vestido-azul': look_mulher_vestido,
    'eles-blazer-azul': lambda: look_homem(AZUL, AZUL_S, AZUL_C, LARANJA, LARANJA_C),
    'eles-blazer-castanho': lambda: look_homem(CASTANHO, CASTANHO_S, CASTANHO_C, DOURADO, DOURADO_C),
}


def svg(conteudo):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{L}" height="{A}" viewBox="0 0 {L} {A}">'
            f'<rect width="{L}" height="{A}" fill="{FUNDO}"/>{conteudo}</svg>')


def exportar(cores=64):
    SAIDA.mkdir(exist_ok=True)
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args=['--no-sandbox'])
        pg = br.new_page(viewport={'width': L, 'height': A}, device_scale_factor=1)
        for nome, f in LOOKS.items():
            pg.set_content(f'<body style="margin:0">{svg(f())}</body>')
            im = Image.open(io.BytesIO(pg.screenshot(clip={'x': 0, 'y': 0, 'width': L, 'height': A}))).convert('RGB')
            im = im.quantize(colors=cores, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
            im.save(SAIDA / f'{nome}.png', optimize=True)
            print(nome, (SAIDA / f'{nome}.png').stat().st_size // 1024, 'KB')
        br.close()


if __name__ == '__main__':
    exportar()
