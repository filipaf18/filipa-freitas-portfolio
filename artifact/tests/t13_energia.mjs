import { open, assert, eq } from "./harness.mjs";
/** Energia calculada pessoa a pessoa: método, atividade, análises, perda feita, idade, GLP-1, pisos. */
export default async function () {
  const store = {
    "profiles/filipa": { name: "Filipa", sex: "feminino", birth_date: "2001-01-18", height_cm: 160, weight_kg: 65, target_kg: 58, objetivo: "perder", activity: "pouco_ativa", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/mae": { name: "Mãe", sex: "feminino", birth_date: "1970-05-02", height_cm: 165, weight_kg: 78.7, target_kg: 65, objetivo: "perder", activity: "sedentaria", uses_glp1: true, glp1_dose: "2.5 mg", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/pai": { name: "Pai", sex: "masculino", birth_date: "1968-03-10", height_cm: 180, weight_kg: 77.1, objetivo: "manter", activity: "pouco_ativa", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/vitoria": { name: "Vitória", sex: "feminino", birth_date: "2005-07-21", height_cm: 168, weight_kg: 60, objetivo: "manter", activity: "ativa", allergies: [], intolerances: [], dislikes: ["legumes"], meds: [], titrations: [] },
    "labs/mae": { profile: "mae", entries: [
      { id: "l1", date: "2026-08-03", marker: "tsh", label: "TSH", value: 5.2, unit: "mUI/L", lo: 0.4, hi: 4.0 },
      { id: "l2", date: "2026-08-03", marker: "egfr", label: "TFG", value: 55, unit: "mL/min", lo: 60, hi: null },
      { id: "l3", date: "2026-08-03", marker: "ldl", label: "LDL", value: 150, unit: "mg/dL", lo: null, hi: 115 }] },
    "body/mae": { profile: "mae", entries: [{ id: "b1", date: "2026-09-10", weight_kg: 78.7, fat_pct: 40 }] },
  };
  const app = await open({ store });
  const { page } = app;
  try {
    const T = await page.evaluate(() => Object.fromEntries(["filipa", "mae", "pai", "vitoria"].map((id) => [id, window.NG_TEST.planTargets(window.__store[`profiles/${id}`], id)])));
    // Filipa: Mifflin 1364 × 1,45 = 1980; 7 kg para perder → défice 400 → 1580
    eq(T.filipa.energia.metodo_basal, "Mifflin-St Jeor", "sem composição corporal usa Mifflin");
    eq(T.filipa.energia.metabolismo_basal_kcal, 1364, "metabolismo basal da Filipa");
    eq(T.filipa.energia.gasto_manutencao_kcal, 1980, "manutenção da Filipa");
    eq(T.filipa.energia.defice_kcal, 400, "défice conforme o que há para perder");
    eq(T.filipa.energia_alvo_kcal, 1580, "alvo da Filipa");
    assert(T.filipa.ritmo_de_perda_alvo.startsWith("0,36 kg"), "ritmo esperado: " + T.filipa.ritmo_de_perda_alvo);
    // Mãe: Katch-McArdle sobre 47,2 kg de massa magra; TSH alto −5 %; défice travado no metabolismo basal; proteína limitada pelos rins
    eq(T.mae.energia.metodo_basal, "Katch-McArdle", "com massa magra medida usa Katch-McArdle");
    eq(T.mae.energia.metabolismo_basal_kcal, 1390, "metabolismo basal da mãe");
    assert(T.mae.energia.passos.some((x) => x.startsWith("Tiroide: −5 %")), "TSH alto desconta 5 %: " + T.mae.energia.passos.join(" | "));
    eq(T.mae.energia.gasto_manutencao_kcal, 1720, "manutenção da mãe com o ajuste");
    eq(T.mae.energia_alvo_kcal, 1390, "nunca abaixo do metabolismo basal");
    eq(T.mae.energia.defice_kcal, 330, "défice efetivo da mãe");
    assert(T.mae.energia.passos.some((x) => x.includes("nunca abaixo do metabolismo basal")), "razão do piso escrita");
    eq(T.mae.proteina_alvo_g_dia, 94, "proteína limitada a 1,2 g/kg pela função renal");
    assert(T.mae.proteina_nota.includes("função renal"), "nota da proteína");
    assert(T.mae.ajustes_pelas_analises.some((x) => x.startsWith("Função renal")) && T.mae.ajustes_pelas_analises.some((x) => x.startsWith("Colesterol LDL")) && T.mae.ajustes_pelas_analises.some((x) => x.startsWith("Tiroide lenta")), "as análises viram instruções para o prato");
    // Pai e Vitória: manutenção, sem défice
    eq(T.pai.energia.metabolismo_basal_kcal, 1611, "metabolismo basal do pai");
    eq(T.pai.energia_alvo_kcal, 2340, "o pai fica na manutenção");
    eq(T.pai.energia.defice_kcal, 0, "sem défice para quem só quer equilibrar");
    eq(T.vitoria.energia_alvo_kcal, 2210, "a Vitória, ativa, fica na manutenção dela");
    assert(T.filipa.energia_alvo_kcal < T.vitoria.energia_alvo_kcal && T.mae.energia_alvo_kcal < T.filipa.energia_alvo_kcal, "cada pessoa com o seu número");
    // o agregado leva a energia de cada um, com as análises dos outros perfis carregadas
    const hh = await page.evaluate(() => window.NG_TEST.householdContext());
    eq(hh.pessoas.find((x) => x.perfil === "mae").energia_alvo_kcal, 1390, "no contexto da família a mãe leva o seu cálculo, com as análises dela");
    eq(hh.pessoas.find((x) => x.perfil === "pai").energia_alvo_kcal, 2340, "e o pai o dele");
    // o perfil mostra o cálculo
    await app.go("perfil"); await page.waitForTimeout(200);
    const note = await app.text("#targetNote");
    assert(note.includes("1580 kcal") && note.includes("Como se chegou a este número") && note.includes("Mifflin-St Jeor"), "o perfil explica o número: " + note.slice(0, 160));
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
