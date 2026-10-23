import { open, assert, eq } from "./harness.mjs";
import { MEAL, PROFILES } from "./fakes.mjs";
/** Receita do chefe: passo a passo a pedido, guardada; aviso de dois hidratos de base no mesmo prato. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const hoje = DAYS[(new Date().getDay() + 6) % 7];
  const jantar = { ...MEAL("Jantar", "20:30", 520, 35), familia: false, itens: [
    { alimento: "pescada cozida", quantidade: "160 g", estado: "cru", grupo: "proteina" },
    { alimento: "puré de couve-flor com batata", quantidade: "200 g", estado: "cozinhado", grupo: "hidratos" },
    { alimento: "batata-doce assada", quantidade: "120 g", estado: "cozinhado", grupo: "hidratos" },
    { alimento: "azeite", quantidade: "10 g", estado: "cru", grupo: "gordura" }] };
  const store = { ...PROFILES, "plans/filipa": { profile: "filipa", version: 1, week_start: "2026-09-14", previous: null, extras: [], changelog: [], plan: { metas_diarias: { kcal: 1500, proteina_g: 100, hidratos_g: 150, gordura_g: 50, fibra_g: 25 }, racional: "r", hidratacao: [],
    dias: DAYS.map((d) => ({ dia: d, refeicoes: [MEAL("Pequeno-almoço", "08:00", 350, 25), MEAL("Almoço", "13:00", 460, 38), jantar] })) } } };
  const sampleJson = `window.__chef = (window.__chef || 0) + (String(input).includes("RECEITA COMPLETA") ? 1 : 0);
    if (String(input).includes("RECEITA COMPLETA")) { window.__chefPrompt = String(input); return { titulo: "Pescada cozida com puré", porcoes: 1, tempo_preparacao_min: 15, tempo_total_min: 35, dificuldade: "fácil", utensilios: ["tacho"], mise_en_place: ["Descascar a batata"], ingredientes: [{ alimento: "pescada", quantidade: "160 g", nota: "em postas" }],
      passos: [{ titulo: "Cozer", texto: "Cozer a batata 15 minutos.", minutos: 15, dica: "sal na água" }, { titulo: "Pescada", texto: "Pochar a pescada 8 minutos até lascar.", minutos: 8 }, { titulo: "Puré", texto: "Esmagar com o azeite.", minutos: 5 }], ponto_certo: "pescada opaca", emplatamento: "puré ao centro", conservacao: "comer na hora", nota_do_chef: "Água a tremer, não a ferver." }; }
    return {};`;
  const app = await open({ store, sampleJson });
  const { page } = app;
  try {
    await app.go("plano"); await page.click(`[data-day="${hoje}"]`); await page.waitForTimeout(300);
    assert((await app.text("#planMealsList")).includes("Dois hidratos de base"), "o plano avisa de dois hidratos no mesmo prato");
    await page.click(`#planMealsList [data-recipe="${hoje}|2"]`); await page.waitForTimeout(300);
    assert((await app.text(".modal #rcWarn")).includes("batata-doce"), "a receita avisa do segundo hidrato");
    assert(await page.isVisible(".modal [data-chef]"), "botão da receita completa");
    await page.click(".modal [data-chef]"); await page.waitForTimeout(600);
    const t = await app.text(".modal .chefrec");
    assert(t.includes("Passo a passo") && t.includes("Pochar a pescada 8 minutos") && t.includes("Água a tremer") && t.includes("No ponto certo"), "receita com passos: " + t.slice(0, 160));
    const prompt = await page.evaluate(() => window.__chefPrompt);
    assert(prompt.includes("pescada cozida 160 g") && prompt.includes("TOTAL A COZINHAR"), "o pedido leva as quantidades do plano");
    await page.click(".modal [data-no]"); await page.waitForTimeout(200);
    // reabrir: vem da memória, sem novo pedido
    await page.click(`#planMealsList [data-recipe="${hoje}|2"]`); await page.waitForTimeout(500);
    assert((await app.text(".modal .chefrec")).includes("Pochar a pescada"), "receita guardada ao reabrir");
    eq(await page.evaluate(() => window.__chef), 1, "um só pedido ao chefe");
    const st = await app.dump();
    eq(st["recipes/filipa"].entries.length, 1, "guardada em recipes/filipa");
  } finally { await app.close(); }
}
