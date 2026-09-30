"""Terceiro email: confirmação da inscrição + dress code «casual chique» (em texto e ilustrações, dentro do corpo do email).
v11 (geral) e v12 (institucional). Mesma base visual dos convites v7/v8 e do lembrete v9/v10.

Dress code: paleta desenhada com células de cor → 2 looks para elas e 2 para eles em ilustrações (dresscode/*.png,
desenhadas por src/ilustracoes_dresscode.py) com legenda → nota «exemplos ilustrativos» → 3 regras → frase final.
Sem fotografias e sem ligação para o guia completo.

Uso: python3 src/gerar_confirmacao.py  (a partir de email/jsd-50-anos/)
Nota: importar gerar_final volta a gerar v7/v8 e copiar-convites.html (saída idêntica).
"""
import base64, re
from gerar_final import *          # comum.py, mote(), MUTED, MAPA_LINK, ASSINATURA, pagina_copiar…

SITE_50 = 'https://jsdfamalicao.pt/50-anos'     # o banner leva ao site (já não há nada para «inscrever»)

# Por omissão as ilustrações vão embutidas no HTML (como o banner e o logo). Se, num envio de teste, o Gmail cortar a
# mensagem ou as imagens não aparecerem, publicar os PNG de dresscode/ num endereço público e pôr aqui a pasta,
# por exemplo 'https://jsdfamalicao.pt/50-anos/dresscode'. O HTML passa a referir as imagens por endereço (fica mais leve).
IMAGENS_URL = None

# ------------------------------------------------------------------ textos (registo geral e institucional)
CONFIRMACOES = {
    'geral': dict(
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            f'A tua inscrição no Jantar Comemorativo dos <strong {FORTE}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão está <strong {FORTE}>confirmada</strong>. '
            'Já tens lugar garantido e contamos contigo!',
            'Ficam aqui os dados do jantar e o dress code que propomos, para te ajudar a escolher o que vestir.',
        ],
        essencial='O essencial é sentir-te bem e celebrar connosco.',
        despedida='Até lá,',
        nota='Qualquer dúvida, responde a este email.',
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62;">Recebes este email por te teres inscrito no Jantar Comemorativo dos 50 anos da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
        preheader='A tua inscrição está confirmada. Sábado, 7 de novembro, 19h00, Sunset House. Aqui tens o dress code.',
    ),
    'institucional': dict(
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            f'A sua inscrição no Jantar Comemorativo dos <strong {FORTE}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão está <strong {FORTE}>confirmada</strong>. '
            'Será uma honra contar consigo!',
            'Ficam aqui os dados do jantar e o dress code que sugerimos, para o(a) ajudar na escolha do que vestir.',
        ],
        essencial='O essencial é sentir-se bem e celebrar connosco.',
        despedida='Com os melhores cumprimentos,',
        nota='Para qualquer esclarecimento, responda a este email.',
        rodape_extra='',
        preheader='A sua inscrição está confirmada. Sábado, 7 de novembro, 19h00, Sunset House. Consulte o dress code.',
    ),
}

# ------------------------------------------------------------------ paleta (valores exatos do guia)
BASE = [('Castanho', 'chocolate', '#4A2C1D'), ('Bege', 'camel', '#B89574'), ('Azul', 'marinho', '#172540'),
        ('Preto', 'profundo', '#151311'), ('Branco', 'off-white', '#F7F2EA')]
ACENTOS = [('Laranja', 'queimado', '#B1461F'), ('Dourado', 'ouro velho', '#B08A45')]
BORDA_CLARA = '#DDD2C3'                # o off-white precisa de contorno sobre o fundo branco

# ------------------------------------------------------------------ looks (casual chique; ilustrações em dresscode/)
INTRO_ELAS = 'Alfaiataria descontraída: calças de corte largo e blazer, ou um vestido midi, sempre com um toque de dourado.'
INTRO_ELES = 'Calças beges, camisa e blazer, com um lenço de bolso numa das cores de apontamento.'
# (ficheiro, nome, peças, texto alternativo)
ELAS = [('elas-blazer-castanho', 'Blazer castanho', ['blusa branca', 'calças bege de corte largo', 'clutch dourada'],
         'Blazer castanho com blusa branca, calças bege de corte largo, cinto e clutch dourados'),
        ('elas-vestido-azul', 'Vestido midi azul-marinho', ['cinto dourado', 'sapatos e argolas dourados'],
         'Vestido midi azul-marinho com cinto, sapatos, argolas e clutch dourados')]
ELES = [('eles-blazer-azul', 'Blazer azul-marinho', ['camisa branca', 'calças bege', 'lenço laranja queimado'],
         'Blazer azul-marinho com camisa branca, calças bege e lenço de bolso laranja queimado'),
        ('eles-blazer-castanho', 'Blazer castanho', ['camisa branca', 'calças bege', 'lenço dourado'],
         'Blazer castanho com camisa branca, calças bege e lenço de bolso dourado')]
REGRAS = [('Conforto de inverno.', 'Tecidos mais quentes e camadas elegantes; um casaco ou um cachecol aquecem no final da noite.'),
          ('Tecidos nobres.', 'Seda, veludo, lã e caxemira elevam até o look mais simples.'),
          ('Equilíbrio.', 'Elegância sem exagero, à medida de um jantar entre amigos.')]

# ------------------------------------------------------------------ blocos
CSS = '''
      .t-mote      { font-size:28px !important; line-height:36px !important; }
      .t-sec       { font-size:24px !important; line-height:32px !important; }
      .t-sub       { font-size:12px !important; line-height:18px !important; }
      .t-look      { font-size:17px !important; line-height:26px !important; }
      .t-pal       { font-size:12px !important; line-height:16px !important; }
      .t-leg       { font-size:14px !important; line-height:22px !important; }'''


def sub(texto, cima, baixo=0, alinhar='center'):
    """Subtítulo pequeno, em maiúsculas espaçadas."""
    return linha(texto, cima, baixo, f'font-size:11px; line-height:16px; font-weight:700; letter-spacing:3px; color:{MUTED}; text-transform:uppercase;',
                 alinhar, 't-sub')


def dados_confirmacao():
    """Data, hora, local e morada (o preço já não interessa: a inscrição está confirmada) entre dois filetes."""
    return filete(32, 0) + linha(
        f'<strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong><br>'
        f'19h00{PONTO}<strong {FORTE}>Sunset&nbsp;House</strong><br>'
        f'{MAPA_LINK}',
        24, 24, 'font-size:15px; line-height:29px; color:#3E352B;', 'center', 't-dados') + filete()


def _cor(cor, nome, sub_):
    borda = f' border:1px solid {BORDA_CLARA};' if cor == '#F7F2EA' else ''
    tile = (f'<td width="18%" height="56" bgcolor="{cor}" style="width:18%; height:56px; background-color:{cor}; border-radius:4px;{borda} '
            f'font-size:0; line-height:0;">&nbsp;</td>')
    rotulo = (f'<td width="18%" valign="top" align="center" style="width:18%; padding-top:8px;">'
              f'<strong style="color:{ESCURO};">{nome}</strong><br>{sub_}</td>')
    return tile, rotulo


def _espaco():
    return '<td width="2.5%" style="width:2.5%; font-size:0; line-height:0;">&nbsp;</td>'


def paleta(legenda):
    """Cinco tons base e, por baixo, os dois apontamentos com uma legenda ao lado. Tudo células de cor: 0 KB de imagens."""
    base_t, base_r = zip(*(_cor(c, n, s) for n, s, c in BASE))
    ac_t, ac_r = zip(*(_cor(c, n, s) for n, s, c in ACENTOS))
    sep = _espaco()
    leg = (f'<td rowspan="2" colspan="6" valign="middle" align="left" class="t-leg" style="padding:0 0 0 18px; font-size:13px; '
           f'line-height:21px; color:#3E352B; text-align:left;">{legenda}</td>')
    # a letra das legendas define-se uma vez, na tabela (as células herdam). table-layout:fixed: as colunas respeitam as
    # percentagens e uma etiqueta mais larga que a célula (ex.: «Castanho» a 320 px) não alarga a tabela
    tabela = lambda linhas: (f'<table role="presentation" class="t-pal" width="100%" cellpadding="0" cellspacing="0" border="0" '
                             f'style="table-layout:fixed; font-family:{FONT}; font-size:11px; line-height:15px; color:{MUTED};">{linhas}</table>')
    base = tabela(f'<tr>{sep.join(base_t)}</tr><tr>{sep.join(base_r)}</tr>')
    acentos = tabela(f'<tr>{sep.join(ac_t)}{leg}</tr><tr>{sep.join(ac_r)}</tr>')
    rotulo = lambda texto, cima: (f'<tr><td class="t-sub" style="padding-top:{cima}px; font-family:{FONT}; font-size:11px; line-height:16px; font-weight:700; '
                                  f'letter-spacing:3px; color:{MUTED}; text-transform:uppercase; text-align:left;">{texto}</td></tr>')
    # coluna de 560 px, a mesma das ilustrações: a secção fica toda alinhada no computador
    return f'''
          <tr>
            <td class="px" align="center" style="padding:0px {LADO}px 0px {LADO}px;">
              <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
                {rotulo('Tons base', 32)}<tr><td style="padding-top:12px;">{base}</td></tr>
                {rotulo('Apontamentos', 28)}<tr><td style="padding-top:12px;">{acentos}</td></tr>
              </table>
            </td>
          </tr>'''


def regras():
    return sub('Para acertar', 40, 4) + linha(
        ''.join(f'<div style="padding-top:10px;"><strong {FORTE}>{t}</strong> {d}</div>' for t, d in REGRAS),
        0, 0, 'font-size:15px; line-height:24px; color:#3E352B;', 'center', 't-nota')


def _src(ficheiro):
    if IMAGENS_URL:
        return f'{IMAGENS_URL.rstrip("/")}/{ficheiro}.png'
    return 'data:image/png;base64,' + base64.b64encode((AQUI / 'dresscode' / f'{ficheiro}.png').read_bytes()).decode()


def looks(titulo, intro, itens, cima):
    """Título, frase de apresentação e 2 ilustrações lado a lado com legenda. Limitadas a 560 px de largura (2 × 268 px):
    os PNG têm 440 px, por isso ficam nítidos mesmo em ecrãs retina. Duas colunas fixas (empilhar dependeria do <style>)."""
    cel = []
    for ficheiro, nome, pecas, alt in itens:
        mais = ''.join(f'<span style="color:#F86420;"> +&nbsp;</span>{p}' if i else p for i, p in enumerate(pecas))
        cel.append(f'''<td width="48%" valign="top" align="center" style="width:48%; font-family:{FONT}; text-align:center;">
                    <img src="{_src(ficheiro)}" width="268" alt="{alt}" style="display:block; min-width:100%; max-width:100%; height:auto; border:0; border-radius:4px;">
                    <span class="t-pal" style="display:block; padding-top:12px; font-size:14px; line-height:20px; font-weight:700; color:{ESCURO};">{nome}</span>
                    <span class="t-pal" style="display:block; padding-top:3px; font-size:13px; line-height:20px; color:{MUTED};">{mais}</span>
                  </td>''')
    return (sub(titulo, cima, 0) +
            linha(intro, 10, 4, 'font-size:15px; line-height:24px; color:#6B6054;', 'center', 't-nota') + f'''
          <tr>
            <td class="px" align="center" style="padding:14px {LADO}px 0px {LADO}px;">
              <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
                <tr>
                  {cel[0]}
                  <td width="4%" style="width:4%; font-size:0; line-height:0;">&nbsp;</td>
                  {cel[1]}
                </tr>
              </table>
            </td>
          </tr>''')


def seccao_dresscode(t):
    cab = (linha('DRESS CODE', 48, 0, ETIQUETA, 'center', 't-etiqueta') +
           linha('Casual chique', 14, 0,
                 f'font-size:22px; line-height:30px; font-weight:300; letter-spacing:0.5px; color:{ESCURO}; text-transform:uppercase;', 'center', 't-sec') +
           linha('Elegância descontraída, em tons clássicos e com apontamentos de cor para um toque de personalidade.', 14, 0, CORPO, 'center'))
    return (cab + paleta('Num pormenor (um lenço, uma clutch, uma joia) ou numa única peça-chave.') +
            looks('Para elas', INTRO_ELAS, ELAS, 44) + looks('Para eles', INTRO_ELES, ELES, 44) +
            linha('Exemplos ilustrativos, pensados para inspirar.', 28, 0, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota') +
            regras() +
            linha(t['essencial'], 44, 0, f'font-size:20px; line-height:30px; font-weight:300; color:{ESCURO};', 'center', 't-citacao'))


def confirmacao(t):
    corpo = ''.join([
        cabecalho('JANTAR COMEMORATIVO', 'Inscrição confirmada'),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        dados_confirmacao(),
        seccao_dresscode(t),
        filete(44, 0),
        linha(t['despedida'], 32, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        mote(),
        linha(t['nota'], 32, 44, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
    ])
    html = pagina('50 Anos JSD Famalicão · Inscrição confirmada', t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_confirmacao.py', banner_max=800, link_banner=SITE_50)
    # o Gmail corta a mensagem a partir de ~102 KB: tirar a indentação não muda nada no ecrã e poupa cerca de 2 KB
    return re.sub(r'\n[ \t]+', '\n', html)


FINAIS = {'v11-confirmacao-geral.html': 'geral', 'v12-confirmacao-institucional.html': 'institucional'}

if __name__ == '__main__':
    docs = {}
    for nome, registo in FINAIS.items():
        docs[nome] = confirmacao(CONFIRMACOES[registo])
        (AQUI / nome).write_text(docs[nome], encoding='utf-8')
        print(nome, len(docs[nome].encode('utf-8')), 'bytes')

    (AQUI / 'copiar-confirmacoes.html').write_text(pagina_copiar(
        docs, [('v11-confirmacao-geral.html', 'Confirmação geral (militantes)'),
               ('v12-confirmacao-institucional.html', 'Confirmação institucional')],
        'Copiar confirmações').replace('no convite que queres enviar', 'na confirmação que queres enviar'), encoding='utf-8')
    print('copiar-confirmacoes.html criado')
