# Convite · Jantar Comemorativo dos 50 anos da JSD Famalicão

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
3. Se o banner não aparecer: apaga a imagem partida, «Inserir fotografia» → `banner-largo.jpg` → **Em linha**.

Nota: no Gmail a mensagem aparece sempre dentro da área de leitura; «largura total» é a largura dessa área.

## A confirmar

- Versão institucional: assinatura genérica («Juventude Social Democrata de Vila Nova de Famalicão»). Se quiserem, acrescenta-se o nome e o cargo de quem assina.
- Na institucional a frase ficou «Usarão da palavra representantes das estruturas da JSD e do PSD.» (registo formal); na geral mantém-se «Vão tomar da palavra…».
- A última linha do rodapé da versão geral (como deixar de receber mensagens) é uma adição; na institucional não existe.
