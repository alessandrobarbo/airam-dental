// Verifica se cada frase da página /recomendaciones/ atual aparece em alguma subpágina de recomendação gerada.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const pc = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/wp-export/pages-content.json'), 'utf8'));
const recs = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/recommendations.json'), 'utf8'));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const all = norm(recs.map(r => cheerio.load(fs.readFileSync(path.join(ROOT, 'dist/demo', r.path, 'index.html'), 'utf8'))('main').text()).join(' '));
const main = pc.recomendaciones.blocks;
let section = '', total = 0; const absent = [];
for (const b of main) {
  if (b.t === 'acc') { section = b.txt; continue; }
  if (!b.txt || b.t === 'acc') continue;
  for (const s of b.txt.split(/(?<=[.!?])\s+/)) {
    const n = norm(s); if (n.split(' ').length < 5) continue; total++;
    const probe = n.split(' ').slice(0, 7).join(' ');
    if (!all.includes(probe)) absent.push({ section, text: s });
  }
}
fs.writeFileSync(path.join(ROOT, 'migration/recomendaciones-cobertura.json'), JSON.stringify({ total, absent }, null, 1));
console.log('frases', total, 'ausentes en subpáginas', absent.length);
for (const a of absent) console.log(`[${a.section.slice(0, 45)}] ${a.text.slice(0, 150)}`);
