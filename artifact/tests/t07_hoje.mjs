import { open, assert, eq } from "./harness.mjs";
import { PROFILES } from "./fakes.mjs";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
/** Hoje: ciclo da injeção, próxima refeição com adesão, sintomas e sinais de alarme. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const injDay = DAYS[(DAYS.indexOf(today) - 1 + 7) % 7]; // injeção ontem → dia 1
  const plan = JSON.parse(fs.readFileSync(path.join(here, "fixtures", "plan_filipa.json"), "utf8"));
  const store = { ...PROFILES, "profiles/filipa": { ...PROFILES["profiles/filipa"], uses_glp1: true, glp1_inj_day: injDay, glp1_dose: "2,5 mg" }, "plans/filipa": plan };
  const app = await open({ store });
  const { page } = app;
  try {
    eq(await app.text("#cycleTag"), "Dia 1 depois da injeção", "etiqueta do ciclo");
    assert(!(await page.isHidden("#lightDayNote")), "nota de dia leve visível");
    assert(!(await page.isHidden("#nextMealCard")), "cartão da próxima refeição");
    const label = await app.text("#nextMealLabel");
    assert(/Próxima refeição|Refeição em atraso/.test(label), "rótulo da próxima refeição: " + label);
    const mealName = await page.evaluate(() => document.querySelector("#nextMealBody h2")?.textContent);
    assert(mealName, "nome da refeição");
    // comi
    await page.click('#nextMealActions [data-st="comi"]'); await page.waitForTimeout(400);
    let d = await app.dump(); const day = Object.keys(d["adherence/filipa"].days)[0];
    eq(d["adherence/filipa"].days[day][mealName].status, "comi", "adesão guardada");
    assert((await app.text("#adherenceSummary")).startsWith("1 seguida"), "resumo de adesão: " + await app.text("#adherenceSummary"));
    // a próxima passa a ser outra refeição
    const next2 = await page.evaluate(() => document.querySelector("#nextMealBody h2")?.textContent);
    assert(next2 && next2 !== mealName, "a próxima refeição avança: " + next2);
    // comi outra coisa
    await page.click('#nextMealActions [data-st="outro"]'); await page.waitForTimeout(200);
    assert(!(await page.isHidden("#nextMealOther")), "campo de texto aparece");
    await page.fill("#otherText", "sopa e uma sandes de queijo"); await page.click("#otherSave"); await page.waitForTimeout(400);
    d = await app.dump();
    eq(d["adherence/filipa"].days[day][next2].status, "outro", "outra coisa guardada");
    eq(d["adherence/filipa"].days[day][next2].texto, "sopa e uma sandes de queijo", "texto guardado");
    assert((await app.text("#todayMeals")).includes("↪ sopa e uma sandes"), "texto aparece na lista");
    // sintomas e alarme
    assert(await page.isHidden("#alarmBanner"), "sem alarme inicialmente");
    await page.click('[data-sym="nauseas"][data-val="2"]'); await page.waitForTimeout(300);
    assert((await app.text("#lightDayNote")).length > 40, "dicas do dia leve com náuseas");
    await page.click('[data-sym="dor_intensa"][data-val="sim"]'); await page.waitForTimeout(300);
    assert(!(await page.isHidden("#alarmBanner")) && (await app.text("#alarmBanner")).includes("pancreatite"), "alarme de dor intensa");
    await page.click('[data-sym="dor_intensa"][data-val="sim"]'); await page.waitForTimeout(300); // desmarcar
    assert(await page.isHidden("#alarmBanner"), "alarme desaparece ao desmarcar");
    d = await app.dump();
    eq(String(d["symptoms/filipa"].days[day].nauseas), "2", "sintoma guardado");
    await page.screenshot({ path: path.join(here, ".preview", "hoje.png"), fullPage: true });
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
