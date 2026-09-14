-- ============================================================================
-- NutriGLP — esquema inicial
-- Aplicação pessoal/familiar de acompanhamento nutricional (2 utilizadoras).
-- Todas as tabelas de dados têm user_id -> auth.users e RLS "só a própria".
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.sex_t as enum ('feminino', 'masculino', 'outro');
create type public.med_kind_t as enum ('medicacao', 'suplemento');
create type public.chat_role_t as enum ('user', 'assistant');
create type public.plan_status_t as enum ('ativo', 'arquivado', 'rascunho');

-- ---------------------------------------------------------------------------
-- 1. profiles — 1 linha por utilizadora (id = auth.users.id)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text not null default '',
  birth_date         date,
  sex                public.sex_t,
  height_cm          numeric(5,1) check (height_cm is null or height_cm between 100 and 250),
  current_weight_kg  numeric(5,1) check (current_weight_kg is null or current_weight_kg between 25 and 350),
  target_weight_kg   numeric(5,1) check (target_weight_kg is null or target_weight_kg between 25 and 350),
  -- GLP-1
  uses_glp1          boolean not null default false,
  glp1_substance     text,                 -- ex: tirzepatida (Mounjaro), semaglutido (Ozempic/Wegovy)
  glp1_current_dose  text,                 -- ex: "5 mg / semana"
  glp1_start_date    date,
  -- alimentação
  allergies          text[] not null default '{}',
  intolerances       text[] not null default '{}',
  food_preferences   text not null default '', -- texto livre: gostos, não gostos, restrições
  -- hidratação (null => calculada automaticamente a partir do peso + GLP-1)
  water_goal_ml      integer check (water_goal_ml is null or water_goal_ml between 500 and 6000),
  notes              text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. glp1_titrations — histórico de titulação (data + dose)
-- ---------------------------------------------------------------------------
create table public.glp1_titrations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  started_on  date not null,
  substance   text not null,
  dose        text not null,               -- ex: "2.5 mg"
  notes       text not null default '',
  created_at  timestamptz not null default now()
);
create index on public.glp1_titrations (user_id, started_on desc);

-- ---------------------------------------------------------------------------
-- 3. medications — medicação concomitante e suplementação
-- ---------------------------------------------------------------------------
create table public.medications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        public.med_kind_t not null,
  name        text not null,
  dose        text not null default '',
  frequency   text not null default '',    -- ex: "1x/dia ao jantar"
  active      boolean not null default true,
  notes       text not null default '',
  created_at  timestamptz not null default now()
);
create index on public.medications (user_id, active);

-- ---------------------------------------------------------------------------
-- 4. lab_results — análises clínicas (1 linha por marcador por data,
--    facilita gráficos por marcador)
-- ---------------------------------------------------------------------------
create table public.lab_results (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  collected_on   date not null,
  marker         text not null,            -- ex: glicemia_jejum, hba1c, creatinina, egfr, alt, ast, ggt,
                                           --     colesterol_total, ldl, hdl, trigliceridos, b12, ferritina, ferro, tsh, vit_d
  value          numeric(10,3) not null,
  unit           text not null default '', -- ex: mg/dL, %, U/L, ng/mL
  ref_low        numeric(10,3),
  ref_high       numeric(10,3),
  notes          text not null default '',
  created_at     timestamptz not null default now()
);
create index on public.lab_results (user_id, marker, collected_on desc);

-- ---------------------------------------------------------------------------
-- 5. water_logs — registo de água (vários registos por dia)
-- ---------------------------------------------------------------------------
create table public.water_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  log_date    date not null,               -- data local da utilizadora
  amount_ml   integer not null check (amount_ml between 1 and 5000),
  logged_at   timestamptz not null default now()
);
create index on public.water_logs (user_id, log_date desc);

-- ---------------------------------------------------------------------------
-- 6. weight_logs — evolução do peso (o peso atual do perfil é o mais recente)
-- ---------------------------------------------------------------------------
create table public.weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  log_date    date not null,
  weight_kg   numeric(5,1) not null check (weight_kg between 25 and 350),
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ---------------------------------------------------------------------------
-- 7. meal_plans — plano alimentar semanal (JSON estruturado)
--    plan = { days: [{ day: 'segunda', meals: [{ name, time, items: [{ food, grams, notes }], kcal, protein_g, fiber_g }] }],
--             daily_targets: { kcal, protein_g, fiber_g, water_ml }, rationale }
-- ---------------------------------------------------------------------------
create table public.meal_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  week_start    date not null,
  status        public.plan_status_t not null default 'ativo',
  plan          jsonb not null,
  context_used  jsonb not null default '{}'::jsonb,  -- snapshot do perfil/dose/análises usados na geração
  version       integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.meal_plans (user_id, status, week_start desc);

-- ---------------------------------------------------------------------------
-- 8. chat_messages — histórico de conversa com o assistente
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.chat_role_t not null,
  content     text not null,
  meta        jsonb not null default '{}'::jsonb,   -- ex: modelo, tokens, plano alterado
  created_at  timestamptz not null default now()
);
create index on public.chat_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Perfil criado automaticamente quando a utilizadora é criada no Auth
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger meal_plans_touch before update on public.meal_plans for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — isolamento total entre as duas utilizadoras
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.glp1_titrations enable row level security;
alter table public.medications     enable row level security;
alter table public.lab_results     enable row level security;
alter table public.water_logs      enable row level security;
alter table public.weight_logs     enable row level security;
alter table public.meal_plans      enable row level security;
alter table public.chat_messages   enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own rows" on public.glp1_titrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.medications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.lab_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
