// Servidor local para pré-visualizar dist/<modo>. Uso: node tools/serve.mjs [demo|prod] [porta]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', 'dist', process.argv[2] || 'demo');
const PORT = +(process.argv[3] || 5178);
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': T['.html'] }); return res.end(fs.readFileSync(path.join(ROOT, '404.html'))); }
  res.writeHead(200, { 'Content-Type': T[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}  (${ROOT})`));
