// Standalone smoke test for the course source-appendix parser.
// Run: node scripts/smoke_parse_sources.mjs
// (the project has no JS test runner; this keeps the check runnable and CI-able.)

// Mirror of parseSourceLine in src/claude/ClaudeFrontend.jsx. Keep in sync.
function parseSourceLine(line) {
  if (!line) return null;
  let m = line.match(
    /^-\s+\[(S\d+)\]\s+(.+?),\s*chunk\s+([^,]+),\s+score\s+([\d.]+)\s*(?::\s*(.*)|\((extrait[^)]*)\))?\s*$/i,
  );
  if (m) {
    const withheld = Boolean(m[6]);
    return {
      id: m[1], title: m[2].trim(), chunk: (m[3] || '').trim(), score: m[4] || '',
      snippet: withheld ? '' : (m[5] || '').trim(), withheld,
    };
  }
  m = line.match(/^-\s+\[(S\d+)\]\s+(.+?)(?:\s+\(chunk\s+([^,]+),\s+score\s+([^)]+)\))?\s*$/);
  if (m) {
    return { id: m[1], title: m[2].trim(), chunk: (m[3] || '').trim(), score: (m[4] || '').trim(), snippet: '', withheld: false };
  }
  return null;
}

let failures = 0;
function check(name, cond, got) {
  if (!cond) { failures++; console.log(`  FAIL ${name} -> ${JSON.stringify(got)}`); }
  else { console.log(`  ok   ${name}`); }
}

console.log('[smoke] parseSourceLine');

// 1. current format with clean excerpt
let r = parseSourceLine('- [S1] FX Derivatives Trader School ( PDFDrive ), chunk 58, score 0.652362: A call and put share the same vega profile.');
check('current/clean: title not polluted', r && r.title === 'FX Derivatives Trader School ( PDFDrive )', r);
check('current/clean: chunk', r && r.chunk === '58', r);
check('current/clean: score', r && r.score === '0.652362', r);
check('current/clean: snippet', r && r.snippet.startsWith('A call and put'), r);
check('current/clean: not withheld', r && r.withheld === false, r);

// 2. reference-only (excerpt withheld)
r = parseSourceLine('- [S2] Derivatives Models on Models ( PDFDrive ), chunk 95, score 0.449788 (extrait non cite: source bruitee)');
check('withheld: parsed', !!r, r);
check('withheld: title clean', r && r.title === 'Derivatives Models on Models ( PDFDrive )', r);
check('withheld: empty snippet', r && r.snippet === '', r);
check('withheld: flag set', r && r.withheld === true, r);

// 3. legacy parenthesised format
r = parseSourceLine('- [S1] Hull Options Futures (chunk 12, score 0.51)');
check('legacy: parsed', !!r, r);
check('legacy: title', r && r.title === 'Hull Options Futures', r);
check('legacy: chunk', r && r.chunk === '12', r);

// 4. non-source line ignored
check('noise: null', parseSourceLine('## Some heading') === null, parseSourceLine('## Some heading'));

if (failures) { console.log(`\n[smoke] FAIL (${failures})`); process.exit(1); }
console.log('\n[smoke] PASS');
