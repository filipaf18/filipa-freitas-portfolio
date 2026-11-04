# RECOMENDAÇÃO DE WORKFLOW

Data: 2026-11-04. **Evento: 7-nov-2026. Restam 3 dias.**

## Constatações que mandam na decisão
1. **Geradores de imagem:** as provas (secundárias) apontam para recusa ou filtragem de políticos. Caminho principal: **SVG desenhado por código** (testado: SVG → PNG transparente, `ffmpeg` disponível).
2. **Voz:** só encontrei uma voz masculina pt-PT bem documentada (Azure Duarte). Faltam quatro timbres distintos. **A solução mais segura e original é gravar as vozes com pessoas reais** (a Filipa e amigos), sem imitar os políticos.
3. **Não consegui abrir páginas oficiais.** Limites e licenças ficam por confirmar.

## Workflow B — mais seguro e rápido para dia 7 (RECOMENDADO)
- **Imagem:** personagens em SVG com camadas trocáveis (olhos, sobrancelhas, 3–4 bocas, 3–4 poses de mão). Cenário e grafismo em SVG.
- **Animação:** frames renderizados localmente (Playwright) + `ffmpeg`. Sincronização labial por volume (boca abre/fecha). Sem visemas completos.
- **Voz:** 5 pessoas gravam no telemóvel, com voz original da personagem (nunca imitação). Edição no CapCut.
- **Música/SFX:** Pixabay (guardar licença) ou Freesound só CC0.
- **Custo:** 0 €. **Tempo:** cerca de 3 dias, com apertos. **Risco:** vozes reais exigem 4 voluntários, qualidade de áudio, animação em tempo útil.
- **Contingência:** se a animação não fechar, **imagens estáticas com troca de expressões** (estilo cartão de debate) + áudio. Funciona e é cómico.

## Workflow A — melhor qualidade possível sem pagar
- Igual a B na imagem, com **mais poses/expressões e lip-sync por visemas** (Rhubarb, instalação por testar).
- **Voz:** Azure Speech para o Apresentador e mistura de TTS e gravações. Exige conta Azure; **não sabemos se a Filipa a consegue criar sem cartão**.
- **Custo:** 0 € se tudo for confirmado grátis, **mas há quatro pontos NÃO CONFIRMADOS**. **Tempo:** mais do que 3 dias. **Risco:** alto.
- **Contingência:** cair no Workflow B.

## O que a Filipa tem de fazer à mão
1. Colocar 4–8 fotos de cada pessoa em `refs/<nome>/` (§ lista no resumo final).
2. Decidir elenco de voz (gravar ou TTS) e **recrutar vozes**.
3. Abrir as páginas oficiais e confirmar licenças/limites (Canva, CapCut, Pixabay, Freesound).
4. Aprovar o guião e o aviso «HUMOR · FALAS FICCIONAIS». Idealmente, validação da JSD.
5. Gravar/gerar as vozes e fazer o upload.

## O que o Claude consegue fazer
- Desenhar personagens, cenário, logótipo e kit gráfico em SVG, e exportar PNG transparente.
- Montar a animação (frames + vídeo) e calcular a abertura da boca a partir do áudio.
- Escrever guiões, SSML e ficheiros de configuração.
- **Não** consegue: gravar vozes, abrir contas, ouvir a qualidade, nem confirmar licenças nas páginas oficiais (nesta sessão).

## Limites editoriais (checklist)
- [ ] PSD e figuras sempre bem tratados.
- [ ] Humor de situação, sem defeitos físicos nem sotaque.
- [ ] Falas ficcionais com aviso no ecrã.
- [ ] Sem deepfake, sem foto filtrada, sem clonagem de voz.
- [ ] Quatro suspeitos igualmente suspeitos.
