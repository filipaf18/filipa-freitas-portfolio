import { open, assert, eq } from "./harness.mjs";
import { MEAL } from "./fakes.mjs";
/** "Refazer tudo para a família": refeições em família primeiro, depois o plano de cada um dos quatro com os seus dados, e a lista de compras no fim. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const store = {
    "profiles/filipa": { name: "Filipa", sex: "feminino", birth_date: "2001-01-18", height_cm: 160, weight_kg: 65, target_kg: 58, objetivo: "perder", activity: "pouco_ativa", notes: "Pequeno-almoço às 10h.", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/mae": { name: "Alexandra", sex: "feminino", birth_date: "1970-05-02", height_cm: 165, weight_kg: 78, target_kg: 65, objetivo: "perder", uses_glp1: true, glp1_dose: "2.5 mg", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/pai": { name: "Jorge", sex: "masculino", birth_date: "1968-03-10", height_cm: 178, weight_kg: 80, objetivo: "manter", activity: "ativa", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/vitoria": { name: "Vitória", sex: "feminino", birth_date: "2005-07-21", height_cm: 168, weight_kg: 60, objetivo: "manter", activity: "ativa", allergies: [], intolerances: [], dislikes: ["legumes", "leguminosas"], meds: [], titrations: [] },
    "plans/pai": { profile: "pai", week_start: "2026-09-14", version: 3, plan: { metas_diarias: { kcal: 2300 }, dias: DAYS.map((d) => ({ dia: d, refeicoes: [MEAL("Almoço", "13:00", 600, 40)] })) }, changelog: [] },
    "rules/vitoria": { profile: "vitoria", entries: [{ id: "r1", texto: "Sem cafeína depois das 16h", origem: "perfil", at: "2026-09-01T10:00:00Z" }] },
  };
  const plate = (perfil, g, semLegumes) => ({ perfil, itens: [
    { alimento: "salmão no forno", quantidade: `${g} g`, estado: "cru", medida_caseira: "1 posta", grupo: "proteina" },
    ...(semLegumes ? [] : [{ alimento: "espinafres", quantidade: "150 g", estado: "salteados", medida_caseira: "1 chávena", grupo: "legumes" }]),
    { alimento: "batata-doce", quantidade: `${g} g`, estado: "assada", medida_caseira: "1 média", grupo: "hidratos" },
  ], ordem: ["legumes", "proteína", "hidratos"], kcal: 420 + g, proteina_g: 34, hidratos_g: 38, gordura_g: 15, fibra_g: semLegumes ? 4 : 8, nota: semLegumes ? "sem espinafres" : "" });
  const PLATES = JSON.stringify([plate("filipa", 120, false), plate("mae", 110, false), plate("pai", 170, false), plate("vitoria", 140, true)]);
  const SAMPLE = `
    const t = String(input); window.__p = window.__p || []; window.__p.push(t);
    if (t.includes("escreve a EMENTA")) return { dias: ${JSON.stringify(DAYS)}.map((d) => ({ dia: d,
      jantar: { nome: "Jantar", hora: "20:30", base: "Salmão no forno com batata-doce", preparacao: "Assar tudo no mesmo tabuleiro.", componentes: [
        { componente: "proteína", alimento: "salmão no forno", grupo: "proteina", quem_leva: "todos" },
        { componente: "legumes", alimento: "espinafres", grupo: "legumes", quem_leva: ["filipa", "mae", "pai"] }] },
      almoco: { nome: "Almoço", hora: "13:00", base: "Marmita de frango com quinoa", preparacao: "Preparar ao domingo.", marmita: { preparar_em: "domingo", conservacao: "frigorífico até 3 dias", montagem: "Caixas individuais." }, componentes: [] } })),
      preparacao_antecipada: ["Domingo: cozer 600 g de quinoa"] };
    if (t.includes("QUANTIDADES")) { const dias = t.match(/QUANTIDADES de cada pessoa para ([^\\n.]+)\\./)[1].split(", ");
      return { dias: dias.map((d) => ({ dia: d, refeicoes: [{ refeicao: "Jantar", por_pessoa: ${PLATES} }, { refeicao: "Almoço", por_pessoa: ${PLATES} }] })) }; }
    if (t.includes("define a ESTRUTURA")) { const nome = (t.match(/"nome":"([^"]+)"/) || [])[1] || "";
      return { metas_diarias: { kcal: nome === "Jorge" ? 2300 : 1500, proteina_g: 100, fibra_g: 25, agua_ml: 2100 }, racional: "Plano de " + nome, porques: [], principios: ["Proteína em todas as refeições"], hidratacao: [], estrutura_do_dia: [] }; }
    const m = t.match(/destes dias: ([^\\n.]+)/);
    if (m) return { dias: m[1].split(", ").map((d) => ({ dia: d, refeicoes: [${JSON.stringify(MEAL("Pequeno-almoço", "08:00", 320, 25))}, ${JSON.stringify(MEAL("Lanche", "17:00", 200, 12))}, ${JSON.stringify(MEAL("Jantar", "20:30", 500, 30))}] })) };
    if (t.includes("LISTA DE COMPRAS")) { window.__shopIn = t; return { lista: [{ corredor: "Peixaria", itens: [{ alimento: "salmão", quantidade: "1,9 kg", de: "", despensa: false }] }] }; }
    return {};`;
  const app = await open({ store, sampleJson: SAMPLE });
  const { page } = app;
  try {
    await app.go("plano");
    assert(!(await page.isHidden("#genAll")), "botão de refazer tudo visível sem plano");
    await page.click("#genAll"); await page.waitForTimeout(300);
    const modal = await app.text(".modal");
    assert(modal.includes("Filipa") && modal.includes("Vitória") && modal.includes("16 pedidos"), "a confirmação diz quem e quantos pedidos: " + modal);
    await page.click(".modal [data-yes]"); await page.waitForTimeout(6000);
    const st = await app.dump();
    const prompts = await page.evaluate(() => window.__p);
    eq(prompts.filter((x) => x.includes("escreve a EMENTA")).length, 1, "uma ementa em família");
    eq(prompts.filter((x) => x.includes("define a ESTRUTURA")).length, 4, "uma estrutura por pessoa");
    eq(prompts.filter((x) => /destes dias: /.test(x)).length, 8, "dois blocos de dias por pessoa");
    eq(prompts.filter((x) => x.includes("LISTA DE COMPRAS")).length, 1, "uma lista de compras no fim");
    eq(prompts.length, 16, "16 pedidos ao todo");
    assert(prompts.findIndex((x) => x.includes("escreve a EMENTA")) < prompts.findIndex((x) => x.includes("define a ESTRUTURA")), "família antes dos planos individuais");
    assert(prompts.findIndex((x) => x.includes("LISTA DE COMPRAS")) === prompts.length - 1, "compras no fim");
    // cada pessoa pediu com os seus dados
    const frames = prompts.filter((x) => x.includes("define a ESTRUTURA"));
    eq(frames.map((x) => (x.match(/"nome":"([^"]+)"/) || [])[1]).join(","), "Filipa,Alexandra,Jorge,Vitória", "um pedido por pessoa, pela ordem dos perfis");
    assert(frames[0].includes("Pequeno-almoço às 10:00"), "o horário da Filipa (10h) foi para o pedido dela");
    assert(!frames[2].includes("às 10:00"), "o pai não herda o horário da Filipa");
    assert(frames[3].includes("Sem cafeína depois das 16h") && !frames[0].includes("Sem cafeína"), "as regras da Vitória só vão no pedido dela");
    assert(frames.every((x) => x.includes("REFEIÇÕES EM FAMÍLIA JÁ FIXADAS")), "todos constroem o dia à volta das refeições em família");
    assert(frames[2].includes('"peso_atual_kg":80') && frames[1].includes('"dose_atual":"2.5 mg"'), "peso do pai e GLP-1 da mãe nos pedidos certos");
    // planos guardados
    eq(st["family/plan"].pessoas.length, 4, "refeições em família para os quatro");
    for (const id of ["filipa", "mae", "pai", "vitoria"]) {
      const plan = st[`plans/${id}`]; assert(plan, `plano de ${id}`);
      const seg = plan.plan.dias.find((d) => d.dia === "segunda");
      const jantar = seg.refeicoes.find((m) => m.nome === "Jantar");
      eq(jantar?.familia, true, `jantar de ${id} em família`);
      eq(jantar.base_comum, "Salmão no forno com batata-doce", `base comum em ${id}`);
      eq(jantar.itens.some((i) => i.alimento === "espinafres"), id !== "vitoria", `legumes no prato de ${id}`);
      assert(seg.refeicoes.some((m) => m.nome === "Lanche"), `o resto do dia de ${id} veio do plano individual`);
      eq(plan.changelog.at(-1).o_que, "Plano gerado para toda a família", `changelog de ${id}`);
    }
    eq(st["plans/pai"].version, 4, "o pai passou da versão 3 para a 4 (uma só versão nova)");
    eq(st["plans/pai"].previous.metas_diarias.kcal, 2300, "a versão anterior do pai ficou guardada");
    eq(st["plans/pai"].plan.metas_diarias.kcal, 2300, "as metas do pai vieram do pedido dele");
    eq(st["plans/filipa"].plan.metas_diarias.kcal, 1500, "as metas da Filipa vieram do pedido dela");
    eq(st["plans/filipa"].version, 1, "a Filipa ficou com a primeira versão");
    assert(st["plans/filipa"].plan.dias[0].refeicoes.find((m) => m.nome === "Pequeno-almoço").hora === "10:00", "o pequeno-almoço da Filipa ficou às 10h");
    const shopKey = Object.keys(st).find((k) => k.startsWith("shopping/"));
    assert(shopKey && st[shopKey].lista[0].corredor === "Peixaria", "lista de compras da casa guardada");
    assert((await page.evaluate(() => window.__shopIn)).includes("salmão no forno"), "a lista soma os planos novos");
    // o ecrã fica no perfil atual, com o plano novo
    assert((await app.text("#genMsg")).includes("Planos de toda a família gerados") || (await app.text("#planMealsList")).includes("Jantar"), "mensagem de sucesso ou plano à vista");
    assert(await page.isHidden("#planNote"), "sem aviso de falhas");
    assert(!(await page.evaluate(() => document.getElementById("genAll2").disabled)), "botão volta a ficar ativo");
    // o pai abre a app e vê o seu plano novo
    await page.click('[data-pid="pai"]'); await page.waitForTimeout(400);
    await app.go("plano"); await page.waitForTimeout(200);
    const mealsP = await app.text("#planMealsList");
    assert(mealsP.includes("Jantar") && mealsP.includes("em família") && mealsP.includes("Lanche"), "o pai vê o plano novo dele");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
