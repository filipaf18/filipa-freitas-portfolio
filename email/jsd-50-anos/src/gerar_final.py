"""Versões FINAIS do convite: v7 (geral) e v8 (institucional). Mesmo layout nos dois.

Ordem: cabeçalho centrado → saudação → 3 parágrafos → despedida e assinatura → mote «CINCO DÉCADAS /
UMA IDENTIDADE» em maiúsculas com o degradê da marca (alinhado com o texto) → dados (data, hora, local, morada, preço) em linhas
centradas entre dois filetes → botão, ligação alternativa e nota → rodapé com o logo (PNG transparente).

Modo noturno: <meta name="color-scheme" content="light only"> e :root { color-scheme: light only }
pedem a versão clara aos clientes que respeitam esta indicação (Apple Mail/iOS Mail, Outlook para
iOS/macOS…). As apps do Gmail aplicam sempre o seu próprio modo escuro; para esse caso o logo não tem
fundo (não aparece nenhum quadrado branco) e as letras escuras do logo têm um contorno claro.

Uso: python3 src/gerar_final.py  (a partir de email/jsd-50-anos/)
"""
from comum import *

MUTED = '#6B6054'
PONTO = f'<span style="color:#F86420;">&nbsp;·&nbsp;</span>'
MAPA_HREF = MAPA                      # em comum.py o «&» já vem escapado como &amp;
MAPA_LINK = f'<a href="{MAPA_HREF}" style="color:{MUTED}; text-decoration:none;">Av.&nbsp;Visc.&nbsp;de&nbsp;Pindela&nbsp;112, 4770&#8209;189&nbsp;Cruz</a>'

# ------------------------------------------------------------------ textos (fornecidos pela JSD Famalicão)
CONVITES = {
    'v7-convite-geral.html': dict(
        titulo='50 Anos JSD Famalicão · Jantar Comemorativo',
        preheader='Cinco Décadas. Uma Identidade. Vem celebrar connosco os 50 anos da JSD Famalicão.',
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>, e há datas que só fazem sentido quando partilhadas. Vem juntar-te a várias gerações de militantes num Jantar Comemorativo feito de reencontros e de memórias.',
            'No decurso do evento, usarão da palavra representantes das estruturas da JSD e do PSD.',
            'Se fazes parte desta história, vem celebrar connosco meio século de pessoas, ideias e causas. Sem ti, não será igual. Contamos contigo!',
        ],
        despedida='Até lá,',
        botao='INSCREVER-ME',
        alternativa='Se o botão não abrir, usa esta ligação:',
        nota='A inscrição é individual e só fica válida depois de confirmado o pagamento.',
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62; text-align:center;">Recebes este convite por fazeres parte da história da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
    ),
    'v8-convite-institucional.html': dict(
        titulo='50 Anos JSD Famalicão · Convite',
        preheader='Cinco Décadas. Uma Identidade. A JSD Famalicão convida-o(a) para o Jantar Comemorativo dos seus 50 anos.',
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            f'Em 2026, a JSD Famalicão completa <strong {FORTE}>50&nbsp;anos</strong>, e há datas que só fazem sentido quando partilhadas. É com muito gosto que o(a) convidamos para o Jantar Comemorativo, que reunirá várias gerações de militantes num serão de reencontros e de memórias.',
            'No decurso do evento, usarão da palavra representantes das estruturas da JSD e do PSD.',
            'Contamos consigo para celebrarmos juntos meio século de pessoas, ideias e causas. Sem a sua presença, não será igual.',
        ],
        despedida='Com os melhores cumprimentos,',
        botao='CONFIRMAR PRESENÇA',
        alternativa='Caso o botão não funcione, utilize esta ligação:',
        nota='Agradecemos a confirmação de presença através do formulário.',
        rodape_extra='',
    ),
}
ASSINATURA = 'Juventude Social Democrata de Vila Nova de&nbsp;Famalicão'

# ------------------------------------------------------------------ mote em maiúsculas com o degradê da marca
# Como no banner: «CINCO DÉCADAS» em regular e «UMA IDENTIDADE» a negrito, em maiúsculas espaçadas.
# O texto em degradê do CSS (background-clip:text) não funciona no Gmail, por isso cada letra leva a sua
# cor, tirada do degradê da marca (azul → turquesa → âmbar → laranja) na posição horizontal da letra.
# As duas linhas partilham a mesma escala, como se o degradê pintasse o bloco. As cores claras do meio
# são escurecidas só o necessário para terem contraste de 3:1 sobre branco (mínimo para texto grande).
PARAGENS = [(0, '#0E87D9'), (.25, '#1EBCE8'), (.40, '#54CFC9'), (.60, '#F8B451'), (1, '#F86420')]
LARGURA_LETRA = dict(zip('CINODÉASUMET ', [722, 278, 722, 778, 722, 667, 722, 667, 722, 833, 667, 611, 278]))  # Helvetica, /1000 em
MOTE = [('CINCO DÉCADAS', 400), ('UMA IDENTIDADE', 800)]
MOTE_PX, MOTE_ESPACO = 28, 1          # tamanho e espaçamento entre letras (px)


def _luminancia(c):
    f = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (f(v / 255) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def cor_degrade(t, contraste=3.0):
    """Cor do degradê da marca na posição t (0–1), escurecida até ter o contraste pedido sobre branco."""
    for (t0, c0), (t1, c1) in zip(PARAGENS, PARAGENS[1:]):
        if t <= t1:
            u = (t - t0) / (t1 - t0)
            a, b = (int(c0[i:i + 2], 16) for i in (1, 3, 5)), (int(c1[i:i + 2], 16) for i in (1, 3, 5))
            c = [x + (y - x) * u for x, y in zip(a, b)]
            break
    k = 1.0
    while 1.05 / (_luminancia([v * k for v in c]) + 0.05) < contraste:
        k -= 0.005
    return '#%02X%02X%02X' % tuple(round(v * k) for v in c)


def mote():
    """As duas linhas do mote, letra a letra com as cores do degradê."""
    em = MOTE_ESPACO * 1000 / MOTE_PX
    total = max(sum(LARGURA_LETRA[l] + em for l in txt) - em for txt, _ in MOTE)
    linhas = []
    for txt, peso in MOTE:
        x, letras = 0, []
        for l in txt:
            w = LARGURA_LETRA[l]
            letras.append(' ' if l == ' ' else f'<span style="color:{cor_degrade(min(1, (x + w / 2) / total))};">{l}</span>')
            x += w + em
        linhas.append(f'<span style="font-weight:{peso};">{"".join(letras)}</span>')
    return linha('<br>'.join(linhas), 26, 0,
                 f'font-size:{MOTE_PX}px; line-height:{MOTE_PX + 8}px; letter-spacing:{MOTE_ESPACO}px; color:#3E352B;',
                 'left', 't-mote')


# ------------------------------------------------------------------ responsivo (telemóvel)
CSS = '''
      .t-mote      { font-size:28px !important; line-height:36px !important; }'''


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
        cabecalho(titulo=None, subtitulo=None),     # o banner já diz «Jantar Comemorativo · 50 Anos JSD Famalicão»
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        linha(t['despedida'], 28, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        # mote depois da despedida e da assinatura: único elemento gráfico do texto, alinhado com ele
        mote(),
        dados(),
        botao(t['botao'], 32, 0, t['alternativa'], baixo_ligacao=0),
        linha(t['nota'], 16, 44, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_final.py', banner_coluna=True)


import json, re, html as _html

gerados = {}
for nome, t in CONVITES.items():
    html = convite(t)
    (AQUI / nome).write_text(html, encoding='utf-8')
    gerados[nome] = html
    print(nome, len(html.encode('utf-8')), 'bytes')


def texto_simples(doc):
    """Versão em texto simples (para colar em sítios que não aceitam HTML)."""
    corpo = re.sub(r'<!--.*?-->', '', doc, flags=re.S)                                   # comentários
    corpo = re.sub(r'<(style|head)[^>]*>.*?</\1>', '', corpo, flags=re.S)
    corpo = re.sub(r'<div style="display:none;.*?</div>', '', corpo, flags=re.S)        # texto de pré-visualização
    corpo = re.sub(r'<br\s*/?>|</tr>|</p>', '\n', corpo)
    corpo = _html.unescape(re.sub(r'<[^>]+>', '', corpo)).replace('\u00a0', ' ')
    linhas = [re.sub(r'[ \t]+', ' ', l).strip() for l in corpo.splitlines()]
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(linhas)).strip()


# ------------------------------------------------------------------ página auxiliar para copiar sem estragar o layout
# Ao fazer Ctrl+A / Ctrl+C numa página aberta no Chrome, o browser converte as larguras fluidas em píxeis fixos
# (a largura da janela). Esta página põe na área de transferência o HTML ORIGINAL de cada convite.
def pagina_copiar(docs=None, itens=None, nome_pagina='Copiar convites'):
    docs = docs or gerados
    dados = {n: {'html': h, 'texto': texto_simples(h)} for n, h in docs.items()}
    js = json.dumps(dados, ensure_ascii=False).replace('</', '<\\/')
    cartoes = ''.join(f'''
    <section class="cartao">
      <h2>{rotulo}</h2>
      <p class="ficheiro">{nome}</p>
      <button type="button" data-convite="{nome}">Copiar convite</button>
      <p class="estado" id="estado-{i}" aria-live="polite"></p>
      <iframe title="Pré-visualização: {rotulo}" data-previa="{nome}" loading="lazy"></iframe>
    </section>''' for i, (nome, rotulo) in enumerate(itens or [('v7-convite-geral.html', 'Convite geral (militantes)'),
                                                         ('v8-convite-institucional.html', 'Convite institucional')]))
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>{nome_pagina} · 50 anos JSD Famalicão</title>
  <style>
    body {{ margin:0; background:#F6F3EE; color:#1B130C; font-family:"Helvetica Neue",Helvetica,Arial,sans-serif; }}
    main {{ max-width:1100px; margin:0 auto; padding:32px 16px 48px; }}
    h1 {{ font-size:24px; margin:0 0 8px; }}
    ol {{ line-height:1.6; padding-left:20px; margin:0 0 24px; }}
    .grelha {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:24px; }}
    .cartao {{ background:#FFFFFF; border:1px solid #E4D9CB; border-radius:8px; padding:20px; }}
    h2 {{ font-size:18px; margin:0; }}
    .ficheiro {{ color:#6B6054; font-size:13px; margin:4px 0 14px; }}
    button {{ font:inherit; font-weight:700; letter-spacing:1px; text-transform:uppercase; font-size:14px; color:#1B130C; background:#F86420;
              background-image:linear-gradient(90deg,#F8B451,#F86420); border:0; border-radius:4px; padding:14px 22px; cursor:pointer; width:100%; }}
    button:focus-visible {{ outline:3px solid #0B72B8; outline-offset:2px; }}
    .estado {{ min-height:20px; font-size:14px; color:#1E7A3C; margin:10px 0; }}
    iframe {{ width:100%; height:640px; border:1px solid #E4D9CB; border-radius:6px; background:#FFFFFF; }}
  </style>
</head>
<body>
<main>
  <h1>{nome_pagina} · 50 anos JSD Famalicão</h1>
  <ol>
    <li>Clica em <strong>Copiar convite</strong> no convite que queres enviar.</li>
    <li>No Gmail, abre uma <strong>Nova mensagem</strong>, clica no corpo e cola com <strong>Ctrl+V</strong> (⌘+V no Mac).</li>
    <li>Põe os destinatários em <strong>Cco</strong> e envia primeiro um teste para ti (vê no iPhone e num Android).</li>
  </ol>
  <p>Não copies a página com Ctrl+A / Ctrl+C: o browser fixa as larguras em píxeis e o email fica desformatado no telemóvel.</p>
  <div class="grelha">{cartoes}
  </div>
</main>
<script>
  const CONVITES = {js};
  function copiar(nome, estado) {{
    const c = CONVITES[nome];
    let feito = false;
    const aoCopiar = (e) => {{ e.clipboardData.setData('text/html', c.html); e.clipboardData.setData('text/plain', c.texto); e.preventDefault(); feito = true; }};
    document.addEventListener('copy', aoCopiar, {{ once: true }});
    try {{ document.execCommand('copy'); }} catch (_) {{}}
    document.removeEventListener('copy', aoCopiar);
    if (feito) {{ estado.textContent = 'Copiado. Agora cola no Gmail com Ctrl+V.'; return; }}
    if (navigator.clipboard && window.ClipboardItem) {{
      navigator.clipboard.write([new ClipboardItem({{ 'text/html': new Blob([c.html], {{ type: 'text/html' }}), 'text/plain': new Blob([c.texto], {{ type: 'text/plain' }}) }})])
        .then(() => {{ estado.textContent = 'Copiado. Agora cola no Gmail com Ctrl+V.'; }})
        .catch(() => {{ estado.textContent = 'Não foi possível copiar automaticamente neste browser. Usa o Chrome.'; }});
    }} else {{
      estado.textContent = 'Não foi possível copiar automaticamente neste browser. Usa o Chrome.';
    }}
  }}
  document.querySelectorAll('button[data-convite]').forEach((b, i) => b.addEventListener('click', () => copiar(b.dataset.convite, document.getElementById('estado-' + i))));
  document.querySelectorAll('iframe[data-previa]').forEach((f) => {{ f.srcdoc = CONVITES[f.dataset.previa].html; }});
</script>
</body>
</html>
'''


(AQUI / 'copiar-convites.html').write_text(pagina_copiar(), encoding='utf-8')
print('copiar-convites.html criado')
