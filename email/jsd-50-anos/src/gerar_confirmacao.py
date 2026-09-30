"""Terceiro email: confirmação da inscrição + dress code (em texto, dentro do corpo do email).
v11 (geral) e v12 (institucional). Mesma base visual dos convites v7/v8 e do lembrete v9/v10.

Três formas de apresentar o dress code (variante):
  a  paleta desenhada com cores + looks em texto + 3 regras  → v11 e v12  (RECOMENDADA)
  b  paleta + 4 fotografias do guia                          → confirmacao-opcoes/opcao-b-com-fotografias.html
  c  só o essencial: paleta + 1 frase + ligação ao guia      → confirmacao-opcoes/opcao-c-essencial-e-guia.html

Porque é que a A não leva fotografias: o convite já tem ~90 KB e o Gmail corta a mensagem a partir de ~102 KB;
cada fotografia do guia pesa 30–60 KB. A paleta é só cor (células de tabela): custo de bytes quase zero.

Uso: python3 src/gerar_confirmacao.py  (a partir de email/jsd-50-anos/)
Nota: importar gerar_final volta a gerar v7/v8 e copiar-convites.html (saída idêntica).
"""
import base64, re
from gerar_final import *          # comum.py, mote(), MUTED, MAPA_LINK, ASSINATURA, pagina_copiar…

# A CONFIRMAR: endereço onde o guia completo (os 11 diapositivos com fotografias) vai ficar publicado.
GUIA = 'https://jsdfamalicao.pt/50-anos/dress-code'
GUIA_TEXTO = 'jsdfamalicao.pt/50-anos/dress-code'
SITE_50 = 'https://jsdfamalicao.pt/50-anos'     # o banner leva ao site (já não há nada para «inscrever»)

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

# ------------------------------------------------------------------ looks (do guia)
ELAS = [('Vestido azul-marinho', ['acessórios dourados']),
        ('Conjunto castanho', ['top bege', 'bolsa camel']),
        ('Blusa off-white', ['calças bege', 'sapatos dourados']),
        ('Vestido preto', ['pashmina laranja queimado', 'clutch dourada'])]
ELES = [('Fato azul-marinho', ['camisa branca', 'gravata']),
        ('Fato preto', ['gola alta']),
        ('Blazer castanho', ['calças azuis', 'gola alta']),
        ('Fato bege', ['camisa branca', 'sapatos castanhos'])]
INTRO_ELAS = 'Vestidos longos e conjuntos de corte impecável, sempre com um acessório que acende o look.'
INTRO_ELES = 'Fato ou blazer, com ou sem gravata. A gola alta é uma alternativa elegante.'
REGRAS = [('Conforto de inverno.', 'Tecidos mais quentes e camadas elegantes; um casaco ou um cachecol aquecem no final da noite.'),
          ('Tecidos nobres.', 'Seda, veludo, lã e caxemira elevam até o look mais simples.'),
          ('Equilíbrio.', 'Elegância sem exagero, à medida de um jantar entre amigos.')]

FOTOS = [('elas-azul-marinho', 'Vestido azul-marinho', '+ acessórios dourados'),
         ('elas-castanho', 'Conjunto castanho', '+ top bege + bolsa camel'),
         ('eles-azul-marinho', 'Fato azul-marinho', '+ camisa branca + gravata'),
         ('eles-blazer-castanho', 'Blazer castanho', '+ calças azuis + gola alta')]

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
    cel = lambda html, cima: (f'''
          <tr>
            <td class="px" style="padding:{cima}px {LADO}px 0px {LADO}px;">
              {html}
            </td>
          </tr>''')
    return (sub('Tons base', 32, 0, 'left') + cel(base, 12) +
            sub('Apontamentos', 28, 0, 'left') + cel(acentos, 12))


def look(nome, resto):
    partes = ''.join(f'<span style="color:#F86420;"> +&nbsp;</span>{p}' for p in resto)
    return f'<div style="padding-top:10px;"><strong {FORTE}>{nome}</strong>{partes}</div>'


def looks(titulo, intro, itens):
    return (sub(titulo, 40, 0) +
            linha(intro, 10, 4, 'font-size:15px; line-height:24px; color:#6B6054;', 'center', 't-nota') +
            linha(''.join(look(n, r) for n, r in itens), 0, 0, 'font-size:16px; line-height:25px; color:#3E352B;', 'center', 't-look'))


def regras():
    return sub('Para acertar', 40, 4) + linha(
        ''.join(f'<div style="padding-top:10px;"><strong {FORTE}>{t}</strong> {d}</div>' for t, d in REGRAS),
        0, 0, 'font-size:15px; line-height:24px; color:#3E352B;', 'center', 't-nota')


def fotos(itens, cima):
    """Duas fotografias lado a lado, com legenda. Limitadas a 480 px (as miniaturas têm 220 px de largura)."""
    cel = []
    for ficheiro, nome, resto in itens:
        b64 = base64.b64encode((AQUI / 'dresscode' / f'{ficheiro}.jpg').read_bytes()).decode()
        cel.append(f'''<td width="48%" valign="top" align="center" style="width:48%; font-family:{FONT}; text-align:center;">
                    <img src="data:image/jpeg;base64,{b64}" width="220" alt="{nome} {resto[2:]}" style="display:block; min-width:100%; max-width:100%; height:auto; border:0; border-radius:4px;">
                    <span class="t-pal" style="display:block; padding-top:10px; font-size:13px; line-height:19px; color:{MUTED};"><strong style="color:{ESCURO};">{nome}</strong><br>{resto}</span>
                  </td>''')
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px 0px {LADO}px;">
              <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
                <tr>
                  {cel[0]}
                  <td width="4%" style="width:4%; font-size:0; line-height:0;">&nbsp;</td>
                  {cel[1]}
                </tr>
              </table>
            </td>
          </tr>'''


def seccao_dresscode(t, variante):
    cab = (linha('DRESS CODE', 48, 0, ETIQUETA, 'center', 't-etiqueta') +
           linha('Elegância, tradição e futuro', 14, 0,
                 f'font-size:22px; line-height:30px; font-weight:300; letter-spacing:0.5px; color:{ESCURO}; text-transform:uppercase;', 'center', 't-sec') +
           linha('Tons clássicos e sofisticados, com apontamentos de cor para um toque de personalidade.', 14, 0, CORPO, 'center'))
    pormenor = 'Num pormenor (um lenço, uma clutch, uma joia) ou numa única peça-chave.'
    essencial = linha(t['essencial'], 44 if variante != 'b' else 40, 0,
                      f'font-size:20px; line-height:30px; font-weight:300; color:{ESCURO};', 'center', 't-citacao')
    if variante == 'a':
        return cab + paleta(pormenor) + looks('Para elas', INTRO_ELAS, ELAS) + looks('Para eles', INTRO_ELES, ELES) + regras() + essencial
    if variante == 'b':
        return (cab + paleta(pormenor) + sub('Para elas', 44, 0) + fotos(FOTOS[:2], 14) +
                sub('Para eles', 36, 0) + fotos(FOTOS[2:], 14) + essencial)
    return cab + paleta('Um só apontamento de laranja queimado ou dourado é quanto basta.') + essencial


def confirmacao(t, variante='a'):
    corpo = ''.join([
        cabecalho('JANTAR COMEMORATIVO', 'Inscrição confirmada'),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        dados_confirmacao(),
        seccao_dresscode(t, variante),
        botao('VER O GUIA COMPLETO', 32, 0, 'Com fotografias e mais combinações:', baixo_ligacao=0, link=GUIA, texto_link=GUIA_TEXTO),
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
ALTERNATIVAS = {'confirmacao-opcoes/opcao-b-com-fotografias.html': 'b', 'confirmacao-opcoes/opcao-c-essencial-e-guia.html': 'c'}

if __name__ == '__main__':
    (AQUI / 'confirmacao-opcoes').mkdir(exist_ok=True)
    docs = {}
    for nome, registo in FINAIS.items():
        docs[nome] = confirmacao(CONFIRMACOES[registo])
        (AQUI / nome).write_text(docs[nome], encoding='utf-8')
        print(nome, len(docs[nome].encode('utf-8')), 'bytes')
    for nome, variante in ALTERNATIVAS.items():          # alternativas para comparar (só no registo geral)
        html = confirmacao(CONFIRMACOES['geral'], variante)
        (AQUI / nome).write_text(html, encoding='utf-8')
        print(nome, len(html.encode('utf-8')), 'bytes')

    (AQUI / 'copiar-confirmacoes.html').write_text(pagina_copiar(
        docs, [('v11-confirmacao-geral.html', 'Confirmação geral (militantes)'),
               ('v12-confirmacao-institucional.html', 'Confirmação institucional')],
        'Copiar confirmações').replace('no convite que queres enviar', 'na confirmação que queres enviar'), encoding='utf-8')
    print('copiar-confirmacoes.html criado')
