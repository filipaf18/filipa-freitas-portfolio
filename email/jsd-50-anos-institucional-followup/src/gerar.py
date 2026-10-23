"""Email institucional de follow-up · Jantar Comemorativo dos 50 anos da JSD Famalicão.

Para o Presidente da Câmara e os Vereadores, que já receberam o convite. Reitera o convite e pede uma resposta:
- SIM: inscrição até 4 de novembro em jsdfamalicao.pt/50-anos#inscricao;
- NÃO: basta responder a este email.

Usa as peças do convite do Politicamente Falando #02 e as imagens (por endereço, sem ligações) do follow-up dos
militantes. Uso: python3 src/gerar.py  → convite.html, copiar-email.html, apps-script/followup_institucional.html
"""
import importlib.util, pathlib, sys

AQUI = pathlib.Path(__file__).resolve().parent.parent
EMAIL = AQUI.parent


def carregar(nome, ficheiro):
    spec = importlib.util.spec_from_file_location(nome, ficheiro)
    m = importlib.util.module_from_spec(spec); sys.modules[nome] = m; spec.loader.exec_module(m)
    return m


base = carregar('base', EMAIL / 'politicamente-falando-02' / 'src' / 'gerar.py')
fu = carregar('fu', EMAIL / 'jsd-50-anos-ultimas-inscricoes' / 'src' / 'gerar.py')
from base import (FONT, DEGRADE, LADO, ESCURO, TEXTO, MUTED, AZUL, LARANJA, FILETE, FORTE, PONTO, linha, traco, sem_rasto)

IMAGENS, LINK, LINK_TXT, SITE, MAPA = fu.IMAGENS, fu.LINK, fu.LINK_TXT, fu.SITE, fu.MAPA
ASSUNTO = 'Convite · Jantar Comemorativo dos 50 anos da JSD Famalicão · Pedido de resposta'
PREHEADER = 'Reiteramos o convite para 7 de novembro e agradecemos a sua resposta. Inscrição até 4 de novembro.'
ASSINATURA = 'Juventude Social Democrata de Vila Nova de&nbsp;Famalicão'

SAUDACAO = 'Estimado(a) companheiro(a),'
PARAGRAFOS = [
    f'Recentemente, a Juventude Social Democrata de Vila Nova de Famalicão teve a honra de o(a) convidar para o '
    f'<strong {FORTE}>Jantar Comemorativo dos 50&nbsp;anos da JSD Famalicão</strong>, que terá lugar no '
    f'<strong {FORTE}>sábado, 7&nbsp;de&nbsp;novembro, às&nbsp;19h00</strong>, na <strong {FORTE}>Sunset&nbsp;House</strong>.',
    'Até ao momento, não temos registo da sua inscrição nem de qualquer resposta ao nosso convite. Reiteramos, por isso, o desejo de '
    'contar com a sua presença numa noite que reunirá várias gerações e assinalará meio século de pessoas, ideias e causas.',
    f'<strong {FORTE}>Caso pretenda estar presente</strong>, a inscrição deve ser feita <strong {FORTE}>até ao dia 4&nbsp;de&nbsp;novembro</strong>, '
    f'em <a href="{LINK}" style="color:{AZUL}; text-decoration:underline; font-weight:700;">{LINK_TXT}</a>.',
    f'<strong {FORTE}>Caso não lhe seja possível comparecer</strong>, solicitamos que nos comunique a sua indisponibilidade '
    f'<strong {FORTE}>por escrito, respondendo a este email, até ao dia 4&nbsp;de&nbsp;novembro</strong>. '
    'A sua resposta por escrito, mesmo em caso negativo, é indispensável para a organização do evento, '
    'pelo que lhe ficaremos muito gratos pela sua colaboração.',
]


def botao(texto, cima, baixo):
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px {baixo}px {LADO}px; text-align:center;">
              <table class="btn-tabela" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:340px; margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="{LARANJA}" style="background-color:{LARANJA}; background-image:linear-gradient(90deg,#F8B451 0%,{LARANJA} 100%); border-radius:6px; text-align:center;">
                    <a class="btn" href="{LINK}" style="display:inline-block; padding:19px 20px; font-family:{FONT}; font-size:15px; line-height:22px; font-weight:800; letter-spacing:1.5px; color:{ESCURO}; text-decoration:none; text-align:center;">{texto}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>'''


def resposta(rotulo_cor, rotulo, titulo, corpo, extra=''):
    """Cartão de resposta: contorno na própria célula, texto centrado."""
    return f'''
          <tr>
            <td class="px" style="padding:16px {LADO}px 0 {LADO}px;">
              <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:552px; margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:2px solid {rotulo_cor}; border-radius:14px; text-align:center;">
                    <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                      {linha(sem_rasto(rotulo), 24, 0, f'font-size:13px; line-height:18px; font-weight:800; letter-spacing:4px; color:{rotulo_cor};', 'center', 't-etiqueta')}
                      {linha(titulo, 8, 0, f'font-size:19px; line-height:27px; font-weight:800; color:{ESCURO};', 'center', 't-lead2')}
                      {linha(corpo, 8, 0 if extra else 26, f'font-size:15px; line-height:24px; color:{TEXTO};', 'center', 't-dados')}{extra}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>'''


def dados():
    css = f'text-align:center; font-family:{FONT}; font-size:15px; line-height:26px; color:{TEXTO};'
    return f'''
          <tr>
            <td class="px" style="padding:36px {LADO}px 0 {LADO}px;">
              <div style="border-top:1px solid {FILETE}; border-bottom:1px solid {FILETE}; padding:22px 0; text-align:center;">
                <div class="t-dados" style="{css}"><strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong></div>
                <div class="t-dados" style="padding-top:3px; {css}">19h00{PONTO}<strong {FORTE}>Sunset&nbsp;House</strong></div>
                <div class="t-dados" style="padding-top:3px; {css}"><a href="{MAPA}" style="color:{MUTED}; text-decoration:underline;">Av. Visc. de Pindela 112, 4770&#8209;189 Cruz</a></div>
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
        linha(sem_rasto('LEMBRETE DE CONVITE'), 44, 0, f'font-size:12px; line-height:16px; font-weight:700; letter-spacing:4px; color:{AZUL};', 'center', 't-etiqueta'),
        traco(24, 0),
        linha(SAUDACAO, 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(PARAGRAFOS)],
        linha('Agradecemos desde já a sua atenção e a sua resposta.', 16, 0),
        linha('Com os melhores cumprimentos,', 24, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        dados(),
        linha('', 0, 44),
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
    body {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
    :root {{ color-scheme:light only; supported-color-schemes:light only; }}
    a[x-apple-data-detectors] {{ color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; }}
    @media only screen and (max-width:600px) {{
      .px          {{ padding-left:22px !important; padding-right:22px !important; }}
      .t-etiqueta  {{ font-size:13px !important; line-height:18px !important; }}
      .t-corpo     {{ font-size:18px !important; line-height:30px !important; }}
      .t-lead2     {{ font-size:20px !important; line-height:28px !important; }}
      .t-dados     {{ font-size:17px !important; line-height:28px !important; }}
      .t-ligacao   {{ font-size:14px !important; line-height:22px !important; }}
      .t-rodape    {{ font-size:14px !important; line-height:22px !important; }}
      .btn-tabela  {{ width:100% !important; }}
      .btn         {{ display:block !important; padding:21px 12px !important; font-size:16px !important; }}
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
      <td class="px" align="center" bgcolor="#F5F7FA" style="background-color:#F5F7FA; padding:28px {LADO}px 26px {LADO}px; font-family:{FONT}; text-align:center;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr><td align="center" style="font-size:0; line-height:0; text-align:center;"><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="font-size:0; line-height:0;"><img src="{IMAGENS['logo']}" width="120" alt="50 anos JSD Famalicão" style="display:block; width:120px; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:16px; line-height:22px;"></td></tr></table></td></tr>
          <tr><td class="t-rodape" align="center" style="padding-top:16px; font-family:{FONT}; font-size:12px; line-height:19px; color:{MUTED}; text-align:center;">Juventude Social Democrata de Vila&nbsp;Nova de&nbsp;Famalicão<br><a href="{SITE}" style="color:{ESCURO}; text-decoration:underline;">jsdfamalicao.pt</a></td></tr>
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
    (AQUI / 'convite.html').write_text(html, encoding='utf-8')
    (AQUI / 'apps-script' / 'followup_institucional.html').write_text(html, encoding='utf-8')
    base.CONVITES = {'followup': dict(rotulo='Follow-up institucional · 50 anos', assunto=ASSUNTO)}
    (AQUI / 'copiar-email.html').write_text(base.pagina_copiar({'followup': html}).replace('Politicamente Falando #02', 'Follow-up institucional dos 50 anos'), encoding='utf-8')
    print(f'convite.html: {len(html.encode()) // 1024} KB')
