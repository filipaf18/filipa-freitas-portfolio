"""Verificação rigorosa dos alinhamentos dos emails, em vários ecrãs e simulando «clientes» de email.

Para cada email, largura de ecrã e variante, mede em píxeis (captura a 2×, precisão de 0,5 px):
  - texto centrado:   o centro da TINTA de cada linha (não o da caixa) tem de estar no eixo da página;
  - botão:            centro da caixa, centro visível e centro do texto lá dentro;
  - traço laranja:    centro da caixa;
  - logo do rodapé:   centro da caixa e das letras «ANOS / JSD FAMALICÃO»;
  - coluna de texto:  margens esquerda e direita iguais (filetes) e todo o texto à esquerda na mesma margem;
  - linhas com várias colunas (paleta, looks): simétricas em relação ao eixo;
  - banner e barras:  de ponta a ponta do ecrã;
  - nada a transbordar na horizontal.

As «variantes» simulam o que os clientes de email fazem ao HTML: o Gmail descarta o <head> ao colar, e há
clientes que ignoram atributos ou propriedades de CSS. O email tem de continuar centrado quando se retira
cada mecanismo de centragem isoladamente (variantes 2 a 10, 12 e 13). As variantes marcadas «info» (clientes
sem max-width, sem nenhum mecanismo de centragem de tabelas) mostram o que se perde nesses casos extremos.

Uso (a partir de email/jsd-50-anos/):
    python3 src/verificar_alinhamento.py                              # v7 e v8, todas as larguras
    python3 src/verificar_alinhamento.py --rapido v9-lembrete-geral.html
    python3 src/verificar_alinhamento.py --detalhe                    # mostra também os maiores desvios que passam
    python3 src/verificar_alinhamento.py --so=12 --so=2               # só as variantes 12 e 2
Sai com código 1 se alguma verificação obrigatória falhar.
"""
import io, re, sys, pathlib
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).resolve().parent.parent
EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
PADRAO = ['v7-convite-geral.html', 'v8-convite-institucional.html']
LARGURAS = [320, 360, 375, 390, 414, 600, 601, 768, 1024, 1100, 1400, 1920]
LARGURAS_RAPIDO = [320, 390, 601, 1400]
LARGURAS_VARIANTES = [320, 390, 601, 768, 1400]

TOL_CAIXA, TOL_TINTA = 0.5, 1.0          # px


def sem_head(h): return re.sub(r'<head>.*?</head>', '', h, flags=re.S)
def sem_attr(h, tag, attr): return re.sub(rf'(<{tag}\b[^>]*?)\s{attr}="[^"]*"', r'\1', h)
def sem_css(h, padrao): return re.sub(padrao, '', h)
def sem_doctype(h): return re.sub(r'<!DOCTYPE html>\s*', '', h, flags=re.I)
def troca_fonte(h): return h.replace("font-family:Montserrat,'Helvetica Neue',Helvetica,Arial,sans-serif", "font-family:Georgia,'Times New Roman',serif")
def amplia(h, f=1.25): return re.sub(r'font-size:\s*([\d.]+)px', lambda m: f'font-size:{float(m.group(1)) * f:.1f}px' if float(m.group(1)) > 1 else m.group(0), h)

# nome: (função, obrigatória)
VARIANTES = {
    '1 original (com <head>)':               (lambda h: h, True),
    '2 colado no Gmail (sem <head>)':        (sem_head, True),
    '3 sem align nas tabelas':               (lambda h: sem_attr(sem_head(h), 'table', 'align'), True),
    '4 sem align nas células':               (lambda h: sem_attr(sem_head(h), 'td', 'align'), True),
    '5 sem margin:0 auto':                   (lambda h: sem_css(sem_head(h), r'margin:\s*0\s*auto;?'), True),
    '6 sem text-align no style':             (lambda h: sem_css(sem_head(h), r'text-align:\s*\w+;?'), True),
    '7 sem display:inline-block':            (lambda h: sem_css(sem_head(h), r'display:\s*inline-block;?'), True),
    '8 sem letter-spacing':                  (lambda h: sem_css(sem_head(h), r'letter-spacing:\s*[\d.]+px;?'), True),
    '9 sem degradê (background-image)':      (lambda h: sem_css(sem_head(h), r'background-image:\s*linear-gradient\([^)]*\);?'), True),
    '10 modo quirks (sem doctype)':          (lambda h: sem_doctype(sem_head(h)), True),
    '11 outro tipo de letra (serifa)':       (lambda h: troca_fonte(sem_head(h)), True),
    '12 letra 25% maior (acessibilidade)':   (lambda h: amplia(sem_head(h)), True),
    '13 sem max-width (info)':               (lambda h: sem_css(sem_head(h), r'max-width:\s*[\d.]+(?:px|%);?'), False),
    '14 sem align nem margin (info)':        (lambda h: sem_css(sem_attr(sem_attr(sem_head(h), 'table', 'align'), 'td', 'align'), r'margin:\s*0\s*auto;?'), False),
}

JS = r'''() => {
  const sx = scrollX, sy = scrollY;
  const W = document.documentElement.clientWidth;
  const R = el => { const r = el.getBoundingClientRect(); return {l:r.left+sx, r:r.right+sx, t:r.top+sy, b:r.bottom+sy}; };
  const px = (el, p) => parseFloat(getComputedStyle(el)[p]) || 0;
  const out = {W, scrollW: document.documentElement.scrollWidth, tds: [], botoes: [], tracos: [], filetes: [], imgs: [], barras: [], colunas: [], tabelas: []};
  const f1 = document.querySelector('td[height="1"]');
  const main = f1 ? f1.closest('table').parentElement.closest('td').closest('table') : document.querySelector('table');
  for (const t of document.querySelectorAll('table')) {          // tabelas dentro de células da tabela principal
    const td = t.parentElement && t.parentElement.closest('td');
    if (t !== main && td && td.closest('table') === main && td.parentElement.children.length === 1)
      out.tabelas.push({box: R(t), larga: t.getBoundingClientRect().width > document.documentElement.clientWidth * 0.5});
  }
  for (const tr of document.querySelectorAll('tr')) {          // linhas com várias colunas (paleta, looks…)
    const cels = [...tr.children].filter(c => c.tagName === 'TD' && c.getBoundingClientRect().width > 4);
    if (cels.length > 1 && !tr.closest('table').querySelector('td[rowspan]')) {
      const rs = cels.map(R);
      out.colunas.push({l: Math.min(...rs.map(r => r.l)), r: Math.max(...rs.map(r => r.r)), n: cels.length});
    }
  }
  for (const td of document.querySelectorAll('td')) {
    const rects = [];
    const w = document.createTreeWalker(td, NodeFilter.SHOW_TEXT, {acceptNode: n =>
      (n.textContent.replace(/[\s ]/g, '') && n.parentElement.closest('td') === td) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT});
    let n;
    while ((n = w.nextNode())) {
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) if (q.width > 0.5) rects.push({l:q.left+sx, r:q.right+sx, t:q.top+sy, b:q.bottom+sy, s:n.textContent});
    }
    const box = R(td);
    const unico = td.parentElement.children.length === 1;
    const bg = td.getAttribute('bgcolor') || '';
    const botao = !!td.querySelector('a[href]') && /^#F86420$/i.test(bg) && !td.getAttribute('height');
    if (td.getAttribute('height') === '2') out.tracos.push({box});
    if (td.getAttribute('height') === '1') out.filetes.push({box});
    if (td.getAttribute('height') === '6') out.barras.push({box});
    if (botao) out.botoes.push({box});
    if (!rects.length) continue;
    rects.sort((a, b) => (a.t + a.b) - (b.t + b.b));
    const linhas = [];
    for (const q of rects) {
      const m = (q.t + q.b) / 2, L = linhas[linhas.length - 1];
      if (L && Math.abs(m - L.m) < 0.6 * (q.b - q.t)) { L.l = Math.min(L.l, q.l); L.r = Math.max(L.r, q.r); L.t = Math.min(L.t, q.t); L.b = Math.max(L.b, q.b); L.s += q.s; }
      else linhas.push({l:q.l, r:q.r, t:q.t, b:q.b, m, s:q.s});
    }
    out.tds.push({box, unico, botao, principal: td.closest('table') === main, align: getComputedStyle(td).textAlign, padL: px(td, 'paddingLeft'), padR: px(td, 'paddingRight'), linhas});
  }
  const exterior = el => { let tr = el.closest('tr'); while (tr.parentElement.closest('tr')) tr = tr.parentElement.closest('tr'); return tr; };
  for (const im of document.images) out.imgs.push({box: R(im), faixa: R(exterior(im)), alt: im.alt, ok: im.complete && im.naturalWidth > 0});
  return out;
}'''


def faixa_tinta(img, x0, x1, t, b, escala=2, limiar=40, fundo=None, escuro=None):
    """(esquerda, direita) em px CSS da tinta numa faixa; None se não houver. «escuro»: só píxeis com máx(RGB) < valor."""
    X0, X1 = max(int(x0 * escala), 0), min(int(np.ceil(x1 * escala)), img.shape[1])
    reg = img[int(t * escala):int(np.ceil(b * escala)), X0:X1].astype(int)
    if reg.size == 0:
        return None
    if escuro is not None:
        cols = (reg.max(axis=2) < escuro).any(axis=0)
    else:
        bg = np.median(reg.reshape(-1, 3), axis=0) if fundo is None else np.array(fundo)
        cols = (np.abs(reg - bg).max(axis=2) > limiar).any(axis=0)
    idx = np.nonzero(cols)[0]
    return None if len(idx) == 0 else ((X0 + idx[0]) / escala, (X0 + idx[-1] + 1) / escala)


def medir(pg, html, largura):
    pg.set_viewport_size({'width': largura, 'height': 900})
    pg.set_content(html)
    pg.wait_for_timeout(60)
    d = pg.evaluate(JS)
    img = np.asarray(Image.open(io.BytesIO(pg.screenshot(full_page=True))).convert('RGB'))
    return d, img


def analisar(d, img):
    """Lista de (classe, desvio em px, onde)."""
    W, eixo, res = d['W'], d['W'] / 2, []
    add = lambda classe, desvio, onde: res.append((classe, desvio, onde))
    if d['scrollW'] > W:
        add('transbordo horizontal', d['scrollW'] - W, f'conteúdo de {d["scrollW"]} px num ecrã de {W} px')
    ref_esq = None
    for f in d['filetes']:
        add('coluna: margem esquerda = direita', abs(f['box']['l'] - (W - f['box']['r'])), 'filete')
        ref_esq = f['box']['l'] if ref_esq is None else ref_esq
    for b in d['barras']:
        add('barras de degradê: ponta a ponta', abs(b['box']['l']) + abs(b['box']['r'] - W), 'barra')
    for t in d['tracos']:
        add('traço laranja: centro', abs((t['box']['l'] + t['box']['r']) / 2 - eixo), 'traço')
    for b in d['botoes']:
        add('botão: centro da caixa', abs((b['box']['l'] + b['box']['r']) / 2 - eixo), 'botão')
        vis = faixa_tinta(img, 0, W, b['box']['t'], b['box']['b'], fundo=(255, 255, 255), limiar=30)
        if vis:
            add('botão: centro visível', abs((vis[0] + vis[1]) / 2 - eixo), 'botão')
    for im in d['imgs']:
        if not im['ok']:
            add('imagem não carregou', 99, im['alt'])
        if im['alt'].startswith('Jantar Comemorativo') or im['alt'].startswith('50 anos JSD Famalicão. Cinco'):
            add('banner: faixa de ponta a ponta', abs(im['faixa']['l']) + abs(im['faixa']['r'] - W), 'banner')
            add('banner: imagem centrada', abs((im['box']['l'] + im['box']['r']) / 2 - eixo), 'banner')
        if im['alt'].startswith('50 anos JSD Famalicão') and 'Cinco' not in im['alt']:
            bx = im['box']
            add('logo: centro da caixa', abs((bx['l'] + bx['r']) / 2 - eixo), 'logo')
            # letras pretas «ANOS / JSD FAMALICÃO» = parte de baixo do logo
            e = faixa_tinta(img, bx['l'], bx['r'], bx['b'] - (bx['b'] - bx['t']) * 0.30, bx['b'], escuro=70)
            if e:
                add('logo: centro das letras', abs((e[0] + e[1]) / 2 - eixo), 'logo')
    for t in d['tabelas']:
        add('tabelas dentro da coluna: centradas', abs((t['box']['l'] + t['box']['r']) / 2 - eixo), 'tabela de %d px' % round(t['box']['r'] - t['box']['l']))
    for c in d['colunas']:
        add('linhas com várias colunas: simétricas', abs(c['l'] - (W - c['r'])), f'{c["n"]} colunas')
    for td in d['tds']:
        cont_l, cont_r = td['box']['l'] + td['padL'], td['box']['r'] - td['padR']
        centrado = td['align'] in ('center', '-webkit-center')
        if not (td['unico'] and td['principal']):
            # células de tabelas aninhadas (paleta, looks…): a tinta tem de estar no centro da própria célula
            if centrado and not td['botao']:
                for L in td['linhas']:
                    e = faixa_tinta(img, cont_l, cont_r, L['t'], L['b'])
                    if e:
                        add('células aninhadas: texto centrado na célula', abs((e[0] + e[1]) / 2 - (cont_l + cont_r) / 2), L['s'].strip().replace('\u00a0', ' ')[:28])
            continue
        for L in td['linhas']:
            amostra = L['s'].strip().replace(' ', ' ')[:28]
            if centrado and td['botao']:
                e = faixa_tinta(img, td['box']['l'], td['box']['r'], L['t'], L['b'], escuro=110)
                if e:
                    cx = (e[0] + e[1]) / 2
                    add('botão: texto no centro do botão', abs(cx - (td['box']['l'] + td['box']['r']) / 2), amostra)
                    add('botão: texto no eixo da página', abs(cx - eixo), amostra)
            elif centrado:
                e = faixa_tinta(img, cont_l, cont_r, L['t'], L['b'])
                if e:
                    add('texto centrado: tinta no eixo', abs((e[0] + e[1]) / 2 - eixo), amostra)
            elif td['align'] in ('left', 'start') and ref_esq is not None:
                add('texto à esquerda: mesma margem', abs(L['l'] - ref_esq), amostra)
    return res


LIMITES = {'texto centrado: tinta no eixo': TOL_TINTA, 'células aninhadas: texto centrado na célula': TOL_TINTA, 'botão: texto no centro do botão': TOL_TINTA,
           'botão: texto no eixo da página': TOL_TINTA, 'logo: centro das letras': TOL_TINTA}


def main(argv):
    rapido, detalhe = '--rapido' in argv, '--detalhe' in argv
    ficheiros = [a for a in argv if not a.startswith('--')] or PADRAO
    so = [a[5:] for a in argv if a.startswith('--so=')]          # --so=12 corre só a variante 12 (pode repetir-se)
    resumo = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=EXE, args=['--no-sandbox'])
        pg = b.new_context(device_scale_factor=2, viewport={'width': 800, 'height': 900}).new_page()
        pg.route('**/*', lambda r: r.abort() if r.request.url.startswith('http') else r.continue_())
        for f in ficheiros:
            original = (AQUI / f).read_text(encoding='utf-8')
            for nome, (fn, obrig) in VARIANTES.items():
                if so and nome.split(' ')[0] not in so:
                    continue
                completo = nome.startswith(('1 ', '2 '))
                ws = (LARGURAS_RAPIDO if rapido else LARGURAS) if completo else LARGURAS_VARIANTES
                html, pior = fn(original), {}
                for w in ws:
                    d, img = medir(pg, html, w)
                    for classe, desvio, onde in analisar(d, img):
                        if classe not in pior or desvio > pior[classe][0]:
                            lim = LIMITES.get(classe, TOL_CAIXA)
                            if nome.startswith('12 ') and classe in LIMITES:
                                lim *= 1.5            # letra 25% maior: os espaços laterais de cada letra crescem também
                            pior[classe] = (desvio, f'{w}px «{onde}»', lim)
                resumo[(f, nome)] = (pior, obrig)
        b.close()
    falhas = 0
    for (f, nome), (pior, obrig) in resumo.items():
        mau = {c: v for c, v in pior.items() if v[0] > v[2] + 1e-6}
        estado = 'OK  ' if not mau else ('FALHA' if obrig else 'info ')
        print(f'{estado} {f[:3]} {nome:<40} {len(pior)} verificações, desvio máx. {max((v[0] for v in pior.values()), default=0):.2f} px')
        for c, v in sorted(mau.items(), key=lambda kv: -kv[1][0]) if (mau and (obrig or detalhe)) else []:
            print(f'        {c}: {v[0]:.2f} px (limite {v[2]}) em {v[1]}')
        if detalhe and not mau:
            for c, v in sorted(pior.items(), key=lambda kv: -kv[1][0])[:3]:
                print(f'        ({c}: {v[0]:.2f} px em {v[1]})')
        falhas += bool(mau and obrig)
    print('FALHAS:', falhas)
    return 1 if falhas else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
