import { open, assert, eq } from "./harness.mjs";
/** Cruzamentos: referência clínica vs laboratório, condições, suplementos, composição implausível, mesa. */
export default async function () {
  const L = (marker, label, value, unit, lo, hi) => ({ id: label.replace(/\W/g, "") + value, date: "2026-08-03", marker, label, value, unit, lo, hi });
  const store = {
    "profiles/filipa": { name: "F", sex: "feminino", birth_date: "2001-01-18", height_cm: 160, weight_kg: 64.5, target_kg: 57, objetivo: "perder", activity: "pouco_ativa", dislikes: ["Legumes", "leguminosas"], meds: [{ id: "s1", kind: "suplemento", name: "Methyl B Complex", dose: "", freq: "1x dia", active: true }], titrations: [] },
    "labs/filipa": { profile: "filipa", entries: [
      L("glicemia_jejum", "Glicemia em jejum", 105, "mg/dL", 70, 85), L("hba1c", "HbA1c", 5.2, "%", 4, 6.5), L("ferritina", "Ferritina", 307, "ng/mL", 11, 50),
      L("hemoglobina", "Hemoglobina", 16, "g/dL", 12, 13.8), L("outro", "Plaquetas", 440, "x10^9/L", 140, 275), L("outro", "Fibrinogénio", 540, "mg/dL", 140, 258),
      L("outro", "Homocisteína", 13.9, "μmol/L", 3.7, 10.2), L("b12", "Vitamina B12", 883, "ng/L", 187, 311), L("outro", "Zinco", 150, "μg/dL", 46, 62), L("outro", "Selénio", 16, "μg/dL", 6, 9.5),
      L("tsh", "TSH", 4.94, "mUI/L", 0.35, 2.27), L("t4_livre", "T4 livre", 1.48, "ng/dL", 0.7, 1.08), L("outro", "Hormona Anti-Mulleriana (AMH)", 9.752, "ng/mL", 0.775, 5.05),
      L("outro", "DHEA-S", 377, "μg/dL", 83, 131.8), L("outro", "Cortisol", 20.7, "μg/dL", 3.7, 19.4), L("outro", "Testosterona Total", 49.91, "ng/dL", 13.84, 30.64), L("vit_d", "Vitamina D (25-OH)", 24, "ng/mL", 30, 100) ] },
    "body/filipa": { profile: "filipa", entries: [{ id: "b1", date: "2026-09-14", weight_kg: 64.5, fat_pct: 29, water_pct: 48 }] },
    "profiles/mae": { name: "M", sex: "feminino", birth_date: "1973-04-21", height_cm: 165, weight_kg: 78.7, target_kg: 65, objetivo: "perder", activity: "sedentaria", uses_glp1: true, glp1_substance: "tirzepatida", glp1_dose: "2.5 mg", glp1_start: "2026-09-16", glp1_inj_day: "terça",
      meds: [{ id: "m1", kind: "suplemento", name: "ashwagandha", dose: "150 mg", freq: "1x dia", active: true }, { id: "m2", kind: "suplemento", name: "Magnesium Complex", dose: "490 MG", freq: "1x dia", active: true }, { id: "m3", kind: "medicacao", name: "L-Glutathion", dose: "250 mg", active: true }], titrations: [] },
    "labs/mae": { profile: "mae", entries: [L("ldl", "LDL", 118, "mg/dL", null, 100), L("hdl", "HDL", 43, "mg/dL", 45, null), L("vit_d", "Vitamina D", 18, "ng/mL", 30, 100), L("ureia", "Ureia", 37, "mg/dL", 21, 24), L("hemoglobina", "Hemoglobina", 15.4, "g/dL", 12, 14.5), L("potassio", "Potássio", 4.4, "mmol/L", 3.5, 4), L("egfr", "TFG", 80, "mL/min/1,73m2", 60, null), L("outro", "Leucócitos (sedimento)", 17.5, "/hpf", null, 6), L("ast", "AST", 23, "U/L", 5, 21)] },
    "docs/mae": { profile: "mae", entries: [{ id: "d1", date: "2026-06-15", tipo: "tensao_arterial", titulo: "MAPA 24h", resumo: "Hipertensão arterial confirmada por MAPA (média 139/86).", pontos: [] }] },
    "vitals/mae": { profile: "mae", entries: Array.from({ length: 10 }, (_, i) => ({ id: "v" + i, date: "2026-06-15", time: `${8 + i}:00`, sys: 138 + (i % 3), dia: 86, pulse: 70 })) },
    "body/mae": { profile: "mae", entries: [{ id: "b1", date: "2026-09-14", weight_kg: 78.7, fat_pct: 40.7, water_pct: 40.1 }] },
    "profiles/pai": { name: "P", sex: "masculino", birth_date: "1972-10-22", height_cm: 180, weight_kg: 77.1, target_kg: 72, objetivo: "perder", activity: "pouco_ativa", notes: "Sofri um traumatismo cranio encefálico a 25/04/2025", meds: [], titrations: [] },
    "labs/pai": { profile: "pai", entries: [L("egfr", "TFG", 71, "mL/min/1,73m2", 60, null), L("hemoglobina", "Hemoglobina", 16.3, "g/dL", 13, 16.1), L("outro", "Plaquetas", 230, "x10^9/L", 140, 219)] },
    "body/pai": { profile: "pai", entries: [{ id: "b1", date: "2026-09-14", weight_kg: 77.1, fat_pct: 39.8, water_pct: 40.8 }] },
    "profiles/vitoria": { name: "V", sex: "feminino", birth_date: "2005-11-24", height_cm: 160, weight_kg: 47.9, objetivo: "perder", activity: "pouco_ativa", satiety: "moderada", dislikes: ["Legumes", "queijo", "leguminosas", "bebidas vegetais"], meds: [], titrations: [] },
    "labs/vitoria": { profile: "vitoria", entries: [L("insulina", "Insulina em jejum", 1.17, "µU/mL", 2, 2.15), L("outro", "Delta-4-Androstenediona", 4, "ng/mL", 0.3, 1.97), L("tsh", "TSH", 4.94, "mUI/L", 0.35, 1.73), L("outro", "Ac. Anti-Peroxidase Tiroideia (TPO)", 5.61, "UI/mL", null, 3)] },
    "docs/vitoria": { profile: "vitoria", entries: [{ id: "d1", date: "2026-03-17", tipo: "outro", titulo: "Relatório clínico", resumo: "Amenorreia desde outubro de 2023, possível baixa disponibilidade energética.", pontos: [] }] },
    "vitals/vitoria": { profile: "vitoria", entries: [{ id: "v1", date: "2026-03-17", sys: 121, dia: 77, pulse: 104 }] },
    "body/vitoria": { profile: "vitoria", entries: [{ id: "b1", date: "2026-03-17", weight_kg: 49.5, fat_pct: 19.3, water_pct: 55.8 }] },
  };
  const app = await open({ store });
  const { page } = app;
  try {
    const R = await page.evaluate(() => {
      const T = window.NG_TEST; const r = {};
      for (const id of ["filipa", "mae", "pai", "vitoria"]) {
        const p = window.__store[`profiles/${id}`]; const t = T.planTargets(p, id);
        r[id] = { cond: T.conditionsOf(p, id), prato: T.plateFlags(id).map((f) => f.id), medico: T.doctorFlags(id).map((f) => f.id), labs: Object.fromEntries(T.latestLabsFor(id).map((x) => [x.analise, x.estado + (x.nota ? "~" : "")])), alvo: t.energia_alvo_kcal, prot: t.proteina_alvo_g_dia, nota: t.proteina_nota || "", passos: t.energia.passos, avisos: t.energia.avisos, obj: t.objetivo, tit: T.titrationInfo(p) };
      }
      r.mesa = T.tableConstraints(["filipa", "mae", "pai", "vitoria"]);
      r.match = [T.matchMarker("Altura", "cm"), T.matchMarker("Pressão Arterial Diastólica", "mmHg"), T.matchMarker("ALT (TGP)", "U/L"), T.matchMarker("Fibrinogénio", "mg/dL"), T.bodyFieldOf("% Massa Gorda", "%"), T.bodyFieldOf("Massa Muscular", "kg")];
      return r;
    });
    // leitura de PDFs: nada de "altura" virar ALT
    eq(JSON.stringify(R.match), '["outro","outro","alt","fibrinogenio","fat_pct","muscle_kg"]', "correspondência por palavra inteira e unidade: " + JSON.stringify(R.match));
    // F: referência clínica manda; análises antigas "outro" passam a ser reconhecidas
    const F = R.filipa;
    eq(F.labs["DHEA-S"], "normal~", "DHEA-S 377 é normal na referência clínica (o laboratório marcava alto)");
    eq(F.labs["Cortisol (manhã)"], "normal~", "cortisol 20,7 dentro da referência clínica (unidade com μ grego)");
    eq(F.labs["Testosterona total"], "normal~", "testosterona 49,9 dentro da referência clínica de mulher");
    eq(F.labs["Hemoglobina"], "normal~", "hemoglobina 16 no limite, não alta");
    eq(F.labs["Fibrinogénio"], "alto", "fibrinogénio reconhecido e alto");
    eq(F.labs["Hormona anti-Mülleriana (AMH)"], "alto", "AMH reconhecida e alta");
    for (const f of ["glicemia", "ferritina_alta", "inflamacao", "homocisteina", "minerais_altos", "tiroide", "sopc", "fibra_sem_legumes", "vitd"]) assert(F.prato.includes(f), `F: ${f} em ${F.prato}`);
    assert(!F.prato.includes("cortisol"), "F: cortisol normal não gera regra");
    for (const f of ["biotina", "m_tsat", "m_hemograma", "m_tsh", "m_androg", "m_hcy", "m_glicemia"]) assert(F.medico.includes(f), `F médico: ${f} em ${F.medico}`);
    assert(F.passos.some((x) => x.startsWith("Tiroide: −3 %")), "TSH alto com T4 normal desconta só 3 %");
    assert(F.alvo >= 1400 && F.alvo <= 1600, "alvo da F entre 1400 e 1600: " + F.alvo);
    // M: hipertensão vem do MAPA; ureia e potássio normais na referência clínica; suplementos cruzados
    const M = R.mae;
    assert(M.cond.includes("hipertensao") && !M.cond.includes("renal") && !M.cond.includes("prediabetes"), "condições da M só as reais: " + M.cond);
    eq(M.labs["Ureia"], "normal~", "ureia 37 é normal (o laboratório usava 21 a 24)");
    eq(M.labs["Potássio"], "normal~", "potássio 4,4 é normal");
    assert(!M.prato.includes("renal") && !M.prato.includes("potassio") && !M.prato.includes("ureia"), "sem regras falsas: " + M.prato);
    for (const f of ["sodio", "ldl", "hdl", "vitd", "glp1", "osso"]) assert(M.prato.includes(f), `M: ${f} em ${M.prato}`);
    for (const f of ["ashwagandha", "magnesio_dose", "bp_med", "m_urina", "m_apneia"]) assert(M.medico.includes(f), `M médico: ${f} em ${M.medico}`);
    eq(M.tit.antes, true, "titulação ainda não começou");
    eq(M.nota, "", "proteína da M sem limite renal");
    // P: composição implausível fora do cálculo; TCE trava o défice; TFG 71 limita a 1,3 g/kg
    const P = R.pai;
    assert(P.cond.includes("tce"), "TCE detetado nas notas");
    assert(P.passos[0].includes("Mifflin"), "sem Katch-McArdle com bioimpedância implausível: " + P.passos[0]);
    assert(P.avisos.some((x) => x.includes("não é plausível")), "aviso da bioimpedância");
    assert(P.passos.some((x) => x.includes("−300 kcal") && x.includes("traumatismo")), "défice de 300 pelo TCE: " + P.passos.join(" | "));
    eq(P.prot, 100, "proteína limitada a 1,3 g/kg pela TFG 71");
    for (const f of ["egfr_limite", "tce", "bia"]) assert(P.prato.includes(f), `P: ${f}`);
    assert(P.medico.includes("m_hipofise") && P.medico.includes("m_rim"), "P médico");
    // V: amenorreia lida do relatório muda o objetivo; taquicardia trava a cafeína; cálcio sem queijo
    const V = R.vitoria;
    assert(V.cond.includes("reds"), "amenorreia detetada no documento");
    eq(V.obj, "perder peso", "o objetivo escrito era perder") ; // o cálculo corrige
    assert(V.passos.some((x) => x.includes("Excedente: +450 kcal")), "excedente de 450 kcal: " + V.passos.join(" | "));
    assert(V.avisos.some((x) => x.includes("não é seguro")), "aviso de que perder peso não é seguro");
    assert(V.alvo > 2000, "alvo da V acima de 2000: " + V.alvo);
    for (const f of ["reds", "calcio", "cafeina", "sopc", "tiroide", "fibra_sem_legumes"]) assert(V.prato.includes(f), `V: ${f} em ${V.prato}`);
    assert(V.medico.includes("m_reds") && V.medico.includes("m_androg"), "V médico");
    eq(V.labs["Anticorpos anti-TPO"], "normal~", "anti-TPO 5,6 é negativo na referência clínica");
    // mesa: união do que ajuda todos, com quem o pede
    const mesaIds = R.mesa.mesa.map((m) => m.por_causa_de.join(","));
    assert(mesaIds.some((x) => x.includes("M (Hipertensão")) && mesaIds.some((x) => x.includes("F (Vitamina D") && x.includes("M (Vitamina D")), "mesa: sódio pela M, vitamina D pela F e pela M: " + JSON.stringify(mesaIds));
    assert(R.mesa.por_pessoa.vitoria.some((x) => x.startsWith("Cálcio")), "reforço da V na mesa");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
