// Gera o site estático de Clínica Dental Airam.
// Uso: node tools/build.mjs demo|prod   -> dist/demo ou dist/prod
//  demo: noindex, faixa de demonstração, sem canonical/sitemap; aviso do operador da demo nas páginas legais.
//  prod: canonical para https://airamdental.com, robots.txt, sitemap.xml, .htaccess com redirecionamentos 301.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import { legalPages } from './legal.mjs';

const MODE = process.argv[2] === 'prod' ? 'prod' : 'demo';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist', MODE);
const D = f => JSON.parse(fs.readFileSync(path.join(SRC, 'data', f), 'utf8'));
const site = D('site.json'), team = D('team.json'), gallery = D('gallery.json'), overrides = D('text-overrides.json');
const treatments = D('treatments.json'), recs = D('recommendations.json'), landings = D('landings.json'), blog = D('blog.json');
const BASE = site.domains[MODE];
const TODAY = new Date().toISOString().slice(0, 10);
const YEARS = new Date().getFullYear() - 2000;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------------- utilidades ----------------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const prefix = p => '../'.repeat(p.split('/').filter(Boolean).filter(s => !s.endsWith('.html')).length); // p = "/implantologia/"
const waLink = topic => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(topic ? `Hola, me gustaría solicitar información sobre ${topic} en Clínica Dental Airam.` : 'Hola, me gustaría solicitar cita en Clínica Dental Airam.')}`;
const mailLink = subject => `mailto:${site.email}?subject=${encodeURIComponent(subject || 'Solicitud de información')}`;
const fmtDate = iso => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });
const pages = [];          // {path, title, lastmod}
const redirects = [];      // {from, to}
const write = (p, html) => { const f = path.join(OUT, p, p.endsWith('.html') ? '' : 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

// aplica as reformulações registradas em text-overrides.json
const applied = [];
for (const o of overrides.treatments) {
  const t = treatments.find(x => x.slug === o.slug); if (!t) continue;
  let hit = false;
  if (t.motto === o.find) { t.motto = o.replace; hit = true; }
  for (const s of t.sections) {
    if (s.title && s.title.includes(o.find)) { s.title = s.title.replace(o.find, o.replace); hit = true; }
    for (const it of s.items) {
      if (it.text && it.text.includes(o.find)) { it.text = it.text.replace(o.find, o.replace); hit = true; }
      if (it.items) it.items = it.items.map(x => x.includes(o.find) ? (hit = true, x.replace(o.find, o.replace)) : x);
    }
  }
  applied.push({ slug: o.slug, ok: hit, find: o.find.slice(0, 60) });
}

// ---------------- imagens ----------------
const dims = {}; // "wp/x.jpg" -> [w,h]
const CACHE = path.join(ROOT, '.cache', 'img');
async function processImages() {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const files = walk(path.join(SRC, 'img'));
  const small = new Set(team.members.map(m => m.img));
  for (const f of files) {
    const rel = path.relative(path.join(SRC, 'img'), f).replace(/\\/g, '/');
    const dest = path.join(OUT, 'assets/img', rel); fs.mkdirSync(path.dirname(dest), { recursive: true });
    const ext = path.extname(f).toLowerCase();
    if (ext === '.svg') { fs.copyFileSync(f, dest); continue; }
    const max = small.has(rel) ? 720 : rel.startsWith('wp/') ? 1200 : 1600;
    const cached = path.join(CACHE, rel + `.${max}`);
    const meta = cached + '.json';
    if (!fs.existsSync(cached) || fs.statSync(cached).mtimeMs < fs.statSync(f).mtimeMs) {
      fs.mkdirSync(path.dirname(cached), { recursive: true });
      let img = sharp(fs.readFileSync(f), { failOn: 'none' }) // buffer: evita o limite de 260 caracteres de caminho do Windows.rotate().resize({ width: max, withoutEnlargement: true });
      img = ext === '.png' ? img.png({ compressionLevel: 9, palette: true }) : img.jpeg({ quality: 76, mozjpeg: true });
      const { data, info } = await img.toBuffer({ resolveWithObject: true });
      fs.writeFileSync(cached, data); fs.writeFileSync(meta, JSON.stringify([info.width, info.height]));
    }
    fs.copyFileSync(cached, dest);
    dims[rel] = JSON.parse(fs.readFileSync(meta, 'utf8'));
  }
}
const img = (R, rel, alt, { cls = '', lazy = true, sizes = '' } = {}) => {
  const d = dims[rel] || [];
  return `<img src="${R}assets/img/${rel}" alt="${esc(alt)}"${d[0] ? ` width="${d[0]}" height="${d[1]}"` : ''}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}${cls ? ` class="${cls}"` : ''}${sizes ? ` sizes="${sizes}"` : ''}>`;
};

// ---------------- layout ----------------
const NAV = [
  ['especialidades/', 'Tratamientos'], ['instalaciones/', 'Clínica'], ['equipo/', 'Equipo'],
  ['recomendaciones/', 'Recomendaciones'], ['noticias/', 'Blog'], ['contacto/', 'Contacto']
];
const ICONS = fs.readFileSync(path.join(SRC, 'partials', 'icons.svg'), 'utf8');
const banner = MODE === 'demo' ? `<div class="demo-banner" role="note">Propuesta de rediseño. Versión de demostración, no es la web oficial de Clínica Dental Airam.</div>` : '';

function head({ p, title, desc, image, type = 'website', jsonld = [] }) {
  const R = prefix(p);
  const url = BASE + p;
  const ogImg = BASE + '/assets/img/' + (image || 'sortistudio-airam-equipo-diciembre-2024-1.jpg');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${MODE === 'demo' ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#3A4147">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Clínica Dental Airam">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImg}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${R}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R}assets/img/apple-touch-icon.png">
<link rel="preload" href="${R}assets/fonts/maven-pro-3.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${R}assets/fonts/maven-pro.css">
<link rel="stylesheet" href="${R}assets/css/site.css">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>`;
}

function header(p, current) {
  const R = prefix(p);
  const items = NAV.map(([href, label]) => `<a href="${R}${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<body>
${ICONS}
<a class="skip" href="#main">Saltar al contenido</a>
<header class="site-header">
  ${banner}
  <div class="wrap header-in">
    <a class="logo" href="${R}" aria-label="Clínica Dental Airam, inicio">
      <svg class="mark" viewBox="0 0 340.16 340.16" aria-hidden="true"><use href="#i-mark"/></svg>
      <span class="word"><small>Clínica dental</small><svg viewBox="0 0 250 61" aria-hidden="true"><use href="#i-word"/></svg></span>
    </a>
    <nav class="nav" aria-label="Principal">${items}</nav>
    <a class="btn btn-primary header-cta" href="${waLink()}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Solicitar cita</a>
    <button type="button" class="menu-btn" aria-expanded="false" aria-controls="mnav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span class="sr-only">Abrir menú</span></button>
  </div>
  <div class="mnav" id="mnav" hidden>
    <nav aria-label="Menú móvil">${items}</nav>
    <div class="mnav-actions">
      <a class="btn btn-primary" href="${waLink()}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Solicitar cita por WhatsApp</a>
      <a class="btn btn-line" href="tel:${site.phone}"><svg aria-hidden="true"><use href="#i-phone"/></svg>Llamar al ${site.phoneShort}</a>
    </div>
  </div>
</header>`;
}

function crumbs(p, trail) {
  const R = prefix(p);
  const all = [['', 'Inicio'], ...trail];
  return `<nav class="crumbs wrap" aria-label="Migas de pan"><ol>${all.map(([h, l], i) => i === all.length - 1 ? `<li aria-current="page">${esc(l)}</li>` : `<li><a href="${R}${h}">${esc(l)}</a></li>`).join('')}</ol></nav>`;
}
const crumbsLd = trail => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['', 'Inicio'], ...trail].map(([h, l], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: `${BASE}/${h}` })) });

function contactBand(p, topic, title) {
  return `<section class="cta-band" aria-labelledby="cta-h">
  <div class="wrap cta-in">
    <div>
      <h2 id="cta-h">${esc(title || '¿Hablamos?')}</h2>
      <p>Escríbenos o llámanos para solicitar cita. Te responderemos para confirmar el día y la hora.</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-primary" href="${waLink(topic)}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Escribir por WhatsApp</a>
      <a class="btn btn-line" href="tel:${site.phone}"><svg aria-hidden="true"><use href="#i-phone"/></svg>${site.phoneDisplay}</a>
      <a class="btn btn-line" href="${mailLink(topic ? `Consulta sobre ${topic}` : '')}"><svg aria-hidden="true"><use href="#i-mail"/></svg>${site.email}</a>
    </div>
  </div>
</section>`;
}

function footer(p) {
  const R = prefix(p);
  return `<footer class="foot">
  <div class="wrap foot-grid">
    <div>
      <a class="logo" href="${R}" aria-label="Clínica Dental Airam, inicio">
        <svg class="mark" viewBox="0 0 340.16 340.16" aria-hidden="true"><use href="#i-mark"/></svg>
        <span class="word"><small>Clínica dental</small><svg viewBox="0 0 250 61" aria-hidden="true"><use href="#i-word"/></svg></span>
      </a>
      <p class="foot-addr">${esc(site.address.street)}<br>${site.address.postalCode} ${esc(site.address.city)} (Madrid)<br><a href="tel:${site.phone}">${site.phoneDisplay}</a> · <a href="mailto:${site.email}">${site.email}</a></p>
    </div>
    <nav aria-label="Clínica"><h2 class="foot-h">Clínica</h2><a href="${R}especialidades/">Tratamientos</a><a href="${R}instalaciones/">Instalaciones</a><a href="${R}equipo/">Equipo</a><a href="${R}contacto/">Contacto y horario</a></nav>
    <nav aria-label="Pacientes"><h2 class="foot-h">Pacientes</h2><a href="${R}recomendaciones/">Recomendaciones</a><a href="${R}noticias/">Blog</a><a href="${site.newsletter.url}" target="_blank" rel="noopener">Newsletter (formulario de Brevo)</a></nav>
    <nav aria-label="Legal"><h2 class="foot-h">Legal</h2><a href="${R}aviso-legal/">Aviso legal</a><a href="${R}politicadeprivacidad/">Política de privacidad</a><a href="${R}politica-de-cookies/">Política de cookies</a></nav>
    <div class="social">
      <a href="${site.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg aria-hidden="true"><use href="#i-ig"/></svg></a>
      <a href="${site.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><svg aria-hidden="true"><use href="#i-fb"/></svg></a>
      <a href="${waLink()}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg aria-hidden="true"><use href="#i-wa"/></svg></a>
    </div>
    <div class="legal-id">
      <span>${esc(site.legalName)} · CIF ${site.nif}</span>
      <span>Autorización sanitaria n.º ${site.sanitaryAuth}</span>
      <span>Copyright © <span class="y">${new Date().getFullYear()}</span></span>
    </div>
  </div>
</footer>
<div class="mbar"><a class="btn btn-line" href="tel:${site.phone}"><svg aria-hidden="true"><use href="#i-phone"/></svg>Llamar</a><a class="btn btn-primary" href="${waLink()}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Solicitar cita</a></div>
<script>window.AIRAM=${JSON.stringify({ hours: site.hours, exceptions: site.hoursExceptions })};</script>
<script src="${R}assets/js/site.js" defer></script>
</body>
</html>`;
}

function page({ p, title, desc, current, trail, image, type, jsonld = [], body, topic, ctaTitle, noCta }) {
  pages.push({ path: p, title });
  return head({ p, title, desc, image, type, jsonld: [...jsonld, ...(trail ? [crumbsLd(trail)] : [])] }) + '\n' + header(p, current) +
    `\n<main id="main">\n${trail ? crumbs(p, trail) : ''}\n${body}\n${noCta ? '' : contactBand(p, topic, ctaTitle)}\n</main>\n` + footer(p);
}

// texto com links do conteúdo original
function linkify(R, text, links) {
  let h = esc(text);
  for (const l of links || []) {
    let href = l.href.replace(/https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?(?:34)?916334636[^"]*/, waLink());
    // domínio atual, de desenvolvimento (dev31.especialistasweb.es) ou antigo -> página interna
    const m = href.match(/^https?:\/\/(?:www\.)?(?:airamdental\.com|dev31\.especialistasweb\.es|clinicadentalsmileboadilla\.com)\/?([^#?]*)/);
    if (m) { if (/dev31|smile/.test(href)) legacyLinks.push({ post: 'tratamiento', from: href, to: '/' + m[1] }); href = R + m[1]; }
    if (/clinicadentalsmileboadilla\.com/.test(href) || !l.text) continue;
    const t = esc(l.text); const i = h.indexOf(t); if (i < 0) continue;
    const ext = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
    h = h.slice(0, i) + `<a href="${esc(href)}"${ext}>${t}</a>` + h.slice(i + t.length);
  }
  return h;
}
function renderItems(R, items, hTag = 'h3') {
  return items.map(it => {
    if (it.type === 'p') return `<p>${linkify(R, it.text, it.links)}</p>`;
    if (it.type === 'h') return `<${hTag}>${esc(it.text)}</${hTag}>`;
    if (it.type === 'ul') return `<ul>${it.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (it.type === 'img') return `<figure class="inline-fig">${img(R, it.src, it.alt)}</figure>`;
    return '';
  }).join('\n');
}
const idOf = (s, i) => 'sec-' + (i + 1) + '-' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// ---------------- dados auxiliares ----------------
const TREAT_IMG = {
  implantologia: ['cbct-3d-opt-scaled.jpg', 'Imagen de diagnóstico CBCT 3D'], ortodoncia: ['sortistudio-airam-26-09-2024-62-scaled-5065944f.jpg', 'Paciente revisando su sonrisa con un espejo'],
  odontopediatria: ['sortistudio-airam-26-09-2024-26-scaled-1283d82b.jpg', 'Niña en una revisión dental'], 'estetica-dental': ['2022.02.22-clinica-smile-243-36a2a5bc.jpg', 'Elección del color dental con guía de tonos'],
  'blanqueamiento-dental': ['sortistudio-airam-28-octubre-40-opt.jpg', 'Paciente durante un tratamiento dental'], restauradora: ['sortistudio-airam-28-octubre-52-opt.jpg', 'Dos profesionales de Airam realizando un tratamiento'],
  endodoncia: ['sortistudio-airam-10-09-2024-14-opt-scaled-c52ab58c.jpg', 'Diseño digital de una pieza dental'], protesis: ['sortistudio-airam-26-09-2024-56-scaled-43cb1043.jpg', 'Radiografía dental en pantalla'],
  'cirugia-dental': ['quirofano-opt-ok-scaled.jpg', 'Cirujana en el quirófano de la clínica'], periodoncia: ['sortistudio-airam-10-09-2024-31-opt-scaled-bb451a79.jpg', 'Instrumental del gabinete dental'],
  'sedacion-consciente': ['gabinete-3-sedacion-opt-scaled.jpg', 'Gabinete de cirugía y sedación de la clínica']
};
const TREAT_RECS = {
  implantologia: ['recomendaciones-tras-cirugia-de-implantes', 'recomendaciones-ferula-de-descarga'],
  'cirugia-dental': ['recomendaciones-tras-una-extraccion-dental', 'recomendaciones-tras-cirugia-de-implantes'],
  endodoncia: ['recomendaciones-tras-endodoncia'], periodoncia: ['recomendaciones-tratamiento-periodontal'],
  odontopediatria: ['recomendaciones-fluor'], ortodoncia: ['recomendaciones-ortodoncia-covencional', 'recomendaciones-retencion-ortodoncia', 'recomendaciones-ortodoncia-invisible'],
  'blanqueamiento-dental': ['recomendaciones-tras-un-blanqueamiento'], 'estetica-dental': ['recomendaciones-tras-un-blanqueamiento'],
  protesis: ['recomendaciones-ferula-de-descarga'], restauradora: [], 'sedacion-consciente': []
};
const topicOf = t => t.name.toLowerCase().replace('odontología restauradora', 'odontología restauradora').replace(/^(prótesis dental)$/, 'prótesis dentales');
const specialties = treatments.filter(t => t.slug !== 'sedacion-consciente');
const sedation = treatments.find(t => t.slug === 'sedacion-consciente');

// ---------------- páginas: tratamentos ----------------
function treatmentPage(t) {
  const p = `/${t.slug}/`, R = prefix(p);
  const intro = t.sections[0] && !t.sections[0].title ? t.sections[0] : null;
  const rest = intro ? t.sections.slice(1) : t.sections;
  const ids = rest.map((s, i) => idOf(s.title, i));
  const toc = rest.length > 1 ? `<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h" class="toc-h">En esta página</h2><ol>${rest.map((s, i) => `<li><a href="#${ids[i]}">${esc(s.title)}</a></li>`).join('')}</ol></nav>` : '';
  const recLinks = (TREAT_RECS[t.slug] || []).map(s => recs.find(r => r.slug === s)).filter(Boolean);
  const pros = team.members.filter(m => (m.areas || []).includes(t.slug));
  const others = treatments.filter(x => x.slug !== t.slug);
  const [heroImg, heroAlt] = TREAT_IMG[t.slug];
  const body = `
<article class="treat">
  <header class="page-hero wrap">
    <div class="page-hero-text">
      <p class="kicker">${t.slug === 'sedacion-consciente' ? 'Sedación' : 'Especialidad'}</p>
      <h1>${esc(t.name)}</h1>
      ${t.motto ? `<p class="motto">«${esc(t.motto)}»</p>` : ''}
      <div class="hero-actions">
        <a class="btn btn-primary" href="${waLink(topicOf(t))}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Consultar por WhatsApp</a>
        <a class="btn btn-line" href="tel:${site.phone}"><svg aria-hidden="true"><use href="#i-phone"/></svg>${site.phoneShort}</a>
      </div>
    </div>
    <figure class="petal-frame page-hero-img">${img(R, heroImg, heroAlt, { lazy: false, sizes: '(max-width: 900px) 100vw, 50vw' })}</figure>
  </header>
  <div class="wrap treat-grid">
    <div class="prose">
      ${intro ? renderItems(R, intro.items) : ''}
      ${toc}
      ${rest.map((s, i) => `<section aria-labelledby="${ids[i]}"><h2 id="${ids[i]}">${esc(s.title)}</h2>\n${renderItems(R, s.items)}</section>`).join('\n')}
      <aside class="callout" aria-label="Valoración individual">
        <h2>Valoración individual</h2>
        <p>Cada boca es diferente. La indicación, las fases y el presupuesto de cualquier tratamiento se deciden después de una valoración en consulta. Esta información es orientativa y no sustituye el diagnóstico de un profesional.</p>
      </aside>
    </div>
    <aside class="side">
      ${recLinks.length ? `<section class="side-box" aria-labelledby="rec-h"><h2 id="rec-h">Cuidados después del tratamiento</h2><ul>${recLinks.map(r => `<li><a href="${R}${r.path.replace(/^\//, '')}">${esc(r.name)}</a></li>`).join('')}</ul><p class="note">Pautas generales. Sigue siempre las indicaciones de tu profesional.</p></section>` : ''}
      ${pros.length ? `<section class="side-box" aria-labelledby="pro-h"><h2 id="pro-h">Profesionales</h2><ul class="pro-list">${pros.map(m => `<li>${img(R, m.img, '', { cls: 'avatar' })}<span><a href="${R}equipo/#${m.id}">${esc(m.name)}</a><small>${esc(m.role)}</small></span></li>`).join('')}</ul></section>` : ''}
      <section class="side-box" aria-labelledby="oth-h"><h2 id="oth-h">Otros tratamientos</h2><ul>${others.map(o => `<li><a href="${R}${o.slug}/">${esc(o.name)}</a></li>`).join('')}</ul></section>
    </aside>
  </div>
</article>`;
  return page({ p, title: `${t.name} en Boadilla del Monte · Clínica Dental Airam`, desc: t.metaDesc || `${t.name} en Clínica Dental Airam, Boadilla del Monte.`, current: 'especialidades/', image: heroImg,
    trail: [['especialidades/', 'Tratamientos'], [t.slug + '/', t.name]], body, topic: topicOf(t), ctaTitle: `¿Tienes dudas sobre ${t.name.toLowerCase()}?`,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'MedicalWebPage', name: t.name, about: { '@type': 'MedicalProcedure', name: t.name }, inLanguage: 'es-ES', url: BASE + p, lastReviewed: undefined }] });
}

function specialtiesPage() {
  const p = '/especialidades/', R = prefix(p);
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/wp-export/pages-content.json'), 'utf8')).especialidades;
  const consejo = src.blocks.filter(b => b.t === 'p').map(b => b.txt);
  const card = t => `<li class="t-card"><a href="${R}${t.slug}/">${img(R, TREAT_IMG[t.slug][0], '', { cls: 't-img' })}<span class="t-name">${esc(t.name)}</span>${t.motto ? `<span class="t-motto">«${esc(t.motto)}»</span>` : ''}</a></li>`;
  const body = `
<header class="page-hero page-hero--plain wrap"><div class="page-hero-text"><h1>Tratamientos</h1>
<p class="motto">«Un experto es alguien que conoce los errores que se pueden cometer en su especialidad y sabe cómo evitarlos»</p>
<p class="lead">Ofrecemos <strong>10 especialidades odontológicas</strong> para niños y adultos. Además, contamos con <strong>sedación consciente</strong>, que no es una especialidad en sí misma sino un apoyo para que algunos tratamientos se realicen con más tranquilidad.</p></div></header>
<section class="wrap" aria-labelledby="esp-h"><h2 id="esp-h" class="sec-title">Especialidades</h2><ul class="t-grid">${specialties.map(card).join('')}</ul></section>
<section class="wrap" aria-labelledby="sed-h"><h2 id="sed-h" class="sec-title">Apoyo a los tratamientos</h2><ul class="t-grid t-grid--one">${card(sedation)}</ul></section>
<section class="wrap narrow" aria-labelledby="cons-h"><h2 id="cons-h" class="sec-title">Consejos a seguir después del tratamiento</h2>${consejo.map(c => `<p>${esc(c)}</p>`).join('')}<p><a class="btn btn-line" href="${R}recomendaciones/">Ver las recomendaciones</a></p></section>`;
  return page({ p, title: 'Tratamientos dentales en Boadilla del Monte · Clínica Dental Airam', desc: 'Implantología, ortodoncia, odontopediatría, estética dental, blanqueamiento, restauradora, endodoncia, prótesis, cirugía, periodoncia y sedación consciente en Boadilla del Monte.', current: 'especialidades/', trail: [['especialidades/', 'Tratamientos']], body });
}

// ---------------- recomendações ----------------
function recPage(r) {
  const p = r.path, R = prefix(p);
  const tr = treatments.find(t => (TREAT_RECS[t.slug] || []).includes(r.slug) && t.slug === r.parent) || treatments.find(t => (TREAT_RECS[t.slug] || []).includes(r.slug));
  const body = `
<article class="wrap narrow prose rec">
  <h1>Recomendaciones: ${esc(r.name.charAt(0).toLowerCase() + r.name.slice(1))}</h1>
  <aside class="callout"><p>Estas pautas son generales. Sigue siempre las indicaciones que te haya dado tu profesional en consulta y, ante cualquier duda o síntoma que no esperabas, llámanos al <a href="tel:${site.phone}">${site.phoneDisplay}</a>.</p></aside>
  ${r.sections.map((s, i) => `${s.title ? `<h2>${esc(s.title)}</h2>` : ''}${renderItems(R, s.items)}`).join('\n')}
  <p class="back-links"><a href="${R}recomendaciones/">Todas las recomendaciones</a>${tr ? ` · <a href="${R}${tr.slug}/">${esc(tr.name)}</a>` : ''}</p>
</article>`;
  return page({ p, title: `Recomendaciones: ${r.name} · Clínica Dental Airam`, desc: `Pautas de Clínica Dental Airam para pacientes: ${r.name.toLowerCase()}.`, current: 'recomendaciones/', trail: [['recomendaciones/', 'Recomendaciones'], [p.replace(/^\//, ''), r.name]], body, topic: tr ? topicOf(tr) : '' });
}
function recIndex() {
  const p = '/recomendaciones/', R = prefix(p);
  const main = recs.filter(r => r.inMainList), extra = recs.filter(r => !r.inMainList);
  const li = r => `<li><a class="rec-card" href="${R}${r.path.replace(/^\//, '')}"><span>${esc(r.name)}</span><svg aria-hidden="true"><use href="#i-route"/></svg></a></li>`;
  const body = `
<header class="page-hero page-hero--plain wrap"><div class="page-hero-text"><h1>Recomendaciones para pacientes</h1>
<p class="motto">«Airam os recomienda diversas pautas para cada tratamiento»</p>
<p class="lead">Tras un tratamiento hay pautas que ayudan a que la recuperación sea buena y a evitar problemas por una rutina inadecuada o por falta de instrucciones. Nuestros especialistas han preparado estas recomendaciones para cada caso.</p></div></header>
<section class="wrap" aria-labelledby="r1"><h2 id="r1" class="sec-title">Por tratamiento</h2><ul class="rec-grid">${main.map(li).join('')}</ul></section>
<section class="wrap" aria-labelledby="r2"><h2 id="r2" class="sec-title">También disponible</h2><ul class="rec-grid">${extra.map(li).join('')}</ul></section>
<section class="wrap narrow"><aside class="callout"><p>Son pautas generales y no sustituyen las indicaciones personalizadas de tu profesional. Si tienes dolor intenso, fiebre, sangrado que no cede o cualquier síntoma que te preocupe, contacta con la clínica.</p></aside></section>`;
  return page({ p, title: 'Recomendaciones después del tratamiento · Clínica Dental Airam', desc: 'Pautas de Clínica Dental Airam tras extracciones, cirugía de implantes, endodoncia, tratamiento periodontal, férula de descarga, flúor, ortodoncia, retención y blanqueamiento.', current: 'recomendaciones/', trail: [['recomendaciones/', 'Recomendaciones']], body });
}

// ---------------- equipe, instalações, contato ----------------
function teamCards(R, list) {
  return list.map(m => `<article class="member" id="${m.id}">${img(R, m.img, m.name, { cls: 'member-img' })}<div><h3>${esc(m.name)}</h3><p class="role">${esc(m.role)}</p><p>${esc(m.bio)}</p>${m.quote ? `<blockquote><p>«${esc(m.quote)}»</p></blockquote>` : ''}</div></article>`).join('\n');
}
function teamPage() {
  const p = '/equipo/', R = prefix(p);
  const body = `
<header class="page-hero page-hero--plain wrap"><div class="page-hero-text"><h1>Equipo</h1><p class="motto">«Profesionales de confianza»</p>${team.intro.map(t => `<p class="lead">${esc(t)}</p>`).join('')}</div></header>
<figure class="wrap team-photo">${img(R, 'sortistudio-airam-equipo-diciembre-2024-1.jpg', 'Equipo de Clínica Dental Airam', { lazy: false })}</figure>
<section class="wrap" aria-labelledby="m1"><h2 id="m1" class="sec-title">Área clínica</h2><div class="members">${teamCards(R, team.members.filter(m => m.group === 'clinico'))}</div></section>
<section class="wrap" aria-labelledby="m2"><h2 id="m2" class="sec-title">Higiene, coordinación y atención al paciente</h2><div class="members">${teamCards(R, team.members.filter(m => m.group === 'equipo'))}</div></section>
<section class="wrap" aria-labelledby="v1"><h2 id="v1" class="sec-title">Cómo trabajamos</h2><div class="values">${team.values.map(v => `<article class="value">${img(R, v.img, v.alt)}<h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></article>`).join('')}</div></section>`;
  return page({ p, title: 'Equipo · Clínica Dental Airam, Boadilla del Monte', desc: 'Conoce al equipo de Clínica Dental Airam: odontólogas, ortodoncistas, odontopediatras, anestesista, higienista y equipo de atención al paciente.', current: 'equipo/', trail: [['equipo/', 'Equipo']], body });
}
function facilitiesPage() {
  const p = '/instalaciones/', R = prefix(p);
  let k = 0;
  const groups = gallery.groups.map((g, gi) => `<section aria-labelledby="g${gi}"><h2 id="g${gi}" class="sec-title">${esc(g.title)}</h2><ul class="gallery">${g.items.map(it => `<li><button type="button" class="g-item" data-g="${k++}" aria-label="Ampliar foto: ${esc(it.caption)}">${img(R, it.img, it.alt)}</button><span class="g-cap">${esc(it.caption)}</span></li>`).join('')}</ul></section>`).join('\n');
  const all = gallery.groups.flatMap(g => g.items).map(it => ({ src: `${R}assets/img/${it.img}`, alt: it.alt, caption: it.caption }));
  const body = `
<header class="page-hero page-hero--plain wrap"><div class="page-hero-text"><h1>La clínica</h1><p class="motto">«Desde el año 2000 devolviendo sonrisas»</p>
<p class="lead">Somos una clínica dental que se distingue por su enfoque centrado en el paciente. En nuestra clínica de Boadilla del Monte encontrarás el confort y el buen gusto que todos necesitamos para sentirnos como en casa a la hora de visitar al dentista.</p></div></header>
<div class="wrap narrow prose">
<p>Disponemos de un espacio cómodo y privado diseñado para tu tranquilidad. La zona de recepción y espera está alejada de las consultas para garantizar intimidad y atención personalizada desde la entrada. Además, tenemos despachos tranquilos para asesorarte y preparar tu plan de tratamiento con total confidencialidad.</p>
<p>En el área clínica contamos con un gabinete infantil, un espacio adaptado y amigable para los más pequeños. Además del gabinete de odontología general y estética dental, para ofrecer todas las especialidades tenemos el quirófano o gabinete de cirugía y sedación.</p>
<p>Disponemos de sala de RX con panorámico, CBCT 3D y telerradiografía para el diagnóstico, y de escáner intraoral para el diseño de sonrisa digital y la cirugía guiada.</p>
</div>
<div class="wrap">${groups}</div>
<p class="wrap boca-line">Nuestra mejor publicidad: <strong>«tu boca a boca»</strong></p>
<dialog class="lightbox" aria-label="Galería de fotos"><figure><img alt=""><figcaption></figcaption></figure>
<button type="button" class="lb-prev" aria-label="Foto anterior">‹</button><button type="button" class="lb-next" aria-label="Foto siguiente">›</button><button type="button" class="lb-close" aria-label="Cerrar galería">×</button></dialog>
<script type="application/json" id="gallery-data">${JSON.stringify(all)}</script>`;
  return page({ p, title: 'Instalaciones · Clínica Dental Airam, Boadilla del Monte', desc: 'Recepción, sala de espera, gabinete infantil, quirófano, CBCT 3D y escáner intraoral en Clínica Dental Airam, Boadilla del Monte.', current: 'instalaciones/', trail: [['instalaciones/', 'La clínica']], body });
}
const hoursTable = () => `<table class="hours"><caption>Horario habitual</caption><tbody>${site.hours.map(h => `<tr data-d="${h.days.join(' ')}"${h.closed ? ' class="closed"' : ''}><th scope="row">${esc(h.label)}</th><td>${h.closed ? 'Cerrado' : `${h.open} – ${h.close}`}</td></tr>`).join('')}</tbody></table>`;
function contactPage() {
  const p = '/contacto/', R = prefix(p);
  const body = `
<header class="page-hero page-hero--plain wrap"><div class="page-hero-text"><h1>Contacto</h1><p class="motto">«Siempre a tu disposición»</p>
<p class="lead">Para solicitar cita, escríbenos por WhatsApp o llámanos. Te responderemos para confirmar el día y la hora; la cita no queda reservada hasta que la confirmemos.</p></div></header>
<div class="wrap contact-grid">
  <section aria-labelledby="c1" id="pide-cita">
    <h2 id="c1" class="sec-title">Llama o escríbenos</h2>
    <ul class="c-list">
      <li><svg aria-hidden="true"><use href="#i-phone"/></svg><span>Teléfono<br><a href="tel:${site.phone}">${site.phoneDisplay}</a></span></li>
      <li><svg aria-hidden="true"><use href="#i-wa"/></svg><span>WhatsApp<br><a href="${waLink()}" target="_blank" rel="noopener">${site.phoneDisplay}</a></span></li>
      <li><svg aria-hidden="true"><use href="#i-mail"/></svg><span>Correo electrónico<br><a href="mailto:${site.email}">${site.email}</a></span></li>
      <li><svg aria-hidden="true"><use href="#i-pin"/></svg><span>Dirección<br>${esc(site.address.street)}, ${site.address.postalCode} ${esc(site.address.city)} (Madrid)</span></li>
    </ul>
    <p class="status" data-status><b>Horario</b><span>Consulta el horario habitual.</span></p>
    ${hoursTable()}
  </section>
  <section aria-labelledby="c2">
    <h2 id="c2" class="sec-title">Cómo llegar</h2>
    <div class="map" data-src="https://maps.google.com/maps?q=${encodeURIComponent(site.mapsQuery)}&z=16&output=embed">
      <div class="map-ph"><p class="map-addr">${esc(site.address.street)}<br>${esc(site.address.city)}</p>
      <button type="button" class="btn btn-primary" data-load-map><svg aria-hidden="true"><use href="#i-pin"/></svg>Cargar mapa</button>
      <p class="map-note">Al cargar el mapa, Google puede instalar cookies y recibir tu dirección IP. <a href="${R}politica-de-cookies/">Más información</a></p></div>
    </div>
    <p><a class="btn btn-line" href="https://www.google.com/maps/dir/?api=1&amp;destination=${encodeURIComponent(site.mapsQuery)}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-route"/></svg>Abrir la ruta en Google Maps</a></p>
  </section>
</div>`;
  return page({ p, title: 'Contacto y horario · Clínica Dental Airam, Boadilla del Monte', desc: `Teléfono ${site.phoneDisplay}, WhatsApp y correo de Clínica Dental Airam. ${site.address.street}, ${site.address.city}. Horario y cómo llegar.`, current: 'contacto/', trail: [['contacto/', 'Contacto']], body, noCta: true });
}

// ---------------- blog ----------------
const PER = 10;
const postCard = (R, x) => `<article class="post-card">${x.image ? `<a href="${R}${x.path.replace(/^\//, '')}" tabindex="-1" aria-hidden="true">${img(R, x.image.src, '')}</a>` : ''}<div><p class="meta"><time datetime="${x.date.slice(0, 10)}">${fmtDate(x.date)}</time></p><h2><a href="${R}${x.path.replace(/^\//, '')}">${esc(x.title)}</a></h2><p>${esc(x.excerpt.slice(0, 220))}${x.excerpt.length > 220 ? '…' : ''}</p></div></article>`;
function pager(R, base, n, cur) {
  if (n < 2) return '';
  const href = i => `${R}${base}${i > 1 ? `page/${i}/` : ''}`;
  return `<nav class="pager" aria-label="Paginación"><ul>${cur > 1 ? `<li><a href="${href(cur - 1)}" rel="prev">Anterior</a></li>` : ''}${Array.from({ length: n }, (_, i) => i + 1).map(i => `<li>${i === cur ? `<span aria-current="page">${i}</span>` : `<a href="${href(i)}">${i}</a>`}</li>`).join('')}${cur < n ? `<li><a href="${href(cur + 1)}" rel="next">Siguiente</a></li>` : ''}</ul></nav>`;
}
function archive(base, list, { h1, lead, crumbsTrail, titleBase, desc }) {
  const n = Math.ceil(list.length / PER);
  for (let i = 1; i <= n; i++) {
    const p = `/${base}${i > 1 ? `page/${i}/` : ''}`, R = prefix(p);
    const body = `<header class="page-hero page-hero--plain wrap"><div class="page-hero-text"><h1>${esc(h1)}${i > 1 ? ` <span class="pg">(página ${i} de ${n})</span>` : ''}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div></header>
<div class="wrap blog-list">${list.slice((i - 1) * PER, i * PER).map(x => postCard(R, x)).join('\n')}</div>
<div class="wrap">${pager(R, base, n, i)}</div>`;
    write(p, page({ p, title: `${titleBase}${i > 1 ? ` · página ${i}` : ''} · Clínica Dental Airam`, desc, current: 'noticias/', trail: crumbsTrail, body }));
  }
  return n;
}
// Links antigos dentro dos posts: domínio atual, domínio de desenvolvimento e domínio antigo -> páginas novas.
const LEGACY_HOSTS = /^(?:www\.)?(?:airamdental\.com|dev31\.especialistasweb\.es|clinicadentalsmileboadilla\.com)$/;
const KEYWORDS = [['periodon', 'periodoncia'], ['estetic', 'estetica-dental'], ['carilla', 'estetica-dental'], ['cirug', 'cirugia-dental'], ['implant', 'implantologia'], ['protes', 'protesis'],
  ['odontoped', 'odontopediatria'], ['infantil', 'odontopediatria'], ['ortodon', 'ortodoncia'], ['invisalign', 'ortodoncia'], ['endodon', 'endodoncia'], ['blanque', 'blanqueamiento-dental'], ['restaur', 'restauradora'],
  ['sedac', 'sedacion-consciente'], ['contact', 'contacto'], ['equipo', 'equipo'], ['instalacion', 'instalaciones'], ['clinica', 'instalaciones']];
const legacyLinks = []; // {post, from, to}
let known = null;
function resolveLegacy(pth, post) {
  pth = pth.replace(/\/?$/, '/');
  if (known.has(pth)) return pth;
  const k = KEYWORDS.find(([w]) => pth.toLowerCase().includes(w));
  const to = k ? `/${k[1]}/` : null;
  legacyLinks.push({ post, from: pth, to: to || '(enlace retirado, se conserva el texto)' });
  if (to && !redirects.some(r => r.from === pth) && !known.has(pth)) redirects.push({ from: pth, to, legacy: true });
  return to;
}
function fixPostHtml(html, R, post) {
  const $ = cheerio.load(`<div id="x">${html}</div>`, null, false);
  const c = $('#x');
  c.find('a[href]').each((_, a) => {
    const $a = $(a); let h = $a.attr('href');
    if (h === '#URL-PENDIENTE' || /^#?URL-PENDIENTE/i.test(h)) { legacyLinks.push({ post, from: h, to: '(marcador sin destino en el original, enlace retirado)' }); $a.replaceWith($a.html()); return; }
    // WhatsApp: qualquer número dentro dos posts passa ao canal confirmado da clínica (o original fica registrado)
    const wa = h.match(/^https?:\/\/(?:api\.whatsapp\.com\/send\/?\?phone=|wa\.me\/)(\d+)/);
    if (wa) { if (!/916334636$/.test(wa[1])) legacyLinks.push({ post, from: h, to: 'WhatsApp confirmado de la clínica (número original distinto, pendiente de verificar)' }); $a.attr('href', waLink()); return; }
    let pth = null, hash = '';
    if (h.startsWith('{{ROOT}}')) { const r = h.slice(8).split('#'); pth = '/' + r[0].split('?')[0]; hash = r[1] ? '#' + r[1] : ''; }
    else if (/^https?:/.test(h)) { const u = new URL(h); if (LEGACY_HOSTS.test(u.host)) { if (u.pathname.startsWith('/wp-content/')) { $a.attr('href', 'https://airamdental.com' + u.pathname); return; } pth = u.pathname; hash = u.hash; } }
    if (pth === null) return;
    const to = resolveLegacy(pth, post);
    if (!to) { $a.replaceWith($a.html()); return; }
    $a.attr('href', R + to.replace(/^\//, '') + hash);
    $a.removeAttr('target'); $a.removeAttr('rel');
  });
  // títulos: o mais alto do post passa a h2 (o h1 é o título da página), sem saltos
  const levels = c.find('h1,h2,h3,h4,h5,h6').map((_, e) => +e.tagName[1]).get();
  if (levels.length) {
    const used = [...new Set(levels)].sort();
    const map = Object.fromEntries(used.map((l, i) => [l, Math.min(6, 2 + i)]));
    let prev = 1; // sequencial: nunca salta mais de um nível em relação ao título anterior
    c.find('h1,h2,h3,h4,h5,h6').each((_, e) => { const l = Math.min(map[+e.tagName[1]], prev + 1); e.tagName = 'h' + l; prev = l; });
  }
  return c.html();
}

function postPage(x, idx) {
  const p = x.path, R = prefix(p);
  const prev = blog.posts[idx + 1], next = blog.posts[idx - 1];
  const tagMap = Object.fromEntries(blog.tags.map(t => [t.slug, t.name]));
  const html = fixPostHtml(x.html.replace(/\{\{IMG\}\}/g, `${R}assets/img/`), R, x.path);
  const body = `
<article class="wrap narrow prose post">
  <h1>${esc(x.title)}</h1>
  <p class="meta">Publicado el <time datetime="${x.date.slice(0, 10)}">${fmtDate(x.date)}</time>${x.modified.slice(0, 10) !== x.date.slice(0, 10) ? ` · Actualizado el <time datetime="${x.modified.slice(0, 10)}">${fmtDate(x.modified)}</time>` : ''}</p>
  ${x.image ? `<figure class="post-img">${img(R, x.image.src, x.image.alt, { lazy: false })}</figure>` : ''}
  ${html}
  ${x.tags.length ? `<p class="tags"><span class="sr-only">Etiquetas: </span>${x.tags.map(t => `<a href="${R}noticias/tag/${t}/">${esc(tagMap[t] || t)}</a>`).join('')}</p>` : ''}
  <nav class="post-nav" aria-label="Más artículos">${prev ? `<a href="${R}${prev.path.replace(/^\//, '')}" rel="prev"><small>Anterior</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="${R}${next.path.replace(/^\//, '')}" rel="next"><small>Siguiente</small>${esc(next.title)}</a>` : ''}</nav>
</article>`;
  return page({ p, title: x.metaTitle || `${x.title} · Blog de Clínica Dental Airam`, desc: x.metaDesc || x.excerpt.slice(0, 155), current: 'noticias/', type: 'article', image: x.image?.src,
    trail: [['noticias/', 'Blog'], [p.replace(/^\//, ''), x.title]], body,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: x.title, datePublished: x.date, dateModified: x.modified, inLanguage: 'es-ES', mainEntityOfPage: BASE + p, ...(x.image ? { image: `${BASE}/assets/img/${x.image.src}` } : {}), publisher: { '@type': 'Organization', name: 'Clínica Dental Airam' } }] });
}

// ---------------- landings, redireções, 404 ----------------
function landingPage(l) {
  const p = l.path, R = prefix(p);
  const body = `<article class="wrap narrow prose"><h1>${esc(l.h1)}</h1>${l.sections.map(s => `${s.title ? `<h2>${esc(s.title)}</h2>` : ''}${renderItems(R, s.items, s.title ? 'h3' : 'h2')}`).join('\n')}</article>`;
  return page({ p, title: l.metaTitle || `${l.h1} · Clínica Dental Airam`, desc: l.metaDesc || l.h1, current: 'especialidades/', trail: [[p.replace(/^\//, ''), l.h1]], body });
}
function redirectPage(from, to) {
  redirects.push({ from, to });
  const R = prefix(from);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Página trasladada · Clínica Dental Airam</title><meta http-equiv="refresh" content="0; url=${R}${to.replace(/^\//, '')}">${MODE === 'prod' ? `<link rel="canonical" href="${BASE}${to}">` : ''}</head><body><p>Esta página se ha trasladado. <a href="${R}${to.replace(/^\//, '')}">Continuar</a>.</p></body></html>`;
}

// ---------------- index ----------------
function buildIndex() {
  let h = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const R = '';
  const headExtra = MODE === 'demo' ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${BASE}/">`;
  const og = `<meta property="og:type" content="website"><meta property="og:site_name" content="Clínica Dental Airam"><meta property="og:locale" content="es_ES"><meta property="og:title" content="Clínica Dental Airam · Tu dentista en Boadilla del Monte"><meta property="og:description" content="Desde el año 2000 devolviendo sonrisas. Especialidades para niños y adultos y sedación consciente en Boadilla del Monte."><meta property="og:url" content="${BASE}/"><meta property="og:image" content="${BASE}/assets/img/sortistudio-airam-equipo-diciembre-2024-1.jpg"><meta name="twitter:card" content="summary_large_image">`;
  h = h.replace('<!--@head-->', `${headExtra}\n${og}`).replace('<!--@banner-->', banner)
    .replace('<!--@team-->', `<div class="docs">${team.members.filter(m => m.group === 'clinico').map(m => `<article class="doc rv"><a class="doc-link" href="equipo/#${m.id}">${img(R, m.img, m.name)}<h3>${esc(m.name)}</h3></a><p class="role">${esc(m.role)}</p><p class="bio">${esc(m.bio)}</p></article>`).join('')}</div>
      <div class="staff rv">${team.members.filter(m => m.group === 'equipo').map(m => `<article class="p">${img(R, m.img, '')}<div><h3><a href="equipo/#${m.id}">${esc(m.name)}</a></h3><span>${esc(m.role)}</span><p>${esc(m.bio)}</p></div></article>`).join('')}</div>`)
    .replace('<!--@hours-->', `<script>window.AIRAM=${JSON.stringify({ hours: site.hours, exceptions: site.hoursExceptions })};</script>`)
    .replace(/<!--@years-->\d*/g, String(YEARS))
    .replace(/(src|href|data-img)="(img|fonts)\//g, (m, a, b) => `${a}="assets/${b}/`);
  // dimensões das imagens locais da home (evita CLS)
  h = h.replace(/<img ([^>]*?)src="assets\/img\/([^"]+)"([^>]*)>/g, (m, a, rel, b) => /\bwidth=/.test(m) || !dims[rel] ? m : `<img ${a}src="assets/img/${rel}" width="${dims[rel][0]}" height="${dims[rel][1]}"${b}>`);
  pages.push({ path: '/', title: 'Inicio' });
  write('/', h);
}

// ---------------- execução ----------------
await processImages();
fs.mkdirSync(path.join(OUT, 'assets/css'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'assets/js'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'assets/fonts'), { recursive: true });
fs.copyFileSync(path.join(SRC, 'css/site.css'), path.join(OUT, 'assets/css/site.css'));
fs.copyFileSync(path.join(SRC, 'js/site.js'), path.join(OUT, 'assets/js/site.js'));
for (const f of fs.readdirSync(path.join(SRC, 'fonts'))) fs.copyFileSync(path.join(SRC, 'fonts', f), path.join(OUT, 'assets/fonts', f));

// todas as rotas que serão geradas (para resolver links antigos dentro dos posts)
known = new Set(['/', '/especialidades/', '/recomendaciones/', '/equipo/', '/instalaciones/', '/contacto/', '/noticias/', '/aviso-legal/', '/politicadeprivacidad/', '/politica-de-cookies/',
  ...treatments.map(t => `/${t.slug}/`), ...recs.map(r => r.path), ...landings.map(l => l.path), ...blog.posts.map(x => x.path),
  ...blog.tags.map(t => `/noticias/tag/${t.slug}/`), ...Array.from({ length: Math.ceil(blog.posts.length / PER) }, (_, i) => `/noticias/page/${i + 1}/`)]);

buildIndex();
write('/especialidades/', specialtiesPage());
for (const t of treatments) write(`/${t.slug}/`, treatmentPage(t));
write('/recomendaciones/', recIndex());
for (const r of recs) write(r.path, recPage(r));
write('/equipo/', teamPage());
write('/instalaciones/', facilitiesPage());
write('/contacto/', contactPage());
for (const l of landings) write(l.path, landingPage(l));
const nArch = archive('noticias/', blog.posts, { h1: 'Blog', lead: 'Artículos de Clínica Dental Airam sobre salud bucodental, prevención y tratamientos, publicados desde 2017.', crumbsTrail: [['noticias/', 'Blog']], titleBase: 'Blog', desc: 'Blog de Clínica Dental Airam: consejos de salud bucodental, prevención y tratamientos.' });
blog.posts.forEach((x, i) => write(x.path, postPage(x, i)));
for (const t of blog.tags) {
  const list = blog.posts.filter(x => x.tags.includes(t.slug)); if (!list.length) continue;
  archive(`noticias/tag/${t.slug}/`, list, { h1: `Etiqueta: ${t.name}`, crumbsTrail: [['noticias/', 'Blog'], [`noticias/tag/${t.slug}/`, t.name]], titleBase: `${t.name} · Blog`, desc: `Artículos del blog de Clínica Dental Airam sobre ${t.name}.` });
}
for (const lp of legalPages({ site, MODE, waLink, esc })) write(lp.path, page({ ...lp, p: lp.path, current: '', trail: [[lp.path.replace(/^\//, ''), lp.h1]], body: lp.body, noCta: true }));
// páginas antigas sem equivalente próprio -> destino mais próximo (301 em produção)
const RED = [['/la-clinica/', '/instalaciones/'], ['/inicio/', '/'], ['/noticias/category/blog/', '/noticias/'], ['/noticias/autora/maria-de-luis-marcos/', '/noticias/'],
  ['/noticias/author/clinica/', '/noticias/'], ['/noticias/author/especialistasweb/', '/noticias/'], ['/feed/', '/noticias/'], ['/noticias/feed/', '/noticias/']];
for (const [a, b] of RED) write(a, redirectPage(a, b));
// rotas antigas encontradas dentro dos posts (ex.: /especialidades/estetica/) -> página equivalente
for (const r of redirects.filter(r => r.legacy)) { redirects.splice(redirects.indexOf(r), 1); write(r.from, redirectPage(r.from, r.to)); }
fs.writeFileSync(path.join(ROOT, 'migration/enlaces-legados-en-posts.json'), JSON.stringify(legacyLinks, null, 1));
write('/404.html', page({ p: '/404.html', title: 'Página no encontrada · Clínica Dental Airam', desc: 'La página que buscas no existe.', current: '', body: `<div class="wrap narrow prose"><h1>No encontramos esta página</h1><p>Puede que la dirección haya cambiado. Prueba con el <a href="./">inicio</a>, los <a href="especialidades/">tratamientos</a> o el <a href="noticias/">blog</a>.</p></div>`, noCta: true }));
pages.pop(); // 404 fora do sitemap

if (MODE === 'prod') {
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(x => !x.path.endsWith('.html')).map(x => `<url><loc>${BASE}${x.path}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, '.htaccess'), `# Clínica Dental Airam — generado por tools/build.mjs\nErrorDocument 404 /404.html\nDirectoryIndex index.html\n\n# Redirecciones 301 de URL antiguas sin equivalente directo\n${redirects.map(r => `Redirect 301 ${r.from} ${BASE}${r.to}`).join('\n')}\n\n# Forzar HTTPS y dominio sin www\nRewriteEngine On\nRewriteCond %{HTTPS} off [OR]\nRewriteCond %{HTTP_HOST} ^www\\. [NC]\nRewriteRule ^ https://airamdental.com%{REQUEST_URI} [L,R=301]\n`);
} else {
  fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}

// mapa de URL antiga -> destino
const sm = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/wp-export/sitemap-urls.json'), 'utf8')).urls;
const extraOld = ['https://airamdental.com/la-clinica/', ...Array.from({ length: nArch - 1 }, (_, i) => `https://airamdental.com/noticias/page/${i + 2}/`)];
const rows = [...new Set([...sm, ...extraOld])].map(u => {
  const pth = new URL(u).pathname; const r = redirects.find(x => x.from === pth);
  const exists = fs.existsSync(path.join(OUT, pth, 'index.html'));
  return [u, r ? r.to : (exists ? pth : ''), r ? '301' : (exists ? '200 (misma ruta)' : 'SIN DESTINO')];
});
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/mapa-urls.csv'), 'url_actual;destino_nuevo;estado\n' + rows.map(r => r.join(';')).join('\n') + '\n');
console.log(JSON.stringify({ mode: MODE, pages: pages.length, redirects: redirects.length, images: Object.keys(dims).length,
  urlMap: { total: rows.length, same: rows.filter(r => r[2].startsWith('200')).length, r301: rows.filter(r => r[2] === '301').length, missing: rows.filter(r => r[2] === 'SIN DESTINO').map(r => r[0]) },
  overrides: applied.filter(a => !a.ok) }, null, 1));
