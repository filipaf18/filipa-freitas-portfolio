"""Gera as duas versões do convite (geral e institucional) com o banner embutido.
Uso: python3 src/gerar.py  (a partir de email/jsd-50-anos/)"""
import base64, pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent
BANNER = base64.b64encode((AQUI / 'banner-largo.jpg').read_bytes()).decode()
LINK = 'https://jsdfamalicao.pt/50-anos#inscricao'
FONT = "Montserrat,'Helvetica Neue',Helvetica,Arial,sans-serif"
DEGRADE = 'linear-gradient(90deg,#0E87D9 0%,#1EBCE8 25%,#54CFC9 40%,#F8B451 60%,#F86420 100%)'

def pagina(titulo, preheader, corpo, botao, notas, rodape_extra):
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>{titulo}</title>
</head>

<!-- Largura total: o banner e as barras ocupam o ecrã todo; o texto fica numa coluna
     de até 720 px (fundo branco dos dois lados, sem caixa nem margens cinzentas).
     Sem <style>: todas as medidas estão inline e servem telemóvel e computador,
     porque o Gmail descarta o <style> ao colar. O banner vai embutido em base64 (banner-largo.jpg). Gerado por src/gerar.py. -->

<body style="margin:0; padding:0; background-color:#FFFFFF;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#FFFFFF;">
    {preheader}
    &#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%; background-color:#FFFFFF;">

    <!-- Banner (largura total) -->
    <tr>
      <td bgcolor="#0A0701" style="background-color:#0A0701; font-size:0; line-height:0;">
        <a href="{LINK}" style="text-decoration:none;">
          <img src="data:image/jpeg;base64,{BANNER}" width="1200" alt="50 anos JSD Famalicão. Cinco décadas, uma identidade. 1976–2026."
               style="display:block; width:100%; height:auto; border:0; outline:none; color:#FFFFFF; font-family:{FONT}; font-size:20px; line-height:28px; text-align:center;">
        </a>
      </td>
    </tr>

    <tr>
      <td height="6" bgcolor="#F86420" style="height:6px; font-size:0; line-height:0; background-color:#F86420; background-image:{DEGRADE};">&nbsp;</td>
    </tr>

    <!-- Conteúdo -->
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:720px;">
{corpo}

          <!-- Botão -->
          <tr>
            <td class="px" align="center" style="padding:4px 24px 12px 24px;">
              <table class="btn-table" role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#F86420" style="background-color:#F86420; background-image:linear-gradient(90deg,#F8B451 0%,#F86420 100%); border-radius:4px;">
                    <a class="btn-a" href="{LINK}"
                       style="display:inline-block; padding:16px 32px; font-family:{FONT}; font-size:14px; line-height:20px; font-weight:800; letter-spacing:1.5px; white-space:nowrap; color:#1B130C; text-decoration:none;">
                      {botao}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" align="center" style="padding:0 24px 32px 24px; font-family:{FONT}; font-size:12px; line-height:18px; color:#6B6054;">
              Se o botão não abrir, usa esta ligação:<br>
              <a href="{LINK}" style="color:#0B72B8; text-decoration:underline;">jsdfamalicao.pt/50-anos#inscricao</a>
            </td>
          </tr>
{notas}
        </table>
      </td>
    </tr>

    <tr>
      <td height="6" bgcolor="#F86420" style="height:6px; font-size:0; line-height:0; background-color:#F86420; background-image:{DEGRADE};">&nbsp;</td>
    </tr>

    <!-- Rodapé (largura total) -->
    <tr>
      <td align="center" bgcolor="#F8F4EE" style="background-color:#F8F4EE; padding:32px 24px 28px 24px; font-family:{FONT};">
        <div style="font-size:15px; line-height:22px; font-weight:300; letter-spacing:2px; color:#1B130C; text-transform:uppercase;">Cinco décadas</div>
        <div style="font-size:15px; line-height:22px; font-weight:800; letter-spacing:2px; color:#1B130C; text-transform:uppercase;">Uma identidade</div>
        <div style="font-size:34px; line-height:42px; font-weight:300; margin-top:12px; white-space:nowrap;">
          <span style="color:#0E7FD0;">1</span><span style="color:#0B8AC4;">9</span><span style="color:#0B93B0;">7</span><span style="color:#0E9A9A;">6</span><span style="color:#8C9A5A;">_</span><span style="color:#D67A0E;">2</span><span style="color:#E27512;">0</span><span style="color:#E5600F;">2</span><span style="color:#E2540F;">6</span>
        </div>
        <div style="font-size:12px; line-height:18px; color:#6B6054; margin-top:26px;">
          Juventude Social Democrata de Vila Nova de Famalicão<br>
          <a href="https://jsdfamalicao.pt" style="color:#1B130C; text-decoration:underline;">jsdfamalicao.pt</a>
        </div>{rodape_extra}
      </td>
    </tr>

  </table>

</body>
</html>
'''

def bloco(texto, estilo='font-size:16px; line-height:26px; color:#3E352B;', topo=0):
    return f'<div style="{estilo} margin-top:{topo}px;">{texto}</div>'

MAPA = 'https://www.google.com/maps/search/?api=1&query=Av.+Visconde+de+Pindela+112,+4770-189+Cruz'

def detalhes():
    """Versão geral: data, local e preço em três linhas centradas entre dois filetes finos."""
    ponto = '<span style="color:#F86420;">&nbsp;·&nbsp;</span>'
    return f'''
          <tr>
            <td class="px" style="padding:0 24px 26px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="1" bgcolor="#E4D9CB" style="height:1px; background-color:#E4D9CB; font-size:0; line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding:18px 0; font-family:{FONT}; font-size:15px; line-height:24px; color:#3E352B; text-align:center;">
                    <strong style="color:#1B130C;">Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong><br>
                    19h00{ponto}<strong style="color:#1B130C;">Sunset House</strong><br>
                    <a href="{MAPA}" style="font-size:14px; color:#6B6054; text-decoration:none;">Av. Visc. de Pindela 112, 4770&#8209;189&nbsp;Cruz</a><br>
                    <strong style="color:#1B130C;">35&nbsp;€</strong> por pessoa{ponto}bar aberto
                  </td>
                </tr>
                <tr><td height="1" bgcolor="#E4D9CB" style="height:1px; background-color:#E4D9CB; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>'''

# ---------------- Versão geral (militantes / antigos militantes) ----------------
geral_corpo = f'''
          <tr>
            <td class="px" style="padding:36px 24px 4px 24px; font-family:{FONT};">
              <div style="font-size:12px; line-height:16px; font-weight:700; letter-spacing:4px; color:#0B72B8;">CONVITE</div>
              <div class="title" style="font-size:28px; line-height:34px; font-weight:300; letter-spacing:0.5px; color:#1B130C; text-transform:uppercase; margin-top:14px;">Jantar</div>
              <div class="title" style="font-size:28px; line-height:34px; font-weight:800; letter-spacing:0.5px; color:#1B130C; text-transform:uppercase;">Comemorativo</div>
              {bloco('Há datas que se assinalam.<br><strong style="font-weight:700; color:#1B130C;">Há datas que se <span style="color:#E2540F;">celebram</span>.</strong>', 'font-size:20px; line-height:30px; font-weight:300; color:#3E352B;', 24)}
              {bloco('Em 2026, celebramos <strong style="color:#1B130C;">50 anos de JSD&nbsp;Famalicão</strong>. É este legado de pessoas e convicções que nos junta numa noite especial para assinalar cinco décadas de história.', topo=22)}
              {bloco('Vão tomar da palavra representantes das estruturas da JSD e do PSD.', topo=16)}
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:18px 24px 26px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="4" bgcolor="#F86420" style="width:4px; background-color:#F86420; font-size:0; line-height:0;">&nbsp;</td>
                  <td style="padding:2px 0 2px 16px; font-family:{FONT}; font-size:18px; line-height:27px; font-weight:300; color:#1B130C;">
                    Se fizeste parte desta&nbsp;história,<br>
                    <strong style="font-weight:700;">esta mesa também é tua.</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>''' + detalhes()

geral_notas = f'''
          <tr>
            <td class="px" style="padding:0 24px 32px 24px; font-family:{FONT};">
              <div style="border-top:1px solid #E4D9CB; padding-top:20px; font-size:13px; line-height:21px; color:#6B6054; text-align:center;">
                A inscrição é individual. Cada participante deve preencher o seu próprio formulário.<br><br>
                A inscrição só é considerada válida após confirmação do respetivo pagamento pela JSD&nbsp;Famalicão.
              </div>
            </td>
          </tr>'''

geral_rodape = f'''
        <div style="font-size:11px; line-height:17px; color:#7A6F62; margin-top:22px;">
          Recebes este convite por fazeres parte da história da JSD&nbsp;Famalicão.
          Se não quiseres receber mais mensagens, responde a este email.
        </div>'''

# ---------------- Versão institucional ----------------
inst_corpo = f'''
          <tr>
            <td class="px" align="center" style="padding:36px 24px 4px 24px; font-family:{FONT}; text-align:center;">
              <div style="font-size:12px; line-height:16px; font-weight:700; letter-spacing:4px; color:#0B72B8;">CONVITE</div>
              <div class="title" style="font-size:26px; line-height:32px; font-weight:300; letter-spacing:0.5px; color:#1B130C; text-transform:uppercase; margin-top:16px;">Jantar Comemorativo</div>
              <div style="font-size:13px; line-height:20px; font-weight:700; letter-spacing:2px; color:#1B130C; text-transform:uppercase; margin-top:8px;">50.º Aniversário<br>da JSD&nbsp;Famalicão</div>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 0 auto;">
                <tr><td width="64" height="2" bgcolor="#F86420" style="width:64px; height:2px; background-color:#F86420; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:24px 24px 28px 24px; font-family:{FONT};">
              {bloco('Exmo.(a) Senhor(a),', 'font-size:16px; line-height:26px; color:#1B130C; font-weight:700;')}
              {bloco('A Juventude Social Democrata de Vila Nova de Famalicão tem a honra de convidar V.&nbsp;Exa. para o <strong style="color:#1B130C;">Jantar Comemorativo do seu 50.º Aniversário</strong>, que terá lugar no dia <strong style="color:#1B130C;">7&nbsp;de&nbsp;novembro de&nbsp;2026, sábado, pelas&nbsp;19h00</strong>, na <strong style="color:#1B130C;">Sunset House</strong>, sita na Avenida Visconde de Pindela, n.º&nbsp;112, 4770&#8209;189&nbsp;Cruz.', topo=18)}
              {bloco('Ao longo de cinco décadas, a JSD Famalicão tem sido uma escola de cidadania e de participação política, construída por gerações de jovens que acreditaram no serviço à comunidade. Será uma honra contar com a presença de V.&nbsp;Exa. na celebração deste percurso.', topo=16)}
              {bloco('Usarão da palavra representantes das estruturas da JSD e do PSD.', topo=16)}
              {bloco('A participação tem o valor de 35&nbsp;€ por pessoa. Agradecemos que a confirmação de presença seja feita através do formulário abaixo.', topo=16)}
              {bloco('Com os melhores cumprimentos,', 'font-size:16px; line-height:26px; color:#3E352B;', 28)}
              {bloco('Juventude Social Democrata de Vila Nova de Famalicão', 'font-size:16px; line-height:24px; color:#1B130C; font-weight:700;', 6)}
            </td>
          </tr>'''

saidas = {
    'convite-jantar-50-anos.html': pagina(
        '50 Anos JSD Famalicão · Jantar Comemorativo',
        'Há datas que se celebram. Se fizeste parte desta história, esta mesa também é tua.',
        geral_corpo, 'INSCREVER-ME', geral_notas, geral_rodape),
    'convite-jantar-50-anos-institucional.html': pagina(
        '50 Anos JSD Famalicão · Convite Institucional',
        'A JSD Famalicão tem a honra de convidar V. Exa. para o Jantar Comemorativo do seu 50.º Aniversário.',
        inst_corpo, 'CONFIRMAR PRESENÇA', '', ''),
}
for nome, html in saidas.items():
    (AQUI / nome).write_text(html, encoding='utf-8')
    print(nome, len(html), 'bytes')
