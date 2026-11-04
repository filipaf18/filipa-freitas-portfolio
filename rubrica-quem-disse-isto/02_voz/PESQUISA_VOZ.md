# PESQUISA DE VOZ — «Quem é que disse isto?»

Consulta: 2026-11-04. **Os sites oficiais não eram acessíveis a partir desta sessão.** Tudo abaixo vem de resultados de pesquisa e é **NÃO CONFIRMADO (fonte secundária)** salvo indicação. **A Filipa tem de ouvir cada voz e confirmar a licença na página oficial antes de usar.**

## 1. Comparação de ferramentas

| Ferramenta | pt-PT? | Vozes distintas | Controlo (SSML) | Grátis | Uso público em evento | Estado |
|---|---|---|---|---|---|---|
| **Azure Speech** | **Sim.** 3 vozes neurais pt-PT: `pt-PT-DuarteNeural`, `pt-PT-RaquelNeural`, `pt-PT-FernandaNeural` (nomes confirmados por vários sítios; Duarte = masculina e Raquel = feminina segundo post Microsoft de 2020; **género da Fernanda NÃO CONFIRMADO**) | **Só 1 voz masculina** (Duarte) + 2 femininas. Insuficiente para 4 homens + apresentador | SSML (velocidade, tom, pausas). Estilos pt-PT: **NÃO CONFIRMADO** | Neural: **0,5 milhões de caracteres/mês** no nível F0, segundo página de preços Microsoft (via resultado de pesquisa). HD e Custom Neural **fora** da quota | **Exige conta Azure.** A Filipa disse que **não tem chaves de API nem orçamento**; conta/cartão a confirmar | Parcial |
| **Google Cloud TTS** | **pt-PT: NÃO CONFIRMADO.** Só vi vozes pt-BR nos resultados | — | SSML existe. Detalhe NÃO CONFIRMADO | Chirp 3 HD: 0–1 M caracteres grátis/mês segundo páginas de preços (via pesquisa). Fontes contradizem-se se existe plano grátis | Exige projeto Cloud e faturação. **Pode não servir sem cartão** | Por confirmar |
| **Gemini TTS (AI Studio)** | **NÃO CONFIRMADO** (pt-PT) | Muitas vozes (não verificado) | Prompt de estilo; sem SSML clássico | **Contradição:** página de limites mostra 3 pedidos/min e 15/dia para um modelo TTS preview, mas outra fonte diz que não há quota grátis. Modelos são *preview* | Licença NÃO CONFIRMADA | Por confirmar |
| **ElevenLabs** (web) | Português: **NÃO CONFIRMADO se é pt-PT** | Muitas vozes | Controlo por estabilidade/estilo | 10 000 créditos/mês. **Plano grátis sem licença comercial** e pode exigir atribuição «Made with ElevenLabs» (fontes contradizem-se) | **Risco alto.** Evento da JSD é público | **NÃO recomendado como principal** |
| **Edge «Ler em voz alta» / Edge TTS** | **NÃO CONFIRMADO** (só vi vozes pt-BR). Pela minha memória, não por esta pesquisa, as vozes pt-PT são as mesmas da Azure | Poucas | Quase nenhum | Uso pessoal. Termos de uso público **NÃO CONFIRMADOS** | NÃO CONFIRMADO | Por confirmar |
| **Piper (offline)** | Existe modelo `pt_PT` no repositório `rhasspy/piper-voices` (Hugging Face) | Poucas vozes (não verificado) | Limitado | Software MIT (via pesquisa). **A licença de cada voz depende dos dados de treino** e pode ser só não comercial | Verificar na ficha da voz | Por confirmar |
| **CapCut TTS** | Lista «Português» (pt-PT vs pt-BR **NÃO CONFIRMADO**) | Várias | Pouco | Grátis (não confirmado). Licença de áudio em evento: NÃO CONFIRMADA | NÃO CONFIRMADO | Por confirmar |

### Problema principal
Para cinco personagens (quatro homens e um apresentador) preciso de **cinco timbres distintos**. A única opção pt-PT bem documentada, a Azure, tem **uma voz masculina**. Mesmo com muito ajuste de tom e velocidade, quatro personagens iguais é um problema. Não consegui provar que existam outras fontes pt-PT gratuitas que cubram o elenco.

**Opções para resolver (por ordem de preferência):**
1. **A Filipa e amigos gravam as vozes** (cinco pessoas diferentes). É gratuito, 100 % original, sem problema de licença e **sem ambiguidade de «imitação»** se não imitarem os políticos. Gravação no telemóvel; edição no CapCut. **Recomendo isto como Workflow B.**
2. Azure para o Apresentador (Duarte) + vozes pitchadas/humanizadas para os outros. Qualidade e distinção por testar.
3. Outros TTS, se a Filipa os conseguir validar (ver §5).

## 2. Perfis vocais → `PERFIS.md`
Resumo (original, nunca imitação das figuras reais):

| Personagem | Registo | Ritmo | Energia | Tique verbal | Como «nega» |
|---|---|---|---|---|---|
| Cavaco | Médio-grave | Lento | Baixa, firme | Pausa antes de cada ponto; «Ora, vejamos…» | Pausado, formal, corrige a pergunta |
| Passos Coelho | Médio-baixo | Calmo | Baixa, contida | Meia-pausa irónica | Baixo, sem pressa; nega quase a sorrir |
| Portas | Médio-agudo | Rápido | Alta, floreada | Frases longas com subordinadas | Defesa já preparada, interrompe-se a si próprio |
| Montenegro | Médio | Começa normal, acelera | Sobe ao longo da fala | «Deixem-me só dizer…» | Institucional que escala para discussão |
| Apresentador | Médio, seco | Rápido | Alta | Cartões, campainha | Árbitro: corta e passa a palavra |

(Os tiques verbais acima são **inventados para as personagens**, não retirados de falas reais.)

## 3. Proposta de elenco
Sem teste de audição não posso assumir qualidade. **Proposta para a Filipa testar numa tarde** (frase de teste incluída):
- **Frase de teste:** «Em Portugal, as eleições não se ganham com Kahoot, mas hoje quem vota é a sala.»
- Testa: «eleições», «Portugal», «Kahoot» e uma pergunta com entoação.
- **Azure:** Duarte, Raquel, Fernanda. Ajustar velocidade (`rate` −10 a +15 %), tom (`pitch` −3 a +3 st), pausas (`<break time="500ms"/>`). Ainda assim **só Duarte é masculina** (NÃO CONFIRMADO para Fernanda).
- Outros candidatos: **NÃO CONFIRMADOS**. Não proponho nomes de voz que não verifiquei.

## 4. Técnica de comédia (só ferramentas grátis)
- **Pausas:** `<break>` em SSML ou, em gravação, cortar silêncio no CapCut.
- **Entradas por cima / discussão simultânea:** gravar cada fala em pista separada; sobrepor com 150–300 ms de entrada antecipada. Baixar 3–6 dB a voz que é interrompida.
- **Campainha:** efeito sonoro curto, cortando a fala a meio com corte seco.
- Edição de pistas: **CapCut** (grátis, multi-pista) ou ffmpeg local.

## 5. Música e efeitos (licenças)
- **Pixabay (música e SFX):** segundo a FAQ oficial (via resultado de pesquisa), pode usar-se sem atribuição, mesmo comercialmente, e em redes sociais. Há restrição de revender o ficheiro isolado. **Guardar o URL e a licença de cada faixa.**
- **Freesound:** a licença é **por clip**. CC0 é livre; CC-BY exige crédito; CC-BY-NC **não serve** para evento. Verificar clip a clip.
- **YouTube Audio Library:** **NÃO CONFIRMADO** se pode usar fora do YouTube. Não recomendo para evento.
- **CapCut:** ver §1. Licença de música por faixa e por plano. **Evitar** para o evento até confirmar.

## 6. A confirmar na fonte oficial (por ordem de importância)
1. Se existem vozes masculinas pt-PT suficientes em alguma ferramenta gratuita e utilizável sem cartão.
2. Termos de uso público do Azure/Edge TTS para um evento.
3. Termos de Piper pt_PT (ficha de cada voz no Hugging Face).
4. Licença dos efeitos sonoros escolhidos (guardar capturas).

## Fontes (consulta 2026-11-04)
- Azure Speech, preços (via pesquisa): https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services
- Vozes pt-PT Azure: https://json2video.com/ai-voices/azure/languages/portuguese/ · https://techcommunity.microsoft.com/t5/azure-ai/azure-neural-text-to-speech-updates-51-new-voices-added-to-the/ba-p/1988418
- Google Cloud TTS, preços: https://cloud.google.com/text-to-speech/pricing · vozes: https://docs.cloud.google.com/text-to-speech/docs/voices
- Gemini API, limites: https://ai.google.dev/gemini-api/docs/rate-limits · https://ai.google.dev/gemini-api/docs/pricing
- ElevenLabs (secundárias): https://dupple.com/learn/is-elevenlabs-free · https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/
- Piper pt_PT: https://huggingface.co/rhasspy/piper-voices/commits/v1.0.0/pt/pt_PT
- Pixabay FAQ: https://pixabay.com/service/faq/
- CapCut (secundárias): https://autoae.online/blog/is-capcut-free-for-commercial-use
