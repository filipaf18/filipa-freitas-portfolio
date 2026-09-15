import { open, assert, eq } from "./harness.mjs";
import { MEAL, CHAT_TEXT } from "./fakes.mjs";
/** Horário das refeições: lido das notas, aplicado ao plano, respeitado na geração, e mudado num dia pelo chat. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const dayIdx = (new Date().getDay() + 6) % 7; const hoje = DAYS[dayIdx], amanha = DAYS[(dayIdx + 1) % 7];
  const snack = () => ({ ...MEAL("Meio da manhã", "11:00", 140, 8), itens: [{ alimento: "maçã", quantidade: "150 g", estado: "crua", medida_caseira: "1 peça", grupo: "fruta" }, { alimento: "amêndoa", quantidade: "15 g", estado: "crua", medida_caseira: "12 unidades", grupo: "gordura" }] });
  const oldDay = (d) => ({ dia: d, refeicoes: [MEAL("Pequeno-almoço", "08:00", 350, 25), snack(), MEAL("Almoço", "13:00", 420, 35), MEAL("Lanche", "16:30", 180, 15), MEAL("Jantar", "19:30", 320, 30)] });
  const store = {
    "profiles/filipa": { name: "F", sex: "feminino", birth_date: "2001-01-18", height_cm: 160, weight_kg: 64.5, objetivo: "perder", family: false, notes: "Horário de pequeno almoço: 10 da manhã\nHorário de jantar: 20h-21h", meds: [], titrations: [] },
    "profiles/mae": { name: "M", sex: "feminino", birth_date: "1973-04-21", height_cm: 165, weight_kg: 78.7, objetivo: "perder", family: false, meds: [], titrations: [] },
    "plans/filipa": { profile: "filipa", version: 1, week_start: "2026-09-14", previous: null, extras: [], changelog: [], plan: { metas_diarias: { kcal: 1400 }, racional: "r", hidratacao: [], dias: DAYS.map(oldDay) } },
  };
  const GEN = `
    const t = String(input); window.__gen = window.__gen || []; window.__gen.push(t);
    if (t.includes("define a ESTRUTURA")) return { metas_diarias: { kcal: 1400, proteina_g: 95 }, racional: "r", hidratacao: [], estrutura_do_dia: [] };
    const m = t.match(/destes dias: ([^\\n.]+)/);
    if (m) return { dias: m[1].split(", ").map((d) => ({ dia: d, refeicoes: [${JSON.stringify(MEAL("Pequeno-almoço", "08:00", 350, 25))}, ${JSON.stringify(MEAL("Meio da manhã", "11:00", 140, 8))}, ${JSON.stringify(MEAL("Almoço", "13:00", 420, 35))}, ${JSON.stringify(MEAL("Lanche", "16:30", 180, 15))}, ${JSON.stringify(MEAL("Jantar", "19:30", 320, 30))}] })) };
    return {};`;
  const CHAT = `
    const last = Array.isArray(input) ? input[input.length - 1].content : String(input);
    const t = Object.fromEntries((opts?.tools || []).map((x) => [x.name, x]));
    window.__ctx = Array.isArray(input) ? input[0].content : "";
    if (t.ajustar_horario && /7 da manha|às 7|as 7/.test(last)) { window.__res = await t.ajustar_horario.execute({ dia: "${amanha}", refeicao: "Pequeno-almoço", hora: "07:00", motivo: "consulta cedo" }); return "Amanhã o pequeno-almoço passa para as 7."; }
    return "ok";`;
  const app = await open({ store, sample: CHAT, sampleJson: GEN });
  const { page } = app;
  try {
    // 1. as notas dão o horário; o pequeno-almoço às 10 não deixa meio da manhã
    const slots = await page.evaluate(() => window.NG_TEST.mealSlots(window.__store["profiles/filipa"]).map((s) => `${s.nome} ${s.hora}`));
    eq(JSON.stringify(slots), '["Pequeno-almoço 10:00","Almoço 13:00","Lanche 16:30","Jantar 20:30"]', "horário lido das notas: " + JSON.stringify(slots));
    const notas = await page.evaluate(() => window.NG_TEST.parseMealTimesFromNotes("Almoço às 12h30; lanche 5 da tarde; ceia: 22:00"));
    eq(JSON.stringify(notas), '{"almoco":"12:30","lanche":"17:00","ceia":"22:00"}', "vários formatos de hora: " + JSON.stringify(notas));
    // 2. o perfil mostra o horário e, ao guardar, o plano atual passa para as horas certas
    const kcalAntes = await page.evaluate(() => window.NG_TEST.dayMacros(window.__store["plans/filipa"].plan.dias[0]).kcal);
    await app.go("perfil"); await page.waitForTimeout(200);
    eq(await page.inputValue('[data-mt="pequeno_almoco"]'), "10:00", "campo do pequeno-almoço preenchido das notas");
    eq(await page.inputValue('[data-mt="meio_manha"]'), "", "meio da manhã vazio");
    await page.click("#saveProfile"); await page.waitForTimeout(500);
    let st = await app.dump();
    eq(st["profiles/filipa"].meal_times_set, true, "horário guardado");
    eq(st["profiles/filipa"].meal_times.jantar, "20:30", "jantar às 20:30 guardado");
    eq(st["plans/filipa"].version, 2, "plano posto no horário");
    const seg = st["plans/filipa"].plan.dias[0];
    eq(seg.refeicoes.map((m) => `${m.nome} ${m.hora}`).join(", "), "Pequeno-almoço 10:00, Almoço 13:00, Lanche 16:30, Jantar 20:30", "refeições nas horas certas: " + seg.refeicoes.map((m) => `${m.nome} ${m.hora}`).join(", "));
    assert(seg.refeicoes[0].itens.some((i) => i.alimento === "maçã"), "o meio da manhã fundiu no pequeno-almoço");
    const kcal = await page.evaluate(() => window.NG_TEST.dayMacros(window.__store["plans/filipa"].plan.dias[0]).kcal);
    assert(Math.abs(kcal - kcalAntes) <= 0.08 * kcalAntes, `energia do dia mantida: ${kcalAntes} → ${kcal}`);
    // 3. gerar de novo: a estrutura é a do horário, mesmo que o modelo devolva outra
    await app.go("plano"); await page.click("#regenPlan"); await page.waitForTimeout(200); await page.click(".modal [data-yes]"); await page.waitForTimeout(2500);
    st = await app.dump();
    const gen = await page.evaluate(() => window.__gen);
    assert(gen[0].includes("Pequeno-almoço às 10:00") && gen[0].includes("Jantar às 20:30"), "o pedido leva o horário obrigatório");
    const d0 = st["plans/filipa"].plan.dias[0];
    eq(d0.refeicoes.map((m) => m.hora).join(","), "10:00,13:00,16:30,20:30", "plano gerado nas horas da pessoa: " + d0.refeicoes.map((m) => `${m.nome} ${m.hora}`).join(", "));
    assert(!d0.refeicoes.some((m) => m.nome === "Meio da manhã"), "sem meio da manhã");
    // 4. no chat: "amanhã tomo o pequeno-almoço às 7" muda só esse dia
    await app.go("chat"); await page.fill("#chatInput", "amanhã tomo o pequeno-almoço às 7 da manhã"); await page.click("#sendChat"); await page.waitForTimeout(1200);
    const res = await page.evaluate(() => window.__res);
    eq(res.ok, true, "ferramenta correu: " + JSON.stringify(res));
    assert(res.intervalos_longos.length === 1 && res.intervalos_longos[0].horas === 6, "avisa do intervalo de 6 horas: " + JSON.stringify(res.intervalos_longos));
    st = await app.dump();
    const dAm = st["plans/filipa"].plan.dias.find((d) => d.dia === amanha), dOutro = st["plans/filipa"].plan.dias.find((d) => d.dia !== amanha);
    eq(dAm.refeicoes[0].hora, "07:00", "amanhã às 7");
    eq(dOutro.refeicoes[0].hora, "10:00", "os outros dias ficam às 10");
    assert(st["plans/filipa"].changelog.at(-1).o_que.includes("07:00"), "registo da alteração");
    assert((await page.evaluate(() => window.__ctx)).includes("horario_das_refeicoes"), "o chat conhece o horário");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
