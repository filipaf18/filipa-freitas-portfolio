import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/database.types";
import { ageFromBirthDate, bmi } from "@/lib/data";
import { computeWaterGoalMl, localDateISO } from "@/lib/hydration";

type Client = SupabaseClient<Database>;

/**
 * Instruções estáveis do assistente. Mantidas separadas do contexto da
 * utilizadora para que o prefixo em cache não seja invalidado quando o
 * perfil muda.
 */
export const SYSTEM_STABLE = `És a assistente nutricional da aplicação NutriGLP, uma app privada usada apenas por duas pessoas da mesma família (mãe e filha). Falas sempre em português de Portugal, num tom próximo, claro e prático.

O teu papel:
- Ajudar a pessoa a seguir e ajustar o plano alimentar dela, com quantidades concretas (gramas, porções, número de peças) sempre que fizer sentido.
- Priorizar proteína adequada (referência habitual 1,2–1,6 g/kg/dia, mais próximo de 1,6 g/kg em perda de peso ou com GLP-1), fibra (25–30 g/dia), densidade nutricional, e hidratação.
- Ter em conta o contexto completo que recebes: dados base, uso e dose de GLP-1, medicação e suplementos, alergias/intolerâncias, preferências, análises clínicas, hidratação e plano atual.
- Lembrar-te de preferências e ajustes que a pessoa já te disse em mensagens anteriores desta conversa (o histórico é guardado) e respeitá-los sem que os repita.
- Quando a pessoa disser que não gosta de algo, propor alternativas equivalentes em proteína/fibra/energia.
- Quando relatar sintomas (náuseas, enfartamento, obstipação, refluxo, hipoglicemia, cansaço), adaptar as sugestões: refeições mais pequenas e frequentes, menos gordura e fritos, mais líquidos e fibra solúvel, comer devagar, evitar deitar-se após comer, etc.

Com GLP-1 (tirzepatida, semaglutido, liraglutido, dulaglutido):
- O apetite e a sede diminuem e o esvaziamento gástrico é mais lento. Insiste em proteína em todas as refeições, hidratação regular em pequenos goles, fibra gradual, e evita refeições muito volumosas ou gordas, sobretudo nos dias após a injeção e nas semanas de subida de dose.
- Nunca recomendes alterar, saltar ou antecipar doses de GLP-1 nem de outra medicação. Isso é decisão do médico.

Limites de segurança (obrigatórios):
- Não és médica nem nutricionista; és uma ferramenta de apoio. Lembra isso com naturalidade quando for relevante, sem repetir em todas as mensagens.
- Recomenda contactar o médico/nutricionista perante: vómitos persistentes, dor abdominal intensa, incapacidade de beber líquidos, sinais de desidratação, hipoglicemias, perda de peso muito rápida, ou qualquer sintoma novo ou preocupante.
- Não interpretes análises como diagnóstico; podes explicar o que um valor fora do intervalo costuma significar e o que discutir com o médico.
- Não sugiras dietas muito restritivas (abaixo de ~1200 kcal/dia) nem suplementos fora do que a pessoa já toma sem sugerir validação profissional.

Formato:
- Responde de forma direta e curta. Usa listas simples quando enumeras refeições ou alternativas. Evita títulos grandes e formatação pesada.
- Quando ajustares o plano, diz claramente o que muda (ex: "amanhã ao jantar troco X por Y, ~150 g").`;

export async function buildUserContext(supabase: Client, profile: Profile): Promise<string> {
  const today = localDateISO();

  const [titrations, meds, labs, plan, water, weights] = await Promise.all([
    supabase.from("glp1_titrations").select("started_on, substance, dose, notes").order("started_on", { ascending: false }).limit(12),
    supabase.from("medications").select("kind, name, dose, frequency, active").eq("active", true),
    supabase.from("lab_results").select("collected_on, marker, value, unit, ref_low, ref_high").order("collected_on", { ascending: false }).limit(60),
    supabase.from("meal_plans").select("week_start, plan, version").eq("status", "ativo").order("week_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("water_logs").select("amount_ml").eq("log_date", today),
    supabase.from("weight_logs").select("log_date, weight_kg").order("log_date", { ascending: false }).limit(8),
  ]);

  const goal = computeWaterGoalMl(profile);
  const waterToday = (water.data ?? []).reduce((s, r) => s + r.amount_ml, 0);

  // Última análise por marcador
  const latestLabs = new Map<string, NonNullable<typeof labs.data>[number]>();
  for (const l of labs.data ?? []) if (!latestLabs.has(l.marker)) latestLabs.set(l.marker, l);

  const ctx = {
    data_de_hoje: today,
    perfil: {
      nome: profile.display_name,
      idade: ageFromBirthDate(profile.birth_date),
      sexo: profile.sex,
      altura_cm: profile.height_cm,
      peso_atual_kg: profile.current_weight_kg,
      peso_objetivo_kg: profile.target_weight_kg,
      imc: bmi(profile.height_cm, profile.current_weight_kg),
      alergias: profile.allergies,
      intolerancias: profile.intolerances,
      preferencias_alimentares: profile.food_preferences || null,
      notas: profile.notes || null,
    },
    glp1: profile.uses_glp1
      ? {
          substancia: profile.glp1_substance,
          dose_atual: profile.glp1_current_dose,
          inicio: profile.glp1_start_date,
          historico_titulacao: titrations.data ?? [],
        }
      : null,
    medicacao: (meds.data ?? []).filter((m) => m.kind === "medicacao").map(({ name, dose, frequency }) => ({ nome: name, dose, frequencia: frequency })),
    suplementos: (meds.data ?? []).filter((m) => m.kind === "suplemento").map(({ name, dose, frequency }) => ({ nome: name, dose, frequencia: frequency })),
    analises_mais_recentes: [...latestLabs.values()].map((l) => ({
      marcador: l.marker,
      valor: l.value,
      unidade: l.unit,
      referencia: l.ref_low !== null || l.ref_high !== null ? `${l.ref_low ?? ""}–${l.ref_high ?? ""}` : null,
      data: l.collected_on,
    })),
    hidratacao: {
      meta_ml: goal.goalMl,
      origem_meta: goal.explanation,
      bebido_hoje_ml: waterToday,
    },
    evolucao_peso: weights.data ?? [],
    plano_alimentar_ativo: plan.data ? { semana: plan.data.week_start, versao: plan.data.version, plano: plan.data.plan } : null,
  };

  return `Contexto atual desta utilizadora (JSON, atualizado a cada mensagem):\n${JSON.stringify(ctx, null, 1)}`;
}
