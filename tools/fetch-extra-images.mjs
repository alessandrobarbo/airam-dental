// Baixa as fotos da equipe (valores) e da galeria de instalações que ainda não estão em src/img.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const U = 'https://airamdental.com/wp-content/uploads/';
const list = {
  'wp/sortistudio-airam-26-09-2024-13-opt.jpg': U + '2024/11/@Sortistudio_Airam_26_09_2024-13_opt.jpg',
  'wp/sortistudio-airam-14-10-2024-28-opt.jpg': U + '2024/11/@Sortistudio_Airam_14_10_2024-28_opt.jpg',
  'wp/sortistudio-airam-14-10-2024-45-opt.jpg': U + '2024/11/@Sortistudio_Airam_14_10_2024-45_opt.jpg',
  'wp/sortistudio-airam-10-09-2024-13-opt-scaled.jpg': U + '2024/11/@Sortistudio_Airam_10_09_2024-13_opt-scaled.jpg',
  'wp/sortistudio-airam-10-09-2024-39-opt-scaled.jpg': U + '2024/09/@Sortistudio_Airam_10_09_2024-39_opt-scaled.jpg',
  'wp/escaner-intraoral-opt-scaled.jpg': U + '2025/08/Escaner-intraoral-opt-scaled.jpg',
  'wp/gabinete-2-airam-opt-scaled.jpg': U + '2025/08/Gabinete-2-airam-opt-scaled.jpg'
};
for (const [name, url] of Object.entries(list)) {
  const dest = path.join(ROOT, 'src/img', name);
  if (fs.existsSync(dest)) { console.log('ok (ya existía)', name); continue; }
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (site-migration)' } });
  if (!r.ok) { console.log('FALLO', r.status, url); continue; }
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); console.log('descargada', name);
}
