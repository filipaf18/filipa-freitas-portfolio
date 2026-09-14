import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/data";
import { addDays, computeWaterGoalMl, localDateISO } from "@/lib/hydration";
import { QuickWater } from "./QuickWater";
import { TodayLog } from "./TodayLog";
import { WaterChart, type DayTotal } from "./WaterChart";

export default async function WaterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getOrCreateProfile(supabase, user!.id, user!.email);

  const today = localDateISO();
  const from = addDays(today, -29);

  const { data: logs } = await supabase
    .from("water_logs")
    .select("*")
    .gte("log_date", from)
    .lte("log_date", today)
    .order("logged_at", { ascending: true });

  const totals = new Map<string, number>();
  for (let i = 0; i < 30; i++) totals.set(addDays(from, i), 0);
  for (const l of logs ?? []) totals.set(l.log_date, (totals.get(l.log_date) ?? 0) + l.amount_ml);
  const days: DayTotal[] = [...totals.entries()].map(([date, total]) => ({ date, total }));

  const todayLogs = (logs ?? []).filter((l) => l.log_date === today).reverse();
  const totalToday = todayLogs.reduce((s, l) => s + l.amount_ml, 0);
  const goal = computeWaterGoalMl(profile);
  const pct = Math.min(100, Math.round((totalToday / goal.goalMl) * 100));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hidratação</h1>
        <p className="text-sm text-muted">
          Meta diária <strong className="text-foreground">{goal.goalMl} ml</strong> ({goal.source}: {goal.explanation}).{" "}
          <Link href="/app/perfil" className="underline">
            Ajustar no perfil
          </Link>
        </p>
      </div>

      <section className="card flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-water">{totalToday}</span>
          <span className="text-sm text-muted">/ {goal.goalMl} ml hoje</span>
          <span className="ml-auto text-sm text-muted">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-water-soft">
          <div className="h-full rounded-full bg-water transition-all" style={{ width: `${pct}%` }} />
        </div>
        <QuickWater date={today} />
        <TodayLog logs={todayLogs} />
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Histórico</h2>
        <WaterChart days={days} goalMl={goal.goalMl} />
      </section>

      {profile.uses_glp1 && (
        <p className="text-sm text-muted">
          💡 Com GLP-1 a sensação de sede diminui e a digestão fica mais lenta. Beber em pequenos goles ao longo
          do dia ajuda a prevenir desidratação, obstipação e náuseas.
        </p>
      )}
    </div>
  );
}
