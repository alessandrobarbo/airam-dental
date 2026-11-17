// Verifica, em celulares emulados, se a foto do hero aparece na primeira tela (sem rolar) e salva capturas.
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] || 'http://localhost:5179/';
const OUT = process.argv[3] || 'docs';
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
for (const [w, h] of [[360, 740], [390, 844], [768, 1024]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(BASE, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1800));
  const r = await p.evaluate(() => {
    const f = document.querySelector('.hero-media .petal-frame').getBoundingClientRect();
    const h1 = document.querySelector('.hero h1').getBoundingClientRect();
    const bar = document.querySelector('.mbar'); const barTop = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight;
    return { vw: innerWidth, vh: innerHeight, photoTop: Math.round(f.top), photoBottom: Math.round(f.bottom), photoVisiblePct: Math.round(Math.max(0, Math.min(f.bottom, barTop) - Math.max(f.top, 0)) / f.height * 100), h1Top: Math.round(h1.top), banner: !!document.querySelector('.demo-banner'), hScroll: document.documentElement.scrollWidth > innerWidth };
  });
  console.log(w + 'x' + h, JSON.stringify(r));
  await p.screenshot({ path: `${OUT}/hero-${w}.png` });
  await p.close();
}
await b.close();
