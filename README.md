# NutriGLP

Aplicação web privada (2 utilizadoras: mãe e filha) para acompanhamento nutricional,
com ou sem tratamento com GLP-1 (ex.: Mounjaro/tirzepatida).

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · API da Anthropic (chat) · Tailwind · Recharts.

> ⚠️ Esta app é uma ferramenta de apoio pessoal e **não substitui** acompanhamento médico ou
> nutricional profissional, sobretudo em mudanças de dose de GLP-1 ou sintomas novos.

## Versão sem custos: Artifact no claude.ai

A versão em uso está em [`artifact/`](artifact/), publicada como Artifact no claude.ai
(base de dados da artifact + chat via a capacidade `sample`). Não precisa de Supabase, Vercel
nem chave de API.

- `nutriglp.html` — a página (fragmento; o claude.ai acrescenta o `<head>`).
- `styles.css` — tokens de cor (claro/escuro) e componentes.
- `foods.js` — tabela de ~170 alimentos portugueses (kcal, proteína, hidratos, gordura, fibra por 100 g e medidas caseiras) usada para calcular os macros na página.
- `app.js` — toda a lógica: quatro perfis (Filipa, Mãe, Pai, Vitória), Hoje (próxima refeição, adesão, sintomas, alarmes, ciclo da injeção, revisão semanal), Registar (água, corpo, tensão, análises, documentos), Plano (refeições primeiro, metas com "Porquê estes números?", secções fechadas; geração com as refeições em família primeiro; refazer um dia, trocar uma refeição, 👍/👎; lista de compras da casa), Chat (ferramentas para regras, tensão, extras e alterações ao plano; memória destilada de 12 em 12 mensagens) e Perfil.

Cada perfil tem um objetivo (perder peso, manter e comer equilibrado, ganhar massa) que muda só a
energia: a proteína, a fibra e o equilíbrio do prato mantêm-se.

**Energia calculada pessoa a pessoa** (`energyModel` em `app.js`, mostrado no Perfil e em "Porquê estes
números?"): metabolismo basal por Katch-McArdle quando há massa magra medida no registo corporal,
senão Mifflin-St Jeor (peso, altura, idade, sexo); fator de atividade do perfil; ajustes pelas análises
da tiroide (TSH, T4 livre), pela perda já feita (adaptação) e pela idade; défice conforme os quilos a
perder, a idade, o GLP-1 e a massa gorda, nunca acima de 25 % do gasto nem abaixo do metabolismo basal
ou do piso (1200/1500 kcal). As análises fora da referência viram instruções para o prato
(`labFlags`): glicemia, lípidos, ferro, vitamina D, B12, rins (com limite de proteína), ácido úrico,
fígado, tiroide, potássio, sódio, albumina, PCR, magnésio. O assistente recebe tudo já calculado e não
recalcula.

**Cruzamentos** (setembro de 2026, com investigação de evidência): as análises avaliam-se pela referência
clínica do marcador, ajustada ao sexo, e não pelas faixas estreitas de alguns laboratórios (a do relatório
fica visível ao lado); registos antigos guardados como "outro" passam a ser reconhecidos pelo nome
(fibrinogénio, homocisteína, AMH, cortisol, zinco, selénio, androgénios, anticorpos da tiroide). As
condições de saúde escolhem-se no perfil ou leem-se das notas e dos relatórios (hipertensão por MAPA,
traumatismo craniano, amenorreia). Os suplementos cruzam-se com as análises (ashwagandha e tiroide,
magnésio acima de 350 mg, biotina e análises à tiroide, ferro com ferritina alta, creatina e TFG).
A bioimpedância implausível fica fora do cálculo de energia. Cada perfil recebe regras para o prato e
uma lista "para falar com o médico"; as refeições em família recebem as regras da mesa (o que ajuda
quem precisa e não faz mal a ninguém) e os reforços por pessoa. A leitura de PDFs faz correspondência
por palavra inteira e por unidade, e encaminha composição corporal para Corpo.

**Horário das refeições.** Cada perfil tem o seu (Perfil → Horário das refeições), lido também das
notas ("pequeno almoço: 10 da manhã", "jantar 20h-21h"). O plano gera-se só com essas refeições e essas
horas; ao guardar o perfil, o plano atual passa para o horário (uma refeição sem lugar funde os itens na
mais próxima, sem perder energia), e o Plano avisa quando não está no horário. O jantar em família fica à
hora mais comum da mesa; a marmita à hora de cada um. No chat, "amanhã tomo o pequeno-almoço às 7" muda
só esse dia (ferramenta `ajustar_horario`); numa refeição em família a hora muda para todos.

**Hoje, adesão e receitas.** Em cada refeição do dia: Comi, Comi parte (escolhe-se os itens), Comi outra
coisa, Saltei. "Já comeste hoje" mostra energia, proteína, hidratos, gordura e fibra do que entrou
(refeições comidas, itens comidos em parte e extras), contado pela tabela de alimentos, com um traço onde se
fica seguindo o resto do plano. Cada refeição tem Receita: escolhe-se para quem se cozinha (só para mim, ou
também para outros da casa) e as quantidades somam-se pessoa a pessoa, com a repartição por prato, para não
sobrar: a porção de cada um vem da refeição em família, do plano dessa pessoa se tiver o mesmo prato nesse
dia, ou é ajustada às metas dela (proteína pela proteína alvo, o resto pela energia alvo, sem o que não come).
Além de 👍/👎, uma nota livre por refeição (porção, tempero, trocas) fica em `prefs` com `voto: 0` e entra
nos próximos planos, nas trocas e no chat.

**Falhas a meio da geração.** Cada pedido que falhe com `upstream_error` (o serviço caiu) é repetido uma
vez passados 4 s. A geração guarda rascunhos em memória (estrutura, blocos de dias, ementa e quantidades em
família) e, se falhar mesmo assim, o próximo "Gerar" continua de onde ficou, sem repetir os pedidos já feitos.

**"Hoje ao almoço vou fazer X."** No chat, dizer o que se vai comer (ou pedir quantidades para um prato
escolhido) chama a ferramenta `fixar_refeicao`: a refeição entra no plano desse dia com as quantidades
calculadas (marcada `propria`, para o jantar em família não a sobrepor) e, no fim da resposta, a app faz
um pedido curto que reequilibra as refeições ainda por comer desse dia (as já marcadas "Comi" e a fixada
não mudam; numa refeição em família muda só a porção desta pessoa). O chat conta o que mudou e a refeição
fica em Hoje para marcar "Comi".

**Hoje conta o que entrou de facto.** "Comi outra coisa" com texto é estimado por um pedido rápido
(itens e macros ficam na adesão, marcados `estimado`) e conta nos medidores; por baixo diz o que falta
para a meta do dia e, quando o dia se desviou do plano (outra coisa, parte, saltei, extras), há o botão
"Ajustar o resto do dia ao que já comi", que refaz só as refeições por comer com o que realmente entrou.

**Rede de segurança do chat.** Se a assistente responder só em texto sem usar as ferramentas, a app faz um
pedido curto que extrai o que ela afirmou ter decidido (refeição com quantidades, regra, extra, tensão) e
aplica-o com as mesmas funções; o chat mostra "✅ Guardei na app: …". O diagnóstico indica que ferramentas
foram usadas na última resposta.

**Refeições em família.** Não há um plano de família à parte: ao gerar o plano de uma pessoa, os
jantares e almoços (em marmita) saem primeiro, iguais para toda a gente que come em família, e
entram no plano individual de cada um com as suas quantidades e sem o que cada pessoa não come.
Cada uma dessas refeições mostra "Na mesa": só as diferenças dos outros, para quem cozinha. Trocar,
editar à mão, refazer o dia ou alterar pelo chat uma refeição em família muda-a para todos (quem já
tinha o alimento mantém a sua quantidade; um alimento novo entra proporcional às metas de cada um).
A origem fica em `family/plan`; o plano individual é sempre a superfície.
O botão "Refazer tudo para a família" (no Plano) refaz de uma vez as refeições em família e o plano
de cada uma das quatro pessoas, cada um com os seus próprios dados (análises, condições, horário,
regras, preferências e metas de energia), e no fim a lista de compras; as versões anteriores ficam
guardadas e, se o plano de alguém falhar, os outros ficam feitos e esse pode ser gerado no perfil.
Os pedidos são dimensionados para a resposta caber: as quantidades em família vão em blocos de dias
mais pequenos quanto mais pessoas houver à mesa, o plano individual não volta a escrever as refeições
em família (já fixadas) e, se ainda assim uma resposta vier cortada, o bloco é pedido em duas metades.

**Lista de compras.** Uma só para a casa: a página soma o que está nos planos de todos (as refeições
em família contam por pessoa, que é o que vai ao lume) e um pedido rápido converte a soma em
ingredientes e unidades de compra, por corredor, com a despensa à parte. Fica em `shopping/<semana>`
com as caixas marcadas partilhadas, e avisa quando os planos mudaram.
- `tests/` — testes automáticos com Playwright contra uma base de dados falsa (com snapshots congelados, como no claude.ai) e respostas falsas do Claude: `cd artifact/tests && npm install && npm test` (ou `node run.mjs t08` para um só).

Coleções na base de dados (uma por perfil, `<coleção>/<perfil>`): `profiles`, `water` (`water/<perfil>_<data>`),
`chat`, `weights`, `labs`, `vitals`, `docs`, `rules`, `body`, `plans`, `adherence`, `symptoms`,
`reviews`, `prefs`, `diag`, e as coleções partilhadas `family` (documento `family/plan`) e `shopping` (`shopping/<semana>`). As alterações são sempre aditivas: nunca se muda a forma dos campos existentes.

Para republicar depois de editar, publica `artifact/nutriglp.html` para o mesmo URL a partir do
Claude Code, com `styles.css`, `app.js` e `foods.js` como ficheiros de apoio.

A versão Next.js + Supabase abaixo fica como alternativa com logins separados.

## Estado atual (MVP Next.js)

| Funcionalidade | Estado |
| --- | --- |
| Login simples (2 contas fixas, sem registo público) | ✅ |
| Isolamento total entre utilizadoras (RLS no Postgres) | ✅ |
| Perfil: dados base, GLP-1 (substância, dose, histórico de titulação), medicação, suplementos, alergias/intolerâncias/preferências | ✅ |
| Hidratação: registo diário, meta automática (peso + GLP-1) ou manual, gráfico 7/30 dias | ✅ |
| Chat de ajuste ligado ao perfil, com histórico persistente e streaming | ✅ |
| Aviso visível em todas as páginas | ✅ |
| Análises clínicas (tabela criada; UI e gráficos) | 🔜 |
| Plano alimentar semanal gerado (tabela criada; geração + edição pelo chat) | 🔜 |

## Esquema da base de dados

Ficheiro: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

```
auth.users (Supabase Auth)
 └─ profiles            1:1  dados base, GLP-1 (sim/não, substância, dose atual), alergias,
 │                           intolerâncias, preferências, meta de água manual (opcional)
 ├─ glp1_titrations     1:N  histórico de titulação (data, substância, dose)
 ├─ medications         1:N  medicação concomitante e suplementos (kind = medicacao | suplemento)
 ├─ lab_results         1:N  análises: 1 linha por marcador por data (glicemia, HbA1c, creatinina,
 │                           lípidos, B12, ferritina…) — pronto para gráficos por marcador
 ├─ water_logs          1:N  registos de água (vários por dia, com data local)
 ├─ weight_logs         1:N  evolução do peso (1 por dia; atualizado ao guardar o perfil)
 ├─ meal_plans          1:N  plano semanal em JSON + snapshot do contexto usado na geração
 └─ chat_messages       1:N  histórico do chat (role, content, meta com modelo/tokens)
```

- Todas as tabelas têm `user_id → auth.users` e políticas RLS `auth.uid() = user_id`
  (na `profiles`, `auth.uid() = id`). Uma utilizadora nunca vê dados da outra.
- Um trigger cria o `profile` automaticamente quando a conta é criada no Auth.

## Setup

### 1. Supabase

1. Cria um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, cola e corre o conteúdo de `supabase/migrations/0001_init.sql`
   (ou `supabase db push` se usares a CLI).
3. Em **Authentication → Providers → Email**, desliga *"Allow new users to sign up"*
   (só nós as duas).
4. Copia `Project URL` e `anon key` (Project Settings → API).

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preenche `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
e, para criar as contas, `SUPABASE_SERVICE_ROLE_KEY` + `APP_USERS`.

### 3. Criar as duas contas

```bash
node --env-file=.env.local scripts/create-users.mjs
```

(Ou manualmente em Authentication → Users → *Add user*, com *Auto Confirm User*.)

### 4. Correr

```bash
npm install
npm run dev
```

Abre http://localhost:3000 e entra com uma das contas.

## Chat

- Rota: `src/app/api/chat/route.ts` (streaming de texto para o browser).
- Modelo por omissão `claude-opus-5` (muda com `ANTHROPIC_MODEL`), *adaptive thinking*,
  esforço `medium`, prompt de sistema estável em cache.
- Em cada mensagem o assistente recebe o contexto completo da utilizadora
  (`src/lib/chat-context.ts`): perfil, GLP-1 e titulação, medicação, suplementos,
  análises mais recentes, hidratação de hoje, evolução do peso e plano ativo.
- As últimas 60 mensagens são enviadas como histórico, para que "se lembre" de
  preferências e ajustes anteriores.
- Fallback automático de modelo em caso de recusa por política (`fallbacks: "default"`).

## Meta de água

`src/lib/hydration.ts`: ~33 ml/kg de peso; com GLP-1 +15 % e nunca abaixo de 2000 ml
(menor sensação de sede, risco de desidratação/obstipação); limitada a 1500–3500 ml.
Pode ser substituída por um valor manual no perfil.

## Próximos passos

1. Página de **análises** com registo por marcador e gráficos de evolução.
2. **Geração do plano semanal** (JSON estruturado com gramas/porções) a partir do contexto,
   e ferramenta no chat para o assistente **atualizar o plano** ("hoje tive náuseas, ajusta amanhã").
3. Registo rápido de peso e gráfico de evolução.
