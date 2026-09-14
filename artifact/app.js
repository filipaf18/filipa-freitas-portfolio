(() => {
  "use strict";

  // ============================================================
  // Estado
  // ============================================================
  const PROFILE_IDS = ["filipa", "mae"];
  const DEFAULT_NAMES = { filipa: "Filipa", mae: "Mãe" };
  const PRESETS = [150, 250, 330, 500];
  const CHAT_KEEP = 200;

  const S = {
    db: null,
    sample: null,
    pid: null,
    profiles: {},          // id -> doc data
    water: new Map(),      // date -> {entries:[{ml,at}], total}
    chat: [],              // [{role, content, at}]
    weights: [],           // [{date, kg}]
    labs: [],              // [{id, date, marker, label, value, unit, lo, hi, notes}]
    vitals: [],            // tensão arterial [{id, date, time, sys, dia, pulse, source}]
    docs: [],              // documentos lidos [{id, date, tipo, titulo, resumo, pontos, at}]
    rules: [],             // regras alimentares pessoais [{id, texto, origem, at}]
    body: [],              // composição corporal [{id, date, weight_kg, fat_pct, muscle_kg, water_pct, visceral, bone_kg, notes}]
    bodyPick: "weight_kg",
    shopWho: null,         // perfil cuja lista de compras está a ser vista, ou "todos"
    plans: {},             // planos de todos os perfis, para a lista de compras conjunta
    edit: { body: null, lab: null, bp: null },
    attachments: [],       // ficheiros escolhidos no chat (File)
    imageLimits: null,
    diag: { sample: null, images: null, tools: null, db: null, saveErr: "", lastErr: "", step: "arranque" },
    plan: null,            // {week_start, version, plan:{...}, previous, changelog}
    planDay: null,
    labPick: null,
    generating: null,      // AbortController
    toolsOK: false,
    range: 7,
    view: "hoje",
    sub: null,
    unsub: [],
    streaming: null,       // AbortController
    memory: false,         // sem db: guarda em memória
  };

  const $ = (id) => document.getElementById(id);
  /** Confirmação dentro da página: confirm() do browser é bloqueado na janela da app. */
  function askConfirm(texto, okLabel = "Continuar") {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "modal";
      wrap.innerHTML = `<div class="box" role="dialog" aria-modal="true"><p></p><div class="row"><button type="button" class="btn" data-no>Cancelar</button><button type="button" class="btn primary" data-yes></button></div></div>`;
      wrap.querySelector("p").textContent = texto;
      wrap.querySelector("[data-yes]").textContent = okLabel;
      const done = (v) => { wrap.remove(); document.removeEventListener("keydown", onKey); resolve(v); };
      const onKey = (e) => { if (e.key === "Escape") done(false); };
      wrap.addEventListener("click", (e) => {
        if (e.target === wrap || e.target.closest("[data-no]")) done(false);
        else if (e.target.closest("[data-yes]")) done(true);
      });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(wrap);
      wrap.querySelector("[data-yes]").focus();
    });
  }
  /** Cópia editável: as leituras da base de dados chegam congeladas. */
  const thaw = (v) => { try { return v == null ? v : JSON.parse(JSON.stringify(v)); } catch { return v; } };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ============================================================
  // Datas
  // ============================================================
  const pad = (n) => String(n).padStart(2, "0");
  const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); return localDate(new Date(y, m - 1, d + n)); };
  const fmtTime = (iso) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const weekday = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", ""); };
  const ageFrom = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number); const t = new Date();
    let a = t.getFullYear() - y; if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--; return a;
  };
  const bmi = (h, w) => (h && w) ? Math.round((w / ((h / 100) ** 2)) * 10) / 10 : null;

  // ============================================================
  // Meta de água: ~33 ml/kg; GLP-1 +15 % e mín. 2000 ml; 1500–3500; arredonda a 50.
  // ============================================================
  function waterGoal(p) {
    if (p.water_goal_ml) return { ml: p.water_goal_ml, why: "meta definida manualmente" };
    const w = p.weight_kg || 60;
    const female = (p.sex || "feminino") !== "masculino";
    const piso = female ? 2000 : 2500;
    let g = Math.max(w * 33, piso);
    const parts = [`${w} kg × 33 ml, mínimo ${piso} ml`];
    if (p.uses_glp1) { g = g * 1.15; parts.push("+15 % por GLP-1, que reduz a sede"); }
    g = Math.round(Math.min(3500, Math.max(1500, g)) / 50) * 50;
    return { ml: g, why: parts.join(" · ") };
  }

  const profile = () => S.profiles[S.pid] || { name: DEFAULT_NAMES[S.pid] };

  // ============================================================
  // Persistência (db ou memória)
  // ============================================================
  const mem = { profiles: {}, water: {}, chat: {}, weights: {}, labs: {}, plans: {}, vitals: {}, docs: {}, rules: {}, body: {} };

  async function saveProfile(data) {
    S.profiles[S.pid] = data;
    if (S.db) await S.db.doc(`profiles/${S.pid}`).set(data); else mem.profiles[S.pid] = data;
    renderAll();
  }
  async function saveWaterDay(date, day) {
    S.water.set(date, day);
    const body = { profile: S.pid, date, entries: day.entries, total: day.total };
    if (S.db) await S.db.doc(`water/${S.pid}_${date}`).set(body); else mem.water[`${S.pid}_${date}`] = body;
    renderWater();
  }
  /** Guarda um documento; nunca rejeita — regista a falha no diagnóstico. */
  async function write(path, body, memBucket, memKey) {
    try {
      if (S.db) await S.db.doc(path).set(body); else memBucket[memKey] = body;
      return true;
    } catch (e) {
      console.warn("write", path, e);
      S.diag.saveErr = `${path}: ${e?.code || e?.name || "erro"} ${e?.message || ""}`.trim();
      memBucket[memKey] = body;
      renderDiag();
      return false;
    }
  }
  async function saveChat() {
    if (S.chat.length > CHAT_KEEP) S.chat = S.chat.slice(-CHAT_KEEP);
    await write(`chat/${S.pid}`, { profile: S.pid, messages: S.chat, updatedAt: new Date().toISOString() }, mem.chat, S.pid);
  }
  async function saveLabs() {
    await write(`labs/${S.pid}`, { profile: S.pid, entries: S.labs }, mem.labs, S.pid);
    renderLabs();
  }
  async function saveVitals() {
    S.vitals = [...S.vitals].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))).slice(-500);
    await write(`vitals/${S.pid}`, { profile: S.pid, entries: S.vitals }, mem.vitals, S.pid);
    renderVitals();
  }
  async function saveBody() {
    S.body = [...S.body].sort((a, b) => a.date.localeCompare(b.date)).slice(-400);
    await write(`body/${S.pid}`, { profile: S.pid, entries: S.body }, mem.body, S.pid);
    renderBody();
  }
  async function saveRules() {
    S.rules = S.rules.slice(-40);
    await write(`rules/${S.pid}`, { profile: S.pid, entries: S.rules }, mem.rules, S.pid);
    renderRules();
  }
  async function saveDocs() {
    S.docs = S.docs.slice(-50);
    await write(`docs/${S.pid}`, { profile: S.pid, entries: S.docs }, mem.docs, S.pid);
    renderDocs();
  }
  async function savePlan() {
    S.plans = { ...S.plans, [S.pid]: { ...S.plan, profile: S.pid } };
    await write(`plans/${S.pid}`, { ...S.plan, profile: S.pid }, mem.plans, S.pid);
    renderPlan(); renderHome();
  }
  async function saveWeights() {
    const body = { profile: S.pid, entries: S.weights };
    if (S.db) await S.db.doc(`weights/${S.pid}`).set(body); else mem.weights[S.pid] = body;
  }

  function unsubscribeAll() { S.unsub.forEach((u) => { try { u(); } catch {} }); S.unsub = []; }

  function subscribeProfile() {
    unsubscribeAll();
    S.water = new Map(); S.chat = []; S.weights = []; S.labs = []; S.plan = null; S.planDay = null; S.labPick = null; S.vitals = []; S.docs = []; S.rules = []; S.body = []; S.attachments = []; S.edit = { body: null, lab: null, bp: null };
    const from = addDays(localDate(), -29);
    if (!S.db) {
      const w = mem.water; for (const k in w) if (w[k].profile === S.pid) S.water.set(w[k].date, { entries: thaw(w[k].entries), total: w[k].total });
      S.chat = thaw(mem.chat[S.pid]?.messages) || []; S.weights = thaw(mem.weights[S.pid]?.entries) || [];
      S.labs = thaw(mem.labs[S.pid]?.entries) || []; S.plan = thaw(mem.plans[S.pid]) || null; S.plans = thaw(mem.plans) || {}; S.vitals = thaw(mem.vitals[S.pid]?.entries) || []; S.docs = thaw(mem.docs[S.pid]?.entries) || []; S.rules = thaw(mem.rules[S.pid]?.entries) || []; S.body = thaw(mem.body[S.pid]?.entries) || [];
      renderAll(); return;
    }
    S.unsub.push(S.db.collection("water").where("profile", "==", S.pid).where("date", ">=", from).onSnapshot((snap) => {
      S.water = new Map();
      snap.docs.forEach((d) => { const b = d.data(); S.water.set(b.date, { entries: thaw(b.entries) || [], total: b.total || 0 }); });
      renderWater();
    }, (e) => console.warn("water", e)));
    S.unsub.push(S.db.doc(`chat/${S.pid}`).onSnapshot((snap) => {
      if (S.streaming) return; // não sobrescrever durante uma resposta
      S.chat = snap.exists ? (thaw(snap.data().messages) || []) : [];
      renderChat();
    }, (e) => console.warn("chat", e)));
    S.unsub.push(S.db.doc(`weights/${S.pid}`).onSnapshot((snap) => {
      S.weights = snap.exists ? (thaw(snap.data().entries) || []) : [];
    }, (e) => console.warn("weights", e)));
    S.unsub.push(S.db.doc(`labs/${S.pid}`).onSnapshot((snap) => {
      S.labs = snap.exists ? (thaw(snap.data().entries) || []) : [];
      if (document.activeElement?.form?.id !== "labForm" && !S.edit.lab) renderLabs();
    }, (e) => console.warn("labs", e)));
    S.unsub.push(S.db.doc(`vitals/${S.pid}`).onSnapshot((snap) => {
      S.vitals = snap.exists ? (thaw(snap.data().entries) || []) : []; renderVitals();
    }, (e) => console.warn("vitals", e)));
    S.unsub.push(S.db.doc(`body/${S.pid}`).onSnapshot((snap) => {
      S.body = snap.exists ? (thaw(snap.data().entries) || []) : [];
      if (document.activeElement?.form?.id !== "bodyForm" && !S.edit.body) renderBody();
    }, (e) => console.warn("body", e)));
    S.unsub.push(S.db.doc(`rules/${S.pid}`).onSnapshot((snap) => {
      S.rules = snap.exists ? (thaw(snap.data().entries) || []) : [];
      if (document.activeElement?.id !== "r_text") renderRules();
    }, (e) => console.warn("rules", e)));
    S.unsub.push(S.db.doc(`docs/${S.pid}`).onSnapshot((snap) => {
      S.docs = snap.exists ? (thaw(snap.data().entries) || []) : []; renderDocs();
    }, (e) => console.warn("docs", e)));
    S.unsub.push(S.db.doc(`plans/${S.pid}`).onSnapshot((snap) => {
      if (S.generating) return;
      S.plan = snap.exists ? thaw(snap.data()) : null;
      renderPlan(); renderHome();
    }, (e) => console.warn("plans", e)));
    renderAll();
  }

  // ============================================================
  // Render: cabeçalho / navegação
  // ============================================================
  function renderWho() {
    $("who").innerHTML = PROFILE_IDS.map((id) =>
      `<button type="button" data-pid="${id}" aria-pressed="${id === S.pid}">${esc(S.profiles[id]?.name || DEFAULT_NAMES[id])}</button>`).join("");
  }
  // "Registar" agrupa as secções de registo; os nomes antigos continuam a funcionar como atalhos.
  const SUBS = ["agua", "corpo", "tensao", "analises", "docs"];
  function setView(v) {
    let sub = null;
    if (SUBS.includes(v)) { sub = v; v = "registar"; }
    S.view = v;
    document.querySelectorAll(".view").forEach((el) => el.classList.toggle("active", el.id === `view-${v}`));
    document.querySelectorAll("#tabs [role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === v)));
    if (v === "registar") setSub(sub || S.sub || (() => { try { return localStorage.getItem("nutriglp.sub"); } catch { return null; } })() || "agua");
    if (v === "chat") setTimeout(() => { $("chatLog").scrollTop = $("chatLog").scrollHeight; }, 0);
    window.scrollTo({ top: 0 });
  }
  function setSub(name) {
    if (!SUBS.includes(name)) name = "agua";
    S.sub = name;
    try { localStorage.setItem("nutriglp.sub", name); } catch {}
    document.querySelectorAll("#view-registar .sub").forEach((el) => { el.hidden = el.dataset.sub !== name; });
    document.querySelectorAll("#subnav [data-sub]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sub === name)));
    // os gráficos medem a largura do contentor: redesenhar quando a secção fica visível
    if (name === "agua") renderWater();
    if (name === "corpo" && S.body.length) renderBodyChart();
    if (name === "analises" && S.labs.length) renderLabChart();
  }

  // ============================================================
  // Render: hoje + água
  // ============================================================
  function todayDay() { return S.water.get(localDate()) || { entries: [], total: 0 }; }

  function renderQuickAdd(id) {
    $(id).innerHTML = PRESETS.map((ml) => `<button type="button" class="btn water sm num" data-ml="${ml}">+${ml} ml</button>`).join("") +
      `<form class="row" data-custom style="gap:6px"><input class="input num" type="number" inputmode="numeric" min="1" max="5000" placeholder="outro (ml)" style="width:120px" aria-label="Quantidade em ml"><button class="btn sm" type="submit">Adicionar</button></form>`;
  }

  function renderWater() {
    const p = profile(); const goal = waterGoal(p); const day = todayDay();
    const pct = Math.min(100, Math.round((day.total / goal.ml) * 100));
    for (const sfx of ["", "2"]) {
      $("todayTotal" + sfx).textContent = day.total;
      $("todayGoal" + sfx).textContent = `/ ${goal.ml} ml${sfx ? " hoje" : ""}`;
      $("todayPct" + sfx).textContent = `${pct}%`;
      $("todayBar" + sfx).style.width = `${pct}%`;
    }
    $("goalExplain").innerHTML = `Meta diária <strong class="num">${goal.ml} ml</strong> (${esc(goal.why)}). Podes ajustá-la no perfil.`;
    $("glp1tip").hidden = !p.uses_glp1;
    $("todayList").innerHTML = day.entries.length === 0
      ? `<li class="muted small">Ainda não registaste água hoje.</li>`
      : [...day.entries].reverse().map((e, i) => `<li><span><strong class="num">${e.ml} ml</strong> <span class="meta">às ${fmtTime(e.at)}</span></span><button type="button" class="btn ghost sm" data-del="${day.entries.length - 1 - i}">remover</button></li>`).join("");
    renderChart(goal.ml);
    renderTodaySchedule();
  }

  function renderChart(goalMl) {
    const today = localDate(); const n = S.range;
    const days = []; for (let i = n - 1; i >= 0; i--) { const d = addDays(today, -i); days.push({ date: d, total: S.water.get(d)?.total || 0 }); }
    const avg = Math.round(days.reduce((s, d) => s + d.total, 0) / n); const hit = days.filter((d) => d.total >= goalMl).length;
    $("chartStats").innerHTML = `Média <strong class="num">${avg} ml</strong> por dia · meta atingida em <strong class="num">${hit}/${n}</strong> dias`;

    const wrapEl = $("chart");
    const W = Math.max(300, Math.round(wrapEl.clientWidth || 720)), H = W < 480 ? 200 : 220, L = 40, R = 10, T = 16, B = 26;
    const maxV = Math.max(goalMl * 1.15, ...days.map((d) => d.total), 500);
    const yMax = Math.ceil(maxV / 500) * 500;
    const iw = W - L - R, ih = H - T - B;
    const y = (v) => T + ih - (v / yMax) * ih;
    const slot = iw / n; const bw = Math.max(4, Math.min(28, slot - 6));
    let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Água por dia, últimos ${n} dias">`;
    g += `<g class="grid">`; for (let v = 0; v <= yMax; v += 500) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`; g += `</g>`;
    g += `<g class="axis">`; for (let v = 0; v <= yMax; v += 1000) g += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v >= 1000 ? (v / 1000) + " L" : v}</text>`;
    days.forEach((d, i) => { const show = n === 7 || i % 5 === 0 || i === n - 1; if (show) g += `<text x="${L + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle">${n === 7 ? weekday(d.date) : d.date.slice(8)}</text>`; });
    g += `</g>`;
    days.forEach((d, i) => {
      const x = L + slot * i + (slot - bw) / 2; const top = y(d.total); const h = Math.max(0, T + ih - top);
      if (d.total > 0) g += `<rect class="bar-rect" x="${x}" y="${top}" width="${bw}" height="${h}" rx="4" ry="4"/>`;
      g += `<rect class="hit-area" x="${L + slot * i}" y="${T}" width="${slot}" height="${ih}" data-i="${i}"/>`;
    });
    g += `<g class="goal"><line x1="${L}" x2="${W - R}" y1="${y(goalMl)}" y2="${y(goalMl)}"/><text x="${W - R}" y="${y(goalMl) - 4}" text-anchor="end">meta ${goalMl} ml</text></g>`;
    g += `</svg>`;
    const wrap = $("chart"); const tip = $("tip"); wrap.innerHTML = g; wrap.appendChild(tip);
    wrap.querySelectorAll(".hit-area").forEach((r) => {
      const d = days[+r.dataset.i];
      const show = () => { const bb = r.getBoundingClientRect(); const wb = wrap.getBoundingClientRect(); tip.textContent = `${d.date} · ${d.total} ml`; tip.style.left = `${bb.left - wb.left + bb.width / 2}px`; tip.style.top = `${y(d.total) / H * wb.height}px`; tip.style.display = "block"; };
      r.addEventListener("mouseenter", show); r.addEventListener("touchstart", show, { passive: true });
      r.addEventListener("mouseleave", () => tip.style.display = "none");
    });
  }

  async function addWater(ml) {
    ml = Math.round(Number(ml)); if (!Number.isFinite(ml) || ml < 1 || ml > 5000) return;
    const date = localDate(); const day = todayDay();
    const entries = [...day.entries, { ml, at: new Date().toISOString() }];
    await saveWaterDay(date, { entries, total: entries.reduce((s, e) => s + e.ml, 0) });
  }
  async function removeWater(idx) {
    const date = localDate(); const day = todayDay();
    const entries = day.entries.filter((_, i) => i !== idx);
    await saveWaterDay(date, { entries, total: entries.reduce((s, e) => s + e.ml, 0) });
  }

  // ============================================================
  // Render: hoje (cabeçalho) e perfil
  // ============================================================
  function renderHome() {
    const p = profile();
    $("greet").textContent = `Olá, ${p.name || DEFAULT_NAMES[S.pid]}`;
    $("glp1line").textContent = p.uses_glp1 ? `Em tratamento com ${p.glp1_substance || "GLP-1"}${p.glp1_dose ? " · " + p.glp1_dose : ""}` : "Sem GLP-1 ativo";
    const missing = []; if (!p.weight_kg) missing.push("peso atual"); if (!p.height_cm) missing.push("altura"); if (!p.birth_date) missing.push("data de nascimento");
    $("missingNote").hidden = missing.length === 0;
    $("missingNote").innerHTML = `Para metas e sugestões mais precisas, completa o perfil: <strong>${esc(missing.join(", "))}</strong>. <a href="#" data-goto="perfil">Ir ao perfil</a>`;
    renderTodayMeals();
    $("chatSummary").textContent = S.chat.length ? `${S.chat.length} mensagens guardadas. Continua a conversa.` : "Fala com o assistente sobre o teu plano, sintomas ou preferências.";
    const age = ageFrom(p.birth_date); const imc = bmi(p.height_cm, p.weight_kg);
    const bits = []; if (age !== null) bits.push(`${age} anos`); if (imc) bits.push(`IMC ${imc}`); if (p.weight_kg && p.target_kg) bits.push(`${p.weight_kg} kg → objetivo ${p.target_kg} kg`);
    $("profileSummary").textContent = bits.length ? bits.join(" · ") : "Completa os dados para veres o resumo.";
  }

  function renderProfileForm() {
    const p = profile(); const f = (n) => $("profileForm").elements.namedItem(n);
    f("name").value = p.name || DEFAULT_NAMES[S.pid]; f("birth_date").value = p.birth_date || ""; f("sex").value = p.sex || "";
    f("height_cm").value = p.height_cm ?? ""; f("weight_kg").value = p.weight_kg ?? ""; f("target_kg").value = p.target_kg ?? ""; f("water_goal_ml").value = p.water_goal_ml ?? "";
    f("uses_glp1").checked = !!p.uses_glp1; $("glp1Fields").hidden = !p.uses_glp1;
    f("glp1_substance").value = p.glp1_substance || ""; f("glp1_dose").value = p.glp1_dose || ""; f("glp1_start").value = p.glp1_start || "";
    f("glp1_inj_day").value = p.glp1_inj_day || ""; f("satiety").value = p.satiety || "";
    f("allergies").value = (p.allergies || []).join(", "); f("intolerances").value = (p.intolerances || []).join(", ");
    f("preferences").value = p.preferences || ""; f("notes").value = p.notes || "";
    $("f_water").placeholder = `automática: ${waterGoal({ ...p, water_goal_ml: null }).ml}`;

    const tit = [...(p.titrations || [])].sort((a, b) => b.date.localeCompare(a.date));
    $("titList").innerHTML = tit.length === 0 ? `<li class="muted small">Sem registos.</li>` :
      tit.map((t) => `<li><span><strong>${esc(t.dose)}</strong> · ${esc(t.substance)} <span class="meta">desde ${t.date}</span>${t.notes ? `<br><span class="meta">${esc(t.notes)}</span>` : ""}</span><button type="button" class="btn ghost sm" data-deltit="${t.id}">remover</button></li>`).join("");
    const meds = p.meds || [];
    const li = (m) => `<li style="${m.active === false ? "opacity:.5" : ""}"><span><strong>${esc(m.name)}</strong>${m.dose ? " · " + esc(m.dose) : ""}${m.freq ? ` <span class="meta">· ${esc(m.freq)}</span>` : ""}</span><span class="row" style="gap:2px"><button type="button" class="btn ghost sm" data-togglemed="${m.id}">${m.active === false ? "reativar" : "suspender"}</button><button type="button" class="btn ghost sm" data-delmed="${m.id}">remover</button></span></li>`;
    const medRows = meds.filter((m) => m.kind !== "suplemento"), supRows = meds.filter((m) => m.kind === "suplemento");
    $("medList").innerHTML = medRows.length ? medRows.map(li).join("") : `<li class="muted small">Sem registos.</li>`;
    $("supList").innerHTML = supRows.length ? supRows.map(li).join("") : `<li class="muted small">Sem registos.</li>`;
  }

  function readProfileForm() {
    const f = new Proxy({}, { get: (_, n) => $("profileForm").elements.namedItem(n) }); const p = profile();
    const num = (v) => { const s = String(v).trim().replace(",", "."); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
    const list = (v) => String(v).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    const uses = f.uses_glp1.checked;
    return {
      ...p,
      name: f.name.value.trim() || DEFAULT_NAMES[S.pid],
      birth_date: f.birth_date.value || null, sex: f.sex.value || null,
      height_cm: num(f.height_cm.value), weight_kg: num(f.weight_kg.value), target_kg: num(f.target_kg.value), water_goal_ml: num(f.water_goal_ml.value),
      uses_glp1: uses,
      glp1_substance: uses ? f.glp1_substance.value.trim() || null : null,
      glp1_dose: uses ? f.glp1_dose.value.trim() || null : null,
      glp1_start: uses ? f.glp1_start.value || null : null,
      glp1_inj_day: uses ? f.glp1_inj_day.value || null : null,
      satiety: f.satiety.value || null,
      allergies: list(f.allergies.value), intolerances: list(f.intolerances.value),
      preferences: f.preferences.value.trim(), notes: f.notes.value.trim(),
      titrations: p.titrations || [], meds: p.meds || [],
      updatedAt: new Date().toISOString(),
    };
  }

  // ============================================================
  // Análises clínicas
  // ============================================================
  const MARKERS = [
    { id: "glicemia_jejum", label: "Glicemia em jejum", unit: "mg/dL", lo: 70, hi: 99 },
    { id: "hba1c", label: "HbA1c", unit: "%", lo: 4, hi: 5.6 },
    { id: "insulina", label: "Insulina em jejum", unit: "µU/mL", lo: 2, hi: 25 },
    { id: "colesterol_total", label: "Colesterol total", unit: "mg/dL", lo: null, hi: 190 },
    { id: "ldl", label: "Colesterol LDL", unit: "mg/dL", lo: null, hi: 115 },
    { id: "hdl", label: "Colesterol HDL", unit: "mg/dL", lo: 45, hi: null },
    { id: "trigliceridos", label: "Triglicéridos", unit: "mg/dL", lo: null, hi: 150 },
    { id: "creatinina", label: "Creatinina", unit: "mg/dL", lo: 0.5, hi: 1.0 },
    { id: "egfr", label: "TFG estimada (eGFR)", unit: "mL/min/1,73m²", lo: 60, hi: null },
    { id: "ureia", label: "Ureia", unit: "mg/dL", lo: 15, hi: 45 },
    { id: "acido_urico", label: "Ácido úrico", unit: "mg/dL", lo: 2.4, hi: 5.7 },
    { id: "alt", label: "ALT (TGP)", unit: "U/L", lo: null, hi: 33 },
    { id: "ast", label: "AST (TGO)", unit: "U/L", lo: null, hi: 32 },
    { id: "ggt", label: "GGT", unit: "U/L", lo: null, hi: 40 },
    { id: "bilirrubina_total", label: "Bilirrubina total", unit: "mg/dL", lo: 0.2, hi: 1.2 },
    { id: "albumina", label: "Albumina", unit: "g/dL", lo: 3.5, hi: 5.2 },
    { id: "lipase", label: "Lipase", unit: "U/L", lo: null, hi: 60 },
    { id: "amilase", label: "Amilase", unit: "U/L", lo: null, hi: 100 },
    { id: "hemoglobina", label: "Hemoglobina", unit: "g/dL", lo: 12, hi: 16 },
    { id: "ferro", label: "Ferro sérico", unit: "µg/dL", lo: 50, hi: 170 },
    { id: "ferritina", label: "Ferritina", unit: "ng/mL", lo: 15, hi: 150 },
    { id: "transferrina_sat", label: "Saturação da transferrina", unit: "%", lo: 20, hi: 45 },
    { id: "b12", label: "Vitamina B12", unit: "pg/mL", lo: 200, hi: 900 },
    { id: "folato", label: "Ácido fólico (folato)", unit: "ng/mL", lo: 3, hi: 17 },
    { id: "vit_d", label: "Vitamina D (25-OH)", unit: "ng/mL", lo: 30, hi: 100 },
    { id: "tsh", label: "TSH", unit: "mUI/L", lo: 0.4, hi: 4.0 },
    { id: "t4_livre", label: "T4 livre", unit: "ng/dL", lo: 0.8, hi: 1.8 },
    { id: "sodio", label: "Sódio", unit: "mmol/L", lo: 135, hi: 145 },
    { id: "potassio", label: "Potássio", unit: "mmol/L", lo: 3.5, hi: 5.1 },
    { id: "magnesio", label: "Magnésio", unit: "mg/dL", lo: 1.7, hi: 2.4 },
    { id: "calcio", label: "Cálcio", unit: "mg/dL", lo: 8.6, hi: 10.2 },
    { id: "pcr", label: "PCR (proteína C reativa)", unit: "mg/L", lo: null, hi: 5 },
    { id: "outro", label: "Outra análise…", unit: "", lo: null, hi: null },
  ];
  const ALIASES = {
    hba1c: ["hba1c", "a1c", "glicada", "glicosilada"], glicemia_jejum: ["glicemia", "glucose", "glicose"], insulina: ["insulina"],
    colesterol_total: ["colesterol total", "colesterol"], ldl: ["ldl"], hdl: ["hdl"], trigliceridos: ["triglic"],
    creatinina: ["creatinina"], egfr: ["egfr", "tfg", "filtracao glomerular", "ckd-epi", "ckd epi"], ureia: ["ureia", "urea"], acido_urico: ["acido urico", "urato"],
    alt: ["alt", "tgp", "alanina"], ast: ["ast", "tgo", "aspartato"], ggt: ["ggt", "gama gt", "gama-gt", "gamaglutamil"], bilirrubina_total: ["bilirrubina total"], albumina: ["albumina"],
    lipase: ["lipase"], amilase: ["amilase"], hemoglobina: ["hemoglobina"], ferro: ["ferro serico", "ferro"], ferritina: ["ferritina"], transferrina_sat: ["saturacao"],
    b12: ["b12", "cobalamina"], folato: ["folico", "folato"], vit_d: ["vitamina d", "25-oh", "25 oh", "25(oh)", "calcidiol", "hidroxivitamina"],
    tsh: ["tsh", "tirotropina"], t4_livre: ["t4 livre", "ft4", "t4l", "tiroxina livre"], sodio: ["sodio", "na+"], potassio: ["potassio", "k+"], magnesio: ["magnesio"], calcio: ["calcio"], pcr: ["pcr", "proteina c"],
  };
  const NOT = { hemoglobina: ["glic", "a1c", "corpuscular", "hcm", "chcm"], colesterol_total: ["ldl", "hdl", "nao"], ferro: ["ferritina", "transferrina", "saturacao", "capacidade"], calcio: ["ionizado"], glicemia_jejum: ["pos", "2h", "120", "urina"] };
  const specificFirst = ["hba1c", "ldl", "hdl", "trigliceridos", "colesterol_total", "transferrina_sat", "ferritina", "ferro", "t4_livre", "tsh", "bilirrubina_total", "vit_d", "folato", "b12", "egfr", "creatinina", "ureia", "acido_urico", "alt", "ast", "ggt", "albumina", "lipase", "amilase", "insulina", "glicemia_jejum", "hemoglobina", "sodio", "potassio", "magnesio", "calcio", "pcr"];
  /** Liga o nome de uma análise (como vem no documento) a um marcador conhecido. */
  function matchMarker(name) {
    const n = norm(name);
    for (const id of specificFirst) {
      if ((NOT[id] || []).some((x) => n.includes(x))) continue;
      if ((ALIASES[id] || []).some((a) => n.includes(a))) return id;
    }
    return "outro";
  }
  const markerOf = (id) => MARKERS.find((m) => m.id === id);
  const labLabel = (e) => e.marker === "outro" ? (e.label || "Outra") : (markerOf(e.marker)?.label || e.label || e.marker);
  const labKey = (e) => e.marker === "outro" ? "outro:" + (e.label || "").toLowerCase() : e.marker;
  const outOfRange = (e) => (e.lo !== null && e.lo !== undefined && e.value < e.lo) ? "baixo" : (e.hi !== null && e.hi !== undefined && e.value > e.hi) ? "alto" : null;
  const fmtNum = (v) => Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100).replace(".", ",");
  const fmtRange = (e) => { const lo = e.lo ?? null, hi = e.hi ?? null; if (lo === null && hi === null) return ""; if (lo !== null && hi !== null) return `${fmtNum(lo)}–${fmtNum(hi)}`; return lo !== null ? `≥ ${fmtNum(lo)}` : `≤ ${fmtNum(hi)}`; };

  function initLabForm() {
    $("l_marker").innerHTML = MARKERS.map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join("");
    $("l_date").value = localDate();
    applyMarkerDefaults();
  }
  function applyMarkerDefaults() {
    const m = markerOf($("l_marker").value); if (!m) return;
    $("l_customWrap").hidden = m.id !== "outro";
    $("l_unit").value = m.unit; $("l_lo").value = m.lo ?? ""; $("l_hi").value = m.hi ?? "";
  }

  function renderLabs() {
    // lista por data
    const byDate = new Map();
    [...S.labs].sort((a, b) => b.date.localeCompare(a.date) || labLabel(a).localeCompare(labLabel(b))).forEach((e) => { if (!byDate.has(e.date)) byDate.set(e.date, []); byDate.get(e.date).push(e); });
    $("labList").innerHTML = byDate.size === 0 ? `<p class="muted small">Sem análises registadas.</p>` :
      [...byDate.entries()].map(([date, rows]) => `<div class="date-group"><h3>${date}</h3><ul class="list">${rows.map((e) => {
        const o = outOfRange(e);
        return `<li><span>${esc(labLabel(e))}: <strong class="num">${fmtNum(e.value)} ${esc(e.unit)}</strong> ${fmtRange(e) ? `<span class="meta num">ref. ${esc(fmtRange(e))}</span>` : ""} ${o ? `<span class="flag out">${o === "alto" ? "↑ alto" : "↓ baixo"}</span>` : (e.lo ?? e.hi) != null ? `<span class="flag ok">✓</span>` : ""}${e.notes ? `<br><span class="meta">${esc(e.notes)}</span>` : ""}</span><span class="row" style="gap:2px"><button type="button" class="btn ghost sm" data-editlab="${e.id}">editar</button><button type="button" class="btn ghost sm" data-dellab="${e.id}">remover</button></span></li>`;
      }).join("")}</ul></div>`).join("");

    // seletor + gráfico
    const keys = new Map(); S.labs.forEach((e) => keys.set(labKey(e), labLabel(e)));
    $("labChartCard").hidden = keys.size === 0;
    if (keys.size === 0) return;
    if (!S.labPick || !keys.has(S.labPick)) S.labPick = [...keys.keys()][0];
    $("labPick").innerHTML = [...keys.entries()].map(([k, l]) => `<option value="${esc(k)}" ${k === S.labPick ? "selected" : ""}>${esc(l)}</option>`).join("");
    renderLabChart();
  }

  /** Gráfico de linha reutilizável. rows = [{date, value}]; opts = {lo, hi, unit, label, refText}. */
  function drawSeries(wrap, tip, rows, opts = {}) {
    if (!wrap || rows.length === 0) { if (wrap) wrap.innerHTML = ""; return; }
    const W = Math.max(300, Math.round(wrap.clientWidth || 720)), H = W < 480 ? 200 : 220, L = 46, R = 16, T = 18, B = 26;
    const lo = opts.lo ?? null, hi = opts.hi ?? null;
    const vals = rows.map((r) => r.value).concat(lo !== null ? [lo] : [], hi !== null ? [hi] : []);
    let vmin = Math.min(...vals), vmax = Math.max(...vals);
    const span = (vmax - vmin) || Math.abs(vmax) * 0.2 || 1;
    vmin -= span * 0.25; vmax += span * 0.25;
    if (vmin < 0 && Math.min(...vals) >= 0) vmin = 0;
    const iw = W - L - R, ih = H - T - B;
    const y = (v) => T + ih - ((v - vmin) / (vmax - vmin)) * ih;
    const toT = (iso) => new Date(iso).getTime();
    const t0 = toT(rows[0].date), t1 = toT(rows[rows.length - 1].date);
    const x = (iso) => rows.length === 1 || t1 === t0 ? L + iw / 2 : L + ((toT(iso) - t0) / (t1 - t0)) * (iw - 20) + 10;
    const ticks = 4, step = (vmax - vmin) / ticks;
    const last = rows[rows.length - 1];
    let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução de ${esc(opts.label || "")}">`;
    g += `<g class="grid">`; for (let i = 0; i <= ticks; i++) g += `<line x1="${L}" x2="${W - R}" y1="${y(vmin + step * i)}" y2="${y(vmin + step * i)}"/>`; g += `</g>`;
    if (lo !== null || hi !== null) {
      const yTop = y(hi !== null ? hi : vmax), yBot = y(lo !== null ? lo : vmin);
      g += `<rect class="band" x="${L}" y="${Math.min(yTop, yBot)}" width="${iw}" height="${Math.abs(yBot - yTop)}"/>`;
      if (opts.refText) g += `<text class="ref-label" x="${L + 4}" y="${Math.min(yTop, yBot) + 11}">referência ${esc(opts.refText)}</text>`;
    }
    g += `<g class="axis">`;
    for (let i = 0; i <= ticks; i++) g += `<text x="${L - 6}" y="${y(vmin + step * i) + 4}" text-anchor="end">${fmtNum(Math.round((vmin + step * i) * 10) / 10)}</text>`;
    const idx = rows.length <= 4 ? rows.map((_, i) => i) : [0, Math.floor(rows.length / 2), rows.length - 1];
    idx.forEach((i) => { g += `<text x="${x(rows[i].date)}" y="${H - 8}" text-anchor="middle">${rows[i].date.slice(5).replace("-", "/")}/${rows[i].date.slice(2, 4)}</text>`; });
    g += `</g>`;
    if (rows.length > 1) g += `<path class="line" d="${rows.map((r, i) => `${i ? "L" : "M"}${x(r.date)},${y(r.value)}`).join(" ")}"/>`;
    rows.forEach((r, i) => { g += `<circle class="pt" cx="${x(r.date)}" cy="${y(r.value)}" r="5" data-i="${i}"/>`; });
    g += `<text class="pt-label" x="${x(last.date)}" y="${y(last.value) - 10}" text-anchor="${rows.length > 1 ? "end" : "middle"}">${fmtNum(last.value)}</text>`;
    g += `</svg>`;
    wrap.innerHTML = g; if (tip) wrap.appendChild(tip);
    wrap.querySelectorAll(".pt").forEach((c) => {
      const r = rows[+c.dataset.i];
      const show = () => {
        const bb = c.getBoundingClientRect(), wb = wrap.getBoundingClientRect();
        tip.textContent = `${r.date} · ${fmtNum(r.value)}${opts.unit ? " " + opts.unit : ""}`;
        tip.style.left = `${bb.left - wb.left + bb.width / 2}px`;
        tip.style.top = `${bb.top - wb.top - 4}px`;
        tip.style.display = "block";
      };
      c.addEventListener("mouseenter", show); c.addEventListener("touchstart", show, { passive: true });
      c.addEventListener("mouseleave", () => { tip.style.display = "none"; });
    });
  }

  function renderLabChart() {
    const rows = S.labs.filter((e) => labKey(e) === S.labPick).sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length === 0) return;
    const last = rows[rows.length - 1], o = outOfRange(last);
    $("labLatest").innerHTML = `Último: <strong class="num">${fmtNum(last.value)} ${esc(last.unit)}</strong> em ${last.date} ${o ? `<span class="flag out">${o === "alto" ? "↑ acima da referência" : "↓ abaixo da referência"}</span>` : (last.lo ?? last.hi) != null ? `<span class="flag ok">✓ dentro da referência</span>` : ""}${rows.length > 1 ? ` · ${rows.length} registos` : ""}`;
    drawSeries($("labChart"), $("labTip"), rows.map((r) => ({ date: r.date, value: r.value })), {
      lo: last.lo ?? null, hi: last.hi ?? null, unit: last.unit, label: labLabel(last), refText: fmtRange(last),
    });
  }

  /** Última análise por marcador, para o contexto do assistente. */
  function latestLabs() {
    const m = new Map();
    [...S.labs].sort((a, b) => b.date.localeCompare(a.date)).forEach((e) => { const k = labKey(e); if (!m.has(k)) m.set(k, e); });
    return [...m.values()].map((e) => ({ analise: labLabel(e), valor: e.value, unidade: e.unit, referencia: fmtRange(e) || null, estado: outOfRange(e) || "normal", data: e.date }));
  }

  // ============================================================
  // Composição corporal
  // ============================================================
  const BODY_METRICS = [
    { id: "weight_kg", label: "Peso", unit: "kg", better: "down" },
    { id: "fat_pct", label: "Massa gorda", unit: "%", better: "down" },
    { id: "fat_kg", label: "Massa gorda", unit: "kg", better: "down", derived: true },
    { id: "lean_kg", label: "Massa magra", unit: "kg", better: "up", derived: true },
    { id: "muscle_pct", label: "Massa muscular", unit: "%", better: "up" },
    { id: "muscle_kg", label: "Massa muscular", unit: "kg", better: "up", derived: true },
    { id: "water_pct", label: "Água corporal", unit: "%", better: "up" },
    { id: "visceral", label: "Gordura visceral", unit: "", better: "down" },
    { id: "bone_kg", label: "Massa óssea", unit: "kg", better: "up" },
  ];
  const metricOf = (id) => BODY_METRICS.find((m) => m.id === id) || BODY_METRICS[0];

  /** Acrescenta massa gorda e massa magra em kg, calculadas a partir do peso e da percentagem. */
  function bodyRow(e) {
    const r1 = (v) => Math.round(v * 10) / 10;
    const fat_kg = (e.weight_kg && e.fat_pct) ? r1(e.weight_kg * e.fat_pct / 100) : null;
    const lean_kg = (e.weight_kg && fat_kg !== null) ? r1(e.weight_kg - fat_kg) : null;
    // a massa muscular é registada em percentagem; registos antigos guardaram kg
    let muscle_pct = e.muscle_pct ?? null, muscle_kg = e.muscle_kg ?? null;
    if (e.weight_kg) {
      if (muscle_pct !== null) muscle_kg = r1(e.weight_kg * muscle_pct / 100);
      else if (muscle_kg !== null) muscle_pct = r1(muscle_kg / e.weight_kg * 100);
    }
    return { ...e, fat_kg, lean_kg, muscle_pct, muscle_kg };
  }
  const bodySeries = () => S.body.map(bodyRow).sort((a, b) => a.date.localeCompare(b.date));
  const valuesOf = (id) => bodySeries().filter((r) => r[id] !== null && r[id] !== undefined && r[id] !== "").map((r) => ({ date: r.date, value: Number(r[id]) }));

  function renderBody() {
    const el = $("bodyList"); if (!el) return;
    const rows = bodySeries();
    // registos
    el.innerHTML = rows.length === 0
      ? `<li class="muted small">Sem medições. Regista a primeira acima.</li>`
      : [...rows].reverse().map((r) => {
          const bits = [r.weight_kg ? `<strong class="num">${fmtNum(r.weight_kg)} kg</strong>` : "",
            r.fat_pct ? `gordura <strong class="num">${fmtNum(r.fat_pct)} %</strong>` : "",
            r.lean_kg ? `magra <strong class="num">${fmtNum(r.lean_kg)} kg</strong>` : "",
            r.muscle_pct ? `músculo <strong class="num">${fmtNum(r.muscle_pct)} %</strong>${r.muscle_kg ? ` <span class="meta num">(${fmtNum(r.muscle_kg)} kg)</span>` : ""}` : "",
            r.water_pct ? `água <strong class="num">${fmtNum(r.water_pct)} %</strong>` : "",
            r.visceral ? `visceral <strong class="num">${fmtNum(r.visceral)}</strong>` : ""].filter(Boolean);
          return `<li><span>${bits.join(" · ")} <span class="meta">${r.date}</span>${r.notes ? `<br><span class="meta">${esc(r.notes)}</span>` : ""}</span><span class="row" style="gap:2px"><button type="button" class="btn ghost sm" data-editbody="${r.id}">editar</button><button type="button" class="btn ghost sm" data-delbody="${r.id}">remover</button></span></li>`;
        }).join("");

    // resumo
    $("bodyNow").hidden = rows.length === 0;
    if (rows.length) {
      const last = rows[rows.length - 1], first = rows[0], prev = rows.length > 1 ? rows[rows.length - 2] : null;
      $("bodyLastDate").textContent = `medição de ${last.date}`;
      const tiles = BODY_METRICS.filter((m) => last[m.id] !== null && last[m.id] !== undefined && last[m.id] !== "").map((m) => {
        const now = Number(last[m.id]);
        const base = first[m.id] !== null && first[m.id] !== undefined && first !== last ? Number(first[m.id]) : null;
        const d = base !== null ? Math.round((now - base) * 10) / 10 : null;
        const cls = d === null || d === 0 ? "" : ((d < 0) === (m.better === "down") ? "down" : "up");
        const name = m.unit ? `${m.label} (${m.unit})` : m.label;
        return `<div class="delta ${cls}"><div class="v num">${fmtNum(now)}${m.unit ? " " + m.unit : ""}</div><div class="k">${name}${d !== null ? ` · ${d > 0 ? "+" : ""}${fmtNum(d)} desde o início` : ""}</div></div>`;
      }).join("");
      $("bodyTiles").innerHTML = tiles;

      // barra gordura / magra
      const showSplit = last.fat_kg !== null && last.lean_kg !== null;
      $("bodySplitWrap").hidden = !showSplit;
      if (showSplit) {
        const fp = Math.round(last.fat_pct);
        $("bodySplit").innerHTML = `<span class="fat" style="width:${fp}%">${fp > 12 ? fmtNum(last.fat_kg) + " kg gorda" : ""}</span><span class="lean" style="width:${100 - fp}%">${100 - fp > 12 ? fmtNum(last.lean_kg) + " kg magra" : ""}</span>`;
      }

      // qualidade da perda: quanto do peso perdido foi gordura
      const q = $("bodyLossQuality");
      if (first !== last && first.weight_kg && last.weight_kg && first.fat_kg !== null && last.fat_kg !== null) {
        const dW = first.weight_kg - last.weight_kg, dF = first.fat_kg - last.fat_kg, dL = first.lean_kg - last.lean_kg;
        if (dW > 0.3) {
          const pctFat = Math.round(dF / dW * 100);
          const aviso = pctFat >= 75 ? "Bom: a maior parte do que perdeste foi gordura."
            : pctFat >= 60 ? "Razoável, mas vale a pena reforçar a proteína e o treino de força."
            : "Uma fatia grande do que perdeste é massa magra. Reforça a proteína e o treino de força, e fala com o médico.";
          q.innerHTML = `Desde ${first.date} perdeste <strong class="num">${fmtNum(Math.round(dW * 10) / 10)} kg</strong>: <strong class="num">${fmtNum(Math.round(dF * 10) / 10)} kg</strong> de gordura e <strong class="num">${fmtNum(Math.round(dL * 10) / 10)} kg</strong> de massa magra (<strong>${pctFat}%</strong> do peso perdido foi gordura). ${aviso}`;
          q.hidden = false;
        } else q.hidden = true;
      } else q.hidden = true;
      if (prev) { /* mantido para futura comparação com a medição anterior */ }
    }

    // gráfico
    const available = BODY_METRICS.filter((m) => valuesOf(m.id).length > 0);
    $("bodyChartCard").hidden = available.length === 0;
    if (available.length) {
      if (!available.some((m) => m.id === S.bodyPick)) S.bodyPick = available[0].id;
      $("bodyPick").innerHTML = available.map((m) => `<option value="${m.id}" ${m.id === S.bodyPick ? "selected" : ""}>${esc(m.label)}${m.unit ? ` (${m.unit})` : ""}</option>`).join("");
      renderBodyChart();
    }
    if (!$("c_date").value) $("c_date").value = localDate();
  }

  function renderBodyChart() {
    const m = metricOf(S.bodyPick);
    drawSeries($("bodyChart"), $("bodyTip"), valuesOf(m.id), { unit: m.unit, label: m.label });
  }

  const EDIT_FORMS = {
    body: { form: "bodyForm", btn: "bodyForm", label: "Guardar medição", section: "corpo" },
    lab: { form: "labForm", label: "Adicionar", section: "analises" },
    bp: { form: "bpForm", label: "Adicionar", section: "analises" },
  };

  /** Carrega um registo no respetivo formulário para ser alterado. */
  function startEdit(kind, id) {
    const set = (el, v) => { const n = $(el); if (n) n.value = v ?? ""; };
    if (kind === "body") {
      const r = S.body.find((x) => x.id === id); if (!r) return;
      set("c_date", r.date); set("c_weight", r.weight_kg); set("c_fat", r.fat_pct);
      set("c_muscle", r.muscle_pct ?? (r.weight_kg && r.muscle_kg ? Math.round(r.muscle_kg / r.weight_kg * 1000) / 10 : ""));
      set("c_water", r.water_pct); set("c_visceral", r.visceral); set("c_bone", r.bone_kg); set("c_notes", r.notes);
    } else if (kind === "lab") {
      const r = S.labs.find((x) => x.id === id); if (!r) return;
      set("l_date", r.date); $("l_marker").value = r.marker; $("l_customWrap").hidden = r.marker !== "outro";
      if (r.marker === "outro") set("l_custom", r.label);
      set("l_value", r.value); set("l_unit", r.unit); set("l_lo", r.lo); set("l_hi", r.hi); set("l_notes", r.notes);
    } else if (kind === "bp") {
      const r = S.vitals.find((x) => x.id === id); if (!r) return;
      set("b_date", r.date); set("b_time", r.time); set("b_sys", r.sys); set("b_dia", r.dia); set("b_pulse", r.pulse);
    }
    S.edit[kind] = id;
    markEditing(kind, true);
    $(EDIT_FORMS[kind].form).scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function cancelEdit(kind) {
    S.edit[kind] = null;
    markEditing(kind, false);
    const f = $(EDIT_FORMS[kind].form);
    if (kind === "body") { ["c_weight", "c_fat", "c_muscle", "c_water", "c_visceral", "c_bone", "c_notes"].forEach((id) => { $(id).value = ""; }); $("c_date").value = localDate(); }
    if (kind === "lab") { ["l_value", "l_notes", "l_custom"].forEach((id) => { $(id).value = ""; }); }
    if (kind === "bp") { ["b_sys", "b_dia", "b_pulse", "b_time"].forEach((id) => { $(id).value = ""; }); }
    void f;
  }

  /** Marca visualmente o formulário em modo de alteração. */
  function markEditing(kind, on) {
    const f = $(EDIT_FORMS[kind].form); if (!f) return;
    f.style.borderColor = on ? "var(--accent)" : "";
    const submit = f.querySelector('button[type="submit"]');
    if (submit) submit.textContent = on ? "Guardar alterações" : EDIT_FORMS[kind].label;
    let cancel = f.querySelector("[data-canceledit]");
    if (on && !cancel) {
      cancel = document.createElement("button");
      cancel.type = "button"; cancel.className = "btn ghost sm"; cancel.dataset.canceledit = kind;
      cancel.textContent = "Cancelar alteração";
      cancel.addEventListener("click", () => cancelEdit(kind));
      submit.insertAdjacentElement("afterend", cancel);
    } else if (!on && cancel) cancel.remove();
  }

  // ============================================================
  // Tensão arterial e documentos
  // ============================================================
  const bpClass = (e) => (e.sys >= 140 || e.dia >= 90) ? "alta" : (e.sys >= 130 || e.dia >= 85) ? "elevada" : (e.sys < 90 || e.dia < 60) ? "baixa" : null;
  function bpAverage(n = 7) {
    const last = S.vitals.slice(-n); if (last.length === 0) return null;
    return { n: last.length, sys: Math.round(last.reduce((a, e) => a + e.sys, 0) / last.length), dia: Math.round(last.reduce((a, e) => a + e.dia, 0) / last.length), pulse: last.some((e) => e.pulse) ? Math.round(last.filter((e) => e.pulse).reduce((a, e) => a + e.pulse, 0) / last.filter((e) => e.pulse).length) : null };
  }
  function renderVitals() {
    const el = $("bpList"); if (!el) return;
    const rows = [...S.vitals].reverse().slice(0, 12);
    el.innerHTML = rows.length === 0 ? `<li class="muted small">Sem registos. Podes também dizer no chat "hoje tive 128/82".</li>` :
      rows.map((e) => { const c = bpClass(e); return `<li><span><strong class="num">${e.sys}/${e.dia}</strong> mmHg${e.pulse ? ` <span class="meta num">· ${e.pulse} bpm</span>` : ""} <span class="meta">${e.date}${e.time ? " " + e.time : ""}${e.source ? " · " + esc(e.source) : ""}</span> ${c ? `<span class="flag ${c === "alta" || c === "elevada" ? "out" : "ok"}">${c}</span>` : ""}</span><span class="row" style="gap:2px"><button type="button" class="btn ghost sm" data-editbp="${e.id}">editar</button><button type="button" class="btn ghost sm" data-delbp="${e.id}">remover</button></span></li>`; }).join("");
    const avg = bpAverage(); $("bpAvg").textContent = avg ? `média das últimas ${avg.n}: ${avg.sys}/${avg.dia}` : "";
    if (!$("b_date").value) $("b_date").value = localDate();
  }
  function renderRules() {
    const el = $("rulesList"); if (!el) return;
    el.innerHTML = S.rules.length === 0
      ? `<li class="muted small">Sem regras. O plano segue só as preferências escritas acima.</li>`
      : S.rules.map((r) => `<li><span>${esc(r.texto)}${r.origem === "chat" ? ` <span class="meta">· dita no chat</span>` : ""}</span><button type="button" class="btn ghost sm" data-delrule="${r.id}">remover</button></li>`).join("");
  }

  async function addRule(texto, origem) {
    const t = String(texto || "").trim().slice(0, 220);
    if (!t) return null;
    if (S.rules.some((r) => norm(r.texto) === norm(t))) return { duplicada: true, texto: t };
    const r = { id: uid(), texto: t, origem: origem || "perfil", at: new Date().toISOString() };
    S.rules = [...S.rules, r];
    await saveRules();
    return r;
  }

  function renderDocs() {
    const el = $("docList"); if (!el) return;
    const rows = [...S.docs].reverse();
    el.innerHTML = rows.length === 0 ? `<p class="muted small">Ainda não enviaste documentos.</p>` :
      rows.map((d) => `<div class="doc"><div class="row between"><span class="t">${esc(d.titulo || d.tipo)} <span class="meta muted small">· ${d.date || "sem data"} · ${esc(tipoLabel(d.tipo))}</span></span><button type="button" class="btn ghost sm" data-deldoc="${d.id}">remover</button></div><div class="s">${esc(d.resumo || "")}</div>${(d.pontos || []).length ? `<ul>${d.pontos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div>`).join("");
  }
  const tipoLabel = (t) => ({ analises: "análises", tensao_arterial: "tensão arterial", ecg: "eletrocardiograma", outro: "documento" }[t] || t);

  // ---- leitura de documentos (imagens / PDF) com o Claude ----
  let pdfjsPromise = null;
  function loadScript(src) { return new Promise((res, rej) => { const el = document.createElement("script"); el.src = src; el.onload = res; el.onerror = () => rej(new Error("script " + src)); document.head.appendChild(el); }); }
  async function loadPdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    if (!pdfjsPromise) pdfjsPromise = (async () => {
      const cands = [
        ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"],
        ["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js", "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"],
        ["https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs", null],
      ];
      for (const [lib, worker] of cands) {
        try {
          if (lib.endsWith(".mjs")) { const m = await import(lib); window.pdfjsLib = m; }
          else await loadScript(lib);
          if (!window.pdfjsLib?.getDocument) continue;
          if (worker) window.pdfjsLib.GlobalWorkerOptions.workerSrc = worker;
          return window.pdfjsLib;
        } catch (e) { console.warn("pdfjs", lib, e); }
      }
      pdfjsPromise = null; // permite nova tentativa
      throw new Error("pdfjs");
    })();
    return pdfjsPromise.catch((e) => { pdfjsPromise = null; throw e; });
  }
  /** Lê um PDF: texto das páginas (o habitual em relatórios) ou, se for digitalizado, imagens. */
  async function pdfToContent(file, maxPages = 30) {
    let pdfjs;
    try { pdfjs = await loadPdfJs(); } catch { throw { code: "pdf_lib", message: "não foi possível carregar o leitor de PDF" }; }
    let pdf;
    try {
      const task = pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false });
      pdf = await Promise.race([task.promise, new Promise((_, rej) => setTimeout(() => rej({ code: "pdf_open", message: "demorou demasiado a abrir" }), 60000))]);
    } catch (e) { throw { code: "pdf_open", message: e?.name === "PasswordException" ? "o PDF está protegido por palavra-passe" : (e?.message || "não foi possível abrir o PDF") }; }
    const n = Math.min(pdf.numPages, maxPages); const pagesText = [];
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i); const tc = await page.getTextContent();
      let lastY = null, line = [], lines = [];
      for (const it of tc.items) { if (!("str" in it)) continue; const y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 3) { lines.push(line.join(" ")); line = []; } line.push(it.str); lastY = y; }
      if (line.length) lines.push(line.join(" "));
      pagesText.push(lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"));
    }
    const letters = (t) => t.replace(/[^\p{L}\p{N}]/gu, "").length;
    if (pagesText.reduce((a, t) => a + letters(t), 0) >= 60) {
      // agrupa páginas em pedaços de ~40 000 caracteres (relatórios longos, MAPA, etc.)
      const chunks = []; let cur = "";
      pagesText.forEach((t, i) => {
        const piece = `--- página ${i + 1} ---\n${t}\n\n`;
        if (cur.length + piece.length > 40000 && cur) { chunks.push(cur); cur = ""; }
        cur += piece.length > 40000 ? piece.slice(0, 40000) : piece;
      });
      if (cur.trim()) chunks.push(cur);
      return { texts: chunks, pages: pdf.numPages, read: n };
    }
    // digitalizado: sem texto útil → imagens das páginas
    if (!S.imageLimits) throw { code: "pdf_scanned", message: "o PDF parece digitalizado (só imagem) e esta conta não permite enviar imagens ao Claude" };
    const images = []; const m = Math.min(n, 8);
    for (let i = 1; i <= m; i++) {
      const page = await pdf.getPage(i); const vp0 = page.getViewport({ scale: 1 }); const scale = Math.min(2, 1400 / Math.max(vp0.width, vp0.height)); const vp = page.getViewport({ scale });
      const c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      images.push(await new Promise((r) => c.toBlob(r, "image/png")));
    }
    return { images, pages: pdf.numPages, read: m };
  }

  /** Converte um ficheiro no que vai ser enviado ao Claude. */
  async function fileToContent(f) {
    if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
      const r = await pdfToContent(f);
      return { texts: r.texts || [], images: r.images || [], note: r.pages > r.read ? `só as primeiras ${r.read} de ${r.pages} páginas foram lidas` : "" };
    }
    if (f.type.startsWith("image/")) {
      if (!S.imageLimits) throw { code: "images_unavailable", message: "esta conta não permite enviar fotos ao Claude a partir da página; envia o documento em PDF" };
      return { texts: [], images: [f], note: "" };
    }
    if (f.type.startsWith("text/") || /\.(txt|csv)$/i.test(f.name)) {
      const t = await f.text();
      return { texts: [t.slice(0, 40000)], images: [], note: t.length > 40000 ? "texto demasiado longo, li só o início" : "" };
    }
    throw { code: "formato", message: `formato não suportado (usa PDF${S.imageLimits ? ", foto ou imagem" : ""})` };
  }

  const EXTRACT_PROMPT_TEXT = `Lê o texto de documento(s) de saúde no fim desta mensagem (relatório de análises, registo de tensão arterial, eletrocardiograma, relatório médico, receita, etc.) e extrai a informação em português de Portugal.
Responde APENAS com JSON com esta estrutura:
{"documentos":[{"tipo":"analises|tensao_arterial|ecg|outro","data":"YYYY-MM-DD ou null","titulo":"título curto (ex: Análises Hospital X)","resumo":"2 a 4 frases com o essencial, sem repetir todos os valores",
"analises":[{"analise":"nome exatamente como no documento","valor":5.6,"unidade":"%","ref_min":null,"ref_max":5.7}],
"tensao":[{"data":"YYYY-MM-DD","hora":"HH:MM ou null","sistolica":128,"diastolica":82,"pulso":70}],
"relevante_para_nutricao":["pontos concretos e curtos que um nutricionista deve ter em conta (ex: LDL alto, ferritina baixa, hipertensão, alteração no ECG, medicação nova)"]}]}
Regras: um objeto por documento distinto; se for um registo MAPA/Holter de tensão, inclui TODAS as medições em "tensao"; valores numéricos com ponto decimal; inclui o intervalo de referência quando aparece; em análises inclui todos os parâmetros com valor numérico (hemograma, bioquímica, lípidos, tiroide, vitaminas, urina); se não for um documento de saúde, tipo "outro" e explica no resumo; não inventes valores que não estejam visíveis.`;
  const EXTRACT_PROMPT = EXTRACT_PROMPT_TEXT.replace("o texto de documento(s) de saúde no fim desta mensagem", "o(s) documento(s) de saúde nas imagens");

  /** Regista no estado o que foi extraído; devolve um resumo em texto para o chat. */
  async function registerExtraction(docsArr, sourceLabel) {
    const lines = []; const newLabs = [...S.labs], newVitals = [...S.vitals], newDocs = [...S.docs];
    for (const d of docsArr) {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(d.data || "")) ? d.data : localDate();
      let added = 0, skipped = 0, flagged = [];
      for (const a of (d.analises || [])) {
        const value = Number(String(a.valor).replace(",", ".")); if (!Number.isFinite(value) || !a.analise) continue;
        const mk = matchMarker(a.analise); const def = markerOf(mk);
        const unit = String(a.unidade || (mk !== "outro" ? def.unit : "")).trim();
        const sameUnit = mk !== "outro" && norm(unit) === norm(def.unit);
        const num = (v) => { if (v === null || v === undefined || v === "") return null; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };
        const lo = num(a.ref_min) ?? (sameUnit ? def.lo : null), hi = num(a.ref_max) ?? (sameUnit ? def.hi : null);
        const e = { id: uid(), date, marker: mk, label: mk === "outro" ? String(a.analise).trim() : def.label, value, unit, lo, hi, notes: `de "${d.titulo || sourceLabel}"` };
        if (newLabs.some((x) => x.date === date && labKey(x) === labKey(e))) { skipped++; continue; }
        newLabs.push(e); added++; const o = outOfRange(e); if (o) flagged.push(`${labLabel(e)} ${fmtNum(value)} ${unit} (${o})`);
      }
      let bp = 0;
      for (const t of (d.tensao || [])) {
        const sys = Number(t.sistolica), dia = Number(t.diastolica); if (!Number.isFinite(sys) || !Number.isFinite(dia)) continue;
        const bdate = /^\d{4}-\d{2}-\d{2}$/.test(String(t.data || "")) ? t.data : date; const time = /^\d{2}:\d{2}$/.test(String(t.hora || "")) ? t.hora : "";
        if (newVitals.some((x) => x.date === bdate && x.time === time && x.sys === sys && x.dia === dia)) continue;
        newVitals.push({ id: uid(), date: bdate, time, sys, dia, pulse: Number(t.pulso) || null, source: d.titulo || sourceLabel }); bp++;
      }
      newDocs.push({ id: uid(), date, tipo: d.tipo || "outro", titulo: String(d.titulo || sourceLabel), resumo: String(d.resumo || ""), pontos: (d.relevante_para_nutricao || []).map(String).slice(0, 8), at: new Date().toISOString() });
      const parts = [`${tipoLabel(d.tipo || "outro")}${d.titulo ? ` "${d.titulo}"` : ""} de ${date}`];
      if (added) parts.push(`${added} análises registadas${skipped ? ` (${skipped} já existiam)` : ""}`);
      else if (skipped) parts.push(`${skipped} análises já estavam registadas`);
      if (bp) parts.push(`${bp} medições de tensão registadas`);
      lines.push("• " + parts.join(": "));
      if (flagged.length) lines.push("  Fora da referência: " + flagged.join("; "));
      if (d.resumo) lines.push("  " + d.resumo);
    }
    S.labs = newLabs; S.vitals = newVitals; S.docs = newDocs;
    await Promise.all([saveLabs(), saveVitals(), saveDocs()]);
    return lines.join("\n");
  }

  const FILE_ERR = {
    pdf_lib: "não consegui carregar o leitor de PDF (o script externo não abriu)",
    pdf_open: "não consegui abrir o PDF",
    pdf_scanned: "o PDF é digitalizado (só imagem) e esta conta não permite enviar imagens",
    images_unavailable: "esta conta não permite enviar fotos; envia o documento em PDF",
    formato: "formato não suportado",
    invalid_json: "não consegui extrair dados legíveis",
    rate_limited: "limite de utilização do Claude atingido; tenta daqui a pouco",
    refused: "o Claude não pôde processar este documento",
    prompt_too_large: "documento demasiado grande",
  };
  const fileErrText = (e) => FILE_ERR[e?.code] || e?.message || "falha inesperada";

  /** Lê cada ficheiro e regista o que encontrar. Um ficheiro que falhe não trava os outros. */
  async function ingestAttachments(files, bubble) {
    const asDocs = (res) => Array.isArray(res?.documentos) ? res.documentos : (res && (res.tipo || res.analises || res.tensao)) ? [res] : [];
    const allDocs = []; const notes = []; const failed = []; const okFiles = [];
    const sig = () => S.streaming?.signal;

    for (let fi = 0; fi < files.length; fi++) {
      const f = files[fi]; const tag = files.length > 1 ? ` (${fi + 1}/${files.length})` : "";
      let got = 0;
      try {
        bubble.innerHTML = `<span class="thinking">a preparar ${esc(f.name)}${tag}…</span>`;
        const c = await fileToContent(f);
        if (c.note) notes.push(`${f.name}: ${c.note}`);
        for (let i = 0; i < c.texts.length; i++) {
          if (sig()?.aborted) throw { code: "cancelled" };
          bubble.innerHTML = `<span class="thinking">a ler ${esc(f.name)}${tag}${c.texts.length > 1 ? ` · parte ${i + 1}/${c.texts.length}` : ""}…</span>`;
          const res = await S.sample.json(`${EXTRACT_PROMPT_TEXT}\n\nTexto extraído do ficheiro "${f.name}":\n${c.texts[i]}`, { cache: false, signal: sig() });
          const d = asDocs(res); allDocs.push(...d); got += d.length;
        }
        const lim = S.imageLimits;
        for (let i = 0; lim && i < c.images.length; i += lim.maxCount) {
          if (sig()?.aborted) throw { code: "cancelled" };
          bubble.innerHTML = `<span class="thinking">a ler as páginas de ${esc(f.name)}${tag}…</span>`;
          const res = await S.sample.json(EXTRACT_PROMPT, { images: c.images.slice(i, i + lim.maxCount), cache: false, signal: sig() });
          const d = asDocs(res); allDocs.push(...d); got += d.length;
        }
        if (got === 0) failed.push(`${f.name}: ${FILE_ERR.invalid_json}`); else okFiles.push(f.name);
      } catch (e) {
        if (e?.code === "cancelled") throw e;
        console.warn("ingest", f.name, e);
        failed.push(`${f.name}: ${fileErrText(e)}`);
      }
    }

    if (allDocs.length === 0) throw { code: "nenhum", message: failed.join("; ") || "sem documentos legíveis", detalhes: failed };
    const summary = await registerExtraction(allDocs, okFiles.join(", ") || "documento");
    return "Li o que enviaste e registei:\n" + summary +
      (notes.length ? "\n" + notes.map((n) => "⚠️ " + n).join("\n") : "") +
      (failed.length ? "\n\nNão consegui ler:\n" + failed.map((n) => "• " + n).join("\n") : "") +
      "\n\nPodes ver tudo na aba Análises. O plano e as minhas sugestões passam a ter isto em conta.";
  }

  // ============================================================
  // Plano alimentar
  // ============================================================
  const DAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-feira/g, "").trim();
  const todayDayName = () => DAYS[(new Date().getDay() + 6) % 7];
  const mondayOf = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return localDate(x); };

  function planPromptContext() {
    const p = profile(); const goal = waterGoal(p); const meds = (p.meds || []).filter((m) => m.active !== false);
    return JSON.stringify({
      perfil: { nome: p.name, idade: ageFrom(p.birth_date), sexo: p.sex, altura_cm: p.height_cm, peso_atual_kg: p.weight_kg, peso_objetivo_kg: p.target_kg, imc: bmi(p.height_cm, p.weight_kg), saciedade_precoce: p.satiety || "não indicada", alergias: p.allergies || [], intolerancias: p.intolerances || [], preferencias: p.preferences || null, notas: p.notes || null },
      glp1: p.uses_glp1 ? { substancia: p.glp1_substance, dose_atual: p.glp1_dose, inicio: p.glp1_start, dia_da_injecao: p.glp1_inj_day || null, titulacao: (p.titrations || []).slice(-6) } : null,
      medicacao: meds.filter((m) => m.kind !== "suplemento").map(({ name, dose, freq }) => ({ nome: name, dose, frequencia: freq })),
      suplementos: meds.filter((m) => m.kind === "suplemento").map(({ name, dose, freq }) => ({ nome: name, dose, frequencia: freq })),
      regras_alimentares_obrigatorias: S.rules.map((r) => r.texto),
      calculos_de_referencia: planTargets(p),
      analises_mais_recentes: latestLabs(),
      tensao_arterial: bpSummary(),
      documentos_de_saude: S.docs.slice(-8).map((d) => ({ tipo: d.tipo, data: d.date, titulo: d.titulo, resumo: d.resumo, pontos: d.pontos })),
      meta_agua_ml: goal.ml,
      composicao_corporal: bodyContext(),
    });
  }
  /** Resumo da composição corporal para o assistente e para o plano. */
  function bodyContext() {
    const rows = bodySeries();
    if (rows.length === 0) return S.weights.length ? { evolucao_peso: S.weights.slice(-8) } : null;
    const last = rows[rows.length - 1], first = rows[0];
    const out = {
      ultima_medicao: { data: last.date, peso_kg: last.weight_kg, massa_gorda_pct: last.fat_pct, massa_gorda_kg: last.fat_kg, massa_magra_kg: last.lean_kg, massa_muscular_pct: last.muscle_pct, massa_muscular_kg: last.muscle_kg, agua_corporal_pct: last.water_pct, gordura_visceral: last.visceral },
      historico: rows.slice(-8).map((r) => ({ data: r.date, peso_kg: r.weight_kg, massa_gorda_pct: r.fat_pct, massa_magra_kg: r.lean_kg })),
    };
    if (first !== last && first.weight_kg && last.weight_kg) {
      const dW = Math.round((first.weight_kg - last.weight_kg) * 10) / 10;
      out.desde_o_inicio = { desde: first.date, peso_perdido_kg: dW };
      if (first.fat_kg !== null && last.fat_kg !== null && dW > 0) {
        const dF = Math.round((first.fat_kg - last.fat_kg) * 10) / 10;
        const dL = Math.round((first.lean_kg - last.lean_kg) * 10) / 10;
        out.desde_o_inicio.gordura_perdida_kg = dF;
        out.desde_o_inicio.massa_magra_perdida_kg = dL;
        out.desde_o_inicio.percentagem_da_perda_que_foi_gordura = Math.round(dF / dW * 100);
      }
    }
    return out;
  }

  function bpSummary() {
    const avg = bpAverage(); if (!avg) return null;
    return { media_ultimas_medicoes: avg, ultimas: S.vitals.slice(-6).map(({ date, time, sys, dia, pulse }) => ({ data: date, hora: time || null, sistolica: sys, diastolica: dia, pulso: pulse })), classificacao: bpClass({ sys: avg.sys, dia: avg.dia }) || "normal" };
  }

  // ---------------------------------------------------------------------------
  // Base clínica usada na geração do plano.
  // Fontes: advisory conjunto ACLM/ASN/OMA/TOS 2025 sobre nutrição com GLP-1
  // (proteína 1,2–1,6 g/kg, 0,3–0,4 g/kg por refeição, 2,5–3 g de leucina);
  // revisão "Medical nutrition in the GLP-1 era" (PubMed 42036071); consenso
  // multidisciplinar sobre efeitos gastrointestinais dos agonistas GLP-1
  // (PMC9821052); revisão sistemática sobre ordem das refeições (PMC13007804)
  // e ensaio cruzado em diabetes tipo 2 (PMC4742500).
  // ---------------------------------------------------------------------------
  /**
   * Cálculos de referência feitos na página, para o modelo não ter de fazer aritmética.
   * Peso ideal = 25 × altura²; peso ajustado = ideal + 0,25 × excesso (convenção ASPEN/ESPEN).
   * Proteína = max(1,4 × ajustado; 1,5 × ideal), com piso de 80 g (mulher) / 100 g (homem).
   */
  function planTargets(p) {
    const w = p.current_weight_kg ?? p.weight_kg, h = p.height_cm;
    if (!w) return null;
    const female = (p.sex || "feminino") !== "masculino";
    const ideal = h ? 25 * Math.pow(h / 100, 2) : w;
    const adj = w > ideal ? ideal + 0.25 * (w - ideal) : w;
    const prot = Math.max(1.4 * adj, 1.5 * ideal, female ? 80 : 100);
    const perMeal = 0.4 * adj;
    const liquid = waterGoal(p).ml;
    return {
      peso_ideal_kg: Math.round(ideal * 10) / 10,
      peso_ajustado_kg: Math.round(adj * 10) / 10,
      proteina_alvo_g_dia: Math.round(prot),
      proteina_por_refeicao_g: `${Math.round(perMeal)} g (usa 25–35 g; 35–40 g se tiver 65 anos ou mais)`,
      energia_piso_kcal: female ? 1200 : 1500,
      liquidos_alvo_ml: liquid,
      fibra_alvo_g: "22 a 28",
      ritmo_de_perda_alvo: "0,5 a 1,0 kg por semana",
    };
  }

  // ---------------------------------------------------------------------------
  // Base clínica usada na geração do plano. Principais fontes:
  // advisory conjunto ACLM/ASN/OMA/TOS 2025 sobre nutrição com GLP-1; ESPEN/UEG
  // (peso ajustado); AHA/ACC/TOS 2013 (faixas de energia); STEP 1 (NEJM 2021) e
  // SURMOUNT-1 (composição corporal); consenso multidisciplinar sobre efeitos
  // gastrointestinais dos agonistas GLP-1; Shukla 2015 e revisão sistemática de
  // 2026 (ordem dos alimentos); Buffey 2022 (caminhada pós-refeição);
  // meta-análise de UDCA e gordura na litíase por perda rápida de peso; EFSA
  // (água e fibra); Roda dos Alimentos (DGS) e IAN-AF 2015-2016.
  // Nenhum ensaio aleatorizado testou uma intervenção nutricional em utilizadores
  // de GLP-1: quase tudo abaixo é consenso de peritos ou extrapolação.
  // ---------------------------------------------------------------------------
  const PLAN_KNOWLEDGE = `BASE CLÍNICA A APLICAR (segue-a, ajustando ao caso):

PROTEÍNA — é a restrição mais importante, resolve-a primeiro
- O alvo diário e o alvo por refeição já vêm calculados no campo "calculos_de_referencia". Usa-os.
- Distribui por 3 a 4 aportes. Nunca menos de 20 g numa refeição principal.
- Cada aporte precisa de uma fonte rica em leucina (lacticínios, ovos, carne, peixe, soja) para chegar a cerca de 2,5 g de leucina. Leguminosas sozinhas não chegam lá: combina-as sempre com ovo, peixe ou lacticínio na mesma refeição.
- Só cerca de 43 % das pessoas com GLP-1 chegam a 1,2 g/kg. Trata a proteína como obrigação, não como aspiração.
- Sem treino de força perde-se massa muscular. Sugere 2 a 3 sessões semanais de corpo inteiro, sem prescrever treino detalhado, e coloca as mais exigentes nos dias 3 a 6 depois da injeção.
- Se o campo "composicao_corporal" mostrar que menos de 75 % do peso perdido foi gordura, ou que a massa magra está a descer, sobe a proteína para o topo da faixa, não desças mais a energia, e escreve isso no racional com a recomendação de treino de força.

ENERGIA — resolve depois da proteína
- Défice de 500 a 750 kcal/dia, nunca abaixo do piso indicado em "calculos_de_referencia".
- Se a proteína ultrapassar 35 % da energia planeada, AUMENTA a energia; nunca baixes a proteína.
- Ritmo alvo 0,5 a 1,0 kg por semana. Acima de 1,5 kg por semana aumenta o risco de cálculos na vesícula e de queda de cabelo: escreve isso no racional se o objetivo for agressivo.

GORDURA — dois limites em sentidos opostos
- Por refeição, mantém-na baixa nos dias de mais sintomas (menos de 15 g), porque a gordura é o principal desencadeante de náusea com esvaziamento gástrico lento.
- Mas NÃO faças refeições sem gordura: em perda de peso rápida a vesícula precisa de contrair. Garante pelo menos 7 a 10 g de gordura em duas refeições por dia, de preferência azeite. Refeições ultra-magras aumentam o risco de cálculos biliares.

ORDEM DAS REFEIÇÕES — depende da saciedade precoce, não é sempre igual
- Sem saciedade precoce ou ligeira: legumes ou sopa primeiro, depois proteína e gordura, hidratos no fim, fruta no fim. Reduz o pico de glicemia (em diabetes tipo 2 mediram-se menos 29 % aos 30 min e menos 37 % aos 60 min; em pessoas sem diabetes o efeito é menor).
- Saciedade precoce moderada ou grave, ou seja quando a pessoa não termina as refeições: PROTEÍNA PRIMEIRO, depois legumes, hidratos no fim. Encher o estômago com legumes volumosos faz perder o alvo proteico, que é o risco maior.
- A proteína nunca é o último item de uma refeição.
- Se a pessoa tiver uma regra própria sobre a ordem, cumpre a regra dela. Se essa regra colidir com saciedade precoce grave, cumpre-a na mesma e explica a tensão no racional.
- A sopa antes da refeição é líquido pré-refeição. Com saciedade precoce moderada ou grave, passa a sopa para depois da proteína, reduz para 150 a 200 ml, ou transforma-a em refeição completa com leguminosas e frango ou peixe desfiado.

OUTROS HÁBITOS COM EVIDÊNCIA
- Comer devagar, pelo menos 20 minutos por refeição principal, pousando os talheres. Com GLP-1 o objetivo não é comer menos, é evitar sobrecarregar o estômago.
- Caminhada de 10 a 15 minutos começada até 30 minutos depois da refeição principal: baixa a glicemia pós-refeição cerca de 17 % e alivia inchaço e refluxo.
- Jantar pelo menos 3 horas antes de deitar, alvo realista em Portugal entre as 19h30 e as 20h00.

GLP-1 — ciclo semanal da injeção
- Dias 0 a 2 depois da injeção: 4 a 6 mini-refeições, 20 a 25 g de proteína cada, menos de 15 g de gordura por refeição, volume pequeno, texturas simples, alimentos frios ou à temperatura ambiente (libertam menos cheiro e dão menos náusea). Sem fritos, enchidos, natas, molhos, picante, álcool nem gaseificadas.
- Dias 3 a 6: melhor tolerância. É aqui que se recupera proteína e micronutrientes, com leguminosas, peixe gordo, carne e mais hortícolas.
- Semana de subida de dose: repete o padrão dos dias 0 a 2 durante 5 a 7 dias. Não introduzas alimentos novos nem aumentes a fibra nessa semana.

SINTOMAS
- Náusea: refeições de 150 a 250 g, gordura baixa, alimentos frios, sólidos secos simples ao acordar, chá de gengibre entre refeições, sem líquidos à refeição.
- Vómitos: líquidos claros em goles de 30 a 50 ml de 15 em 15 minutos, depois soluções de rehidratação oral, depois alimentos leves. Nunca compensar com uma refeição grande.
- Saciedade precoce: alimentos com muita proteína por caloria (peixe, frango, queijo fresco magro, requeijão, atum em água, claras); batido com 25 a 30 g de proteína em 200 a 250 ml nos piores dias.
- Obstipação: fibra solúvel primeiro (aveia, psílio, kiwi, ameixa, leguminosas bem cozidas), mais água, caminhada.
- Diarreia: menos fibra insolúvel e menos adoçantes tipo sorbitol, maltitol e xilitol (frequentes em produtos sem açúcar e barras proteicas); arroz, banana, maçã cozida, batata, cenoura cozida.
- Refluxo: refeições pequenas, última refeição 3 horas antes de deitar, ficar de pé ou sentada 60 minutos depois de comer, menos gordura, fritos, picante, chocolate, hortelã-pimenta, café, citrinos e gaseificadas. Nesta pessoa não sugiras vinagre antes das refeições.
- Arrotos com cheiro a enxofre: distribui as crucíferas, o alho, a cebola e os ovos por vários dias em vez de os concentrar numa refeição.
- Inchaço: reduz primeiro os fermentáveis rápidos (inulina, chicória, frutanos, poliois), não a fibra total. Demolha e lava bem as leguminosas e começa por 2 colheres de sopa cozinhadas.
- Cansaço: verifica primeiro se a energia e a proteína planeadas estão a ser mesmo comidas, antes de pensar em análises.
- Queda de cabelo: aparece 2 a 4 meses depois de perda rápida, é reversível, e o principal fator é a velocidade da perda. Reforça proteína, ferro, zinco e vitamina D e abranda o ritmo.

FIBRA
- 22 a 28 g por dia, pelo menos metade solúvel. Em Portugal a média real é 17,8 g, por isso sobe devagar: mais 3 a 5 g por semana, sempre com mais 250 ml de água por cada 5 g. Não aumentes a fibra na semana de subida de dose.

LÍQUIDOS
- O alvo está calculado em "calculos_de_referencia". Distribui por 8 a 10 momentos.
- Parar de beber 30 minutos antes da refeição e retomar 30 a 60 minutos depois: o líquido ocupa um estômago que já esvazia devagar e desloca a proteína.
- Soluções de rehidratação oral só em dias de vómitos ou diarreia. Em dias normais não são precisas bebidas com eletrólitos.
- Há relatos de lesão renal aguda em quem desidratou com sintomas gastrointestinais. Leva a hidratação a sério.

MICRONUTRIENTES EM RISCO: vitamina D (o mais frequente, 7,5 % aos 6 meses e 13,6 % aos 12), ferro e ferritina (mais baixas do que em comparadores), cálcio, vitamina B12, tiamina (há casos de encefalopatia de Wernicke após vómitos prolongados), folato, magnésio e potássio. Mais de 60 % dos utilizadores não chega às necessidades de cálcio e ferro. Enche o plano com alimentos ricos nos que estiverem baixos nas análises e diz isso no racional. Não prescrevas suplementos novos.

ANÁLISES E CONDIÇÕES
- Glicemia em jejum ou HbA1c elevadas: hidratos de baixo índice glicémico sempre acompanhados de proteína e legumes, menos açúcar livre.
- LDL ou colesterol total altos: menos gordura saturada (carnes gordas, enchidos, manteiga, natas, queijos curados), mais fibra solúvel, azeite, frutos secos e peixe gordo 2 a 3 vezes por semana.
- Triglicéridos altos: menos açúcar, álcool e farinhas refinadas.
- Ferritina, ferro ou hemoglobina baixos: amêijoa, berbigão, mexilhão, fígado, carne vermelha magra, leguminosas e vegetais verde-escuros, sempre com cerca de 50 mg de vitamina C na mesma refeição (uma laranja pequena, meio pimento cru, 100 g de brócolos), sem lacticínio à mesma refeição, e café ou chá só uma hora depois.
- Vitamina D baixa: sardinha, cavala, salmão, gema de ovo, cogumelos. Com obesidade são precisas doses maiores, o que é decisão médica.
- B12 ou folato baixos: sardinha, atum, ovos, lacticínios, fígado, leguminosas, folhas verdes, laranja.
- Cálcio: sardinha com espinha, lacticínios, couve galega, brócolos, amêndoa.
- Função renal reduzida (eGFR abaixo de 60) ou ureia alta: proteína no limite inferior e menos sal, e escreve no racional que a dose de proteína tem de ser confirmada pelo médico.
- Ácido úrico alto: menos vísceras, marisco, cerveja e bebidas açucaradas.
- Tensão arterial elevada ou alta: sal abaixo de 5 g por dia (sem sal à mesa, poucos enchidos, queijos curados, conservas, caldos e pré-cozinhados), mais potássio de legumes, fruta e leguminosas, padrão mediterrânico ou DASH.
- Alterações no ECG, ecocardiograma ou outros documentos: respeita o que lá está e modera cafeína e estimulantes quando for pertinente.

MEDICAÇÃO E SUPLEMENTOS — indica a hora de cada um e o que separar
- Ferro: longe de cálcio, café e chá (pelo menos 1 hora), com vitamina C.
- Levotiroxina: em jejum, 30 a 60 minutos antes do pequeno-almoço, só com água; o café reduz a absorção cerca de um terço; separar 4 horas de cálcio, ferro e soja.
- Vitamina D e outras vitaminas lipossolúveis: numa refeição com gordura.
- Magnésio: à noite. O citrato serve para obstipação e reposição, o bisglicinato é o mais suave se houver diarreia, o óxido é sobretudo laxante.
- Nunca alteres doses nem sugiras suplementos novos; organiza apenas horários.
- Se a pessoa tomar sulfonilureia ou insulina, não planeies jejuns nem cortes bruscos, e diz que a medicação pode precisar de ajuste médico.

SINAIS DE ALARME a incluir nas notas quando forem pertinentes: dor abdominal intensa que irradia para as costas (pancreatite), confusão com desequilíbrio e visão dupla depois de vómitos prolongados (défice de tiamina), incapacidade de reter líquidos mais de 24 horas, urinar pouco ou nada, tonturas com coração acelerado. Todos exigem contacto médico imediato.

COZINHA PORTUGUESA
- Peixe: atum em água cerca de 25 g de proteína por 100 g, bacalhau demolhado 19 a 21, sardinha e salmão 20, carapau e cavala 19, pescada 17, polvo 16. Amêijoa, berbigão e mexilhão são das melhores fontes de ferro e B12 disponíveis; sardinha de lata com espinha dá cálcio.
- Carne: peito de frango e peru 23 a 25 g, lombo de porco e vitela magra 21, fígado 20 com muito ferro e B12.
- Ovo M cerca de 6,3 g de proteína. Skyr e iogurte grego 10, queijo fresco magro 11 a 13, requeijão 11.
- Leguminosas cozinhadas: lentilhas 9, grão 8 a 9, feijão 7 a 9, favas 7, ervilhas 5. Tremoços 15 a 16 g de proteína com muita fibra, mas com muito sal: lavar bem.
- Pratos que encaixam: peixe grelhado com hortícolas e batata; bacalhau cozido com grão e couve; caldeirada; salada de atum com grão e ovo; jardineira com carne magra; feijoada de feijão branco sem enchidos; frango assado sem pele com salada e batata-doce; carne de porco à alentejana com batata cozida.
- Evita como base: açorda, migas, arroz de marisco, bacalhau com natas, pastéis de bacalhau, folhados, pão com chouriço e pastéis de nata. São pouco densos em proteína e a gordura desencadeia náusea.

MEDIDAS CASEIRAS (Roda dos Alimentos, DGS) — usa-as em medida_caseira e diz sempre em "estado" se o peso é cru ou cozinhado, que é a maior fonte de erro:
- colher de sopa 15 ml · colher de sobremesa 10 ml · colher de chá 5 ml · chávena almoçadeira 240–250 ml · copo 200–250 ml
- arroz ou massa: 35 g crus = 2 c. sopa · 110 g cozinhados = 4 c. sopa
- leguminosas: 25 g secas = 1 c. sopa · 80 g cozinhadas = 3 c. sopa
- hortícolas: 180 g crus = 2 chávenas almoçadeiras · 140 g cozinhados = 1 chávena almoçadeira
- azeite 10 g = 1 c. sopa rasa · manteiga 15 g = 1 c. sobremesa
- leite 250 ml = 1 chávena almoçadeira · iogurte sólido 1 unidade ≈ 125 g · queijo 40 g = 2 fatias finas · queijo fresco 50 g = ¼ de unidade · requeijão 100 g = ½ unidade
- ovo médio 55 g · pão 50 g = 1 papo-seco · batata média ≈ 85 g · fruta média 160 g = 1 peça
- ATENÇÃO: a porção da Roda para carne e peixe (25 a 30 g) é uma unidade de contabilidade, não uma dose de refeição. Uma dose real de almoço são 120 a 150 g crus. Não confundas, senão o plano fica muito abaixo da proteína necessária.

LIMITES DE ATUAÇÃO (obrigatórios)
- Em Portugal a prescrição dietética é ato próprio do nutricionista. Isto é uma sugestão alimentar de apoio: nunca uses as palavras prescrever, tratamento ou terapêutica.
- Não alteres doses de medicamentos nem sugiras suplementos novos; organiza apenas o horário do que já é tomado.
- Se os dados indicarem gravidez, amamentação, menos de 18 anos, IMC abaixo de 18,5, história de perturbação do comportamento alimentar, doença renal ou hepática, ou perda de peso muito rápida, mantém o plano conservador e diz no racional que precisa de validação profissional.`;

  const DAY_SCHEMA = `{"dias":[{"dia":"segunda","refeicoes":[{
"nome":"Almoço","hora":"13:00",
"ordem":["sopa/legumes","proteína","hidratos","fruta"],
"itens":[{"alimento":"peito de frango grelhado","quantidade":"130 g","estado":"cru","medida_caseira":"1 bife médio","grupo":"proteina"}],
"preparacao":"1 a 2 frases sobre confeção e tempero",
"porque":"1 frase curta a explicar o papel desta refeição no plano",
"alternativas":[{"em_vez_de":"frango","trocar_por":"pescada 160 g ou grão-de-bico cozido 180 g"}],
"kcal":460,"proteina_g":38,"hidratos_g":42,"gordura_g":14,"fibra_g":8}]}]}`;

  const FRAME_SCHEMA = `{
"metas_diarias":{"kcal":1500,"proteina_g":110,"hidratos_g":140,"gordura_g":55,"fibra_g":28,"agua_ml":2600,"sal_g":5},
"racional":"3 a 5 frases com os números que usaste: g/kg de proteína e sobre que peso, défice em kcal, e o que mudaste por causa das análises, da tensão e dos documentos",
"principios":["4 a 8 princípios curtos que orientam a semana"],
"regras_aplicadas":[{"regra":"copia literal de cada regra obrigatória da pessoa","como":"onde e como foi aplicada"}],
"estrutura_do_dia":[{"nome":"Pequeno-almoço","hora":"08:00","kcal":320,"proteina_g":25}],
"suplementos":[{"nome":"nome e dose tal como a pessoa os toma","hora":"HH:MM","nota":"porquê a essa hora e o que separar"}],
"hidratacao":[{"hora":"07:30","quantidade_ml":250,"nota":"ao acordar, em goles"}],
"dias_dificeis":{"nauseas":["..."],"obstipacao":["..."],"diarreia":["..."],"refluxo":["..."],"dia_da_injecao":["..."],"sem_apetite":["..."],"fora_de_casa":["como escolher num restaurante, incluindo o método do prato: metade legumes, um quarto proteína, um quarto hidratos"],"sem_tempo":["o que fazer quando não há tempo para cozinhar"]},
"preparacao_antecipada":["3 a 6 tarefas a fazer de uma vez, com o que rendem e quantos dias duram no frigorífico"]
}`;

  /** Gera o plano em etapas, para que cada resposta caiba e fique detalhada. */
  async function generatePlan() {
    if (!S.sample) { $("planNote").hidden = false; $("planNote").textContent = "A geração do plano só funciona com a página aberta no claude.ai."; return; }
    const p = profile();
    if (!p.weight_kg) { $("planNote").hidden = false; $("planNote").innerHTML = `Preenche pelo menos o <strong>peso atual</strong> no perfil antes de gerar o plano.`; return; }
    if (S.plan && !(await askConfirm("Gerar um plano novo substitui o atual. A versão anterior fica guardada e podes repô-la.", "Gerar novo plano"))) return;
    $("planNote").hidden = true;

    const ctl = new AbortController(); S.generating = ctl;
    $("genPlan").disabled = true; $("regenPlan").disabled = true; $("genProgress").hidden = false;
    const bar = $("genProgress").firstElementChild;
    const step = (pct, msg) => { bar.style.width = pct + "%"; $("genMsg").textContent = msg; };
    const ctx = planPromptContext();
    const rules = S.rules.length
      ? `REGRAS OBRIGATÓRIAS DESTA PESSOA — tens de as cumprir em todos os dias e refeições, e depois declarar em "regras_aplicadas" onde cada uma foi aplicada:\n${S.rules.map((r, i) => `${i + 1}. ${r.texto}`).join("\n")}\n\nSe alguma regra entrar em conflito com a base clínica, cumpre a regra e explica o ajuste no racional.`
      : `A pessoa ainda não definiu regras próprias.`;
    const head = `És nutricionista e estás a preparar um plano alimentar para uma app familiar privada, em português de Portugal.\n\n${rules}\n\n${PLAN_KNOWLEDGE}\n\nDADOS DA PESSOA (JSON):\n${ctx}`;
    const ask = (prompt, msg, pct, tier) => { step(pct, msg); return S.sample.json(prompt, { signal: ctl.signal, cache: false, modelTier: tier || "default" }); };

    let err = null, plan = null;
    try {
      // 1. estrutura do plano
      const frame = await ask(`${head}\n\nPasso 1 de 3: define a ESTRUTURA do plano semanal (ainda sem as refeições em detalhe).\nResponde APENAS com JSON válido nesta forma:\n${FRAME_SCHEMA}`,
        "A calcular metas e estrutura… (1 de 3)", 10, "complex");
      if (!frame?.metas_diarias) throw { code: "invalid_json", message: "estrutura incompleta" };

      const frameTxt = JSON.stringify({ metas_diarias: frame.metas_diarias, estrutura_do_dia: frame.estrutura_do_dia || [], principios: frame.principios || [], regras_aplicadas: frame.regras_aplicadas || [] });
      // 2. refeições, em dois blocos para caberem
      const blocks = [["segunda", "terça", "quarta", "quinta"], ["sexta", "sábado", "domingo"]];
      const dias = [];
      for (let i = 0; i < blocks.length; i++) {
        const jaFeitos = dias.length ? `\nJá planeaste estes dias, não repitas as mesmas refeições:\n${JSON.stringify(dias.map((d) => ({ dia: d.dia, refeicoes: d.refeicoes.map((m) => m.itens.map((x) => x.alimento).join(", ")) })))}` : "";
        const res = await ask(`${head}\n\nESTRUTURA JÁ DEFINIDA (respeita-a):\n${frameTxt}${jaFeitos}\n\nPasso ${i + 2} de 3: escreve as refeições completas destes dias: ${blocks[i].join(", ")}.\nCada refeição leva ordem de ingestão, itens com gramas e medida caseira e grupo (proteina, legumes, hidratos, gordura, fruta, lacticinio), preparação e pelo menos uma alternativa. Os totais do dia têm de bater certo com as metas.\nResponde APENAS com JSON válido nesta forma:\n${DAY_SCHEMA}`,
          `A escrever as refeições… (${i + 2} de 3)`, 25 + i * 30);
        const got = Array.isArray(res?.dias) ? res.dias : [];
        blocks[i].forEach((d) => {
          const f = got.find((x) => norm(x.dia) === norm(d)) || got[blocks[i].indexOf(d)];
          dias.push({ dia: d, refeicoes: ((f && f.refeicoes) || []).map(normMeal) });
        });
      }
      if (dias.every((d) => d.refeicoes.length === 0)) throw { code: "invalid_json", message: "sem refeições" };

      // 3. lista de compras
      let compras = [];
      try {
        const resumo = dias.map((d) => `${d.dia}: ${d.refeicoes.map((m) => m.itens.map((i) => `${i.alimento} ${i.quantidade}`).join("; ")).join(" | ")}`).join("\n");
        const r = await ask(`Com base neste plano de 7 dias, escreve a lista de compras somando as quantidades de cada alimento para a semana inteira, agrupada por categoria (Proteína, Peixe, Legumes, Fruta, Mercearia, Lacticínios, Outros). Usa português de Portugal e quantidades práticas de supermercado.\n\n${resumo}\n\nResponde APENAS com JSON: {"lista_compras":[{"categoria":"Proteína","itens":[{"alimento":"peito de frango","quantidade":"900 g"}]}]}`,
          "A fazer a lista de compras… (3 de 3)", 85, "quick");
        compras = Array.isArray(r?.lista_compras) ? r.lista_compras : [];
      } catch (e) { if (e?.code === "cancelled") throw e; console.warn("compras", e); }

      const hidr = (Array.isArray(frame.hidratacao) ? frame.hidratacao : []).map((h) => ({ hora: String(h.hora || ""), quantidade_ml: Math.round(Number(h.quantidade_ml) || 0), nota: String(h.nota || "") })).filter((h) => h.quantidade_ml > 0).sort((a, b) => a.hora.localeCompare(b.hora));
      plan = {
        metas_diarias: frame.metas_diarias || {},
        racional: String(frame.racional || ""),
        principios: (frame.principios || []).map(String).slice(0, 8),
        regras_aplicadas: (frame.regras_aplicadas || []).map((r) => ({ regra: String(r.regra || ""), como: String(r.como || "") })).filter((r) => r.regra),
        suplementos: (frame.suplementos || []).map((x) => ({ nome: String(x.nome || ""), hora: String(x.hora || ""), nota: String(x.nota || "") })).filter((x) => x.nome),
        dias_dificeis: frame.dias_dificeis && typeof frame.dias_dificeis === "object" ? frame.dias_dificeis : {},
        preparacao_antecipada: (frame.preparacao_antecipada || []).map(String).slice(0, 8),
        lista_compras: compras.map((c) => ({ categoria: String(c.categoria || ""), itens: (c.itens || []).map((x) => typeof x === "string" ? x : { alimento: String(x.alimento || ""), quantidade: String(x.quantidade || "") }) })).filter((c) => c.categoria),
        hidratacao: hidr,
        dias,
      };
    } catch (e) { err = e; }

    S.generating = null;
    $("genPlan").disabled = false; $("regenPlan").disabled = false; $("genProgress").hidden = true; bar.style.width = "0%";
    if (err) {
      if (err.code !== "cancelled") {
        $("planNote").hidden = false;
        $("planNote").textContent = err.code === "invalid_json" ? "O plano veio incompleto. Tenta gerar outra vez." : (ERR_COPY[err.code] || "Não foi possível gerar o plano. Tenta outra vez.");
        S.diag.lastErr = `plano: ${err.code || err.message}`; renderDiag();
      }
      $("genMsg").textContent = ""; return;
    }
    S.plan = { week_start: mondayOf(), version: (S.plan?.version || 0) + 1, plan, previous: S.plan?.plan || null, extras: (S.plan?.extras || []).filter((x) => x.date >= addDays(localDate(), -7)), changelog: [{ at: new Date().toISOString(), o_que: "Plano gerado" }], generatedAt: new Date().toISOString() };
    S.planDay = todayDayName();
    await savePlan();
    $("genMsg").textContent = "Plano gerado ✓"; setTimeout(() => $("genMsg").textContent = "", 4000);
  }

  // ============================================================
  // Alimentos e macros calculados na página
  // ============================================================
  const FOODS = (window.NG_FOODS || []).map(([nome, kcal, prot, hc, gord, fibra, o = {}]) => ({
    nome, kcal, prot, hc, gord, fibra, aliases: o.aliases || [], un: o.un || null, cs: o.cs ?? 12, cc: o.cc ?? 4, estado: o.estado || "",
  }));
  /** Índice: nome normalizado → alimento, com os nomes mais longos primeiro (para a busca por contenção). */
  const FOOD_KEYS = (() => {
    const list = [];
    FOODS.forEach((f) => { [f.nome, ...f.aliases].forEach((a) => list.push({ k: norm(a), f })); });
    list.sort((a, b) => b.k.length - a.k.length);
    return list;
  })();
  const FOOD_EXACT = new Map(FOOD_KEYS.map((x) => [x.k, x.f]));

  /** Reconhece um alimento pelo nome como vem no plano ("peito de frango grelhado (sem pele)"). */
  function findFood(name) {
    let n = norm(name).replace(/\([^)]*\)/g, " ").replace(/[,;:]/g, " ").replace(/\s+/g, " ").trim();
    if (!n) return null;
    if (FOOD_EXACT.has(n)) return FOOD_EXACT.get(n);
    const padded = " " + n + " ";
    for (const { k, f } of FOOD_KEYS) if (k.length >= 3 && padded.includes(" " + k + " ")) return f;
    // singular/plural simples
    const sing = n.replace(/s\b/g, "");
    if (FOOD_EXACT.has(sing)) return FOOD_EXACT.get(sing);
    return null;
  }

  /** Converte "130 g", "1,5 kg", "2 unidades", "4 c. sopa", "1 chávena", "q.b." em gramas. */
  function gramsOf(qty, food) {
    let q = norm(qty).replace(",", ".").replace(/½/g, "0.5").replace(/¼/g, "0.25").replace(/¾/g, "0.75").trim();
    if (!q || /^(q\.?b\.?|a gosto|quanto baste)$/.test(q)) return 0;
    const m = q.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(kg|g|gr|gramas?|ml|l|cl|dl|un|und|unid\.?|unidades?|pecas?|pecinhas?|fatias?|ovos?|c\.?\s?sopa|cs|colher(?:es)? de sopa|c\.?\s?cha|cc|colher(?:es)? de cha|colher(?:es)? de sobremesa|c\.?\s?sobremesa|chavenas?|copos?|conchas?|pratos?|scoops?|doses?|pitadas?|dentes?|latas?|iogurtes?)?\b/);
    if (!m) return null;
    let n = m[1].includes("/") ? (Number(m[1].split("/")[0]) / Number(m[1].split("/")[1])) : Number(m[1]);
    if (!Number.isFinite(n)) return null;
    const u = (m[2] || "").replace(/\s+/g, "").replace(/\./g, "");
    const un = food?.un || 100;
    if (["kg"].includes(u)) return n * 1000;
    if (["g", "gr", "grama", "gramas", ""].includes(u)) return n;
    if (u === "ml") return n;
    if (u === "l") return n * 1000;
    if (u === "cl") return n * 10;
    if (u === "dl") return n * 100;
    if (/^(un|und|unid|unidade|unidades|peca|pecas|pecinha|pecinhas|ovo|ovos|iogurte|iogurtes)$/.test(u)) return n * un;
    if (/^(fatia|fatias)$/.test(u)) return n * (food?.un || 20);
    if (/^(csopa|cs|colherdesopa|colheresdesopa)$/.test(u)) return n * (food?.cs ?? 12);
    if (/^(ccha|cc|colherdecha|colheresdecha)$/.test(u)) return n * (food?.cc ?? 4);
    if (/^(csobremesa|colherdesobremesa|colheresdesobremesa)$/.test(u)) return n * ((food?.cs ?? 12) * 0.66);
    if (/^(chavena|chavenas)$/.test(u)) return n * 240;
    if (/^(copo|copos)$/.test(u)) return n * 200;
    if (/^(concha|conchas)$/.test(u)) return n * 150;
    if (/^(prato|pratos)$/.test(u)) return n * 250;
    if (/^(scoop|scoops|dose|doses)$/.test(u)) return n * (food?.un || 30);
    if (/^(pitada|pitadas)$/.test(u)) return n * 0.5;
    if (/^(dente|dentes)$/.test(u)) return n * 3;
    if (/^(lata|latas)$/.test(u)) return n * (food?.un || 100);
    return n;
  }

  /** Macros de uma refeição calculados pela tabela; cai nos valores do modelo quando a cobertura é baixa. */
  function mealMacros(m) {
    const rows = []; let tot = { kcal: 0, prot: 0, hc: 0, gord: 0, fibra: 0 }, gAll = 0, gHit = 0;
    for (const it of m.itens || []) {
      const f = findFood(it.alimento); const g = gramsOf(it.quantidade, f);
      const ok = f && g !== null;
      if (g) gAll += g;
      if (ok) { gHit += g; ["kcal", "prot", "hc", "gord", "fibra"].forEach((k) => { tot[k] += f[k] * g / 100; }); }
      rows.push({ ...it, food: f, g, ok });
    }
    const coverage = gAll ? gHit / gAll : 0;
    const computed = rows.length > 0 && coverage >= 0.7;
    const r = (v) => Math.round(v);
    return computed
      ? { kcal: r(tot.kcal), proteina_g: r(tot.prot), hidratos_g: r(tot.hc), gordura_g: r(tot.gord), fibra_g: Math.round(tot.fibra * 10) / 10, computed: true, coverage, rows }
      : { kcal: r(m.kcal || 0), proteina_g: r(m.proteina_g || 0), hidratos_g: r(m.hidratos_g || 0), gordura_g: r(m.gordura_g || 0), fibra_g: Math.round((m.fibra_g || 0) * 10) / 10, computed: false, coverage, rows };
  }
  function dayMacros(day) {
    return (day?.refeicoes || []).reduce((a, m) => { const x = mealMacros(m); return { kcal: a.kcal + x.kcal, proteina_g: a.proteina_g + x.proteina_g, hidratos_g: a.hidratos_g + x.hidratos_g, gordura_g: a.gordura_g + x.gordura_g, fibra_g: a.fibra_g + x.fibra_g }; }, { kcal: 0, proteina_g: 0, hidratos_g: 0, gordura_g: 0, fibra_g: 0 });
  }

  // ---------- editor de refeição à mão ----------
  function openMealEditor(dayName, idx) {
    const day = S.plan?.plan?.dias?.find((d) => d.dia === dayName); const meal = day?.refeicoes?.[idx];
    if (!meal) return;
    const wrap = document.createElement("div"); wrap.className = "modal";
    const rowsHtml = (itens) => itens.map((it, i) => `<div class="edrow" data-i="${i}">
        <input class="input" list="foodlist" value="${esc(it.alimento)}" placeholder="alimento" data-f="alimento">
        <input class="input num" value="${esc(it.quantidade)}" placeholder="130 g" data-f="quantidade">
        <button type="button" class="btn ghost sm" data-rm="${i}" aria-label="Remover">×</button>
      </div>`).join("");
    wrap.innerHTML = `<div class="box editor" role="dialog" aria-modal="true">
      <div class="row between"><h2>${esc(meal.nome)} · ${esc(dayName)}</h2><button type="button" class="btn ghost sm" data-no>Fechar</button></div>
      <div class="field"><label>Hora</label><input class="input num" id="ed_hora" value="${esc(meal.hora || "")}" style="width:110px"></div>
      <div id="edrows">${rowsHtml(meal.itens || [])}</div>
      <div class="row"><button type="button" class="btn sm" data-add>+ Item</button><span class="small muted" id="edtot"></span></div>
      <p class="hint">Escreve a quantidade em gramas, ml, unidades ou colheres. Os macros são calculados pela tabela de alimentos; itens não reconhecidos ficam a cinzento.</p>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-no>Cancelar</button><button type="button" class="btn primary" data-save>Guardar refeição</button></div>
    </div>`;
    const readRows = () => [...wrap.querySelectorAll(".edrow")].map((r) => ({ alimento: r.querySelector('[data-f="alimento"]').value.trim(), quantidade: r.querySelector('[data-f="quantidade"]').value.trim() })).filter((x) => x.alimento);
    const refresh = () => {
      const mm = mealMacros({ itens: readRows() });
      wrap.querySelectorAll(".edrow").forEach((r, i) => { r.classList.toggle("unknown", !mm.rows[i]?.ok); });
      $("edtot").textContent = mm.rows.length ? `${mm.kcal} kcal · ${mm.proteina_g} g proteína · ${mm.hidratos_g} g hidratos · ${mm.gordura_g} g gordura · ${mm.fibra_g} g fibra${mm.computed ? "" : " (cobertura insuficiente: ficam os valores anteriores)"}` : "";
    };
    wrap.addEventListener("input", refresh);
    wrap.addEventListener("click", async (e) => {
      if (e.target === wrap || e.target.closest("[data-no]")) { wrap.remove(); return; }
      const rm = e.target.closest("[data-rm]"); if (rm) { rm.closest(".edrow").remove(); refresh(); return; }
      if (e.target.closest("[data-add]")) { $("edrows").insertAdjacentHTML("beforeend", rowsHtml([{ alimento: "", quantidade: "" }])); $("edrows").lastElementChild.querySelector("input").focus(); return; }
      if (e.target.closest("[data-save]")) {
        const itens = readRows(); if (itens.length === 0) return;
        const novo = normMeal({ ...meal, hora: $("ed_hora").value.trim(), itens: itens.map((it) => { const old = (meal.itens || []).find((o) => norm(o.alimento) === norm(it.alimento)); const f = findFood(it.alimento); return { alimento: it.alimento, quantidade: it.quantidade, estado: old?.estado || f?.estado || "", medida_caseira: old?.medida_caseira || "", grupo: old?.grupo || guessGroup(f) }; }) });
        const mm = mealMacros(novo);
        if (mm.computed) Object.assign(novo, { kcal: mm.kcal, proteina_g: mm.proteina_g, hidratos_g: mm.hidratos_g, gordura_g: mm.gordura_g, fibra_g: mm.fibra_g });
        const plan = JSON.parse(JSON.stringify(S.plan.plan));
        plan.dias.find((d) => d.dia === dayName).refeicoes[idx] = novo;
        S.plan = { ...S.plan, plan, previous: S.plan.plan, version: (S.plan.version || 1) + 1, changelog: [...(S.plan.changelog || []), { at: new Date().toISOString(), o_que: `${meal.nome} de ${dayName} editada à mão` }].slice(-20) };
        wrap.remove(); await savePlan();
      }
    });
    document.body.appendChild(wrap); refresh();
  }
  function guessGroup(f) {
    if (!f) return "";
    if (f.prot >= 10 && f.hc < 15 && !/iogurte|queijo|leite|skyr|requeij|kefir/.test(f.nome)) return "proteina";
    if (/iogurte|queijo|leite|skyr|requeij|kefir|bebida/.test(f.nome)) return "lacticinio";
    if (f.gord >= 30) return "gordura";
    if (/fruta|maçã|pera|banana|laranja|kiwi|morango|mirtilo|uva|pêssego|ameixa|melancia|melão|figo|manga|abacate|tangerina|framboesa/.test(f.nome)) return "fruta";
    if (f.hc >= 15) return "hidratos";
    return "legumes";
  }

  function normMeal(m) {
    return {
      nome: String(m.nome || "Refeição"), hora: String(m.hora || ""),
      ordem: (m.ordem || []).map(String).slice(0, 6),
      itens: (m.itens || []).map((i) => ({ alimento: String(i.alimento || ""), quantidade: String(i.quantidade || ""), estado: String(i.estado || ""), medida_caseira: String(i.medida_caseira || ""), grupo: String(i.grupo || "") })),
      preparacao: String(m.preparacao || ""), porque: String(m.porque || ""),
      alternativas: (m.alternativas || []).map((a) => ({ em_vez_de: String(a.em_vez_de || ""), trocar_por: String(a.trocar_por || "") })).slice(0, 4),
      kcal: Number(m.kcal) || 0, proteina_g: Number(m.proteina_g) || 0, fibra_g: Number(m.fibra_g) || 0, hidratos_g: Number(m.hidratos_g) || 0, gordura_g: Number(m.gordura_g) || 0,
    };
  }

  function renderPlan() {
    const has = !!(S.plan && S.plan.plan);
    renderShopping();
    $("planEmpty").hidden = has; $("planBody").hidden = !has;
    $("planBody").style.display = has ? "flex" : "none";
    if (!has) { $("planMeta").textContent = "Plano semanal com quantidades, gerado a partir do perfil, GLP-1, análises, medicação e objetivo de peso."; return; }
    const pl = S.plan.plan; const t = pl.metas_diarias || {};
    $("planMeta").textContent = `Versão ${S.plan.version} · semana de ${S.plan.week_start}${S.plan.changelog?.length > 1 ? ` · último ajuste: ${S.plan.changelog[S.plan.changelog.length - 1].o_que}` : ""}`;
    const targetDefs = [["kcal", "kcal/dia"], ["proteina_g", "g proteína"], ["fibra_g", "g fibra"], ["agua_ml", "ml água"], ["hidratos_g", "g hidratos"], ["gordura_g", "g gordura"], ["sal_g", "g sal (máx.)"]];
    $("planTargets").innerHTML = targetDefs.filter(([k]) => t[k] !== undefined && t[k] !== null).map(([k, l]) => `<div class="target"><div class="v num">${t[k]}</div><div class="k">${l}</div></div>`).join("");
    $("planRationale").textContent = pl.racional || "";
    if (!S.planDay) S.planDay = todayDayName();
    const today = todayDayName();
    $("planDays").innerHTML = DAYS.map((d) => `<button type="button" data-day="${d}" aria-pressed="${d === S.planDay}" class="${d === today ? "today" : ""}">${d.charAt(0).toUpperCase() + d.slice(1, 3)}${d === today ? " · hoje" : ""}</button>`).join("");
    const day = pl.dias.find((x) => x.dia === S.planDay) || { refeicoes: [] };
    $("planMealsList").innerHTML = day.refeicoes.length === 0 ? `<p class="muted small">Sem refeições neste dia.</p>` : day.refeicoes.map((m, i) => mealHtml({ ...m, _day: S.planDay, _idx: i })).join("");
    const tot = dayMacros(day); const t0 = pl.metas_diarias || {};
    const vs = (v, goal) => goal ? ` <span class="muted">/ ${Math.round(goal)}</span>` : "";
    $("dayTotals").innerHTML = `Total do dia: <strong class="num">${Math.round(tot.kcal)}</strong> kcal${vs(tot.kcal, t0.kcal)} · <strong class="num">${Math.round(tot.proteina_g)}</strong> g proteína${vs(tot.proteina_g, t0.proteina_g)} · <strong class="num">${Math.round(tot.fibra_g)}</strong> g fibra${vs(tot.fibra_g, t0.fibra_g)}`;
    $("undoPlan").hidden = !S.plan.previous;
    // água ao longo do dia
    const h = pl.hidratacao || [];
    $("planWater").innerHTML = h.length ? h.map((x) => `<li><span class="h num">${esc(x.hora)}</span><span>${esc(x.nota)}</span><span class="num"><strong>${x.quantidade_ml} ml</strong></span></li>`).join("") : `<li class="muted small empty">Este plano não tem horário de água. Gera um plano novo para o incluir.</li>`;
    $("planWaterTotal").textContent = h.length ? `${h.reduce((a, x) => a + x.quantidade_ml, 0)} ml/dia` : "";
    $("planWaterNote").textContent = profile().uses_glp1 ? "Com GLP-1: goles pequenos, pouca água durante as refeições, mais entre refeições. Em dias de náuseas, água fresca em goles frequentes." : "";
    // princípios, regras, suplementos, dias difíceis, compras
    const princ = pl.principios || [];
    $("planPrinciples").innerHTML = princ.length ? `<div class="chiprow">${princ.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : "";
    const regras = pl.regras_aplicadas || [];
    $("planRulesCard").hidden = regras.length === 0;
    $("planRules").innerHTML = regras.map((r) => `<div class="rule"><span class="ck">✓</span><span><strong>${esc(r.regra)}</strong>${r.como ? `<br><span class="muted">${esc(r.como)}</span>` : ""}</span></div>`).join("");
    const supp = pl.suplementos || [];
    $("planSuppCard").hidden = supp.length === 0;
    $("planSupp").innerHTML = supp.map((x) => `<li><span class="h num">${esc(x.hora || "—")}</span><span>${esc(x.nome)}${x.nota ? `<br><span class="n">${esc(x.nota)}</span>` : ""}</span><span></span></li>`).join("");
    const hard = pl.dias_dificeis || {};
    const HARD_LABEL = { nauseas: "Náuseas ou enjoo", obstipacao: "Obstipação", diarreia: "Diarreia", refluxo: "Refluxo ou azia", enfartamento: "Enfartamento", cansaco: "Cansaço", dia_da_injecao: "Dia da injeção", sem_apetite: "Sem apetite", fora_de_casa: "Refeições fora de casa" };
    const hardKeys = Object.keys(hard).filter((k) => (hard[k] || []).length);
    $("planHardCard").hidden = hardKeys.length === 0;
    $("planHard").innerHTML = hardKeys.map((k) => `<div class="doc"><div class="t">${esc(HARD_LABEL[norm(k).replace(/ /g, "_")] || k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()))}</div><ul>${hard[k].map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
    // fora do plano (dia selecionado)
    const dayDate = dateOfPlanDay(S.planDay);
    const extras = (S.plan.extras || []).filter((x) => x.date === dayDate);
    $("planExtrasCard").hidden = extras.length === 0;
    $("planExtrasDay").textContent = dayDate;
    $("planExtras").innerHTML = extras.map((x) => `<div class="extra"><span>${esc(x.descricao)}${x.kcal ? ` <span class="muted small num">~${Math.round(x.kcal)} kcal · ${Math.round(x.proteina_g || 0)} g prot</span>` : ""}</span><button type="button" class="btn ghost sm" data-delextra="${x.id}">remover</button></div>`).join("");
  }
  /**
   * Interpreta "900 g", "1,5 kg", "2 unidades" para poder somar listas de compras.
   * Devolve null quando não consegue, e nesse caso as quantidades ficam lado a lado.
   */
  function parseQty(str) {
    const m = String(str || "").trim().match(/^([\d]+(?:[.,][\d]+)?)\s*(kg|kgs|g|gr|gramas|ml|l|lt|litros?|un|und|unid|unidades?|peças?|doses?)?\.?$/i);
    if (!m) return null;
    const n = Number(m[1].replace(",", "."));
    if (!Number.isFinite(n)) return null;
    const u = norm(m[2] || "un");
    if (["kg", "kgs"].includes(u)) return { n: n * 1000, u: "g" };
    if (["g", "gr", "gramas"].includes(u)) return { n, u: "g" };
    if (["l", "lt", "litro", "litros"].includes(u)) return { n: n * 1000, u: "ml" };
    if (u === "ml") return { n, u: "ml" };
    return { n, u: "un" };
  }
  function fmtQty(q) {
    if (q.u === "g") return q.n >= 1000 ? `${fmtNum(Math.round(q.n / 100) / 10)} kg` : `${Math.round(q.n)} g`;
    if (q.u === "ml") return q.n >= 1000 ? `${fmtNum(Math.round(q.n / 100) / 10)} L` : `${Math.round(q.n)} ml`;
    const n = Math.round(q.n * 10) / 10;
    return `${fmtNum(n)} ${n === 1 ? "unidade" : "unidades"}`;
  }
  const CAT_ORDER = ["proteina", "carne", "peixe", "lacticinios", "legumes", "horticolas", "fruta", "mercearia", "congelados", "outros"];
  /** Junta as listas de compras de vários planos, somando o que for somável. */
  function mergeShopping(lists) {
    const cats = new Map();
    for (const { label, lista } of lists) {
      for (const c of lista) {
        const key = norm(c.categoria);
        if (!cats.has(key)) cats.set(key, { categoria: c.categoria, itens: new Map() });
        const bucket = cats.get(key).itens;
        for (const raw of c.itens || []) {
          const nome = typeof raw === "string" ? raw : raw.alimento;
          const qtd = typeof raw === "string" ? "" : raw.quantidade;
          const k = norm(nome);
          if (!k) continue;
          if (!bucket.has(k)) bucket.set(k, { alimento: nome, soma: null, partes: [] });
          const it = bucket.get(k);
          const q = parseQty(qtd);
          if (q && (it.soma === null || it.soma.u === q.u) && it.partes.every((x) => x.q)) {
            it.soma = it.soma ? { n: it.soma.n + q.n, u: q.u } : q;
          } else it.soma = null;
          it.partes.push({ label, qtd, q });
        }
      }
    }
    const order = (k) => { const i = CAT_ORDER.findIndex((c) => k.includes(c)); return i < 0 ? 99 : i; };
    return [...cats.entries()].sort((a, b) => order(a[0]) - order(b[0])).map(([, c]) => ({
      categoria: c.categoria,
      itens: [...c.itens.values()].map((it) => ({
        alimento: it.alimento,
        quantidade: it.soma ? fmtQty(it.soma) : it.partes.map((x) => x.qtd).filter(Boolean).join(" + "),
        detalhe: lists.length > 1 && it.partes.length > 1 ? it.partes.map((x) => `${x.label}: ${x.qtd || "?"}`).join(" · ") : "",
      })),
    }));
  }

  function renderShopping() {
    const card = $("planShopCard"); if (!card) return;
    const withList = PROFILE_IDS.filter((id) => ((S.plans[id]?.plan?.lista_compras) || []).length > 0);
    const prep0 = S.plan?.plan?.preparacao_antecipada || [];
    card.hidden = withList.length === 0 && prep0.length === 0;
    if (card.hidden) return;

    const nameOf = (id) => S.profiles[id]?.name || DEFAULT_NAMES[id];
    if (!S.shopWho || (S.shopWho !== "todos" && !withList.includes(S.shopWho))) S.shopWho = withList.includes(S.pid) ? S.pid : (withList[0] || S.pid);
    $("shopWho").innerHTML = withList.length > 1
      ? [...withList.map((id) => ({ v: id, t: nameOf(id) })), { v: "todos", t: "As duas" }]
        .map((o) => `<button type="button" data-shopwho="${o.v}" aria-pressed="${S.shopWho === o.v}">${esc(o.t)}</button>`).join("")
      : "";

    const chosen = S.shopWho === "todos" ? withList : [S.shopWho];
    const lists = chosen.filter((id) => S.plans[id]?.plan?.lista_compras).map((id) => ({ label: nameOf(id), lista: S.plans[id].plan.lista_compras }));
    const merged = lists.length ? mergeShopping(lists) : [];
    $("shopNote").textContent = lists.length > 1
      ? `Somadas as listas de ${lists.map((l) => l.label).join(" e ")}.`
      : lists.length === 1
        ? (chosen[0] === S.pid ? (withList.length > 1 ? `Só a lista de ${lists[0].label}.` : "") : `Lista de ${lists[0].label}. Ainda não tens plano próprio.`)
        : "";

    $("planShop").innerHTML =
      (prep0.length ? `<h3>Preparar de uma vez</h3><ul>${prep0.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "") +
      merged.map((c) => `<h3>${esc(c.categoria)}</h3><ul>${c.itens.map((x) => `<li>${esc(x.alimento)}${x.quantidade ? ` — <strong>${esc(x.quantidade)}</strong>` : ""}${x.detalhe ? `<br><span class="meta muted">${esc(x.detalhe)}</span>` : ""}</li>`).join("")}</ul>`).join("");
  }

  /** Data (YYYY-MM-DD) de um dia da semana do plano, na semana corrente. */
  function dateOfPlanDay(day) { const i = DAYS.indexOf(day); return addDays(mondayOf(), i < 0 ? 0 : i); }
  const GRUPOS = ["proteina", "legumes", "hidratos", "gordura", "fruta", "lacticinio"];
  const grupoOf = (g) => GRUPOS.includes(norm(g)) ? norm(g) : "outro";

  function mealHtml(m, compact) {
    const itens = (m.itens || []).map((i) => {
      const det = [i.medida_caseira, i.estado].filter(Boolean).join(", ");
      const med = det ? ` <span class="meta muted">(${esc(det)})</span>` : "";
      return `<li><span><span class="grp g-${grupoOf(i.grupo)}" title="${esc(i.grupo || "")}"></span>${esc(i.alimento)}${med}</span><span class="qty num">${esc(i.quantidade)}</span></li>`;
    }).join("");
    const ordem = (m.ordem || []).length
      ? `<div class="order">Ordem: ${m.ordem.map((o, i) => `${i ? '<span class="arrow">→</span> ' : ""}<b>${esc(o)}</b>`).join(" ")}</div>` : "";
    const prep = !compact && m.preparacao ? `<div class="prep">👩‍🍳 ${esc(m.preparacao)}</div>` : "";
    const why = !compact && m.porque ? `<div class="prep">💡 ${esc(m.porque)}</div>` : "";
    const alts = !compact && (m.alternativas || []).length
      ? `<div class="alts">Trocas: ${m.alternativas.map((a) => `<b>${esc(a.em_vez_de)}</b> → ${esc(a.trocar_por)}`).join(" · ")}</div>` : "";
    const mm = mealMacros(m);
    const macros = `${mm.kcal ? `${mm.kcal} kcal · ` : ""}${mm.proteina_g} g prot · ${mm.fibra_g} g fibra${mm.hidratos_g ? ` · ${mm.hidratos_g} g HC` : ""}${mm.computed ? "" : ' <span title="Valores estimados pelo assistente; itens sem correspondência na tabela">~</span>'}`;
    const tools = !compact && m._day !== undefined ? `<div class="row" style="gap:4px"><button type="button" class="btn ghost sm" data-editmeal="${esc(m._day)}|${m._idx}">✎ Editar</button></div>` : "";
    return `<div class="meal"><div class="head"><h3>${esc(m.nome)}</h3>${m.hora ? `<span class="muted small num">${esc(m.hora)}</span>` : ""}<span class="macros num">${macros}</span></div>${ordem}<ul class="items">${itens}</ul>${prep}${why}${alts}${tools}</div>`;
  }
  function renderTodayMeals() {
    const el = $("todayMeals"); if (!el) return;
    if (!S.plan?.plan) { el.innerHTML = `<p class="muted small">Ainda não há plano. <a href="#" data-goto="plano">Gerar plano semanal</a>.</p>`; renderTodaySchedule(); return; }
    const day = S.plan.plan.dias.find((x) => x.dia === todayDayName());
    const extras = (S.plan.extras || []).filter((x) => x.date === localDate());
    el.innerHTML = (day && day.refeicoes.length ? day.refeicoes.map((m) => mealHtml(m, true)).join("") : `<p class="muted small">Sem refeições para hoje.</p>`) +
      (extras.length ? `<div class="meal"><div class="head"><h3>Fora do plano</h3></div>${extras.map((x) => `<div class="extra"><span>${esc(x.descricao)}</span><span class="muted small num">${x.kcal ? `~${Math.round(x.kcal)} kcal` : ""}</span></div>`).join("")}</div>` : "");
    renderTodaySchedule();
  }
  function renderTodaySchedule() {
    const el = $("todaySchedule"); if (!el) return;
    const h = S.plan?.plan?.hidratacao || [];
    if (h.length === 0) { el.innerHTML = ""; return; }
    const entries = todayDay().entries; const now = new Date(); const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    // marca como feito, por ordem, tantos momentos quantos os registos de hoje
    const done = Math.min(h.length, entries.length);
    let next = h.findIndex((x, i) => i >= done);
    el.innerHTML = `<div class="row between" style="margin-top:4px"><span class="eyebrow">Horário de água</span>${next >= 0 ? `<span class="small muted">próximo: <strong class="num">${esc(h[next].hora)} · ${h[next].quantidade_ml} ml</strong>${h[next].hora <= nowHM ? " (agora)" : ""}</span>` : `<span class="small muted">todos os momentos registados ✓</span>`}</div>
      <ul class="sched">${h.map((x, i) => `<li class="${i < done ? "done" : ""}"><span class="h num">${esc(x.hora)}</span><span>${esc(x.nota)}<br><span class="n num">${x.quantidade_ml} ml</span></span><button type="button" class="btn water sm num" data-ml="${x.quantidade_ml}" ${i < done ? "disabled" : ""}>Bebi</button></li>`).join("")}</ul>`;
  }

  /** Ferramenta usada pelo chat para alterar refeições do plano guardado. */
  async function applyMealUpdates(input) {
    if (!S.plan?.plan) throw new Error("Não existe plano. Pede à pessoa para gerar um plano na aba Plano.");
    const changes = Array.isArray(input?.alteracoes) ? input.alteracoes : [];
    if (changes.length === 0) throw new Error("Sem alterações: envia uma lista 'alteracoes'.");
    const plan = JSON.parse(JSON.stringify(S.plan.plan)); const done = [];
    for (const c of changes) {
      const day = plan.dias.find((d) => norm(d.dia) === norm(c.dia));
      if (!day) throw new Error(`Dia desconhecido: ${c.dia}. Usa: ${DAYS.join(", ")}.`);
      const idx = day.refeicoes.findIndex((m) => norm(m.nome) === norm(c.refeicao));
      if (c.remover) { if (idx >= 0) { day.refeicoes.splice(idx, 1); done.push(`${c.dia}: removida "${c.refeicao}"`); } continue; }
      if (!c.nova) throw new Error(`Falta 'nova' para ${c.dia} / ${c.refeicao}.`);
      const nm = normMeal({ ...c.nova, nome: c.nova.nome || c.refeicao });
      if (idx >= 0) { day.refeicoes[idx] = nm; done.push(`${c.dia}: "${c.refeicao}" → ${nm.itens.map((i) => `${i.alimento} ${i.quantidade}`).join(", ")}`); }
      else { day.refeicoes.push(nm); day.refeicoes.sort((a, b) => (a.hora || "").localeCompare(b.hora || "")); done.push(`${c.dia}: adicionada "${nm.nome}"`); }
    }
    S.plan = { ...S.plan, plan, version: (S.plan.version || 1) + 1, previous: S.plan.plan, changelog: [...(S.plan.changelog || []), { at: new Date().toISOString(), o_que: String(input.motivo || "Ajuste pelo chat") }].slice(-20) };
    await savePlan();
    return { ok: true, versao: S.plan.version, aplicado: done };
  }

  async function registerExtra(input) {
    if (!S.plan) throw new Error("Não existe plano; regista primeiro um plano na aba Plano.");
    const desc = String(input?.descricao || "").trim(); if (!desc) throw new Error("Falta 'descricao'.");
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.data || "")) ? input.data : localDate();
    const x = { id: uid(), date, descricao: desc, kcal: Number(input.kcal_estimado) || null, proteina_g: Number(input.proteina_g) || null, at: new Date().toISOString() };
    S.plan = { ...S.plan, extras: [...(S.plan.extras || []), x].slice(-60) };
    await savePlan();
    return { ok: true, registado: x, total_extras_hoje_kcal: (S.plan.extras || []).filter((e) => e.date === localDate()).reduce((a, e) => a + (e.kcal || 0), 0) };
  }
  async function registerBP(input) {
    const sys = Number(input?.sistolica), dia = Number(input?.diastolica);
    if (!Number.isFinite(sys) || !Number.isFinite(dia)) throw new Error("Indica sistolica e diastolica numéricas.");
    const e = { id: uid(), date: /^\d{4}-\d{2}-\d{2}$/.test(String(input.data || "")) ? input.data : localDate(), time: /^\d{2}:\d{2}$/.test(String(input.hora || "")) ? input.hora : "", sys, dia, pulse: Number(input.pulso) || null, source: "chat" };
    S.vitals = [...S.vitals, e]; await saveVitals();
    return { ok: true, registado: e, classificacao: bpClass(e) || "normal", media_ultimas: bpAverage() };
  }

  // ============================================================
  // Chat
  // ============================================================
  const RULES = `És a assistente nutricional da aplicação NutriGLP, uma app privada usada apenas por duas pessoas da mesma família (mãe e filha). Falas sempre em português de Portugal, num tom próximo, claro e prático.

O teu papel:
- Ajudar a pessoa a seguir e ajustar o plano alimentar dela, com quantidades concretas (gramas, porções, número de peças) sempre que fizer sentido.
- Priorizar proteína adequada (referência 1,2–1,6 g/kg/dia, mais perto de 1,6 g/kg em perda de peso ou com GLP-1), fibra (25–30 g/dia), densidade nutricional e hidratação.
- Ter em conta o contexto completo: dados base, uso e dose de GLP-1, medicação e suplementos, alergias/intolerâncias, preferências, hidratação e peso.
- Lembrar-te de preferências e ajustes já ditos nesta conversa e respeitá-los sem que a pessoa os repita.
- Quando a pessoa não gostar de algo, propor alternativas equivalentes em proteína/fibra/energia.
- Quando relatar sintomas (náuseas, enfartamento, obstipação, refluxo, hipoglicemia, cansaço), adaptar: refeições mais pequenas e frequentes, menos gordura e fritos, mais líquidos e fibra solúvel, comer devagar.

Com GLP-1 (tirzepatida, semaglutido, liraglutido, dulaglutido): o apetite e a sede diminuem e o esvaziamento gástrico é mais lento. Insiste em proteína em todas as refeições, hidratação em pequenos goles, fibra gradual, e evita refeições muito volumosas ou gordas, sobretudo nos dias após a injeção e nas semanas de subida de dose. Nunca recomendes alterar, saltar ou antecipar doses de GLP-1 nem de outra medicação; isso é decisão do médico.

Limites de segurança (obrigatórios):
- Não és médica nem nutricionista; és uma ferramenta de apoio e as tuas indicações são sugestões, nunca uma prescrição. Lembra isso com naturalidade quando for relevante, sem repetir em todas as mensagens.
- Recomenda contactar o médico/nutricionista perante vómitos persistentes, dor abdominal intensa, incapacidade de beber líquidos, sinais de desidratação, hipoglicemias, perda de peso muito rápida, ou qualquer sintoma novo ou preocupante.
- Não sugiras dietas abaixo de ~1200 kcal/dia nem suplementos novos sem sugerir validação profissional.

Regras da pessoa: o contexto traz "regras_alimentares_obrigatorias". São instruções que ela já deu e que tens de respeitar SEMPRE, em todas as sugestões e em qualquer alteração ao plano, sem esperar que as repita. Se ela enunciar uma regra nova ou duradoura (ordem por que come, horários, alimentos que recusa, modo de confeção), guarda-a já com guardar_regra e confirma numa linha.

Fora do plano: quando a pessoa disser que comeu ou bebeu algo que não estava no plano (ex: "comi um pastel de nata", "jantei fora, pizza"), 1) regista com a ferramenta registar_extra (com estimativa de kcal e proteína), 2) ajusta o resto do dia (ou o dia seguinte, se já for à noite) com atualizar_refeicoes, compensando em energia e mantendo a proteína, sem cortar refeições inteiras nem descer abaixo de ~1200 kcal, e 3) explica em 2–3 linhas, sem culpabilizar. Um extra pequeno pode não precisar de compensação: diz isso.

Tensão arterial: quando a pessoa indicar uma medição (ex: "hoje 135/85"), regista-a com registar_tensao e comenta brevemente; valores ≥ 140/90 repetidos ou ≥ 180/110 uma vez: aconselha contacto médico.

Documentos: quando a pessoa anexa análises ou outros documentos, a página lê-os e regista antes de te chegar a mensagem; os dados atualizados vêm no contexto. Comenta o que é relevante para a alimentação e propõe ajustes ao plano se fizer sentido.

Água: o plano tem um horário de água (hidratacao) com horas e quantidades; usa-o nas tuas sugestões e, com GLP-1, lembra goles pequenos, pouca água às refeições e mais entre refeições.

Plano alimentar: se existir um plano guardado (vem no contexto), é esse que a pessoa segue. Quando ela pedir para trocar, aligeirar ou ajustar refeições (ou relatar sintomas que justifiquem ajustar), usa a ferramenta atualizar_refeicoes para aplicar a mudança diretamente ao plano guardado e depois resume em 2–3 linhas o que mudou. Mantém proteína e fibra equivalentes na troca. Não uses a ferramenta para mudanças que a pessoa ainda não pediu.

Formato: responde de forma direta e curta, em texto simples (sem títulos nem markdown pesado; podes usar listas com "-"). Quando ajustares o plano, diz claramente o que muda (ex: "amanhã ao jantar troco X por Y, ~150 g").`;

  function contextText() {
    const p = profile(); const goal = waterGoal(p); const day = todayDay();
    const meds = (p.meds || []).filter((m) => m.active !== false);
    const ctx = {
      data_de_hoje: localDate(),
      perfil: { nome: p.name, idade: ageFrom(p.birth_date), sexo: p.sex, altura_cm: p.height_cm, peso_atual_kg: p.weight_kg, peso_objetivo_kg: p.target_kg, imc: bmi(p.height_cm, p.weight_kg), saciedade_precoce: p.satiety || "não indicada", alergias: p.allergies || [], intolerancias: p.intolerances || [], preferencias: p.preferences || null, notas: p.notes || null },
      glp1: p.uses_glp1 ? { substancia: p.glp1_substance, dose_atual: p.glp1_dose, inicio: p.glp1_start, dia_da_injecao: p.glp1_inj_day || null, historico_titulacao: p.titrations || [] } : null,
      medicacao: meds.filter((m) => m.kind !== "suplemento").map(({ name, dose, freq }) => ({ nome: name, dose, frequencia: freq })),
      suplementos: meds.filter((m) => m.kind === "suplemento").map(({ name, dose, freq }) => ({ nome: name, dose, frequencia: freq })),
      hidratacao: { meta_ml: goal.ml, origem_meta: goal.why, bebido_hoje_ml: day.total },
      composicao_corporal: bodyContext(),
      analises_mais_recentes: latestLabs(),
      regras_alimentares_obrigatorias: S.rules.map((r) => r.texto),
      calculos_de_referencia: planTargets(p),
      tensao_arterial: bpSummary(),
      documentos_de_saude: S.docs.slice(-6).map((d) => ({ tipo: d.tipo, data: d.date, titulo: d.titulo, resumo: d.resumo, pontos: d.pontos })),
      plano_alimentar: S.plan?.plan ? { versao: S.plan.version, semana: S.plan.week_start, metas_diarias: S.plan.plan.metas_diarias, hidratacao: S.plan.plan.hidratacao || [], dias: S.plan.plan.dias.map((d) => ({ dia: d.dia, totais_calculados: dayMacros(d), refeicoes: d.refeicoes.map((m) => ({ nome: m.nome, hora: m.hora, ordem: m.ordem, itens: m.itens.map((i) => `${i.alimento} ${i.quantidade}`), ...(({ kcal, proteina_g, hidratos_g, fibra_g }) => ({ kcal, proteina_g, hidratos_g, fibra_g }))(mealMacros(m)) })) })) } : null,
      fora_do_plano_hoje: (S.plan?.extras || []).filter((x) => x.date === localDate()).map(({ descricao, kcal, proteina_g }) => ({ descricao, kcal, proteina_g })),
      dia_da_semana_hoje: todayDayName(),
    };
    return `Contexto atual desta utilizadora (JSON, atualizado a cada mensagem):\n${JSON.stringify(ctx)}`;
  }

  const CHIPS = ["Hoje tive náuseas. Ajusta as refeições de amanhã.", "Não gosto de peixe cozido, sugere outra coisa com a mesma proteína.", "Que lanches ricos em proteína posso ter em casa?", "Estou com pouca fome esta semana. O que devo priorizar?"];

  function renderDiag() {
    const d = S.diag; const el = $("diagText"); if (!el) return;
    const yn = (v) => v === null ? "?" : v ? "sim" : "não";
    el.textContent = [
      `chat (sample): ${yn(d.sample)}`,
      `fotos/imagens: ${yn(d.images)}`,
      `ferramentas: ${yn(d.tools)}`,
      `base de dados: ${yn(d.db)}`,
      `perfil: ${S.pid} · mensagens: ${S.chat.length} · análises: ${S.labs.length} · plano: ${S.plan ? "v" + S.plan.version : "não"}`,
      `anexos em espera: ${S.attachments.length}`,
      `passo: ${d.step}`,
      d.saveErr ? `falha a guardar: ${d.saveErr}` : "",
      d.lastErr ? `último erro: ${d.lastErr}` : "",
    ].filter(Boolean).join("\n");
    if (d.saveErr) {
      $("dbNotice").hidden = false;
      $("dbNotice").textContent = "Não foi possível guardar na base de dados; os registos ficam só nesta sessão. Recarrega a página e tenta outra vez.";
    }
    const bad = !!(d.saveErr || d.lastErr) || d.sample === false || d.db === false;
    $("diagCard").style.borderColor = bad ? "var(--warn-line)" : "";
    if (bad) $("diagCard").open = true;
    // guarda para poder ser consultado mais tarde
    if (S.db && (d.saveErr || d.lastErr)) {
      S.db.doc(`diag/${S.pid}`).set({ at: new Date().toISOString(), ...d, ua: navigator.userAgent.slice(0, 160) }).catch(() => {});
    }
  }

  /** Acrescenta uma mensagem sem mexer em listas congeladas vindas da base de dados. */
  function pushChat(m) { S.chat = [...S.chat, m]; }

  function renderChat() {
    const log = $("chatLog"); const p = profile();
    if (S.chat.length === 0) {
      log.innerHTML = `<p class="muted small">Olá, ${esc(p.name || "")}! Tenho acesso ao teu perfil, medicação, hidratação e peso. Diz-me o que queres ajustar.</p>`;
      $("chips").innerHTML = CHIPS.map((c) => `<button type="button" class="chip" data-chip>${esc(c)}</button>`).join("");
    } else {
      log.innerHTML = S.chat.map((m) => `<div class="msg ${m.role}${m.error ? " error" : ""}">${esc(m.content)}</div>`).join("");
      $("chips").innerHTML = "";
    }
    log.scrollTop = log.scrollHeight;
    $("clearChat").disabled = S.chat.length === 0 || !!S.streaming;
  }

  const ERR_COPY = {
    not_granted: "Não deste permissão para esta página usar o Claude. Recarrega a página para voltar a pedir.",
    sampling_disabled: "O Claude não está disponível nesta conta.",
    rate_limited: "Chegaste ao limite de utilização do Claude por agora. Tenta mais tarde.",
    session_expired: "A sessão expirou. Volta a iniciar sessão no Claude.",
    refused: "O assistente não pode responder a isto. Se for uma questão de saúde, fala com o teu médico.",
    prompt_too_large: "A conversa ficou demasiado longa. Limpa a conversa e continua.",
    empty_completion: "O assistente não devolveu texto. Tenta reformular.",
  };

  async function sendMessage(text) {
    text = String(text || "").trim();
    const files = S.attachments.slice();
    if (!text && files.length === 0) return;
    if (S.streaming) { $("sampleNote").hidden = false; $("sampleNote").textContent = "Ainda estou a processar a mensagem anterior. Usa Parar se quiseres cancelar."; return; }
    if (!S.sample) {
      S.diag.sample = false; renderDiag();
      $("sampleNote").hidden = false;
      $("sampleNote").textContent = "O assistente não está disponível nesta janela. Abre a app pelo link do claude.ai (não numa janela separada) e recarrega.";
      return;
    }
    $("sampleNote").hidden = true;
    $("chatInput").value = ""; S.attachments = []; renderAttachments();
    const log = $("chatLog");
    const ctl = new AbortController(); S.streaming = ctl;
    $("sendChat").disabled = true; $("stopChat").hidden = false; $("clearChat").disabled = true;
    S.diag.lastErr = ""; S.diag.step = files.length ? `a enviar ${files.length} ficheiro(s)` : "a enviar mensagem";
    renderDiag();
    try {
      await sendMessageInner(text, files, log, ctl);
    } catch (e) {
      console.error("sendMessage", e);
      S.diag.lastErr = `${e?.code || e?.name || "erro"}: ${e?.message || String(e)}`;
      pushChat({ role: "assistant", content: `⚠️ Algo falhou a meio (${S.diag.lastErr}). Abre o Diagnóstico por baixo para veres os detalhes.`, at: new Date().toISOString(), error: true });
      if (files.length) { S.attachments = files; renderAttachments(); }
      renderChat(); saveChat().catch(() => {});
    } finally {
      S.streaming = null; $("sendChat").disabled = false; $("stopChat").hidden = true;
      S.diag.step = "pronto"; renderDiag(); renderChat();
    }
  }

  async function sendMessageInner(text, files, log, ctl) {

    // 1) documentos anexados: ler e registar antes da conversa
    if (files.length) {
      pushChat({ role: "user", content: `📎 ${files.map((f) => f.name).join(", ")}${text ? "\n" + text : ""}`, at: new Date().toISOString() });
      renderChat(); await saveChat();
      const b0 = document.createElement("div"); b0.className = "msg assistant"; log.appendChild(b0);
      let summary = "", e0 = null;
      try { summary = await ingestAttachments(files, b0); } catch (e) { e0 = e; }
      if (e0 && e0.code !== "cancelled") {
        const copy = e0.code === "nenhum"
          ? "Não consegui ler nenhum dos ficheiros:\n" + (e0.detalhes || [e0.message]).map((d) => "• " + d).join("\n") + "\n\nPodes registar os valores à mão na aba Análises."
          : (ERR_COPY[e0.code] || `Falha a ler o documento (${fileErrText(e0)}).`);
        pushChat({ role: "assistant", content: "⚠️ " + copy, at: new Date().toISOString(), error: true });
        if (e0.code === "nenhum" || e0.code === "pdf_lib") { S.attachments = files; renderAttachments(); }
      } else if (!e0) {
        pushChat({ role: "assistant", content: summary, at: new Date().toISOString() });
      }
      renderChat(); await saveChat();
      if (e0 && e0.code !== "cancelled") { S.diag.lastErr = `${e0.code || "erro"}: ${(e0.detalhes || [e0.message]).join(" | ")}`; renderDiag(); }
      if (!text || e0) return;
    } else {
      pushChat({ role: "user", content: text, at: new Date().toISOString() });
      renderChat();
      await saveChat();
    }

    const bubble = document.createElement("div"); bubble.className = "msg assistant";
    bubble.innerHTML = `<span class="thinking">a pensar…</span>`; log.appendChild(bubble); log.scrollTop = log.scrollHeight;

    const history = S.chat.filter((m) => !m.error).slice(-40).map((m) => ({ role: m.role, content: m.content }));
    const turns = [{ role: "user", content: RULES + "\n\n" + contextText() }, ...history];
    let finalText = "", err = null;
    const tools = S.toolsOK ? [{
      name: "guardar_regra",
      description: "Guarda de forma permanente uma regra alimentar pessoal que a pessoa quer que seja sempre respeitada (ordem por que come os alimentos, horários, alimentos proibidos, forma de confecionar, etc.). Usa sempre que ela enunciar uma preferência ou regra duradoura, mesmo de passagem. Não uses para pedidos pontuais de um só dia.",
      inputSchema: { type: "object", properties: { regra: { type: "string", description: "A regra numa frase curta e clara, na 2.ª pessoa (ex: 'Comer sempre os legumes primeiro, depois a proteína e os hidratos no fim')" } }, required: ["regra"] },
      execute: async (input) => { const r = await addRule(input?.regra, "chat"); return r ? (r.duplicada ? { ok: true, nota: "já estava guardada" } : { ok: true, guardada: r.texto, total: S.rules.length }) : { ok: false, erro: "regra vazia" }; },
    }, {
      name: "registar_tensao",
      description: "Regista uma medição de tensão arterial da pessoa (sistólica/diastólica em mmHg, pulso opcional) e devolve a classificação e a média recente. Usa quando a pessoa indica uma medição.",
      inputSchema: { type: "object", properties: { sistolica: { type: "number" }, diastolica: { type: "number" }, pulso: { type: "number" }, data: { type: "string", description: "YYYY-MM-DD, por omissão hoje" }, hora: { type: "string", description: "HH:MM" } }, required: ["sistolica", "diastolica"] },
      execute: async (input) => registerBP(input),
    }, ...(S.plan?.plan ? [{
      name: "registar_extra",
      description: "Regista algo que a pessoa comeu ou bebeu fora do plano (descrição, estimativa de kcal e proteína) no dia indicado, por omissão hoje. Devolve o total de extras do dia. Usa antes de ajustar o resto do dia com atualizar_refeicoes.",
      inputSchema: { type: "object", properties: { descricao: { type: "string" }, kcal_estimado: { type: "number" }, proteina_g: { type: "number" }, data: { type: "string", description: "YYYY-MM-DD" } }, required: ["descricao", "kcal_estimado"] },
      execute: async (input) => { bubble.innerHTML = `<span class="thinking">a registar…</span>`; return registerExtra(input); },
    }] : []), ...(S.plan?.plan ? [{
      name: "atualizar_refeicoes",
      description: "Altera refeições do plano alimentar guardado da pessoa e devolve o que foi aplicado. Usa quando a pessoa pede para trocar, aligeirar, adicionar ou remover uma refeição de um dia concreto.",
      inputSchema: { type: "object", properties: {
        motivo: { type: "string", description: "Resumo curto do porquê (ex: náuseas, não gosta de peixe)" },
        alteracoes: { type: "array", items: { type: "object", properties: {
          dia: { type: "string", description: "segunda|terça|quarta|quinta|sexta|sábado|domingo" },
          refeicao: { type: "string", description: "Nome da refeição existente (ex: Jantar). Se não existir, é adicionada." },
          remover: { type: "boolean" },
          nova: { type: "object", properties: { nome: { type: "string" }, hora: { type: "string" }, itens: { type: "array", items: { type: "object", properties: { alimento: { type: "string" }, quantidade: { type: "string" } }, required: ["alimento", "quantidade"] } }, kcal: { type: "number" }, proteina_g: { type: "number" }, fibra_g: { type: "number" } }, required: ["itens", "proteina_g", "fibra_g"] },
        }, required: ["dia", "refeicao"] } },
      }, required: ["alteracoes"] },
      execute: async (input) => { bubble.innerHTML = `<span class="thinking">a atualizar o plano…</span>`; return applyMealUpdates(input); },
    }] : [])] : undefined;
    try {
      const res = await S.sample(turns, {
        cache: false, signal: ctl.signal, ...(tools ? { tools } : {}),
        onText: ({ text: t }) => { bubble.textContent = t; log.scrollTop = log.scrollHeight; },
      });
      finalText = res.text; if (res.truncated) finalText += "\n\n(resposta cortada; pede menos de cada vez)";
    } catch (e) {
      err = e; finalText = e?.text || "";
    } finally {
      S.streaming = null; $("sendChat").disabled = false; $("stopChat").hidden = true;
    }
    if (err && err.code !== "cancelled") {
      const copy = ERR_COPY[err.code] || "Falha ao contactar o assistente. Tenta outra vez.";
      if (err.code === "refused") finalText = "";
      pushChat({ role: "assistant", content: (finalText ? finalText + "\n\n" : "") + "⚠️ " + copy, at: new Date().toISOString(), error: true });
    } else if (finalText) {
      pushChat({ role: "assistant", content: finalText, at: new Date().toISOString() });
    }
    renderChat();
    if (!err || err.code === "cancelled") await saveChat();
  }

  // ============================================================
  // Eventos
  // ============================================================
  document.addEventListener("click", async (ev) => {
    const t = ev.target.closest("[data-pid],[data-view],[data-goto],[data-ml],[data-del],[data-range],[data-chip],[data-deltit],[data-delmed],[data-togglemed],[data-dellab],[data-day],[data-delbp],[data-deldoc],[data-delextra],[data-delrule],[data-delbody],[data-editbody],[data-editlab],[data-editbp],[data-shopwho],[data-sub],[data-attach],[data-editmeal]");
    if (!t) return;
    if (t.dataset.pid) { switchProfile(t.dataset.pid); return; }
    if (t.dataset.view) { setView(t.dataset.view); return; }
    if (t.dataset.sub) { setSub(t.dataset.sub); return; }
    if (t.dataset.editmeal) { const [d, i] = t.dataset.editmeal.split("|"); openMealEditor(d, +i); return; }
    if (t.dataset.attach !== undefined) { setView("chat"); $("fileInput").click(); return; }
    if (t.dataset.goto) { ev.preventDefault(); setView(t.dataset.goto); return; }
    if (t.dataset.ml) { t.disabled = true; try { await addWater(t.dataset.ml); } finally { t.disabled = false; } return; }
    if (t.dataset.del !== undefined) { await removeWater(+t.dataset.del); return; }
    if (t.dataset.range) { S.range = +t.dataset.range; document.querySelectorAll("[data-range]").forEach((b) => b.setAttribute("aria-pressed", String(b === t))); renderWater(); return; }
    if (t.dataset.chip !== undefined) { sendMessage(t.textContent); return; }
    if (t.dataset.deltit) { const p = profile(); await saveProfile({ ...p, titrations: (p.titrations || []).filter((x) => x.id !== t.dataset.deltit) }); return; }
    if (t.dataset.delmed) { const p = profile(); await saveProfile({ ...p, meds: (p.meds || []).filter((x) => x.id !== t.dataset.delmed) }); return; }
    if (t.dataset.dellab) { S.labs = S.labs.filter((x) => x.id !== t.dataset.dellab); await saveLabs(); return; }
    if (t.dataset.day) { S.planDay = t.dataset.day; renderPlan(); return; }
    if (t.dataset.delbp) { S.vitals = S.vitals.filter((x) => x.id !== t.dataset.delbp); await saveVitals(); return; }
    if (t.dataset.shopwho) { S.shopWho = t.dataset.shopwho; renderShopping(); return; }
    if (t.dataset.delbody) { S.body = S.body.filter((x) => x.id !== t.dataset.delbody); if (S.edit.body === t.dataset.delbody) cancelEdit("body"); await saveBody(); return; }
    if (t.dataset.editbody) { startEdit("body", t.dataset.editbody); return; }
    if (t.dataset.editlab) { startEdit("lab", t.dataset.editlab); return; }
    if (t.dataset.editbp) { startEdit("bp", t.dataset.editbp); return; }
    if (t.dataset.delrule) { S.rules = S.rules.filter((x) => x.id !== t.dataset.delrule); await saveRules(); return; }
    if (t.dataset.deldoc) { S.docs = S.docs.filter((x) => x.id !== t.dataset.deldoc); await saveDocs(); return; }
    if (t.dataset.delextra) { S.plan = { ...S.plan, extras: (S.plan.extras || []).filter((x) => x.id !== t.dataset.delextra) }; await savePlan(); return; }
    if (t.dataset.togglemed) { const p = profile(); await saveProfile({ ...p, meds: (p.meds || []).map((x) => x.id === t.dataset.togglemed ? { ...x, active: x.active === false } : x) }); return; }
  });

  document.addEventListener("submit", async (ev) => {
    const f = ev.target;
    if (f.matches("[data-custom]")) { ev.preventDefault(); const inp = f.querySelector("input"); if (inp.value) { await addWater(inp.value); inp.value = ""; } return; }
    if (f.id === "profileForm") {
      ev.preventDefault(); const data = readProfileForm(); $("saveProfile").disabled = true;
      try {
        await saveProfile(data);
        if (data.weight_kg) { const today = localDate(); S.weights = [...S.weights.filter((w) => w.date !== today), { date: today, kg: data.weight_kg }].sort((a, b) => a.date.localeCompare(b.date)).slice(-120); await saveWeights(); }
        $("saveMsg").textContent = "Guardado ✓"; $("saveMsg").style.color = "var(--accent)";
      } catch (e) { $("saveMsg").textContent = "Não foi possível guardar. Tenta outra vez."; $("saveMsg").style.color = "var(--danger)"; }
      finally { $("saveProfile").disabled = false; setTimeout(() => $("saveMsg").textContent = "", 3000); }
      return;
    }
    if (f.id === "titForm") {
      ev.preventDefault(); const p = profile();
      const t = { id: uid(), date: $("t_date").value, substance: $("t_sub").value.trim(), dose: $("t_dose").value.trim(), notes: $("t_notes").value.trim() };
      if (!t.date || !t.substance || !t.dose) return;
      await saveProfile({ ...p, uses_glp1: true, glp1_substance: t.substance, glp1_dose: t.dose, titrations: [...(p.titrations || []), t] });
      f.reset(); return;
    }
    if (f.id === "medForm") {
      ev.preventDefault(); const p = profile();
      const m = { id: uid(), kind: $("m_kind").value, name: $("m_name").value.trim(), dose: $("m_dose").value.trim(), freq: $("m_freq").value.trim(), active: true };
      if (!m.name) return;
      await saveProfile({ ...p, meds: [...(p.meds || []), m] }); f.reset(); return;
    }
    if (f.id === "labForm") {
      ev.preventDefault();
      const mk = $("l_marker").value; const num = (v) => { const s = String(v).trim().replace(",", "."); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
      const editingLab = S.edit.lab;
      const e = { id: editingLab || uid(), date: $("l_date").value, marker: mk, label: mk === "outro" ? $("l_custom").value.trim() : markerOf(mk).label, value: num($("l_value").value), unit: $("l_unit").value.trim(), lo: num($("l_lo").value), hi: num($("l_hi").value), notes: $("l_notes").value.trim() };
      if (!e.date || e.value === null || (mk === "outro" && !e.label)) { $("labMsg").textContent = "Indica a data, a análise e o valor."; return; }
      S.labs = [...S.labs.filter((x) => x.id !== e.id), e]; S.labPick = labKey(e);
      S.edit.lab = null; markEditing("lab", false);
      try { await saveLabs(); $("labMsg").textContent = `${e.label} ${editingLab ? "alterado" : "guardado"} ✓`; } catch { $("labMsg").textContent = "Não foi possível guardar."; }
      $("l_value").value = ""; $("l_notes").value = ""; $("l_value").focus(); setTimeout(() => $("labMsg").textContent = "", 3000);
      return;
    }
    if (f.id === "bodyForm") {
      ev.preventDefault();
      const n = (id) => { const v = String($(id).value).trim().replace(",", "."); if (!v) return null; const x = Number(v); return Number.isFinite(x) ? x : null; };
      const editing = S.edit.body;
      const e = { id: editing || uid(), date: $("c_date").value, weight_kg: n("c_weight"), fat_pct: n("c_fat"), muscle_pct: n("c_muscle"), water_pct: n("c_water"), visceral: n("c_visceral"), bone_kg: n("c_bone"), notes: $("c_notes").value.trim() };
      if (!e.date || !e.weight_kg) { $("bodyMsg").textContent = "Indica pelo menos a data e o peso."; return; }
      S.body = [...S.body.filter((x) => x.id !== e.id && x.date !== e.date), e];
      try {
        await saveBody();
        const latest = [...S.body].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];
        if (latest?.weight_kg && latest.weight_kg !== profile().weight_kg) await saveProfile({ ...profile(), weight_kg: latest.weight_kg });
        S.weights = [...S.weights.filter((w) => w.date !== e.date), { date: e.date, kg: e.weight_kg }].sort((a, b) => a.date.localeCompare(b.date)).slice(-200);
        await saveWeights();
        $("bodyMsg").textContent = editing ? "Alterado ✓" : "Guardado ✓";
      } catch { $("bodyMsg").textContent = "Não foi possível guardar."; }
      S.edit.body = null; markEditing("body", false);
      ["c_fat", "c_muscle", "c_water", "c_visceral", "c_bone", "c_notes"].forEach((id) => { $(id).value = ""; });
      setTimeout(() => { $("bodyMsg").textContent = ""; }, 3000);
      return;
    }
    if (f.id === "rulesForm") {
      ev.preventDefault(); const v = $("r_text").value; $("r_text").value = "";
      await addRule(v, "perfil"); return;
    }
    if (f.id === "bpForm") {
      ev.preventDefault();
      const editingBp = S.edit.bp;
      const e = { id: editingBp || uid(), date: $("b_date").value, time: $("b_time").value, sys: Number($("b_sys").value), dia: Number($("b_dia").value), pulse: Number($("b_pulse").value) || null, source: "" };
      if (!e.date || !e.sys || !e.dia) return;
      S.vitals = [...S.vitals.filter((x) => x.id !== e.id), e];
      S.edit.bp = null; markEditing("bp", false);
      await saveVitals(); $("b_sys").value = ""; $("b_dia").value = ""; $("b_pulse").value = "";
      return;
    }
    if (f.id === "composer") { ev.preventDefault(); sendMessage($("chatInput").value); return; }
  });

  function renderAttachments() {
    $("attachList").innerHTML = S.attachments.map((f, i) => `<span class="attach">📄 <span>${esc(f.name)}</span><button type="button" data-rmatt="${i}" aria-label="Remover anexo">×</button></span>`).join("");
    if (!S.streaming) $("sendChat").disabled = false;
    renderDiag();
  }
  $("attachBtn").addEventListener("click", () => $("fileInput").click());
  const addFiles = (list) => {
    const max = 25 * 1024 * 1024; let rejected = 0;
    for (const f of list) { if (f.size > max) { rejected++; continue; } S.attachments.push(f); }
    if (rejected) { S.diag.lastErr = `${rejected} ficheiro(s) acima de 25 MB`; renderDiag(); }
    renderAttachments();
  };
  const card = $("composer").closest(".card");
  ["dragover", "drop"].forEach((ev) => card.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === "drop" && e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    card.style.outline = ev === "dragover" ? "2px dashed var(--accent)" : "";
  }));
  card.addEventListener("dragleave", () => { card.style.outline = ""; });
  $("fileInput").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  $("attachList").addEventListener("click", (e) => { const b = e.target.closest("[data-rmatt]"); if (b) { S.attachments.splice(+b.dataset.rmatt, 1); renderAttachments(); } });
  $("chatInput").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage($("chatInput").value); } });
  $("stopChat").addEventListener("click", () => S.streaming?.abort());
  $("clearChat").addEventListener("click", async () => {
    if (!(await askConfirm("Apagar toda a conversa? O assistente deixa de se lembrar dos ajustes que já lhe deste.", "Apagar"))) return;
    S.chat = []; S.attachments = []; renderAttachments(); await saveChat(); renderChat();
  });
  let rsz; window.addEventListener("resize", () => { clearTimeout(rsz); rsz = setTimeout(() => { renderWater(); if (S.labs.length) renderLabChart(); if (S.body.length) renderBodyChart(); }, 150); });
  $("l_marker").addEventListener("change", applyMarkerDefaults);
  $("labPick").addEventListener("change", (e) => { S.labPick = e.target.value; renderLabChart(); });
  $("bodyPick").addEventListener("change", (e) => { S.bodyPick = e.target.value; renderBodyChart(); });
  $("genPlan").addEventListener("click", generatePlan);
  $("regenPlan").addEventListener("click", generatePlan);
  $("undoPlan").addEventListener("click", async () => {
    if (!S.plan?.previous || !(await askConfirm("Repor a versão anterior do plano?", "Repor"))) return;
    S.plan = { ...S.plan, plan: S.plan.previous, previous: null, version: (S.plan.version || 1) + 1, changelog: [...(S.plan.changelog || []), { at: new Date().toISOString(), o_que: "Reposta versão anterior" }].slice(-20) };
    await savePlan();
  });
  $("f_glp1").addEventListener("change", (e) => { $("glp1Fields").hidden = !e.target.checked; });

  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  function switchProfile(pid) {
    if (!PROFILE_IDS.includes(pid)) pid = PROFILE_IDS[0];
    if (S.streaming) S.streaming.abort(); if (S.generating) S.generating.abort();
    S.pid = pid; try { localStorage.setItem("nutriglp.pid", pid); } catch {}
    renderWho(); subscribeProfile();
  }

  function renderAll() { renderWho(); renderHome(); renderWater(); renderChat(); renderProfileForm(); renderLabs(); renderPlan(); renderVitals(); renderDocs(); renderRules(); renderBody(); renderDiag(); }

  // ============================================================
  // Arranque
  // ============================================================
  renderQuickAdd("quickAdd1"); renderQuickAdd("quickAdd2"); initLabForm();
  { const dl = $("foodlist"); if (dl) dl.innerHTML = FOODS.map((f) => `<option value="${esc(f.nome)}">`).join(""); }
  // gancho para os testes automáticos (não usado pela app)
  window.NG_TEST = { findFood, gramsOf, mealMacros, dayMacros };
  let saved = null; try { saved = localStorage.getItem("nutriglp.pid"); } catch {}
  S.pid = PROFILE_IDS.includes(saved) ? saved : PROFILE_IDS[0];
  renderAll();

  (async () => {
    const [db, sample] = await Promise.all([window.claude?.use?.("db") ?? null, window.claude?.use?.("sample") ?? null]);
    S.db = db; S.sample = sample;
    S.diag.db = !!db; S.diag.sample = !!sample; S.diag.step = "arrancou";
    if (!db) {
      S.memory = true; $("dbNotice").hidden = false;
      $("dbNotice").textContent = "Sem ligação à base de dados: os registos ficam apenas nesta sessão. Abre a página no claude.ai para guardar.";
    } else {
      db.collection("plans").onSnapshot((snap) => {
        const next = {}; snap.docs.forEach((d) => { next[d.id] = thaw(d.data()); }); S.plans = next;
        renderPlan();
      }, (e) => console.warn("plans all", e));
      db.collection("profiles").onSnapshot((snap) => {
        const next = {}; snap.docs.forEach((d) => { next[d.id] = thaw(d.data()); }); S.profiles = next;
        renderWho(); renderHome(); renderWater(); renderChat(); renderPlan(); if (document.activeElement?.form?.id !== "profileForm") renderProfileForm();
      }, (e) => console.warn("profiles", e));
    }
    if (sample) {
      const lim = await sample.limits().catch((e) => { S.diag.lastErr = `limits: ${e?.code || e?.message || e}`; return null; });
      S.toolsOK = !!lim?.tools; S.imageLimits = lim?.images || null;
      S.diag.tools = !!lim?.tools; S.diag.images = !!lim?.images;
      $("fileInput").accept = ["application/pdf", ".pdf", "text/plain", ...(S.imageLimits ? S.imageLimits.mediaTypes : [])].join(",");
      $("attachHint").textContent = S.imageLimits ? "PDF, foto ou imagem de análises, tensão, ECG ou outros documentos." : "PDF de análises, tensão, ECG ou outros documentos (esta conta não permite enviar fotos).";
    }
    if (!sample) { $("sampleNote").hidden = false; $("sampleNote").textContent = "O chat com o assistente só está disponível com a página aberta no claude.ai."; }
    subscribeProfile(); renderDiag();
  })();

  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason; S.diag.lastErr = `promessa: ${r?.code || r?.name || "erro"} ${r?.message || ""}`.trim(); renderDiag();
  });
  window.addEventListener("error", (e) => { S.diag.lastErr = `script: ${e.message}`; renderDiag(); });
})();
