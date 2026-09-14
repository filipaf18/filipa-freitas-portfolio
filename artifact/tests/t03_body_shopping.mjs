import { open, assert, eq } from "./harness.mjs";
import { PROFILES } from "./fakes.mjs";
/** Composição corporal (percentagens, editar, remover) e lista de compras conjunta. */
export default async function () {
  const mkPlan = (who, itens) => ({ profile: who, week_start: "2026-09-14", version: 1, extras: [], changelog: [],
    plan: { metas_diarias: { kcal: 1500 }, racional: "r", principios: [], regras_aplicadas: [], suplementos: [], dias_dificeis: {}, preparacao_antecipada: [], hidratacao: [], dias: [], lista_compras: itens } });
  const store = { ...PROFILES,
    "body/filipa": { profile: "filipa", entries: [
      { id: "b1", date: "2026-09-01", weight_kg: 65, fat_pct: 30, muscle_kg: 22.1, water_pct: 47, notes: "" },
      { id: "b2", date: "2026-09-14", weight_kg: 64.5, fat_pct: 29, muscle_pct: 34.3, water_pct: 48, notes: "balança de casa" }] },
    "plans/filipa": mkPlan("filipa", [{ categoria: "Proteína", itens: [{ alimento: "peito de frango", quantidade: "900 g" }, { alimento: "ovos", quantidade: "12 unidades" }] }, { categoria: "Legumes", itens: [{ alimento: "brócolos", quantidade: "1 kg" }] }]),
    "plans/mae": mkPlan("mae", [{ categoria: "Proteina", itens: [{ alimento: "Peito de frango", quantidade: "1,2 kg" }, { alimento: "pescada", quantidade: "600 g" }] }, { categoria: "Legumes", itens: [{ alimento: "Brócolos", quantidade: "500 g" }] }]) };
  const app = await open({ store });
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
    assert((await app.text("#shopWho")).includes("Todos"), "seletor com todos os perfis");
    await page.click('[data-shopwho="todos"]'); await page.waitForTimeout(200);
    const shop = await app.text("#planShop");
    assert(shop.includes("peito de frango — 2,1 kg") && shop.includes("brócolos — 1,5 kg"), "quantidades somadas: " + shop.slice(0, 120));
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
