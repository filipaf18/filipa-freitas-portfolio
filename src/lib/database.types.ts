/**
 * Tipos da base de dados (espelham supabase/migrations/0001_init.sql).
 * Podem ser regenerados com `supabase gen types typescript`, mas mantêm-se
 * aqui à mão para não obrigar a ter a CLI instalada.
 */

export type Sex = "feminino" | "masculino" | "outro";
export type MedKind = "medicacao" | "suplemento";
export type ChatRole = "user" | "assistant";
export type PlanStatus = "ativo" | "arquivado" | "rascunho";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = {
  id: string;
  display_name: string;
  birth_date: string | null;
  sex: Sex | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  uses_glp1: boolean;
  glp1_substance: string | null;
  glp1_current_dose: string | null;
  glp1_start_date: string | null;
  allergies: string[];
  intolerances: string[];
  food_preferences: string;
  water_goal_ml: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type Glp1Titration = {
  id: string;
  user_id: string;
  started_on: string;
  substance: string;
  dose: string;
  notes: string;
  created_at: string;
}

export type Medication = {
  id: string;
  user_id: string;
  kind: MedKind;
  name: string;
  dose: string;
  frequency: string;
  active: boolean;
  notes: string;
  created_at: string;
}

export type LabResult = {
  id: string;
  user_id: string;
  collected_on: string;
  marker: string;
  value: number;
  unit: string;
  ref_low: number | null;
  ref_high: number | null;
  notes: string;
  created_at: string;
}

export type WaterLog = {
  id: string;
  user_id: string;
  log_date: string;
  amount_ml: number;
  logged_at: string;
}

export type WeightLog = {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number;
  notes: string;
  created_at: string;
}

export type MealPlan = {
  id: string;
  user_id: string;
  week_start: string;
  status: PlanStatus;
  plan: Json;
  context_used: Json;
  version: number;
  created_at: string;
  updated_at: string;
}

export type ChatMessage = {
  id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  meta: Json;
  created_at: string;
}

type Insert<T extends { id: string }, Optional extends keyof T = never> = Omit<
  T,
  "id" | Extract<"created_at" | "updated_at", keyof T> | Optional
> &
  Partial<Pick<T, "id" | Optional>>;

type Table<Row, Ins = Partial<Row>, Upd = Partial<Row>> = {
  Row: Row;
  Insert: Ins;
  Update: Upd;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string }>;
      glp1_titrations: Table<Glp1Titration, Insert<Glp1Titration, "notes" | "user_id">>;
      medications: Table<Medication, Insert<Medication, "dose" | "frequency" | "active" | "notes" | "user_id">>;
      lab_results: Table<LabResult, Insert<LabResult, "unit" | "ref_low" | "ref_high" | "notes" | "user_id">>;
      water_logs: Table<WaterLog, Insert<WaterLog, "logged_at" | "user_id">>;
      weight_logs: Table<WeightLog, Insert<WeightLog, "notes" | "user_id">>;
      meal_plans: Table<MealPlan, Insert<MealPlan, "status" | "context_used" | "version" | "user_id">>;
      chat_messages: Table<ChatMessage, Insert<ChatMessage, "meta" | "user_id">>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      sex_t: Sex;
      med_kind_t: MedKind;
      chat_role_t: ChatRole;
      plan_status_t: PlanStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
