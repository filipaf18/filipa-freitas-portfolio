"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Apaga todo o histórico de conversa da utilizadora autenticada. */
export async function clearChat() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("chat_messages").delete().eq("user_id", user.id);
  revalidatePath("/app/chat");
  revalidatePath("/app");
}
