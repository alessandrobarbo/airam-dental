// Testes em navegador real (Edge/Chrome headless): larguras 360/390/768/1280/1440, rolagem horizontal,
// alvos de toque, menu móvel, teclado (skip link, foco visível), acordeão, galeria, mapa sob demanda,
// cookies/armazenamento/terceiros antes e depois do clique, contraste e regras WCAG via axe-core.
// Uso: node tools/test-browser.mjs <baseURL> [saida.json]
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const BASE = (process.argv[2] || 'http://localhost:5179').replace(/\/$/, '');
const OUTF = process.argv[3] || 'docs/resultados-pruebas-navegador.json';
const EXE = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const AXE = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const PAGES = ['/', '/implantologia/', '/sedacion-consciente/', '/especialidades/', '/recomendaciones/', '/cirugia-dental/recomendaciones-tras-una-extraccion-dental/',
  '/equipo/', '/instalaciones/', '/contacto/', '/noticias/', '/noticias/page/10/', '/politicadeprivacidad/'];
const WIDTHS = [360, 390, 768, 1280, 1440];
const browser = await puppeteer.launch({ executablePath: EXE, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
const res = { base: BASE, date: new Date().toISOString(), browser: await browser.version(), widths: {}, axe: {}, behaviour: {} };

async function open(url, w, mobile) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: mobile ? 800 : 900, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  return page;
}

for (const w of WIDTHS) {
  const mobile = w < 768;
  res.widths[w] = [];
  for (const p of PAGES) {
    const page = await open(BASE + p, w, mobile);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = [...document.querySelectorAll('body *')].filter(e => {
        if (e.closest('.docs,.band,.table-wrap,.sprite,svg,dialog,.esp-visual,.petal-frame')) return false;
        if (getComputedStyle(e).visibility === 'hidden' || e.closest('[hidden]')) return false;
        const b = e.getBoundingClientRect(); return b.width && b.right > vw + 1;
      }).slice(0, 5).map(e => e.tagName + '.' + (e.className.baseVal ?? e.className));
      // alvos de toque visíveis < 24px (WCAG 2.5.8 AA) — ignora links dentro de texto corrido
      const small = [...document.querySelectorAll('a,button')].filter(e => {
        const b = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        if (!b.width || cs.visibility === 'hidden' || e.closest('p,li,dd,td,.prose,figcaption,blockquote,.crumbs,.legal-id,.sprite')) return false;
        return b.width < 24 || b.height < 24;
      }).slice(0, 5).map(e => (e.textContent.trim() || e.getAttribute('aria-label') || e.className).slice(0, 30));
      return { innerWidth: window.innerWidth, clientWidth: vw, scrollWidth: document.documentElement.scrollWidth, overflow: over, smallTargets: small,
        h1: document.querySelectorAll('h1').length, menuButtonVisible: !!document.querySelector('.menu-btn') && getComputedStyle(document.querySelector('.menu-btn')).display !== 'none' };
    });
    res.widths[w].push({ page: p, ...r, hScroll: r.scrollWidth > r.clientWidth });
    if (w === 390 || w === 1280) {
      await new Promise(r => setTimeout(r, 2500)); // deixa terminar as animações de entrada antes de medir contraste
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); window.scrollTo(0, 0); });
      await new Promise(r => setTimeout(r, 1200));
      await page.addScriptTag({ content: AXE });
      const a = await page.evaluate(async () => { const o = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }); return o.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 2).map(x => x.target.join(' ')) })); });
      res.axe[`${w}${p}`] = a;
    }
    await page.close();
  }
}

// comportamento
{
  const b = res.behaviour;
  // 1) cookies, armazenamento e terceiros antes/depois de carregar o mapa
  const page = await open(BASE + '/contacto/', 1280, false);
  const reqs = []; page.on('request', r => reqs.push(new URL(r.url()).host));
  await page.reload({ waitUntil: 'networkidle0' });
  const host = new URL(BASE).host;
  const before = { thirdParty: [...new Set(reqs.filter(h => h !== host))], cookies: (await page.cookies()).map(c => c.name), storage: await page.evaluate(() => [localStorage.length, sessionStorage.length]), iframes: await page.$$eval('iframe', x => x.length) };
  reqs.length = 0;
  await page.click('[data-load-map]'); await new Promise(r => setTimeout(r, 4000));
  const cdp = await page.target().createCDPSession(); const all = await cdp.send('Network.getAllCookies');
  b.mapa = { before, after: { thirdParty: [...new Set(reqs.filter(h => h !== host))], iframes: await page.$$eval('iframe', x => x.length), allCookiesInBrowser: all.cookies.map(c => `${c.domain}:${c.name}`) } };
  // 2) estado do horário
  b.horario = await page.$eval('[data-status]', e => e.innerText.replace(/\n/g, ' | '));
  await page.close();
  // 3) teclado: skip link e foco visível
  const k = await open(BASE + '/implantologia/', 1280, false);
  await k.keyboard.press('Tab');
  b.skipLink = await k.evaluate(() => ({ text: document.activeElement.textContent.trim(), visible: document.activeElement.getBoundingClientRect().top >= 0 }));
  await k.keyboard.press('Enter');
  b.skipTarget = await k.evaluate(() => location.hash);
  const outlines = [];
  for (let i = 0; i < 6; i++) { await k.keyboard.press('Tab'); outlines.push(await k.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); return `${e.tagName}:${cs.outlineStyle}/${cs.outlineWidth}`; })); }
  b.focusOutlines = outlines;
  await k.close();
  // 4) menu móvel
  const m = await open(BASE + '/equipo/', 390, true);
  await m.click('.menu-btn');
  b.menuMovil = await m.evaluate(() => ({ expanded: document.querySelector('.menu-btn').getAttribute('aria-expanded'), visible: !document.getElementById('mnav').hidden, focus: document.activeElement.textContent.trim() }));
  await m.keyboard.press('Escape');
  b.menuMovilEsc = await m.evaluate(() => ({ expanded: document.querySelector('.menu-btn').getAttribute('aria-expanded'), focusOnButton: document.activeElement.classList.contains('menu-btn') }));
  await m.close();
  // 5) galeria acessível
  const g = await open(BASE + '/instalaciones/', 1280, false);
  await g.focus('.g-item'); await g.keyboard.press('Enter'); await new Promise(r => setTimeout(r, 300));
  const o1 = await g.evaluate(() => ({ open: document.querySelector('.lightbox').open, caption: document.querySelector('.lightbox figcaption').textContent }));
  await g.keyboard.press('ArrowRight');
  const o2 = await g.evaluate(() => document.querySelector('.lightbox figcaption').textContent);
  await g.keyboard.press('Escape'); await new Promise(r => setTimeout(r, 200));
  b.galeria = { ...o1, afterArrow: o2, closedWithEsc: await g.evaluate(() => !document.querySelector('.lightbox').open), focusReturned: await g.evaluate(() => document.activeElement.classList.contains('g-item')) };
  await g.close();
  // 6) home: acordeão, pausa de animação, contadores estáticos, reduced motion
  const h = await open(BASE + '/', 1280, false);
  b.home = await h.evaluate(() => ({
    counters: [...document.querySelectorAll('[data-count]')].map(e => e.textContent),
    accordionOpen: [...document.querySelectorAll('#esp-list details')].filter(d => d.open).length,
    moreLinks: document.querySelectorAll('.esp-body .more').length,
    teamMembers: document.querySelectorAll('#equipo .doc, #equipo .staff .p').length,
    status: document.getElementById('status').innerText.replace(/\n/g, ' | ')
  }));
  await h.click('#esp-list details:nth-of-type(2) summary');
  b.home.accordionAfterClick = await h.evaluate(() => [...document.querySelectorAll('#esp-list details')].map((d, i) => d.open ? i : null).filter(x => x !== null));
  await h.focus('[data-motion-toggle]'); await h.keyboard.press('Enter');
  b.home.pause = await h.evaluate(() => ({ pressed: document.querySelector('[data-motion-toggle]').getAttribute('aria-pressed'), cls: document.documentElement.classList.contains('motion-paused'), band: getComputedStyle(document.querySelector('.band-track')).animationPlayState }));
  await h.close();
  const rm = await browser.newPage(); await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await rm.setViewport({ width: 1280, height: 900 });
  await rm.goto(BASE + '/', { waitUntil: 'networkidle0' });
  b.reducedMotion = await rm.evaluate(() => ({ jsClass: document.documentElement.classList.contains('js'), hiddenContent: [...document.querySelectorAll('.rv,.fu')].filter(e => !e.matches('.manifesto .mark') && getComputedStyle(e).opacity !== '1').length, bandAnim: getComputedStyle(document.querySelector('.band-track')).animationName, toggleShown: getComputedStyle(document.querySelector('[data-motion-toggle]')).display }));
  await rm.close();
}
await browser.close();
fs.writeFileSync(OUTF, JSON.stringify(res, null, 1));
// resumo
const sum = {};
for (const w of WIDTHS) sum[w] = { innerWidth: [...new Set(res.widths[w].map(x => x.innerWidth))], hScroll: res.widths[w].filter(x => x.hScroll).map(x => x.page), overflow: res.widths[w].filter(x => x.overflow.length).map(x => x.page + ' ' + x.overflow[0]), smallTargets: res.widths[w].filter(x => x.smallTargets.length).map(x => x.page + ' ' + x.smallTargets.join('|')), menuBtn: [...new Set(res.widths[w].map(x => x.menuButtonVisible))] };
const axeAll = {}; for (const [k, v] of Object.entries(res.axe)) for (const x of v) (axeAll[x.id] = axeAll[x.id] || []).push(`${k} (${x.impact}, ${x.n}) ${x.ex[0] || ''}`);
console.log(JSON.stringify({ browser: res.browser, sum, axe: axeAll, behaviour: res.behaviour }, null, 1));
