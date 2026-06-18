/**
 * Frontend ⇄ backend connectivity smoke (J2 enabler).
 *
 * Product decision = "hybride par défaut local": the backend is OPTIONAL.
 *  - backend reachable  -> assert /agent/exercise returns the grounded contract
 *                          (sources[], metadata.llm) => PASS
 *  - backend unreachable -> the static site degrades to a labelled local
 *                           fallback by design => SKIP (exit 0), not FAIL.
 *
 * This mirrors practiceEngine.js: base = VITE_TPL_RAG_API_URL || http://127.0.0.1:8000
 *
 * Usage:
 *   node scripts/smoke_api.mjs
 *   VITE_TPL_RAG_API_URL=https://api.example.com node scripts/smoke_api.mjs
 */

const BASE = process.env.VITE_TPL_RAG_API_URL || "http://127.0.0.1:8000";
let step = 0;
const log = (status, what, extra = "") => {
  step += 1;
  console.log(`[STEP ${step}] ${what}`);
  console.log(`  [STATUS] ${status}${extra ? `  [OUTPUT] ${extra}` : ""}`);
};

async function withTimeout(promise, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await promise(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  console.log("=".repeat(56));
  console.log(`  FRONTEND SMOKE - backend connectivity (${BASE})`);
  console.log("=".repeat(56));

  // STEP 1: health
  let healthy = false;
  try {
    const r = await withTimeout(
      (signal) => fetch(`${BASE}/health`, { signal }),
      3000,
    );
    healthy = r.ok;
    log(healthy ? "ok" : "fail", `GET ${BASE}/health`, `status ${r.status}`);
  } catch (e) {
    log("skip", `GET ${BASE}/health`, `unreachable: ${e.code || e.name}`);
  }

  if (!healthy) {
    console.log("-".repeat(56));
    console.log(
      "SMOKE: SKIP — backend not reachable. By design (hybride par défaut " +
        "local) the site uses a labelled local fallback for exercises. " +
        "Set VITE_TPL_RAG_API_URL to a deployed backend to test grounding.",
    );
    return 0;
  }

  // STEP 2: grounded exercise contract
  let failures = 0;
  try {
    const r = await withTimeout(
      (signal) =>
        fetch(`${BASE}/agent/exercise`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: "Barrier options and gap risk",
            product: "FX barrier option",
            concept: "down-and-out call",
            difficulty: "advanced",
            exercise_format: "quantitative_problem",
            require_calculations: true,
            language: "fr",
          }),
          signal,
        }),
      120000,
    );
    if (!r.ok) {
      log("fail", "POST /agent/exercise", `status ${r.status}`);
      failures += 1;
    } else {
      const data = await r.json();
      const sources = data.sources || [];
      const llm = data?.metadata?.llm;
      log(sources.length > 0 ? "ok" : "fail", "exercise: sources[] non-empty", `${sources.length}`);
      log(llm ? "ok" : "fail", "exercise: metadata.llm present", String(llm));
      if (!(sources.length > 0)) failures += 1;
      if (!llm) failures += 1;
    }
  } catch (e) {
    log("fail", "POST /agent/exercise", e.message);
    failures += 1;
  }

  console.log("-".repeat(56));
  if (failures > 0) {
    console.log(`SMOKE: FAIL (${failures} contract breach)`);
    return 1;
  }
  console.log("SMOKE: PASS — backend reachable and exercise is grounded.");
  return 0;
}

main().then((code) => process.exit(code));
