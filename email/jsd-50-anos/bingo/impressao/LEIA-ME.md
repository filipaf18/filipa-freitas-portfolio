# Bingo Cinco Jotas — ficheiros para impressão (140 cartões)

| Ficheiro | O que é |
|---|---|
| `cartoes-bingo-140-frente-e-verso.pdf` | **Ficheiro principal.** 280 páginas: frente do cartão 001, verso, frente do 002, verso… (para impressão frente e verso). |
| `cartoes-bingo-140-so-frentes.pdf` | 140 páginas, só as frentes (001 a 140). |
| `cartoes-bingo-verso.pdf` | 1 página, o verso (igual em todos os cartões). |
| `cartoes-bingo-140.csv` | Folha de controlo: o número de cada casa, as linhas de cada cartão e os pares de linhas (Jota Pro). Para os validadores. |

## Especificações
- Formato final: **A6 horizontal, 148 × 105 mm**. Páginas com **3 mm de sangria** em cada lado (154 × 111 mm); o `TrimBox` marca o corte e o `BleedBox` a sangria. Sem marcas de corte.
- Cor: RGB. Fontes (Montserrat) incorporadas. Texto e formas vetoriais; o logótipo é imagem.
- Verso na mesma orientação que a frente (horizontal), para impressão frente e verso com viragem pelo lado maior.

## Regras garantidas nas distribuições (verificadas por `src/validar_cartoes.py`)
- Cada cartão tem os números 1 a 12, sem repetição.
- Não há duas disposições iguais.
- Não há duas linhas iguais em cartões diferentes, mesmo ignorando a ordem dos números (420 linhas únicas). Logo, o **Jota Rookie** nunca coincide por padrão de linha, e cada par de linhas (**Jota Pro**) também é único.
- O **Jota Premium** (cartão inteiro) depende só de os 12 números saírem e de a pessoa os ter vivido.

## Regenerar
```
python3 src/gerar_distribuicoes.py 140 2026 impressao/cartoes-bingo-140.csv
python3 src/validar_cartoes.py impressao/cartoes-bingo-140.csv
node src/gerar_pdf_impressao.js impressao/cartoes-bingo-140.csv impressao
```
(O passo final das caixas de página `TrimBox`/`BleedBox` foi aplicado com `pypdf` depois de gerar os PDF.)
