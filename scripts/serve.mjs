import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const args = process.argv.slice(2);
let base = '/econometrics-2026/';
let port = 4190;
for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '--base') base = args[i + 1];
  else if (args[i] === '--port') port = Number(args[i + 1]);
  else throw new Error('Usage: node scripts/serve.mjs [--base /repository/] [--port 4190]');
}
if (!base || !base.startsWith('/') || !base.endsWith('/') || /[?#\\]/.test(base) || base.includes('//') || base.includes('..')) {
  throw new Error('--base must be a URL path beginning and ending with /.');
}
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port.');
const types = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8'};

const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (base !== '/' && (pathname === '/' || pathname === base.slice(0, -1))) {
      res.writeHead(302, {Location: base}); res.end(); return;
    }
    if (!pathname.startsWith(base)) {res.writeHead(404); res.end('Not found'); return;}
    const requested = pathname.slice(base.length);
    const relative = requested + (pathname.endsWith('/') ? 'index.html' : '');
    const target = path.resolve(root, relative);
    const within = path.relative(root, target);
    if (within.startsWith('..') || path.isAbsolute(within)) {res.writeHead(403); res.end(); return;}
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      res.writeHead(302, {Location: pathname + '/'}); res.end(); return;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {res.writeHead(404); res.end('Not found'); return;}
    res.writeHead(200, {'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(target).pipe(res);
  } catch {res.writeHead(400); res.end('Bad request');}
});
server.on('error', error => {console.error(error.message); process.exitCode = 1;});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}${base}`));
