"""Terceiro email: confirmação da inscrição + informações sobre o evento (dress code e after party).
v11 (geral) e v12 (institucional). Mesma base visual dos convites v7/v8 e do lembrete v9/v10.

Ordem: banner «Jantar Comemorativo» e «INSCRIÇÃO CONFIRMADA» (como «CONVITE» nos convites v7/v8) → saudação e 2 parágrafos → data, hora e local entre dois filetes →
MAIS INFORMAÇÕES: só o mood board do dress code (dresscode/dresscode-casual-chic.jpg, fornecido), sem texto por baixo →
AFTER PARTY no Classe Bar (logo dresscode/classe-bar-logo.png, preparado por src/preparar_logo_classe.py) e a frase da
after party → «Cuidámos de cada pormenor…», despedida, assinatura e mote. Textos fornecidos pela JSD Famalicão.

As etiquetas da paleta no mood board são muito pequenas (14 px num ficheiro de 1600 px) e não se leem num telemóvel;
o texto alternativo da imagem traz a paleta por extenso (leitores de ecrã e imagens bloqueadas).

Uso: python3 src/gerar_confirmacao.py  (a partir de email/jsd-50-anos/)
Nota: importar gerar_final volta a gerar v7/v8 e copiar-convites.html (saída idêntica).
"""
import base64, json, re
from gerar_final import *          # comum.py, mote(), MUTED, MAPA_LINK, ASSINATURA, pagina_copiar…

SITE_50 = 'https://jsdfamalicao.pt/50-anos'     # o banner leva ao site (já não há nada para «inscrever»)

# As imagens (banner, dress code, logo do rodapé e logo do Classe Bar) vão por endereço, ver IMAGENS_ONLINE em comum.py.

# ------------------------------------------------------------------ textos (registo geral e institucional)
CONFIRMACOES = {
    'geral': dict(
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            f'Está confirmada a tua inscrição no Jantar Comemorativo dos <strong {FORTE}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão. '
            'Obrigado por quereres partilhar connosco uma noite tão especial.',
            'Abaixo encontras os detalhes do jantar, o dress code e as informações da after party.',
        ],
        after_party=f'Se quiseres prolongar a noite, o <strong {FORTE}>Classe&nbsp;Bar</strong> espera-nos a partir das '
                    f'<strong {FORTE}>01h30</strong>, com entrada gratuita para todos os convidados.',
        fecho='Cuidámos de cada pormenor. Resta desfrutares da noite.',
        despedida='Até lá,',
        nota='Qualquer dúvida, responde a este email.',
        rodape_extra=f'''
          <tr><td class="t-rodape-p" align="center" style="padding-top:22px; font-family:{FONT}; font-size:11px; line-height:18px; color:#7A6F62; text-align:center;">Recebes este email por te teres inscrito no Jantar Comemorativo dos 50 anos da JSD&nbsp;Famalicão. Se não quiseres receber mais mensagens, responde a este email.</td></tr>''',
        preheader='A tua inscrição está confirmada. Sábado, 7 de novembro, 19h00, Sunset House. Dress code e after party.',
    ),
    'institucional': dict(
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            f'É com enorme satisfação que confirmamos a sua inscrição no Jantar Comemorativo dos <strong {FORTE}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão. '
            'Agradecemos que tenha escolhido partilhar connosco uma noite tão especial.',
            'Encontrará abaixo os detalhes do jantar, bem como as indicações sobre o dress code e a after party.',
        ],
        after_party=f'Para quem desejar prolongar a noite, o <strong {FORTE}>Classe&nbsp;Bar</strong> acolherá os convidados a partir das '
                    f'<strong {FORTE}>01h30</strong>, com entrada gratuita para os mesmos.',
        fecho='Cuidámos de cada pormenor. Resta-lhe desfrutar da noite.',
        despedida='Com os melhores cumprimentos,',
        nota='Para qualquer esclarecimento, responda a este email.',
        rodape_extra='',
        preheader='A sua inscrição está confirmada. Sábado, 7 de novembro, 19h00, Sunset House. Dress code e after party.',
    ),
}

ALT_DRESSCODE = ('Dress code: Casual Chic. Tons base: castanho, bege, azul-marinho, preto e branco. '
                 'Apontamentos de cor: laranja queimado e dourado.')

# ------------------------------------------------------------------ blocos
CSS = '''
      .t-mote      { font-size:28px !important; line-height:36px !important; }
      .t-sub       { font-size:12px !important; line-height:18px !important; }'''


def sub(texto, cima, baixo=0, alinhar='center'):
    """Subtítulo pequeno, em maiúsculas espaçadas."""
    return linha(sem_rasto(texto) if alinhar == 'center' else texto, cima, baixo,
                 f'font-size:11px; line-height:16px; font-weight:700; letter-spacing:3px; color:{MUTED}; text-transform:uppercase;',
                 alinhar, 't-sub')


def dados_confirmacao():
    """Data, hora, local e morada (o preço já não interessa: a inscrição está confirmada) entre dois filetes."""
    return filete(32, 0) + linha(
        f'<strong {FORTE}>Sábado, 7&nbsp;de&nbsp;novembro de&nbsp;2026</strong><br>'
        f'19h00{PONTO}<strong {FORTE}>Sunset&nbsp;House</strong><br>'
        f'{MAPA_LINK}',
        24, 24, 'font-size:15px; line-height:29px; color:#3E352B;', 'center', 't-dados') + filete()


def imagem_dresscode(cima):
    """A imagem do dress code ocupa a largura da coluna de texto (992 px no computador, a largura do ecrã no telemóvel).
    width numérico + min/max-width:100% sobrevive ao Ctrl+C do Chrome e à colagem no Gmail (ver LEIA-ME)."""
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px 0px {LADO}px; font-size:0; line-height:0; text-align:center;">
              <img src="{src_imagem('dresscode')}" width="992" alt="{ALT_DRESSCODE}" style="display:block; min-width:100%; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:16px; line-height:24px;">
            </td>
          </tr>'''


def logo_classe(cima):
    return f'''
          <tr>
            <td class="px" align="center" style="padding:{cima}px {LADO}px 0px {LADO}px; font-size:0; line-height:0; text-align:center;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="font-size:0; line-height:0; text-align:center;">
                <img src="{src_imagem('classe-bar')}" width="240" alt="Classe Bar" style="display:block; width:240px; max-width:100%; height:auto; border:0; outline:none; color:{ESCURO}; font-family:{FONT}; font-size:24px; line-height:30px;">
              </td></tr></table>
            </td>
          </tr>'''


def informacoes(t):
    return ''.join([
        linha(sem_rasto('MAIS INFORMAÇÕES'), 48, 0, ETIQUETA, 'center', 't-etiqueta'),
        imagem_dresscode(24),                         # só o mood board, sem texto por baixo
        filete(44, 0),
        sub('After party', 40, 0),
        logo_classe(16),
        linha(t['after_party'], 16, 0, CORPO, 'center'),
        linha(t['fecho'], 44, 0, f'font-size:20px; line-height:30px; font-weight:300; color:{ESCURO};', 'center', 't-citacao'),
    ])


def confirmacao(t):
    corpo = ''.join([
        cabecalho('INSCRIÇÃO CONFIRMADA', titulo=None, subtitulo=None),     # o banner já diz «Jantar Comemorativo · 50 Anos JSD Famalicão»
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        dados_confirmacao(),
        informacoes(t),
        filete(44, 0),
        linha(t['despedida'], 32, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        mote(),
        linha(t['nota'], 32, 44, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
    ])
    html = pagina('50 Anos JSD Famalicão · Inscrição confirmada', t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_confirmacao.py', banner_coluna=True, link_banner=SITE_50)
    # tirar a indentação não muda nada no ecrã e poupa alguns KB
    return re.sub(r'\n[ \t]+', '\n', html)


def pagina_copiar_um(rotulo, html):
    """Página para ligar a partir do Excel: ao abrir, copia o email para a área de transferência (para colar no Gmail com Ctrl+V).
    Chrome e Edge deixam copiar ao abrir (separador ativo); Firefox e Safari, ou um browser sem foco, exigem um clique: a página
    mostra então um botão grande e também copia com um clique em qualquer sítio. Copia o HTML ORIGINAL (não a página
    desenhada), como a copiar-confirmacoes.html: copiar a página com Ctrl+A / Ctrl+C estraga as larguras no telemóvel."""
    dados = json.dumps({'html': html, 'texto': texto_simples(html)}, ensure_ascii=False).replace('</', '<\\/')
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Copiar · {rotulo} · 50 anos JSD Famalicão</title>
  <style>
    body {{ margin:0; background:#F6F3EE; color:#1B130C; font-family:"Helvetica Neue",Helvetica,Arial,sans-serif; }}
    main {{ max-width:760px; margin:0 auto; padding:32px 16px 48px; }}
    .etiqueta {{ margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#0B72B8; }}
    h1 {{ margin:0 0 10px; font-size:30px; line-height:38px; font-weight:300; }}
    h1.ok {{ color:#1E7A3C; }}
    p {{ margin:0 0 14px; font-size:17px; line-height:27px; color:#3E352B; }}
    button {{ font:inherit; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; font-size:16px; color:#1B130C; background:#F86420;
              background-image:linear-gradient(90deg,#F8B451,#F86420); border:0; border-radius:4px; padding:20px 26px; cursor:pointer; width:100%; margin:6px 0 18px; }}
    button:focus-visible {{ outline:3px solid #0B72B8; outline-offset:2px; }}
    ol {{ margin:0 0 24px; padding-left:22px; line-height:1.7; font-size:16px; color:#3E352B; }}
    iframe {{ width:100%; height:720px; border:1px solid #E4D9CB; border-radius:6px; background:#FFFFFF; }}
    [hidden] {{ display:none !important; }}
  </style>
</head>
<body>
<main>
  <p class="etiqueta">{rotulo}</p>
  <h1 id="titulo">A copiar o email…</h1>
  <p id="texto" aria-live="polite">Se nada acontecer em dois segundos, clica no botão.</p>
  <button type="button" id="botao" hidden>Copiar o email</button>
  <ol>
    <li>Abre o Gmail e clica em <strong>Nova mensagem</strong>.</li>
    <li>Clica no corpo da mensagem e cola com <strong>Ctrl+V</strong> (⌘+V no Mac).</li>
    <li>Põe o destinatário (em <strong>Cco</strong>, se forem vários) e envia primeiro um teste para ti.</li>
  </ol>
  <noscript><p>Ativa o JavaScript para copiar o email.</p></noscript>
  <iframe id="previa" title="Pré-visualização do email"></iframe>
</main>
<script>
  const E = {dados};
  const titulo = document.getElementById('titulo'), texto = document.getElementById('texto'), botao = document.getElementById('botao');
  let feito = false;
  function copiar() {{
    if (feito) return Promise.resolve(true);
    let ok = false;
    // 1.º: o HTML original, pelo evento de cópia (exige um clique em alguns browsers)
    const aoCopiar = (e) => {{ e.clipboardData.setData('text/html', E.html); e.clipboardData.setData('text/plain', E.texto); e.preventDefault(); ok = true; }};
    document.addEventListener('copy', aoCopiar, {{ once: true }});
    try {{ document.execCommand('copy'); }} catch (_) {{}}
    document.removeEventListener('copy', aoCopiar);
    if (ok) return Promise.resolve(true);
    // 2.º: API da área de transferência (Chrome e Edge deixam, sem clique, quando o separador está ativo)
    if (navigator.clipboard && window.ClipboardItem) {{
      return navigator.clipboard.write([new ClipboardItem({{ 'text/html': new Blob([E.html], {{ type: 'text/html' }}), 'text/plain': new Blob([E.texto], {{ type: 'text/plain' }}) }})])
        .then(() => true).catch(() => false);
    }}
    return Promise.resolve(false);
  }}
  function tentar() {{
    copiar().then((ok) => {{
      if (ok && !feito) {{
        feito = true;
        titulo.textContent = '✓ Email copiado'; titulo.className = 'ok';
        texto.textContent = 'Já está na área de transferência. Vai ao Gmail e cola na mensagem (passos abaixo).';
        botao.hidden = true;
      }} else if (!ok && !feito) {{
        titulo.textContent = 'Clica para copiar';
        texto.textContent = 'O browser pede um clique para copiar. Clica no botão (ou em qualquer sítio desta página).';
        botao.hidden = false;
      }}
    }});
  }}
  botao.addEventListener('click', tentar);
  document.addEventListener('click', tentar);                      // um clique em qualquer sítio também serve
  window.addEventListener('focus', tentar);                        // o browser só ganha foco depois de abrir a página
  document.addEventListener('visibilitychange', () => {{ if (!document.hidden) tentar(); }});
  document.getElementById('previa').srcdoc = E.html;
  tentar();
</script>
</body>
</html>
'''


FINAIS = {'v11-confirmacao-geral.html': 'geral', 'v12-confirmacao-institucional.html': 'institucional'}

if __name__ == '__main__':
    docs = {}
    for nome, registo in FINAIS.items():
        docs[nome] = confirmacao(CONFIRMACOES[registo])
        (AQUI / nome).write_text(docs[nome], encoding='utf-8')
        print(nome, len(docs[nome].encode('utf-8')), 'bytes')

    (AQUI / 'copiar-confirmacoes.html').write_text(pagina_copiar(
        docs, [('v11-confirmacao-geral.html', 'Confirmação geral (militantes)'),
               ('v12-confirmacao-institucional.html', 'Confirmação institucional')],
        'Copiar confirmações').replace('no convite que queres enviar', 'na confirmação que queres enviar'), encoding='utf-8')
    print('copiar-confirmacoes.html criado')

    # uma página por email, para ligar a partir do Excel (copia ao abrir)
    for nome, rotulo, ficheiro in [('v11-confirmacao-geral.html', 'Confirmação · militantes (geral)', 'copiar-confirmacao-geral.html'),
                                   ('v12-confirmacao-institucional.html', 'Confirmação · institucional', 'copiar-confirmacao-institucional.html')]:
        (AQUI / ficheiro).write_text(pagina_copiar_um(rotulo, docs[nome]), encoding='utf-8')
        print(ficheiro, 'criado')
