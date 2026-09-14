/**
 * Arnês de testes da NutriGLP.
 * Monta uma pré-visualização da artifact (a página é um fragmento HTML) numa pasta
 * temporária, abre-a no Chromium e injeta um `window.claude` falso: base de dados em
 * memória que congela os snapshots como a verdadeira, e um `sample` configurável.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ART = path.resolve(here, "..");
export const PREVIEW = path.join(here, ".preview");

export function buildPreview() {
  fs.mkdirSync(PREVIEW, { recursive: true });
  const frag = fs.readFileSync(path.join(ART, "nutriglp.html"), "utf8");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>\n${frag}\n</body></html>`;
  fs.writeFileSync(path.join(PREVIEW, "index.html"), html);
  for (const f of ["styles.css", "app.js", "foods.js"]) fs.copyFileSync(path.join(ART, f), path.join(PREVIEW, f));
}

const CHROME = process.env.CHROME_PATH || ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find((p) => fs.existsSync(p));

/**
 * Abre a app. `store` é o conteúdo inicial da base de dados ({ "coleção/doc": {...} }).
 * `sample` é o corpo de uma função JS (string) que recebe (input, opts) e devolve o texto;
 * `sampleJson` idem para sample.json. `limits` é o que sample.limits() devolve.
 */
export async function open({ store = {}, sample = null, sampleJson = null, limits = { maxPromptBytes: 65536, tools: { maxCount: 8 } }, db = true, blockConfirm = true, width = 420 } = {}) {
  const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const errs = [];
  // pdf.js servido localmente (a rede está bloqueada nos testes)
  await ctx.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/, (route) => {
    const u = route.request().url();
    const base = path.join(here, "node_modules", "pdfjs-dist", "build");
    const f = path.join(base, u.includes("worker") ? "pdf.worker.min.js" : "pdf.min.js");
    if (!fs.existsSync(f)) return route.abort();
    route.fulfill({ status: 200, contentType: "application/javascript", body: fs.readFileSync(f) });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/net::|ERR_CONNECTION/.test(m.text())) errs.push("CONSOLE " + m.text()); });
  await page.addInitScript(({ store, sample, sampleJson, limits, db, blockConfirm }) => {
    if (blockConfirm) { window.confirm = () => false; window.alert = () => {}; }
    window.__calls = [];
    const deepFreeze = (o) => { if (o && typeof o === "object") { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };
    const subs = {};
    const snapOf = (p) => ({ id: p.split("/").pop(), exists: !!store[p], data: () => store[p] ? deepFreeze(JSON.parse(JSON.stringify(store[p]))) : undefined, metadata: {} });
    const notify = (p) => Object.keys(subs).forEach((k) => { if (p === k || p.startsWith(k + "/")) subs[k].forEach((f) => f(k === p ? snapOf(p) : null)); });
    const mkDoc = (p) => ({ path: p, id: p.split("/").pop(),
      get: async () => snapOf(p),
      set: async (b) => { store[p] = JSON.parse(JSON.stringify(b)); notify(p); },
      update: async (b) => { store[p] = { ...(store[p] || {}), ...JSON.parse(JSON.stringify(b)) }; notify(p); },
      delete: async () => { delete store[p]; notify(p); },
      acquire: async () => ({ acquired: true }),
      onSnapshot: (next) => { (subs[p] ||= []).push((s) => next(s || snapOf(p))); setTimeout(() => next(snapOf(p)), 5); return () => {}; },
      collection: (x) => mkColl(p + "/" + x) });
    const mkColl = (p) => ({ path: p,
      doc: (id) => mkDoc(p + "/" + (id || "x" + Math.random().toString(36).slice(2, 8))),
      add: async (b) => { const d = mkDoc(p + "/x" + Math.random().toString(36).slice(2, 8)); await d.set(b); return d; },
      where() { return this; }, orderBy() { return this; }, limit() { return this; },
      _s: () => { const docs = Object.keys(store).filter((k) => k.startsWith(p + "/") && k.split("/").length === p.split("/").length + 1).map(snapOf); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; },
      get: async function () { return this._s(); },
      onSnapshot(next) { const self = this; (subs[p] ||= []).push(() => next(self._s())); setTimeout(() => next(self._s()), 5); return () => {}; } });
    window.__store = store;
    const fakeDb = { doc: mkDoc, collection: mkColl };
    let fake = null;
    if (sample || sampleJson) {
      const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
      const textFn = sample ? new AsyncFn("input", "opts", sample) : async () => "ok";
      const jsonFn = sampleJson ? new AsyncFn("input", "opts", sampleJson) : async () => ({});
      fake = async (input, opts) => {
        window.__calls.push({ kind: "text", input, tools: (opts?.tools || []).map((t) => t.name) });
        const text = await textFn(input, opts);
        opts?.onText?.({ text, delta: text });
        return { text, truncated: false, modelTierApplied: opts?.modelTier || "default" };
      };
      fake.json = async (input, opts) => { window.__calls.push({ kind: "json", input, images: opts?.images?.length || 0 }); return jsonFn(input, opts); };
      fake.limits = async () => limits;
    }
    window.claude = { use: async (n) => n === "db" ? (db ? fakeDb : null) : n === "sample" ? fake : null };
  }, { store, sample, sampleJson, limits, db, blockConfirm });
  await page.goto("file://" + path.join(PREVIEW, "index.html"));
  await page.waitForTimeout(600);
  const close = async () => { await browser.close(); };
  const calls = () => page.evaluate(() => window.__calls);
  const dump = () => page.evaluate(() => window.__store);
  const text = async (sel) => ((await page.textContent(sel)) || "").replace(/\s+/g, " ").trim();
  return { page, browser, errs, close, calls, dump, text };
}

export function assert(cond, msg) { if (!cond) throw new Error("FALHOU: " + msg); }
export const eq = (a, b, msg) => assert(a === b, `${msg} (esperado ${JSON.stringify(b)}, obtido ${JSON.stringify(a)})`);

/** PDF mínimo com texto, para testar a leitura de documentos. */
export function makePdf(lines) {
  const esc = (l) => l.replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = "BT /F1 11 Tf 40 780 Td 14 TL " + lines.map((l) => `(${esc(l)}) Tj T*`).join(" ") + " ET";
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out, "latin1")); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
