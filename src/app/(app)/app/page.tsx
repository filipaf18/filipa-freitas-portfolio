import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data";
import { computeWaterGoalMl, localDateISO } from "@/lib/hydration";
import { QuickWater } from "./agua/QuickWater";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getOrCreateProfile(supabase, user!.id, user!.email);
  const today = localDateISO();

  const [{ data: waterToday }, { count: chatCount }] = await Promise.all([
    supabase.from("water_logs").select("amount_ml").eq("log_date", today),
    supabase.from("chat_messages").select("id", { count: "exact", head: true }),
  ]);

  const totalToday = (waterToday ?? []).reduce((s, r) => s + r.amount_ml, 0);
  const { goalMl } = computeWaterGoalMl(profile);
  const pct = Math.min(100, Math.round((totalToday / goalMl) * 100));

  const missing: string[] = [];
  if (!profile.current_weight_kg) missing.push("peso atual");
  if (!profile.height_cm) missing.push("altura");
  if (!profile.birth_date) missing.push("data de nascimento");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {profile.display_name || "tu"} 👋</h1>
        <p className="text-sm text-muted">
          {profile.uses_glp1
            ? `Em tratamento com ${profile.glp1_substance ?? "GLP-1"}${
                profile.glp1_current_dose ? ` · ${profile.glp1_current_dose}` : ""
              }`
            : "Sem GLP-1 ativo"}
        </p>
      </div>

      {missing.length > 0 && (
        <div className="card border-accent/40 bg-accent-soft text-sm">
          Para metas e sugestões mais precisas, completa o teu perfil:{" "}
          <strong>{missing.join(", ")}</strong>.{" "}
          <Link href="/app/perfil" className="underline">
            Ir ao perfil
          </Link>
        </div>
      )}

      <section className="card flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Água de hoje</h2>
          <Link href="/app/agua" className="text-sm text-water underline">
            Ver histórico
          </Link>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-water">{totalToday}</span>
            <span className="text-sm text-muted">/ {goalMl} ml</span>
            <span className="ml-auto text-sm text-muted">{pct}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-water-soft">
            <div className="h-full rounded-full bg-water transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <QuickWater date={today} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/app/chat" className="card transition hover:border-accent">
          <h2 className="font-semibold">Chat de ajuste</h2>
          <p className="mt-1 text-sm text-muted">
            Fala com o assistente sobre o teu plano, sintomas ou preferências.
            {chatCount ? ` ${chatCount} mensagens guardadas.` : " Ainda sem conversa."}
          </p>
        </Link>
        <Link href="/app/perfil" className="card transition hover:border-accent">
          <h2 className="font-semibold">Perfil</h2>
          <p className="mt-1 text-sm text-muted">
            Dados base, GLP-1 e titulação, medicação, suplementos e preferências alimentares.
          </p>
        </Link>
      </section>
    </div>
  );
}
