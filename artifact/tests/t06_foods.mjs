import { open, assert, eq } from "./harness.mjs";
import { PROFILES } from "./fakes.mjs";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
/** A tabela de alimentos reconhece os itens dos planos reais e calcula macros plausíveis. */
export default async function () {
  const planF = JSON.parse(fs.readFileSync(path.join(here, "fixtures", "plan_filipa.json"), "utf8"));
  const planM = JSON.parse(fs.readFileSync(path.join(here, "fixtures", "plan_mae.json"), "utf8"));
  const app = await open({ store: { ...PROFILES, "plans/filipa": planF, "plans/mae": planM } });
  const { page } = app;
  try {
    const stats = await page.evaluate(([pf, pm]) => {
      const T = window.NG_TEST; const out = {};
      for (const [who, p] of [["filipa", pf], ["mae", pm]]) {
        let meals = 0, computed = 0, items = 0, hit = 0, unknown = new Set(); const days = [];
        for (const d of p.plan.dias) {
          for (const m of d.refeicoes) { meals++; const mm = T.mealMacros(m); if (mm.computed) computed++; mm.rows.forEach((r) => { items++; if (r.ok) hit++; else unknown.add(r.alimento + " · " + r.quantidade); }); }
          days.push(Math.round(T.dayMacros(d).kcal));
        }
        out[who] = { meals, computed, items, hit, unknown: [...unknown], days, alvo: p.plan.metas_diarias.kcal };
      }
      out.unit = { ovo: T.gramsOf("2 unidades", T.findFood("ovo")), cs: T.gramsOf("1 c. sopa", T.findFood("azeite")), kg: T.gramsOf("1,5 kg", null), qb: T.gramsOf("q.b.", null), conc: T.gramsOf("1 concha", T.findFood("sopa de legumes")) };
      out.match = { a: T.findFood("Peito de frango grelhado (sem pele)")?.nome, b: T.findFood("amêndoas")?.nome, c: T.findFood("iogurte grego natural 0%")?.nome, d: T.findFood("arroz integral cozido")?.nome, e: T.findFood("ovos mexidos")?.nome, f: T.findFood("brócolos cozidos")?.nome };
      return out;
    }, [planF, planM]);
    console.log("   filipa:", `${stats.filipa.hit}/${stats.filipa.items} itens reconhecidos, ${stats.filipa.computed}/${stats.filipa.meals} refeições calculadas, kcal/dia ${stats.filipa.days.join(",")} (alvo ${stats.filipa.alvo})`);
    console.log("   mae:   ", `${stats.mae.hit}/${stats.mae.items} itens reconhecidos, ${stats.mae.computed}/${stats.mae.meals} refeições calculadas, kcal/dia ${stats.mae.days.join(",")} (alvo ${stats.mae.alvo})`);
    if (stats.filipa.unknown.length || stats.mae.unknown.length) console.log("   não reconhecidos:", [...stats.filipa.unknown, ...stats.mae.unknown].slice(0, 30).join(" | "));
    eq(stats.unit.ovo, 110, "2 ovos = 110 g"); eq(stats.unit.cs, 10, "1 c. sopa de azeite = 10 g"); eq(stats.unit.kg, 1500, "1,5 kg"); eq(stats.unit.qb, 0, "q.b. = 0"); eq(stats.unit.conc, 150, "1 concha = 150 g");
    eq(stats.match.a, "peito de frango grelhado", "reconhece com parêntesis"); eq(stats.match.b, "amêndoa", "plural"); eq(stats.match.c, "iogurte grego natural 0%", "alias exato"); eq(stats.match.d, "arroz integral cozido", "estado no nome"); eq(stats.match.e, "ovos mexidos", "prato"); eq(stats.match.f, "brócolos cozidos", "hortícola");
    assert(stats.filipa.hit / stats.filipa.items >= 0.9, "≥ 90 % dos itens do plano real da Filipa reconhecidos");
    assert(stats.mae.hit / stats.mae.items >= 0.85, "≥ 85 % dos itens do plano real da mãe reconhecidos");
    for (const who of ["filipa", "mae"]) for (const k of stats[who].days) assert(k > 900 && k < 2400, `kcal do dia plausíveis (${who}: ${k})`);
    // editor de refeição
    await app.go("plano"); await page.waitForTimeout(300);
    await page.click('[data-editmeal]'); await page.waitForTimeout(200);
    assert(await page.isVisible(".modal .editor"), "editor abre");
    const before = await app.text("#edtot");
    await page.click("[data-add]"); await page.fill(".edrow:last-child [data-f=alimento]", "pescada"); await page.fill(".edrow:last-child [data-f=quantidade]", "150 g"); await page.waitForTimeout(100);
    const after = await app.text("#edtot");
    assert(before !== after, "totais mudam ao acrescentar item");
    await page.click("[data-save]"); await page.waitForTimeout(500);
    assert((await app.text("#planMeta")).includes("editada à mão"), "alteração registada no histórico do plano");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
