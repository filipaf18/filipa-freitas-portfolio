import { open, assert, eq } from "./harness.mjs";
import { MEAL } from "./fakes.mjs";
/** Quatro perfis; gerar o plano gera primeiro as refeições em família, iguais em todos os planos; mudar uma muda para todos; lista de compras única. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const store = {
    "profiles/filipa": { name: "Filipa", sex: "feminino", birth_date: "2001-01-18", height_cm: 160, weight_kg: 65, target_kg: 58, objetivo: "perder", activity: "pouco_ativa", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/mae": { name: "Alexandra", sex: "feminino", birth_date: "1970-05-02", height_cm: 165, weight_kg: 78, target_kg: 65, objetivo: "perder", uses_glp1: true, glp1_dose: "2.5 mg", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/pai": { name: "Jorge", sex: "masculino", birth_date: "1968-03-10", height_cm: 178, weight_kg: 80, objetivo: "manter", activity: "ativa", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/vitoria": { name: "Vitória", sex: "feminino", birth_date: "2005-07-21", height_cm: 168, weight_kg: 60, objetivo: "manter", activity: "ativa", allergies: [], intolerances: [], dislikes: ["legumes", "leguminosas"], meds: [], titrations: [] },
  };
  const plate = (perfil, g, semLegumes) => ({ perfil, itens: [
    { alimento: "peito de frango grelhado", quantidade: `${g} g`, estado: "cru", medida_caseira: "1 bife", grupo: "proteina" },
    ...(semLegumes ? [] : [{ alimento: "brócolos", quantidade: "150 g", estado: "cozidos", medida_caseira: "1 chávena", grupo: "legumes" }]),
    { alimento: "arroz integral", quantidade: `${g} g`, estado: "cozinhado", medida_caseira: "4 c. sopa", grupo: "hidratos" },
  ], ordem: ["legumes", "proteína", "hidratos"], kcal: 400 + g, proteina_g: 35, hidratos_g: 40, gordura_g: 12, fibra_g: semLegumes ? 3 : 8, nota: semLegumes ? "sem brócolos, leva mais arroz" : "" });
  const PLATES = JSON.stringify([plate("filipa", 120, false), plate("mae", 110, false), plate("pai", 160, false), plate("vitoria", 130, true)]);
  const SAMPLE = `
    const t = String(input); window.__p = window.__p || []; window.__p.push(t.slice(0, 40));
    if (t.includes("escreve a EMENTA")) return { dias: ${JSON.stringify(DAYS)}.map((d) => ({ dia: d,
      jantar: { nome: "Jantar", hora: "20:30", base: "Frango grelhado com brócolos e arroz", preparacao: "Grelhar o frango e cozer o arroz para todos.", componentes: [
        { componente: "proteína", alimento: "peito de frango grelhado", grupo: "proteina", quem_leva: "todos" },
        { componente: "legumes", alimento: "brócolos", grupo: "legumes", quem_leva: ["filipa", "mae", "pai"] }] },
      almoco: { nome: "Almoço", hora: "13:00", base: "Marmita de atum com grão", preparacao: "Preparar ao domingo.", marmita: { preparar_em: "domingo", conservacao: "frigorífico até 3 dias", montagem: "Montar em caixas individuais." }, componentes: [] } })),
      preparacao_antecipada: ["Domingo: grelhar 1,2 kg de frango"] };
    if (t.includes("QUANTIDADES")) { const dias = t.match(/QUANTIDADES de cada pessoa para ([^\\n.]+)\\./)[1].split(", ");
      return { dias: dias.map((d) => ({ dia: d, refeicoes: [{ refeicao: "Jantar", por_pessoa: ${PLATES} }, { refeicao: "Almoço", por_pessoa: ${PLATES} }] })) }; }
    if (t.includes("define a ESTRUTURA")) return { metas_diarias: { kcal: 1500, proteina_g: 105, fibra_g: 25, agua_ml: 2100 }, racional: "Proteína primeiro.", porques: [{ decisao: "Proteína 105 g", numero: "1,6 g/kg", origem: "ACLM 2025" }], principios: ["Proteína em todas as refeições"], hidratacao: [{ hora: "08:00", quantidade_ml: 250, nota: "ao acordar" }], estrutura_do_dia: [] };
    const m = t.match(/destes dias: ([^\\n.]+)/);
    if (m) return { dias: m[1].split(", ").map((d) => ({ dia: d, refeicoes: [${JSON.stringify(MEAL("Pequeno-almoço", "08:00", 320, 25))}, ${JSON.stringify(MEAL("Jantar", "20:30", 500, 30))}] })) };
    if (t.includes("LISTA DE COMPRAS")) { window.__shopIn = t; return { lista: [{ corredor: "Talho", itens: [{ alimento: "peito de frango", quantidade: "2,1 kg", de: "", despensa: false }] }, { corredor: "Mercearia", itens: [{ alimento: "azeite", quantidade: "1 garrafa", despensa: true }] }] }; }
    return {};`;
  const app = await open({ store, sampleJson: SAMPLE });
  const { page } = app;
  try {
    eq(await page.evaluate(() => document.querySelectorAll("#who button").length), 4, "quatro perfis");
    const t = await page.evaluate(() => ["filipa", "pai", "vitoria"].map((id) => window.NG_TEST.householdContext().pessoas.find((x) => x.perfil === id)));
    eq(t[0].objetivo, "perder peso", "Filipa quer perder peso");
    eq(t[1].objetivo, "manter o peso e comer equilibrado", "o pai só quer equilibrar");
    assert(t[1].energia_alvo_kcal > 2000, "o pai fica na manutenção: " + t[1].energia_alvo_kcal);
    assert(t[0].energia_alvo_kcal < t[1].energia_alvo_kcal, "quem perde peso leva menos energia");

    // 1. gerar o plano da Filipa gera as refeições em família e o resto do dia dela
    await app.go("plano");
    assert(!(await page.isHidden("#famSharedWrap")), "opção de família visível");
    assert((await app.text("#famSharedNames")).includes("Jorge"), "nomes da família");
    eq(await page.isChecked("#famShared"), true, "ligada por omissão");
    await page.click("#genPlan"); await page.waitForTimeout(3500);
    let st = await app.dump();
    assert(st["family/plan"], "refeições em família guardadas");
    eq(st["family/plan"].pessoas.length, 4, "quatro pessoas");
    for (const id of ["filipa", "mae", "pai", "vitoria"]) {
      const plan = st[`plans/${id}`]; assert(plan, `plano de ${id}`);
      const seg = plan.plan.dias.find((d) => d.dia === "segunda");
      const jantar = seg.refeicoes.find((m) => m.nome === "Jantar");
      eq(jantar.familia, true, `jantar de ${id} em família`);
      eq(jantar.base_comum, "Frango grelhado com brócolos e arroz", `base comum em ${id}`);
      eq(jantar.itens.some((i) => i.alimento === "brócolos"), id !== "vitoria", `legumes no prato de ${id}`);
      eq(seg.refeicoes.find((m) => m.nome === "Almoço").marmita.preparar_em, "domingo", `marmita de ${id}`);
    }
    const segF = st["plans/filipa"].plan.dias.find((d) => d.dia === "segunda");
    assert(segF.refeicoes.some((m) => m.nome === "Pequeno-almoço"), "o resto do dia da Filipa veio do plano individual");
    eq(segF.refeicoes.find((m) => m.nome === "Jantar").itens[0].quantidade, "120 g", "o jantar em família ganha ao jantar individual");
    eq(st["plans/filipa"].plan.porques[0].numero, "1,6 g/kg", "porquês estruturados guardados");
    eq(st["plans/pai"].version, 1, "o pai ganhou um plano só com as refeições em família");
    const prompts = await page.evaluate(() => window.__p);
    assert(prompts.some((x) => x.startsWith("És nutricionista e estás a montar")), "pediu a família primeiro");
    eq(prompts.filter((x) => x.includes("Transforma esta soma")).length, 1, "uma lista de compras no fim");
    const shopKey = Object.keys(st).find((k) => k.startsWith("shopping/"));
    assert(shopKey && st[shopKey].lista.length === 2, "lista de compras guardada");
    assert((await page.evaluate(() => window.__shopIn)).includes("peito de frango grelhado"), "a lista soma o que está nos planos de todos");

    // 2. o ecrã: refeições primeiro, mesa com as diferenças, secções fechadas
    await page.click('[data-day="segunda"]'); await page.waitForTimeout(200);
    const html = await page.evaluate(() => document.querySelector("#planBody").innerHTML);
    assert(html.indexOf('id="planMealsList"') < html.indexOf('id="planTargets"'), "refeições antes das metas");
    const meals = await app.text("#planMealsList");
    assert(meals.includes("em família") && meals.includes("Na mesa") && meals.includes("Jorge") && meals.includes("Vitória") && meals.includes("sem brócolos"), "a mesa mostra as diferenças: " + meals.slice(0, 200));
    assert(await page.evaluate(() => !document.querySelector("#planHardCard").open && !document.querySelector("#planWaterCard").open), "secções fechadas por omissão");
    assert((await app.text("#familyLine")).includes("Mudar uma destas refeições muda para todos"), "linha da família");
    assert((await app.text("#planWhy")).includes("1,6 g/kg"), "porquês na página");

    // 3. editar à mão o jantar em família muda para todos, cada um com as suas quantidades
    await page.click('[data-day="segunda"]'); await page.waitForTimeout(200);
    const idx = await page.evaluate(() => [...document.querySelectorAll("#planMealsList .meal h3")].findIndex((h) => h.textContent.trim() === "Jantar"));
    await page.click(`[data-editmeal="segunda|${idx}"]`); await page.waitForTimeout(200);
    assert((await app.text(".modal .hint")).includes("Refeição em família"), "o editor avisa");
    await page.fill('.modal .edrow[data-i="0"] [data-f="quantidade"]', "200 g");
    await page.click(".modal [data-add]"); await page.fill(".modal .edrow:last-child [data-f=\"alimento\"]", "batata-doce"); await page.fill(".modal .edrow:last-child [data-f=\"quantidade\"]", "100 g");
    await page.click(".modal [data-save]"); await page.waitForTimeout(500);
    st = await app.dump();
    const jf = st["family/plan"].dias[0].jantar.por_pessoa;
    eq(jf.filipa.itens[0].quantidade, "200 g", "a Filipa fica com o que escreveu");
    eq(jf.pai.itens[0].quantidade, "160 g", "o pai mantém a quantidade que já tinha");
    assert(jf.pai.itens.some((i) => i.alimento === "batata-doce" && parseInt(i.quantidade) > 100), "o alimento novo entra no prato do pai, proporcional: " + JSON.stringify(jf.pai.itens));
    assert(jf.vitoria.itens.some((i) => i.alimento === "batata-doce") && !jf.vitoria.itens.some((i) => i.alimento === "brócolos"), "a Vitória continua sem brócolos");
    eq(st["plans/pai"].plan.dias[0].refeicoes.find((m) => m.nome === "Jantar").itens.some((i) => i.alimento === "batata-doce"), true, "o plano do pai foi atualizado");
    assert(!(await page.isHidden("#shopStale")), "a lista avisa que os planos mudaram");

    // 4. o pai abre a app e vê o seu plano, com o jantar igual
    await page.click('[data-pid="pai"]'); await page.waitForTimeout(400);
    await app.go("hoje");
    assert((await app.text("#nextMealCard")).length > 0, "o pai tem próxima refeição");
    await app.go("plano"); await page.waitForTimeout(200);
    const mealsP = await app.text("#planMealsList");
    assert(mealsP.includes("Jantar") && mealsP.includes("em família") && mealsP.includes("Filipa"), "o pai vê a mesa com a Filipa");
    assert((await app.text("#planShop")).includes("peito de frango"), "a mesma lista de compras");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
