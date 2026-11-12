// Extrai o sprite de ícones (logotipo Airam + ícones) do index para src/partials/icons.svg, usado pelas subpáginas.
import fs from 'node:fs';
const idx = fs.readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const m = idx.match(/<svg width="0" height="0"[\s\S]*?<\/defs>\s*<\/svg>/);
if (!m) throw new Error('sprite no encontrado');
fs.mkdirSync(new URL('../src/partials/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../src/partials/icons.svg', import.meta.url), m[0].replace('<svg width="0" height="0"', '<svg class="sprite" width="0" height="0"'));
console.log('icons.svg', m[0].length, 'bytes,', (m[0].match(/<symbol/g) || []).length, 'símbolos');
