"""Gera, com o MESMO layout intermédio (cabeçalho centrado, texto à esquerda, mote a meio do texto):
- v3 (geral, «tu») e v4 (institucional, «Estimado(a) convidado(a)»): dados do evento em linhas
  tipográficas centradas antes do fecho;
- v5 (geral) e v6 (institucional): data, hora, local e preço dentro do texto; o único elemento
  gráfico a cortar o corpo é o mote «Cinco décadas. Uma identidade.»;
(As versões finais, v7 e v8, são geradas por src/gerar_final.py.)

Uso: python3 src/gerar_v3_v4.py  (a partir de email/jsd-50-anos/)
"""
from comum import *

MUTED = '#6B6054'

# ------------------------------------------------------------------ textos
# Mesmo layout nos dois; texto curto. Geral trata por «tu», institucional ligeiramente formal («a sua presença»).
CONVITES = {
    'v3-convite-geral.html': dict(
        titulo='50 Anos JSD Famalicão · Jantar Comemorativo',
        preheader='Cinco décadas. Uma identidade. Junta-te a nós no Jantar Comemorativo dos 50 anos da JSD Famalicão.',
        saudacao='Caro(a) amigo(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>. Meio século de pessoas, ideias e causas que cabem numa só frase:',
            f'É essa identidade que queremos celebrar contigo no Jantar Comemorativo, onde vão tomar da palavra representantes das estruturas da JSD e do PSD. Se fizeste parte desta história, <strong {FORTE}>esta mesa também é tua</strong>.',
        ],
        fecho='Contamos contigo!',
        assinatura='JSD Famalicão',
        botao='INSCREVER-ME',
        alternativa='Se o botão não abrir, usa esta ligação:',
        notas=['A inscrição é individual e só fica válida depois de confirmado o pagamento.'],
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62;">Recebes este convite por fazeres parte da história da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
    ),
    'v4-convite-institucional.html': dict(
        titulo='50 Anos JSD Famalicão · Convite Institucional',
        preheader='Cinco décadas. Uma identidade. A JSD Famalicão convida-o(a) para o Jantar Comemorativo do seu 50.º Aniversário.',
        saudacao='Estimado(a) convidado(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>. Meio século de pessoas, ideias e causas que cabem numa só frase:',
            f'É essa identidade que queremos celebrar no Jantar Comemorativo para o qual temos o gosto de o(a) convidar. Usarão da palavra representantes das estruturas da JSD e do PSD. Será uma honra contar com a sua presença.',
        ],
        fecho='Com os melhores cumprimentos,',
        assinatura='Juventude Social Democrata de Vila Nova de Famalicão',
        botao='CONFIRMAR PRESENÇA',
        alternativa='Caso o botão não funcione, utilize esta ligação:',
        notas=['Agradecemos a confirmação de presença através do formulário.'],
        rodape_extra='',
    ),
}

# v5 / v6: mesmos textos da v3 / v4, mas com data, hora, local e preço dentro do corpo do texto
DATA = '<strong {f}>sábado, 7&nbsp;de&nbsp;novembro, às&nbsp;19h00</strong>'.format(f=FORTE)
LOCAL = f'<a href="{MAPA}" style="color:{ESCURO}; font-weight:700; text-decoration:none;">Sunset&nbsp;House</a>'
CONVITES['v5-convite-geral.html'] = dict(
    CONVITES['v3-convite-geral.html'],
    bloco_dados=False,
    paragrafos=[
        CONVITES['v3-convite-geral.html']['paragrafos'][0],
        f'É essa identidade que queremos celebrar contigo no Jantar Comemorativo, no {DATA}, na {LOCAL}. Vão tomar da palavra representantes das estruturas da JSD e do PSD.',
        f'A inscrição custa <strong {FORTE}>35&nbsp;€ por pessoa</strong>, com bar aberto. Se fizeste parte desta história, <strong {FORTE}>esta mesa também é tua</strong>.',
    ],
)
CONVITES['v6-convite-institucional.html'] = dict(
    CONVITES['v4-convite-institucional.html'],
    bloco_dados=False,
    paragrafos=[
        CONVITES['v4-convite-institucional.html']['paragrafos'][0],
        f'É essa identidade que queremos celebrar no Jantar Comemorativo para o qual temos o gosto de o(a) convidar, no {DATA}, na {LOCAL}. Usarão da palavra representantes das estruturas da JSD e do PSD.',
        f'A participação tem o valor de <strong {FORTE}>35&nbsp;€ por pessoa</strong>, com bar aberto. Será uma honra contar com a sua presença.',
    ],
)

# ------------------------------------------------------------------ layout intermédio (único)
CSS = '''
      .t-lead      { font-size:26px !important; line-height:34px !important; }
      .t-dados-v   { font-size:14px !important; line-height:26px !important; letter-spacing:1px !important; }'''

def dados():
    """Dados do evento em três linhas centradas, só tipografia (sem caixa nem faixa)."""
    ponto = '<span style="color:#F86420;">&nbsp;·&nbsp;</span>'
    return traco(30, 0) + linha(
        f'<span style="font-weight:700; color:{ESCURO};">Sábado,&nbsp;7&nbsp;de&nbsp;novembro{ponto}19h00</span><br>'
        f'<a href="{MAPA}" style="color:#3E352B; text-decoration:none;">Sunset House</a><br>'
        f'35&nbsp;€ por pessoa{ponto}bar aberto',
        14, 0, 'font-size:13px; line-height:24px; letter-spacing:1.5px; text-transform:uppercase; color:#3E352B;', 'center', 't-dados-v')


def convite(t):
    notas = ''.join(
        linha(n, 20 if i == 0 else 10, 40 if i == len(t['notas']) - 1 else 0,
              f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota')
        for i, n in enumerate(t['notas']))
    corpo = ''.join([
        cabecalho(),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        linha(t['paragrafos'][0], 12, 0),
        # mote a meio do texto, como elemento gráfico: o 1.º parágrafo introdu-lo e o seguinte retoma-o
        linha(f'Cinco décadas.<br><strong style="font-weight:800; color:{ESCURO};">Uma <span style="color:#E2540F;">identidade</span>.</strong>',
              30, 18, 'font-size:24px; line-height:32px; font-weight:300; color:#3E352B;', 'left', 't-lead'),
        *[linha(p_, 12 if i == 0 else 16, 0) for i, p_ in enumerate(t['paragrafos'][1:])],
        dados() if t.get('bloco_dados', True) else '',
        linha(t['fecho'], 28, 0),
        linha(t['assinatura'], 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        botao(t['botao'], 28, 0, t['alternativa']),
        filete(),
        notas,
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS)


for nome, t in CONVITES.items():
    html = convite(t)
    (AQUI / nome).write_text(html, encoding='utf-8')
    print(nome, len(html), 'bytes')
