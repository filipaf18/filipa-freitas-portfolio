# Convite por email · Politicamente Falando #02

**«Justiça em Portugal. Conformada ou reformada?»** · sexta-feira, 16 de outubro de 2026, 21h00 · Casa da Juventude · com Eva Brás Pinho (Deputada à Assembleia da República) e Álvaro Oliveira (Advogado).

Duas versões, com o mesmo layout, feitas com o mesmo modelo dos convites dos 50 anos (`email/jsd-50-anos`, versões v7/v8, no ramo `claude/jsd-famalicao-dinner-email-uo5ccm`). O texto segue o convite da 1.ª sessão («O Sistema Político Português»), assinado pela Daniela Torres.

| Ficheiro | Para quem | Saudação | Despedida | Assunto sugerido |
| --- | --- | --- | --- | --- |
| `convite-institucional.html` | convidados institucionais | Estimado(a) companheiro(a), | Com os melhores cumprimentos, | Convite · Politicamente Falando #02 |
| `convite-geral.html` | militantes (trata por «tu») | Caro(a) companheiro(a), | Até lá, | Politicamente Falando #02 · Justiça em Portugal |

A versão geral tem no rodapé a nota «Recebes este convite por fazeres parte da JSD Famalicão. Se não quiseres receber mais mensagens, responde a este email.»

Layout:
1. o banner da sessão, feito pela JSD, a toda a largura; já tem o título, o tema, a data, o local e os oradores, com fotos;
2. a barra com o degradê da marca;
3. «CONVITE» e o traço laranja, sem repetir o que o banner diz (como nos 50 anos);
4. a saudação e a carta;
5. o fecho, a despedida e a assinatura da Daniela Torres;
6. a data, a hora e o local num bloco centrado entre dois filetes (o local abre o Google Maps);
7. o rodapé com o logo dos 50 anos.

Os nomes, os cargos e a data também vão no texto: no telemóvel, o texto do banner fica pequeno. Pré-visualizações em `previas/`.

## Como enviar

**Colando no Gmail:**
1. Abre no Chrome `copiar-convite-institucional.html` ou `copiar-convite-geral.html`, um convite por página. `copiar-convites.html` tem os dois.
2. Clica em **Copiar convite** no convite que queres (institucional ou geral) e em **Copiar assunto**.
3. No Gmail: **Nova mensagem** → clica no corpo → **Ctrl+V** (⌘+V no Mac). Destinatários em **Cco**. Envia primeiro um teste para ti e abre-o no telemóvel.

Não abras o HTML para copiar com Ctrl+A / Ctrl+C: o Chrome fixa as larguras em píxeis e o email fica mais largo do que o ecrã do telemóvel (o mesmo problema dos 50 anos).

**Pelo script de envio dos 50 anos (Apps Script, a partir das listas):**
1. As imagens já estão online (ver abaixo).
2. No projeto do Apps Script, substitui o conteúdo dos ficheiros HTML `convite_institucional` e `convite` pelo de `apps-script/convite_institucional.html` e `apps-script/convite.html` (geral).
3. Muda `ASSUNTO` no topo do script. O script usa o mesmo assunto para as duas listas; por exemplo `'Politicamente Falando #02 · Justiça em Portugal'`.
4. A coluna D («Email Enviado?») das listas ainda tem os envios dos 50 anos: o script salta essas linhas. Usa cópias das folhas com a coluna D vazia (e muda `URL_FOLHA_INSTITUCIONAL` / `URL_FOLHA_GERAL`), ou limpa a coluna D.
5. Corre **Diagnosticar** e **Enviar emails de teste para mim** antes do envio a sério.

A saudação mantém «Estimado(a) companheiro(a),» e «Caro(a) companheiro(a),», como nos 50 anos, para o script juntar o nome e acertar o género. O único outro «(a)» é «o(a) convidar», no institucional.

## Imagens

**Sempre por endereço**: nenhuma imagem vai embutida no email (cada HTML tem ~10 KB).

| Imagem | Endereço |
| --- | --- |
| Logo dos 50 anos | `https://jsdfamalicao.pt/convite/logo-50-anos.png` (o dos 50 anos) |
| Banner e assinatura | `https://raw.githubusercontent.com/filipaf18/filipa-freitas-portfolio/<commit>/email/politicamente-falando-02/imagens/…` |

As do GitHub são os ficheiros da pasta `imagens/` deste repositório (público), servidos com o tipo certo (`image/jpeg`, `image/png`; confirmado). O endereço aponta para um commit fixo (`COMMIT_IMAGENS` em `src/gerar.py`), por isso a imagem de um email já enviado nunca muda. **Não apagues o ramo nem tornes o repositório privado até depois do evento**, senão as imagens deixam de aparecer. Se preferires tê-las no site, carrega a pasta `imagens/` para `https://jsdfamalicao.pt/convite/politicamente-falando-02/`, troca `PASTA_IMAGENS` em `src/gerar.py` e volta a gerar.

**Sem ligação:** clicar no banner, na assinatura ou no logo não abre nada. As únicas ligações são de texto: a morada (Google Maps) e `jsdfamalicao.pt` no rodapé.

**Banner:** `originais/banner-02.webp` (2000 × 667, 3:1), feito pela JSD. `src/preparar_imagens.py` converte-o para JPEG no tamanho original, sem ampliar nem reduzir, com qualidade 92 e sem subamostragem de cor (~330 KB). O WebP não aparece em todos os clientes de email (o Outlook para Windows, por exemplo). No email ocupa a largura toda: ~470 px de altura num computador com a janela a 1400 px, ~125 px num telemóvel.

## Para mudar alguma coisa

- **Textos:** dicionário `CONVITES` em `src/gerar.py` (`'institucional'` e `'geral'`); data, hora e local em `dados()`.
- **Banner:** substitui `originais/banner-02.webp`, corre `python3 src/preparar_imagens.py`, faz commit e push, põe esse commit em `COMMIT_IMAGENS` (`src/gerar.py`) e volta a gerar.
- **Gerar e rever:** `python3 src/gerar.py`; para rever, `NODE_PATH=$(npm root -g) node src/previas.cjs` (pré-visualizações) e `NODE_PATH=$(npm root -g) node src/verificar.cjs` (copiar e colar, ver abaixo).

### O que o Gmail faz ao colar (e as regras que daí vêm)

A caixa de escrita do Gmail é uma caixa editável do Chrome. Ao colar, o Chrome reescreve o HTML. O que muda foi medido copiando e colando de verdade no Chromium (`src/verificar.cjs`):

- **Larguras em % no `style` passam a píxeis fixos**, medidos na largura da caixa de escrita: `width:50%` → `width:254px`. Foi isto que, numa versão anterior, alargava um bloco e descentrava o email no telemóvel. **Regra:** percentagens só no atributo `width="…"` e em `max-width`/`min-width`, que chegam intactos.
- **`white-space:nowrap` e `text-decoration` mudam de nome:** passam a `text-wrap-mode:nowrap` e `text-decoration-line`, propriedades que o Gmail não conhece. **Regra:** sem `nowrap`; a morada é sublinhada de propósito (fica igual se o Gmail ignorar a propriedade).
- **`text-align:center` desaparece** das células que já têm `align="center"` (fica o atributo, que o Gmail respeita).
- **Desaparecem o `<head>`, o `<style>`** e o texto de pré-visualização escondido.

Para não depender de nada que um cliente possa retirar ou ignorar:
- **Data:** é um bloco `<div>` com os filetes como bordas, que ocupa a largura toda sem atributo `width`.
- **Rodapé e tabelas interiores:** centram-se com `align` + `margin:0 auto`, e o email tem `min-width:100%`.
- **Barras e traço:** têm `font-size`/`line-height` iguais à altura (e não 0).
- **Assinatura:** tem largura e altura nos atributos.

## Verificado

`src/verificar.cjs` copia e cola de verdade no Chromium, para uma caixa editável como a do Gmail:
- pelo botão de `copiar-convites.html`, com a caixa de escrita a 500, 640 e 1000 px;
- com Ctrl+A / Ctrl+C no convite aberto, no computador e no telemóvel;
- e com o HTML original, como no envio por script.

Mostra cada resultado como o Gmail o mostra (sem `<style>` nem classes) em 9 larguras, de 320 a 1400 px. Repete com variantes do que um cliente pode retirar ou ignorar:
- sem `align` nas tabelas, sem `align` nas células, sem `margin:0 auto`, sem `text-align`;
- com a letra 25 % maior;
- sem `font-size:0`, sem `display:block` nas imagens;
- sem o atributo `width` nas tabelas, sem `cellpadding`/`cellspacing`, sem tamanhos nas imagens.

Mede o transbordo horizontal, o banner e as barras de ponta a ponta, o texto centrado no eixo, o texto e a assinatura na margem dos filetes, os filetes simétricos, o traço e o logo no eixo, e se as imagens carregam sem deformação. As imagens são servidas a partir da pasta `imagens/`, porque o site da JSD não é acessível deste ambiente.

Resultado: **134 casos sem falhas** (67 por versão). Sem `cellpadding`/`cellspacing` (registado), o banner fica a 2 px das margens. Capturas do email colado: `previas/colado-botao-telemovel.png` e `previas/colado-botao-computador.png` (e `colado-ctrl-c-*`).

**Limite:** não há Gmail real nem iPhone neste ambiente. O que o Gmail faz depois do Chrome (ao enviar e ao mostrar o email) é simulado. Envia sempre um teste para ti e vê-o no telemóvel e no computador.

## A confirmar

- **Morada da Casa da Juventude:** não a encontrei, por isso o email diz só «Vila Nova de Famalicão» e o link abre uma pesquisa no Google Maps por «Casa da Juventude, Vila Nova de Famalicão». Confirma que o Maps encontra o sítio certo, ou acrescenta a morada em `dados()`.
- **Confirmação de presença:** o convite da 1.ª sessão não a pedia e este também não. Se quiserem, acrescenta-se uma frase («Agradecemos a confirmação de presença por resposta a este email»).
