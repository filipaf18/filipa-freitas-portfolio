import { open, assert, eq } from "./harness.mjs";
import { MEAL, PROFILES } from "./fakes.mjs";
/** Falha a meio da geração: um upstream_error é repetido uma vez; se falhar outra vez, o próximo "Gerar" continua de onde ficou. */
export default async function () {
  const JSONF = `
    const t = String(input); window.__k = window.__k || { frame: 0, b1: 0, b2: 0, outros: 0 };
    if (t.includes("define a ESTRUTURA")) { window.__k.frame++; if (window.__k.frame === 1) throw { code: "upstream_error", message: "ligação caiu" };
      return { metas_diarias: { kcal: 1500, proteina_g: 100, fibra_g: 25, agua_ml: 2100 }, racional: "r", porques: [], principios: [], hidratacao: [], estrutura_do_dia: [] }; }
    const m = t.match(/destes dias: ([^\\n.]+)/);
    if (m && m[1].startsWith("segunda")) { window.__k.b1++; return { dias: m[1].split(", ").map((d) => ({ dia: d, refeicoes: [${JSON.stringify(MEAL("Pequeno-almoço", "08:00", 320, 25))}, ${JSON.stringify(MEAL("Jantar", "20:30", 500, 30))}] })) }; }
    if (m) { window.__k.b2++; (window.__seq = window.__seq || []).push(m[1] + "#" + window.__k.b2); if (window.__k.b2 <= 6) throw { code: "upstream_error", message: "ligação caiu" };
      return { dias: m[1].split(", ").map((d) => ({ dia: d, refeicoes: [${JSON.stringify(MEAL("Pequeno-almoço", "08:00", 320, 25))}, ${JSON.stringify(MEAL("Jantar", "20:30", 500, 30))}] })) }; }
    window.__k.outros++; return { lista: [] };`;
  const app = await open({ store: { ...PROFILES }, sampleJson: JSONF });
  const { page } = app;
  try {
    await app.go("plano"); await page.click("#genPlan"); await page.waitForTimeout(21000);
    let k = await page.evaluate(() => window.__k);
    eq(k.frame, 2, "a estrutura falhou uma vez e foi repetida sozinha");
    eq(k.b1, 1, "o primeiro bloco de dias saiu à primeira");
    const seq = await page.evaluate(() => window.__seq);
    eq(seq.join(" | "), "sexta, sábado, domingo#1 | sexta, sábado, domingo#2 | sexta, sábado#3 | sexta, sábado#4 | sexta#5 | sexta#6", "bloco, repetição, metades, repetições: " + seq.join(" | "));
    const note = await app.text("#planNote");
    assert(note.includes("falhou a meio") && note.includes("continua de onde ficou"), "avisa que o próximo Gerar continua: " + note);
    assert(!(await app.dump())["plans/filipa"], "sem plano guardado ainda");
    // segunda tentativa: só o bloco em falta
    await page.click("#genPlan"); await page.waitForTimeout(3000);
    k = await page.evaluate(() => window.__k);
    eq(k.frame, 2, "a estrutura não foi pedida outra vez");
    eq(k.b1, 1, "o primeiro bloco não foi pedido outra vez");
    eq(k.b2, 7, "só o segundo bloco foi pedido outra vez");
    const plan = (await app.dump())["plans/filipa"];
    assert(plan && plan.plan.dias.length === 7 && plan.plan.dias.every((d) => d.refeicoes.length === 2), "plano completo com os 7 dias");
    eq(plan.plan.dias.map((d) => d.dia).join(","), "segunda,terça,quarta,quinta,sexta,sábado,domingo", "dias pela ordem");
    eq(await page.evaluate(() => Object.keys(window.NG_TEST.drafts()).length), 0, "rascunho apagado depois de guardar");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
