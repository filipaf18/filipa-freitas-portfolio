"""Versões FINAIS do convite: v7 (geral) e v8 (institucional). Mesmo layout nos dois.

Ordem: cabeçalho centrado → saudação → 3 parágrafos → despedida e assinatura → mote «Cinco Décadas.
Uma Identidade.» em destaque (alinhado com o texto) → dados (data, hora, local, morada, preço) em linhas
centradas entre dois filetes → botão, ligação alternativa e nota → rodapé com o logo (PNG transparente).

Modo noturno: <meta name="color-scheme" content="light only"> e :root { color-scheme: light only }
pedem a versão clara aos clientes que respeitam esta indicação (Apple Mail/iOS Mail, Outlook para
iOS/macOS…). As apps do Gmail aplicam sempre o seu próprio modo escuro; para esse caso o logo não tem
fundo (não aparece nenhum quadrado branco) e as letras escuras do logo têm um contorno claro.

Uso: python3 src/gerar_final.py  (a partir de email/jsd-50-anos/)
"""
from comum import *

MUTED = '#6B6054'
LARANJA_TEXTO = '#E2540F'
PONTO = f'<span style="color:#F86420;">&nbsp;·&nbsp;</span>'
MAPA_HREF = MAPA.replace('&', '&amp;')   # «&» escapado no atributo, como manda o HTML
MAPA_LINK = f'<a href="{MAPA_HREF}" style="color:{MUTED}; text-decoration:none;">Av.&nbsp;Visc.&nbsp;de&nbsp;Pindela&nbsp;112, 4770&#8209;189&nbsp;Cruz</a>'

# ------------------------------------------------------------------ textos (fornecidos pela JSD Famalicão)
CONVITES = {
    'v7-convite-geral.html': dict(
        titulo='50 Anos JSD Famalicão · Jantar Comemorativo',
        preheader='Cinco Décadas. Uma Identidade. Vem celebrar connosco os 50 anos da JSD Famalicão.',
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>. Queremos assinalar esta data num Jantar Comemorativo que reúne várias gerações de militantes.',
            'No decurso do evento, usarão da palavra representantes das estruturas da JSD e do PSD.',
            'Se fazes parte desta história, vem celebrar connosco meio século de pessoas, ideias e causas. Contamos contigo!',
        ],
        despedida='Até lá,',
        botao='INSCREVER-ME',
        alternativa='Se o botão não abrir, usa esta ligação:',
        nota='A inscrição é individual e só fica válida depois de confirmado o pagamento.',
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62;">Recebes este convite por fazeres parte da história da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
    ),
    'v8-convite-institucional.html': dict(
        titulo='50 Anos JSD Famalicão · Convite',
        preheader='Cinco Décadas. Uma Identidade. A JSD Famalicão convida-o(a) para o Jantar Comemorativo dos seus 50 anos.',
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>. É com muito gosto que o(a) convidamos para o Jantar Comemorativo que assinala a data e reúne várias gerações de militantes.',
            'No decurso do evento, usarão da palavra representantes das estruturas da JSD e do PSD.',
            'Será uma honra contar com a sua presença para celebrarmos juntos meio século de pessoas, ideias e causas.',
        ],
        despedida='Com os melhores cumprimentos,',
        botao='CONFIRMAR PRESENÇA',
        alternativa='Caso o botão não funcione, utilize esta ligação:',
        nota='Agradecemos a confirmação de presença através do formulário.',
        rodape_extra='',
    ),
}
ASSINATURA = 'Juventude Social Democrata de Vila Nova de&nbsp;Famalicão'

# ------------------------------------------------------------------ responsivo (telemóvel)
CSS = '''
      .t-mote      { font-size:30px !important; line-height:38px !important; }'''


def dados():
    """Local, morada, data e preço em quatro linhas centradas entre dois filetes finos (sem caixa)."""
    return filete(36, 0) + linha(
        f'<strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong><br>'
        f'19h00{PONTO}<strong {FORTE}>Sunset&nbsp;House</strong><br>'
        f'{MAPA_LINK}<br>'
        f'<strong {FORTE}>35&nbsp;€</strong> por pessoa{PONTO}bar aberto',
        24, 24, 'font-size:15px; line-height:29px; color:#3E352B;', 'center', 't-dados') + filete()


def convite(t):
    corpo = ''.join([
        cabecalho(),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        linha(t['despedida'], 28, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        # mote depois da despedida e da assinatura: único elemento gráfico do texto, alinhado com ele
        linha(f'Cinco Décadas.<br><strong style="font-weight:800; color:{ESCURO};">Uma <span style="color:{LARANJA_TEXTO};">Identidade</span>.</strong>',
              26, 0, 'font-size:28px; line-height:36px; font-weight:300; color:#3E352B;', 'left', 't-mote'),
        dados(),
        botao(t['botao'], 32, 0, t['alternativa'], baixo_ligacao=0),
        linha(t['nota'], 16, 44, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_final.py')


for nome, t in CONVITES.items():
    html = convite(t)
    (AQUI / nome).write_text(html, encoding='utf-8')
    print(nome, len(html.encode('utf-8')), 'bytes')
