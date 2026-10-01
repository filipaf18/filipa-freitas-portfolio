"""Terceiro email: confirmação da inscrição + informações sobre o evento (dress code e after party).
v11 (geral) e v12 (institucional). Mesma base visual dos convites v7/v8 e do lembrete v9/v10.

Ordem: banner «Jantar Comemorativo» e «INSCRIÇÃO CONFIRMADA» (como «CONVITE» nos convites v7/v8) → saudação e 2 parágrafos → data, hora e local entre dois filetes →
MAIS INFORMAÇÕES: imagem do dress code (dresscode/dresscode-casual-chic.jpg, fornecida) com a descrição em texto →
AFTER PARTY no Classe Bar (logo dresscode/classe-bar-logo.png, preparado por src/preparar_logo_classe.py) →
frase final, despedida, assinatura e mote.

A imagem do dress code tem as etiquetas da paleta muito pequenas (14 px num ficheiro de 1600 px): num telemóvel não se
leem. Por isso o texto por baixo repete a paleta por extenso, e o texto alternativo da imagem também.

Uso: python3 src/gerar_confirmacao.py  (a partir de email/jsd-50-anos/)
Nota: importar gerar_final volta a gerar v7/v8 e copiar-convites.html (saída idêntica).
"""
import base64, re
from gerar_final import *          # comum.py, mote(), MUTED, MAPA_LINK, ASSINATURA, pagina_copiar…

SITE_50 = 'https://jsdfamalicao.pt/50-anos'     # o banner leva ao site (já não há nada para «inscrever»)

# Por omissão as imagens vão embutidas no HTML (como o banner e o logo). Se, num envio de teste, o Gmail cortar a
# mensagem ou as imagens não aparecerem, publicar os ficheiros de dresscode/ (dresscode-casual-chic.jpg e
# classe-bar-logo.png) num endereço público e pôr aqui a pasta, por exemplo 'https://jsdfamalicao.pt/50-anos/dresscode'.
# O HTML passa a referir as imagens por endereço e fica leve.
IMAGENS_URL = None

# ------------------------------------------------------------------ textos (registo geral e institucional)
INFO = 'Ficam aqui os dados do jantar e mais algumas informações: o dress code e a after party.'
CONFIRMACOES = {
    'geral': dict(
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            f'A tua inscrição no Jantar Comemorativo dos <strong {FORTE}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão está <strong {FORTE}>confirmada</strong>. '
            'Já tens lugar garantido e contamos contigo!',
            INFO,
        ],
        essencial='O essencial é sentir-te bem e celebrar connosco.',
        despedida='Até lá,',
        nota='Qualquer dúvida, responde a este email.',
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62; text-align:center;">Recebes este email por te teres inscrito no Jantar Comemorativo dos 50 anos da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
        preheader='A tua inscrição está confirmada. Sábado, 7 de novembro, 19h00, Sunset House. Dress code e after party.',
    ),
    'institucional': dict(
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            f'A sua inscrição no Jantar Comemorativo dos <strong {FORTE}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão está <strong {FORTE}>confirmada</strong>. '
            'Será uma honra contar consigo!',
            INFO,
        ],
        essencial='O essencial é sentir-se bem e celebrar connosco.',
        despedida='Com os melhores cumprimentos,',
        nota='Para qualquer esclarecimento, responda a este email.',
        rodape_extra='',
        preheader='A sua inscrição está confirmada. Sábado, 7 de novembro, 19h00, Sunset House. Dress code e after party.',
    ),
}

ALT_DRESSCODE = ('Dress code: Casual Chic. Tons base: castanho, bege, azul-marinho, preto e branco. '
                 'Apontamentos de cor: laranja queimado e dourado.')

# ------------------------------------------------------------------ blocos
CSS = '''
      .t-mote      { font-size:28px !important; line-height:36px !important; }
      .t-sub       { font-size:12px !important; line-height:18px !important; }'''


def sub(texto, cima, baixo=0, alinhar='center'):
    """Subtítulo pequeno, em maiúsculas espaçadas."""
    return linha(sem_rasto(texto) if alinhar == 'center' else texto, cima, baixo,
                 f'font-size:11px; line-height:16px; font-weight:700; letter-spacing:3px; color:{MUTED}; text-transform:uppercase;',
                 alinhar, 't-sub')


def dados_confirmacao():
    """Data, hora, local e morada (o preço já não interessa: a inscrição está confirmada) entre dois filetes."""
    return filete(32, 0) + linha(
        f'<strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong><br>'
        f'19h00{PONTO}<strong {FORTE}>Sunset&nbsp;House</strong><br>'
        f'{MAPA_LINK}',
        24, 24, 'font-size:15px; line-height:29px; color:#3E352B;', 'center', 't-dados') + filete()


def _src(ficheiro):
    if IMAGENS_URL:
        return f'{IMAGENS_URL.rstrip("/")}/{ficheiro}'
    tipo = 'jpeg' if ficheiro.endswith('.jpg') else 'png'
    return f'data:image/{tipo};base64,' + base64.b64encode((AQUI / 'dresscode' / ficheiro).read_bytes()).decode()


def imagem_dresscode(cima):
    """A imagem do dress code ocupa a largura da coluna de texto (992 px no computador, a largura do ecrã no telemóvel).
    width numérico + min/max-width:100% sobrevive ao Ctrl+C do Chrome e à colagem no Gmail (ver LEIA-ME)."""
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px 0px {LADO}px; font-size:0; line-height:0; text-align:center;">
              <img src="{_src('dresscode-casual-chic.jpg')}" width="992" alt="{ALT_DRESSCODE}" style="display:block; min-width:100%; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:16px; line-height:24px;">
            </td>
          </tr>'''


def logo_classe(cima):
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px 0px {LADO}px; font-size:0; line-height:0; text-align:center;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="font-size:0; line-height:0; text-align:center;">
                <img src="{_src('classe-bar-logo.png')}" width="240" alt="Classe Bar" style="display:block; width:240px; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:24px; line-height:30px;">
              </td></tr></table>
            </td>
          </tr>'''


def informacoes(t):
    return ''.join([
        linha(sem_rasto('MAIS INFORMAÇÕES'), 48, 0, ETIQUETA, 'center', 't-etiqueta'),
        # dress code: a imagem traz o título; por baixo, o texto (a paleta lê-se mal na imagem em telemóvel)
        imagem_dresscode(24),
        linha('Elegância descontraída, em tons clássicos e com apontamentos de cor para um toque de personalidade.', 24, 0, CORPO, 'center'),
        linha(f'<strong {FORTE}>Tons base:</strong> castanho, bege, azul-marinho, preto e branco.<br>'
              f'<strong {FORTE}>Apontamentos de cor:</strong> laranja queimado e dourado.',
              12, 0, f'font-size:14px; line-height:24px; color:{MUTED};', 'center', 't-nota'),
        # after party
        filete(44, 0),
        sub('After party', 40, 0),
        logo_classe(16),
        linha(f'A noite continua no <strong {FORTE}>Classe&nbsp;Bar</strong>, a partir das <strong {FORTE}>01h30</strong>.<br>'
              'Entrada gratuita para todos os participantes.', 16, 0, CORPO, 'center'),
        linha(t['essencial'], 44, 0, f'font-size:20px; line-height:30px; font-weight:300; color:{ESCURO};', 'center', 't-citacao'),
    ])


def confirmacao(t):
    corpo = ''.join([
        cabecalho('INSCRIÇÃO CONFIRMADA', titulo=None, subtitulo=None),     # o banner já diz «Jantar Comemorativo · 50 Anos JSD Famalicão»
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        dados_confirmacao(),
        informacoes(t),
        filete(44, 0),
        linha(t['despedida'], 32, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        mote(),
        linha(t['nota'], 32, 44, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
    ])
    html = pagina('50 Anos JSD Famalicão · Inscrição confirmada', t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_confirmacao.py', banner_coluna=True, link_banner=SITE_50)
    # tirar a indentação não muda nada no ecrã e poupa alguns KB
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
