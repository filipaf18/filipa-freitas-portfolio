"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MedKind, Sex } from "@/lib/database.types";

export type ActionState = { error?: string; ok?: boolean };

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}
function list(v: FormDataEntryValue | null): string[] {
  return str(v)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function userClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  return { supabase, user };
}

function refresh() {
  revalidatePath("/app");
  revalidatePath("/app/perfil");
  revalidatePath("/app/agua");
  revalidatePath("/app/chat");
}

export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await userClient();
    const sexRaw = str(formData.get("sex"));
    const sex: Sex | null = sexRaw === "feminino" || sexRaw === "masculino" || sexRaw === "outro" ? sexRaw : null;
    const usesGlp1 = formData.get("uses_glp1") === "on";
    const currentWeight = num(formData.get("current_weight_kg"));

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: str(formData.get("display_name")),
        birth_date: str(formData.get("birth_date")) || null,
        sex,
        height_cm: num(formData.get("height_cm")),
        current_weight_kg: currentWeight,
        target_weight_kg: num(formData.get("target_weight_kg")),
        uses_glp1: usesGlp1,
        glp1_substance: usesGlp1 ? str(formData.get("glp1_substance")) || null : null,
        glp1_current_dose: usesGlp1 ? str(formData.get("glp1_current_dose")) || null : null,
        glp1_start_date: usesGlp1 ? str(formData.get("glp1_start_date")) || null : null,
        allergies: list(formData.get("allergies")),
        intolerances: list(formData.get("intolerances")),
        food_preferences: str(formData.get("food_preferences")),
        water_goal_ml: num(formData.get("water_goal_ml")),
        notes: str(formData.get("notes")),
      })
      .eq("id", user.id);
    if (error) return { error: error.message };

    // Guarda o peso de hoje no histórico (1 por dia).
    if (currentWeight) {
      const today = new Date().toISOString().slice(0, 10);
      await supabase
        .from("weight_logs")
        .upsert({ user_id: user.id, log_date: today, weight_kg: currentWeight }, { onConflict: "user_id,log_date" });
    }

    refresh();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro inesperado." };
  }
}

export async function addTitration(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await userClient();
    const started_on = str(formData.get("started_on"));
    const substance = str(formData.get("substance"));
    const dose = str(formData.get("dose"));
    if (!started_on || !substance || !dose) return { error: "Data, substância e dose são obrigatórias." };

    const { error } = await supabase.from("glp1_titrations").insert({
      user_id: user.id,
      started_on,
      substance,
      dose,
      notes: str(formData.get("notes")),
    });
    if (error) return { error: error.message };

    // A dose mais recente passa a ser a dose atual do perfil.
    await supabase
      .from("profiles")
      .update({ uses_glp1: true, glp1_substance: substance, glp1_current_dose: dose })
      .eq("id", user.id);

    refresh();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro inesperado." };
  }
}

export async function deleteTitration(id: string) {
  const { supabase } = await userClient();
  await supabase.from("glp1_titrations").delete().eq("id", id);
  refresh();
}

export async function addMedication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await userClient();
    const kindRaw = str(formData.get("kind"));
    const kind: MedKind = kindRaw === "suplemento" ? "suplemento" : "medicacao";
    const name = str(formData.get("name"));
    if (!name) return { error: "O nome é obrigatório." };

    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      kind,
      name,
      dose: str(formData.get("dose")),
      frequency: str(formData.get("frequency")),
    });
    if (error) return { error: error.message };
    refresh();
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro inesperado." };
  }
}

export async function toggleMedication(id: string, active: boolean) {
  const { supabase } = await userClient();
  await supabase.from("medications").update({ active }).eq("id", id);
  refresh();
}

export async function deleteMedication(id: string) {
  const { supabase } = await userClient();
  await supabase.from("medications").delete().eq("id", id);
  refresh();
}
