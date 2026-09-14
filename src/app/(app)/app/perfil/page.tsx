import { createClient } from "@/lib/supabase/server";
import { ageFromBirthDate, bmi, getOrCreateProfile } from "@/lib/data";
import { computeWaterGoalMl } from "@/lib/hydration";
import { ProfileForm } from "./ProfileForm";
import { MedicationList, TitrationList } from "./Lists";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getOrCreateProfile(supabase, user!.id, user!.email);

  const [{ data: titrations }, { data: meds }] = await Promise.all([
    supabase.from("glp1_titrations").select("*").order("started_on", { ascending: false }),
    supabase.from("medications").select("*").order("created_at", { ascending: true }),
  ]);

  const age = ageFromBirthDate(profile.birth_date);
  const imc = bmi(profile.height_cm, profile.current_weight_kg);
  const goal = computeWaterGoalMl({ ...profile, water_goal_ml: null });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted">
          {age !== null && `${age} anos · `}
          {imc !== null && `IMC ${imc} · `}
          {profile.current_weight_kg && profile.target_weight_kg
            ? `${profile.current_weight_kg} kg → objetivo ${profile.target_weight_kg} kg`
            : "Completa os dados para veres o resumo."}
        </p>
      </div>

      <ProfileForm profile={profile} computedGoal={goal.goalMl} />
      <TitrationList items={titrations ?? []} />
      <MedicationList items={meds ?? []} />
    </div>
  );
}
