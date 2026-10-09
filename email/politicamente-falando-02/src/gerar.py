"""Convite por email · Politicamente Falando #02 · «Justiça em Portugal. Conformada ou reformada?»

Convite institucional e convite geral (militantes). Mesmo modelo dos convites dos 50 anos (email/jsd-50-anos, versões v7/v8, no ramo
claude/jsd-famalicao-dinner-email-uo5ccm): banner da sessão a toda a largura (com o título, o tema, a data, o local e os
oradores) → barra com o degradê da marca → «CONVITE» e traço → carta → assinatura → data, hora e local entre dois
filetes → rodapé com o logo dos 50 anos.

Regras de construção (para sobreviver à colagem no Gmail e ao telemóvel), herdadas dos 50 anos:
- tudo inline; o <style> só aumenta a letra em ecrãs até 600 px (o Gmail descarta-o ao colar e o email continua legível);
- cada bloco de texto é uma linha de tabela e os espaços são padding de <td> (nada de margin);
- larguras fluidas: tabelas com width="100%" (atributo); imagens com width numérico de reserva + max-width:100% no style.
- NUNCA uma largura em % no style (width:50%, width:100%): ao colar, o Chrome (e por isso o Gmail) troca-a pelos píxeis
  que mede na caixa de escrita (width:50% → width:254px) e no telemóvel o bloco fica mais largo do que o ecrã.
  Percentagens só no atributo width="…" ou em max-width/min-width, que chegam intactos (verificado em src/verificar.cjs);
- barras e traço com font-size/line-height iguais à altura (e não 0): a altura não depende de o cliente respeitar
  font-size:0;
- nada que dependa do atributo width das tabelas para ficar no sítio (um cliente pode retirá-lo e a tabela encolhe e
  encosta à esquerda): a data é um <div> com os filetes como bordas, o rodapé e as tabelas interiores centram-se com
  align + margin:0 auto, e o email tem min-width:100%;
- a célula à volta da coluna de texto não centra por herança: cada bloco centrado tem a sua centragem (que o Chrome
  mantém ao colar, por não ser redundante);
- nada de white-space:nowrap (ao colar passa a text-wrap-mode, que o Gmail não conhece): textos que não podem partir
  são divididos em linhas curtas que cabem num ecrã de 320 px.

Nenhuma imagem tem ligação (clicar numa imagem não abre nada). Todas as imagens vão por endereço (nunca embutidas em base64): o HTML fica com ~15 KB e o Gmail não tem de converter
imagens ao colar nem ao enviar.

Gera (a partir de email/politicamente-falando-02/):
- convite-institucional.html e convite-geral.html;
- copiar-convites.html: página que põe o email na área de transferência, para colar no Gmail;
- apps-script/convite_institucional.html e apps-script/convite.html: o mesmo HTML, com os nomes que o script de envio
  pela folha dos 50 anos procura.

Uso: python3 src/preparar_imagens.py && python3 src/gerar.py
"""
import html as _html, json, pathlib, re
from PIL import Image

AQUI = pathlib.Path(__file__).resolve().parent.parent
IMG = AQUI / 'imagens'

# ------------------------------------------------------------------ imagens
# Sempre por endereço. O logo é o dos 50 anos, já publicado no site. As outras estão na pasta imagens/ deste repositório
# (público) e são servidas pelo GitHub com o tipo certo (image/jpeg, image/png); o endereço aponta para um commit fixo,
# por isso a imagem nunca muda depois de o email sair. Se as imagens forem carregadas para o site, basta trocar
# PASTA_IMAGENS por 'https://jsdfamalicao.pt/convite/politicamente-falando-02'.
# Ao mudar uma imagem: preparar_imagens.py, commit e push, e pôr aqui o novo commit.
COMMIT_IMAGENS = '5c4a2498564564ccaa2a655ec7357833293db0dd'
PASTA_IMAGENS = f'https://raw.githubusercontent.com/filipaf18/filipa-freitas-portfolio/{COMMIT_IMAGENS}/email/politicamente-falando-02/imagens'
IMAGENS = {   # nome → (ficheiro local, endereço público)
    'banner': ('banner.jpg', f'{PASTA_IMAGENS}/banner.jpg'),
    'assinatura': ('assinatura-daniela-torres.png', f'{PASTA_IMAGENS}/assinatura-daniela-torres.png'),
    'logo': ('logo-50-anos.png', 'https://jsdfamalicao.pt/convite/logo-50-anos.png'),
}


def src_imagem(nome):
    return IMAGENS[nome][1]


# ------------------------------------------------------------------ evento
SITE = 'https://jsdfamalicao.pt'
MAPA = 'https://www.google.com/maps/search/?api=1&amp;query=Casa+da+Juventude,+Vila+Nova+de+Famalic%C3%A3o'   # «&» já escapado

# ------------------------------------------------------------------ estilo
FONT = "Montserrat,'Helvetica Neue',Helvetica,Arial,sans-serif"
DEGRADE = 'linear-gradient(90deg,#0E87D9 0%,#1EBCE8 25%,#54CFC9 40%,#F8B451 60%,#F86420 100%)'
LADO = 24
ESCURO, TEXTO, MUTED, AZUL, LARANJA, FILETE = '#14181F', '#3A3F47', '#646B75', '#0B72B8', '#F86420', '#DCE1E8'
CORPO = f'font-size:16px; line-height:27px; color:{TEXTO};'
FORTE = f'style="color:{ESCURO};"'
PONTO = f'<span style="color:{LARANJA};">&nbsp;·&nbsp;</span>'

# ------------------------------------------------------------------ textos
ASSINANTE = ('Daniela Torres', 'Presidente da Comissão Política da JSD&nbsp;Famalicão')
TEMA_TXT = '«Justiça em Portugal. Conformada ou reformada?»'

CONVITES = {
    'institucional': dict(
        ficheiro='convite-institucional.html', apps_script='convite_institucional.html',
        rotulo='Convite institucional', assunto='Convite · Politicamente Falando #02',
        titulo='Politicamente Falando #02 · Convite',
        preheader='Justiça em Portugal. Conformada ou reformada? Sexta-feira, 16 de outubro, às 21h00, na Casa da Juventude.',
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            f'A Juventude Social Democrata de Vila Nova de Famalicão tem a honra de o(a) convidar para a segunda sessão da iniciativa <strong {FORTE}>Politicamente Falando</strong>, subordinada ao tema <strong {FORTE}>{TEMA_TXT}</strong>.',
            f'Esta sessão contará com a participação de <strong {FORTE}>Eva Brás Pinho</strong>, Deputada à Assembleia da República, e de <strong {FORTE}>Álvaro Oliveira</strong>, Advogado, promovendo um espaço de reflexão, diálogo e partilha de ideias sobre o estado da justiça em Portugal.',
        ],
        fecho='Contamos com a sua presença.',
        despedida='Com os melhores cumprimentos,',
        rodape_extra='',
    ),
    'geral': dict(
        ficheiro='convite-geral.html', apps_script='convite.html',
        rotulo='Convite geral (militantes)', assunto='Politicamente Falando #02 · Justiça em Portugal',
        titulo='Politicamente Falando #02 · Justiça em Portugal',
        preheader='Justiça em Portugal. Conformada ou reformada? Sexta-feira, 16 de outubro, às 21h00, na Casa da Juventude.',
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            f'A JSD Famalicão convida-te para a segunda sessão do <strong {FORTE}>Politicamente Falando</strong>, desta vez dedicada ao tema <strong {FORTE}>{TEMA_TXT}</strong>.',
            f'Vamos contar com <strong {FORTE}>Eva Brás Pinho</strong>, Deputada à Assembleia da República, e com <strong {FORTE}>Álvaro Oliveira</strong>, Advogado, para um espaço de reflexão, diálogo e partilha de ideias sobre o estado da justiça em Portugal.',
        ],
        fecho='Traz as tuas perguntas e vem fazer parte da conversa. Contamos contigo!',
        despedida='Até lá,',
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:{MUTED}; text-align:center;">Recebes este convite por fazeres parte da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
    ),
}


# ------------------------------------------------------------------ peças (as mesmas dos 50 anos)
def sem_rasto(texto):
    """Última letra sem letter-spacing: o espaço a seguir a ela desviava o texto centrado para a esquerda."""
    return f'{texto[:-1]}<span style="letter-spacing:0;">{texto[-1]}</span>'


def linha(html, cima=0, baixo=0, estilo=CORPO, alinhar='left', classe='t-corpo'):
    """Um bloco de texto = uma linha de tabela; o espaço vem do padding da célula."""
    return f'''
          <tr>
            <td class="px {classe}" align="{alinhar}" style="padding:{cima}px {LADO}px {baixo}px {LADO}px; font-family:{FONT}; {estilo} text-align:{alinhar};">{html}</td>
          </tr>'''


def traco(cima=0, baixo=0):
    """Traço curto laranja, centrado."""
    return f'''
          <tr>
            <td align="center" style="padding:{cima}px {LADO}px {baixo}px {LADO}px; text-align:center;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr><td width="56" height="2" bgcolor="{LARANJA}" style="width:56px; height:2px; background-color:{LARANJA}; font-size:2px; line-height:2px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>'''


# ------------------------------------------------------------------ blocos
ASSINATURA_PX = 190


def assinatura():
    nome, cargo = ASSINANTE
    w, h = Image.open(IMG / IMAGENS['assinatura'][0]).size
    alt = round(ASSINATURA_PX * h / w)
    return f'''
          <tr>
            <td class="px" align="left" style="padding:14px {LADO}px 0 {LADO}px; font-size:0; line-height:0; text-align:left;"><img src="{src_imagem('assinatura')}" width="{ASSINATURA_PX}" height="{alt}" alt="Assinatura de {nome}" style="display:block; width:{ASSINATURA_PX}px; height:{alt}px; border:0; outline:none; color:{AZUL}; font-family:{FONT}; font-size:14px; line-height:20px;"></td>
          </tr>''' + linha(nome, 8, 0, f'font-size:16px; line-height:24px; font-weight:700; color:{ESCURO};') + \
        linha(cargo, 2, 0, f'font-size:14px; line-height:21px; color:{MUTED};', classe='t-cargo')


def dados():
    """Data, hora e local: três linhas centradas num bloco <div> entre dois filetes, que são as bordas do próprio bloco.
    Um <div> ocupa a largura toda sem precisar do atributo width (que um cliente pode retirar: uma tabela sem ele encolhe
    até à largura do texto e encosta à esquerda, com os filetes do tamanho do texto). Cada linha é um <div> com
    text-align:center próprio; nada depende de &nbsp; com font-size:0 nem de <br>."""
    linha_css = f'text-align:center; font-family:{FONT}; font-size:15px; line-height:26px; color:{TEXTO};'
    return f'''
          <tr>
            <td class="px" style="padding:40px {LADO}px 48px {LADO}px;">
              <div style="border-top:1px solid {FILETE}; border-bottom:1px solid {FILETE}; padding:24px 0; text-align:center;">
                <div class="t-dados" style="{linha_css}"><strong {FORTE}>Sexta-feira, 16&nbsp;de&nbsp;outubro de&nbsp;2026</strong></div>
                <div class="t-dados" style="padding-top:3px; {linha_css}">21h00{PONTO}<strong {FORTE}>Casa da Juventude</strong></div>
                <div class="t-dados" style="padding-top:3px; {linha_css}"><a href="{MAPA}" style="color:{MUTED}; text-decoration:underline;">Vila Nova de&nbsp;Famalicão</a></div>
              </div>
            </td>
          </tr>'''


# ------------------------------------------------------------------ página
CSS_TELEMOVEL = '''
      .px          { padding-left:22px !important; padding-right:22px !important; }
      .t-etiqueta  { font-size:13px !important; line-height:18px !important; }
      .t-corpo     { font-size:18px !important; line-height:30px !important; }
      .t-cargo     { font-size:14px !important; line-height:20px !important; }
      .t-dados     { font-size:17px !important; line-height:28px !important; }
      .t-rodape    { font-size:14px !important; line-height:22px !important; }
      .t-rodape-p  { font-size:13px !important; line-height:20px !important; }
'''


def pagina(t, largura=1040):
    estilo_img = f'border:0; outline:none; color:#FFFFFF; font-family:{FONT}; font-size:20px; line-height:28px; text-align:center;'
    barra = f'''
    <tr>
      <td height="6" bgcolor="{LARANJA}" style="height:6px; font-size:6px; line-height:6px; background-color:{LARANJA}; background-image:{DEGRADE};">&nbsp;</td>
    </tr>'''
    corpo = ''.join([
        # o banner já diz «Politicamente Falando #02», o tema, a data e quem participa: aqui só «CONVITE» e o traço
        linha(sem_rasto('CONVITE'), 44, 0, f'font-size:12px; line-height:16px; font-weight:700; letter-spacing:4px; color:{AZUL};', 'center', 't-etiqueta'),
        traco(24, 0),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        linha(t['fecho'], 30, 0),
        linha(t['despedida'], 24, 0),
        assinatura(),
        dados(),
    ])
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>{t['titulo']}</title>
  <style>
    /* Em ecrãs até 600 px (telemóveis) a letra aumenta. As medidas inline continuam a ser a base. */
    body {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
    :root {{ color-scheme:light only; supported-color-schemes:light only; }}
    a[x-apple-data-detectors] {{ color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; }}
    @media only screen and (max-width:600px) {{{CSS_TELEMOVEL}
    }}
  </style>
</head>

<!-- Gerado por src/gerar.py. Banner e barras a toda a largura; texto numa coluna de até {largura} px. -->

<body style="margin:0; padding:0; background-color:#FFFFFF;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#FFFFFF;">
    {t['preheader']}
    &#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="min-width:100%; background-color:#FFFFFF; font-family:{FONT}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; color-scheme:light only;">

    <tr>
      <td align="center" bgcolor="#565459" style="background-color:#565459; font-size:0; line-height:0; text-align:center;">
        <img src="{src_imagem('banner')}" width="640" alt="Politicamente Falando #02. Justiça em Portugal. Conformada ou reformada? 16 de outubro, 21h00, Casa da Juventude, Famalicão. Com Eva Brás Pinho, Deputada à Assembleia da República, e Álvaro Oliveira, Advogado."
             style="display:block; min-width:100%; max-width:100%; height:auto; {estilo_img}">
      </td>
    </tr>{barra}

    <tr>
      <td style="padding:0;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:{largura}px; margin:0 auto;">
{corpo}
        </table>
      </td>
    </tr>
{barra}

    <tr>
      <td class="px" align="center" bgcolor="#F5F7FA" style="background-color:#F5F7FA; padding:36px {LADO}px 32px {LADO}px; font-family:{FONT}; text-align:center;">
        <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr><td align="center" style="font-size:0; line-height:0; text-align:center;"><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="font-size:0; line-height:0;"><img src="{src_imagem('logo')}" width="170" alt="50 anos JSD Famalicão" style="display:block; width:170px; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:16px; line-height:22px;"></td></tr></table></td></tr>
          <tr><td class="t-rodape" align="center" style="padding-top:22px; font-family:{FONT}; font-size:12px; line-height:19px; color:{MUTED}; text-align:center;">Juventude Social Democrata de Vila&nbsp;Nova de&nbsp;Famalicão<br><a href="{SITE}" style="color:{ESCURO}; text-decoration:underline;">jsdfamalicao.pt</a></td></tr>{t['rodape_extra']}
        </table>
      </td>
    </tr>

  </table>

</body>
</html>
'''


def texto_simples(doc):
    """Versão em texto simples (vai junto do HTML ao copiar, para sítios que não aceitam HTML)."""
    corpo = re.sub(r'<!--.*?-->', '', doc, flags=re.S)
    corpo = re.sub(r'<(style|head)[^>]*>.*?</\1>', '', corpo, flags=re.S)
    corpo = re.sub(r'<div style="display:none;.*?</div>', '', corpo, flags=re.S)
    corpo = re.sub(r'<br\s*/?>|</tr>|</p>', '\n', corpo)
    corpo = _html.unescape(re.sub(r'<[^>]+>', '', corpo)).replace(' ', ' ')
    linhas = [re.sub(r'[ \t]+', ' ', l).strip() for l in corpo.splitlines()]
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(linhas)).strip()


# ------------------------------------------------------------------ página para copiar sem estragar o layout
# Com Ctrl+A / Ctrl+C numa página aberta, o Chrome fixa as larguras fluidas em píxeis (a largura da janela) e o email
# chega ao telemóvel mais largo do que o ecrã. Esta página põe na área de transferência o HTML ORIGINAL de cada convite.
def pagina_copiar(docs):
    dados_js = {k: {'html': h, 'texto': texto_simples(h), 'assunto': CONVITES[k]['assunto']} for k, h in docs.items()}
    js = json.dumps(dados_js, ensure_ascii=False).replace('</', '<\\/')
    cartoes = ''.join(f'''
    <section class="cartao">
      <h2>{CONVITES[k]['rotulo']}</h2>
      <p class="assunto">Assunto: <strong>{CONVITES[k]['assunto']}</strong></p>
      <div class="botoes">
        <button type="button" data-copiar="{k}">Copiar convite</button>
        <button type="button" class="secundario" data-assunto="{k}">Copiar assunto</button>
      </div>
      <p class="estado" id="estado-{k}" aria-live="polite"></p>
      <iframe title="Pré-visualização: {CONVITES[k]['rotulo']}" data-previa="{k}" loading="lazy"></iframe>
    </section>''' for k in docs)
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Copiar convites · Politicamente Falando #02</title>
  <style>
    body {{ margin:0; background:#F2F4F7; color:#14181F; font-family:"Helvetica Neue",Helvetica,Arial,sans-serif; }}
    main {{ max-width:1100px; margin:0 auto; padding:32px 16px 48px; }}
    h1 {{ font-size:24px; margin:0 0 8px; }}
    ol {{ line-height:1.6; padding-left:20px; margin:0 0 16px; }}
    .aviso {{ color:#646B75; margin:0 0 24px; }}
    .grelha {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:24px; }}
    .cartao {{ background:#FFFFFF; border:1px solid #DCE1E8; border-radius:8px; padding:20px; min-width:0; }}
    h2 {{ font-size:18px; margin:0; }}
    .assunto {{ color:#3A3F47; font-size:14px; margin:6px 0 14px; overflow-wrap:anywhere; }}
    .botoes {{ display:flex; gap:10px; flex-wrap:wrap; }}
    button {{ font:inherit; font-weight:700; letter-spacing:1px; text-transform:uppercase; font-size:14px; color:#14181F; background:#F86420;
              background-image:linear-gradient(90deg,#F8B451,#F86420); border:0; border-radius:4px; padding:14px 22px; cursor:pointer; flex:1 1 auto; }}
    button.secundario {{ background:#FFFFFF; background-image:none; border:1px solid #DCE1E8; flex:0 1 auto; }}
    button:focus-visible {{ outline:3px solid #0B72B8; outline-offset:2px; }}
    .estado {{ min-height:20px; font-size:14px; color:#1E7A3C; margin:10px 0; }}
    iframe {{ width:100%; height:640px; border:1px solid #DCE1E8; border-radius:6px; background:#FFFFFF; }}
  </style>
</head>
<body>
<main>
  <h1>Copiar convites · Politicamente Falando #02</h1>
  <ol>
    <li>Clica em <strong>Copiar convite</strong> no convite que queres enviar.</li>
    <li>No Gmail, abre uma <strong>Nova mensagem</strong>, clica no corpo e cola com <strong>Ctrl+V</strong> (⌘+V no Mac). Copia também o assunto.</li>
    <li>Põe os destinatários em <strong>Cco</strong> e envia primeiro um teste para ti (vê no telemóvel e no computador).</li>
  </ol>
  <p class="aviso">Não copies o convite aberto no browser com Ctrl+A / Ctrl+C: o browser fixa as larguras em píxeis e o email fica desformatado no telemóvel.</p>
  <div class="grelha">{cartoes}
  </div>
</main>
<script>
  const CONVITES = {js};
  function copiar(tipo, texto, estado, mensagem) {{
    let feito = false;
    const aoCopiar = (e) => {{
      if (tipo === 'html') e.clipboardData.setData('text/html', texto.html);
      e.clipboardData.setData('text/plain', tipo === 'html' ? texto.texto : texto);
      e.preventDefault(); feito = true;
    }};
    document.addEventListener('copy', aoCopiar, {{ once: true }});
    try {{ document.execCommand('copy'); }} catch (_) {{}}
    document.removeEventListener('copy', aoCopiar);
    if (feito) {{ estado.textContent = mensagem; return; }}
    const partes = tipo === 'html'
      ? {{ 'text/html': new Blob([texto.html], {{ type: 'text/html' }}), 'text/plain': new Blob([texto.texto], {{ type: 'text/plain' }}) }}
      : {{ 'text/plain': new Blob([texto], {{ type: 'text/plain' }}) }};
    if (navigator.clipboard && window.ClipboardItem) {{
      navigator.clipboard.write([new ClipboardItem(partes)])
        .then(() => {{ estado.textContent = mensagem; }})
        .catch(() => {{ estado.textContent = 'Não foi possível copiar automaticamente neste browser. Usa o Chrome.'; }});
    }} else {{
      estado.textContent = 'Não foi possível copiar automaticamente neste browser. Usa o Chrome.';
    }}
  }}
  document.querySelectorAll('button[data-copiar]').forEach((b) => b.addEventListener('click', () =>
    copiar('html', CONVITES[b.dataset.copiar], document.getElementById('estado-' + b.dataset.copiar), 'Convite copiado. Agora cola no Gmail com Ctrl+V.')));
  document.querySelectorAll('button[data-assunto]').forEach((b) => b.addEventListener('click', () =>
    copiar('texto', CONVITES[b.dataset.assunto].assunto, document.getElementById('estado-' + b.dataset.assunto), 'Assunto copiado.')));
  document.querySelectorAll('iframe[data-previa]').forEach((f) => {{ f.srcdoc = CONVITES[f.dataset.previa].html; }});
</script>
</body>
</html>
'''


if __name__ == '__main__':
    gerados = {}
    (AQUI / 'apps-script').mkdir(exist_ok=True)
    for chave, t in CONVITES.items():
        gerados[chave] = pagina(t)
        assert 'data:image' not in gerados[chave]
        (AQUI / t['ficheiro']).write_text(gerados[chave], encoding='utf-8')
        (AQUI / 'apps-script' / t['apps_script']).write_text(gerados[chave], encoding='utf-8')
        print(f"{t['ficheiro']} e apps-script/{t['apps_script']}: {len(gerados[chave].encode()) // 1024} KB")
    (AQUI / 'copiar-convites.html').write_text(pagina_copiar(gerados), encoding='utf-8')
    print('copiar-convites.html')
