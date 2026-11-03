import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Symbolic link: ${file}`);
    if (entry.isDirectory()) walk(file);
    else files.push(path.relative(root, file).split(path.sep).join('/'));
  }
}
walk(root);
const known = new Set(files);
const pages = new Map();
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `Duplicate HTML id: ${file}`);
  pages.set(file, {html, ids: new Set(ids)});
}
const checked = new Set();
const publicPrefix = 'https://example.github.io/test-repository/';
function checkReference(from, ref) {
  assert.ok(!/^(?:\/|[a-z][a-z\d+.-]*:)/i.test(ref), `Non-relative reference: ${ref}`);
  const url = new URL(ref, publicPrefix + from);
  assert.ok(url.href.startsWith(publicPrefix), `Reference leaves the repository: ${ref}`);
  let resolved = decodeURIComponent(url.pathname.slice('/test-repository/'.length));
  if (!resolved || resolved.endsWith('/')) resolved += 'index.html';
  assert.ok(known.has(resolved), `Missing file: ${from} -> ${resolved}`);
  if (url.hash) {
    assert.ok(pages.get(resolved)?.ids.has(decodeURIComponent(url.hash.slice(1))), `Missing anchor: ${from} -> ${ref}`);
  }
  checked.add(resolved);
}
for (const [file, {html}] of pages) {
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) checkReference(file, match[1]);
}
for (const file of files.filter(file => file.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) checkReference(file, match[1]);
}
for (const file of files.filter(file => file.endsWith('.js'))) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  new vm.Script(code, {filename: file});
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(code), `Unexpected network dependency: ${file}`);
}
assert.ok(known.has('.nojekyll'));
assert.ok(known.has('lecture05/assets/fonts/OFL.txt'));
const lecture = pages.get('lecture05/index.html').html;
assert.ok(pages.get('index.html').html.includes('href="lecture05/"'));
assert.ok(lecture.includes('href="../"'));
assert.ok(lecture.includes('CPS 1988・28,155人'));
assert.ok(!/father-son|father\.son|star-reading|Project STAR|父親|息子/.test(lecture));
const images = files.filter(file => file.startsWith('lecture05/assets/images/')).sort();
assert.deepEqual(images, ['lecture05/assets/images/cps-groups.png', 'lecture05/assets/images/cps-residuals.png', 'lecture05/assets/images/cps-scatter.png']);
for (const file of files) {
  assert.ok(checked.has(file) || file.endsWith('/fonts/OFL.txt') || file === '.nojekyll', `Unreferenced public file: ${file}`);
}
const report = {pages: [...pages.keys()],publicFiles: files.length,checkedReferences: checked.size,
  relativePaths: true,projectSubpath: true,javaScriptSyntax: true,externalRuntimeRequests: false,
  courseIndexAndReturnLink: true,cpsOnly: true,images};
fs.writeFileSync(new URL('./asset-checks.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
