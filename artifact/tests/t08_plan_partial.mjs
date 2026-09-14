import { open, assert, eq } from "./harness.mjs";
import { PLAN_JSON, PROFILES, MEAL } from "./fakes.mjs";
/** Gostei/não gostei, trocar uma refeição e refazer um dia. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const mkPlan = (proteina) => ({ profile: "x", version: 1, week_start: "2026-09-14", previous: null, extras: [], changelog: [], plan: {
    metas_diarias: { kcal: 1500, proteina_g: 110 }, racional: "r", principios: ["p"], regras_aplicadas: [], hidratacao: [{ hora: "08:00", quantidade_ml: 250, nota: "ao acordar" }],
    dias: DAYS.map((d) => { const j = MEAL("Jantar", "19:30", 420, 34); j.itens[1].alimento = proteina; return { dia: d, refeicoes: [MEAL("Pequeno-almoço", "08:00", 320, 25), MEAL("Almoço", "13:00", 460, 38), j] }; }) } });
  const store = { ...PROFILES, "plans/filipa": { ...mkPlan("peito de frango grelhado"), profile: "filipa" }, "plans/mae": { ...mkPlan("bacalhau cozido"), profile: "mae" } };
  const app = await open({ store, sampleJson: PLAN_JSON });
  const { page } = app;
  try {
    await app.go("plano"); await page.waitForTimeout(300);
    assert((await app.text("#planMeta")).includes("Versão 1"), "plano carregado");
    const day = await page.getAttribute("#regenDay", "data-regenday");
    assert(DAYS.includes(day), "botão de refazer aponta para o dia selecionado");

    // 1. gostei / não gostei fica guardado em prefs/<pid>
    await page.click(`[data-like="${day}|2|-1"]`); await page.waitForTimeout(300);
    let st = await app.dump();
    eq(st["prefs/filipa"].entries.length, 1, "uma preferência guardada");
    eq(st["prefs/filipa"].entries[0].voto, -1, "não gostei");
    eq(await page.getAttribute(`[data-like="${day}|2|-1"]`, "aria-pressed"), "true", "botão marcado");
    await page.click(`[data-like="${day}|2|1"]`); await page.waitForTimeout(300);
    st = await app.dump();
    eq(st["prefs/filipa"].entries.length, 1, "mudar o voto substitui, não acumula");
    eq(st["prefs/filipa"].entries[0].voto, 1, "gostei");
    await page.click(`[data-like="${day}|2|1"]`); await page.waitForTimeout(300);
    eq((await app.dump())["prefs/filipa"].entries.length, 0, "repetir o voto remove-o");
    await page.click(`[data-like="${day}|1|-1"]`); await page.waitForTimeout(300);
    const prefs = await page.evaluate(() => window.NG_TEST.prefsSummary());
    eq(prefs.nao_gostei.length, 1, "resumo das preferências");
    assert(prefs.nao_gostei[0].startsWith("Almoço:"), "resumo com nome da refeição");

    // 2. trocar só uma refeição: um pedido, versão sobe, só essa refeição muda e as preferências vão no prompt
    await page.click(`[data-swapmeal="${day}|2"]`); await page.waitForTimeout(600);
    st = await app.dump();
    eq(st["plans/filipa"].version, 2, "versão 2 depois da troca");
    const dia = st["plans/filipa"].plan.dias.find((d) => d.dia === day);
    eq(dia.refeicoes[2].itens[1].alimento, "pescada cozida", "jantar trocado");
    eq(dia.refeicoes[1].itens[1].alimento, "peito de frango grelhado", "almoço intacto");
    eq(st["plans/filipa"].plan.dias.filter((d) => d.dia !== day).every((d) => d.refeicoes[2].itens[1].alimento === "peito de frango grelhado"), true, "outros dias intactos");
    assert(st["plans/filipa"].changelog.at(-1).o_que.includes("trocada"), "changelog");
    let calls = await app.calls();
    const swap = calls.filter((c) => c.kind === "json").at(-1);
    assert(swap.input.includes("PREFERÊNCIAS REGISTADAS") && swap.input.includes("Almoço:"), "preferências entram no pedido");
    assert(swap.input.includes("SUBSTITUI apenas esta refeição"), "pedido de troca");
    assert((await app.text("#planMeta")).includes("Versão 2"), "meta atualizada");

    // 3. refazer só um dia
    await page.click("#regenDay"); await page.waitForTimeout(600);
    st = await app.dump();
    eq(st["plans/filipa"].version, 3, "versão 3 depois de refazer o dia");
    const dia2 = st["plans/filipa"].plan.dias.find((d) => d.dia === day);
    eq(dia2.refeicoes.length, 3, "dia refeito com 3 refeições");
    eq(dia2.refeicoes[2].itens[1].alimento, "peito de frango grelhado", "dia refeito veio da resposta (fake)");
    eq(st["plans/filipa"].plan.dias.length, 7, "semana continua com 7 dias");
    calls = await app.calls();
    const rd = calls.filter((c) => c.kind === "json").at(-1);
    assert(rd.input.includes(`destes dias: ${day}.`) && rd.input.includes("Os outros dias mantêm-se"), "pedido de refazer o dia");
    eq(calls.filter((c) => c.kind === "json").length, 2, "só um pedido por operação");
    await page.click("#undoPlan"); await page.waitForTimeout(200); await page.click(".modal [data-yes]"); await page.waitForTimeout(400);
    eq((await app.dump())["plans/filipa"].version, 4, "repor a versão anterior continua a funcionar");

    // 4. o perfil da mãe fica intacto
    await page.click('[data-pid="mae"]'); await page.waitForTimeout(400);
    st = await app.dump();
    eq(st["plans/mae"].version, 1, "plano da mãe intacto");
    eq(st["profiles/mae"].weight_kg, 78, "perfil da mãe intacto");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
