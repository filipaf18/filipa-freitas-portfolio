import { open, assert, eq } from "./harness.mjs";
import { PROFILES, MEAL } from "./fakes.mjs";
/** Revisão semanal: números calculados na página, pedido ao Claude, guardado em reviews/<pid> e usado no plano. */
export default async function () {
  const today = new Date(); const d = (i) => { const x = new Date(today); x.setDate(x.getDate() - i); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const plan = { profile: "filipa", version: 1, week_start: d(3), previous: null, extras: [{ id: "e1", date: d(2), descricao: "pastel de nata", kcal: 300 }], changelog: [],
    plan: { metas_diarias: { kcal: 1500, proteina_g: 110 }, racional: "r", hidratacao: [], dias: DAYS.map((x) => ({ dia: x, refeicoes: [MEAL("Almoço", "13:00", 460, 38), MEAL("Jantar", "19:30", 420, 34)] })) } };
  const store = { ...PROFILES, "plans/filipa": plan,
    "adherence/filipa": { profile: "filipa", days: { [d(1)]: { "Almoço": { status: "comi" }, "Jantar": { status: "saltei" } }, [d(2)]: { "Almoço": { status: "comi" }, "Jantar": { status: "outro", texto: "sopa" } }, [d(9)]: { "Almoço": { status: "saltei" } } } },
    "symptoms/filipa": { profile: "filipa", days: { [d(1)]: { nauseas: "2", transito: "obstipada" }, [d(3)]: { nauseas: "0" } } },
    ["water/filipa_" + d(1)]: { profile: "filipa", date: d(1), entries: [{ ml: 1000 }], total: 1000 },
    ["water/filipa_" + d(2)]: { profile: "filipa", date: d(2), entries: [{ ml: 2000 }], total: 2000 },
    "vitals/filipa": { profile: "filipa", entries: [{ id: "v1", date: d(1), sys: 130, dia: 85 }, { id: "v2", date: d(2), sys: 120, dia: 80 }, { id: "v0", date: d(10), sys: 140, dia: 90 }] },
    "body/filipa": { profile: "filipa", entries: [{ id: "b1", date: d(8), weight_kg: 66 }, { id: "b2", date: d(1), weight_kg: 65.2 }] },
  };
  const REVIEW_JSON = `
    const t = String(input); window.__revPrompt = t;
    if (t.includes("REVISÃO SEMANAL")) return { resumo: "Boa semana: seguiste 2 de 4 refeições e bebeste pouca água.", correu_bem: ["Almoços seguidos"], ajustar: ["Água: ficaste em 1500 ml"], propostas: [{ o_que: "Jantar mais leve nos dias 0-2", porque: "náuseas" }], para_o_medico: null };
    if (t.includes("Passo 1 de 3")) { window.__planPrompt = t; return { metas_diarias: { kcal: 1500 }, racional: "r", hidratacao: [], estrutura_do_dia: [] }; }
    const m = t.match(/destes dias: ([^\\n.]+)/); if (m) return { dias: m[1].split(", ").map((x) => ({ dia: x, refeicoes: [${JSON.stringify(MEAL("Almoço", "13:00", 460, 38))}] })) };
    return {};`;
  const app = await open({ store, sampleJson: REVIEW_JSON });
  const { page } = app;
  try {
    await app.go("hoje"); await page.waitForTimeout(300);
    const st = await page.evaluate(() => window.NG_TEST.weekStats());
    eq(st.adesao.refeicoes_registadas, 4, "só as refeições dos últimos 7 dias");
    eq(st.adesao.percentagem_seguida, 50, "50 % seguido");
    eq(st.agua.media_ml_dia, 1500, "média de água");
    eq(st.peso.delta_kg, -0.8, "variação de peso");
    eq(st.tensao.esta_semana.sis, 125, "tensão média da semana");
    eq(st.tensao.semana_anterior.sis, 140, "tensão da semana anterior");
    eq(st.sintomas.nauseas_moderadas_ou_fortes, 1, "náuseas contadas");
    eq(st.sintomas.obstipacao, 1, "obstipação contada");
    eq(st.fora_do_plano.length, 1, "extras da semana");
    assert(!(await page.isHidden("#reviewCard")), "cartão da revisão visível");
    assert((await app.text("#reviewBody")).includes("50 %"), "números na página antes de pedir");
    await page.click("#reviewBtn"); await page.waitForTimeout(600);
    const stored = await app.dump();
    eq(stored["reviews/filipa"].entries.length, 1, "revisão guardada");
    const r = stored["reviews/filipa"].entries[0];
    eq(r.propostas[0].o_que, "Jantar mais leve nos dias 0-2", "propostas guardadas");
    eq(r.stats.adesao.percentagem_seguida, 50, "números guardados com a revisão");
    const body = await app.text("#reviewBody");
    assert(body.includes("Boa semana") && body.includes("Propostas para o plano") && body.includes("Jantar mais leve"), "revisão apresentada");
    const prompt = await page.evaluate(() => window.__revPrompt);
    assert(prompt.includes('"percentagem_seguida":50') && prompt.includes("pastel de nata"), "números e extras no pedido");
    eq(await app.text("#reviewBtn"), "Nova revisão", "botão muda depois da primeira revisão");
    // a revisão entra na próxima geração do plano
    await app.go("plano"); await page.click("#regenPlan"); await page.waitForTimeout(200); await page.click(".modal [data-yes]"); await page.waitForTimeout(2200);
    const pp = await page.evaluate(() => window.__planPrompt);
    assert(pp.includes("ultima_revisao_semanal") && pp.includes("Jantar mais leve nos dias 0-2"), "propostas da revisão no pedido do plano");
    // perfil da mãe sem dados: cartão escondido, nada foi tocado
    await page.click('[data-pid="mae"]'); await page.waitForTimeout(400);
    assert(await page.isHidden("#reviewCard"), "sem dados, sem cartão");
    eq((await app.dump())["reviews/mae"], undefined, "nada escrito no perfil da mãe");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
