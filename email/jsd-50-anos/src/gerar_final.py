"""Versões FINAIS do convite: v7 (geral) e v8 (institucional). Mesmo layout nos dois.

Ordem: cabeçalho centrado → saudação → 3 parágrafos → mote «Cinco Décadas. Uma Identidade.» em
destaque (alinhado com o texto) → despedida e assinatura → quadrado com local, morada, data e preço →
botão, ligação alternativa e nota → rodapé com o logo (PNG transparente).

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
      .t-mote      { font-size:30px !important; line-height:38px !important; }
      .t-cx-local  { font-size:15px !important; line-height:22px !important; }
      .t-cx-morada { font-size:15px !important; line-height:23px !important; }
      .t-cx-data   { font-size:18px !important; line-height:26px !important; }
      .t-cx-preco  { font-size:16px !important; line-height:24px !important; }
      .cx-pad      { padding-left:16px !important; padding-right:16px !important; }'''


def quadrado():
    """Quadrado com local, morada, data e preço: fundo claro, filete fino, cantos arredondados, sem etiquetas."""
    def l(classe, estilo, html, cima=0):
        return (f'<tr><td class="{classe}" align="center" style="padding-top:{cima}px; font-family:{FONT}; {estilo} text-align:center;">'
                f'{html}</td></tr>')
    return f'''
          <tr>
            <td class="px" style="padding:36px {LADO}px 0 {LADO}px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FBF8F4"
                     style="width:100%; background-color:#FBF8F4; border:1px solid #E4D9CB; border-radius:8px;">
                <tr>
                  <td class="cx-pad" align="center" style="padding:26px 24px 26px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td align="center" style="padding-bottom:16px;">
                        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td width="36" height="2" bgcolor="#F86420" style="width:36px; height:2px; background-color:#F86420; font-size:0; line-height:0;">&nbsp;</td></tr></table>
                      </td></tr>
                      {l('t-cx-local', f'font-size:14px; line-height:21px; font-weight:800; letter-spacing:3px; text-transform:uppercase; color:{ESCURO};', 'Sunset&nbsp;House')}
                      {l('t-cx-morada', f'font-size:14px; line-height:22px; color:{MUTED};', MAPA_LINK, 4)}
                      {l('t-cx-data', f'font-size:16px; line-height:24px; font-weight:700; color:{ESCURO};', 'Sábado, 7&nbsp;de&nbsp;novembro&nbsp;de&nbsp;2026', 16)}
                      {l('t-cx-preco', 'font-size:15px; line-height:23px; color:#3E352B;', 'às 19h00', 2)}
                      {l('t-cx-preco', 'font-size:15px; line-height:23px; color:#3E352B;', f'<strong {FORTE}>35&nbsp;€</strong> por pessoa{PONTO}bar aberto', 4)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>'''


def convite(t):
    corpo = ''.join([
        cabecalho(),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        # mote: único elemento gráfico dentro do texto, alinhado com ele
        linha(f'Cinco Décadas.<br><strong style="font-weight:800; color:{ESCURO};">Uma <span style="color:{LARANJA_TEXTO};">Identidade</span>.</strong>',
              30, 0, 'font-size:28px; line-height:36px; font-weight:300; color:#3E352B;', 'left', 't-mote'),
        linha(t['despedida'], 30, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        quadrado(),
        botao(t['botao'], 32, 0, t['alternativa'], baixo_ligacao=0),
        linha(t['nota'], 16, 44, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_final.py')


for nome, t in CONVITES.items():
    html = convite(t)
    (AQUI / nome).write_text(html, encoding='utf-8')
    print(nome, len(html.encode('utf-8')), 'bytes')
