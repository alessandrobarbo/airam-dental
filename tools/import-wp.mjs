// Importa o conteúdo do WordPress atual (airamdental.com) para src/data/*.json
// e baixa as imagens usadas para src/img/wp/. Uso: node tools/import-wp.mjs
// Fonte: migration/wp-export/ (export da REST API + conteúdo renderizado das páginas).
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const EXP = path.join(ROOT, 'migration/wp-export');
const DATA = path.join(ROOT, 'src/data');
const IMG = path.join(ROOT, 'src/img/wp');
fs.mkdirSync(DATA, { recursive: true }); fs.mkdirSync(IMG, { recursive: true });
const J = f => JSON.parse(fs.readFileSync(path.join(EXP, f), 'utf8'));
const W = (f, d) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(d, null, 1));
const SITE = 'https://airamdental.com';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (site-migration)' } };

// ---------- utilidades ----------
const SMALL = new Set(['a', 'al', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'o', 'para', 'por', 'un', 'una', 'y', 'con', 'sin', 'sobre', 'tras', 'que', 'se', 'su', 'mi', 'tu']);
// Títulos em CAIXA ALTA -> frase normal ("¿PUEDO PONERME UN IMPLANTE?" -> "¿Puedo ponerme un implante?")
function sentence(s) {
  s = s.replace(/\s+/g, ' ').trim();
  const letters = s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return s;
  let t = s.toLocaleLowerCase('es-ES');
  t = t.replace(/^([¿¡«“"'(\s]*)(\p{L})/u, (m, a, b) => a + b.toLocaleUpperCase('es-ES'));
  // siglas e nomes conhecidos
  for (const w of ['CBCT', 'COEM', 'RX', 'Airam', 'Boadilla', 'Madrid', 'Invisalign', 'COVID-19', 'ATM']) t = t.replace(new RegExp(`\\b${w}\\b`, 'gi'), w);
  return t;
}
const stripQuotes = s => s.replace(/^[«“"']+|[»”"']+$/g, '').trim();
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const downloads = new Map(); // url -> local name
function localImg(url) {
  url = url.replace(/^http:/, 'https:');
  if (!downloads.has(url)) {
    let name = decodeURIComponent(url.split('/').pop().split('?')[0]).toLowerCase();
    name = name.replace(/[^a-z0-9.\-]+/g, '-').replace(/-+/g, '-').replace(/^-/, '');
    let n = name, i = 1; const used = new Set(downloads.values());
    while (used.has(n)) n = `${i++}-${name}`;
    downloads.set(url, n);
  }
  return 'wp/' + downloads.get(url);
}

// Converte blocos extraídos (pages-content.json) em seções: [{title, items:[{type,...}]}]
function toSections(blocks, { skipLead = 0 } = {}) {
  const sections = [{ title: null, items: [] }];
  let cur = sections[0];
  let list = null;
  const push = it => { if (it.type !== 'li') list = null; cur.items.push(it); };
  for (const b of blocks.slice(skipLead)) {
    if (b.t === 'acc') { cur = { title: sentence(b.txt), items: [] }; sections.push(cur); list = null; continue; }
    if (/^h[1-6]$/.test(b.t)) { push({ type: 'h', text: sentence(stripQuotes(b.txt)) }); continue; }
    if (b.t === 'li') {
      if (!list) { list = { type: 'ul', items: [] }; cur.items.push(list); }
      list.items.push(b.txt); continue;
    }
    if (b.t === 'img') { push({ type: 'img', src: localImg(b.src), alt: b.alt || '' }); continue; }
    if (b.t === 'p' || b.t === 'blockquote' || b.t === 'dd' || b.t === 'dt') {
      const links = (b.links || []).filter(l => /^https?:|^\//.test(l.href));
      push({ type: 'p', text: b.txt, ...(links.length ? { links } : {}) });
    }
  }
  return sections.filter(s => s.title || s.items.length);
}

const pc = J('pages-content.json');

// ---------- tratamientos ----------
const TREAT = [
  ['implantologia', 'Implantología'], ['ortodoncia', 'Ortodoncia'], ['odontopediatria', 'Odontopediatría'],
  ['estetica-dental', 'Estética dental'], ['blanqueamiento-dental', 'Blanqueamiento dental'], ['restauradora', 'Odontología restauradora'],
  ['endodoncia', 'Endodoncia'], ['protesis', 'Prótesis dental'], ['cirugia-dental', 'Cirugía dental'], ['periodoncia', 'Periodoncia'],
  ['sedacion-consciente', 'Sedación consciente']
];
const treatments = TREAT.map(([slug, name]) => {
  const p = pc[slug];
  const bl = p.blocks;
  // cabeçalho: h5 com o nome e h4 com o lema entre aspas
  let lead = 0, motto = '';
  if (bl[0] && /^h[1-6]$/.test(bl[0].t)) lead = 1;
  if (bl[lead] && /^h[1-6]$/.test(bl[lead].t) && /^[«“"]/.test(bl[lead].txt.trim())) { motto = sentence(stripQuotes(bl[lead].txt)); lead++; }
  // remove pés de página genéricos repetidos ("Cualquier duda o consulta...", "Llámenos")
  const body = bl.filter(b => !/^Cualquier duda o consulta|^Llámenos$|^LLAMAR$/i.test(b.txt || ''));
  return { slug, name, motto, source: p.url, sourceModified: p.modified, metaTitle: p.title, metaDesc: p.metaDesc, sections: toSections(body, { skipLead: lead }) };
});
W('treatments.json', treatments);

// ---------- recomendações ----------
const RECS = ['recomendaciones-tras-una-extraccion-dental', 'recomendaciones-tras-cirugia-de-implantes', 'recomendaciones-tras-endodoncia',
  'recomendaciones-tratamiento-periodontal', 'recomendaciones-ferula-de-descarga', 'recomendaciones-fluor', 'recomendaciones-ortodoncia-covencional',
  'recomendaciones-retencion-ortodoncia', 'recomendaciones-tras-un-blanqueamiento', 'recomendaciones-ortodoncia-invisible'];
const NAMES = {
  'recomendaciones-tras-una-extraccion-dental': 'Tras una extracción dental', 'recomendaciones-tras-cirugia-de-implantes': 'Tras una cirugía de implantes',
  'recomendaciones-tras-endodoncia': 'Tras una endodoncia', 'recomendaciones-tratamiento-periodontal': 'Tratamiento periodontal',
  'recomendaciones-ferula-de-descarga': 'Férula de descarga', 'recomendaciones-fluor': 'Flúor', 'recomendaciones-ortodoncia-covencional': 'Ortodoncia convencional',
  'recomendaciones-retencion-ortodoncia': 'Retención después de la ortodoncia', 'recomendaciones-tras-un-blanqueamiento': 'Tras un blanqueamiento',
  'recomendaciones-ortodoncia-invisible': 'Ortodoncia invisible'
};
const recommendations = RECS.map(slug => {
  const p = pc[slug];
  const rel = new URL(p.url).pathname; // conserva o caminho atual, p. ex. /cirugia-dental/recomendaciones-tras-cirugia-de-implantes/
  const bl = p.blocks.filter(b => !/^Cualquier duda o consulta|^Llámenos$/i.test(b.txt || ''));
  let lead = 0; while (bl[lead] && /^h[1-6]$/.test(bl[lead].t) && lead < 2) lead++;
  return { slug, path: rel, name: NAMES[slug], parent: rel.split('/').filter(Boolean)[0], source: p.url, sourceModified: p.modified,
    inMainList: slug !== 'recomendaciones-ortodoncia-invisible', sections: toSections(bl, { skipLead: lead }) };
});
W('recommendations.json', recommendations);

// ---------- páginas específicas (landing) ----------
const extra = ['especialistas-estetica-dental-madrid', 'implantes-cirugia-guiada'].map(slug => {
  const p = pc[slug];
  return { slug, path: new URL(p.url).pathname, h1: sentence(stripQuotes(p.h1 || p.title.split(' - ')[0])), metaTitle: p.title, metaDesc: p.metaDesc,
    source: p.url, sections: toSections(p.blocks.filter(b => !/^Cualquier duda o consulta|^Llámenos$/i.test(b.txt || ''))) };
});
W('landings.json', extra);

// ---------- blog ----------
const posts = J('posts.json');
const media = Object.fromEntries(J('media.json').map(m => [m.id, m]));
let tags = [];
for (let page = 1; ; page++) {
  const r = await fetch(`${SITE}/wp-json/wp/v2/tags?per_page=100&page=${page}&_fields=id,name,slug,count`, UA);
  if (!r.ok) break; tags = tags.concat(await r.json());
  if (page >= +r.headers.get('x-wp-totalpages')) break;
}
// tags dos posts (o export inicial não incluiu este campo)
const postTags = {};
for (let page = 1; ; page++) {
  const r = await fetch(`${SITE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=id,tags,author`, UA);
  if (!r.ok) break; for (const x of await r.json()) postTags[x.id] = x;
  if (page >= +r.headers.get('x-wp-totalpages')) break;
}
const tagById = Object.fromEntries(tags.map(t => [t.id, t]));
const WA_BAD = /https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?(?:34)?916334636/g;
const blog = posts.map(p => {
  const $ = cheerio.load(`<div id="c">${p.content.rendered}</div>`);
  const c = $('#c');
  c.find('script,style,noscript').remove();
  c.find('img').each((_, im) => {
    const $im = $(im); const src = $im.attr('src');
    if (src && /airamdental\.com|clinicadentalsmileboadilla\.com/.test(src)) $im.attr('src', '{{IMG}}' + localImg(src));
    for (const a of ['srcset', 'sizes', 'class', 'style', 'width', 'height', 'decoding', 'data-src']) $im.removeAttr(a);
    $im.attr('loading', 'lazy');
    if ($im.attr('alt') === undefined) $im.attr('alt', '');
  });
  c.find('a').each((_, a) => {
    const $a = $(a); let h = $a.attr('href') || '';
    h = h.replace(WA_BAD, 'https://wa.me/34916334636');
    // links internos -> caminho relativo (o build acrescenta o prefixo correto)
    const m = h.match(/^https?:\/\/(?:www\.)?airamdental\.com(\/[^#?]*)?(.*)$/);
    if (m) h = '{{ROOT}}' + (m[1] || '/').replace(/^\//, '') + (m[2] || '');
    $a.attr('href', h);
    if (/^https?:/.test(h)) $a.attr('rel', 'noopener');
  });
  c.find('[style]').removeAttr('style');
  c.find('p').each((_, el) => { if (!$(el).text().trim() && !$(el).find('img,iframe').length) $(el).remove(); });
  const fm = media[p.featured_media];
  const t = postTags[p.id] || {};
  return {
    id: p.id, slug: p.slug, path: new URL(p.link).pathname, title: cheerio.load(p.title.rendered).text(),
    date: p.date, modified: p.modified,
    excerpt: cheerio.load(p.excerpt.rendered).text().replace(/\s*\[…\]|\s*\[&hellip;\]/g, '…').replace(/\s+/g, ' ').trim(),
    metaTitle: p.yoast_head_json?.title || '', metaDesc: p.yoast_head_json?.description || '',
    image: fm ? { src: localImg(fm.source_url), alt: fm.alt_text || '' } : null,
    tags: (t.tags || []).map(id => tagById[id]?.slug).filter(Boolean),
    html: c.html().trim(), source: p.link
  };
}).sort((a, b) => b.date.localeCompare(a.date));
W('blog.json', { posts: blog, tags: tags.filter(t => t.count > 0).map(({ name, slug, count }) => ({ name, slug, count })) });

// ---------- downloads ----------
let ok = 0, fail = [];
for (const [url, name] of downloads) {
  const dest = path.join(IMG, name);
  if (fs.existsSync(dest)) { ok++; continue; }
  try {
    const r = await fetch(url, UA);
    if (!r.ok) throw new Error(r.status);
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); ok++;
  } catch (e) { fail.push(url + ' ' + e.message); }
}
console.log(JSON.stringify({
  treatments: treatments.map(t => `${t.slug}:${t.sections.length}s`).join(' '),
  recommendations: recommendations.length, landings: extra.length,
  posts: blog.length, tags: tags.length, imagesOk: ok, imagesFailed: fail
}, null, 1));
