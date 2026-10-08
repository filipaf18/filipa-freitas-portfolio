# Convite por email · Politicamente Falando #02

**«Justiça em Portugal. Conformada ou reformada?»** · sexta-feira, 16 de outubro de 2026, 21h00 · Casa da Juventude · com Eva Brás Pinho (Deputada da XVII Legislatura) e Álvaro Oliveira (Advogado).

Feito com o mesmo modelo dos convites dos 50 anos (`email/jsd-50-anos`, versões v7/v8, no ramo `claude/jsd-famalicao-dinner-email-uo5ccm`). O texto segue o convite da 1.ª sessão («O Sistema Político Português»), assinado pela Daniela Torres.

| Ficheiro | Para quem | Saudação | Despedida | Assunto sugerido |
| --- | --- | --- | --- | --- |
| `convite-institucional.html` | convidados institucionais | Estimado(a) companheiro(a), | Com os melhores cumprimentos, | Convite · Politicamente Falando #02 |
| `convite-geral.html` | militantes (trata por «tu») | Caro(a) companheiro(a), | Até lá, | Politicamente Falando #02 · Justiça em Portugal |

Layout: banner «POLITICAMENTE FALANDO / convite» (o topo do convite da 1.ª sessão) a toda a largura → barra com o degradê da marca → «SESSÃO #02» e o tema com o degradê, letra a letra → traço laranja → saudação e carta → fotos dos oradores (do cartaz), com nome e cargo em texto → fecho, despedida e assinatura da Daniela Torres → data, hora e local entre dois filetes (o local abre o Google Maps) → rodapé com o logo dos 50 anos. Pré-visualizações em `previas/`.

## Como enviar

**Colando no Gmail (o mais simples, funciona já):**
1. Abre `copiar-convites.html` no Chrome.
2. Clica em **Copiar convite** no convite que queres (e em **Copiar assunto**).
3. No Gmail: **Nova mensagem** → clica no corpo → **Ctrl+V** (⌘+V no Mac). Destinatários em **Cco**. Envia primeiro um teste para ti e abre-o no telemóvel.

Não abras o HTML para copiar com Ctrl+A / Ctrl+C: o Chrome fixa as larguras em píxeis e o email fica mais largo do que o ecrã do telemóvel (o mesmo problema dos 50 anos). Nesta versão as imagens vão embutidas no HTML e o Gmail transforma-as em anexos «em linha» quando envia, por isso não é preciso alojar nada.

**Pelo script de envio dos 50 anos (Apps Script, a partir das listas):**
1. Carrega as quatro imagens de `imagens/` (`banner.jpg`, `orador-eva-bras-pinho.jpg`, `orador-alvaro-oliveira.jpg`, `assinatura-daniela-torres.png`) para `https://jsdfamalicao.pt/convite/politicamente-falando-02/`. O logo é o `https://jsdfamalicao.pt/convite/logo-50-anos.png` que já está publicado. Abre cada endereço no browser para confirmar que a imagem aparece.
2. No projeto do Apps Script, substitui o conteúdo dos ficheiros HTML `convite` e `convite_institucional` pelo de `apps-script/convite.html` e `apps-script/convite_institucional.html`. Estas versões têm as imagens por endereço (o Gmail não mostra imagens embutidas num email enviado por script) e pesam ~15 KB cada.
3. Muda `ASSUNTO` no topo do script (por exemplo `'Politicamente Falando #02 · Justiça em Portugal'`).
4. A coluna D («Email Enviado?») das listas ainda tem os envios dos 50 anos: o script salta essas linhas. Usa cópias das folhas com a coluna D vazia (e muda `URL_FOLHA_INSTITUCIONAL` / `URL_FOLHA_GERAL`), ou limpa a coluna D.
5. Corre **Diagnosticar** e **Enviar emails de teste para mim** antes do envio a sério.

A saudação mantém «Estimado(a) companheiro(a),» e «Caro(a) companheiro(a),», como nos 50 anos, para o script juntar o nome e acertar o género. O único outro «(a)» é «o(a) convidar», no institucional.

## Para mudar alguma coisa

- Textos: dicionário `CONVITES` em `src/gerar.py`; data, hora e local em `dados()`; oradores em `ORADORES`; tema em `TEMA`.
- Imagens: recortes em `src/preparar_imagens.py`, a partir de `originais/` (o cartaz da 2.ª sessão e o convite da 1.ª).
- Depois: `python3 src/preparar_imagens.py && python3 src/gerar.py`, e para rever `NODE_PATH=$(npm root -g) node src/previas.cjs` (refaz `previas/` e confirma que nada sai do ecrã em 8 larguras, de 320 a 1400 px, com e sem o `<style>` que o Gmail descarta ao colar).

## Verificado

- Em 320, 360, 375, 390, 414, 768, 1024 e 1400 px, tal como é e como fica colado no Gmail (sem `<head>`): sem deslocamento horizontal, nenhum elemento fora do ecrã, nenhuma imagem partida.
- O tema fica em 2 linhas no computador e nos telemóveis a partir de 375 px; colado no Gmail (sem o `<style>`, letra maior), passa a 3 linhas no telemóvel («Conformada ou / reformada?»).
- Não foi testado num Gmail real nem num iPhone: envia um teste antes.

## A confirmar

- **Morada da Casa da Juventude:** não a encontrei, por isso o email diz só «Vila Nova de Famalicão» e o link abre uma pesquisa no Google Maps por «Casa da Juventude, Vila Nova de Famalicão». Confirma que o Maps encontra o sítio certo, ou acrescenta a morada em `dados()`.
- **Confirmação de presença:** o convite da 1.ª sessão não a pedia e este também não. Se quiserem, acrescenta-se uma frase («Agradecemos a confirmação de presença por resposta a este email») ou um botão.
- **Assinatura:** é a do convite da 1.ª sessão, passada a azul e com fundo transparente. A versão geral também é assinada pela Daniela Torres. Nos 50 anos assinava a JSD Famalicão.
