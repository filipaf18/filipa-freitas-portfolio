# PESQUISA DE IMAGEM — «Quem é que disse isto?»

Consulta: 2026-11-04. Faltam 3 dias para 7 de novembro.

## 0. Aviso de método
- **Os sites oficiais (Microsoft, Google Cloud, ElevenLabs, Canva, Pixabay, YouTube) não eram acessíveis a partir desta sessão** (erro de rede nos `WebFetch`). Só consegui resultados de pesquisa e blogs.
- Por isso, tudo o que não vem de página oficial está marcado **NÃO CONFIRMADO (fonte secundária)**. Antes de dependeres de um limite ou de uma licença, **abre a página oficial e confirma**. A lista está em §9.
- Não encontrei nenhuma fonte que descreva o que os caricaturistas exageram em cada uma das quatro figuras. **Não inventei nenhuma característica.** Ver §1.

## 1. Como se caricaturam bem estas figuras

**Pesquisa feita:** a procura por «características exageradas» de Cavaco Silva em cartunistas portugueses não devolveu nenhuma fonte utilizável. Só devolveu definições genéricas de caricatura (desenho que exagera as características marcantes do retratado).
- Estado: **NÃO CONFIRMADO** para as quatro figuras. As fichas da secção 4 do briefing (óculos, sobrancelha, dedo no ar, etc.) são **direções de interpretação cómica** dadas pela Filipa, não traços documentados por caricaturistas.

**Convenções gerais de caricatura política** (conhecimento de ofício, sem fonte web. Tratar como boas práticas, não como facto citado):
1. Escolher 2–3 traços de silhueta por pessoa e exagerá-los. O resto fica simples.
2. Cabeça grande para o corpo (cerca de 1:3 a 1:4), mãos grandes e expressivas. As mãos são metade da comédia de debate.
3. Linha limpa, poucas formas internas, sombra plana.
4. A expressão carrega o gag. Cada personagem precisa de 6–8 expressões-base legíveis a 1 metro de distância num projetor de salão.
5. O objeto-assinatura identifica melhor do que a cara: caneta, copo de água, pasta, microfone.

**Como resolver a semelhança sem fontes:**
- Quando a Filipa puser fotos em `refs/<nome>/`, extraio dessas fotos **características estruturais** em texto, por exemplo formato da cabeça, cabelo, óculos, linha do maxilar. A seguir proponho 2–3 traços a exagerar e a Filipa aprova.
- Sem paródia de defeitos físicos nem de sotaque (limite editorial 3.4).
- Regra de ouro (3.5): a caricatura identifica a pessoa mas **não denuncia quem disse a frase**. Todas têm o mesmo tratamento de luz e de enquadramento.

## 2. Ferramentas de imagem: comparação

Critérios por ordem: (a) consistência, (b) aceita caricaturas de políticos, (c) PNG transparente, (d) limites grátis, (e) licença de evento, (f) rapidez.

| Ferramenta | (b) Políticos reais | (c) PNG transparente | (d) Grátis | (e) Licença | Estado das provas |
|---|---|---|---|---|---|
| **Canva** (gerar imagem) | **Recusa** (provável). Ajuda oficial: não gerar imagens de pessoas existentes sem permissão. Teste noticiado: recusou um primeiro-ministro. CEO disse que não funciona com termos políticos | Remoção de fundo: **NÃO CONFIRMADO** se é só Pro | Quota mensal pequena. Valores contraditórios (25 / 50 / ~5), **NÃO CONFIRMADO** | NÃO CONFIRMADO | Política: resumo de pesquisa que cita a ajuda do Canva. Limites: blogs |
| **Gemini / AI Studio** (imagens) | **Recusa provável.** Fontes secundárias dizem que desde fev. 2026 «figuras públicas» é categoria bloqueada | Não nativo | NÃO CONFIRMADO | NÃO CONFIRMADO | Só fontes secundárias, nada oficial |
| **Microsoft Designer / Copilot / Bing Image Creator** | **Filtros fortes** com figuras públicas, mas sem texto oficial encontrado. **NÃO CONFIRMADO**. Risco de suspensão por violações repetidas | Não nativo | NÃO CONFIRMADO | NÃO CONFIRMADO | Notícias de 2024 e guias de baixa autoridade |
| **Leonardo.ai** | **Sem informação** sobre figuras públicas | Não nativo | 150 tokens/dia (FAQ da Leonardo, via resultado de pesquisa). Imagens grátis **públicas** | **Fontes contradizem-se** sobre uso comercial no plano grátis | Misto |
| **Ideogram** | Sem informação | Não nativo | Fontes referem cerca de 10 imagens/dia (blog). NÃO CONFIRMADO | Plano grátis: imagens **públicas**. Licença comercial: fontes contradizem-se | Misto |
| **Krea, Playground, Hugging Face Spaces** | **Não pesquisado** | — | — | — | NÃO PESQUISADO |
| **SVG por código (Claude)** | **Sem restrição de política**: desenho original, não geração a partir de foto | **Sim** (testado) | **0 €**, sem quotas | Original, é da Filipa | **TESTADO nesta sessão** |

**Conclusão do teste de política (§3 do pedido):**
- As provas indicam que as ferramentas mainstream **recusam ou filtram** figuras públicas e políticos. O que tenho é consistente, mas é só secundário. Não testei nenhuma ao vivo.
- Mesmo que alguma aceitasse, o plano grátis do Leonardo e do Ideogram publica as imagens e a licença é ambígua. Ambas são más escolhas para um evento público.
- **Decisão: o caminho principal passa a ser vetor desenhado por código (SVG → PNG).**

### Pipeline testado nesta sessão
- Claude escreve SVG, o Chromium pré-instalado com Playwright renderiza com `omitBackground: true`, e sai um PNG RGBA em 2x (800×800 de um canvas de 400×400). **Verificado.**
- `ffmpeg` está disponível. Sequências de PNG podem virar vídeo **sem sair do ambiente**.
- `rsvg-convert`, `inkscape` e `cairosvg` **não** estão instalados. O Chromium resolve.

## 3. Sistema de personagens em SVG (estrutura proposta)

Um ficheiro-mestre por personagem, com grupos (`<g id="…">`) empilhados por camada:

```
char_<nome>.svg
  g#sombra
  g#corpo           (tronco + fato; variantes: corpo_neutro, corpo_inclinado, corpo_levantado)
  g#braco_esq / g#braco_dir   (variantes de pose: repouso, dedo_no_ar, aberto, microfone, papeis)
  g#mao_esq / g#mao_dir       (variantes de mão: repouso, ponto, aberta, punho, agarra)
  g#pescoco
  g#cabeca_base     (forma + cabelo + orelhas)
  g#oculos          (só quem os usa; ajustável por posição)
  g#sobrancelha_esq / g#sobrancelha_dir   (neutra, erguida, franzida, surpreendida)
  g#olho_esq / g#olho_dir     (aberto, semicerrado, fechado, pupila_esq, pupila_dir, pupila_cima…)
  g#boca            (viseme_A…viseme_X + sorriso_irónico, boca_aberta_grito)
  g#objeto          (assinatura: caneta, copo, pasta, microfone, cartão)
```

- Cada variante é um `<g>` com `id` do tipo `boca_visema_E` e `display:none` por defeito. O motor liga e desliga por JS ou CSS.
- Com isto saem **folhas de expressões** (matriz de combinações) e, no mesmo ficheiro, animação por camadas.
- Os quatro suspeitos têm de partilhar **a mesma estrutura de camadas e as mesmas proporções-base**, para o teste de «igualmente suspeitos».

## 4. Pipeline de consistência
1. **Style guide** (`config/style.json`): espessura de contorno (por exemplo 6 px a 1080p), proporção cabeça/corpo, paleta (§5), regras de sombra plana, um único canto de luz.
2. **Folha-base por personagem:** frente, 3/4 esq., 3/4 dir., 8 expressões, 6 poses de mão.
3. **Teste dos quatro juntos:** render lado a lado na mesma bancada. Critério: ninguém parece mais «culpado» do que os outros.
4. **Nomes de ficheiros:** `cavaco_cabeca_3q-esq_surpresa.png`. Camadas: `<personagem>/<parte>_<variante>`.
5. **Exportação PNG** transparente a 2x. Backup SVG mantido no repo.

## 5. Paleta e estética
Paleta obrigatória: `#F58220` · `#D96516` · `#FFFFFF` · `#171717` · `#172A3A` · `#E9E9E9`.
- Sugestão de uso: laranja para cenário e grafismo; `#172A3A` para fatos e fundo; `#171717` para contorno e sombras; `#E9E9E9` para destaques e papel; `#D96516` para sombra do laranja.
- **Pele e cabelo:** a paleta obrigatória não tem tons de pele. **Decisão a tomar pela Filipa** (ver RECOMENDACAO.md): usar tons-pele adicionais discretos, ou estilizar a pele só com `#E9E9E9`/`#FFFFFF`. Não decidi por ela.
- Estética: cartoon editorial contemporâneo, acabamento vetorial, nada infantil nem corporativo.

## 6. Estúdio e grafismo
- **Cenário fixo:** uma única SVG (mesa angular, 4 lugares, painel central, painéis laranja, ecrã de frase). Fica atrás dos personagens como camada estática. Feito por Claude em SVG, **0 €**.
- **Logótipo e kit gráfico:** SVG (etiquetas de nome, indicadores de fala, barras de debate, alertas, contador). Também por Claude. Aviso fixo no canto: «HUMOR · FALAS FICCIONAIS».
- **Canva** serve para montagem final e texto, mas ver limitações §2 (quotas de IA e remoção de fundo por confirmar).

## 7. Animação 2D sem API: o que é realista até dia 7

| Efeito | Método | Realista até dia 7? |
|---|---|---|
| Piscar, olhos, sobrancelhas | Trocar variantes SVG a cada N frames | **Sim** |
| Cabeça/tronco a balançar | Transformações simples (rotação ±3°) | **Sim** |
| Poses de braço/mão | Trocar de pose entre 3–4 estados | **Sim** (limitar a poucas poses) |
| Sincronização labial simples | **Por envolvente de áudio**: abre/fecha entre 3–4 bocas conforme o volume. Alternativa: Rhubarb (6 formas A–F, entrada WAV). Rhubarb é só pesquisa de blog, **instalação não testada** | **Sim**, com 3–4 bocas |
| Visemas completos por fonema | — | **Não recomendado** no prazo |
| Exportar para vídeo | Playwright (frames PNG) + ffmpeg, **local** | **Sim**, mas o tempo de render é por testar |
| Rive | **Exportar vídeo exige plano pago** (docs do Rive, via resultado de pesquisa) | **Não** como caminho principal |
| Lottie / Canva Animate / CapCut | Não pesquisei a fundo. CapCut: exportação grátis a 1080p e marca de água são **NÃO CONFIRMADOS**, fontes contradizem-se | **NÃO CONFIRMADO** |

## 8. Riscos legais e editoriais (nota, não parecer jurídico)
- O direito à imagem está no art. 79.º do Código Civil. Não consegui o texto das exceções. **Não sou jurista**: se houver dúvida, a JSD deve ter validação própria.
- Há queixa-crime recente (2023) contra uma animação satírica na RTP em Portugal. O risco existe, daí os limites editoriais do briefing (sem difamação, sem defeitos físicos, sem associar o PSD a incompetência).
- Recomendo que **a JSD valide o guião** antes da exibição.

## 9. A confirmar na fonte oficial
1. Quotas do plano grátis do Canva (imagem IA, remoção de fundo, exportação de vídeo) e se a exportação final leva marca de água.
2. Política de cada gerador sobre figuras públicas, se vier a ser preciso (teste ao vivo com a Filipa).
3. Termos grátis do CapCut: marca de água e licença de uso em evento.
4. Instalação do Rhubarb (se preferires visemas reais).

## Fontes (consulta 2026-11-04)
- Canva, ajuda sobre Magic Studio/Magic Media (resultado de pesquisa; página não aberta): https://www.canva.com/help/using-magic-studio-safely-and-legally/ · https://www.canva.com/help/using-magic-media/
- Business Insider (CEO do Canva, termos políticos): https://businessinsider.nl/you-cant-use-canvas-ai-to-create-political-flyers-or-spread-medical-misinformation-the-ceo-said/
- Gemini, restrições a figuras públicas (secundárias): https://blog.laozhang.ai/en/posts/gemini-image-generation-people-restriction · https://gptprompts.ai/ai-errors-and-fixes/gemini-wont-generate-images-of-people
- Microsoft Designer (secundárias): https://venturebeat.com/business/microsoft-adds-new-restrictions-to-designer-ai-used-to-make-taylor-swift-deepfakes
- Leonardo (FAQ): https://intercom.help/leonardo-ai/en/articles/7051613-frequently-asked-questions · https://terms.law/ai-output-rights/leonardo/
- Ideogram: https://docs.ideogram.ai/using-ideogram/frequently-asked-questions · https://ideogram.ai/licensing/
- Rive, exportação de vídeo: https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design.md
- Rhubarb Lip Sync: https://github.com/wzpan/rhubarb-lip-sync
- CapCut (secundárias): https://costbench.com/software/video-editing/capcut/free-plan/ · https://autoae.online/blog/is-capcut-free-for-commercial-use
- Telo de Abreu v. Portugal (CEDH): https://globalfreedomofexpression.columbia.edu/?p=147746
- Direito à imagem, art. 79.º CC: https://core.ac.uk/download/70685438.pdf
