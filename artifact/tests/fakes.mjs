/** Respostas falsas do Claude para os testes (código executado dentro da página). */
export const MEAL = (nome, hora, k, pr) => ({ nome, hora, ordem: ["sopa/legumes", "proteína", "hidratos", "fruta"],
  itens: [{ alimento: "sopa de legumes", quantidade: "200 ml", estado: "pronta", medida_caseira: "1 concha", grupo: "legumes" },
          { alimento: "peito de frango grelhado", quantidade: "130 g", estado: "cru", medida_caseira: "1 bife médio", grupo: "proteina" },
          { alimento: "arroz integral", quantidade: "100 g", estado: "cozinhado", medida_caseira: "4 c. sopa", grupo: "hidratos" },
          { alimento: "azeite", quantidade: "10 g", estado: "cru", medida_caseira: "1 c. sopa", grupo: "gordura" }],
  preparacao: "Grelhar sem gordura; temperar com limão e ervas.", porque: "Âncora proteica do dia.",
  alternativas: [{ em_vez_de: "frango", trocar_por: "pescada 160 g" }], kcal: k, proteina_g: pr, fibra_g: 8, hidratos_g: 42, gordura_g: 12 });

/** sample.json que responde às 3 etapas do plano e à extração de documentos. */
export const PLAN_JSON = `
  const t = String(input);
  const day = (d) => ({ dia: d, refeicoes: [
    ${JSON.stringify(MEAL("Pequeno-almoço", "08:00", 320, 25))},
    ${JSON.stringify(MEAL("Almoço", "13:00", 460, 38))},
    ${JSON.stringify(MEAL("Jantar", "19:30", 420, 34))} ] });
  if (t.includes("Passo 1 de 3")) { window.__frameCount = (window.__frameCount || 0) + 1; return {
    metas_diarias: { kcal: 1500, proteina_g: 110, hidratos_g: 140, gordura_g: 55, fibra_g: 28, agua_ml: 2600, sal_g: 5 },
    racional: "1,5 g/kg sobre peso ajustado, défice de 500 kcal.", principios: ["Proteína em todas as refeições", "Legumes primeiro"],
    regras_aplicadas: [{ regra: "Comer sempre os legumes primeiro", como: "Campo Ordem em todas as refeições." }],
    estrutura_do_dia: [{ nome: "Almoço", hora: "13:00", kcal: 460, proteina_g: 38 }],
    suplementos: [{ nome: "Magnesium Complex 490 mg", hora: "21:30", nota: "à noite" }],
    hidratacao: [{ hora: "07:30", quantidade_ml: 250, nota: "ao acordar" }, { hora: "10:00", quantidade_ml: 250, nota: "entre refeições" }, { hora: "15:00", quantidade_ml: 300, nota: "meio da tarde" }],
    dias_dificeis: { nauseas: ["caldo morno"], obstipacao: ["+300 ml água"], fora_de_casa: ["método do prato"] },
    preparacao_antecipada: ["Domingo: cozer 600 g de frango"] }; }
  if (t.includes("SUBSTITUI apenas esta refeição")) { window.__swapCount = (window.__swapCount || 0) + 1; const m = ${JSON.stringify(MEAL("Jantar", "19:30", 400, 35))}; m.itens[1].alimento = "pescada cozida"; m.itens[1].quantidade = "160 g"; return { refeicao: m }; }
  if (t.includes("lista de compras")) return { lista_compras: [{ categoria: "Proteína", itens: [{ alimento: "peito de frango", quantidade: "900 g" }] }] };
  const m = t.match(/destes dias: ([^\\n.]+)/);
  if (m) return { dias: m[1].split(", ").map(day) };
  if (t.includes("documento(s) de saúde")) return { documentos: [{ tipo: "analises", data: "2026-09-10", titulo: "Análises Lab Central", resumo: "LDL alto; ferritina baixa.",
    analises: [{ analise: "Hemoglobina glicada (HbA1c)", valor: "5,4", unidade: "%", ref_min: 4, ref_max: 5.7 }, { analise: "Colesterol LDL", valor: 148, unidade: "mg/dL", ref_min: null, ref_max: 115 }, { analise: "Ferritina", valor: 9, unidade: "ng/mL", ref_min: 15, ref_max: 150 }],
    tensao: [{ data: "2026-09-10", hora: "09:10", sistolica: 138, diastolica: 88, pulso: 72 }], relevante_para_nutricao: ["LDL alto", "Ferritina baixa"] }] };
  return {};
`;

/** sample de texto que usa as ferramentas quando a mensagem o pede. */
export const CHAT_TEXT = `
  const last = Array.isArray(input) ? input[input.length - 1].content : String(input);
  const t = Object.fromEntries((opts?.tools || []).map((x) => [x.name, x]));
  window.__toolResults = window.__toolResults || [];
  if (t.registar_extra && /pastel/.test(last)) {
    window.__toolResults.push(await t.registar_extra.execute({ descricao: "pastel de nata", kcal_estimado: 300, proteina_g: 5 }));
    const dia = window.__todayName || "segunda";
    window.__toolResults.push(await t.atualizar_refeicoes.execute({ motivo: "compensar pastel", alteracoes: [{ dia, refeicao: "Jantar", nova: { hora: "20:00", itens: [{ alimento: "pescada cozida", quantidade: "150 g" }, { alimento: "legumes salteados", quantidade: "200 g" }], kcal: 280, proteina_g: 33, fibra_g: 6 } }] }));
    return "Registei o pastel e aligeirei o jantar.";
  }
  if (t.registar_tensao && /(\\d{2,3})\\/(\\d{2,3})/.test(last)) { const m = last.match(/(\\d{2,3})\\/(\\d{2,3})/); window.__toolResults.push(await t.registar_tensao.execute({ sistolica: +m[1], diastolica: +m[2] })); return "Registei " + m[0] + "."; }
  if (t.guardar_regra && /legumes primeiro/.test(last)) { window.__toolResults.push(await t.guardar_regra.execute({ regra: "Comer sempre os legumes primeiro, depois a proteína e os hidratos no fim" })); return "Guardei essa regra."; }
  return "Resposta de teste.";
`;

export const PROFILES = {
  "profiles/filipa": { name: "Filipa", uses_glp1: false, allergies: [], intolerances: [], meds: [], titrations: [], weight_kg: 65, height_cm: 160, sex: "feminino" },
  "profiles/mae": { name: "Alexandra", family: false, uses_glp1: true, glp1_dose: "2.5 mg", glp1_inj_day: "domingo", satiety: "moderada", weight_kg: 78, height_cm: 165, target_kg: 65, sex: "feminino", allergies: [], intolerances: [],
    meds: [{ id: "m1", kind: "suplemento", name: "PRAVID", dose: "30000 UI", freq: "1x semana", active: true }], titrations: [] },
};
