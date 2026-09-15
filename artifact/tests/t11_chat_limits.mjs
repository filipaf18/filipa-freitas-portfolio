import { open, assert, eq } from "./harness.mjs";
import { PROFILES, MEAL } from "./fakes.mjs";
/** O chat cabe no limite de bytes, recupera de prompt_too_large e sem ferramentas, e trava alterações em massa. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const store = { ...PROFILES,
    "plans/filipa": { profile: "filipa", version: 1, week_start: "2026-09-14", previous: null, extras: [], changelog: [],
      plan: { metas_diarias: { kcal: 1500, proteina_g: 110 }, racional: "r", hidratacao: [{ hora: "08:00", quantidade_ml: 250, nota: "ao acordar" }],
        dias: DAYS.map((d) => ({ dia: d, refeicoes: ["Pequeno-almoço", "Meio da manhã", "Almoço", "Lanche", "Jantar"].map((n, i) => MEAL(n, `0${8 + i * 3}:00`.slice(-5), 320, 25)) })) } },
    "labs/filipa": { profile: "filipa", entries: Array.from({ length: 10 }, (_, i) => ({ id: "l" + i, date: "2026-08-03", marker: "outro", label: `Análise ${i}`, value: i, unit: "mg/dL", lo: 10, hi: 20 })) },
  };
  // 1.ª chamada rebenta com prompt_too_large; a 2.ª responde
  const S1 = `
    window.__c = window.__c || [];
    window.__c.push({ bytes: input.reduce((a, t) => a + new TextEncoder().encode(t.content).length, 0), tools: (opts?.tools || []).length });
    if (window.__c.length === 1) throw { code: "prompt_too_large", message: "over 64 KiB" };
    const t = Object.fromEntries((opts?.tools || []).map((x) => [x.name, x]));
    try {
      const muitas = [];
      for (const d of ${JSON.stringify(DAYS)}) for (const r of ["Almoço", "Jantar"]) muitas.push({ dia: d, refeicao: r, nova: { itens: [{ alimento: "peito de frango grelhado", quantidade: "150 g" }], proteina_g: 40, fibra_g: 4 } });
      await t.atualizar_refeicoes.execute({ motivo: "sem legumes", alteracoes: muitas });
      window.__big = "passou";
    } catch (e) { window.__big = e?.message || String(e); }
    await t.guardar_regra.execute({ regra: "Não como legumes nem leguminosas" });
    return "Guardei a regra.";`;
  const app = await open({ store, sample: S1, sampleJson: `return {};` });
  const { page } = app;
  try {
    await app.go("chat");
    await page.fill("#chatInput", "não gosto de legumes nem leguminosas, ajusta o plano"); await page.click("#sendChat");
    await page.waitForTimeout(1500);
    const calls = await page.evaluate(() => window.__c);
    eq(calls.length, 2, "repetiu o pedido depois de prompt_too_large");
    assert(calls[0].bytes < 20000, `1.º pedido já vem apertado: ${calls[0].bytes} bytes`);
    assert(calls[1].bytes < calls[0].bytes, `a repetição vai mais curta: ${calls[1].bytes} < ${calls[0].bytes}`);
    eq(calls[1].tools, 5, "a repetição mantém as ferramentas");
    const big = await page.evaluate(() => window.__big);
    assert(big.includes("máximo é 8") && big.includes("guardar_regra"), "alteração em massa travada com explicação: " + big);
    const st = await app.dump();
    eq(st["plans/filipa"].version, 1, "o plano não foi reescrito em massa");
    eq(st["rules/filipa"].entries.length, 1, "a regra ficou guardada");
    const log = await app.text("#chatLog");
    assert(log.includes("Guardei a regra.") && !log.includes("⚠️"), "a pessoa recebeu resposta, sem erro");
    assert((await app.text("#diagText")).includes("prompt_too_large"), "o diagnóstico regista o que aconteceu");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }

  // já no contexto mínimo não vale a pena repetir: gasta e falha na mesma
  const gordo = { ...store, "labs/filipa": { profile: "filipa", entries: Array.from({ length: 60 }, (_, i) => ({ id: "g" + i, date: "2026-08-03", marker: "outro", label: `Análise número ${i} com um nome muito comprido para ocupar espaço`, value: i, unit: "mg/dL", lo: 10, hi: 20, notes: "de um relatório com um título bastante longo" })) } };
  const app2 = await open({ store: gordo, sample: `window.__n = (window.__n || 0) + 1; throw { code: "prompt_too_large", message: "over 64 KiB" };`, sampleJson: `return {};`, limits: { maxPromptBytes: 4096, tools: { maxCount: 8 } } });
  try {
    await app2.go("chat");
    await app2.page.fill("#chatInput", "olá"); await app2.page.click("#sendChat");
    await app2.page.waitForTimeout(1200);
    eq(await app2.page.evaluate(() => window.__n), 1, "não repete quando não há mais nada para cortar");
    const log2 = await app2.text("#chatLog");
    assert(log2.includes("prompt_too_large") && log2.includes("dia a dia"), "explica o que fazer: " + log2.slice(-160));
    eq(app2.errs.length, 0, "sem erros: " + app2.errs.join(" | "));
  } finally { await app2.close(); }

  // todas as rondas gastas em ferramentas e nenhuma escreveu: responde à mesma, sem ferramentas
  const app3 = await open({ store, sampleJson: `return {};`, sample: `
    window.__k = window.__k || [];
    window.__k.push((opts?.tools || []).length);
    if (opts?.tools) throw { code: "empty_completion", message: "no round produced text" };
    window.__last = input[input.length - 1].content;
    return "Guardei a regra e o plano novo geras na aba Plano.";` });
  try {
    await app3.go("chat");
    await app3.page.fill("#chatInput", "não como leguminosas"); await app3.page.click("#sendChat");
    await app3.page.waitForTimeout(1200);
    eq(JSON.stringify(await app3.page.evaluate(() => window.__k)), "[5,0]", "segunda tentativa sem ferramentas");
    assert((await app3.page.evaluate(() => window.__last)).includes("só em texto"), "pede resposta escrita");
    const log3 = await app3.text("#chatLog");
    assert(log3.includes("aba Plano") && !log3.includes("⚠️"), "a pessoa recebeu resposta: " + log3.slice(-120));
    eq(app3.errs.length, 0, "sem erros: " + app3.errs.join(" | "));
  } finally { await app3.close(); }
}
