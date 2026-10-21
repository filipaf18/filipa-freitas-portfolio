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
COMMIT_IMAGENS = '213aef5628d4d71de076a4b38431e48593f2542e'
PASTA_IMAGENS = f'https://raw.githubusercontent.com/filipaf18/filipa-freitas-portfolio/{COMMIT_IMAGENS}/email/jsd-50-anos-ultimas-inscricoes/imagens'
IMAGENS = {
    'banner': f'{PASTA_IMAGENS}/banner.jpg',               # 1200 × 400, o do convite dos 50 anos
    'classe': f'{PASTA_IMAGENS}/classe-bar-logo.png',
    'mesa': f'{PASTA_IMAGENS}/mesa.png',                   # ilustração da mesa do menu, fundo transparente      # fundo transparente
    'logo': 'https://jsdfamalicao.pt/convite/logo-50-anos.png',
}
LINK = 'https://jsdfamalicao.pt/50-anos#inscricao'
LINK_TXT = 'jsdfamalicao.pt/50-anos#inscricao'
SITE = 'https://jsdfamalicao.pt'
MAPA = 'https://www.google.com/maps/search/?api=1&amp;query=Av.+Visconde+de+Pindela+112,+4770-189+Cruz'

ASSUNTO = 'Inscrições abertas até 4 de novembro · Jantar dos 50 anos da JSD Famalicão'
PREHEADER = 'Não precisas de ser militante. Inscrições até 4 de novembro: menu, bar aberto e entrada gratuita no Classe Bar.'


NAVY, PRETO, CLARO = '#FFFFFF', '#FFFFFF', '#FFFFFF'
OURO = '#F86420'


def botao(cima, baixo, grande=True):
    pad, fs = ('21px 20px', 16) if grande else ('17px 20px', 14)
    return f"""
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px {baixo}px {LADO}px; text-align:center;">
              <table class="btn-tabela" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:340px; margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="{LARANJA}" style="background-color:{LARANJA}; background-image:linear-gradient(90deg,{OURO} 0%,{LARANJA} 100%); border-radius:6px; text-align:center;">
                    <a class="btn" href="{LINK}" style="display:inline-block; padding:{pad}; font-family:{FONT}; font-size:{fs}px; line-height:22px; font-weight:800; letter-spacing:1.5px; color:{PRETO}; text-decoration:none; text-align:center;">INSCREVER-ME AGORA</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>"""


def ligacao(cor, cima=14):
    return linha(f'<a href="{LINK}" style="color:{cor}; text-decoration:underline; word-break:break-all;">{LINK_TXT}</a>',
                 cima, 0, f'font-size:12px; line-height:19px; color:{cor};', 'center', 't-ligacao')


def banda(bg, linhas, largura=600):
    """Faixa a toda a largura com uma coluna central."""
    return f"""
    <tr>
      <td bgcolor="{bg}" style="background-color:{bg}; padding:0;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:{largura}px; margin:0 auto;">{''.join(linhas)}
        </table>
      </td>
    </tr>"""


def rotulo(texto, cima, cor=AZUL):
    return linha(sem_rasto(texto), cima, 0, f'font-size:12px; line-height:16px; font-weight:700; letter-spacing:4px; color:{cor};', 'center', 't-etiqueta')


def imagem(chave, largura, alt, cima, borda=False):
    raio = ' border-radius:8px;' if borda else ''
    return f"""
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px 0 {LADO}px; text-align:center;">
              <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:{largura}px; margin:0 auto;">
                <tr><td align="center" style="font-size:0; line-height:0; text-align:center;"><img src="{IMAGENS[chave]}" width="{largura}" alt="{alt}" style="display:block; max-width:100%; height:auto; border:0; outline:none;{raio} color:{ESCURO}; font-family:{FONT}; font-size:14px; line-height:20px;"></td></tr>
              </table>
            </td>
          </tr>"""


def pagina():
    barra = f"""
    <tr>
      <td height="6" bgcolor="{LARANJA}" style="height:6px; font-size:6px; line-height:6px; background-color:{LARANJA}; background-image:{DEGRADE};">&nbsp;</td>
    </tr>"""
    estilo_img = f'border:0; outline:none; color:#FFFFFF; font-family:{FONT}; font-size:20px; line-height:28px; text-align:center;'
    branco, suave = '#14181F', '#646B75'
    hero = banda(NAVY, [
        rotulo('ÚLTIMOS DIAS', 32, AZUL),
        linha(f'Inscrições até<br><span style="color:{OURO};">4&nbsp;de&nbsp;novembro</span>', 10, 0,
              f'font-size:26px; line-height:34px; font-weight:800; color:{branco};', 'center', 't-titulo'),
        linha(f'Jantar dos 50&nbsp;anos{PONTO}sábado, 7&nbsp;de&nbsp;novembro{PONTO}19h00', 8, 0,
              f'font-size:15px; line-height:24px; color:{suave};', 'center', 't-dados'),
        botao(20, 32),
    ])
    aberto = banda('#FFFFFF', [
        linha('Não precisas de ser militante da&nbsp;JSD.', 30, 0,
              f'font-size:22px; line-height:30px; font-weight:800; color:{ESCURO};', 'center', 't-lead'),
        linha('Militantes, antigos militantes, simpatizantes e acompanhantes são todos bem-vindos.', 8, 0,
              f'font-size:16px; line-height:25px; color:{TEXTO};', 'center', 't-dados'),
        linha(f'<strong {FORTE}>35&nbsp;€</strong> por pessoa{PONTO}bar aberto', 8, 30,
              f'font-size:16px; line-height:26px; color:{TEXTO};', 'center', 't-dados'),
    ])

    def prato(txt):
        return (f'<tr><td class="t-dados" style="padding:6px 0; font-family:{FONT}; font-size:16px; line-height:22px; font-weight:800; '
                f'color:{ESCURO}; text-align:left;"><span style="color:{LARANJA};">&bull;</span>&nbsp; {txt}</td></tr>')
    cartao = f"""
          <tr>
            <td class="px" style="padding:14px {LADO}px 0 {LADO}px;">
              <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; margin:0 auto;">
                <tr>
                  <td width="52%" valign="middle" align="left" style="text-align:left;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      {prato('Arroz de tamboril e camarão')}{prato('Brás de bacalhau')}{prato('Rojões à minhota')}{prato('Frango à strogonoff')}
                    </table>
                  </td>
                  <td width="48%" valign="middle" align="right" style="font-size:0; line-height:0; text-align:right;">
                    <img src="{IMAGENS['mesa']}" width="200" alt="" style="display:block; max-width:100%; height:auto; border:0; outline:none; margin-left:auto;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>"""
    menu = banda('#FFFFFF', [
        rotulo('O MENU', 30),
        cartao,
        linha('+ aperitivos, sobremesas e bolo de aniversário', 8, 30, f'font-size:14px; line-height:22px; color:{MUTED};', 'center', 't-nota'),
    ])
    classe = banda('#FFFFFF', [
        rotulo('AFTER PARTY', 30, AZUL),
        imagem('classe', 150, 'Classe Bar', 12),
        linha(f'Entrada <span style="color:{OURO};">gratuita</span> para quem se inscrever', 12, 0,
              f'font-size:20px; line-height:28px; font-weight:800; color:{branco};', 'center', 't-lead'),
        linha('Classe&nbsp;Bar, a partir das 01h30', 6, 30, f'font-size:15px; line-height:24px; color:{suave};', 'center', 't-dados'),
    ])
    final = banda('#FFFFFF', [
        botao(30, 0),
        ligacao(AZUL, 14),
        linha(f'Sunset&nbsp;House{PONTO}<a href="{MAPA}" style="color:{suave}; text-decoration:underline;">Av. Visc. de Pindela 112, Cruz</a>', 18, 0,
              f'font-size:13px; line-height:21px; color:{suave};', 'center', 't-nota'),
        linha('A inscrição só fica válida depois de confirmado o pagamento.', 4, 32, f'font-size:13px; line-height:21px; color:{suave};', 'center', 't-nota'),
    ])
    return f"""<!DOCTYPE html>
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
      .t-titulo    {{ font-size:30px !important; line-height:38px !important; }}
      .t-lead      {{ font-size:24px !important; line-height:32px !important; }}
      .t-prazo     {{ font-size:46px !important; line-height:52px !important; }}
      .t-dados     {{ font-size:17px !important; line-height:28px !important; }}
      .t-nota      {{ font-size:14px !important; line-height:22px !important; }}
      .t-ligacao   {{ font-size:14px !important; line-height:22px !important; }}
      .t-rodape    {{ font-size:14px !important; line-height:22px !important; }}
      .btn-tabela  {{ width:100% !important; }}
      .btn         {{ display:block !important; padding:21px 12px !important; font-size:16px !important; }}
    }}
  </style>
</head>

<!-- Gerado por src/gerar.py. Fundo branco, separadores em degradê; texto numa coluna de até 600 px. -->

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
    </tr>{barra}{hero}{aberto}{barra}{menu}{barra}{classe}{barra}{final}{barra}

    <tr>
      <td class="px" align="center" bgcolor="{CLARO}" style="background-color:{CLARO}; padding:18px {LADO}px 20px {LADO}px; font-family:{FONT}; text-align:center;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr><td align="center" style="font-size:0; line-height:0; text-align:center;"><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="font-size:0; line-height:0;"><img src="{IMAGENS['logo']}" width="64" alt="50 anos JSD Famalicão" style="display:block; width:64px; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:14px; line-height:20px;"></td></tr></table></td></tr>
          <tr><td class="t-rodape" align="center" style="padding-top:14px; font-family:{FONT}; font-size:12px; line-height:19px; color:{MUTED}; text-align:center;">JSD Famalicão{PONTO}Se não quiseres receber mais mensagens, responde a este email.</td></tr>
        </table>
      </td>
    </tr>

  </table>

</body>
</html>
"""


if __name__ == '__main__':
    html = pagina()
    assert 'data:image' not in html
    (AQUI / 'apps-script').mkdir(exist_ok=True)
    (AQUI / 'convite.html').write_text(html, encoding='utf-8')
    (AQUI / 'apps-script' / 'followup.html').write_text(html, encoding='utf-8')
    base.CONVITES = {'followup': dict(rotulo='Follow-up · últimas inscrições', assunto=ASSUNTO)}
    (AQUI / 'copiar-email.html').write_text(base.pagina_copiar({'followup': html}).replace('Politicamente Falando #02', 'Follow-up dos 50 anos'), encoding='utf-8')
    print(f'convite.html: {len(html.encode()) // 1024} KB · copiar-email.html')
