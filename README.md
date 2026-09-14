# NutriGLP

Aplicação web privada (2 utilizadoras: mãe e filha) para acompanhamento nutricional,
com ou sem tratamento com GLP-1 (ex.: Mounjaro/tirzepatida).

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · API da Anthropic (chat) · Tailwind · Recharts.

> ⚠️ Esta app é uma ferramenta de apoio pessoal e **não substitui** acompanhamento médico ou
> nutricional profissional, sobretudo em mudanças de dose de GLP-1 ou sintomas novos.

## Versão sem custos: Artifact no claude.ai

A versão em uso está em [`artifact/nutriglp.html`](artifact/nutriglp.html), publicada como
Artifact no claude.ai (base de dados da artifact + chat via a capacidade `sample`). Não precisa
de Supabase, Vercel nem chave de API. Inclui perfis, hidratação com horário, análises, tensão
arterial, leitura de documentos (fotos/PDF) pelo chat, plano semanal e ajustes pelo chat.
Para republicar depois de editar o ficheiro, publica-o de novo para o mesmo URL a partir do
Claude Code.

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
