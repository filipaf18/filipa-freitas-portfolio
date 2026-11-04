# QA · Vídeo 1 «O Debate» V3 (final)
Gerado a partir de `guiao_v3g_discussao.md`. Medições automáticas; **ninguém viu o vídeo com público**.

## Técnico
- 1920×1080 · 25 fps · H.264 High (CRF 17) · AAC 256 kbps estéreo 48 kHz · **5:03 (304 s)** · `+faststart`.
- **Loudness −16,4 LUFS integrado, pico real −2,0 dBTP, LRA 5,0 LU** (alvo do evento: −16 ± 1; true peak ≤ −1,5). *Para emissão em televisão em Portugal o padrão é −23 LUFS (EBU R128): se for para emitir, renormaliza.*
- Sem silêncio digital: tom de sala contínuo (≈ −50 dB) e leito musical sintetizado.

## Sincronia labial (voz e boca)
- Boca calculada a partir da energia real da voz de cada personagem (25 fps), com **antecipação de 1 fotograma (40 ms)**.
- Correlação boca↔áudio por desfasamento: pico em **−1 fotograma (0.76; contra 0.59 em 0 e 0.41 em +1)**: a boca adianta-se ao som exatamente o previsto, sem derrapar.
- Fotogramas de fala com a boca fechada: 19 % (pausas entre sílabas e frases) · boca a mexer sem fala: **0.6 %**.
- **Limite:** a boca segue a energia (5 formas), **não o fonema**. O sincronismo temporal é exato; a forma da boca nem sempre corresponde à vogal.

## Inteligibilidade (faster-whisper «small», pt)
- **Média de palavras corretas: 92,3 %** (apresentador 94 %, Cavaco 93 %, Passos 95 %, Portas 88 %, Montenegro 91 %). **51 de 78 falas ≥ 97 %.** O alvo de 98 % **em cada fala NÃO foi atingido**.
- **19 falas abaixo de 90 %**, quase todas exclamações curtas ou números: c12 (0.33), c21 (0.46), d14 (0.5), e05 (0.5), d05 (0.56), c17 (0.67), d23 (0.67), e02 (0.67), c19 (0.75), d06 (0.75), c09 (0.8), c15 (0.8), c14 (0.83), d15 (0.85), c06 (0.86), d04 (0.86), a06 (0.86), c02 (0.89), e04 (0.89). O reconhecimento também falha nestas, por isso **a causa pode ser a avaliação**; só se confirma de ouvido. `c21` («dois mil e trinta e um») dá baixo porque o reconhecimento escreve «2031».
- Nomes próprios («Famalicão», «Cavaco») são os mais fracos. **Não confirmei a pronúncia de ouvido.**

## Montagem
- **106 cortes** (média 2,8 s por plano); V2: 6 cortes. Mais de 5 s sem corte: 11 planos (o maior 15,5 s por volta de 2:59). Sem fades: cortes secos, **whip pans com desfoque** nas interrupções, flash da buzina, cartões de abertura e fecho.
- Cortes de reação a meio das falas longas (a voz continua por cima, como em televisão).

## Som
Vozes (Fish Audio, 5 timbres a partir da voz do Montenegro; Cavaco e Passos obtidos por processamento) + efeitos e música **sintetizados por mim** (buzina, whooshes, stings, tosse, grilo, leito musical). Sem ficheiros de terceiros.

## Auditoria de comédia (intenção, não resultado)
24 pontos de riso previstos em 5:03; intervalo máximo entre eles ≈ 30 s. **Não testado com público.**

| Tempo | Piada |
|---|---|
| 0:19 | «o mais próximo de uma eleição interna sem ninguém a gritar» |
| 0:24 | «o castigo é pagar a próxima ronda» |
| 0:28 | mesa dos dirigentes «perto da comida» / «reunião de distrital» |
| 0:36 | «um cronómetro para o cronómetro» |
| 0:56 | Passos: «Boa noite» depois de 5,5 s de silêncio |
| 1:02 | Portas: «Com anexos!» |
| 1:11 | «Ainda nem se sentou.» |
| 1:21 | «na rima, e na decência» |
| 1:28 | «Isto não é gabarolice. É estratégia.» |
| 1:53 | buzina: «TEMPO!» |
| 1:59 | Cavaco: «Responde ao horário!» |
| 2:02 | Portas: frase infinita → «não.» |
| 2:21 | «Foram quarenta segundos. Para uma sílaba.» |
| 2:28 | Montenegro: «É A CALMAR!» |
| 2:38 | Passos: «Estou. Para futuro.» |
| 2:41 | «Voltaremos ao Dr. Passos em 2031» |
| 2:50 | Portas: «Não, espere: isso é uma acusação!» |
| 2:58 | «uma ata sobre uma ata» |
| 3:08 | Montenegro: «Antes de dizer, proponho uma reunião…» |
| 3:37 | Cavaco: «Foram vinte e duas!» |
| 4:05 | Portas: «lixarem-se» |
| 4:19 | Passos: «…isso fica para futuro» |
| 4:44 | Passos: «Já pensei. Não sei.» |
| 4:50 | «O bar continua aberto… a campanha está ganha» |

## Limites
1. Caricaturas reconhecíveis por traços de assinatura; em cartoon, sem deformações humilhantes. **A semelhança continua limitada.**
2. Vozes **originais**, não clones de pessoas reais. *Origem:* referências pt-PT do Piper e vozes derivadas; **licenças do Piper e do modelo gratuito da Fish Audio para uso público NÃO CONFIRMADAS.**
3. Sátira de retórica e feitio, sem factos nem acusações; PSD e figuras com dignidade.
4. «HUMOR · FALAS FICCIONAIS» permanente no canto.
5. Nenhuma fala aponta para o autor da frase verdadeira; os quatro têm o mesmo castigo e a mesma saída.

## Pendente
- **PIN do Kahoot:** o ecrã final diz «PIN: [ PIN A INSERIR ]». Passa o PIN (ou o QR) e re-renderizo o fim.
- **Frase** da pergunta: autoria/redação ainda por confirmar em fontes primárias.
- Duração de 5 min: se for demasiado, há cortes sugeridos em `guiao_v3g_discussao.md`.
