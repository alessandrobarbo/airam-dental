// Localiza frases com promessas absolutas ou números sem fonte nos textos clínicos importados.
import fs from 'node:fs';
const T = JSON.parse(fs.readFileSync(new URL('../src/data/treatments.json', import.meta.url), 'utf8'));
const R = JSON.parse(fs.readFileSync(new URL('../src/data/recommendations.json', import.meta.url), 'utf8'));
const RX = /\b(definitiv\w*|garantiz\w*|sin dolor|no (?:genera|produce|duele|causa) dolor|indoloro|100\s?%|\d{2}\s?%|para siempre|de por vida|toda la vida|totalmente segur\w*|total seguridad|absolutamente|sin ningún riesgo|sin riesgo|no hay que preocuparse|perfect\w*|el mejor|la mejor|los mejores|las mejores|inmediat\w*|en una sola sesión|nunca|siempre)\b/i;
const out = [];
const walk = (src, name, sections) => sections.forEach(s => {
  const texts = [s.title || '', ...s.items.flatMap(i => i.type === 'ul' ? i.items : [i.text || ''])];
  for (const t of texts) for (const sent of t.split(/(?<=[.!?])\s+/)) { const m = sent.match(RX); if (m) out.push({ src, name, match: m[0], text: sent }); }
});
T.forEach(t => { if (RX.test(t.motto)) out.push({ src: t.slug, name: 'lema', match: t.motto.match(RX)[0], text: t.motto }); walk(t.slug, t.name, t.sections); });
R.forEach(r => walk(r.slug, r.name, r.sections));
fs.writeFileSync(new URL('../migration/claims-scan.json', import.meta.url), JSON.stringify(out, null, 1));
const by = {}; out.forEach(o => by[o.match.toLowerCase()] = (by[o.match.toLowerCase()] || 0) + 1);
console.log('total', out.length, JSON.stringify(by));
for (const o of out.filter(o => !/^(siempre|nunca|inmediat)/i.test(o.match))) console.log(`${o.src} | ${o.match} | ${o.text.slice(0, 150)}`);
