// Tenta recuperar imagens de posts antigos que apontam para clinicadentalsmileboadilla.com (domínio antigo, 404)
// procurando o mesmo arquivo em airamdental.com/wp-content/uploads/ (mesmo caminho e versão sem sufixo -WxH).
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const blogFile = path.join(ROOT, 'src/data/blog.json');
const blog = JSON.parse(fs.readFileSync(blogFile, 'utf8'));
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (site-migration)' } };
const media = JSON.parse(fs.readFileSync(path.join(ROOT, 'migration/wp-export/media.json'), 'utf8')).map(m => m.source_url);
const report = { recovered: [], missing: [] };
for (const p of blog.posts) {
  const re = /src="\{\{IMG\}\}wp\/([^"]+)"/g;
  for (const m of [...p.html.matchAll(re)]) {
    const local = path.join(ROOT, 'src/img/wp', m[1]);
    if (fs.existsSync(local)) continue;
    // reconstrói a URL antiga a partir do nome do arquivo e procura na biblioteca de mídia atual
    const base = m[1].replace(/^\d+-/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
    const cand = media.filter(u => decodeURIComponent(u.split('/').pop()).toLowerCase().replace(/[^a-z0-9.\-]+/g, '-') === base);
    let got = null;
    for (const u of cand) { const r = await fetch(u, UA); if (r.ok) { fs.writeFileSync(local, Buffer.from(await r.arrayBuffer())); got = u; break; } }
    if (got) report.recovered.push(`${p.path} ${m[1]} <- ${got}`);
    else {
      report.missing.push(`${p.path} ${m[1]}`);
      // a imagem já não existe em nenhum dos dois domínios: retira a <img> quebrada do post (fica registrado no relatório)
      p.html = p.html.replace(new RegExp(`<img[^>]*src="\\{\\{IMG\\}\\}wp/${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'), '');
    }
  }
  p.html = p.html.replace(/<(p|figure|a)[^>]*>\s*<\/\1>/g, '');
}
fs.writeFileSync(blogFile, JSON.stringify(blog, null, 1));
fs.writeFileSync(path.join(ROOT, 'migration/blog-imagenes-perdidas.json'), JSON.stringify(report, null, 1));
console.log('recuperadas:', report.recovered.length, 'perdidas:', report.missing.length);
