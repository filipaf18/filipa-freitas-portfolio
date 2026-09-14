import { open, assert, eq, makePdf } from "./harness.mjs";
import { PLAN_JSON, CHAT_TEXT, PROFILES } from "./fakes.mjs";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
/** Todas as escritas funcionam contra uma base de dados que congela os snapshots e já tem histórico. */
export default async function () {
  const store = { ...PROFILES,
    "chat/mae": { profile: "mae", messages: [{ at: "2026-09-14T13:30:27.249Z", role: "user", content: "📎 Análises.pdf" }] },
    "labs/mae": { profile: "mae", entries: [{ id: "l0", date: "2026-01-02", marker: "hba1c", label: "HbA1c", value: 5.9, unit: "%", lo: 4, hi: 5.7, notes: "" }] },
    "vitals/mae": { profile: "mae", entries: [{ id: "v0", date: "2026-01-02", time: "09:00", sys: 130, dia: 84, pulse: 70, source: "" }] } };
  const app = await open({ store, sample: CHAT_TEXT, sampleJson: PLAN_JSON });
  const { page } = app;
  try {
    await page.click('[data-pid="mae"]'); await page.waitForTimeout(400);
    await app.go("chat");
    const pdf = path.join(here, "fixtures", "analises.pdf"); fs.writeFileSync(pdf, makePdf(["Analises Clinicas - Lab Central", "Colheita: 10/09/2026", "Hemoglobina glicada (HbA1c)  5,4 %  (4,0-5,7)", "Colesterol LDL  148 mg/dL  (<115)", "Ferritina  9 ng/mL  (15-150)", "Tensao arterial: 138/88 mmHg, pulso 72"]));
    await page.setInputFiles("#fileInput", pdf); await page.click("#sendChat"); await page.waitForTimeout(2500);
    assert((await app.text("#chatLog")).includes("3 análises registadas"), "leitura do PDF regista as 3 análises (a HbA1c antiga é de outra data)");
    await page.fill("#chatInput", "e agora?"); await page.click("#sendChat"); await page.waitForTimeout(800);
    await page.fill("#chatInput", "hoje tive 135/85"); await page.click("#sendChat"); await page.waitForTimeout(800);
    const d = await app.dump();
    eq(d["chat/mae"].messages.length, 7, "mensagens guardadas");
    eq(d["vitals/mae"].entries.length, 3, "tensões: antiga + PDF + chat");
    eq(d["labs/mae"].entries.length, 4, "análises: antiga + 3 do PDF");
    // análise manual, corpo, água, perfil
    await app.go("analises"); await page.selectOption("#l_marker", "ferritina"); await page.fill("#l_value", "11"); await page.click('#labForm button[type=submit]'); await page.waitForTimeout(300);
    await app.go("corpo"); await page.fill("#c_weight", "77.5"); await page.fill("#c_fat", "38"); await page.fill("#c_muscle", "34"); await page.click('#bodyForm button[type=submit]'); await page.waitForTimeout(400);
    await app.go("hoje"); await page.click("#view-hoje details summary"); await page.click('#quickAdd1 [data-ml="250"]'); await page.waitForTimeout(300);
    await app.go("plano"); await page.click("#genPlan"); await page.waitForTimeout(2500);
    const d2 = await app.dump();
    eq(d2["labs/mae"].entries.length, 5, "análise manual guardada");
    eq(d2["body/mae"].entries.length, 1, "medição corporal guardada");
    eq(d2["profiles/mae"].weight_kg, 77.5, "peso do perfil acompanha a medição");
    assert(Object.keys(d2).some((k) => k.startsWith("water/mae_")), "água guardada");
    assert(d2["plans/mae"]?.plan?.dias?.length === 7, "plano gerado com 7 dias");
    eq(app.errs.length, 0, "sem erros de página: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
