// Gera docs/mejoras-spec.json a partir de 3 rodadas do Lighthouse (docs/medicoes-1..3.json), usando a mediana.
import fs from 'node:fs';
const runs = [1, 2, 3].map(i => `docs/medicoes-${i}.json`).filter(f => fs.existsSync(f)).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const pagesOf = r => r.pages || r;
const names = pagesOf(runs[0]).map(p => p.name);
const med = a => { const s = a.filter(x => typeof x === 'number').sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const M = {};
for (const n of names) {
  const ps = runs.map(r => pagesOf(r).find(p => p.name === n));
  const agg = side => ({
    perf: med(ps.map(p => p[side].performance)), a11y: med(ps.map(p => p[side].accessibility)),
    lcp: med(ps.map(p => p[side].lcpSeconds)), kb: med(ps.map(p => p[side].weightKB)),
    a11yFailed: [...new Set(ps.flatMap(p => p[side].a11yFailed || []))],
    raw: { perf: ps.map(p => p[side].performance), lcp: ps.map(p => p[side].lcpSeconds) }
  });
  M[n] = { before: agg('before'), after: agg('after') };
}
fs.writeFileSync('docs/medicoes-mediana.json', JSON.stringify({ runs: runs.length, pages: M }, null, 1));
const n1 = x => String(x).replace('.', ',');
const kb = x => x.toLocaleString('es-ES');
const P = M['Portada'], I = M['Implantología'], C = M['Contacto'];
const reduc = Math.round((1 - P.after.kb / P.before.kb) * 100);

const spec = {
  lang: 'es',
  client: 'Clínica Dental Airam',
  title: 'Mejoras de la nueva web',
  heading: 'La nueva web de Clínica Dental Airam',
  subtitle: 'Qué mejora frente a la web actual. Todas las cifras están medidas en las mismas condiciones el 16 de noviembre de 2026.',
  projectLabel: 'PROYECTO WEB / CLÍNICA DENTAL AIRAM',
  date: '2026-11-16',
  version: '1.0',
  stats: [
    { from: `${n1(P.before.lcp)} s`, to: `${n1(P.after.lcp)} s`, desc: 'Tiempo hasta ver el contenido principal de la portada en el móvil.' },
    { from: `${n1((P.before.kb / 1024).toFixed(1))} MB`, to: `${n1((P.after.kb / 1024).toFixed(2))} MB`, desc: `Peso de la portada: un ${reduc} % menos de datos para el paciente.` },
    { from: String(P.before.perf), to: String(P.after.perf), desc: 'Rendimiento en móvil según Google Lighthouse (sobre 100).' },
    { from: String(P.before.a11y), to: String(P.after.a11y), desc: 'Accesibilidad según Google Lighthouse (sobre 100).' }
  ],
  lead: 'La nueva web conserva todo el contenido de airamdental.com (11 tratamientos, 10 recomendaciones, 98 artículos del blog, equipo e instalaciones) en las mismas direcciones, y lo presenta de forma más rápida, más clara y más fácil de usar desde el móvil.',
  sections: [
    { label: 'Velocidad', title: 'Carga mucho más rápido en el móvil', newPage: true,
      chart: { title: 'Tiempo hasta ver el contenido principal (segundos, menos es mejor)', hint: 'Google Lighthouse, simulación de móvil. Mediana de tres mediciones en tres páginas clave.', unit: 's',
        rows: [['Portada', P], ['Implantología', I], ['Contacto', C]].map(([name, x]) => ({ name, before: x.before.lcp, after: x.after.lcp })) },
      table: { columns: ['Página', 'Rendimiento (0–100)', 'Contenido principal visible', 'Peso de la página'],
        rows: [['Portada', P], ['Implantología', I], ['Contacto', C]].map(([name, x]) => [name, `${x.before.perf} → ${x.after.perf}`, `${n1(x.before.lcp)} s → ${n1(x.after.lcp)} s`, `${kb(x.before.kb)} KB → ${kb(x.after.kb)} KB`]) },
      method: 'Google Lighthouse 12.2.1, perfil móvil, mismo equipo y conexión, 16/11/2026; mediana de tres mediciones por página. Son mediciones de laboratorio: la experiencia real puede variar según el dispositivo y la red.' },
    { label: 'Contacto y citas', title: 'Pedir cita es más directo',
      pairs: [
        { title: 'Botones siempre a mano en el móvil', before: 'Un botón flotante de WhatsApp y el botón «Reserva ahora», que lleva a la página de contacto.', after: 'Una <b>barra fija</b> con <b>«Llamar»</b> y <b>«Solicitar cita»</b> en todas las páginas, y botones de llamada y WhatsApp en la primera pantalla.' },
        { title: 'Consulta por tratamiento', before: 'Un botón «Llámenos» genérico al final de cada tratamiento.', after: 'Cada tratamiento tiene su botón de WhatsApp con el <b>mensaje ya escrito</b> («…información sobre implantología»), además de teléfono y correo.' },
        { title: 'Abierto o cerrado, de un vistazo', before: 'Tabla de horario.', after: 'La web indica <b>«Abierto ahora, hasta las…»</b> o <b>«Cerrado, abrimos a las…»</b> con la hora de Madrid, según el horario habitual.' },
        { title: 'Enlaces que funcionan', before: 'El enlace de WhatsApp del pie usa el número sin el prefijo de España (lleva a un número equivocado) y cinco páginas de tratamiento enlazan a una web de pruebas.', after: '<b>Todos los enlaces revisados</b>: WhatsApp con el número completo y ningún enlace roto en las 247 páginas.' }
      ] },
    { label: 'Información clara', title: 'El paciente encuentra lo que busca',
      pairs: [
        { title: 'Páginas de tratamiento', before: 'Texto en acordeones, sin índice ni enlaces a los cuidados posteriores.', after: 'Cada tratamiento con <b>índice «En esta página»</b>, todo el contenido original, sus <b>recomendaciones de cuidado</b>, los <b>profesionales</b> que lo realizan y otros tratamientos relacionados.' },
        { title: 'Equipo en la portada', before: 'La portada enlaza a la página de equipo.', after: 'Las <b>10 personas del equipo</b> aparecen en la portada con su función y descripción, y cada ficha enlaza a su perfil completo.' },
        { title: 'Blog sin imágenes rotas', before: 'Artículos antiguos con imágenes que ya no cargan.', after: 'Los <b>98 artículos</b> con su fecha original, etiquetas y navegación entre artículos, <b>sin imágenes rotas</b>.' }
      ] },
    { label: 'Privacidad', title: 'Más respeto por los datos del paciente',
      pairs: [
        { title: 'Seguimiento y servicios externos', before: 'Carga Google Tag Manager, reCAPTCHA, un gestor de cookies y el chat de WhatsApp en todas las páginas.', after: '<b>Sin herramientas de seguimiento ni cookies.</b> La web no contacta con ningún servicio externo al abrirse; el mapa de Google solo se carga si el paciente lo pide.' },
        { title: 'Textos legales', before: 'Citan otros dominios y una empresa ajena, un correo de otro dominio para ejercer derechos y una política de cookies de 2018.', after: 'Aviso legal, privacidad y cookies <b>coherentes con lo que hace la web</b>, con los datos de la clínica (pendientes de su revisión).' }
      ] },
    { label: 'Accesibilidad y móvil', title: 'Cómoda para todos los pacientes',
      pairs: [
        { title: 'Lectura y uso', before: 'Google Lighthouse detecta textos con poco contraste, títulos fuera de orden y enlaces sin nombre que los lectores de pantalla puedan anunciar.', after: '<b>Ningún fallo</b> en la revisión automática de accesibilidad (axe-core, WCAG 2.2 AA) en 12 páginas, en móvil y escritorio, con botones de tamaño táctil y navegación completa con teclado.' },
        { title: 'Estructura de cada página', before: 'Las páginas interiores no tienen título principal (H1).', after: '<b>Un título principal por página</b> y apartados ordenados, lo que ayuda a los lectores de pantalla y a los buscadores.' }
      ] },
    { label: 'Preparada para crecer', title: 'Un cambio seguro y fácil de mantener',
      pairs: [
        { title: 'Posicionamiento en Google', before: 'Un cambio de web suele modificar direcciones y perder parte de lo ganado en buscadores.', after: '<b>213 de las 218 direcciones</b> actuales se mantienen igual y las otras 5 redirigen a su página equivalente, lo que ayuda a conservar lo ganado en buscadores. Mapa del sitio y datos estructurados preparados.' },
        { title: 'Mantenimiento', before: 'Horario y teléfono escritos por separado en el pie y en la página de contacto.', after: 'Horario (preparado para festivos y cierres), contacto y equipo en <b>un único lugar</b>: un cambio se refleja en toda la web.' }
      ] }
  ],
  next: { text: 'Confirmar los datos pendientes (equipo y colegiación, datos legales, WhatsApp y festivos) y publicar la nueva web en airamdental.com.' }
};
fs.writeFileSync('docs/mejoras-spec.json', JSON.stringify(spec, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(M).map(([k, v]) => [k, { perf: `${v.before.perf}→${v.after.perf} (${v.before.raw.perf}|${v.after.raw.perf})`, lcp: `${v.before.lcp}→${v.after.lcp} (${v.before.raw.lcp}|${v.after.raw.lcp})`, kb: `${v.before.kb}→${v.after.kb}`, a11y: `${v.before.a11y}→${v.after.a11y}`, a11yFailedBefore: v.before.a11yFailed, a11yFailedAfter: v.after.a11yFailed }])), null, 1));
