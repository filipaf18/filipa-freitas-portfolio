import { open, assert, eq } from "./harness.mjs";
import { CHAT_TEXT, PROFILES } from "./fakes.mjs";
/** Memória destilada: de 12 em 12 mensagens o chat passa regras e gostos para rules/prefs, sem repetir. */
export default async function () {
  const at = (i) => new Date(Date.now() - (30 - i) * 60000).toISOString();
  const msgs = []; for (let i = 0; i < 11; i++) msgs.push({ role: i % 2 ? "assistant" : "user", content: i === 4 ? "não gosto nada de peixe, prefiro frango" : `mensagem ${i}`, at: at(i) });
  const store = { ...PROFILES, "chat/filipa": { profile: "filipa", messages: msgs }, "rules/filipa": { profile: "filipa", entries: [{ id: "r1", texto: "Jantar até às 20h", origem: "perfil", at: at(0) }] } };
  const MEM_JSON = `
    const t = String(input); window.__memCalls = (window.__memCalls || 0) + 1; window.__memPrompt = t;
    if (t.includes("MEMÓRIA de longo prazo")) return { regras: ["Jantar até às 20h", "Comer a proteína antes dos hidratos"], gostei: ["frango"], nao_gostei: ["peixe", "Peixe"] };
    return {};`;
  const app = await open({ store, sample: CHAT_TEXT, sampleJson: MEM_JSON });
  const { page } = app;
  try {
    await app.go("chat");
    eq(await page.evaluate(() => window.NG_TEST.undistilled()), 11, "11 mensagens por destilar");
    await page.fill("#chatInput", "olá"); await page.click("#sendChat"); await page.waitForTimeout(1200);
    let st = await app.dump();
    eq(await page.evaluate(() => window.__memCalls), 1, "uma destilação depois da 12.ª mensagem");
    eq(st["rules/filipa"].entries.length, 2, "regra nova guardada, a repetida não");
    eq(st["rules/filipa"].entries[1].origem, "chat", "origem chat");
    eq(st["prefs/filipa"].entries.length, 2, "frango e peixe, sem duplicar Peixe");
    eq(st["prefs/filipa"].entries.find((p) => p.itens === "peixe").voto, -1, "peixe é não gosto");
    assert(st["chat/filipa"].memory_upto, "marcador guardado no chat");
    eq(await page.evaluate(() => window.NG_TEST.undistilled()), 0, "nada por destilar");
    const prompt = await page.evaluate(() => window.__memPrompt);
    assert(prompt.includes("não gosto nada de peixe") && prompt.includes('"Jantar até às 20h"'), "conversa e regras já guardadas no pedido");
    await page.fill("#chatInput", "outra"); await page.click("#sendChat"); await page.waitForTimeout(900);
    eq(await page.evaluate(() => window.__memCalls), 1, "não destila outra vez antes de 12 mensagens novas");
    eq(await page.evaluate(() => window.NG_TEST.undistilled()), 2, "duas mensagens novas por destilar");
    const sum = await page.evaluate(() => window.NG_TEST.prefsSummary());
    eq(sum.nao_gostei[0], "peixe", "preferência do chat sem prefixo de refeição");
    await app.go("perfil");
    const pl = await app.text("#prefsList");
    assert(pl.includes("👎 peixe") && pl.includes("👍 frango") && pl.includes("do chat"), "preferências listadas no perfil");
    await page.click('[data-delpref]'); await page.waitForTimeout(300);
    eq((await app.dump())["prefs/filipa"].entries.length, 1, "remover preferência");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
