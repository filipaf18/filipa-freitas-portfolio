"""Gera a v2 do convite (geral e institucional). As peças comuns estão em src/comum.py.
Uso: python3 src/gerar.py  (a partir de email/jsd-50-anos/)
"""
from comum import *

# ---------------- Versão geral (militantes / antigos militantes) ----------------
citacao = f'''
          <tr>
            <td class="px" style="padding:32px {LADO}px 36px {LADO}px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="4" bgcolor="#F86420" style="width:4px; background-color:#F86420; font-size:0; line-height:0;">&nbsp;</td>
                  <td class="t-citacao" style="padding:4px 0 4px 16px; font-family:{FONT}; font-size:18px; line-height:28px; font-weight:300; color:{ESCURO};">Se fizeste parte desta&nbsp;história,<br><strong style="font-weight:700;">esta mesa também é tua.</strong></td>
                </tr>
              </table>
            </td>
          </tr>'''

geral_corpo = ''.join([
    cabecalho(),
    linha(f'Cinco décadas.<br><strong style="font-weight:700; color:{ESCURO};">Uma identidade.</strong>',
          28, 0, 'font-size:22px; line-height:32px; font-weight:300; color:#3E352B;', 'center', 't-lead'),
    linha(f'Em 2026, celebramos <strong {FORTE}>50 anos de JSD&nbsp;Famalicão</strong>. É este legado de pessoas e convicções que nos junta numa noite especial para assinalar cinco décadas de história.', 32),
    linha('Vão tomar da palavra representantes das estruturas da JSD e do PSD.', 20),
    citacao,
    filete(),
    linha(f'<strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong><br>'
          f'19h00{PONTO}<strong {FORTE}>Sunset House</strong><br>'
          f'<a href="{MAPA}" style="color:#6B6054; text-decoration:none;">Av. Visc. de Pindela 112, 4770&#8209;189&nbsp;Cruz</a><br>'
          f'<strong {FORTE}>35&nbsp;€</strong> por pessoa{PONTO}bar aberto',
          24, 24, 'font-size:15px; line-height:29px; color:#3E352B;', 'center', 't-dados'),
    filete(),
    botao('INSCREVER-ME', 36, 0),
    filete(),
    linha('A inscrição é individual. Cada participante deve preencher o seu próprio formulário.', 28, 0,
          'font-size:13px; line-height:21px; color:#6B6054;', 'center', 't-nota'),
    linha('A inscrição só é considerada válida após confirmação do respetivo pagamento pela JSD&nbsp;Famalicão.', 14, 40,
          'font-size:13px; line-height:21px; color:#6B6054;', 'center', 't-nota'),
])

geral_rodape = f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62;">Recebes este convite por fazeres parte da história da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>'''

# ---------------- Versão institucional ----------------
inst_corpo = ''.join([
    cabecalho(),
    linha('Exmo.(a) Senhor(a),', 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
    linha(f'A Juventude Social Democrata de Vila Nova de Famalicão tem a honra de convidar V.&nbsp;Exa. para o <strong {FORTE}>Jantar Comemorativo do seu 50.º Aniversário</strong>, que terá lugar no dia <strong {FORTE}>7&nbsp;de&nbsp;novembro de&nbsp;2026, sábado, pelas&nbsp;19h00</strong>, na <strong {FORTE}>Sunset House</strong>, sita na Avenida Visconde de Pindela, n.º&nbsp;112, 4770&#8209;189&nbsp;Cruz.', 20),
    linha(f'Sob o mote <strong {FORTE}>«Cinco décadas. Uma&nbsp;identidade»</strong>, celebramos um percurso em que a JSD Famalicão se afirmou como escola de cidadania e de participação política, construído por gerações de jovens que acreditaram no serviço à comunidade. Será uma honra contar com a presença de V.&nbsp;Exa. nesta celebração.', 20),
    linha('Usarão da palavra representantes das estruturas da JSD e do PSD.', 20),
    linha('A participação tem o valor de 35&nbsp;€ por pessoa. Agradecemos que a confirmação de presença seja feita através do formulário abaixo.', 20),
    linha('Com os melhores cumprimentos,', 32),
    linha('Juventude Social Democrata de Vila Nova de Famalicão', 6, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
    botao('CONFIRMAR PRESENÇA', 40, 0),
])

saidas = {
    'convite-jantar-50-anos.html': pagina(
        '50 Anos JSD Famalicão · Jantar Comemorativo',
        'Cinco décadas. Uma identidade. Se fizeste parte desta história, esta mesa também é tua.',
        geral_corpo, geral_rodape),
    'convite-jantar-50-anos-institucional.html': pagina(
        '50 Anos JSD Famalicão · Convite Institucional',
        'A JSD Famalicão tem a honra de convidar V. Exa. para o Jantar Comemorativo do seu 50.º Aniversário.',
        inst_corpo, ''),
}
for nome, html in saidas.items():
    (AQUI / nome).write_text(html, encoding='utf-8')
    print(nome, len(html), 'bytes')
