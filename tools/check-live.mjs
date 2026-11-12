// Verifica ao vivo que todas as páginas e recursos de dist/demo respondem 200 no servidor da demo.
// Uso: node tools/check-live.mjs https://climbahia.com.br/demo-airam
import fs from 'node:fs';
import path from 'node:path';
const BASE = (process.argv[2] || 'https://climbahia.com.br/demo-airam').replace(/\/$/, '');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', 'dist', 'demo');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(ROOT).map(f => path.relative(ROOT, f).replace(/\\/g, '/')).map(f => f.endsWith('index.html') ? f.slice(0, -10) : f);
const bad = []; let ok = 0;
const q = [...files];
async function worker() { while (q.length) { const f = q.shift(); try { const r = await fetch(`${BASE}/${f}`, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (demo-check)' } }); if (r.status === 200) ok++; else bad.push(`${r.status} ${f}`); await r.arrayBuffer(); } catch (e) { bad.push(`ERR ${f} ${e.message}`); } } }
await Promise.all(Array.from({ length: 8 }, worker));
const noSlash = await fetch(`${BASE}/implantologia`, { redirect: 'manual' });
const home = await fetch('https://climbahia.com.br/', { redirect: 'manual' });
const git = await fetch(`${BASE}/.git/config`, { redirect: 'manual' });
const html = await (await fetch(`${BASE}/`)).text();
console.log(JSON.stringify({ total: files.length, ok, bad: bad.slice(0, 20), badCount: bad.length, noSlashRedirect: noSlash.status + ' ' + (noSlash.headers.get('location') || ''), gitDir: git.status, climbahiaHome: home.status, noindex: /noindex/.test(html), banner: /demo-banner/.test(html) }, null, 1));
