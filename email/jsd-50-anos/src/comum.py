"""Peças comuns a todos os convites (v2, v3, v4): página, banner, rodapé com logo, blocos de texto, botão.

Regras de construção, para sobreviver à colagem no Gmail e ao telemóvel:
- sem <style>: tudo inline (o Gmail descarta o <style> ao colar);
- cada bloco de texto é uma linha de tabela própria e os espaços são padding de <td>
  (nada de margin, que se perde ou colapsa conforme o cliente);
- nenhuma largura fixa em píxeis nos atributos: só 100% e max-width.
"""
import base64, pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent
BANNER = base64.b64encode((AQUI / 'banner-largo.jpg').read_bytes()).decode()
LOGO = base64.b64encode((AQUI / 'logo-50-anos.jpg').read_bytes()).decode()   # fundo #F8F8F8, igual ao do rodapé
LOGO_PNG = base64.b64encode((AQUI / 'logo-50-anos.png').read_bytes()).decode()   # fundo transparente, contorno claro nas letras
LINK = 'https://jsdfamalicao.pt/50-anos#inscricao'
MAPA = 'https://www.google.com/maps/search/?api=1&query=Av.+Visconde+de+Pindela+112,+4770-189+Cruz'
FONT = "Montserrat,'Helvetica Neue',Helvetica,Arial,sans-serif"
DEGRADE = 'linear-gradient(90deg,#0E87D9 0%,#1EBCE8 25%,#54CFC9 40%,#F8B451 60%,#F86420 100%)'

LADO = 24                      # margem lateral do texto (telemóvel e computador)
CORPO = 'font-size:16px; line-height:27px; color:#3E352B;'
ESCURO = '#1B130C'


def linha(html, cima=0, baixo=0, estilo=CORPO, alinhar='left', classe='t-corpo'):
    """Um bloco de texto = uma linha de tabela; o espaço vem do padding da célula."""
    return f'''
          <tr>
            <td class="px {classe}" align="{alinhar}" style="padding:{cima}px {LADO}px {baixo}px {LADO}px; font-family:{FONT}; {estilo} text-align:{alinhar};">{html}</td>
          </tr>'''


def filete(cima=0, baixo=0, cor='#E4D9CB'):
    return f'''
          <tr>
            <td class="px" style="padding:{cima}px {LADO}px {baixo}px {LADO}px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="1" bgcolor="{cor}" style="height:1px; background-color:{cor}; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>'''


def traco(cima=0, baixo=0):
    """Traço curto laranja, centrado."""
    return f'''
          <tr>
            <td align="center" style="padding:{cima}px {LADO}px {baixo}px {LADO}px;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr><td width="56" height="2" bgcolor="#F86420" style="width:56px; height:2px; background-color:#F86420; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>'''


def botao(texto, cima, baixo, alternativa='Se o botão não abrir, usa esta ligação:', baixo_ligacao=40):
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px {baixo}px {LADO}px;">
              <table class="btn-tabela" role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#F86420" style="background-color:#F86420; background-image:linear-gradient(90deg,#F8B451 0%,#F86420 100%); border-radius:4px;">
                    <a class="btn" href="{LINK}" style="display:inline-block; padding:17px 34px; font-family:{FONT}; font-size:14px; line-height:20px; font-weight:800; letter-spacing:1.5px; white-space:nowrap; color:{ESCURO}; text-decoration:none;">{texto}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>''' + linha(
        f'{alternativa}<br><a href="{LINK}" style="color:#0B72B8; text-decoration:underline;">jsdfamalicao.pt/50-anos#inscricao</a>',
        14, baixo_ligacao, 'font-size:12px; line-height:19px; color:#6B6054;', 'center', 't-ligacao')


def pagina(titulo, preheader, corpo, rodape_extra, largura=1040, css_extra='', claro_forcado=False, logo_png=False,
           gerador='src/gerar.py'):
    # claro_forcado: pede aos clientes que respeitam «color-scheme» (Apple Mail/iOS Mail, Outlook para iOS/macOS…)
    # que mostrem sempre a versão clara, mesmo com o telemóvel em modo noturno.
    esquema = 'light only' if claro_forcado else 'light'
    css_claro = ('\n    :root {{ color-scheme:light only; supported-color-schemes:light only; }}'.replace('{{', '{').replace('}}', '}')
                 if claro_forcado else '')
    logo_src = f'data:image/png;base64,{LOGO_PNG}' if logo_png else f'data:image/jpeg;base64,{LOGO}'
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="{esquema}">
  <meta name="supported-color-schemes" content="{esquema}">
  <title>{titulo}</title>
  <style>
    /* Responsivo: em ecrãs até 600 px (telemóveis) a letra aumenta e o botão ocupa a largura toda.
       As medidas inline continuam a ser a base (computador, ou clientes que ignoram este bloco). */
    body {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}{css_claro}
    @media only screen and (max-width:600px) {{
      .px          {{ padding-left:22px !important; padding-right:22px !important; }}
      .t-etiqueta  {{ font-size:13px !important; line-height:18px !important; }}
      .t-titulo    {{ font-size:30px !important; line-height:37px !important; }}
      .t-subtitulo {{ font-size:14px !important; line-height:22px !important; }}
      .t-lead      {{ font-size:24px !important; line-height:34px !important; }}
      .t-corpo     {{ font-size:18px !important; line-height:30px !important; }}
      .t-citacao   {{ font-size:20px !important; line-height:31px !important; }}
      .t-dados     {{ font-size:17px !important; line-height:31px !important; }}
      .t-nota      {{ font-size:15px !important; line-height:24px !important; }}
      .t-ligacao   {{ font-size:14px !important; line-height:22px !important; }}
      .t-rodape    {{ font-size:14px !important; line-height:22px !important; }}
      .t-rodape-p  {{ font-size:13px !important; line-height:20px !important; }}
      .btn-tabela  {{ width:100% !important; }}
      .btn         {{ display:block !important; padding:19px 12px !important; font-size:16px !important; }}{css_extra}
    }}
  </style>
</head>

<!-- Gerado por {gerador}. Banner e barras a toda a largura; texto numa coluna de até 1040 px.
     Espaços feitos com padding de células; o <style> acima só aumenta a letra em ecrãs até 600 px. -->

<body style="margin:0; padding:0; background-color:#FFFFFF;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#FFFFFF;">
    {preheader}
    &#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%; background-color:#FFFFFF;">

    <tr>
      <td bgcolor="#0A0701" style="background-color:#0A0701; font-size:0; line-height:0;">
        <a href="{LINK}" style="text-decoration:none;">
          <img src="data:image/jpeg;base64,{BANNER}" width="100%" alt="50 anos JSD Famalicão. Cinco décadas, uma identidade. 1976–2026."
               style="display:block; width:100%; max-width:100%; height:auto; border:0; outline:none; color:#FFFFFF; font-family:{FONT}; font-size:20px; line-height:28px; text-align:center;">
        </a>
      </td>
    </tr>

    <tr>
      <td height="6" bgcolor="#F86420" style="height:6px; font-size:0; line-height:0; background-color:#F86420; background-image:{DEGRADE};">&nbsp;</td>
    </tr>

    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:{largura}px;">
{corpo}
        </table>
      </td>
    </tr>

    <tr>
      <td height="6" bgcolor="#F86420" style="height:6px; font-size:0; line-height:0; background-color:#F86420; background-image:{DEGRADE};">&nbsp;</td>
    </tr>

    <tr>
      <td class="px" align="center" bgcolor="#F8F8F8" style="background-color:#F8F8F8; padding:36px {LADO}px 32px {LADO}px; font-family:{FONT}; text-align:center;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="font-size:0; line-height:0;"><img src="{logo_src}" width="170" alt="50 anos JSD Famalicão" style="display:block; margin:0 auto; width:170px; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:16px; line-height:22px;"></td></tr>
          <tr><td class="t-rodape" align="center" style="padding-top:22px; font-family:{FONT}; font-size:12px; line-height:19px; color:#6B6054;">Juventude Social Democrata de Vila&nbsp;Nova de&nbsp;Famalicão<br><a href="https://jsdfamalicao.pt" style="color:{ESCURO}; text-decoration:underline;">jsdfamalicao.pt</a></td></tr>{rodape_extra}
        </table>
      </td>
    </tr>

  </table>

</body>
</html>
'''


ETIQUETA = f'font-size:12px; line-height:16px; font-weight:700; letter-spacing:4px; color:#0B72B8;'

def cabecalho():
    """Título centrado, igual nas duas versões."""
    return ''.join([
        linha('CONVITE', 44, 0, ETIQUETA, 'center', 't-etiqueta'),
        linha('Jantar Comemorativo', 16, 0,
              f'font-size:26px; line-height:33px; font-weight:300; letter-spacing:0.5px; color:{ESCURO}; text-transform:uppercase;', 'center', 't-titulo'),
        linha('50.º Aniversário da JSD&nbsp;Famalicão', 10, 0,
              f'font-size:13px; line-height:21px; font-weight:700; letter-spacing:2px; color:{ESCURO}; text-transform:uppercase;', 'center', 't-subtitulo'),
        traco(24, 0),
    ])
FORTE = f'style="color:{ESCURO};"'
PONTO = '<span style="color:#F86420;">&nbsp;·&nbsp;</span>'

