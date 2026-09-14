"use client";

import { useActionState, useState } from "react";
import type { Profile } from "@/lib/database.types";
import { saveProfile, type ActionState } from "./actions";

export function ProfileForm({ profile, computedGoal }: { profile: Profile; computedGoal: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfile, {});
  const [usesGlp1, setUsesGlp1] = useState(profile.uses_glp1);

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="card grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 px-1 font-semibold">Dados base</legend>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="display_name">Nome</label>
          <input id="display_name" name="display_name" defaultValue={profile.display_name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="birth_date">Data de nascimento</label>
          <input id="birth_date" name="birth_date" type="date" defaultValue={profile.birth_date ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="sex">Sexo</label>
          <select id="sex" name="sex" defaultValue={profile.sex ?? ""} className="input">
            <option value="">—</option>
            <option value="feminino">Feminino</option>
            <option value="masculino">Masculino</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="height_cm">Altura (cm)</label>
          <input id="height_cm" name="height_cm" type="number" step="0.5" min={100} max={250} defaultValue={profile.height_cm ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="current_weight_kg">Peso atual (kg)</label>
          <input id="current_weight_kg" name="current_weight_kg" type="number" step="0.1" min={25} max={350} defaultValue={profile.current_weight_kg ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="target_weight_kg">Peso objetivo (kg)</label>
          <input id="target_weight_kg" name="target_weight_kg" type="number" step="0.1" min={25} max={350} defaultValue={profile.target_weight_kg ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="water_goal_ml">Meta de água (ml)</label>
          <input id="water_goal_ml" name="water_goal_ml" type="number" step={50} min={500} max={6000} defaultValue={profile.water_goal_ml ?? ""} placeholder={`auto: ${computedGoal}`} className="input" />
          <p className="mt-1 text-xs text-muted">Deixa vazio para usar a meta calculada (peso + GLP-1).</p>
        </div>
      </fieldset>

      <fieldset className="card grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 px-1 font-semibold">GLP-1</legend>
        <label className="flex items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            name="uses_glp1"
            checked={usesGlp1}
            onChange={(e) => setUsesGlp1(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent)]"
          />
          <span className="text-sm font-medium">Está a usar GLP-1?</span>
        </label>
        {usesGlp1 && (
          <>
            <div>
              <label className="label" htmlFor="glp1_substance">Substância</label>
              <input id="glp1_substance" name="glp1_substance" list="glp1-list" defaultValue={profile.glp1_substance ?? ""} placeholder="tirzepatida (Mounjaro)" className="input" />
              <datalist id="glp1-list">
                <option value="tirzepatida (Mounjaro)" />
                <option value="semaglutido (Ozempic)" />
                <option value="semaglutido (Wegovy)" />
                <option value="liraglutido (Saxenda)" />
                <option value="dulaglutido (Trulicity)" />
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="glp1_current_dose">Dose atual</label>
              <input id="glp1_current_dose" name="glp1_current_dose" defaultValue={profile.glp1_current_dose ?? ""} placeholder="5 mg / semana" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="glp1_start_date">Início do tratamento</label>
              <input id="glp1_start_date" name="glp1_start_date" type="date" defaultValue={profile.glp1_start_date ?? ""} className="input" />
            </div>
            <p className="text-xs text-muted sm:col-span-2">
              O histórico de titulação (datas e doses) regista-se mais abaixo. Ao adicionares uma nova dose, a dose atual atualiza-se automaticamente.
            </p>
          </>
        )}
      </fieldset>

      <fieldset className="card grid gap-4">
        <legend className="mb-2 px-1 font-semibold">Alimentação</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="allergies">Alergias (separadas por vírgula)</label>
            <input id="allergies" name="allergies" defaultValue={profile.allergies.join(", ")} placeholder="amendoim, marisco" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="intolerances">Intolerâncias</label>
            <input id="intolerances" name="intolerances" defaultValue={profile.intolerances.join(", ")} placeholder="lactose, glúten" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="food_preferences">Preferências e restrições</label>
          <textarea id="food_preferences" name="food_preferences" rows={3} defaultValue={profile.food_preferences} placeholder="Não gosto de peixe cozido; prefiro jantares leves; vegetariana às terças…" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="notes">Outras notas</label>
          <textarea id="notes" name="notes" rows={2} defaultValue={profile.notes} placeholder="Horários de trabalho, treino, sintomas frequentes…" className="input" />
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "A guardar…" : "Guardar perfil"}
        </button>
        {state.ok && <span className="text-sm text-accent">Guardado ✓</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
