// Mostra blocos de uma página exportada a partir de um texto âncora. Uso: node tools/peek.mjs <slug> <regex-ancora> [n]
import fs from 'node:fs';
const pc = JSON.parse(fs.readFileSync(new URL('../migration/wp-export/pages-content.json', import.meta.url), 'utf8'));
const [slug, anchor, n = 30] = process.argv.slice(2);
const bl = pc[slug].blocks; const i = Math.max(0, bl.findIndex(b => new RegExp(anchor, 'i').test(b.txt || '')));
for (const b of bl.slice(i, i + +n)) console.log(b.t.padEnd(4), b.txt || b.src);
