import { open, assert, eq } from "./harness.mjs";
import { PLAN_JSON, PROFILES } from "./fakes.mjs";
/** Gerar, regenerar (com confirm() bloqueado como na app) e repor o plano. */
export default async function () {
  const app = await open({ store: { ...PROFILES }, sampleJson: PLAN_JSON });
  const { page } = app;
  try {
    await page.click('[data-view="plano"]'); await page.click("#genPlan"); await page.waitForTimeout(2200);
    assert((await app.text("#planMeta")).includes("Versão 1"), "primeiro plano");
    await page.click("#regenPlan"); await page.waitForTimeout(300);
    assert(await page.isVisible(".modal"), "diálogo próprio aparece");
    await page.click(".modal [data-yes]"); await page.waitForTimeout(2200);
    assert((await app.text("#planMeta")).includes("Versão 2"), "regenerou");
    await page.click("#regenPlan"); await page.waitForTimeout(200); await page.click(".modal [data-no]"); await page.waitForTimeout(300);
    assert((await app.text("#planMeta")).includes("Versão 2"), "cancelar não altera");
    await page.click("#undoPlan"); await page.waitForTimeout(200); await page.click(".modal [data-yes]"); await page.waitForTimeout(500);
    assert((await app.text("#planMeta")).includes("Reposta versão anterior"), "repôs a versão anterior");
    const calls = await app.calls();
    eq(calls.filter((c) => c.kind === "json").length, 8, "4 pedidos por plano × 2");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
