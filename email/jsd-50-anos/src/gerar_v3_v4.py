"""Gera a v3 (convite geral, trata por «tu») e a v4 (convite institucional, «Estimado(a) convidado(a)») com o MESMO
layout intermédio e texto curto. Os dados do evento vão numa faixa escura compacta (componente gráfica).

Layout intermédio: cabeçalho e slogan centrados, texto alinhado à esquerda (sem ser uma carta
formal nem ter a citação/blocos do convite geral) e dados em três colunas que ficam lado a lado
no computador e se empilham sozinhas no telemóvel (sem depender do <style>).

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
        preheader='Cinco décadas. Uma identidade. A JSD Famalicão convida-o(a) para o Jantar Comemorativo do seu 50.º Aniversário.',
        saudacao='Estimado(a) convidado(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>. É com muito gosto que o(a) convidamos para o Jantar Comemorativo que assinala a data.',
            f'Sob o mote <strong {FORTE}>«Cinco décadas. Uma&nbsp;identidade»</strong>, celebraremos o legado de várias gerações. Usarão da palavra representantes das estruturas da JSD e do PSD. Será uma honra contar com a sua presença.',
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
      .t-lead      { font-size:26px !important; line-height:34px !important; }
      .t-dados-v   { font-size:14px !important; line-height:26px !important; letter-spacing:1px !important; }'''
CLARO = '#CDBFAE'


def celula(conteudo):
    """Coluna fluida (inline-block): lado a lado no computador, empilhada no telemóvel."""
    return f'''<div style="display:inline-block; width:100%; max-width:230px; vertical-align:middle;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td align="center" style="padding:10px 8px; font-family:{FONT}; text-align:center;">{conteudo}</td>
                  </tr></table>
                </div>'''


def dados():
    """Dados do evento em três linhas centradas, só tipografia (sem caixa nem faixa)."""
    ponto = '<span style="color:#F86420;">&nbsp;·&nbsp;</span>'
    return traco(30, 0) + linha(
        f'<span style="font-weight:700; color:{ESCURO};">Sábado,&nbsp;7&nbsp;de&nbsp;novembro{ponto}19h00</span><br>'
        f'<a href="{MAPA}" style="color:#3E352B; text-decoration:none;">Sunset House<br>Av.&nbsp;Visc.&nbsp;de&nbsp;Pindela&nbsp;112, Cruz</a><br>'
        f'35&nbsp;€ por pessoa{ponto}bar aberto',
        14, 0, 'font-size:13px; line-height:24px; letter-spacing:1.5px; text-transform:uppercase; color:#3E352B;', 'center', 't-dados-v')


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
