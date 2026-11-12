// Comparação de desempenho em laboratório (Lighthouse, perfil móvel padrão: Moto G Power, 4G lento simulado).
// Mesmas condições para os dois sites, N execuções por URL, mediana. São métricas de LABORATÓRIO:
// LCP, CLS, TBT (TBT não é INP; INP só existe com dados de campo/CrUX).
// Uso: node tools/perf.mjs [execuções]
import fs from 'node:fs';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
const RUNS = +(process.argv[2] || 3);
const WHICH = process.argv[3] || 'both'; // current | demo | both
const OUTFILE = process.argv[4] || 'docs/rendimiento-laboratorio.json';
const PAIRS = [
  ['Inicio', 'https://airamdental.com/', 'https://climbahia.com.br/demo-airam/'],
  ['Implantología', 'https://airamdental.com/implantologia/', 'https://climbahia.com.br/demo-airam/implantologia/'],
  ['Blog', 'https://airamdental.com/noticias/', 'https://climbahia.com.br/demo-airam/noticias/']
];
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', chromeFlags: ['--headless=new', '--no-first-run'] });
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const out = { date: new Date().toISOString(), runs: RUNS, profile: 'Lighthouse 12 mobile (simulated throttling)', results: [] };
for (const [name, ...pair] of PAIRS) {
  const urls = WHICH === 'current' ? [pair[0]] : WHICH === 'demo' ? [pair[1]] : pair;
  for (const url of urls) {
    const r = { name, url, score: [], lcp: [], cls: [], tbt: [], fcp: [], si: [], bytes: [], a11y: [], seo: [], bp: [] };
    for (let i = 0; i < RUNS; i++) {
      const res = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'] });
      const a = res.lhr.audits, c = res.lhr.categories;
      r.score.push(Math.round(c.performance.score * 100)); r.a11y.push(Math.round(c.accessibility.score * 100)); r.seo.push(Math.round(c.seo.score * 100)); r.bp.push(Math.round(c['best-practices'].score * 100));
      r.lcp.push(a['largest-contentful-paint'].numericValue); r.cls.push(a['cumulative-layout-shift'].numericValue); r.tbt.push(a['total-blocking-time'].numericValue);
      r.fcp.push(a['first-contentful-paint'].numericValue); r.si.push(a['speed-index'].numericValue); r.bytes.push(a['total-byte-weight'].numericValue);
    }
    const m = { name, url, performance: med(r.score), accessibility: med(r.a11y), seo: med(r.seo), bestPractices: med(r.bp),
      lcp_s: +(med(r.lcp) / 1000).toFixed(2), cls: +med(r.cls).toFixed(3), tbt_ms: Math.round(med(r.tbt)), fcp_s: +(med(r.fcp) / 1000).toFixed(2), si_s: +(med(r.si) / 1000).toFixed(2), kb: Math.round(med(r.bytes) / 1024),
      raw: { lcp: r.lcp.map(x => Math.round(x)), performance: r.score } };
    out.results.push(m); console.log(JSON.stringify(m));
  }
}
await chrome.kill();
fs.writeFileSync(OUTFILE, JSON.stringify(out, null, 1));
