import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
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
const externalReferences = new Set();
const lecture02ExternalOrigins = new Set([
  'https://fonts.googleapis.com', 'https://fonts.gstatic.com',
  'https://docs.r-wasm.org', 'https://webr.r-wasm.org'
]);
const publicPrefix = 'https://example.github.io/test-repository/';
function checkReference(from, ref) {
  if (ref.startsWith('https://')) {
    const external = new URL(ref.replaceAll('&amp;', '&'));
    assert.ok(from.startsWith('lecture02/') && lecture02ExternalOrigins.has(external.origin), `Unexpected external reference: ${from} -> ${ref}`);
    externalReferences.add(external.href);
    return;
  }
  if (ref.startsWith('data:image/svg+xml,')) {
    assert.equal(from, 'lecture02/index.html', 'Unexpected embedded image.');
    return;
  }
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
  if (file === 'lecture02/app.js') {
    const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], {input: code, encoding: 'utf8'});
    assert.equal(syntax.status, 0, syntax.stderr);
    const webR = code.match(/const WEBR_URL = ['"]([^'"]+)['"]/);
    assert.ok(webR, 'WebR module URL missing.');
    checkReference(file, webR[1]);
    for (const match of code.matchAll(/new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)/g)) checkReference(file, match[1]);
  } else {
    new vm.Script(code, {filename: file});
    assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(code), `Unexpected network dependency: ${file}`);
  }
}
assert.ok(known.has('.nojekyll'));
assert.ok(known.has('lecture05/assets/fonts/OFL.txt'));
const lecture = pages.get('lecture05/index.html').html;
for (const lesson of ['lecture02', 'lecture05']) {
  assert.ok(pages.get('index.html').html.includes(`href="${lesson}/"`));
  assert.ok(pages.get(`${lesson}/index.html`).html.includes('href="../"'));
}
assert.ok(lecture.includes('CPS 1988・28,155人'));
assert.ok(!/father-son|father\.son|star-reading|Project STAR|父親|息子/.test(lecture));
const images = files.filter(file => file.startsWith('lecture05/assets/images/')).sort();
assert.deepEqual(images, ['lecture05/assets/images/cps-groups.png', 'lecture05/assets/images/cps-residuals.png', 'lecture05/assets/images/cps-scatter.png']);
// Licenses and conversion sources accompany the distributed font files.
const fontDistributionFiles = new Set([
  'lecture05/assets/fonts/OFL.txt', 'lecture02/fonts/FONT-NOTICES.txt',
  'lecture02/fonts/GUST-FONT-LICENSE.txt', 'lecture02/fonts/LPPL-1.3c.txt',
  'lecture02/fonts/build_fonts.py', 'lecture02/fonts/sources/mlmmi12.pfb',
  'lecture02/fonts/sources/mlmr12.pfb', 'lecture02/fonts/sources/mlmsy10.pfb'
]);
for (const file of fontDistributionFiles) assert.ok(known.has(file), `Missing font distribution file: ${file}`);
for (const file of files) {
  assert.ok(checked.has(file) || fontDistributionFiles.has(file) || file === '.nojekyll', `Unreferenced public file: ${file}`);
}
const report = {pages: [...pages.keys()],publicFiles: files.length,checkedReferences: checked.size,
  relativePaths: true,projectSubpath: true,javaScriptSyntax: true,externalReferences: [...externalReferences].sort(),
  courseIndexAndReturnLink: true,lecture05CpsOnly: true,images};
fs.writeFileSync(new URL('./asset-checks.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
