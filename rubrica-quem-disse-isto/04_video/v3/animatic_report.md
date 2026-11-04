# RELATÓRIO DO ANIMATIC (Fase 2)

**Duração total: 237 s (3:56)**. Das quais ≈ 0 s são linhas/planos **[OPC]** → sem OPC ≈ 237 s (3:56).

- Planos (cortes): **99** no total; **63** na secção de debate (alvo da V3: ≥ 35 no total; V2 tinha 6). Duração média do plano: 2.4 s · média no debate: 2.2 s.
- Planos parados > 5 s: [(11, 'LED', 7.384), (16, 'MP:ap', 5.126), (18, 'MP:ap', 6.702), (21, 'MP:ap', 6.111), (25, 'MP:ap', 6.948), (35, 'PM:cav', 7.619), (40, 'PM:por', 7.827), (83, 'MP:ap', 5.945), (98, 'MP:ap', 10.156)]. *(O LED com a frase dura 4 s por desenho.)*
- Silêncios entre falas > 2 s: [('a3', 4.6), ('a4', 2.3), ('a6', 2.9), ('b19', 2.4), ('d5', 2.1), ('f6', 2.4)]. *(Os 2,0 s do «Que se lixe… para futuro» e do «Já me esqueci» são cómicos por desenho.)*
- Monólogos contínuos do apresentador (linhas seguidas): [('a1', 'a7', 43.5), ('a8', 'a8', 6.1), ('a8c', 'a9', 8.1), ('a9c', 'b1', 8.0), ('b3', 'b3', 1.0), ('b6', 'b6', 1.1), ('b8', 'b8', 1.3), ('b12', 'b12', 2.7), ('b14', 'b14', 0.8), ('b17', 'b17', 3.7), ('b20', 'b20', 3.2), ('c14', 'c14', 1.2), ('e1', 'e2', 9.2), ('e4', 'e4', 1.4), ('e6', 'f2', 8.2), ('f3', 'f3', 3.6), ('f4', 'f4', 4.7), ('f5', 'f5', 3.7), ('f6', 'f6', 9.7)]. **Alvo ≤ 25 s.**

**Tempo de fala por suspeito (s)**, com / sem OPC:

| Personagem | com OPC | sem OPC |
|---|---|---|
| CAV | 27.2 | 27.2 |
| PAS | 14.0 | 14.0 |
| POR | 18.3 | 18.3 |
| MON | 13.1 | 13.1 |
| AP | 104.9 | 104.9 |

## Inteligibilidade das vozes provisórias (faster-whisper «small», pt)
Média de palavras corretas: **59.7 %** · falas ≥ 98 %: **18/71** (alvo da Fase 3: ≥ 98 % em cada fala).

| Fala | Voz | Acerto | Texto do guião → o que o reconhecimento ouviu |
|---|---|---|---|
| a8c | ap | 0 % | Anotado. → *e dada.* |
| a9b | por | 0 % | Respeito, mas discordo. → *despite misdiscordo* |
| b7 | por | 0 % | Objeção! → *opção.* |
| b19 | pas | 0 % | Já me esqueci. → *Jámos que sim.* |
| c2 | mon | 0 % | Porquê?! → *Tchau.* |
| c3 | pas | 0 % | Porque se levantou primeiro. → *Books Levent Obi-Wan.* |
| c4 | mon | 0 % | Mas eu ainda estou sentado! → *Pois é, vejamos o Simpano.* |
| c7 | mon | 0 % | Tenho de me rir de si. → *Então, vinte e um, vinte e um, vinte e um.* |
| c11 | mon | 0 % | Ah ah ah ah ah ah! → *Arrrrrrrrrrrrrrrrrrrrrrrr* |
| d1 | por | 0 % | Peço a palavra! → *Pessoa bolada!* |
| e3 | pas | 0 % | Portugal. → *Putugao!* |
| e5 | cav | 0 % | Posso terminar? → *Voste-me aí.* |
| f5t | mon | 0 % | Não é não. → *Muito bom.* |
| a4 | ap | 20 % | A frase é a seguinte. → *a fase esguins.* |
| d5 | cav | 20 % | Que se lixem os jornais. → *Sliçam os ronais.* |
---
## LEITURA DO RELATÓRIO (o que falha e o que corrigir)
1. **Duração: 3:56** (alvo 2:30–3:00). A parte de falas soma ≈ 177 s; o resto são pausas cómicas, planos de reação e cartões. É **conteúdo a mais**, não só ritmo.
2. **O apresentador domina**: ≈ 105 s de fala contra ≈ 73 s dos quatro suspeitos juntos (**59 % vs 41 %**), e os suspeitos estão desequilibrados (CAV 27 s · POR 18 s · PAS 14 s · MON 13 s). O pedido era «um debate entre eles»: ainda falta mais troca *entre suspeitos*.
3. **A abertura arrasta**: AP fala **43,5 s seguidos** (a1–a7), acima do alvo de 25 s, apesar das interjeições; o cartão da frase fica 7,4 s parado.
4. **Planos parados > 5 s**: 9 (maioria MP do apresentador a falar). No animatic são stills; em animação precisam de push-in, cutaways de reação a cada ≈ 4 s e mudança de plano a meio das falas longas (b5, b9, f6).
5. **Cortes: 99** (63 no debate), muito acima do alvo de 35 (V2: 6). O ritmo de corte já é o certo.
6. **Inteligibilidade das vozes provisórias: 59,7 %** de palavras corretas; **18/71** falas ≥ 98 %. Falham sobretudo as falas curtas e as exclamações («Objeção!» → «opção», «Peço a palavra!» → «Pessoa bolada!», «Porque se levantou primeiro» → «Books Levent Obi-Wan»). **Ressalva honesta:** o reconhecimento usado (Whisper «small») também erra em falas muito curtas, mesmo com boas vozes. Mas o problema do TTS é real e coincide com o que a Filipa ouviu na V2. **Com estes modelos Piper pt-PT, a Fase 3 não chega a 98 %.**

## LISTA DE CORTES PARA ≈ 3:00 (escolhe)
| # | Corte | Poupa |
|---|---|---|
| 1 | Encurtar «Boa noite, Famalicão. Quatro convidados, uma frase… e nenhum responsável.» | ≈ 2 s |
| 2 | Fundir a dissecação «ninguém assinou»: ficar só com «Ninguém assinou.» | ≈ 3 s |
| 3 | Tirar a dissecação «lixar» (e o «prescindir» do Cavaco) | ≈ 10 s |
| 4 | Tirar a 2.ª fala do Cavaco no início («Então deixe-me começar…») | ≈ 5 s |
| 5 | Encurtar a defesa do Portas («Prefiro chegar cedo…») | ≈ 2 s |
| 6 | Reduzir «tenho de me rir de si» a um só destinatário | ≈ 5 s |
| 7 | Tirar o par «bomba atómica / gramática» *(é uma das 10 melhores; só se faltar tempo)* | ≈ 9 s |
| 8 | Tirar «Posso terminar?» / «Não.» | ≈ 3 s |
| 9 | Closes de votação sem «Garante que não foi» | ≈ 4 s |
| 10 | Pausas cómicas −20 % em geral | ≈ 10 s |
Cortes 1+2+3+5+6+8+9+10 ≈ **−39 s** → ≈ 3:15; com o 7 e o 4 ≈ **−53 s** → ≈ **3:00**. **Recomendo 1, 2, 5, 6, 8, 9, 10 (≈ −30 s)** e decidir o resto depois de ouvires voz melhor, porque as pausas dependem da entoação.

## O QUE A FASE 3 PRECISA (decisão tua)
Para a voz chegar a ≥ 98 % e soar a comédia, preciso de **um motor TTS pt-PT melhor**. Opções reais:
- **A.** Permitires `speech.platform.bing.com` na rede do ambiente → vozes neurais pt-PT da Microsoft (Duarte, Raquel; Fernanda **NÃO CONFIRMADA**) via Edge TTS. Só **uma voz masculina** (Duarte) → teríamos de a diferenciar por processamento. **Licença para uso público NÃO CONFIRMADA.**
- **B.** Me dares uma chave de TTS (ElevenLabs, Azure ou Google) para vozes com direção emocional; custo ≠ 0 €.
- **C.** Gravar as vozes com pessoas (a única forma de garantir entoação cómica).
