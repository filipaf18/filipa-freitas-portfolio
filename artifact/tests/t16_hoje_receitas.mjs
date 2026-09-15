import { open, assert, eq } from "./harness.mjs";
import { MEAL, PROFILES } from "./fakes.mjs";
/** Hoje: comi parte, macros do que já entrou; receita para a mesa com quantidades somadas; nota livre por refeição. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const hoje = DAYS[(new Date().getDay() + 6) % 7];
  const plate = (perfil, g, semLegumes) => ({ itens: [
    { alimento: "peito de frango grelhado", quantidade: `${g} g`, estado: "cru", medida_caseira: "1 bife", grupo: "proteina" },
    ...(semLegumes ? [] : [{ alimento: "brócolos", quantidade: "150 g", estado: "cozidos", medida_caseira: "1 chávena", grupo: "legumes" }]),
    { alimento: "arroz integral", quantidade: `${g} g`, estado: "cozinhado", medida_caseira: "4 c. sopa", grupo: "hidratos" }],
    ordem: ["legumes", "proteína", "hidratos"], kcal: 400 + g, proteina_g: 35, hidratos_g: 40, gordura_g: 12, fibra_g: 6, nota: semLegumes ? "sem brócolos" : "" });
  const jantar = { nome: "Jantar", hora: "20:30", base: "Frango grelhado com brócolos e arroz", preparacao: "Grelhar o frango 6 min de cada lado; cozer o arroz; brócolos a vapor 8 min.", componentes: [], por_pessoa: { filipa: plate("filipa", 120), mae: plate("mae", 110), pai: plate("pai", 160), vitoria: plate("vitoria", 130, true) } };
  const famDay = (d) => ({ dia: d, jantar });
  const myJantar = { ...MEAL("Jantar", "20:30", 520, 35), itens: plate("filipa", 120).itens, familia: true, base_comum: jantar.base };
  const store = { ...PROFILES,
    "profiles/pai": { name: "Jorge", sex: "masculino", height_cm: 180, weight_kg: 77, objetivo: "manter" }, "profiles/vitoria": { name: "Vitória", sex: "feminino", height_cm: 160, weight_kg: 48, objetivo: "ganhar", dislikes: ["legumes"] },
    "plans/filipa": { profile: "filipa", version: 1, week_start: "2026-09-14", previous: null, extras: [], changelog: [], plan: { metas_diarias: { kcal: 1500, proteina_g: 100, hidratos_g: 150, gordura_g: 50, fibra_g: 25 }, racional: "r", hidratacao: [],
      dias: DAYS.map((d) => ({ dia: d, refeicoes: [MEAL("Pequeno-almoço", "08:00", 350, 25), MEAL("Almoço", "13:00", 460, 38), myJantar] })) } },
    "family/plan": { week_start: "2026-09-14", version: 1, pessoas: ["filipa", "mae", "pai", "vitoria"], com_almoco: false, dias: DAYS.map(famDay), preparacao_antecipada: [] },
  };
  const app = await open({ store });
  const { page } = app;
  try {
    await app.go("hoje"); await page.waitForTimeout(300);
    // 1. antes de comer: barra a zero, traço no total planeado
    assert((await app.text("#eatenChart")).includes("Já comeste hoje"), "medidores presentes");
    let eaten = await page.evaluate(() => window.NG_TEST.eatenToday());
    eq(eaten.comido.kcal, 0, "nada comido ainda");
    assert(eaten.por_vir.proteina_g > 60, "o resto do plano conta como por vir: " + eaten.por_vir.proteina_g);
    // 2. comi parte do pequeno-almoço: escolho os itens
    await page.click('#todayMeals [data-adh="Pequeno-almoço"][data-st="parcial"]'); await page.waitForTimeout(200);
    assert(await page.isVisible('#todayMeals .partial[data-partial="Pequeno-almoço"]'), "lista de itens aparece");
    await page.uncheck('#todayMeals .partial [data-pitem="1"]'); // sem o frango
    await page.click('#todayMeals .partial [data-psave]'); await page.waitForTimeout(400);
    let st = await app.dump();
    const hojeAdh = st["adherence/filipa"].days[new Date().toISOString().slice(0, 10)] || Object.values(st["adherence/filipa"].days)[0];
    eq(hojeAdh["Pequeno-almoço"].status, "parcial", "adesão parcial guardada");
    eq(hojeAdh["Pequeno-almoço"].itens.length, 3, "três itens comidos de quatro");
    assert(!hojeAdh["Pequeno-almoço"].itens.includes("peito de frango grelhado"), "o frango ficou de fora");
    eaten = await page.evaluate(() => window.NG_TEST.eatenToday());
    assert(eaten.comido.kcal > 100 && eaten.comido.proteina_g < 20, "macros só dos itens comidos: " + JSON.stringify(eaten.comido));
    assert((await app.text("#todayMeals")).includes("comeu: sopa de legumes"), "a refeição mostra o que foi comido");
    assert((await app.text("#adherenceSummary")).includes("1 em parte"), "resumo conta a parte");
    // 3. comi o almoço inteiro: soma
    await page.click('#todayMeals [data-adh="Almoço"][data-st="comi"]'); await page.waitForTimeout(400);
    const e2 = await page.evaluate(() => window.NG_TEST.eatenToday());
    assert(e2.comido.kcal > eaten.comido.kcal + 300, "o almoço somou: " + e2.comido.kcal);
    const chart = await app.text("#eatenChart");
    assert(chart.includes("Proteína") && chart.includes("/ 100 g"), "medidor de proteína com alvo: " + chart.slice(0, 120));
    // 4. receita do jantar em família: quantidades somadas e repartidas
    await page.click(`#todayMeals [data-recipe="${hoje}|2"]`); await page.waitForTimeout(200);
    assert(await page.isVisible(".modal"), "receita abre");
    let rc = await app.text("#rcRows");
    assert(rc.includes("520 g") && rc.includes("Jorge 160 g"), "frango somado para os quatro (120+110+160+130) com repartição: " + rc.slice(0, 160));
    assert(rc.includes("sem: Vitória"), "brócolos: a Vitória não leva");
    await page.uncheck('.modal [data-for="pai"]'); await page.uncheck('.modal [data-for="vitoria"]'); await page.waitForTimeout(100);
    rc = await app.text("#rcRows");
    assert(rc.includes("230 g") && !rc.includes("Jorge"), "só para duas: 120+110: " + rc.slice(0, 120));
    assert((await app.text(".modal")).includes("Grelhar o frango"), "preparação na receita");
    await page.click(".modal [data-no]"); await page.waitForTimeout(100);
    // receita individual com doses
    await app.go("plano"); await page.click(`[data-day="${hoje}"]`); await page.waitForTimeout(200);
    await page.click(`#planMealsList [data-recipe="${hoje}|1"]`); await page.waitForTimeout(200);
    assert((await app.text("#rcRows")).includes("130 g"), "dose 1");
    await page.click('.modal [data-dose="+"]'); await page.waitForTimeout(100);
    assert((await app.text("#rcRows")).includes("260 g"), "dose 2 duplica: " + (await app.text("#rcRows")).slice(0, 100));
    await page.click(".modal [data-no]"); await page.waitForTimeout(100);
    // 5. nota livre: fica na memória, sobrevive ao 👍 e entra no resumo
    await page.click(`#planMealsList [data-note="${hoje}|1"]`); await page.waitForTimeout(200);
    await page.fill("#noteText", "porção grande demais e faltou sal"); await page.click(".modal [data-save]"); await page.waitForTimeout(400);
    await page.click(`#planMealsList [data-like="${hoje}|1|1"]`); await page.waitForTimeout(400);
    st = await app.dump();
    const prefs = st["prefs/filipa"].entries;
    eq(prefs.filter((p) => p.voto === 0).length, 1, "nota guardada");
    eq(prefs.filter((p) => p.voto === 1).length, 1, "gostei guardado ao lado da nota");
    const sum = await page.evaluate(() => window.NG_TEST.prefsSummary());
    assert(sum.notas[0].includes("porção grande demais"), "nota no resumo para o plano: " + JSON.stringify(sum.notas));
    assert((await app.text(`#planMealsList [data-note="${hoje}|1"]`)).includes("1"), "o botão mostra que há uma nota");
    await app.go("perfil");
    assert((await app.text("#prefsList")).includes("faltou sal"), "nota listada no perfil");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
