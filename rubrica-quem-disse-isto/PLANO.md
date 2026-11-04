# PLANO — «Quem é que disse isto?» (JSD Famalicão, 7-nov-2026)

Estado em 2026-11-04. **Fase atual: pesquisa e proposta.** Nada de imagens finais, guião, vozes ou vídeo sem aprovação.

## Estrutura
`01_imagem/` · `02_voz/` · `03_workflow/` · `refs/` · `config/`

## Checklist
- [x] Estrutura de pastas
- [x] 01_imagem/PESQUISA_IMAGEM.md
- [x] 02_voz/PESQUISA_VOZ.md
- [x] 02_voz/PERFIS.md
- [x] 03_workflow/RECOMENDACAO.md
- [x] Teste local SVG → PNG transparente (RGBA, 2x)
- [ ] **Confirmar fontes oficiais** (inacessíveis nesta sessão: Microsoft, Google Cloud, ElevenLabs, Canva, Pixabay)
- [ ] Fotos de referência em `refs/` (a Filipa)
- [ ] **Aprovação da Filipa** para avançar

## Pendente / limitações
- Sem fontes sobre o que os caricaturistas exageram em cada figura: NÃO CONFIRMADO.
- Quotas grátis do Canva e CapCut, e licença do TTS em evento: NÃO CONFIRMADO.

## Atualização (2026-11-04, tarde)
- [x] Identidade visual da JSD analisada a partir dos vídeos/cartazes da Filipa (horizontal 16:9 (TV), Montserrat, pílulas laranja, vidro fosco, gradiente + logo 50 ANOS, gradiente azul-verde→laranja→vermelho nos títulos, LUT C8 orange/teal)
- [x] Kit em `01_imagem/png_brand/` (substitui o kit cartoon 16:9 anterior, que **não** respeita o estilo)
- [x] Fotos de referência (licença livre, Wikimedia Commons) em `refs/` — **fora do git**; créditos em `refs/<nome>/CREDITOS.json`
- [ ] Fotos melhores de Passos Coelho e Paulo Portas (Commons tem pouco material útil; Getty não permitido na rede)
- [ ] Aprovação do estilo do frame de exemplo

- [x] Formato corrigido: **horizontal 16:9 (TV)**. Kit em `png_brand/*_16x9`.
- [x] Passos Coelho: 3 fotos da Filipa utilizáveis em `refs/passos_coelho_filipa/`
- Voz: **sem clonagem** a partir do áudio enviado (ver conversa).

## Primeira proposta de caricaturas (3D estilizado)
- `01_imagem/png_personagens/`: 4 suspeitos + Apresentador (neutro e «nega») e `teste_quatro_juntos_*.png`.
- Gerado por `build/suspeitos.js` (mesmas camadas para todos). Tons de pele/cabelo = extras à paleta.
- Paulo Portas **provisório** (sem foto utilizável, sem semelhança).
- v2 (nomes no ecrã, traços mais exagerados, luz de contorno laranja/azul-verde): ver `png_personagens/`.
- v3: proporções medidas nas fotos (pontos faciais, `config/medidas_faciais.json`), cabeças maiores (estilo caricatura de jornal).
- Briefing para ilustrador: `01_imagem/BRIEFING_ILUSTRADOR.md`. v4: franja do Passos, orelhas e boca do Cavaco.
- v5 (entrega "ilustrador"): `01_imagem/png_v5/` — folhas de expressões (6), visemas A–F+X, bustos 1500x3000 neutro/nega, 5 personagens. Em falta vs briefing: vistas ¾, mãos, ficheiro PSD; Portas real.
- Portas v5.1: desenhado a partir das 6 fotos da Filipa (sem óculos), medidas em `config/medidas_media.json`. Refs em `refs/paulo_portas_filipa/` (grupos A e B).
- Passos careca (por pedido da Filipa; variante com cabelo: `png_personagens/passos_cabelo_*`); Portas mais moreno.
- Vídeo piloto 50 s: `04_video/QuemDisseIsto_piloto_V1.mp4` (guião em `04_video/GUIAO_PILOTO.md`). Voz V2: 5 modelos Piper pt-PT distintos (OpenVoiceOS miro/dii: CC BY-NC-ND; voice3/4 e tugão: licença NÃO CONFIRMADA) + efeito cartoon; só ritmo/atitude, sem imitar timbre. Falta: frase real, música, validação do guião.
- **Vídeo 1 «Todos negam»** (guião da Filipa): `04_video/Video1_TodosNegam_V1.mp4` (58,7 s). Frase em causa **POR CONFIRMAR** (fontes contraditórias: Passos Coelho 23-07-2012 vs Seguro/Expresso 21-07-2012). Vídeo 2 (confissão) em espera até confirmar autoria.
- **V2 «O Debate»** (guião humor seco, `04_video/GUIAO_V2_DEBATE.md`): `04_video/Video1_O_Debate_V2.mp4` (3 min). Falas por segmentos, corte do silêncio inicial (sincronismo), 25 fps. Frase por confirmar.
- **V3 Fase 1** (sala de argumentistas + guião): `04_video/v3/`. Aguarda aprovação para Fase 2 (animatic).
- **V3b «O Leilão»**: novo formato (apresentador = leiloeiro; frase vendida em 5 lotes; ninguém quer o lote do «que se lixem»). `04_video/v3/guiao_v3b_leilao.md`. A aguardar aprovação + decisão de voz.
- **V3c «O Leilão» (farsa)**: humor físico/sonoro, ≥50% dos risos visuais. `04_video/v3/guiao_v3c_farsa.md`.
- **V3d «O Debate» (sketch de debate de TV)**: `04_video/v3/guiao_v3d_sketch.md` (cadeia de nexo entre falas). ElevenLabs: plano gratuito NAO permite vozes de biblioteca (pt-PT) via API (402).
- **V3e «O apresentador provocador»**: `04_video/v3/guiao_v3e_provocador.md` (apresentador inventa citações; mensagens de telespectadores; callback «nem eleições»).
- **V3f caricatura** (guiao_v3f_caricatura.md): sem telespectadores, apresentador fala para a sala; tiques levados ao absurdo. Amostras teatrais com referencia pt-PT em voz_teste/v3f e comparacao de sotaque em voz_teste/sotaque.
