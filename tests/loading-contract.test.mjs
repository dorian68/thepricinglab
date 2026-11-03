import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const baseline = 'afba39d327f39f7058ba7bdc489d3b70059c0c1b';
const frontendPath = 'src/claude/ClaudeFrontend.jsx';
const normalizeNewlines = (text) => text.replaceAll('\r\n', '\n');
const source = normalizeNewlines(readFileSync(frontendPath, 'utf8'));
const previous = normalizeNewlines(execFileSync('git', ['show', `${baseline}:${frontendPath}`], { encoding: 'utf8' }));

function declarations(code, kind) {
  const ast = ts.createSourceFile('frontend.jsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  return new Map(ast.statements.filter((node) => node.kind === kind)
    .map((node) => [node.name?.getText(ast) || node.declarationList.declarations[0].name.getText(ast), node.getText(ast)]));
}

test('all route bodies and their course/article/pricing content remain unchanged', () => {
  const before = declarations(previous, ts.SyntaxKind.FunctionDeclaration);
  const after = declarations(source, ts.SyntaxKind.FunctionDeclaration);
  assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort());
  for (const [name, content] of before) {
    // The inherited market-status labels are now explicitly illustrative.
    let expected = name === 'TopStrip' ? content
      .replace('MKT · OPEN', 'ILLUSTRATIVE DATA')
      .replace('SESSION · NY', 'NOT LIVE')
      .replace('className="dot dot-green"', 'className="dot dot-amber"') : content;
    if (name === 'HeroBlock') expected = expected
      .replace('<span className="green">● LIVE</span>', '<span className="amber">● DEMO</span>')
      .replace('<span className="mute">15:42:18</span>', '<span className="mute">ILLUSTRATIVE</span>');
    if (name === 'HomePage') expected = expected.replace('    <div>', '    <div className="home-page">');
    if (name === 'FinalCTA') expected = expected.replace('<div className="panel"', '<div className="panel home-final-cta"');
    if (!['Icon', 'LatexMarkdown'].includes(name)) assert.equal(after.get(name), expected, name);
  }
});

test('all existing catalogues, prices and state constants remain unchanged', () => {
  const before = declarations(previous, ts.SyntaxKind.VariableStatement);
  const after = declarations(source, ts.SyntaxKind.VariableStatement);
  for (const [name, content] of before) assert.equal(after.get(name), content, name);
  assert.deepEqual([...after.keys()].filter((key) => !before.has(key)), ['MarkdownMath']);
});

test('course resources, route metadata and sitemap retain the validated baseline', () => {
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline, '--', 'public/course-scripts', 'src/seo-routes.json', 'public/sitemap.xml', 'src/lib/route-metadata.mjs', 'src/claude/practiceEngine.js'], { encoding: 'utf8' }).trim().split('\n');
  for (const path of paths) {
    const before = execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' });
    assert.equal(normalizeNewlines(readFileSync(path, 'utf8')), normalizeNewlines(before), path);
  }
});

test('the SVG map covers every existing static and data-driven icon', () => {
  const iconSource = readFileSync('src/claude/SiteIcon.jsx', 'utf8');
  const literal = [...source.matchAll(/<Icon\b[^>]*\bname=["']([^"']+)/g)].map((match) => match[1]);
  const data = [...source.matchAll(/\b(?:ic|icon)\s*[:=]\s*["']([^"']+)/g)].map((match) => match[1]);
  const states = ['triangle-alert', 'circle', 'award', 'crown', 'medal', 'message-square-text'];
  const mapped = new Set([...iconSource.matchAll(/^\s*'([^']+)':/gm)].map((match) => match[1]));
  assert.equal(mapped.size, 59);
  for (const name of new Set([...literal, ...data, ...states])) assert.ok(mapped.has(name), name);
  assert.match(iconSource, /aria-hidden="true"/);
  assert.match(iconSource, /size=\{size\}/);
});
