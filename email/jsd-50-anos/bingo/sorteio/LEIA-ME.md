# Bingo Cinco Jotas: sorteador

## Ficheiros
- `bingo-cinco-jotas.html`: **ficheiro único, sem conta nem hospedagem.** Abre com duplo clique no Chrome ou no Edge, em qualquer computador. Tem os 140 cartões, as fontes, o logótipo e a biblioteca de ligação embutidos.
- `sorteio.html`: a versão para o claude.ai (só um computador).
- Código-fonte: `sorteio.template.html` (modelo) e `../src/gerar_sorteio_offline.py` (gera o ficheiro único); `vendor/peerjs.min.js` (PeerJS 1.5.5, MIT).

## Três modos (o ficheiro pergunta ao abrir)
1. **Ecrã**: o computador do projetor. Mostra o programa e toca a música. Não tem botões de jogo. Mostra um **código de 4 letras**.
2. **Comando**: o outro computador (ou telemóvel). Escreve o código e controla tudo: começar, rodar, anular, validar cartão, atribuir títulos, pódio, frases, volume, novo jogo.
3. **Tudo neste computador**: uma só janela, como antes (plano B).

## Como usar com dois computadores
1. Copia `bingo-cinco-jotas.html` para os dois (pen, email ou Drive).
2. No computador do projetor: abre o ficheiro, escolhe **Abrir como ecrã** e põe em ecrã inteiro (F). **Clica uma vez no ecrã** para o som ficar ativo.
3. No outro: abre o ficheiro, escolhe **Abrir como comando**, escreve o código e carrega em **Ligar**. O estado passa a «Ligado ao ecrã».
4. Carrega em **Começar o programa** (abertura e música) e depois em **Rodar o globo**.

## Notas
- A ligação usa o servidor público gratuito do PeerJS (`0.peerjs.com`) só para os dois computadores se encontrarem, e depois falam diretamente. **Precisa de internet nos dois.** Redes muito restritivas podem bloqueá-la. É um serviço gratuito sem garantia de disponibilidade.
- **No mesmo computador** (duas janelas ou dois separadores, um como ecrã e outro como comando) funciona **mesmo sem internet**.
- Se a ligação falhar a meio do jantar, abre o ficheiro no modo «Tudo neste computador» e continua. O estado do comando fica guardado no navegador desse computador.
- O código do ecrã fica guardado no navegador, por isso ao recarregar o ecrã mantém o mesmo código.
- «Mudar de modo» está no separador Jogo da régie.
