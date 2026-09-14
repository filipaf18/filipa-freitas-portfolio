import { open, assert, eq } from "./harness.mjs";
/** Quatro perfis, objetivos diferentes e refeições em família: base comum, prato de cada um. */
export default async function () {
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const store = {
    "profiles/filipa": { name: "Filipa", sex: "feminino", birth_date: "2001-01-18", height_cm: 160, weight_kg: 65, target_kg: 58, objetivo: "perder", activity: "pouco_ativa", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/mae": { name: "Alexandra", sex: "feminino", birth_date: "1970-05-02", height_cm: 165, weight_kg: 78, target_kg: 65, objetivo: "perder", uses_glp1: true, glp1_dose: "2.5 mg", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/pai": { name: "Jorge", sex: "masculino", birth_date: "1968-03-10", height_cm: 178, weight_kg: 80, objetivo: "manter", activity: "ativa", allergies: [], intolerances: [], dislikes: [], meds: [], titrations: [] },
    "profiles/vitoria": { name: "Vitória", sex: "feminino", birth_date: "2005-07-21", height_cm: 168, weight_kg: 60, objetivo: "manter", activity: "ativa", allergies: [], intolerances: [], dislikes: ["legumes", "leguminosas"], meds: [], titrations: [] },
  };
  const plate = (perfil, g, semLegumes) => ({ perfil, itens: [
    { alimento: "peito de frango grelhado", quantidade: `${g} g`, estado: "cru", medida_caseira: "1 bife", grupo: "proteina" },
    ...(semLegumes ? [] : [{ alimento: "brócolos", quantidade: "150 g", estado: "cozidos", medida_caseira: "1 chávena", grupo: "legumes" }]),
    { alimento: "arroz integral", quantidade: `${g} g`, estado: "cozinhado", medida_caseira: "4 c. sopa", grupo: "hidratos" },
  ], ordem: ["legumes", "proteína", "hidratos"], kcal: 400 + g, proteina_g: 35, hidratos_g: 40, gordura_g: 12, fibra_g: semLegumes ? 3 : 8, nota: semLegumes ? "sem brócolos, leva mais arroz" : "" });
  const SAMPLE = `
    const t = String(input); window.__p = window.__p || []; window.__p.push(t.slice(0, 60));
    if (t.includes("Passo 1 de 3")) { window.__menu = t; return { dias: ${JSON.stringify(DAYS)}.map((d) => ({ dia: d,
      jantar: { nome: "Jantar", hora: "20:30", base: "Frango grelhado com brócolos e arroz", preparacao: "Grelhar o frango e cozer o arroz para todos.", componentes: [
        { componente: "proteína", alimento: "peito de frango grelhado", grupo: "proteina", quem_leva: "todos" },
        { componente: "legumes", alimento: "brócolos", grupo: "legumes", quem_leva: ["filipa", "mae", "pai"] }] },
      almoco: { nome: "Almoço", hora: "13:00", base: "Marmita de atum com grão", preparacao: "Preparar ao domingo.", marmita: { preparar_em: "domingo", conservacao: "frigorífico até 3 dias", montagem: "Montar em caixas individuais." }, componentes: [] } })),
      preparacao_antecipada: ["Domingo: grelhar 1,2 kg de frango"] }; }
    if (t.includes("QUANTIDADES")) { const dias = t.match(/QUANTIDADES de cada pessoa para ([^\\n.]+)\\./)[1].split(", ");
      return { dias: dias.map((d) => ({ dia: d, refeicoes: [
        { refeicao: "Jantar", por_pessoa: [${"${plate}"}] },
        { refeicao: "Almoço", por_pessoa: [${"${plate}"}] }] })) }; }
    if (t.includes("lista de compras")) return { lista_compras: [{ categoria: "Proteína", itens: [{ alimento: "peito de frango", quantidade: "2,1 kg" }] }] };
    return {};`.replace(/\$\{plate\}/g, JSON.stringify([plate("filipa", 120, false), plate("mae", 110, false), plate("pai", 160, false), plate("vitoria", 130, true)]).slice(1, -1));
  const app = await open({ store, sampleJson: SAMPLE });
  const { page } = app;
  try {
    // quatro perfis no seletor
    eq(await page.evaluate(() => document.querySelectorAll("#who button").length), 4, "quatro perfis");
    eq(await app.text("#who"), "FilipaAlexandraJorgeVitória", "nomes no seletor");
    // objetivos: sem défice para quem só quer equilibrar
    const t = await page.evaluate(() => ["filipa", "pai", "vitoria"].map((id) => window.NG_TEST.householdContext().pessoas.find((x) => x.perfil === id)));
    eq(t[0].objetivo, "perder peso", "Filipa quer perder peso");
    eq(t[1].objetivo, "manter o peso e comer equilibrado", "o pai só quer equilibrar");
    assert(t[1].energia_alvo_kcal > 2000, "o pai fica na manutenção: " + t[1].energia_alvo_kcal);
    assert(t[0].energia_alvo_kcal < t[1].energia_alvo_kcal, "quem perde peso leva menos energia");
    eq(JSON.stringify(t[2].nao_come), '["legumes","leguminosas"]', "o que a Vitória não come");

    await app.go("plano");
    eq(await page.evaluate(() => document.querySelectorAll("#familyWho input:checked").length), 4, "os quatro entram na família");
    await page.click("#genFamily"); await page.waitForTimeout(2600);
    const st = await app.dump();
    const fam = st["family/plan"];
    assert(fam, "refeições em família guardadas");
    eq(fam.pessoas.length, 4, "quatro pessoas");
    eq(fam.dias.length, 7, "sete dias");
    eq(fam.dias[0].jantar.base, "Frango grelhado com brócolos e arroz", "base comum");
    eq(fam.dias[0].almoco.marmita.preparar_em, "domingo", "almoço em marmita");
    // o mesmo prato para todos, com quantidades diferentes e sem legumes para a Vitória
    for (const id of ["filipa", "mae", "pai", "vitoria"]) {
      const plan = st[`plans/${id}`];
      assert(plan, `plano criado para ${id}`);
      const seg = plan.plan.dias.find((d) => d.dia === "segunda");
      const jantar = seg.refeicoes.find((m) => m.nome === "Jantar");
      assert(jantar, `jantar de ${id}`);
      eq(jantar.familia, true, `jantar de ${id} marcado como família`);
      eq(jantar.base_comum, "Frango grelhado com brócolos e arroz", `base comum no plano de ${id}`);
      const almoco = seg.refeicoes.find((m) => m.nome === "Almoço");
      eq(almoco.marmita.conservacao, "frigorífico até 3 dias", `marmita de ${id}`);
      const temLegumes = jantar.itens.some((i) => i.alimento === "brócolos");
      eq(temLegumes, id !== "vitoria", `legumes no prato de ${id}`);
      eq(seg.refeicoes[0].hora, "13:00", "refeições ordenadas pela hora");
    }
    const jF = st["plans/filipa"].plan.dias[0].refeicoes.find((m) => m.nome === "Jantar");
    const jP = st["plans/pai"].plan.dias[0].refeicoes.find((m) => m.nome === "Jantar");
    eq(jF.itens[0].quantidade, "120 g", "quantidade da Filipa");
    eq(jP.itens[0].quantidade, "160 g", "quantidade do pai");
    assert(await page.isVisible("#familyBody .fammeal"), "semana apresentada");
    assert((await app.text("#familyBody")).includes("sem brócolos"), "a nota da Vitória aparece");
    // lista de compras da família
    assert(!(await page.isHidden("#planShopCard")), "lista de compras visível");
    assert((await app.text("#shopNote")).includes("refeições em família"), "a lista é a da família: " + (await app.text("#shopNote")));
    assert((await app.text("#planShop")).includes("peito de frango"), "itens da lista");
    eq(app.errs.length, 0, "sem erros: " + app.errs.join(" | "));
  } finally { await app.close(); }
}
