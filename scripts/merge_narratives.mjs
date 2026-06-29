// Merge the per-course narrative JSON files written by the authoring agents into
// one src/claude/lessonNarratives.json, and validate density / specificity.
import fs from 'fs';
import path from 'path';

const SCRAT = process.argv[2];
const ROOT = path.resolve('.');
const idx = JSON.parse(fs.readFileSync('./public/course-scripts/_index.json', 'utf8'));
const slugs = idx.courses.map(c => c.slug);
const topics = Object.fromEntries(idx.courses.map(c => [c.slug, (c.topic || '').toLowerCase()]));
const wc = s => (String(s).trim().match(/\S+/g) || []).length;

const merged = {};
const report = [];
const sentenceMap = new Map(); // normalized sentence -> [slug:lesson]
let missing = [];

for (const slug of slugs) {
  const f = path.join(SCRAT, `narr-${slug}.json`);
  if (!fs.existsSync(f)) { missing.push(slug); continue; }
  let obj;
  try { obj = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { console.log(`!! INVALID JSON ${slug}: ${e.message}`); missing.push(slug + '(bad-json)'); continue; }
  merged[slug] = obj;
  const lessons = Object.keys(obj);
  const counts = lessons.map(n => wc(obj[n]));
  const thin = lessons.filter(n => wc(obj[n]) < 180);
  // slug leakage: raw English topic appears in prose
  const topic = topics[slug];
  const leak = lessons.filter(n => topic && obj[n].toLowerCase().includes(topic));
  // collect sentences for cross-course dup detection
  for (const n of lessons) {
    for (const s of String(obj[n]).split(/(?<=[.!?])\s+/)) {
      const norm = s.toLowerCase().replace(/[^a-zà-ÿ0-9 ]+/gi, '').replace(/\s+/g, ' ').trim();
      if (norm.length < 40) continue;
      if (!sentenceMap.has(norm)) sentenceMap.set(norm, []);
      sentenceMap.get(norm).push(`${slug}:${n}`);
    }
  }
  report.push({ slug, lessons: lessons.length, avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length), min: Math.min(...counts), thin: thin.join(',') || '-', leak: leak.join(',') || '-' });
}

const dups = [...sentenceMap.entries()].filter(([_, arr]) => new Set(arr.map(x => x.split(':')[0])).size > 1);

console.log('course | lessons | avg words | min | thin(<180) | slug-leak lessons');
for (const r of report) console.log(`${r.slug} | ${r.lessons} | ${r.avg} | ${r.min} | ${r.thin} | ${r.leak}`);
const allCounts = report.flatMap(r => r.avg);
console.log(`\nCourses merged: ${report.length}/${slugs.length}` + (missing.length ? ` | MISSING: ${missing.join(', ')}` : ' | all present'));
console.log(`Overall avg words/lesson: ${Math.round(allCounts.reduce((a, b) => a + b, 0) / allCounts.length)}`);
console.log(`Cross-course duplicate sentences: ${dups.length}`);
dups.slice(0, 8).forEach(([s, arr]) => console.log(`  [${arr.join(', ')}] "${s.slice(0, 70)}..."`));

if (!missing.length) {
  fs.writeFileSync('./src/claude/lessonNarratives.json', JSON.stringify(merged, null, 0));
  console.log('\nWROTE src/claude/lessonNarratives.json');
} else {
  console.log('\nNOT written (waiting on missing courses).');
}
