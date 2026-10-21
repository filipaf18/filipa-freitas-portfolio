"""Email de follow-up · Jantar Comemorativo dos 50 anos da JSD Famalicão · últimos dias de inscrição.

Objetivo: reforçar o anúncio e converter em inscrições. Mensagem: as inscrições fecham a 4 de novembro; o menu; entrada
gratuita no Classe Bar para quem se inscrever no jantar; o jantar é aberto a militantes, antigos militantes,
simpatizantes e acompanhantes.

Usa as peças do convite do Politicamente Falando #02 (email/politicamente-falando-02/src/gerar.py), que seguem as
regras para sobreviver à colagem no Gmail: sem larguras em % no style, sem nowrap, filetes como bordas, nada que dependa
do atributo width das tabelas. Nenhuma imagem embutida nem com ligação.

Gera (a partir desta pasta): convite.html, copiar-email.html e apps-script/followup.html.
Uso: python3 src/gerar.py
"""
import importlib.util, pathlib, sys

AQUI = pathlib.Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location('base', AQUI.parent / 'politicamente-falando-02' / 'src' / 'gerar.py')
base = importlib.util.module_from_spec(_spec)
sys.modules['base'] = base
_spec.loader.exec_module(base)
from base import (FONT, DEGRADE, LADO, ESCURO, TEXTO, MUTED, AZUL, LARANJA, FILETE, FORTE, PONTO, CORPO,
                  linha, traco, sem_rasto, texto_simples)

# ------------------------------------------------------------------ imagens (sempre por endereço, sem ligação)
COMMIT_IMAGENS = 'c798de20d31164d56a5cc29f750a589fe6e6e074'
PASTA_IMAGENS = f'https://raw.githubusercontent.com/filipaf18/filipa-freitas-portfolio/{COMMIT_IMAGENS}/email/jsd-50-anos-ultimas-inscricoes/imagens'
IMAGENS = {
    'banner': f'{PASTA_IMAGENS}/banner.jpg',               # 1200 × 400, o do convite dos 50 anos
    'menu': f'{PASTA_IMAGENS}/menu.jpg',                   # 1000 × 1333
    'classe': f'{PASTA_IMAGENS}/classe-bar-logo.png',      # fundo transparente
    'logo': 'https://jsdfamalicao.pt/convite/logo-50-anos.png',
}
LINK = 'https://jsdfamalicao.pt/50-anos#inscricao'
LINK_TXT = 'jsdfamalicao.pt/50-anos#inscricao'
SITE = 'https://jsdfamalicao.pt'
MAPA = 'https://www.google.com/maps/search/?api=1&amp;query=Av.+Visconde+de+Pindela+112,+4770-189+Cruz'

ASSUNTO = 'Inscrições abertas até 4 de novembro · Jantar dos 50 anos da JSD Famalicão'
PREHEADER = 'Última chamada: inscreve-te até 4 de novembro no Jantar Comemorativo dos 50 anos. Com menu, bar aberto e entrada gratuita no Classe Bar.'
ALT_MENU = ('Menu do Jantar Comemorativo, 50 anos JSD Famalicão. Aperitivos variados. Arroz de tamboril e camarão. '
            'Brás de bacalhau. Rojões à minhota. Frango à strogonoff. Buffet de sobremesas e bolo de aniversário. '
            'Jantar com bar aberto.')


def botao(cima, baixo):
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px {baixo}px {LADO}px; text-align:center;">
              <table class="btn-tabela" role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="{LARANJA}" style="background-color:{LARANJA}; background-image:linear-gradient(90deg,#F8B451 0%,{LARANJA} 100%); border-radius:4px; text-align:center;">
                    <a class="btn" href="{LINK}" style="display:inline-block; padding:17px 34px; font-family:{FONT}; font-size:14px; line-height:20px; font-weight:800; letter-spacing:1.5px; color:{ESCURO}; text-decoration:none; text-align:center;">INSCREVER-ME AGORA</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>''' + linha(f'Se o botão não abrir, usa esta ligação:<br><a href="{LINK}" style="color:#0B72B8; text-decoration:underline; word-break:break-all;">{LINK_TXT}</a>',
                           14, 0, f'font-size:12px; line-height:19px; color:{MUTED};', 'center', 't-ligacao')


def rotulo(texto, cima):
    return linha(sem_rasto(texto), cima, 0, f'font-size:12px; line-height:16px; font-weight:700; letter-spacing:4px; color:{AZUL};', 'center', 't-etiqueta')


def imagem(chave, largura, alt, cima, borda=False):
    raio = ' border-radius:6px;' if borda else ''
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px 0 {LADO}px; text-align:center;">
              <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:{largura}px; margin:0 auto;">
                <tr><td align="center" style="font-size:0; line-height:0; text-align:center;"><img src="{IMAGENS[chave]}" width="{largura}" alt="{alt}" style="display:block; max-width:100%; height:auto; border:0; outline:none;{raio} color:{ESCURO}; font-family:{FONT}; font-size:14px; line-height:20px;"></td></tr>
              </table>
            </td>
          </tr>'''


def dados():
    linha_css = f'text-align:center; font-family:{FONT}; font-size:15px; line-height:26px; color:{TEXTO};'
    return f'''
          <tr>
            <td class="px" style="padding:40px {LADO}px 0 {LADO}px;">
              <div style="border-top:1px solid {FILETE}; border-bottom:1px solid {FILETE}; padding:24px 0; text-align:center;">
                <div class="t-dados" style="{linha_css}"><strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong></div>
                <div class="t-dados" style="padding-top:3px; {linha_css}">19h00{PONTO}<strong {FORTE}>Sunset&nbsp;House</strong></div>
                <div class="t-dados" style="padding-top:3px; {linha_css}"><a href="{MAPA}" style="color:{MUTED}; text-decoration:underline;">Av.&nbsp;Visc.&nbsp;de&nbsp;Pindela&nbsp;112, 4770&#8209;189&nbsp;Cruz</a></div>
                <div class="t-dados" style="padding-top:3px; {linha_css}"><strong {FORTE}>35&nbsp;€</strong> por pessoa{PONTO}bar aberto</div>
              </div>
            </td>
          </tr>'''


def pagina():
    barra = f'''
    <tr>
      <td height="6" bgcolor="{LARANJA}" style="height:6px; font-size:6px; line-height:6px; background-color:{LARANJA}; background-image:{DEGRADE};">&nbsp;</td>
    </tr>'''
    estilo_img = f'border:0; outline:none; color:#FFFFFF; font-family:{FONT}; font-size:20px; line-height:28px; text-align:center;'
    corpo = ''.join([
        rotulo('ÚLTIMOS DIAS', 44),
        linha('Inscrições abertas<br>até 4&nbsp;de&nbsp;novembro', 14, 0,
              f'font-size:26px; line-height:34px; font-weight:700; color:{ESCURO};', 'center', 't-titulo'),
        traco(24, 0),
        linha('Caro(a) companheiro(a),', 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        linha(f'Falta pouco para o <strong {FORTE}>Jantar Comemorativo</strong> dos 50&nbsp;anos da JSD Famalicão, '
              f'no <strong {FORTE}>sábado, 7&nbsp;de&nbsp;novembro</strong>. As inscrições fecham na '
              f'<strong {FORTE}>quarta-feira, 4&nbsp;de&nbsp;novembro</strong>, por isso o momento de garantires o teu lugar é agora.', 12, 0),
        linha(f'O jantar é <strong {FORTE}>aberto a todos</strong>: militantes, antigos militantes, simpatizantes e '
              'acompanhantes. Convida quem quiseres e vem celebrar connosco meio século de pessoas, ideias e causas.', 16, 0),
        botao(28, 0),
        rotulo('O MENU', 52),
        imagem('menu', 480, ALT_MENU, 20, borda=True),
        linha('Um jantar a pensar em todos, com <strong ' + FORTE + '>bar aberto</strong> do início ao fim.', 20, 0,
              f'font-size:15px; line-height:24px; color:{TEXTO};', 'center', 't-dados'),
        rotulo('E DEPOIS DO JANTAR', 52),
        imagem('classe', 220, 'Classe Bar', 20),
        linha(f'A noite não acaba à sobremesa. Quem se inscrever no jantar tem <strong {FORTE}>entrada gratuita no '
              f'Classe&nbsp;Bar</strong>, a partir das <strong {FORTE}>01h30</strong>.', 16, 0,
              f'font-size:16px; line-height:27px; color:{TEXTO};', 'center'),
        dados(),
        botao(32, 0),
        linha('A inscrição é individual e só fica válida depois de confirmado o pagamento.', 16, 44,
              f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
    ])
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>{ASSUNTO}</title>
  <style>
    /* Em ecrãs até 600 px (telemóveis) a letra aumenta. As medidas inline continuam a ser a base. */
    body {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
    :root {{ color-scheme:light only; supported-color-schemes:light only; }}
    a[x-apple-data-detectors] {{ color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; }}
    @media only screen and (max-width:600px) {{
      .px          {{ padding-left:22px !important; padding-right:22px !important; }}
      .t-etiqueta  {{ font-size:13px !important; line-height:18px !important; }}
      .t-titulo    {{ font-size:26px !important; line-height:34px !important; }}
      .t-corpo     {{ font-size:18px !important; line-height:30px !important; }}
      .t-dados     {{ font-size:17px !important; line-height:28px !important; }}
      .t-nota      {{ font-size:15px !important; line-height:24px !important; }}
      .t-ligacao   {{ font-size:14px !important; line-height:22px !important; }}
      .t-rodape    {{ font-size:14px !important; line-height:22px !important; }}
      .t-rodape-p  {{ font-size:13px !important; line-height:20px !important; }}
      .btn-tabela  {{ width:100% !important; }}
      .btn         {{ display:block !important; padding:19px 12px !important; font-size:16px !important; }}
    }}
  </style>
</head>

<!-- Gerado por src/gerar.py. Banner e barras a toda a largura; texto numa coluna de até 1040 px. -->

<body style="margin:0; padding:0; background-color:#FFFFFF;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#FFFFFF;">
    {PREHEADER}
    &#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="min-width:100%; background-color:#FFFFFF; font-family:{FONT}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; color-scheme:light only;">

    <tr>
      <td align="center" bgcolor="#554835" style="background-color:#554835; font-size:0; line-height:0; text-align:center;">
        <img src="{IMAGENS['banner']}" width="640" alt="Jantar Comemorativo. 50 anos JSD Famalicão."
             style="display:block; min-width:100%; max-width:100%; height:auto; {estilo_img}">
      </td>
    </tr>{barra}

    <tr>
      <td style="padding:0;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:1040px; margin:0 auto;">
{corpo}
        </table>
      </td>
    </tr>
{barra}

    <tr>
      <td class="px" align="center" bgcolor="#F5F7FA" style="background-color:#F5F7FA; padding:36px {LADO}px 32px {LADO}px; font-family:{FONT}; text-align:center;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr><td align="center" style="font-size:0; line-height:0; text-align:center;"><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="font-size:0; line-height:0;"><img src="{IMAGENS['logo']}" width="170" alt="50 anos JSD Famalicão" style="display:block; width:170px; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:16px; line-height:22px;"></td></tr></table></td></tr>
          <tr><td class="t-rodape" align="center" style="padding-top:22px; font-family:{FONT}; font-size:12px; line-height:19px; color:{MUTED}; text-align:center;">Juventude Social Democrata de Vila&nbsp;Nova de&nbsp;Famalicão<br><a href="{SITE}" style="color:{ESCURO}; text-decoration:underline;">jsdfamalicao.pt</a></td></tr>
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:{MUTED}; text-align:center;">Recebes este email por fazeres parte da história da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>
        </table>
      </td>
    </tr>

  </table>

</body>
</html>
'''


if __name__ == '__main__':
    html = pagina()
    assert 'data:image' not in html
    (AQUI / 'apps-script').mkdir(exist_ok=True)
    (AQUI / 'convite.html').write_text(html, encoding='utf-8')
    (AQUI / 'apps-script' / 'followup.html').write_text(html, encoding='utf-8')
    base.CONVITES = {'followup': dict(rotulo='Follow-up · últimas inscrições', assunto=ASSUNTO)}
    (AQUI / 'copiar-email.html').write_text(base.pagina_copiar({'followup': html}).replace('Politicamente Falando #02', 'Follow-up dos 50 anos'), encoding='utf-8')
    print(f'convite.html: {len(html.encode()) // 1024} KB · copiar-email.html')
