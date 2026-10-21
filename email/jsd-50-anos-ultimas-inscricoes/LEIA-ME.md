# Email de follow-up · Jantar dos 50 anos · últimos dias de inscrição

Objetivo: reforçar o anúncio e converter em inscrições. Versão única, a tratar por «tu» (militantes, antigos militantes, simpatizantes e acompanhantes).

**Assunto:** Inscrições abertas até 4 de novembro · Jantar dos 50 anos da JSD Famalicão

Estrutura (opção C, «linha do tempo», sobre fundo creme):
1. banner do jantar;
2. «Inscrições até 4 de novembro», data, local, 35 € e bar aberto, e o botão;
3. cartão de convite com contorno laranja: «Traz quem quiseres. Não precisas de ser militante da JSD.»;
4. linha do tempo da noite, com um fio em degradê: **19h00 Jantar Comemorativo** (os 4 pratos sem pontos, a mesa da ementa e o selo laranja **BAR ABERTO**) e **01h30 After party no Classe** (logo e entrada gratuita);
5. botão final, prazo, local e nota do pagamento; rodapé pequeno.

## Como enviar
1. Abre `copiar-email.html` no Chrome e clica em **Copiar convite** (e em **Copiar assunto**).
2. No Gmail: Nova mensagem → clica no corpo → Ctrl+V. Destinatários em Cco. Envia primeiro um teste.

Não copies o email aberto no browser com Ctrl+A / Ctrl+C. Para o Apps Script, usa `apps-script/followup.html` (o mesmo HTML).

## Imagens
Todas por endereço, sem ligação: banner e logo do Classe no GitHub (commit fixo, `COMMIT_IMAGENS` em `src/gerar.py`; não apagues o ramo até depois do evento) e o logo dos 50 anos em `jsdfamalicao.pt/convite/logo-50-anos.png`.

## Alterar
`python3 src/gerar.py` (usa as peças de `../politicamente-falando-02/src/gerar.py`); `node src/previas.cjs` e `node src/verificar.cjs` (com `NODE_PATH=$(npm root -g)`).

## Verificado
Copiar e colar simulado no Chromium, 320 a 1400 px: 67 casos sem falhas. Exceção registada: copiar com Ctrl+A/Ctrl+C numa janela de telemóvel fixa o botão em píxeis. Sem Gmail real: envia um teste.

## A confirmar
- Data de fecho: assumi **4 de novembro** (quarta-feira).
- Entrada no Classe: «para quem se inscrever no jantar», a partir das 01h30.

## Contagem decrescente
Um email não corre JavaScript, por isso não há contagem que se atualize ao abrir sem um serviço externo que gere a imagem (Sendtric, Motionmail, NiftyImages…). O email tem o prazo em destaque. Se usares um desses serviços, diz-me o endereço da imagem e eu ponho-a no selo.
