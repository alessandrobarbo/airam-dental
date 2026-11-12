// Incorpora à subpágina de cirurgia de implantes a frase que só existia na página geral /recomendaciones/ (idempotente).
import fs from 'node:fs';
const F = new URL('../src/data/recommendations.json', import.meta.url);
const recs = JSON.parse(fs.readFileSync(F, 'utf8'));
const r = recs.find(x => x.slug === 'recomendaciones-tras-cirugia-de-implantes');
const S = 'Puede ocurrir dolor post-operatorio que suele ceder con el tratamiento.';
if (!JSON.stringify(r).includes(S)) {
  const last = r.sections[r.sections.length - 1];
  last.items.push({ type: 'p', text: S, origen: 'Página general /recomendaciones/ de airamdental.com' });
  fs.writeFileSync(F, JSON.stringify(recs, null, 1));
  console.log('añadida');
} else console.log('ya estaba');
