"""Gera a v3 (convite geral, trata por «tu») e a v4 (convite institucional, «V. Exa.») com o MESMO
layout intermédio e texto curto. Os dados do evento vão numa faixa escura compacta (componente gráfica).

Layout intermédio: cabeçalho e slogan centrados, texto alinhado à esquerda (sem ser uma carta
formal nem ter a citação/blocos do convite geral) e dados em três colunas que ficam lado a lado
no computador e se empilham sozinhas no telemóvel (sem depender do <style>).

Uso: python3 src/gerar_v3_v4.py  (a partir de email/jsd-50-anos/)
"""
from comum import *

MUTED = '#6B6054'

# ------------------------------------------------------------------ textos
# Mesmo layout nos dois; texto curto. Geral trata por «tu», institucional por «V. Exa.».
CONVITES = {
    'v3-convite-geral.html': dict(
        titulo='50 Anos JSD Famalicão · Jantar Comemorativo',
        preheader='Cinco décadas. Uma identidade. Junta-te a nós no Jantar Comemorativo dos 50 anos da JSD Famalicão.',
        saudacao='Caro(a) amigo(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão faz <strong {FORTE}>50&nbsp;anos</strong> e queremos celebrá-los com quem fez esta história.',
            f'Junta-te a nós no Jantar Comemorativo, onde vão tomar da palavra representantes das estruturas da JSD e do PSD. Se fizeste parte desta história, <strong {FORTE}>esta mesa também é tua</strong>.',
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
        preheader='Cinco décadas. Uma identidade. A JSD Famalicão convida V. Exa. para o Jantar Comemorativo do seu 50.º Aniversário.',
        saudacao='Exmo.(a) Senhor(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>. É com muito gosto que convidamos V.&nbsp;Exa. para o Jantar Comemorativo que assinala a data.',
            f'Sob o mote <strong {FORTE}>«Cinco décadas. Uma&nbsp;identidade»</strong>, celebraremos o legado de várias gerações. Usarão da palavra representantes das estruturas da JSD e do PSD.',
        ],
        fecho='Com os melhores cumprimentos,',
        assinatura='Juventude Social Democrata de Vila Nova de Famalicão',
        botao='CONFIRMAR PRESENÇA',
        alternativa='Caso o botão não funcione, utilize esta ligação:',
        notas=['Agradecemos a confirmação de presença através do formulário.'],
        rodape_extra='',
    ),
}

# ------------------------------------------------------------------ layout intermédio (único)
CSS = '''
      .t-lead      { font-size:26px !important; line-height:34px !important; }'''
CLARO = '#CDBFAE'


def celula(conteudo):
    """Coluna fluida (inline-block): lado a lado no computador, empilhada no telemóvel."""
    return f'''<div style="display:inline-block; width:100%; max-width:230px; vertical-align:middle;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td align="center" style="padding:10px 8px; font-family:{FONT}; text-align:center;">{conteudo}</td>
                  </tr></table>
                </div>'''


def dados():
    data = f'''<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>
                      <td style="padding-right:10px; font-family:{FONT}; font-size:44px; line-height:44px; font-weight:800; color:#F86420;">07</td>
                      <td align="left" style="font-family:{FONT}; text-align:left;">
                        <div style="font-size:14px; line-height:18px; font-weight:800; letter-spacing:2px; color:#FFFFFF;">NOV 2026</div>
                        <div style="font-size:12px; line-height:18px; letter-spacing:1px; color:{CLARO};">SÁB · 19H00</div>
                      </td></tr></table>'''
    local = (f'<div style="font-size:14px; line-height:20px; font-weight:800; letter-spacing:2px; color:#FFFFFF;">SUNSET HOUSE</div>'
             f'<a href="{MAPA}" style="font-size:12px; line-height:18px; color:{CLARO}; text-decoration:none;">Av. Visc. de Pindela 112<br>4770&#8209;189&nbsp;Cruz</a>')
    preco = (f'<div style="font-size:30px; line-height:34px; font-weight:300; color:#FFFFFF;">35&nbsp;€</div>'
             f'<div style="font-size:11px; line-height:16px; letter-spacing:2px; color:{CLARO};">POR PESSOA · BAR ABERTO</div>')
    return f'''
          <tr>
            <td class="px" style="padding:32px {LADO}px 0 {LADO}px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#130D07" style="background-color:#130D07; border-radius:6px;">
                <tr><td height="4" bgcolor="#F86420" style="height:4px; font-size:0; line-height:0; background-color:#F86420; background-image:{DEGRADE}; border-radius:6px 6px 0 0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding:14px 8px; font-size:0; line-height:0; text-align:center;">
                {celula(data)}
                {celula(local)}
                {celula(preco)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>'''


def convite(t):
    notas = ''.join(
        linha(n, 20 if i == 0 else 10, 40 if i == len(t['notas']) - 1 else 0,
              f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota')
        for i, n in enumerate(t['notas']))
    corpo = ''.join([
        cabecalho(),
        linha(f'Cinco décadas.<br><strong style="font-weight:800; color:{ESCURO};">Uma <span style="color:#E2540F;">identidade</span>.</strong>',
              26, 0, 'font-size:24px; line-height:32px; font-weight:300; color:#3E352B;', 'center', 't-lead'),
        linha(t['saudacao'], 32, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p_, 12, 0) for p_ in t['paragrafos']],
        dados(),
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
