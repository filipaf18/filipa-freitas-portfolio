import type { Profile } from "@/lib/database.types";

/**
 * Meta diária de água.
 *
 * Base: ~33 ml por kg de peso corporal (intervalo habitual 30–35 ml/kg).
 * GLP-1: os agonistas GLP-1 reduzem a sensação de sede e atrasam o
 * esvaziamento gástrico, o que aumenta o risco de desidratação e obstipação.
 * Por isso, com GLP-1 a meta sobe ~15 % e nunca fica abaixo de 2000 ml.
 * A meta é arredondada a 50 ml e limitada a 1500–3500 ml.
 * Se o perfil tiver `water_goal_ml` definido, esse valor prevalece.
 */
export function computeWaterGoalMl(
  profile: Pick<Profile, "current_weight_kg" | "uses_glp1" | "water_goal_ml">,
): { goalMl: number; source: "manual" | "calculada"; explanation: string } {
  if (profile.water_goal_ml) {
    return {
      goalMl: profile.water_goal_ml,
      source: "manual",
      explanation: "Meta definida manualmente no perfil.",
    };
  }

  const weight = profile.current_weight_kg ?? 60;
  let goal = weight * 33;
  const parts = [`${weight} kg × 33 ml`];

  if (profile.uses_glp1) {
    goal = Math.max(goal * 1.15, 2000);
    parts.push("+15 % por GLP-1 (mín. 2000 ml)");
  }

  goal = Math.min(3500, Math.max(1500, goal));
  goal = Math.round(goal / 50) * 50;

  return {
    goalMl: goal,
    source: "calculada",
    explanation: parts.join(" "),
  };
}

/** Data local (YYYY-MM-DD) no fuso do browser/servidor. */
export function localDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return localDateISO(dt);
}
