import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

/** Garante que existe perfil (o trigger cria-o, mas por segurança). */
export async function getOrCreateProfile(supabase: Client, userId: string, email?: string | null): Promise<Profile> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (data) return data;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ id: userId, display_name: email?.split("@")[0] ?? "" })
    .select("*")
    .single();
  if (error) throw error;
  return created;
}

export function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function bmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}
