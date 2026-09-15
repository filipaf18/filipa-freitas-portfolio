import { open, assert, eq } from "./harness.mjs";
import { MEAL, PROFILES } from "./fakes.mjs";
/** Chat: "hoje ao almoço vou fazer X, que quantidades?" fixa o almoço no plano de hoje e a app reequilibra o resto do dia (lanche, jantar em família só a minha porção). */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const hoje = DAYS[(new Date().getDay() + 6) % 7];
  const plate = (g) => ({ itens: [
    { alimento: "peito de frango grelhado", quantidade: `${g} g`, estado: "cru", medida_caseira: "1 bife", grupo: "proteina" },
    { alimento: "arroz integral", quantidade: "100 g", estado: "cozinhado", medida_caseira: "4 c. sopa", grupo: "hidratos" }],
    ordem: ["proteína", "hidratos"], kcal: 400 + g, proteina_g: 35, hidratos_g: 40, gordura_g: 12, fibra_g: 4, nota: "" });
  const jantar = { nome: "Jantar", hora: "20:30", base: "Frango grelhado com arroz", preparacao: "Grelhar o frango.", componentes: [], por_pessoa: { filipa: plate(120), pai: plate(160) } };
  const myJantar = { ...MEAL("Jantar", "20:30", 520, 35), itens: plate(120).itens, familia: true, base_comum: jantar.base };
  const store = { ...PROFILES,
    "profiles/pai": { name: "Jorge", sex: "masculino", height_cm: 180, weight_kg: 77, objetivo: "manter" },
    "plans/filipa": { profile: "filipa", version: 1, week_start: "2026-09-14", previous: null, extras: [], changelog: [], plan: { metas_diarias: { kcal: 1500, proteina_g: 100, fibra_g: 25 }, racional: "r", hidratacao: [],
      dias: DAYS.map((d) => ({ dia: d, refeicoes: [MEAL("Pequeno-almoço", "08:00", 350, 25), MEAL("Almoço", "13:00", 460, 38), MEAL("Lanche", "17:00", 200, 12), myJantar] })) } },
    "family/plan": { week_start: "2026-09-14", version: 1, pessoas: ["filipa", "pai"], com_almoco: false, dias: DAYS.map((d) => ({ dia: d, jantar })), preparacao_antecipada: [] },
  };
  const CHAT = `
    const last = Array.isArray(input) ? input[input.length - 1].content : String(input);
    const t = Object.fromEntries((opts?.tools || []).map((x) => [x.name, x]));
    window.__toolResults = window.__toolResults || []; window.__toolNames = Object.keys(t);
    if (t.fixar_refeicao && /massa com frango/.test(last)) {
      try { window.__toolResults.push(await t.fixar_refeicao.execute({ refeicao: "Almoço", preparacao: "Cozer o macarrão; saltear o frango com a polpa; parmesão no fim.", itens: [
        { alimento: "macarrão", quantidade: "60 g", estado: "seco" }, { alimento: "peito de frango grelhado", quantidade: "130 g", estado: "cozinhado" },
        { alimento: "queijo parmesão", quantidade: "15 g" }, { alimento: "polpa de tomate", quantidade: "110 g" }, { alimento: "azeite", quantidade: "5 g" }], kcal: 490, proteina_g: 49, fibra_g: 4 })); }
      catch (e) { window.__toolResults.push({ erro: e.message }); }
      return "Ficam estas quantidades: macarrão 60 g seco, frango 130 g cozinhado, parmesão 15 g. Já está no plano de hoje.";
    }
    return "Resposta de teste.";`;
  const JSONF = `
    const t = String(input); window.__json = window.__json || []; window.__json.push(t);
    if (t.includes("Reequilibra")) return { refeicoes: [
      { nome: "Lanche", hora: "17:00", ordem: [], itens: [{ alimento: "iogurte grego natural", quantidade: "150 g", estado: "", medida_caseira: "1 copo", grupo: "lacticinio" }], preparacao: "", porque: "leve, proteico", alternativas: [], kcal: 120, proteina_g: 15, hidratos_g: 6, gordura_g: 4, fibra_g: 0 },
      { nome: "Jantar", hora: "20:30", ordem: ["proteína", "hidratos"], itens: [{ alimento: "peito de frango grelhado", quantidade: "90 g", estado: "cru", medida_caseira: "1 bife pequeno", grupo: "proteina" }, { alimento: "arroz integral", quantidade: "60 g", estado: "cozinhado", medida_caseira: "2 c. sopa", grupo: "hidratos" }], preparacao: "Grelhar o frango.", porque: "porção menor porque o almoço foi maior", alternativas: [], kcal: 300, proteina_g: 30, hidratos_g: 25, gordura_g: 8, fibra_g: 2 } ] };
    return {};`;
  const app = await open({ store, sample: CHAT, sampleJson: JSONF });
  const { page } = app;
  try {
    await app.go("hoje"); await page.waitForTimeout(300);
    await page.click('#todayMeals [data-adh="Pequeno-almoço"][data-st="comi"]'); await page.waitForTimeout(300);
    await app.go("chat");
    await page.fill("#chatInput", "Hoje para almoçar vou fazer uma massa com frango, polpa de tomate e parmesão. Diz-me as quantidades."); await page.click("#sendChat");
    await page.waitForTimeout(2500);
    const res = (await page.evaluate(() => window.__toolResults))[0];
    assert(res?.ok, "a ferramenta fixou o almoço: " + JSON.stringify(res).slice(0, 200));
    eq(res.dia, hoje, "no dia de hoje");
    assert(res.refeicao.itens.includes("macarrão 60 g") && res.refeicao.kcal > 300 && res.refeicao.proteina_g > 30, "refeição e macros devolvidos: " + JSON.stringify(res.refeicao));
    assert(res.proximo_passo.includes("Lanche") && res.proximo_passo.includes("Jantar") && res.proximo_passo.includes("NÃO uses atualizar_refeicoes"), "diz ao modelo que a app reequilibra");
    assert((await page.evaluate(() => window.__toolNames)).includes("fixar_refeicao"), "ferramenta disponível");
    // o plano de hoje: almoço fixado, lanche e jantar ajustados
    const st = await app.dump();
    const dia = st["plans/filipa"].plan.dias.find((d) => d.dia === hoje);
    const alm = dia.refeicoes.find((m) => m.nome === "Almoço");
    assert(alm.itens.some((i) => i.alimento === "macarrão" && i.quantidade === "60 g" && i.estado === "seco") && alm.propria === true, "almoço de hoje é o que a pessoa disse: " + JSON.stringify(alm.itens));
    eq(alm.hora, "13:00", "manteve a hora");
    assert(alm.preparacao.includes("macarrão"), "preparação guardada");
    eq(dia.refeicoes.find((m) => m.nome === "Lanche").itens[0].alimento, "iogurte grego natural", "lanche ajustado");
    const jan = dia.refeicoes.find((m) => m.nome === "Jantar");
    eq(jan.familia, true, "o jantar continua em família");
    eq(jan.itens[0].quantidade, "90 g", "a minha porção do jantar em família ficou mais pequena");
    eq(st["family/plan"].dias.find((d) => d.dia === hoje).jantar.por_pessoa.filipa.itens[0].quantidade, "90 g", "a porção na família também");
    eq(st["family/plan"].dias.find((d) => d.dia === hoje).jantar.por_pessoa.pai.itens[0].quantidade, "160 g", "o pai fica igual");
    eq(dia.refeicoes.find((m) => m.nome === "Pequeno-almoço").itens[1].quantidade, "130 g", "o pequeno-almoço já comido não mudou");
    eq(st["plans/filipa"].version, 3, "duas versões: fixar e reequilibrar");
    // o pedido de reequilíbrio: o que já conta e o que falta
    const reb = (await page.evaluate(() => window.__json)).find((x) => x.includes("Reequilibra"));
    assert(reb.includes('"Pequeno-almoço"') && reb.includes("REFEIÇÕES FIXAS") && reb.includes("O QUE FALTA"), "prompt com fixas e o que falta");
    assert(/REFEIÇÕES A AJUSTAR[^\n]*"Lanche"[^\n]*"Jantar"/.test(reb) && /"familia":true/.test(reb), "a ajustar: lanche e jantar (em família)");
    assert(!/REFEIÇÕES A AJUSTAR[^\n]*"Almoço"/.test(reb), "o almoço fixado não está a ajustar");
    // o chat conta o que mudou, e Hoje deixa marcar o almoço como comido
    const msgs = st["chat/filipa"].messages;
    assert(msgs.at(-1).content.startsWith("🔁 Ajustei o resto de") && msgs.at(-1).content.includes("Lanche: iogurte") && msgs.at(-1).content.includes("só a tua porção"), "mensagem de ajuste: " + msgs.at(-1).content);
    await app.go("hoje"); await page.waitForTimeout(200);
    assert((await app.text("#todayMeals")).includes("macarrão"), "Hoje mostra o almoço novo");
    await page.click(`#todayMeals [data-adh="Almoço"][data-st="comi"]`); await page.waitForTimeout(300);
    const eaten = await page.evaluate(() => window.NG_TEST.eatenToday());
    assert(eaten.comido.kcal > 600, "o almoço comido conta nos macros: " + eaten.comido.kcal);
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
