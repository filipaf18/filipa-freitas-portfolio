# Convite · Jantar Comemorativo dos 50 anos da JSD Famalicão

## ✅ Versões finais (a usar)

| Ficheiro | Para quem | Saudação | Despedida | Botão |
| --- | --- | --- | --- | --- |
| `v7-convite-geral.html` | militantes (trata por «tu») | Caro(a) companheiro(a), | Até lá, | Inscrever-me |
| `v8-convite-institucional.html` | convidados institucionais | Estimado(a) companheiro(a), | Com os melhores cumprimentos, | Confirmar presença |

Layout (igual nos dois): banner → cabeçalho centrado → saudação → 3 parágrafos → despedida e assinatura → mote **«CINCO DÉCADAS / UMA IDENTIDADE»** em maiúsculas e com o degradê da marca, alinhado com o texto → dados em quatro linhas centradas entre dois filetes finos (data · hora e local · morada · preço) → botão, ligação alternativa e nota → rodapé com o logo do evento. Gerados por `src/gerar_final.py` (textos no dicionário `CONVITES`).

**Mote:** como no banner, «CINCO DÉCADAS» em regular e «UMA IDENTIDADE» a negrito, em maiúsculas com letras ligeiramente espaçadas (28 px). O degradê da marca (azul → turquesa → âmbar → laranja) é aplicado letra a letra, porque o texto em degradê do CSS não funciona no Gmail. Cada letra leva a cor do degradê na sua posição horizontal, com a mesma escala nas duas linhas, como se o degradê pintasse o bloco. As cores claras do meio do degradê foram escurecidas só o necessário para se lerem sobre branco (contraste mínimo de 3:1). A linha mais larga, «UMA IDENTIDADE», mede cerca de 257 px e cabe num ecrã de 320 px. Para mudar o tamanho ou as cores, edita `MOTE_PX` ou `PARAGENS` em `src/gerar_final.py`.

### Como enviar (importante)

1. Abre **`copiar-convites.html`** no Chrome.
2. Clica em **Copiar convite** no convite que queres enviar (geral ou institucional).
3. No Gmail: **Nova mensagem** → clica no corpo → **Ctrl+V** (⌘+V no Mac). Destinatários em **Cco**. Envia primeiro um teste para ti e abre-o no iPhone e num Android.

**Não abras o HTML e copies com Ctrl+A / Ctrl+C.** Ao copiar uma página, o Chrome converte as larguras fluidas em píxeis fixos iguais à largura da janela (ex.: 1400 px). O email chegava assim ao iPhone mais largo do que o ecrã: banner cortado, texto fora do ecrã e logo descentrado. Ver `preview-iphone-antes-agora.png`. Duas correções:
- a página `copiar-convites.html` põe na área de transferência o HTML original de cada convite;
- mesmo que alguém copie com Ctrl+C, as larguras fluidas já não são convertidas: as tabelas usam o atributo `width="100%"` e o banner usa `min-width:100%; max-width:100%`, com um `width="600"` numérico de reserva. Uma imagem com `width="100%"` no atributo aparecia com o tamanho errado depois de colada, porque os clientes de email leem esse valor como 100 px. Verificado: a 390 px (iPhone) o email ocupa 390 px e o logo fica centrado (antes: 1408 px, com o logo a 708 px).

**Logo:** recortado simetricamente em torno do centro das letras «ANOS / JSD FAMALICÃO» (desvio 0 px) e centrado por uma tabela centrada, que não depende de `margin:auto`. Preparado por `src/preparar_logo.py`.

**Banner:** no computador tem no máximo **800 × 333 px** e fica ao centro de uma faixa quase preta a toda a largura. As margens laterais da imagem (`banner-faixa.jpg`) esbatem para preto, por isso não se vê a junção. No telemóvel ocupa a largura do ecrã. É construído com `width="800"` numérico e `max-width:100%` dentro de uma tabela com `max-width:800px`, uma combinação que sobrevive ao Ctrl+C e à colagem no Gmail. Para mudar o limite, altera `banner_max=800` em `src/gerar_final.py`. Para trocar a imagem, usa **1200 px de largura** (JPG com menos de 60 KB). A altura é livre.

**Limite do Gmail (modo escuro no iPhone):** ao colar, o Gmail descarta o `<head>` do HTML, que é o único sítio onde a indicação `color-scheme: light only` funciona. O email chega por isso ao iPhone sem essa indicação e a app Mail aplica o seu modo escuro. Não há forma de o impedir a partir do editor do Gmail. Para forçar o modo claro no iPhone, o email tem de ser enviado com o HTML completo: por uma plataforma de envio (Brevo, MailerLite, Mailchimp) ou diretamente pela API do Gmail. As apps do Gmail escurecem sempre, seja qual for o método.

**Modo noturno.** O `<head>` declara `color-scheme: light only`. Os clientes que respeitam esta indicação mostram sempre a versão branca, mesmo com o telemóvel em modo noturno: Apple Mail/iOS Mail, Outlook para iOS/macOS e browsers com escurecimento automático. Testado com o escurecimento forçado do Chromium: o email fica pixel a pixel igual à versão clara (numa prova de controlo, uma versão sem esta indicação escurece). **As apps do Gmail aplicam sempre o seu próprio modo escuro e nenhum email o pode desligar.** Para esse caso, o logo passou a PNG **sem fundo** (`logo-50-anos.png`, já não aparece o quadrado branco) e as letras escuras do logo têm um contorno claro que só se nota sobre fundo escuro. Ver `preview-v7-geral-gmail-escuro.png` e `preview-v8-institucional-gmail-escuro.png`.

**Inspeção feita:** HTML validado (0 erros; o `&` do link do mapa está escapado); etiquetas equilibradas; imagens com texto alternativo; ligações (`jsdfamalicao.pt/50-anos#inscricao`, `jsdfamalicao.pt`, Google Maps). Em 8 larguras (320, 360, 375, 390, 414, 768, 1024 e 1400 px), com e sem o bloco `<style>`: sem deslocamento horizontal, nenhum elemento a transbordar, todo o texto à esquerda na mesma margem, os filetes dos dados alinhados com o texto, os dados, o botão e o logo centrados (desvio 0 px) e o mote sempre em 2 linhas; os dados ficam em 4 linhas a partir de 360 px (a 320 px a morada passa para 2 linhas, depois da vírgula). Tamanho: cerca de 90 KB por ficheiro (abaixo dos 102 KB a partir dos quais o Gmail corta a mensagem).

Pré-visualizações: `preview-v7-geral-*`, `preview-v8-institucional-*`.

---

## Histórico (versões anteriores, não usar)

Duas versões, ambas em modo claro, de largura total e com o banner embutido (não dependem de endereços externos):

- `convite-jantar-50-anos.html` — **geral** (militantes e antigos militantes), tom próximo, botão «Inscrever-me».
- `convite-jantar-50-anos-institucional.html` — **institucional**, em formato de convite formal («Exmo.(a) Senhor(a)», «V. Exa.»), botão «Confirmar presença».
- `preview-*.png` — como ficam no computador (1400 px) e no telemóvel.
- `logo-50-anos.jpg` — o logo do evento (versão a cores) embutido no rodapé, com o mesmo fundo `#F8F8F8` do rodapé. Os originais estão em `logos/` (a cores e branco com fundo transparente).
- `banner-largo.jpg` — o banner embutido (1200 × 500). `src/gerar.py` gera os dois HTML: para mudar texto, edita-o lá e corre `python3 src/gerar.py`.

## O que mudou

- Cabeçalho igual e centrado nas duas versões: «Convite», «Jantar Comemorativo», «50.º Aniversário da JSD Famalicão» e um traço laranja.
- Slogan «Cinco décadas. Uma identidade.»: na geral substitui «Há datas que se assinalam…» (centrado, logo abaixo do título); na institucional entra no corpo da carta («Sob o mote «Cinco décadas. Uma identidade», celebramos um percurso…»).
- Rodapé com o logo do evento, centrado, seguido do nome da JSD Famalicão e do site. Saíram do rodapé o lema e o «1976_2026», que já estão no banner e no cabeçalho.
- Alinhamento verificado a 320, 360, 375 e 1400 px: todo o texto alinhado à esquerda começa na mesma margem e os blocos centrados (títulos, slogan, dados, botão, logo) estão no eixo da página.
- Tamanho: cerca de 88 KB por ficheiro (abaixo dos 102 KB a partir dos quais o Gmail corta a mensagem).
- Data, hora, local e preço estão nas duas versões, em formato compacto. Na geral: três linhas centradas entre dois filetes finos, antes do botão. Na institucional: integrados no texto da carta, em registo formal («que terá lugar no dia…, sita na…», «A participação tem o valor de 35 € por pessoa.»).
- Responsivo: o `<head>` tem um bloco `<style>` com `@media (max-width: 600px)` que, em telemóveis, aumenta a letra (texto 16→18 px, título 28→30 px, frase de abertura 20→22 px, dados do evento 15→17 px, notas 13→15 px, rodapé 12→14 px) e põe o botão a toda a largura. As medidas inline são a base (computador e clientes que ignorem o `<style>`); os espaços são padding de células, sem `margin` nem larguras fixas. Verificado a 320, 375, 414 e 1400 px.
- Atenção: colar no editor do Gmail pode descartar o `<style>`; nesse caso fica a versão base (já legível, verificada com `src/simular-gmail-telemovel.py`). Para garantir o responsivo, envia o HTML por uma ferramenta que aceite HTML completo (por exemplo, uma extensão «Insert HTML» para o Gmail ou uma plataforma de newsletters).
- Largura total no computador: o banner e as barras ocupam o ecrã todo; o texto fica numa coluna de até 1040 px (quase toda a largura da área de leitura do Gmail) sobre fundo branco, sem caixa nem margens cinzentas. No telemóvel encolhe sozinho.
- O banner passou a ser o original completo (com «Cinco décadas, uma identidade» dos dois lados), que funciona melhor a toda a largura.

## v3 (geral) e v4 (institucional) · mesmo layout intermédio

- `v3-convite-geral.html` — convite **geral**, trata por «tu» («Caro(a) amigo(a)»).
- `v4-convite-institucional.html` — convite **institucional**, ligeiramente formal: «Estimado(a) convidado(a)», «o(a) convidamos», «a sua presença» (sem «Exmo.» nem «V. Exa.»).

Layout igual nos dois: cabeçalho centrado, saudação, 1.º parágrafo, o slogan «Cinco décadas. Uma identidade.» em destaque a meio do texto, alinhado à esquerda com o corpo (o 1.º parágrafo termina em «…que cabem numa só frase:» e o 2.º começa por «É essa identidade que queremos celebrar…»), 2.º parágrafo, e os dados do evento em três linhas centradas em maiúsculas espaçadas, só tipografia, com um traço laranja por cima (sem caixa nem faixa). Depois fecho, botão, nota e rodapé com logo.

Textos em `CONVITES`, em `src/gerar_v3_v4.py`. Pré-visualizações: `preview-v3-geral-*` e `preview-v4-institucional-*`. A v2 ficou igual.

## v5 (geral) e v6 (institucional) · dados no texto

- `v5-convite-geral.html` e `v6-convite-institucional.html` — mesmo layout e mesmos textos da v3/v4, mas a data, a hora, o local e o preço estão **dentro do corpo do texto** (a negrito). O único elemento gráfico a cortar o texto é o mote «Cinco décadas. Uma identidade.».
- Geral: «…queremos celebrar contigo no Jantar Comemorativo, no **sábado, 7 de novembro, às 19h00**, na **Sunset House**. […] A inscrição custa **35 € por pessoa**, com bar aberto.»
- Institucional: «…para o qual temos o gosto de o(a) convidar, no **sábado, 7 de novembro, às 19h00**, na **Sunset House**. […] A participação tem o valor de **35 € por pessoa**, com bar aberto.»
- Gerados pelo mesmo `src/gerar_v3_v4.py`. Pré-visualizações: `preview-v5-geral-*` e `preview-v6-institucional-*`.

## Como passar para o Gmail

1. Abre o HTML no Chrome, `Ctrl/Cmd + A`, `Ctrl/Cmd + C`.
2. Cola numa mensagem nova do Gmail, destinatários em **Cco**, e envia um teste para ti.
3. Se o banner ou o logo não aparecerem: apaga a imagem partida, «Inserir fotografia» → `banner-largo.jpg` (ou `logo-50-anos.png`) → **Em linha**.

Nota: no Gmail a mensagem aparece sempre dentro da área de leitura; «largura total» é a largura dessa área.

## A confirmar

- Versão institucional: assinatura genérica («Juventude Social Democrata de Vila Nova de Famalicão»). Se quiserem, acrescenta-se o nome e o cargo de quem assina.
- Na institucional a frase ficou «Usarão da palavra representantes das estruturas da JSD e do PSD.» (registo formal); na geral mantém-se «Vão tomar da palavra…».
- A última linha do rodapé da versão geral (como deixar de receber mensagens) é uma adição; na institucional não existe.
