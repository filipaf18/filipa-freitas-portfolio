import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPreview } from "./harness.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
buildPreview();
const only = process.argv[2];
const files = fs.readdirSync(here).filter((f) => /^t\d+.*\.mjs$/.test(f) && (!only || f.includes(only))).sort();
let failed = 0;
for (const f of files) {
  const t0 = Date.now();
  try { await (await import("./" + f)).default(); console.log(`✓ ${f} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); }
  catch (e) { failed++; console.log(`✗ ${f}\n   ${e.message.split("\n")[0]}`); }
}
console.log(failed ? `\n${failed} teste(s) falharam` : `\nTodos os ${files.length} testes passaram`);
process.exit(failed ? 1 : 0);
