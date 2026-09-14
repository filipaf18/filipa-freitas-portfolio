import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data";
import { Chat } from "./Chat";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getOrCreateProfile(supabase, user!.id, user!.email);

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Chat de ajuste</h1>
        <p className="text-sm text-muted">
          Conversa privada, ligada ao teu perfil. O histórico fica guardado para que o assistente se lembre das tuas preferências.
        </p>
      </div>
      <Chat initial={messages ?? []} displayName={profile.display_name || "!"} />
    </div>
  );
}
