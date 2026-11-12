// Genera aviso-legal.html, privacidad.html y cookies.html con la cabecera y el pie de la página principal.
const fs = require('fs'), path = require('path');
const site = process.argv[2];
const index = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const sym = id => (index.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`)) || [])[0];
const symbols = ['i-mark', 'i-word', 'i-wa', 'i-ig', 'i-fb'].map(sym);
if (symbols.some(s => !s)) throw new Error('símbolo no encontrado en index.html');

const UPDATED = '11 de noviembre de 2026';
const WA = 'https://wa.me/34916334636?text=' + encodeURIComponent('Hola, me gustaría pedir cita en Clínica Dental Airam.');

const logo = (label) => `<a class="logo" href="index.html" aria-label="${label}">
      <svg class="mark" viewBox="0 0 340.16 340.16" aria-hidden="true"><use href="#i-mark"/></svg>
      <span class="word"><small>Clínica dental</small><svg viewBox="0 0 250 61" aria-hidden="true"><use href="#i-word"/></svg></span>
    </a>`;

const footer = (current) => {
  const link = (href, text) => `<a href="${href}"${href === current ? ' aria-current="page"' : ''}>${text}</a>`;
  return `<footer class="foot">
  <div class="wrap foot-in">
    ${logo('Clínica Dental Airam, inicio')}
    <nav aria-label="Legal">
      ${link('aviso-legal.html', 'Aviso legal')}
      ${link('privacidad.html', 'Política de privacidad')}
      ${link('cookies.html', 'Política de cookies')}
    </nav>
    <div class="legal-id">
      <span>Clínica Dental de Luis Marcos S.L.P. · CIF B82906132</span>
      <span>Autorización sanitaria n.º CS-04932</span>
      <span>Copyright © <span class="y">2026</span></span>
    </div>
  </div>
</footer>`;
};

const page = ({ file, title, description, h1, body }) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Clínica Dental Airam</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#3A4147">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link rel="stylesheet" href="fonts/maven-pro.css">
<link rel="stylesheet" href="legal.css">
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${symbols.join('\n')}
</defs></svg>
<a class="sr-only" href="#main">Saltar al contenido</a>
<header class="site-header">
  <div class="wrap header-in">
    ${logo('Clínica Dental Airam, inicio')}
    <a class="back" href="index.html">Volver al inicio</a>
    <a class="btn" href="${WA}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg>Pedir cita</a>
  </div>
</header>
<main id="main">
  <div class="doc-head"><div class="wrap"><h1>${h1}</h1><p>Última actualización: ${UPDATED}</p></div></div>
  <article class="wrap doc">
${body}
  </article>
</main>
${footer(file)}
<script>document.querySelectorAll(".y").forEach(function(e){e.textContent=new Date().getFullYear();});</script>
</body>
</html>
`;

const pages = [
{
  file: 'aviso-legal.html', title: 'Aviso legal', h1: 'Aviso legal',
  description: 'Aviso legal de Clínica Dental Airam (Clínica Dental de Luis Marcos S.L.P.), Boadilla del Monte.',
  body: `
<h2>1. Datos identificativos</h2>
<p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
<dl>
  <dt>Titular</dt><dd>Clínica Dental de Luis Marcos S.L.P.</dd>
  <dt>Nombre comercial</dt><dd>Clínica Dental Airam</dd>
  <dt>NIF</dt><dd>B82906132</dd>
  <dt>Domicilio</dt><dd>Avenida del Nuevo Mundo, 7, 28660 Boadilla del Monte (Madrid), España</dd>
  <dt>Correo electrónico</dt><dd><a href="mailto:info@airamdental.com">info@airamdental.com</a></dd>
  <dt>Teléfono</dt><dd><a href="tel:+34916334636">+34 91 633 46 36</a></dd>
  <dt>Datos registrales</dt><dd>Inscrita en el Registro Mercantil de Madrid</dd>
</dl>

<h2>2. Autorización sanitaria</h2>
<p>Clínica Dental Airam es un centro sanitario con número de autorización sanitaria <strong>CS-04932</strong>.</p>

<h2>3. Profesión regulada</h2>
<p>La odontología es una profesión sanitaria regulada. Los profesionales sanitarios colegiados que prestan servicio en el centro son:</p>
<ul>
  <li>María de Luis Marcos</li>
  <li>María García Arroyo</li>
  <li>Sara Virtus Recuenco</li>
  <li>Paula Pontevedra</li>
  <li>David de Paz</li>
</ul>

<h2>4. Objeto y condiciones de uso</h2>
<p>Este sitio web ofrece información sobre la clínica, sus especialidades, su equipo y las formas de contacto. El acceso es libre y gratuito, salvo el coste de la conexión. El usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para actividades ilícitas o contrarias a la buena fe.</p>

<h2>5. Propiedad intelectual e industrial</h2>
<p>Los contenidos del sitio (textos, fotografías, diseño, logotipos y código) son titularidad de Clínica Dental de Luis Marcos S.L.P. o de terceros que han autorizado su uso. Queda prohibida su reproducción, distribución o transformación sin autorización, salvo los usos permitidos por la ley.</p>

<h2>6. Enlaces a otros sitios</h2>
<p>Los enlaces a sitios de terceros (por ejemplo, WhatsApp, Instagram, Facebook o Google Maps) se ofrecen a título informativo. Clínica Dental de Luis Marcos S.L.P. no controla esos sitios y no responde de sus contenidos, sin perjuicio de lo dispuesto en el artículo 17 de la LSSI-CE.</p>

<h2>7. Información sanitaria</h2>
<p>La información de este sitio es de carácter general y no sustituye una consulta, un diagnóstico ni un tratamiento por parte de un profesional sanitario.</p>

<h2>8. Protección de datos y cookies</h2>
<p>El tratamiento de los datos personales se rige por la <a href="privacidad.html">Política de privacidad</a> y el uso de cookies por la <a href="cookies.html">Política de cookies</a>.</p>

<h2>9. Legislación aplicable</h2>
<p>Este aviso legal se rige por la legislación española.</p>
`},
{
  file: 'privacidad.html', title: 'Política de privacidad', h1: 'Política de privacidad',
  description: 'Cómo trata Clínica Dental Airam los datos personales de pacientes y usuarios del sitio web.',
  body: `
<h2>1. Responsable del tratamiento</h2>
<dl>
  <dt>Responsable</dt><dd>Clínica Dental de Luis Marcos S.L.P. (Clínica Dental Airam), NIF B82906132</dd>
  <dt>Domicilio</dt><dd>Avenida del Nuevo Mundo, 7, 28660 Boadilla del Monte (Madrid)</dd>
  <dt>Contacto</dt><dd><a href="mailto:info@airamdental.com">info@airamdental.com</a> · <a href="tel:+34916334636">+34 91 633 46 36</a></dd>
  <dt>Delegado de protección de datos</dt><dd>CONSENUR SANITARIOS S.L.U. · <a href="mailto:delegadopd.sanitarios@urbaser.com">delegadopd.sanitarios@urbaser.com</a></dd>
</dl>

<h2>2. Qué datos tratamos, para qué y con qué base</h2>
<p>Este sitio web no tiene formularios. Los datos llegan a la clínica cuando usted nos contacta por teléfono, correo electrónico, WhatsApp o redes sociales, y cuando recibe asistencia en el centro.</p>
<div class="table-wrap">
<table>
  <caption class="sr-only">Tratamientos de datos personales</caption>
  <thead><tr><th scope="col">Tratamiento</th><th scope="col">Datos</th><th scope="col">Finalidad</th><th scope="col">Base jurídica</th><th scope="col">Conservación</th></tr></thead>
  <tbody>
    <tr><th scope="row">Solicitudes de cita o de información (teléfono, correo electrónico, WhatsApp, redes sociales)</th><td>Nombre, datos de contacto y la información que usted nos facilite, que puede incluir datos de salud</td><td>Atender su solicitud y gestionar la cita</td><td>Aplicación de medidas precontractuales a petición del interesado (art. 6.1.b RGPD); para los datos de salud, art. 9.2.h RGPD</td><td>El tiempo necesario para atender la solicitud y, después, los plazos de prescripción de las responsabilidades que pudieran derivarse</td></tr>
    <tr><th scope="row">Asistencia sanitaria e historia clínica</th><td>Datos identificativos y de salud</td><td>Prestar la asistencia odontológica y gestionar la historia clínica</td><td>Art. 9.2.h RGPD y Ley 41/2002, básica reguladora de la autonomía del paciente</td><td>Los plazos que establecen la Ley 41/2002 y la normativa sanitaria de la Comunidad de Madrid</td></tr>
    <tr><th scope="row">Navegación por el sitio web</th><td>Dirección IP, fecha y hora, página solicitada y tipo de navegador, registrados por el servidor</td><td>Funcionamiento y seguridad del sitio</td><td>Interés legítimo en mantener el sitio seguro y operativo (art. 6.1.f RGPD)</td><td>El tiempo necesario para garantizar la seguridad del sitio</td></tr>
    <tr><th scope="row">Mapa de Google, solo si pulsa «Cargar mapa»</th><td>Dirección IP y datos de navegación que recoge Google</td><td>Mostrarle la ubicación de la clínica</td><td>Su consentimiento, al pulsar el botón (art. 6.1.a RGPD y art. 22.2 LSSI-CE)</td><td>Según la política de privacidad de Google</td></tr>
  </tbody>
</table>
</div>
<p>No tomamos decisiones automatizadas ni elaboramos perfiles a partir de los datos del sitio web.</p>

<h2>3. Destinatarios</h2>
<p>No cedemos datos a terceros salvo obligación legal. El proveedor de alojamiento del sitio web trata los registros de navegación por cuenta de la clínica.</p>
<p>Si usted decide contactarnos por WhatsApp, Instagram o Facebook, esos servicios los presta Meta, que trata sus datos según sus propias condiciones y políticas de privacidad. Del mismo modo, el mapa y el enlace «Cómo llegar» abren servicios de Google sujetos a su propia política.</p>

<h2>4. Transferencias internacionales</h2>
<p>La clínica no transfiere sus datos fuera del Espacio Económico Europeo. Meta y Google, cuando usted usa sus servicios, pueden tratar datos fuera del Espacio Económico Europeo conforme a sus propias políticas.</p>

<h2>5. Sus derechos</h2>
<p>Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar su consentimiento en cualquier momento, escribiendo a <a href="mailto:info@airamdental.com">info@airamdental.com</a> o a nuestro domicilio, indicando el derecho que ejerce. También puede dirigirse a nuestro delegado de protección de datos en <a href="mailto:delegadopd.sanitarios@urbaser.com">delegadopd.sanitarios@urbaser.com</a>.</p>
<p>El acceso a la historia clínica se rige, además, por la Ley 41/2002.</p>
<p>Si considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener">Agencia Española de Protección de Datos</a>.</p>

<h2>6. Menores</h2>
<p>Atendemos a pacientes menores de edad. Los datos de los menores de 14 años los facilitan sus padres, madres o tutores legales (art. 7 de la Ley Orgánica 3/2018).</p>

<h2>7. Seguridad</h2>
<p>Aplicamos medidas técnicas y organizativas adecuadas al riesgo para proteger sus datos (art. 32 RGPD).</p>

<h2>8. Cambios en esta política</h2>
<p>Esta política puede actualizarse para reflejar cambios en los tratamientos. La fecha de la última actualización figura al inicio.</p>
`},
{
  file: 'cookies.html', title: 'Política de cookies', h1: 'Política de cookies',
  description: 'Información sobre el uso de cookies en el sitio web de Clínica Dental Airam.',
  body: `
<h2>¿Qué son las cookies?</h2>
<p>Son pequeños archivos o tecnologías similares, como el almacenamiento local del navegador, que un sitio web guarda en su dispositivo o a los que accede para funcionar o para obtener información sobre su uso.</p>

<h2>Responsable</h2>
<p>Clínica Dental de Luis Marcos S.L.P. (Clínica Dental Airam), NIF B82906132.</p>

<h2>Cookies que utiliza este sitio</h2>
<p>Este sitio web <strong>no instala cookies propias</strong> ni utiliza el almacenamiento local de su navegador. No utilizamos cookies de análisis ni de publicidad. Las fuentes tipográficas y las imágenes se sirven desde el propio sitio.</p>

<h2>Mapa de Google Maps</h2>
<p>En la sección de contacto puede ver un mapa de Google Maps. El mapa <strong>no se carga</strong> hasta que usted pulsa el botón «Cargar mapa». A partir de ese momento, Google puede instalar cookies en su dispositivo y recibir su dirección IP, según su <a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noopener">política de privacidad</a>. Google puede tratar esos datos fuera del Espacio Económico Europeo.</p>
<p>Si prefiere no cargarlo, puede usar el enlace «Cómo llegar», que abre Google Maps en una pestaña nueva.</p>
<p>El mapa se carga solo en esa visita a la página. Si vuelve a entrar, se le pedirá de nuevo que pulse el botón.</p>

<h2>Cómo eliminar las cookies</h2>
<p>Puede borrar las cookies que otros servicios hayan instalado en su dispositivo desde la configuración de su navegador (Chrome, Firefox, Safari, Edge u otro), en el apartado de privacidad o de datos de sitios web.</p>

<h2>Cambios</h2>
<p>Si en el futuro el sitio utiliza cookies que necesiten su consentimiento, se lo pediremos antes de usarlas y actualizaremos esta política.</p>
`}
];

for (const p of pages) fs.writeFileSync(path.join(site, p.file), page(p), 'utf8');
console.log('ok', pages.map(p => p.file).join(', '));
