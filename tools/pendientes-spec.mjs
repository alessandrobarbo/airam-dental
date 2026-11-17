// Gera docs/pendientes-spec.json (entrada do PDF «Asuntos pendientes») a partir dos dados do projeto.
import fs from 'node:fs';
const D = f => JSON.parse(fs.readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const site = D('site.json'), team = D('team.json'), ov = D('text-overrides.json');
const lost = JSON.parse(fs.readFileSync(new URL('../migration/blog-imagenes-perdidas.json', import.meta.url), 'utf8')).missing.length;
const AVISO = ['María de Luis Marcos', 'María García Arroyo', 'Sara Virtus Recuenco', 'Paula Pontevedra', 'David de Paz'];
const inAviso = n => AVISO.find(a => a.startsWith(n) || n.startsWith(a.split(' ').slice(0, 2).join(' ')));
const hourRows = site.hours.map(h => [h.label, h.closed ? 'Cerrado' : `${h.open}–${h.close}`]);

const teamRows = team.members.map(m => [m.name, m.role, 'Sí', inAviso(m.name) ? `Sí (${inAviso(m.name)})` : (m.group === 'clinico' && m.id !== 'jose-angel-palomo' ? '<span class="hl">No</span>' : 'No')]);
teamRows.push(['David de Paz', '<span class="hl">Por indicar</span>', '<span class="hl">No</span>', 'Sí']);

const spec = {
  lang: 'es',
  client: 'Clínica Dental Airam',
  title: 'Asuntos pendientes',
  subtitle: 'Información que necesitamos confirmar con la clínica para finalizar y publicar la nueva web.',
  projectLabel: 'PROYECTO WEB / CLÍNICA DENTAL AIRAM',
  date: '2026-11-13',
  dateText: '13 de noviembre de 2026',
  version: '1.0',
  reviewUrl: 'Versión de revisión: climbahia.com.br/demo-airam/',
  intro: 'La nueva web ya reúne todo el contenido de airamdental.com (11 tratamientos, 10 recomendaciones, 98 artículos del blog, equipo e instalaciones) en las mismas direcciones. Para publicarla necesitamos que la clínica confirme o facilite los datos siguientes. <b>No hemos inventado ningún dato:</b> lo que no está confirmado figura aquí.',
  content: [
    { type: 'section', priority: 'high', label: '01 / IMPRESCINDIBLE', title: 'A. Imprescindible para publicar', items: [
      { title: 'Equipo vigente y profesionales colegiados', tag: 'Equipo', need: 'Confirmar quién forma hoy el equipo y qué profesionales sanitarios colegiados deben figurar en el aviso legal (ver la tabla del equipo).', now: 'La página de equipo muestra a <b>Belén Granja</b>, que no figura en el aviso legal; el aviso legal cita a <b>David de Paz</b>, que no aparece en el equipo. No hemos quitado ni añadido a nadie.' },
      { title: 'Datos de colegiación', tag: 'Legal', need: 'Nº de colegiado de cada profesional, colegio profesional (¿COEM?), título y país de expedición, y enlace al código deontológico aplicable.', now: 'No figuran en la web actual. Son obligatorios para profesiones reguladas (art. 10 LSSI).' },
      { title: 'Datos del Registro Mercantil', tag: 'Legal', need: `Tomo, folio, hoja e inscripción de <b>${site.legalName}</b> (NIF ${site.nif}).`, now: 'El aviso legal actual solo indica «Inscrita en el Registro Mercantil de Madrid».' },
      { title: 'Número de registro sanitario', tag: 'Legal', need: `Confirmar que <b>${site.sanitaryAuth}</b> es el número de registro sanitario que debe figurar en la publicidad del centro.`, now: 'La web actual lo presenta como «Número de Autorización Sanitaria». En Madrid debe aparecer en la publicidad de centros sanitarios.' },
      { title: 'Delegado de protección de datos (DPD)', tag: 'Legal', need: 'Confirmar que el DPD sigue siendo <b>CONSENUR SANITARIOS S.L.U.</b> con el correo <b>delegadopd.sanitarios@urbaser.com</b>.', now: 'Dato tomado del aviso legal actual.' },
      { title: 'Correo para ejercer derechos de privacidad', tag: 'Legal', need: `Confirmar que los pacientes deben escribir a <b>${site.email}</b>.`, now: 'La política de privacidad actual indica info@dentistainfantilboadilla.com, un dominio que no es el de la clínica.' },
      { title: 'Proveedores y cesiones de datos', tag: 'Legal', need: 'Indicar hosting definitivo, proveedor de correo, software de gestión clínica y si se comparten datos con laboratorios o aseguradoras, y en qué país se guardan los datos.', now: 'Necesario para completar la política de privacidad.' },
      { title: 'Horario y calendario de festivos', tag: 'Horario', need: 'Confirmar el horario (abajo) y facilitar festivos, vacaciones y cierres puntuales.', now: 'Tomado de la web actual. Sin calendario, la web muestra el estado «según el horario habitual».' },
      { title: 'WhatsApp de la clínica', tag: 'Contacto', need: `Confirmar que <b>${site.phoneDisplay}</b> atiende por WhatsApp e indicar si el número <b>626 241 982</b> es de la clínica.`, now: 'Todos los botones usan el fijo. Un artículo de 2026 del blog enlazaba a WhatsApp con el 626 241 982; lo hemos cambiado al número oficial hasta confirmarlo.' },
      { title: 'Textos clínicos', tag: 'Contenido', need: `Aprobar las <b>${ov.treatments.length} frases</b> que hemos suavizado para evitar promesas absolutas, y revisar el contenido clínico de los tratamientos antes de publicar.`, now: 'Ejemplos: «absolutamente sin dolor», «la solución definitiva», «garantiza el éxito», «tasa de éxito del 98 %» sin fuente. Enviamos la lista con el texto original y el propuesto.' },
      { title: 'Revisión jurídica de los textos legales', tag: 'Legal', need: 'Que el asesor jurídico o el DPD revise el aviso legal, la política de privacidad y la de cookies.', now: 'Rehechos con los datos confirmados. Los actuales citan otros dominios, una empresa ajena («Belleepock») y una fecha de 2018.' },
      { title: 'Publicación en airamdental.com', tag: 'Publicación', need: 'Fecha prevista, quién aprueba la versión final y acceso al alojamiento y al DNS de airamdental.com.', now: 'Antes de publicar haremos copia completa del WordPress actual. Todas las direcciones se mantienen o redirigen.' }
    ]},
    { type: 'columns', boxes: [
      { title: 'Horario publicado', rows: hourRows },
      { title: 'Contacto publicado', rows: [['Teléfono', site.phoneDisplay], ['WhatsApp', `${site.phoneDisplay} <span class="hl">por confirmar</span>`], ['Correo', site.email], ['Dirección', `${site.address.street}, ${site.address.postalCode} ${site.address.city}`], ['Instagram', '@dentalairam']] }
    ]},
    { type: 'section', priority: 'normal', label: '02 / CONFIRMAR O DECIDIR', title: 'B. Confirmar o decidir', newPage: true, items: [
      { title: 'Opiniones de pacientes', need: 'Confirmar que las tres opiniones (Carlos Navarro, M Carmen Piñera y Delia Aparicio) son reales, que hay permiso para publicarlas y de dónde proceden.', now: 'Se muestran con su texto íntegro, sin estrellas. En publicidad sanitaria conviene que las revise el asesor jurídico.' },
      { title: 'Autorización de imágenes', need: 'Confirmar que las personas del equipo y los pacientes que aparecen en las fotos han autorizado su uso en la web.', now: '—' },
      { title: 'Textos de las fichas del equipo', need: 'Revisar las descripciones del equipo.', now: 'Hemos quitado superlativos y promesas («tándem insuperable», «empresa líder a nivel nacional», «sonrisa perfecta») y un dato personal de la ficha de Noelia.' },
      { title: 'Newsletter', need: 'Confirmar que la lista de Brevo sigue activa, a nombre de quién está y que su formulario incluye el consentimiento.', now: 'La web solo enlaza al formulario de Brevo de la web actual; no recoge datos.' },
      { title: '«Cómo llegar»', need: 'Indicar si la clínica tiene ficha de Google con el nombre Airam para enlazarla.', now: 'La web actual enlaza a Google Maps con el nombre antiguo «Clínica Dental Smile Boadilla». La nueva usa la dirección.' },
      { title: 'Páginas de campaña antiguas', need: 'Indicar si siguen vigentes «Especialistas en estética dental Madrid» e «Implantes con cirugía guiada».', now: 'Se han mantenido con su texto promocional original («¡Te regala…»).' },
      { title: 'Imágenes perdidas del blog', need: 'Si la clínica conserva las imágenes originales de artículos de 2017–2021, enviarlas para recuperarlas.', now: `${lost} imágenes apuntaban al dominio antiguo y ya no existen (también están rotas en la web actual).` },
      { title: 'Otras afirmaciones a revisar', need: 'Decidir si se mantienen frases como «más rentables a largo plazo, a partir de unos 7 años» (implantes).', now: 'Se han conservado sin cambios; enviamos la lista completa.' },
      { title: 'Analítica y publicidad', need: 'Decidir si se quiere medir visitas o campañas (Google Analytics, Ads u otros).', now: 'La nueva web no usa ninguna herramienta de medición ni cookies; si se añade, habrá que incluir un aviso de cookies con opción de rechazar.' }
    ]},
    { type: 'table', label: '03 / EQUIPO', title: 'Equipo publicado: revisar', newPage: true, checkbox: true,
      columns: ['Nombre', 'Función', 'Página de equipo', 'Aviso legal (colegiados)'], rows: teamRows },
    { type: 'note', html: 'Para cada profesional sanitario necesitamos también su <b>nº de colegiado</b>, colegio y título. Marque «OK» en las filas correctas e indique los cambios en las demás.' }
  ],
  footerNote: 'Los datos de esta lista proceden de airamdental.com (consulta del 12/11/2026). Se recomienda que un asesor jurídico o el DPD revise los textos legales y la publicidad sanitaria antes de publicar.'
};
fs.writeFileSync(new URL('../docs/pendientes-spec.json', import.meta.url), JSON.stringify(spec, null, 1));
console.log('items A', spec.content[0].items.length, 'B', spec.content[2].items.length, 'team rows', teamRows.length);
