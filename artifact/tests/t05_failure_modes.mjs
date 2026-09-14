import { open, assert, eq } from "./harness.mjs";
import { PROFILES } from "./fakes.mjs";
/** Sem assistente: mensagem clara, anexos mantidos, botão ativo. Diagnóstico visível. */
export default async function () {
  const app = await open({ store: { ...PROFILES }, sample: null });
  const { page } = app;
  try {
    await page.click('[data-view="chat"]'); await page.fill("#chatInput", "olá"); await page.click("#sendChat"); await page.waitForTimeout(400);
    assert((await app.text("#sampleNote")).includes("não está disponível"), "nota de assistente indisponível");
    assert(!(await page.isDisabled("#sendChat")), "botão Enviar continua ativo");
    assert((await app.text("#diagText")).includes("chat (sample): não"), "diagnóstico mostra o estado");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
