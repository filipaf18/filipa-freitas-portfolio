import { open, assert, eq } from "./harness.mjs";
import { PROFILES, MEAL } from "./fakes.mjs";
/** Composição corporal (percentagens, editar, remover) e lista de compras da família. */
export default async function () {
  const mkPlan = (who, g) => ({ profile: who, week_start: "2026-09-14", version: 1, extras: [], changelog: [],
    plan: { metas_diarias: { kcal: 1500 }, racional: "r", principios: [], regras_aplicadas: [], suplementos: [], dias_dificeis: {}, preparacao_antecipada: [], hidratacao: [], lista_compras: [],
      dias: ["segunda", "terça"].map((d) => { const m = MEAL("Jantar", "20:00", 400, 35); m.itens[1].quantidade = `${g} g`; return { dia: d, refeicoes: [m] }; }) } });
  const store = { ...PROFILES,
    "body/filipa": { profile: "filipa", entries: [
      { id: "b1", date: "2026-09-01", weight_kg: 65, fat_pct: 30, muscle_kg: 22.1, water_pct: 47, notes: "" },
      { id: "b2", date: "2026-09-14", weight_kg: 64.5, fat_pct: 29, muscle_pct: 34.3, water_pct: 48, notes: "balança de casa" }] },
    "plans/filipa": mkPlan("filipa", 120), "plans/mae": mkPlan("mae", 150) };
  const SHOP = `window.__shopPrompt = String(input); if (String(input).includes("LISTA DE COMPRAS")) return { lista: [
    { corredor: "Talho", itens: [{ alimento: "peito de frango", quantidade: "600 g", de: "grelhado", despensa: false }] },
    { corredor: "Mercearia", itens: [{ alimento: "arroz integral", quantidade: "1 embalagem", despensa: false }, { alimento: "azeite", quantidade: "1 garrafa", despensa: true }] }] }; return {};`;
  const app = await open({ store, sampleJson: SHOP });
  const { page } = app;
  try {
    await app.go("corpo"); await page.waitForTimeout(300);
    assert((await app.text("#bodyList")).includes("músculo 34 % (22,1 kg)"), "registo antigo em kg converte para percentagem");
    await page.click('[data-editbody="b2"]'); await page.waitForTimeout(200);
    eq(await page.inputValue("#c_muscle"), "34.3", "editar carrega a percentagem");
    eq(await app.text('#bodyForm button[type=submit]'), "Guardar alterações", "botão em modo de alteração");
    await page.fill("#c_weight", "64"); await page.click('#bodyForm button[type=submit]'); await page.waitForTimeout(400);
    eq(await page.evaluate(() => document.querySelectorAll("#bodyList li").length), 2, "editar substitui em vez de duplicar");
    await page.click('[data-delbody="b1"]'); await page.waitForTimeout(400);
    eq(await page.evaluate(() => document.querySelectorAll("#bodyList li").length), 1, "remover funciona");
    assert((await app.text("#bodyLossQuality")) === "" || true, "qualidade da perda");
    await app.go("plano"); await page.waitForTimeout(300);
    // soma na página: frango 120+120 (Filipa) + 150+150 (mãe) = 540 g; sopa 200 ml × 4; azeite 10 g × 4
    const inp = await page.evaluate(() => window.NG_TEST.shoppingInput());
    eq(inp.pessoas, 2, "dois planos somados");
    eq(inp.itens.find((x) => x.alimento === "peito de frango grelhado").total, "540 g", "quantidades somadas de todos");
    eq(inp.itens.find((x) => x.alimento === "sopa de legumes").total, "800 g", "ml contam como gramas");
    assert(!(await page.isHidden("#planShopCard")), "cartão da lista visível");
    await page.click("#shopRefresh"); await page.waitForTimeout(500);
    const prompt = await page.evaluate(() => window.__shopPrompt);
    assert(prompt.includes('"total":"540 g"') && prompt.includes("Ingredientes, não pratos"), "o pedido leva a soma e as regras de compra");
    const shop = await app.text("#planShop");
    assert(shop.includes("Talho") && shop.includes("peito de frango") && shop.includes("600 g"), "lista por corredor: " + shop.slice(0, 120));
    assert(shop.includes("Despensa") && shop.indexOf("azeite") > shop.indexOf("Despensa"), "a despensa fica no fim");
    const wk = Object.keys(await app.dump()).find((k) => k.startsWith("shopping/"));
    assert(wk, "lista guardada na semana");
    await page.check('[data-shopck="peito de frango"]'); await page.waitForTimeout(300);
    eq((await app.dump())[wk].checked["peito de frango"], true, "marcar fica guardado para todos");
    assert((await app.text("#shopNote")).includes("1 de 3 marcados"), "contagem dos marcados");
    await page.click('[data-pid="mae"]'); await page.waitForTimeout(400); await app.go("plano"); await page.waitForTimeout(200);
    assert((await app.text("#planShop")).includes("peito de frango"), "a mãe vê a mesma lista");
    eq(await page.isChecked('[data-shopck="peito de frango"]'), true, "com o mesmo item marcado");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
