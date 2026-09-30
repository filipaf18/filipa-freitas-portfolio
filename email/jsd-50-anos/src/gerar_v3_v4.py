"""Gera a v3 e a v4 do convite: cada versão tem UM layout, usado tanto no convite geral
como no institucional; só o texto muda (dicionário TEXTOS).

- v3 «cartão»: tudo centrado, como um convite impresso; dados em três linhas entre filetes.
- v4 «carta com destaques»: cabeçalho centrado, texto alinhado à esquerda como uma carta;
  dados em três colunas que, no telemóvel, se empilham sozinhas (sem depender do <style>).

Uso: python3 src/gerar_v3_v4.py  (a partir de email/jsd-50-anos/)
"""
from comum import *

MUTED = '#6B6054'

# ------------------------------------------------------------------ textos
TEXTOS = {
    'geral': dict(
        titulo='50 Anos JSD Famalicão · Jantar Comemorativo',
        preheader='Cinco décadas. Uma identidade. Se fizeste parte desta história, esta mesa também é tua.',
        saudacao='Caro(a) amigo(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão celebra <strong {FORTE}>50&nbsp;anos</strong>. Queremos assinalar esta data com quem a construiu, num jantar que junta várias gerações de militantes, dirigentes e amigos.',
            f'É este legado de pessoas e convicções que nos junta numa noite especial. Se fizeste parte desta história, <strong {FORTE}>esta mesa também é tua</strong>.',
        ],
        oradores='Vão tomar da palavra representantes das estruturas da JSD e do PSD.',
        preco_nota='Bar aberto',
        fecho='Contamos contigo.',
        assinatura='JSD Famalicão',
        botao='INSCREVER-ME',
        alternativa='Se o botão não abrir, usa esta ligação:',
        notas=['A inscrição é individual. Cada participante deve preencher o seu próprio formulário.',
               'A inscrição só é considerada válida após confirmação do respetivo pagamento pela JSD&nbsp;Famalicão.'],
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62;">Recebes este convite por fazeres parte da história da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
    ),
    'institucional': dict(
        titulo='50 Anos JSD Famalicão · Convite Institucional',
        preheader='A JSD Famalicão tem a honra de convidar V. Exa. para o Jantar Comemorativo do seu 50.º Aniversário.',
        saudacao='Exmo.(a) Senhor(a),',
        paragrafos=[
            f'A Juventude Social Democrata de Vila Nova de Famalicão tem a honra de convidar V.&nbsp;Exa. para o <strong {FORTE}>Jantar Comemorativo do seu 50.º Aniversário</strong>.',
            f'É sob o mote <strong {FORTE}>«Cinco décadas. Uma&nbsp;identidade»</strong> que celebramos um percurso construído por gerações de jovens que acreditaram no serviço à comunidade. Será uma honra contar com a presença de V.&nbsp;Exa.',
        ],
        oradores='Usarão da palavra representantes das estruturas da JSD e do PSD.',
        preco_nota='',
        fecho='Com os melhores cumprimentos,',
        assinatura='Juventude Social Democrata de Vila Nova de Famalicão',
        botao='CONFIRMAR PRESENÇA',
        alternativa='Caso o botão não funcione, utilize esta ligação:',
        notas=['Agradecemos que a confirmação de presença seja feita através do formulário.'],
        rodape_extra='',
    ),
}

# ------------------------------------------------------------------ peças partilhadas
def lema():
    return linha(f'Cinco décadas.<br><strong style="font-weight:700; color:{ESCURO};">Uma identidade.</strong>',
                 28, 0, 'font-size:22px; line-height:32px; font-weight:300; color:#3E352B;', 'center', 't-lead')


def notas(t, alinhar='center'):
    out = []
    for i, n in enumerate(t['notas']):
        ultima = i == len(t['notas']) - 1
        out.append(linha(n, 28 if i == 0 else 12, 40 if ultima else 0,
                         f'font-size:13px; line-height:21px; color:{MUTED};', alinhar, 't-nota'))
    return ''.join(out)


# ------------------------------------------------------------------ v3 · cartão (tudo centrado)
def v3(t):
    c = 'center'
    dados = linha(
        f'<strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong><br>'
        f'19h00{PONTO}<strong {FORTE}>Sunset House</strong><br>'
        f'<a href="{MAPA}" style="color:{MUTED}; text-decoration:none;">Av. Visc. de Pindela 112, 4770&#8209;189&nbsp;Cruz</a><br>'
        f'<strong {FORTE}>35&nbsp;€</strong> por pessoa' + (PONTO + t['preco_nota'].lower() if t['preco_nota'] else ''),
        24, 24, 'font-size:15px; line-height:29px; color:#3E352B;', c, 't-dados')
    corpo = ''.join([
        cabecalho(),
        lema(),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};', c),
        *[linha(p, 16, 0, CORPO, c) for p in t['paragrafos']],
        linha(t['oradores'], 16, 0, CORPO, c),
        filete(36, 0),
        dados,
        filete(),
        linha(t['fecho'], 32, 0, CORPO, c),
        linha(t['assinatura'], 4, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};', c),
        botao(t['botao'], 32, 0, t['alternativa']),
        filete(),
        notas(t),
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], largura=820)


# ------------------------------------------------------------------ v4 · carta com destaques
CSS_V4 = '''
      .t-col-a     { font-size:18px !important; line-height:26px !important; }
      .t-col-b     { font-size:16px !important; line-height:24px !important; }'''


def coluna(principal, *linhas_extra):
    """Coluna «fluida»: inline-block com max-width; lado a lado no computador, empilhada no telemóvel."""
    extra = '<br>'.join(linhas_extra)
    return f'''<div style="display:inline-block; width:100%; max-width:250px; vertical-align:top;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center" style="padding:14px 10px;">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td width="28" height="2" bgcolor="#F86420" style="width:28px; height:2px; background-color:#F86420; font-size:0; line-height:0;">&nbsp;</td></tr></table>
                  </td></tr>
                  <tr><td class="t-col-a" align="center" style="padding:0 10px; font-family:{FONT}; font-size:16px; line-height:24px; font-weight:700; color:{ESCURO}; text-align:center;">{principal}</td></tr>
                  <tr><td class="t-col-b" align="center" style="padding:4px 10px 0 10px; font-family:{FONT}; font-size:14px; line-height:22px; color:{MUTED}; text-align:center;">{extra}</td></tr>
                </table>
              </div>'''


def v4(t):
    colunas = f'''
          <tr>
            <td class="px" align="center" style="padding:14px {LADO}px 22px {LADO}px; font-size:0; line-height:0; text-align:center;">
              {coluna('7&nbsp;de&nbsp;novembro de&nbsp;2026', 'Sábado, às 19h00')}
              {coluna('Sunset House', f'<a href="{MAPA}" style="color:{MUTED}; text-decoration:none;">Av. Visc. de Pindela 112<br>4770&#8209;189&nbsp;Cruz</a>')}
              {coluna('35&nbsp;€ por pessoa', *([t['preco_nota']] if t['preco_nota'] else []))}
            </td>
          </tr>'''
    corpo = ''.join([
        cabecalho(),
        lema(),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 16, 0) for p in t['paragrafos']],
        linha(t['oradores'], 16, 0),
        filete(32, 0),
        colunas,
        filete(),
        linha(t['fecho'], 32, 0),
        linha(t['assinatura'], 4, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        botao(t['botao'], 36, 0, t['alternativa']),
        filete(),
        notas(t),
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS_V4)


# ------------------------------------------------------------------ saída
for versao, fazer in (('v3', v3), ('v4', v4)):
    for tipo, t in TEXTOS.items():
        nome = f'{versao}-convite-{tipo}.html'
        html = fazer(t)
        (AQUI / nome).write_text(html, encoding='utf-8')
        print(nome, len(html), 'bytes')
