"""Gera a v3 (convite geral) e a v4 (convite institucional) com o MESMO layout intermédio
e um texto-base de registo intermédio: igual nos dois, exceto nas poucas partes que mudam
consoante o público (saudação, frase final do corpo, botão, notas e rodapé).

Layout intermédio: cabeçalho e slogan centrados, texto alinhado à esquerda (sem ser uma carta
formal nem ter a citação/blocos do convite geral) e dados em três colunas que ficam lado a lado
no computador e se empilham sozinhas no telemóvel (sem depender do <style>).

Uso: python3 src/gerar_v3_v4.py  (a partir de email/jsd-50-anos/)
"""
from comum import *

MUTED = '#6B6054'

# ------------------------------------------------------------------ texto-base (igual nos dois)
BASE = dict(
    paragrafo_1=f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>. Para assinalar a data, vamos reunir num Jantar Comemorativo as várias gerações que fizeram, e continuam a fazer, a história da nossa estrutura.',
    paragrafo_2=f'Sob o mote <strong {FORTE}>«Cinco décadas. Uma&nbsp;identidade»</strong>, queremos celebrar o legado de pessoas e convicções que nos trouxe até aqui. Usarão da palavra representantes das estruturas da JSD e do PSD.',
    fecho='Com os melhores cumprimentos,',
    assinatura='Juventude Social Democrata de Vila Nova de Famalicão',
    alternativa='Caso o botão não funcione, utilize esta ligação:',
)

# ------------------------------------------------------------------ o que muda em cada convite
CONVITES = {
    'v3-convite-geral.html': dict(
        BASE,
        titulo='50 Anos JSD Famalicão · Jantar Comemorativo',
        preheader='Cinco décadas. Uma identidade. Jantar Comemorativo dos 50 anos da JSD Famalicão, 7 de novembro.',
        saudacao='Caro(a) amigo(a),',
        paragrafo_3=f'Se fez parte desta história, <strong {FORTE}>esta mesa também é sua</strong>.',
        botao='INSCREVER-ME',
        notas=['A inscrição é individual: cada participante deve preencher o seu próprio formulário.',
               'A inscrição só é considerada válida após confirmação do respetivo pagamento pela JSD&nbsp;Famalicão.'],
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62;">Recebe este convite por fazer parte da história da JSD&nbsp;Famalicão. Se não quiser receber mais mensagens, responda a este email.</td></tr>''',
    ),
    'v4-convite-institucional.html': dict(
        BASE,
        titulo='50 Anos JSD Famalicão · Convite Institucional',
        preheader='Cinco décadas. Uma identidade. A JSD Famalicão convida V. Exa. para o Jantar Comemorativo do seu 50.º Aniversário.',
        saudacao='Exmo.(a) Senhor(a),',
        paragrafo_3='Será uma honra contar com a presença de V.&nbsp;Exa.',
        botao='CONFIRMAR PRESENÇA',
        notas=['Agradecemos que a confirmação de presença seja feita através do formulário.'],
        rodape_extra='',
    ),
}

# ------------------------------------------------------------------ layout intermédio (único)
CSS = '''
      .t-col-a     { font-size:18px !important; line-height:26px !important; }
      .t-col-b     { font-size:16px !important; line-height:24px !important; }'''


def coluna(principal, *secundarias):
    """Coluna «fluida»: inline-block com max-width; lado a lado no computador, empilhada no telemóvel."""
    return f'''<div style="display:inline-block; width:100%; max-width:250px; vertical-align:top;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center" style="padding:14px 10px;">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td width="28" height="2" bgcolor="#F86420" style="width:28px; height:2px; background-color:#F86420; font-size:0; line-height:0;">&nbsp;</td></tr></table>
                  </td></tr>
                  <tr><td class="t-col-a" align="center" style="padding:0 10px; font-family:{FONT}; font-size:16px; line-height:24px; font-weight:700; color:{ESCURO}; text-align:center;">{principal}</td></tr>
                  <tr><td class="t-col-b" align="center" style="padding:4px 10px 0 10px; font-family:{FONT}; font-size:14px; line-height:22px; color:{MUTED}; text-align:center;">{'<br>'.join(secundarias)}</td></tr>
                </table>
              </div>'''


def dados():
    return f'''
          <tr>
            <td class="px" align="center" style="padding:14px {LADO}px 22px {LADO}px; font-size:0; line-height:0; text-align:center;">
              {coluna('7&nbsp;de&nbsp;novembro de&nbsp;2026', 'Sábado, às 19h00')}
              {coluna('Sunset House', f'<a href="{MAPA}" style="color:{MUTED}; text-decoration:none;">Av. Visc. de Pindela 112<br>4770&#8209;189&nbsp;Cruz</a>')}
              {coluna('35&nbsp;€ por pessoa', 'Bar aberto')}
            </td>
          </tr>'''


def convite(t):
    notas = ''.join(
        linha(n, 28 if i == 0 else 12, 40 if i == len(t['notas']) - 1 else 0,
              f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota')
        for i, n in enumerate(t['notas']))
    corpo = ''.join([
        cabecalho(),
        linha(f'Cinco décadas.<br><strong style="font-weight:700; color:{ESCURO};">Uma identidade.</strong>',
              28, 0, 'font-size:22px; line-height:32px; font-weight:300; color:#3E352B;', 'center', 't-lead'),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        linha(t['paragrafo_1'], 16, 0),
        linha(t['paragrafo_2'], 16, 0),
        linha(t['paragrafo_3'], 16, 0),
        filete(32, 0),
        dados(),
        filete(),
        linha(t['fecho'], 32, 0),
        linha(t['assinatura'], 4, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        botao(t['botao'], 36, 0, t['alternativa']),
        filete(),
        notas,
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS)


for nome, t in CONVITES.items():
    html = convite(t)
    (AQUI / nome).write_text(html, encoding='utf-8')
    print(nome, len(html), 'bytes')
