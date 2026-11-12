// Inventário de migração: para cada página do site atual, compara as palavras do conteúdo original
// com o conteúdo principal gerado (dist/demo) e lista frases do original que não aparecem na página nova.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const pc = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/wp-export/pages-content.json'), 'utf8'));
const blog = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/blog.json'), 'utf8'));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const words = s => norm(s).split(' ').filter(Boolean).length;
const DEST = { inicio: '/', 'la-clinica': '/instalaciones/', noticias: '/noticias/' };
const rows = []; const missing = {};
for (const [slug, p] of Object.entries(pc)) {
  const dest = DEST[slug] || new URL(p.url).pathname;
  const f = path.join(ROOT, 'dist/demo', dest, 'index.html');
  if (!fs.existsSync(f)) { rows.push([p.url, dest, '-', '-', 'SIN PÁGINA']); continue; }
  const $ = cheerio.load(fs.readFileSync(f, 'utf8'));
  // para equipo/instalaciones/home o texto relevante pode estar também na home
  const newText = norm($('main').text() + (slug === 'inicio' ? '' : ''));
  const orig = p.blocks.filter(b => b.txt).map(b => b.txt);
  // frases (>= 8 palavras) do original ausentes na página nova
  const sentences = orig.flatMap(t => t.split(/(?<=[.!?»”])\s+/)).filter(s => words(s) >= 8);
  const absent = sentences.filter(s => { const n = norm(s); const probe = n.split(' ').slice(0, 8).join(' '); return !newText.includes(probe); });
  const ow = words(orig.join(' ')), nw = words($('main').text());
  if (absent.length) missing[p.url] = absent;
  rows.push([p.url, dest, ow, nw, absent.length ? `${absent.length} frases a revisar` : 'completo']);
}
// blog
let bOk = 0; const bMiss = [];
for (const x of blog.posts) { const f = path.join(ROOT, 'dist/demo', x.path, 'index.html'); if (fs.existsSync(f)) bOk++; else bMiss.push(x.path); }
fs.writeFileSync(path.join(ROOT, 'docs/inventario-contenido.json'), JSON.stringify({ pages: rows, absentSentences: missing, blog: { posts: blog.posts.length, migrated: bOk, missing: bMiss, tags: blog.tags.length } }, null, 1));
console.log('pagina;destino;palabras_original;palabras_nueva;estado');
for (const r of rows) console.log(r.join(';'));
console.log('BLOG', bOk, '/', blog.posts.length, 'faltan:', bMiss.length);
for (const [u, a] of Object.entries(missing)) console.log('\n#', u, '\n  - ' + a.slice(0, 4).map(s => s.slice(0, 110)).join('\n  - ') + (a.length > 4 ? `\n  (+${a.length - 4})` : ''));
