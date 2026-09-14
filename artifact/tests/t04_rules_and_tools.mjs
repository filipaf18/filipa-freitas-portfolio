import { open, assert, eq } from "./harness.mjs";
import { PLAN_JSON, CHAT_TEXT, PROFILES } from "./fakes.mjs";
/** Regras pelo perfil e pelo chat; extra fora do plano ajusta o jantar; tensão pelo chat. */
export default async function () {
  const app = await open({ store: { ...PROFILES }, sample: CHAT_TEXT, sampleJson: PLAN_JSON });
  const { page } = app;
  try {
    const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
    await page.evaluate((d) => { window.__todayName = d; }, DAYS[(new Date().getDay() + 6) % 7]);
    await app.go("perfil"); await page.fill("#r_text", "Jantar até às 20h"); await page.click('#rulesForm button[type=submit]'); await page.waitForTimeout(300);
    await app.go("chat"); await page.fill("#chatInput", "como sempre os legumes primeiro"); await page.click("#sendChat"); await page.waitForTimeout(900);
    const d = await app.dump();
    eq(d["rules/filipa"].entries.length, 2, "duas regras guardadas (perfil + chat)");
    await app.go("plano"); await page.click("#genPlan"); await page.waitForTimeout(2500);
    await app.go("chat"); await page.fill("#chatInput", "comi um pastel de nata ao lanche"); await page.click("#sendChat"); await page.waitForTimeout(1200);
    const res = await page.evaluate(() => window.__toolResults);
    assert(res.some((r) => r.registado?.descricao === "pastel de nata"), "extra registado");
    assert(res.some((r) => r.aplicado?.[0]?.includes("Jantar")), "jantar de hoje ajustado: " + JSON.stringify(res).slice(0, 200));
    await page.fill("#chatInput", "hoje tive 135/85"); await page.click("#sendChat"); await page.waitForTimeout(900);
    const d2 = await app.dump();
    eq(d2["vitals/filipa"].entries.length, 1, "tensão registada pelo chat");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
