# Email de follow-up · Jantar dos 50 anos · últimos dias de inscrição

Objetivo: reforçar o anúncio e converter em inscrições. Versão única, a tratar por «tu» (militantes, antigos militantes, simpatizantes e acompanhantes).

**Assunto:** Inscrições abertas até 4 de novembro · Jantar dos 50 anos da JSD Famalicão

Estrutura (pouco texto, faixas de cor, o botão logo ao início):
1. banner do jantar;
2. faixa azul-escura: «ÚLTIMOS DIAS», «Inscrições até 4 de novembro», data e hora, botão grande;
3. «Aberto a todos» (militantes, antigos militantes, simpatizantes e acompanhantes), 35 € e bar aberto;
4. o menu (imagem);
5. faixa preta: logo do Classe, «Entrada gratuita para quem se inscrever», a partir das 01h30;
6. faixa azul-escura: «Garante o teu lugar.», botão, local;
7. rodapé pequeno com o logo dos 50 anos.

## Como enviar
1. Abre `copiar-email.html` no Chrome e clica em **Copiar convite** (e em **Copiar assunto**).
2. No Gmail: Nova mensagem → clica no corpo → Ctrl+V. Destinatários em Cco. Envia primeiro um teste.

Não copies o email aberto no browser com Ctrl+A / Ctrl+C. Para o Apps Script, usa `apps-script/followup.html` (o mesmo HTML).

## Imagens
Todas por endereço, sem ligação: banner, menu e logo do Classe no GitHub (commit fixo, `COMMIT_IMAGENS` em `src/gerar.py`; não apagues o ramo até depois do evento) e o logo dos 50 anos em `jsdfamalicao.pt/convite/logo-50-anos.png`.

## Alterar
`python3 src/gerar.py` (usa as peças de `../politicamente-falando-02/src/gerar.py`); `node src/previas.cjs` e `node src/verificar.cjs` (com `NODE_PATH=$(npm root -g)`).

## Verificado
Copiar e colar simulado no Chromium, 320 a 1400 px: 67 casos sem falhas. Exceção registada: copiar com Ctrl+A/Ctrl+C numa janela de telemóvel fixa o botão em píxeis. Sem Gmail real: envia um teste.

## A confirmar
- Data de fecho: assumi **4 de novembro** (quarta-feira).
- Entrada no Classe: «para quem se inscrever no jantar», a partir das 01h30.
