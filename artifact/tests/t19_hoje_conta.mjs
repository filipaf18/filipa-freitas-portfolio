import { open, assert, eq } from "./harness.mjs";
import { MEAL, PROFILES } from "./fakes.mjs";
/** Hoje conta "comi outra coisa" (macros estimados), diz o que falta e ajusta o resto do dia; o chat sem ferramentas fica na mesma guardado no plano. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const hoje = DAYS[(new Date().getDay() + 6) % 7];
  const d = new Date(); const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const store = { ...PROFILES,
    "plans/filipa": { profile: "filipa", version: 1, week_start: "2026-09-14", previous: null, extras: [], changelog: [], plan: { metas_diarias: { kcal: 1500, proteina_g: 100, fibra_g: 25 }, racional: "r", hidratacao: [],
      dias: DAYS.map((x) => ({ dia: x, refeicoes: [MEAL("Pequeno-almoço", "10:00", 350, 25), MEAL("Almoço", "13:00", 460, 38), MEAL("Lanche", "16:30", 200, 12), MEAL("Jantar", "20:30", 400, 30)] })) } },
    "adherence/filipa": { profile: "filipa", days: { [date]: { "Pequeno-almoço": { status: "outro", texto: "Comi o pão, os ovos, tomate e queijo fresco", at: "2026-09-15T08:55:46.562Z" } } } },
  };
  const CHAT = `
    window.__toolNames = (opts?.tools || []).map((x) => x.name);
    return "Para o almoço de hoje ficam estas quantidades:\\n- Macarrão (seco): 60 g\\n- Frango cozinhado: 130 g\\n- Parmesão: 15 g\\n- Polpa de tomate: 100-120 g\\nDá cerca de 490 kcal e 49 g de proteína. Já fica no plano de hoje.";`;
  const JSONF = `
    const t = String(input); window.__json = window.__json || []; window.__json.push(t);
    if (t.includes("Estima os macros")) return { itens: [{ alimento: "pão", quantidade: "50 g" }, { alimento: "ovos", quantidade: "2 unidades" }, { alimento: "queijo fresco", quantidade: "50 g" }], kcal: 420, proteina_g: 30, hidratos_g: 28, gordura_g: 22, fibra_g: 3 };
    if (t.includes("MENSAGEM DA PESSOA")) return { acoes: [{ tipo: "refeicao", dia: "hoje", refeicao: "Almoço", itens: [{ alimento: "macarrão", quantidade: "60 g", estado: "seco" }, { alimento: "peito de frango grelhado", quantidade: "130 g", estado: "cozinhado" }, { alimento: "queijo parmesão", quantidade: "15 g" }, { alimento: "polpa de tomate", quantidade: "110 g" }], kcal: 490, proteina_g: 49, fibra_g: 4 }] };
    if (t.includes("Reequilibra")) return { refeicoes: [
      { nome: "Lanche", hora: "16:30", ordem: [], itens: [{ alimento: "iogurte grego natural", quantidade: "150 g", estado: "", medida_caseira: "1 copo", grupo: "lacticinio" }], preparacao: "", porque: "", alternativas: [], kcal: 120, proteina_g: 15, hidratos_g: 6, gordura_g: 4, fibra_g: 0 },
      { nome: "Jantar", hora: "20:30", ordem: [], itens: [{ alimento: "pescada cozida", quantidade: "150 g", estado: "cru", medida_caseira: "1 posta", grupo: "proteina" }, { alimento: "batata cozida", quantidade: "120 g", estado: "cozinhada", medida_caseira: "1 média", grupo: "hidratos" }], preparacao: "Cozer.", porque: "", alternativas: [], kcal: 260, proteina_g: 30, hidratos_g: 22, gordura_g: 3, fibra_g: 2 } ] };
    return {};`;
  const app = await open({ store, sample: CHAT, sampleJson: JSONF });
  const { page } = app;
  try {
    await app.go("hoje"); await page.waitForTimeout(900);
    // 1. "comi outra coisa" ao pequeno-almoço: estimado e contado
    let st = await app.dump();
    const pa = st["adherence/filipa"].days[date]["Pequeno-almoço"];
    eq(pa.kcal, 420, "macros estimados gravados na adesão"); eq(pa.estimado, true, "marcado como estimado"); eq(pa.texto, "Comi o pão, os ovos, tomate e queijo fresco", "texto mantido");
    eq((await page.evaluate(() => window.__json)).filter((x) => x.includes("Estima os macros")).length, 1, "uma estimativa só");
    let eaten = await page.evaluate(() => window.NG_TEST.eatenToday());
    eq(eaten.comido.kcal, 420, "Hoje conta o que foi comido em vez do plano"); eq(eaten.desconhecidas, 0, "sem refeições por contar");
    const left = await app.text("#eatenLeft");
    assert(left.includes("Faltam") && left.includes("1080 kcal") && left.includes("70 g"), "diz o que falta para a meta: " + left);
    assert((await app.text("#todayMeals")).includes("≈ 420 kcal"), "a refeição mostra a estimativa");
    assert(!(await page.isHidden("#rebalanceToday")), "botão para ajustar o resto do dia");
    // 2. chat sem ferramentas: a app guarda o almoço na mesma e ajusta o resto do dia
    await app.go("chat");
    await page.fill("#chatInput", "Hoje para almoçar vou fazer uma massa com frango, polpa de tomate e parmesão. Diz-me as quantidades."); await page.click("#sendChat");
    await page.waitForTimeout(3000);
    assert((await page.evaluate(() => window.__toolNames)).includes("fixar_refeicao"), "as ferramentas foram oferecidas");
    st = await app.dump();
    const dia = st["plans/filipa"].plan.dias.find((x) => x.dia === hoje);
    const alm = dia.refeicoes.find((m) => m.nome === "Almoço");
    assert(alm.itens.some((i) => i.alimento === "macarrão" && i.quantidade === "60 g") && alm.propria, "o almoço ficou no plano mesmo sem a ferramenta: " + JSON.stringify(alm.itens));
    eq(dia.refeicoes.find((m) => m.nome === "Lanche").itens[0].alimento, "iogurte grego natural", "lanche ajustado");
    eq(dia.refeicoes.find((m) => m.nome === "Jantar").itens[0].alimento, "pescada cozida", "jantar ajustado");
    const msgs = st["chat/filipa"].messages.map((m) => m.content);
    assert(msgs.some((c) => c.startsWith("✅ Guardei na app: Almoço de hoje")), "o chat diz que guardou: " + msgs.at(-2));
    assert(msgs.at(-1).startsWith("🔁 Ajustei o resto de"), "e que ajustou o resto do dia: " + msgs.at(-1));
    const reb = (await page.evaluate(() => window.__json)).find((x) => x.includes("Reequilibra"));
    assert(reb.includes('"comeu_em_vez":"Comi o pão') && reb.includes('"kcal":420'), "o reequilíbrio conta o pequeno-almoço que realmente comeu");
    assert(/REFEIÇÕES A AJUSTAR[^\n]*"Lanche"[^\n]*"Jantar"/.test(reb) && !/REFEIÇÕES A AJUSTAR[^\n]*"Almoço"/.test(reb), "ajusta lanche e jantar, não o almoço");
    assert((await app.text("#diagText")).includes("ferramentas nenhuma"), "o diagnóstico diz que não foram usadas ferramentas");
    // 3. em Hoje, marcar o almoço e usar o botão para reajustar
    await app.go("hoje"); await page.waitForTimeout(200);
    await page.click('#todayMeals [data-adh="Almoço"][data-st="comi"]'); await page.waitForTimeout(300);
    eaten = await page.evaluate(() => window.NG_TEST.eatenToday());
    assert(eaten.comido.kcal > 420 + 300, "o almoço comido soma: " + eaten.comido.kcal);
    await page.click("#rebalanceToday"); await page.waitForTimeout(800);
    assert((await app.text("#eatenNote")).includes("Ajustado"), "o botão ajustou: " + (await app.text("#eatenNote")));
    eq((await page.evaluate(() => window.__json)).filter((x) => x.includes("Reequilibra")).length, 2, "segundo reequilíbrio pelo botão");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
