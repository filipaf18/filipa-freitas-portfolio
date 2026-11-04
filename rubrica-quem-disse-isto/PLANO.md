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
