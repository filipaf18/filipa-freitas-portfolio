# Convite por email · Politicamente Falando #02

**«Justiça em Portugal. Conformada ou reformada?»** · sexta-feira, 16 de outubro de 2026, 21h00 · Casa da Juventude · com Eva Brás Pinho (Deputada da Assembleia da República) e Álvaro Oliveira (Advogado).

Feito com o mesmo modelo dos convites dos 50 anos (`email/jsd-50-anos`, versões v7/v8, no ramo `claude/jsd-famalicao-dinner-email-uo5ccm`). O texto segue o convite da 1.ª sessão («O Sistema Político Português»), assinado pela Daniela Torres.

| Ficheiro | Para quem | Saudação | Despedida | Assunto sugerido |
| --- | --- | --- | --- | --- |
| `convite-institucional.html` | convidados institucionais | Estimado(a) companheiro(a), | Com os melhores cumprimentos, | Convite · Politicamente Falando #02 |
| `convite-geral.html` | militantes (trata por «tu») | Caro(a) companheiro(a), | Até lá, | Politicamente Falando #02 · Justiça em Portugal |

Layout: banner «POLITICAMENTE FALANDO / convite» (o topo do convite da 1.ª sessão) a toda a largura → barra com o degradê da marca → «SESSÃO #02» e o tema em três linhas curtas («Justiça em Portugal.» / «Conformada» / «ou reformada?») com o degradê, letra a letra → traço laranja → saudação e carta → fotos dos oradores (do cartaz), com nome e cargo em texto → fecho, despedida e assinatura da Daniela Torres → data, hora e local num bloco centrado entre dois filetes, que são as bordas do próprio bloco (o local abre o Google Maps) → rodapé com o logo dos 50 anos. Pré-visualizações em `previas/`.

## Como enviar

**Colando no Gmail (o mais simples, funciona já):**
1. Abre `copiar-convites.html` no Chrome.
2. Clica em **Copiar convite** no convite que queres (e em **Copiar assunto**).
3. No Gmail: **Nova mensagem** → clica no corpo → **Ctrl+V** (⌘+V no Mac). Destinatários em **Cco**. Envia primeiro um teste para ti e abre-o no telemóvel.

Não abras o HTML para copiar com Ctrl+A / Ctrl+C: o Chrome fixa as larguras em píxeis e o email fica mais largo do que o ecrã do telemóvel (o mesmo problema dos 50 anos).

### Imagens: sempre por endereço

Nenhuma imagem vai embutida no email (o HTML tem ~15 KB). O Gmail mostra-as a partir destes endereços:

| Imagem | Endereço |
| --- | --- |
| Logo dos 50 anos | `https://jsdfamalicao.pt/convite/logo-50-anos.png` (o dos 50 anos) |
| Banner, fotos dos oradores, assinatura | `https://raw.githubusercontent.com/filipaf18/filipa-freitas-portfolio/<commit>/email/politicamente-falando-02/imagens/…` |

As do GitHub são os ficheiros da pasta `imagens/` deste repositório (público), servidos com o tipo certo (`image/jpeg`, `image/png`; confirmado). O endereço aponta para um commit fixo (`COMMIT_IMAGENS` em `src/gerar.py`), por isso a imagem de um email já enviado nunca muda. **Não apagues o ramo nem tornes o repositório privado até depois do evento**, senão as imagens deixam de aparecer. Se preferires tê-las no site, carrega a pasta `imagens/` para `https://jsdfamalicao.pt/convite/politicamente-falando-02/`, troca `PASTA_IMAGENS` em `src/gerar.py` e volta a gerar.

### Banner

O convite da 1.ª sessão chegou como um JPEG de 1600 px muito comprimido: halos à volta das letras e o laranja do «convite» esborratado. Além disso, o recorte tem só 1200 px, menos do que um ecrã de computador. `src/preparar_imagens.py` reconstrói-o ao dobro (2400 × 800, ~200 KB): amplia o fundo e preenche-o debaixo das letras; depois redesenha «POLITICAMENTE FALANDO» e «convite» com contornos nítidos, a partir da forma das letras do original; grava sem subamostragem de cor. **Com o ficheiro original do designer (PNG ou PDF), o banner ficaria ainda melhor**: basta pô-lo em `originais/convite-01.jpg` (ou ajustar o recorte) e correr os scripts.

**Pelo script de envio dos 50 anos (Apps Script, a partir das listas):**
1. As imagens já estão online (ver «Imagens: sempre por endereço»).
2. No projeto do Apps Script, substitui o conteúdo dos ficheiros HTML `convite` e `convite_institucional` pelo de `apps-script/convite.html` e `apps-script/convite_institucional.html` (o mesmo HTML dos convites, com os nomes que o script procura).
3. Muda `ASSUNTO` no topo do script (por exemplo `'Politicamente Falando #02 · Justiça em Portugal'`).
4. A coluna D («Email Enviado?») das listas ainda tem os envios dos 50 anos: o script salta essas linhas. Usa cópias das folhas com a coluna D vazia (e muda `URL_FOLHA_INSTITUCIONAL` / `URL_FOLHA_GERAL`), ou limpa a coluna D.
5. Corre **Diagnosticar** e **Enviar emails de teste para mim** antes do envio a sério.

A saudação mantém «Estimado(a) companheiro(a),» e «Caro(a) companheiro(a),», como nos 50 anos, para o script juntar o nome e acertar o género. O único outro «(a)» é «o(a) convidar», no institucional.

## Para mudar alguma coisa

- Textos: dicionário `CONVITES` em `src/gerar.py`; data, hora e local em `dados()`; oradores em `ORADORES`; tema em `TEMA`.
- Imagens: recortes em `src/preparar_imagens.py`, a partir de `originais/` (o cartaz da 2.ª sessão e o convite da 1.ª). Depois de mudar uma imagem: commit e push, pôr esse commit em `COMMIT_IMAGENS` (`src/gerar.py`) e voltar a gerar.
- Depois: `python3 src/preparar_imagens.py && python3 src/gerar.py` e, para rever, `NODE_PATH=$(npm root -g) node src/previas.cjs` (pré-visualizações) e `NODE_PATH=$(npm root -g) node src/verificar.cjs` (copiar e colar, ver abaixo).

### O que o Gmail faz ao colar (e as regras que daí vêm)

A caixa de escrita do Gmail é uma caixa editável do Chrome. Ao colar, o Chrome reescreve o HTML, e o que muda foi medido copiando e colando de verdade no Chromium (`src/verificar.cjs`):

- **Larguras em % no `style` passam a píxeis fixos**, medidos na largura da caixa de escrita: `width:50%` → `width:254px`, `width:100%` → `width:240px`. Foi isto que, na 1.ª versão, alargava o bloco dos oradores e descentrava o email no telemóvel. **Regra:** percentagens só no atributo `width="…"` e em `max-width`/`min-width`, que chegam intactos.
- `white-space:nowrap` passa a `text-wrap-mode:nowrap` e `text-decoration` passa a `text-decoration-line`, propriedades que o Gmail não conhece. **Regra:** sem `nowrap` (o tema está em linhas curtas que cabem em 320 px), e a morada é sublinhada de propósito (fica igual se o Gmail ignorar a propriedade).
- `text-align:center` desaparece das células que já têm `align="center"` (fica o atributo, que o Gmail respeita).
- O `<head>`, o `<style>` e o texto de pré-visualização escondido desaparecem.
- Copiando com Ctrl+A / Ctrl+C, o Chrome também troca espaços por `&nbsp;` (o texto deixa de poder partir).

Para não depender de nada que um cliente possa retirar ou ignorar:
- **A data** é um bloco `<div>` (ocupa a largura toda sem atributo `width`) com os filetes como bordas. Antes, se o atributo `width` das tabelas fosse retirado, a data encolhia até à largura do texto e encostava à esquerda, com filetes curtos.
- **O rodapé e as tabelas interiores** centram-se com `align` + `margin:0 auto`, e o email tem `min-width:100%`.
- **A célula à volta da coluna de texto** não centra por herança.
- **As barras e o traço** têm `font-size`/`line-height` iguais à altura (e não 0).
- **A assinatura** tem largura e altura nos atributos.

## Verificado

`src/verificar.cjs` copia e cola de verdade no Chromium, para uma caixa editável como a do Gmail: pelo botão de `copiar-convites.html` (com a caixa a 500, 640 e 1000 px) e com Ctrl+A / Ctrl+C no convite aberto (computador e telemóvel), e usa também o HTML original (envio por script). Mostra cada resultado como o Gmail o mostra (sem `<style>` nem classes) em 9 larguras, de 320 a 1400 px, e ainda sem `align` nas tabelas, sem `align` nas células, sem `margin:0 auto`, sem `text-align`, com a letra 25 % maior, sem `font-size:0`, sem `display:block` nas imagens, sem o atributo `width` nas tabelas, sem `cellpadding`/`cellspacing` e sem tamanhos nas imagens. As imagens são servidas a partir da pasta `imagens/` (o site da JSD não é acessível deste ambiente). Mede: transbordo horizontal, banner e barras de ponta a ponta, texto centrado no eixo da página, texto à esquerda (e assinatura) na margem dos filetes, filetes simétricos, traço e logo no eixo, fotos iguais, simétricas e centradas, nome e cargo debaixo de cada foto, imagens carregadas e sem deformação.

Resultado: **134 casos sem falhas**, desvio máximo de 0,7 px. Sem `cellpadding`/`cellspacing` (registado), o banner fica a 2 px das margens. A única exceção (registada, não corrigida) é copiar com Ctrl+A / Ctrl+C **e** ter a letra 25 % maior num ecrã de 320 px: «Justiça em Portugal.» deixa de poder partir e sai 42 px do ecrã. Com o botão «Copiar convite» não acontece.

Capturas do email colado: `previas/colado-botao-telemovel.png`, `previas/colado-botao-computador.png` (e `colado-ctrl-c-*`).

**Limite:** não há Gmail real nem iPhone neste ambiente. O que o Gmail faz depois do Chrome (ao enviar e ao mostrar o email) é simulado. Envia sempre um teste para ti e vê-o no telemóvel e no computador.

## A confirmar

- **Morada da Casa da Juventude:** não a encontrei, por isso o email diz só «Vila Nova de Famalicão» e o link abre uma pesquisa no Google Maps por «Casa da Juventude, Vila Nova de Famalicão». Confirma que o Maps encontra o sítio certo, ou acrescenta a morada em `dados()`.
- **Confirmação de presença:** o convite da 1.ª sessão não a pedia e este também não. Se quiserem, acrescenta-se uma frase («Agradecemos a confirmação de presença por resposta a este email») ou um botão.
- **Assinatura:** é a do convite da 1.ª sessão, passada a azul e com fundo transparente. A versão geral também é assinada pela Daniela Torres. Nos 50 anos assinava a JSD Famalicão.
