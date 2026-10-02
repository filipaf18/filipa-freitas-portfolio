"""Versões dos emails para enviar por Google Apps Script. As imagens com endereço público (IMAGENS_ONLINE em comum.py:
banner, dress code e logo do rodapé) ficam por endereço; as que continuam embutidas (hoje só o logo do Classe Bar, no
3.º email) seguem como anexos «inline» (CID). Para quem já tem o seu script, o que interessa são os HTML de
html/ (e v7 a v12 já vêm por endereço; ver LEIA-ME).

Antes de haver endereços para as imagens, tudo o que estava embutido ia como anexo «inline» (CID).

Porquê: o Gmail (web e apps) NÃO mostra imagens `data:` (base64) dentro do HTML de um email recebido; só o Mail
do iPhone as mostra. Ao colar o email no Gmail, o próprio Gmail converte as imagens em anexos inline e por isso
funciona, mas um script (GmailApp / MailApp) envia o HTML tal como está. A solução que dispensa alojar as imagens
num site é o parâmetro `inlineImages` do Apps Script: o HTML refere `cid:nome` e as imagens seguem anexadas
ao próprio email (multipart/related), que o Gmail mostra no sítio certo, sem pedir «Mostrar imagens».

Lê os HTML finais (v7 a v12, já gerados), troca cada imagem base64 por `cid:nome` e escreve em apps-script/:
  html/<email>.html     o HTML com `cid:` (para quem já tem o seu script e só quer trocar o HTML)
  Imagens.gs            banner e logo em base64 + imagensInline(nomes) → blobs para o `inlineImages`
  ImagensDressCode.gs   imagens da confirmação (v11/v12), à parte porque pesam mais
  Convites.gs           os HTML e os textos simples, como constantes (nada a criar no projeto além dos .gs)
  Enviar.gs             enviarEmail(destinatario, chave) e testeParaMim()

Uso (a partir de email/jsd-50-anos/):  python3 src/gerar_apps_script.py
Depois de mudar qualquer texto ou imagem: correr primeiro os geradores (gerar_final, gerar_lembrete,
gerar_confirmacao) e a seguir este.
"""
import base64, html as _html, json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from comum import IMAGENS_ONLINE

AQUI = pathlib.Path(__file__).resolve().parent.parent
SAIDA = AQUI / 'apps-script'

# nome do CID → ficheiro. Uma imagem desconhecida num HTML pára o script (acrescenta-a aqui).
IMAGENS = {
    'banner': 'banner-jantar.jpg',
    'logo': 'logo-50-anos.png',
    'dresscode': 'dresscode/dresscode-casual-chic.jpg',
    'classe-bar': 'dresscode/classe-bar-logo.png',
    'banner-faixa': 'banner-faixa.jpg',
}
MIME = {'.jpg': 'image/jpeg', '.png': 'image/png'}
BASE = ['banner', 'logo', 'banner-faixa']              # Imagens.gs
DRESSCODE = ['dresscode', 'classe-bar']                # ImagensDressCode.gs

# chave, ficheiro, descrição
EMAILS = [
    ('convite-geral', 'v7-convite-geral.html', '1.º email · convite, militantes'),
    ('convite-institucional', 'v8-convite-institucional.html', '1.º email · convite, institucionais'),
    ('lembrete-geral', 'v9-lembrete-geral.html', '2.º email · lembrete do pagamento, militantes'),
    ('lembrete-institucional', 'v10-lembrete-institucional.html', '2.º email · lembrete do pagamento, institucionais'),
    ('confirmacao-geral', 'v11-confirmacao-geral.html', '3.º email · inscrição confirmada, militantes'),
    ('confirmacao-institucional', 'v12-confirmacao-institucional.html', '3.º email · inscrição confirmada, institucionais'),
]


def texto_simples(doc):
    """Versão em texto simples (corpo alternativo para quem não vê HTML)."""
    corpo = re.sub(r'<!--.*?-->', '', doc, flags=re.S)
    corpo = re.sub(r'<(style|head)[^>]*>.*?</\1>', '', corpo, flags=re.S)
    corpo = re.sub(r'<div style="display:none;.*?</div>', '', corpo, flags=re.S)
    corpo = re.sub(r'<br\s*/?>|</tr>|</p>', '\n', corpo)
    corpo = _html.unescape(re.sub(r'<[^>]+>', '', corpo)).replace(' ', ' ')
    linhas = [re.sub(r'[ \t]+', ' ', l).strip() for l in corpo.splitlines()]
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(linhas)).strip()


def b64(nome):
    return base64.b64encode((AQUI / IMAGENS[nome]).read_bytes()).decode()


def js_modelo(texto):
    """Texto como literal de modelo (`...`) do JavaScript, mantendo as quebras de linha."""
    return '`' + texto.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${') + '`'


def js_base64(nome, largura=110):
    b = b64(nome)
    linhas = [b[i:i + largura] for i in range(0, len(b), largura)]
    return '[\n      ' + ',\n      '.join(f"'{l}'" for l in linhas) + '\n    ].join(\'\')'


def ficheiro_imagens(nomes, cabecalho, funcao):
    entradas = ',\n'.join(
        f"    '{n}': {{ mime: '{MIME[pathlib.Path(IMAGENS[n]).suffix]}', ficheiro: '{pathlib.Path(IMAGENS[n]).name}', base64: {js_base64(n)} }}"
        for n in nomes)
    return f'''{cabecalho}
function {funcao}() {{
  return {{
{entradas}
  }};
}}
'''


def main():
    por_conteudo = {b64(n): n for n in IMAGENS if (AQUI / IMAGENS[n]).exists()}
    SAIDA.mkdir(exist_ok=True)
    (SAIDA / 'html').mkdir(exist_ok=True)
    usadas, registos = {}, []
    for chave, ficheiro, descricao in EMAILS:
        original = (AQUI / ficheiro).read_text(encoding='utf-8')
        nomes = []

        def troca(m):
            nome = por_conteudo.get(m.group(1))
            if nome is None:
                raise SystemExit(f'{ficheiro}: imagem base64 desconhecida; acrescenta-a a IMAGENS em src/gerar_apps_script.py')
            if nome not in nomes:
                nomes.append(nome)
            return f'cid:{nome}'

        cid = re.sub(r'data:image/(?:jpeg|png);base64,([A-Za-z0-9+/=]+)', troca, original)
        externas = set(re.findall(r'src="(https?://[^"]+)"', cid))
        assert 'data:image' not in cid and externas <= {u for u in IMAGENS_ONLINE.values() if u}, f'{ficheiro}: sobrou uma imagem que não é CID nem tem endereço em IMAGENS_ONLINE'
        (SAIDA / 'html' / ficheiro).write_text(cid, encoding='utf-8')
        titulo = _html.unescape(re.search(r'<title>(.*?)</title>', original).group(1))
        registos.append((chave, ficheiro, descricao, titulo, nomes, cid, texto_simples(original)))
        usadas[chave] = nomes
        print(f'{ficheiro}: {len(original) // 1024} KB → {len(cid) // 1024} KB, imagens CID: {", ".join(nomes)}')

    (SAIDA / 'Imagens.gs').write_text(ficheiro_imagens([n for n in BASE if any(n in u for u in usadas.values())], """/**
 * Imagens do banner e do logo, em base64 (geradas por src/gerar_apps_script.py; não editar à mão).
 * imagensInline(['banner', 'logo']) devolve os blobs para o parâmetro `inlineImages` do GmailApp / MailApp;
 * no HTML a imagem aparece como <img src="cid:banner">.
 */
function imagensInline(nomes) {
  const todas = Object.assign({}, imagensBase_(),
    typeof imagensDressCode_ === 'function' ? imagensDressCode_() : {});   // ImagensDressCode.gs (3.º email)
  const blobs = {};
  nomes.forEach(function (nome) {
    const i = todas[nome];
    if (!i) throw new Error('Falta a imagem «' + nome + '». Cola também o ficheiro ImagensDressCode.gs no projeto.');
    blobs[nome] = Utilities.newBlob(Utilities.base64Decode(i.base64), i.mime, i.ficheiro);
  });
  return blobs;
}
""", 'imagensBase_'), encoding='utf-8')
    (SAIDA / 'ImagensDressCode.gs').write_text(ficheiro_imagens([n for n in DRESSCODE if any(n in u for u in usadas.values())],
        '/**\n * Imagens da confirmação da inscrição (v11 e v12), em base64 (geradas por src/gerar_apps_script.py; não editar à mão).\n */',
        'imagensDressCode_'), encoding='utf-8')

    html_js = ',\n'.join(f"  '{c}': {js_modelo(cid)}" for c, _, _, _, _, cid, _ in registos)
    txt_js = ',\n'.join(f"  '{c}': {js_modelo(t)}" for c, _, _, _, _, _, t in registos)
    (SAIDA / 'Convites.gs').write_text(f'''/**
 * HTML e texto simples dos emails (gerados por src/gerar_apps_script.py; não editar à mão: para mudar um
 * texto, altera o gerador e volta a gerar). As imagens são <img src="cid:...">: seguem anexadas ao email
 * (ver Imagens.gs e enviarEmail em Enviar.gs).
 */
function htmlDoEmail_(chave) {{
  const html = {{
{html_js}
  }};
  return html[chave];
}}

function textoDoEmail_(chave) {{
  const texto = {{
{txt_js}
  }};
  return texto[chave];
}}
''', encoding='utf-8')

    emails_js = ',\n'.join(
        f"  // {desc}\n  '{c}': {{ assunto: {json.dumps(titulo, ensure_ascii=False)}, imagens: {json.dumps(nomes)} }}"
        for c, _, desc, titulo, nomes, _, _ in registos)
    (SAIDA / 'Enviar.gs').write_text(f'''/**
 * Envio dos emails dos 50 anos da JSD Famalicão por Apps Script, com as imagens anexadas ao próprio email
 * (CID), sem as alojar em nenhum site. Cola no projeto: Enviar.gs, Convites.gs, Imagens.gs e, para o 3.º email,
 * ImagensDressCode.gs. Autoriza o script quando o Google pedir. Usa MailApp, que só pede permissão para enviar
 * emails (o GmailApp também serve, com as mesmas opções, mas pede acesso a toda a caixa de correio).
 *
 * Primeiro corre testeParaMim() (envia os seis emails para a tua própria conta), vê-os no Gmail e no iPhone
 * e só depois usa enviarEmail(destinatario, chave) no teu envio a sério, por exemplo:
 *
 *   linhas.forEach(function (l) {{ enviarEmail(l.email, l.institucional ? 'convite-institucional' : 'convite-geral'); }});
 *
 * Quotas do Google: 100 destinatários por dia numa conta Gmail normal e 1500 no Google Workspace.
 */
const REMETENTE = 'JSD Famalicão';     // nome que aparece como remetente; '' para usar o nome da conta

// chave → assunto e imagens que o HTML usa (<img src="cid:...">). Os assuntos podem ser mudados à vontade.
const EMAILS = {{
{emails_js}
}};

/**
 * Envia um email. «opcoes» é opcional e aceita as opções do MailApp (bcc, replyTo, cc…).
 */
function enviarEmail(destinatario, chave, opcoes) {{
  const e = EMAILS[chave];
  if (!e) throw new Error('Email desconhecido: «' + chave + '». Os possíveis são: ' + Object.keys(EMAILS).join(', '));
  const o = {{ htmlBody: htmlDoEmail_(chave) }};
  if (e.imagens.length) o.inlineImages = imagensInline(e.imagens);     // só as imagens que ainda não têm endereço
  if (REMETENTE) o.name = REMETENTE;
  MailApp.sendEmail(destinatario, e.assunto, textoDoEmail_(chave), Object.assign(o, opcoes || {{}}));
}}

/** Envia cada um dos emails para a tua própria conta, para veres como chegam. */
function testeParaMim() {{
  const eu = Session.getEffectiveUser().getEmail();
  Object.keys(EMAILS).forEach(function (chave) {{ enviarEmail(eu, chave); }});
  Logger.log('Enviados ' + Object.keys(EMAILS).length + ' emails de teste para ' + eu);
}}
''', encoding='utf-8')
    for f in sorted(SAIDA.glob('*.gs')):
        print(f'{f.name}: {f.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
