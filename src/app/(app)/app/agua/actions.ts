"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function addWater(amountMl: number, logDate: string) {
  const amount = Math.round(Number(amountMl));
  if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
    return { error: "Quantidade inválida (1–5000 ml)." };
  }
  if (!DATE_RE.test(logDate)) return { error: "Data inválida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("water_logs")
    .insert({ user_id: user.id, amount_ml: amount, log_date: logDate });
  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/agua");
  return {};
}

export async function deleteWater(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("water_logs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/app");
  revalidatePath("/app/agua");
  return {};
}
