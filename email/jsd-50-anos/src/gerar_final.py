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
MAPA_HREF = MAPA                      # em comum.py o «&» já vem escapado como &amp;
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
def pagina_copiar():
    dados = {n: {'html': h, 'texto': texto_simples(h)} for n, h in gerados.items()}
    js = json.dumps(dados, ensure_ascii=False).replace('</', '<\\/')
    cartoes = ''.join(f'''
    <section class="cartao">
      <h2>{rotulo}</h2>
      <p class="ficheiro">{nome}</p>
      <button type="button" data-convite="{nome}">Copiar convite</button>
      <p class="estado" id="estado-{i}" aria-live="polite"></p>
      <iframe title="Pré-visualização: {rotulo}" data-previa="{nome}" loading="lazy"></iframe>
    </section>''' for i, (nome, rotulo) in enumerate([('v7-convite-geral.html', 'Convite geral (militantes)'),
                                                         ('v8-convite-institucional.html', 'Convite institucional')]))
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Copiar convites · 50 anos JSD Famalicão</title>
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
  <h1>Copiar convites · 50 anos JSD Famalicão</h1>
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
