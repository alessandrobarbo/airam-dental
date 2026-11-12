// Verificação estática de dist/<modo>: links e recursos internos, h1 único, alt, títulos, ids duplicados,
// dependências externas, wa.me sem prefixo, noindex/canonical conforme o modo.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
const MODE = process.argv[2] || 'demo';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'dist', MODE);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const htmls = walk(OUT).filter(f => f.endsWith('.html'));
const issues = []; const titles = {}; const hosts = {}; let links = 0, anchorsChecked = 0;
const add = (f, m) => issues.push(`${path.relative(OUT, f).replace(/\\/g, '/')}: ${m}`);
const idsCache = {};
function idsOf(file) { if (!idsCache[file]) { const $ = cheerio.load(fs.readFileSync(file, 'utf8')); idsCache[file] = new Set($('[id]').map((_, e) => $(e).attr('id')).get()); } return idsCache[file]; }
for (const f of htmls) {
  const $ = cheerio.load(fs.readFileSync(f, 'utf8'));
  const isRedirect = $('meta[http-equiv="refresh"]').length > 0;
  const t = $('title').text(); (titles[t] = titles[t] || []).push(f);
  if (!isRedirect) {
    if ($('h1').length !== 1) add(f, `h1 = ${$('h1').length}`);
    if (!$('meta[name="description"]').attr('content')) add(f, 'sin meta description');
    if (MODE === 'demo' && !/noindex/.test($('meta[name="robots"]').attr('content') || '')) add(f, 'demo sin noindex');
    if (MODE === 'prod' && !$('link[rel="canonical"]').length) add(f, 'prod sin canonical');
    if (MODE === 'prod' && $('meta[name="robots"][content*="noindex"]').length) add(f, 'prod con noindex');
    const ids = $('[id]').map((_, e) => $(e).attr('id')).get(); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); if (dup.length) add(f, 'ids duplicados: ' + [...new Set(dup)].join(','));
    $('img').each((_, e) => { if ($(e).attr('alt') === undefined) add(f, 'img sin alt: ' + $(e).attr('src')); });
    // níveis de título sem saltos (h2 -> h4)
    let prev = 1; $('main h1, main h2, main h3, main h4').each((_, e) => { const l = +e.tagName[1]; if (l > prev + 1) add(f, `salto de encabezado h${prev}->h${l}: ${$(e).text().slice(0, 40)}`); prev = l; });
  }
  $('a[href], img[src], link[href], script[src], [data-img]').each((_, e) => {
    const v = $(e).attr('href') || $(e).attr('src') || $(e).attr('data-img');
    if (!v || v.startsWith('#') || /^(mailto|tel|data):/.test(v)) {
      if (v && v.length > 1 && v.startsWith('#') && !isRedirect) { anchorsChecked++; if (!idsOf(f).has(v.slice(1))) add(f, 'ancla rota ' + v); }
      return;
    }
    if (/^https?:/.test(v)) { const h = new URL(v).host; hosts[h] = (hosts[h] || 0) + 1; if (/wa\.me\/(?!34)/.test(v)) add(f, 'wa.me sin prefijo: ' + v); return; }
    links++;
    const [p, hash] = v.split('#');
    let target = path.resolve(path.dirname(f), decodeURIComponent(p.split('?')[0]));
    if (v.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) add(f, 'enlace interno roto: ' + v);
    else if (hash && target.endsWith('.html')) { anchorsChecked++; if (!idsOf(target).has(hash)) add(f, 'ancla rota ' + v); }
  });
}
const dupTitles = Object.entries(titles).filter(([, v]) => v.length > 1);
console.log(JSON.stringify({ mode: MODE, html: htmls.length, internalRefs: links, anchorsChecked, issues: issues.length, duplicateTitles: dupTitles.map(([k, v]) => `${k} (${v.length})`), externalHosts: hosts }, null, 1));
if (issues.length) console.log(issues.slice(0, 60).join('\n'));
