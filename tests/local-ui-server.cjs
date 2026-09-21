// Test-only static rendering harness. Production middleware is deliberately unchanged.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const build = path.join(root, '.next-mobile');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.rsc':'text/x-component' };
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);
  let base, relative;
  if (pathname.startsWith('/_next/static/')) { base = path.join(build, 'static'); relative = pathname.slice('/_next/static/'.length); }
  else if (path.extname(pathname)) { base = path.join(root, 'public'); relative = pathname.slice(1); }
  else { base = path.join(build, 'server', 'app'); relative = (pathname === '/' ? 'index' : pathname.slice(1)) + (url.searchParams.has('_rsc') ? '.rsc' : '.html'); }
  const file = path.resolve(base, relative);
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
  fs.createReadStream(file).pipe(response);
}).listen(3005, '127.0.0.1', () => console.log('Isolated UI harness: http://127.0.0.1:3005'));
