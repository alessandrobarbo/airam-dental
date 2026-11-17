// Verifica no site atual (airamdental.com) o que ele já faz, para o relatório de melhorias não afirmar nada sem prova.
import * as cheerio from 'cheerio';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' } };
const get = async u => (await fetch(u, UA)).text();
const out = {};
for (const [k, u] of Object.entries({ home: 'https://airamdental.com/', contacto: 'https://airamdental.com/contacto/', instalaciones: 'https://airamdental.com/instalaciones/', implantologia: 'https://airamdental.com/implantologia/' })) {
  const h = await get(u); const $ = cheerio.load(h);
  out[k] = {
    viewport: $('meta[name=viewport]').attr('content'),
    trackers: ['googletagmanager', 'gtag(', 'google-analytics', 'fbq(', 'facebook.net', 'hotjar', 'clarity.ms', 'cookiefirst', 'joinchat', 'recaptcha'].filter(t => h.includes(t)),
    googleFonts: /fonts\.googleapis|fonts\.gstatic/.test(h),
    iframes: $('iframe').map((_, e) => ($(e).attr('src') || $(e).attr('data-src') || '').slice(0, 60)).get(),
    mapIframeLazyConsent: $('iframe[src*="google.com/maps"], iframe[data-src*="google.com/maps"]').length,
    telLinks: [...new Set($('a[href^="tel:"]').map((_, e) => $(e).attr('href')).get())],
    waLinks: [...new Set($('a[href*="wa.me"], a[href*="whatsapp"]').map((_, e) => $(e).attr('href')).get())],
    navLinks: [...new Set($('header a, nav a, .uk-navbar a').map((_, e) => $(e).text().trim().replace(/\s+/g, ' ')).get().filter(Boolean))].slice(0, 40),
    lightbox: /uk-lightbox|data-uk-lightbox|lightbox/.test(h),
    openStatus: /abierto ahora|cerrado ahora|open now/i.test(h),
    scripts: $('script[src]').length,
    stylesheets: $('link[rel=stylesheet]').length,
    h1: $('h1').map((_, e) => $(e).text().trim().slice(0, 50)).get()
  };
}
console.log(JSON.stringify(out, null, 1));
