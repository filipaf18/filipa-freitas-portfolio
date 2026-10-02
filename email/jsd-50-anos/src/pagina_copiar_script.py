"""Gera uma página (copiar-script.html) para copiar o script de envio, parte a parte, sem passar por pré-visualizações que
cortam os ficheiros compridos. Cada parte tem um botão «Copiar» que põe na área de transferência o texto EXATO do ficheiro,
e mostra quantas linhas deve ter e como começa e acaba, para conferir depois de colar no Apps Script.

Lê apps-script/partes/ (Parte1.gs … ParteN.gs e VerificarInstalacao.gs). A Parte1 vai para «Código.gs».
Os endereços das listas não estão no repositório: passa-os por variáveis de ambiente para os pôr já na página
(URL_INSTITUCIONAL e URL_GERAL); sem elas, ficam os espaços «COLA_AQUI…» para preencher à mão.

Uso (a partir de email/jsd-50-anos/):
    URL_INSTITUCIONAL='https://…' URL_GERAL='https://…' python3 src/pagina_copiar_script.py [saída.html]
"""
import html as _html, json, os, pathlib, re, sys

AQUI = pathlib.Path(__file__).resolve().parent.parent
PARTES = AQUI / 'apps-script' / 'partes'

MARCADORES = {
    "var URL_FOLHA_INSTITUCIONAL = 'COLA_AQUI_O_URL_DA_LISTA_INSTITUCIONAL';": ('URL_INSTITUCIONAL', "var URL_FOLHA_INSTITUCIONAL = '%s';"),
    "var URL_FOLHA_GERAL = 'COLA_AQUI_O_URL_DA_LISTA_GERAL';": ('URL_GERAL', "var URL_FOLHA_GERAL = '%s';"),
}


def ler_partes():
    itens = []
    ficheiros = sorted(PARTES.glob('Parte*.gs'), key=lambda f: int(re.search(r'\d+', f.name).group()))
    for f in ficheiros:
        texto = f.read_text(encoding='utf-8')
        k = int(re.search(r'\d+', f.name).group())
        nome = 'Código.gs' if k == 1 else f'Parte{k}.gs'
        if k == 1:
            for marcador, (variavel, modelo) in MARCADORES.items():
                assert marcador in texto, 'a Parte1 mudou: ' + marcador
                if os.environ.get(variavel):
                    texto = texto.replace(marcador, modelo % os.environ[variavel])
        itens.append(dict(nome=nome, ficheiro=f.name, texto=texto, parte=k,
                          papel='Substitui TUDO o que está no ficheiro «Código.gs» do projeto' if k == 1 else 'Ficheiro novo (+ → Script)'))
    verificador = PARTES / 'VerificarInstalacao.gs'
    if verificador.exists():
        itens.append(dict(nome='VerificarInstalacao.gs', ficheiro=verificador.name, texto=verificador.read_text(encoding='utf-8'), parte=0,
                          papel='Ficheiro novo, só para conferir no fim (+ → Script). Depois escolhe «verificarFuncoes» e carrega em Executar'))
    for it in itens:
        linhas = it['texto'].rstrip('\n').split('\n')
        it['linhas'] = len(linhas)
        it['primeira'] = linhas[0].strip()[:90]
        it['ultima'] = linhas[-1].strip()
    return itens


def pagina(itens):
    dados = json.dumps([{'nome': i['nome'], 'texto': i['texto']} for i in itens], ensure_ascii=False).replace('</', '<\\/')
    cartoes = ''.join(f'''
    <section class="cartao" id="c{n}">
      <h2><span class="num">{n + 1}</span> {_html.escape(i['nome'])}</h2>
      <p class="papel">{_html.escape(i['papel'])}</p>
      <button type="button" data-n="{n}">Copiar {_html.escape(i['nome'])}</button>
      <p class="estado" id="e{n}" aria-live="polite"></p>
      <p class="conferir">Depois de colar, deve ter <strong>{i['linhas']} linhas</strong>; a 1.ª linha é <code>{_html.escape(i['primeira'])}</code> e a última é <code>{_html.escape(i['ultima'])}</code>.</p>
      <details><summary>Ver o código</summary><pre id="p{n}"></pre></details>
    </section>''' for n, i in enumerate(itens))
    return f'''<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Copiar o script de envio · JSD Famalicão</title>
  <style>
    body {{ margin:0; background:#F6F3EE; color:#1B130C; font-family:"Helvetica Neue",Helvetica,Arial,sans-serif; line-height:1.5; }}
    main {{ max-width:860px; margin:0 auto; padding:28px 16px 56px; }}
    h1 {{ font-size:26px; margin:0 0 8px; }}
    ol.passos {{ padding-left:20px; }}
    .cartao {{ background:#fff; border:1px solid #E4D9CB; border-radius:8px; padding:16px 18px; margin:14px 0; }}
    .cartao h2 {{ font-size:18px; margin:0 0 2px; }}
    .num {{ display:inline-block; min-width:26px; height:26px; line-height:26px; text-align:center; border-radius:50%; background:#F86420; color:#1B130C; font-size:14px; font-weight:700; margin-right:6px; }}
    .papel {{ margin:2px 0 10px; color:#6B6054; font-size:14px; }}
    button {{ font:inherit; font-weight:700; padding:12px 18px; border:0; border-radius:6px; background:#F86420; color:#1B130C; cursor:pointer; }}
    button:focus-visible {{ outline:3px solid #0B72B8; outline-offset:2px; }}
    .estado {{ min-height:22px; margin:8px 0 0; font-weight:700; color:#1B6B2F; }}
    .estado.erro {{ color:#B3261E; }}
    .conferir {{ margin:6px 0 8px; font-size:14px; color:#3E352B; }}
    code {{ background:#F1EBE2; padding:1px 5px; border-radius:3px; font-size:13px; word-break:break-all; }}
    pre {{ max-height:320px; overflow:auto; background:#1B130C; color:#F6F3EE; padding:12px; border-radius:6px; font-size:12px; line-height:1.45; }}
    .aviso {{ background:#FFF4E5; border-left:4px solid #F86420; padding:10px 14px; border-radius:4px; margin:14px 0; }}
    #contador {{ font-weight:700; }}
  </style>
</head>
<body>
<main>
  <h1>Copiar o script de envio, parte a parte</h1>
  <p>Cada botão copia o ficheiro <strong>inteiro e exato</strong> (sem passar por pré-visualizações que cortam). Copiadas: <span id="contador">0 de {len(itens)}</span>.</p>
  <ol class="passos">
    <li>No Apps Script da folha <strong>Militantes Base</strong> (Extensões → Apps Script), <strong>apaga todos os ficheiros</strong> menos o <code>Código.gs</code> (não deixes versões antigas: sobrepõem-se em silêncio).</li>
    <li>Cartão <strong>1</strong>: copia, abre <code>Código.gs</code>, <strong>seleciona tudo (Ctrl+A) e cola</strong>. Grava com <strong>Ctrl+S</strong>.</li>
    <li>Cartões <strong>2 a {len(itens) - 1 if itens[-1]['parte'] == 0 else len(itens)}</strong>: para cada um, cria um ficheiro novo (<strong>+ → Script</strong>), dá-lhe o nome indicado, cola e grava.</li>
    <li>Confere em cada um o número de linhas indicado. No fim, corre <strong>verificarFuncoes</strong> (cartão do verificador): tem de dizer que as funções estão todas.</li>
  </ol>
  <div class="aviso">O ficheiro <code>Código.gs</code> leva os endereços das tuas listas. Não partilhes esta página.</div>
  {cartoes}
</main>
<script type="application/json" id="dados">{dados}</script>
<script>
  (function () {{
    var dados = JSON.parse(document.getElementById('dados').textContent), feitos = {{}};
    dados.forEach(function (d, n) {{ document.getElementById('p' + n).textContent = d.texto; }});
    function marcar(n, ok, msg) {{
      var e = document.getElementById('e' + n); e.textContent = msg; e.className = 'estado' + (ok ? '' : ' erro');
      if (ok) {{ feitos[n] = true; document.getElementById('contador').textContent = Object.keys(feitos).length + ' de ' + dados.length; }}
    }}
    function copiarComTextarea(texto) {{
      var t = document.createElement('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.focus(); t.select();
      var ok = false; try {{ ok = document.execCommand('copy'); }} catch (e) {{}}
      document.body.removeChild(t); return ok;
    }}
    document.querySelectorAll('button[data-n]').forEach(function (b) {{
      b.addEventListener('click', function () {{
        var n = Number(b.getAttribute('data-n')), d = dados[n];
        var depois = function () {{ marcar(n, true, 'Copiado: ' + d.nome + '. Cola no ficheiro certo e grava (Ctrl+S).'); }};
        var falhou = function () {{ if (copiarComTextarea(d.texto)) depois(); else marcar(n, false, 'Não consegui copiar. Abre «Ver o código», seleciona tudo (Ctrl+A) e copia com Ctrl+C.'); }};
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(d.texto).then(depois, falhou); else falhou();
      }});
    }});
  }})();
</script>
</body>
</html>
'''


if __name__ == '__main__':
    itens = ler_partes()
    saida = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / 'apps-script' / 'copiar-script.html'
    saida.write_text(pagina(itens), encoding='utf-8')
    for i in itens:
        print(f"{i['nome']}: {i['linhas']} linhas")
    print(saida)
