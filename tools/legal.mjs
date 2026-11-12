// Páginas legais (aviso legal, privacidade, cookies) nas mesmas URLs do site atual.
// Conteúdo baseado nos dados confirmados em src/data/site.json. Revisão jurídica pendente (ver docs/).
const UPDATED = '12 de noviembre de 2026';

export function legalPages({ site, MODE, esc }) {
  const R = '../';
  const demoNote = MODE === 'demo' ? `
<aside class="callout" aria-label="Aviso sobre la versión de demostración">
  <h2>Versión de demostración</h2>
  <p>Esta copia es una propuesta de rediseño alojada temporalmente en el dominio climbahia.com.br, con fines de presentación. No es la web oficial de la clínica y Clínica Dental de Luis Marcos S.L.P. no gestiona este alojamiento. Los textos legales describen cómo funcionará la web oficial y están pendientes de validación por la clínica.</p>
</aside>` : '';
  const head = (h1) => `<header class="page-hero page-hero--plain wrap"><div class="page-hero-text"><h1>${h1}</h1><p class="meta">Última actualización: ${UPDATED}</p></div></header>`;
  const addr = `${esc(site.address.street)}, ${site.address.postalCode} ${esc(site.address.city)} (Madrid), España`;

  const aviso = `${head('Aviso legal')}
<div class="wrap narrow prose">${demoNote}
<h2>1. Datos identificativos</h2>
<p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
<dl class="data">
  <dt>Titular</dt><dd>${esc(site.legalName)}</dd>
  <dt>Nombre comercial</dt><dd>${esc(site.name)}</dd>
  <dt>NIF</dt><dd>${site.nif}</dd>
  <dt>Domicilio</dt><dd>${addr}</dd>
  <dt>Correo electrónico</dt><dd><a href="mailto:${site.email}">${site.email}</a></dd>
  <dt>Teléfono</dt><dd><a href="tel:${site.phone}">${site.phoneDisplay}</a></dd>
  <dt>Datos registrales</dt><dd>Inscrita en el Registro Mercantil de Madrid</dd>
</dl>
<h2>2. Autorización sanitaria</h2>
<p>${esc(site.name)} es un centro sanitario con número de autorización sanitaria <strong>${site.sanitaryAuth}</strong>.</p>
<h2>3. Profesión regulada</h2>
<p>La odontología es una profesión sanitaria regulada. Los profesionales sanitarios colegiados que prestan servicio en el centro, según la información facilitada por la clínica, son:</p>
<ul><li>María de Luis Marcos</li><li>María García Arroyo</li><li>Sara Virtus Recuenco</li><li>Paula Pontevedra</li><li>David de Paz</li></ul>
<h2>4. Objeto y condiciones de uso</h2>
<p>Este sitio web ofrece información sobre la clínica, sus tratamientos, su equipo, recomendaciones para pacientes y un blog. El acceso es libre y gratuito, salvo el coste de la conexión. El usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para actividades ilícitas o contrarias a la buena fe.</p>
<h2>5. Propiedad intelectual e industrial</h2>
<p>Los contenidos del sitio (textos, fotografías, diseño, logotipos y código) son titularidad de ${esc(site.legalName)} o de terceros que han autorizado su uso. Queda prohibida su reproducción, distribución o transformación sin autorización, salvo los usos permitidos por la ley.</p>
<h2>6. Enlaces a otros sitios</h2>
<p>Los enlaces a sitios de terceros (por ejemplo, WhatsApp, Instagram, Facebook, Google Maps o el formulario de suscripción de Brevo) se ofrecen a título informativo. ${esc(site.legalName)} no controla esos sitios y no responde de sus contenidos, sin perjuicio de lo dispuesto en el artículo 17 de la LSSI-CE.</p>
<h2>7. Información sanitaria</h2>
<p>La información de este sitio es de carácter general y no sustituye una consulta, un diagnóstico ni un tratamiento por parte de un profesional sanitario.</p>
<h2>8. Protección de datos y cookies</h2>
<p>El tratamiento de los datos personales se rige por la <a href="${R}politicadeprivacidad/">Política de privacidad</a> y el uso de cookies por la <a href="${R}politica-de-cookies/">Política de cookies</a>.</p>
<h2>9. Legislación aplicable</h2>
<p>Este aviso legal se rige por la legislación española.</p>
</div>`;

  const priv = `${head('Política de privacidad')}
<div class="wrap narrow prose">${demoNote}
<h2>1. Responsable del tratamiento</h2>
<dl class="data">
  <dt>Responsable</dt><dd>${esc(site.legalName)} (${esc(site.name)}), NIF ${site.nif}</dd>
  <dt>Domicilio</dt><dd>${addr}</dd>
  <dt>Contacto</dt><dd><a href="mailto:${site.email}">${site.email}</a> · <a href="tel:${site.phone}">${site.phoneDisplay}</a></dd>
  <dt>Delegado de protección de datos</dt><dd>CONSENUR SANITARIOS S.L.U. · <a href="mailto:delegadopd.sanitarios@urbaser.com">delegadopd.sanitarios@urbaser.com</a></dd>
</dl>
<h2>2. Qué datos tratamos, para qué y con qué base</h2>
<p>Este sitio web no tiene formularios propios. Los datos llegan a la clínica cuando usted nos contacta por teléfono, correo electrónico, WhatsApp o redes sociales, cuando se suscribe a la newsletter en el formulario externo de Brevo y cuando recibe asistencia en el centro.</p>
<div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de tratamientos de datos (desplazable)"><table>
<caption class="sr-only">Tratamientos de datos personales</caption>
<thead><tr><th scope="col">Tratamiento</th><th scope="col">Datos</th><th scope="col">Finalidad</th><th scope="col">Base jurídica</th><th scope="col">Conservación</th></tr></thead>
<tbody>
<tr><th scope="row">Solicitudes de cita o de información (teléfono, correo electrónico, WhatsApp, redes sociales)</th><td>Nombre, datos de contacto y la información que usted nos facilite, que puede incluir datos de salud</td><td>Atender su solicitud y gestionar la cita</td><td>Aplicación de medidas precontractuales a petición del interesado (art. 6.1.b RGPD); para los datos de salud, art. 9.2.h RGPD</td><td>El tiempo necesario para atender la solicitud y, después, los plazos de prescripción de las responsabilidades que pudieran derivarse</td></tr>
<tr><th scope="row">Asistencia sanitaria e historia clínica</th><td>Datos identificativos y de salud</td><td>Prestar la asistencia odontológica y gestionar la historia clínica</td><td>Art. 9.2.h RGPD y Ley 41/2002, básica reguladora de la autonomía del paciente</td><td>Los plazos que establecen la Ley 41/2002 y la normativa sanitaria de la Comunidad de Madrid</td></tr>
<tr><th scope="row">Newsletter (solo si usted se suscribe en el formulario de Brevo)</th><td>Correo electrónico y los datos que pida el formulario</td><td>Enviarle la newsletter de la clínica</td><td>Su consentimiento (art. 6.1.a RGPD y art. 21 LSSI-CE); puede darse de baja en cualquier envío</td><td>Hasta que retire su consentimiento</td></tr>
<tr><th scope="row">Navegación por el sitio web</th><td>Dirección IP, fecha y hora, página solicitada y tipo de navegador, registrados por el servidor</td><td>Funcionamiento y seguridad del sitio</td><td>Interés legítimo en mantener el sitio seguro y operativo (art. 6.1.f RGPD)</td><td>El tiempo necesario para garantizar la seguridad del sitio</td></tr>
<tr><th scope="row">Mapa de Google, solo si pulsa «Cargar mapa»</th><td>Dirección IP y datos de navegación que recoge Google</td><td>Mostrarle la ubicación de la clínica</td><td>Su consentimiento, al pulsar el botón (art. 6.1.a RGPD y art. 22.2 LSSI-CE)</td><td>Según la política de privacidad de Google</td></tr>
</tbody></table></div>
<p>No tomamos decisiones automatizadas ni elaboramos perfiles a partir de los datos del sitio web.</p>
<h2>3. Destinatarios y proveedores</h2>
<p>No cedemos datos a terceros salvo obligación legal. El proveedor de alojamiento del sitio web trata los registros de navegación por cuenta de la clínica. El formulario de la newsletter lo presta Brevo, que trata los datos de los suscriptores por cuenta de la clínica.</p>
<p>Si usted decide contactarnos por WhatsApp, Instagram o Facebook, esos servicios los presta Meta, que trata sus datos según sus propias condiciones y políticas de privacidad. Del mismo modo, el mapa y el enlace de ruta abren servicios de Google sujetos a su propia política.</p>
<h2>4. Transferencias internacionales</h2>
<p>Meta y Google, cuando usted usa sus servicios, pueden tratar datos fuera del Espacio Económico Europeo conforme a sus propias políticas. La ubicación de los datos del alojamiento y de la newsletter está pendiente de confirmación por la clínica y se indicará aquí.</p>
<h2>5. Sus derechos</h2>
<p>Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar su consentimiento en cualquier momento, escribiendo a <a href="mailto:${site.email}">${site.email}</a> o a nuestro domicilio, indicando el derecho que ejerce. También puede dirigirse a nuestro delegado de protección de datos en <a href="mailto:delegadopd.sanitarios@urbaser.com">delegadopd.sanitarios@urbaser.com</a>.</p>
<p>El acceso a la historia clínica se rige, además, por la Ley 41/2002.</p>
<p>Si considera que el tratamiento de sus datos no se ajusta a la normativa, puede presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener">Agencia Española de Protección de Datos</a>.</p>
<h2>6. Menores</h2>
<p>Atendemos a pacientes menores de edad. Los datos de los menores de 14 años los facilitan sus padres, madres o tutores legales (art. 7 de la Ley Orgánica 3/2018).</p>
<h2>7. Seguridad</h2>
<p>Aplicamos medidas técnicas y organizativas adecuadas al riesgo para proteger sus datos (art. 32 RGPD).</p>
<h2>8. Cambios en esta política</h2>
<p>Esta política puede actualizarse para reflejar cambios en los tratamientos. La fecha de la última actualización figura al inicio.</p>
</div>`;

  const cookies = `${head('Política de cookies')}
<div class="wrap narrow prose">${demoNote}
<h2>¿Qué son las cookies?</h2>
<p>Son pequeños archivos o tecnologías similares, como el almacenamiento local del navegador, que un sitio web guarda en su dispositivo o a los que accede para funcionar o para obtener información sobre su uso.</p>
<h2>Responsable</h2>
<p>${esc(site.legalName)} (${esc(site.name)}), NIF ${site.nif}.</p>
<h2>Cookies que utiliza este sitio</h2>
<p>Las páginas de este sitio <strong>no instalan cookies propias</strong> ni utilizan el almacenamiento local de su navegador. No utilizamos cookies de análisis ni de publicidad. Las fuentes tipográficas y las imágenes se sirven desde el propio sitio.</p>
${MODE === 'demo' ? '<p>Durante la demostración, el sitio se aloja en el dominio climbahia.com.br. Otras páginas de ese dominio, ajenas a esta demostración, pueden instalar sus propias cookies, que su navegador conserva y envía al dominio; las páginas de la demostración no las crean ni las leen.</p>' : ''}
<h2>Mapa de Google Maps</h2>
<p>En la página de contacto puede ver un mapa de Google Maps. El mapa <strong>no se carga</strong> hasta que usted pulsa el botón «Cargar mapa». A partir de ese momento, Google puede instalar cookies en su dispositivo y recibir su dirección IP, según su <a href="https://policies.google.com/privacy?hl=es" target="_blank" rel="noopener">política de privacidad</a>. Google puede tratar esos datos fuera del Espacio Económico Europeo.</p>
<p>Si prefiere no cargarlo, puede usar el enlace de ruta, que abre Google Maps en una pestaña nueva. El mapa se carga solo en esa visita a la página: si vuelve a entrar, tendrá que pulsar de nuevo el botón.</p>
<h2>Enlaces a servicios externos</h2>
<p>Los enlaces a WhatsApp, Instagram, Facebook y al formulario de la newsletter (Brevo) abren servicios de terceros. Este sitio no carga ningún contenido de esos servicios hasta que usted pulsa el enlace; a partir de ese momento se aplican sus propias políticas de cookies.</p>
<h2>Cómo eliminar las cookies</h2>
<p>Puede borrar las cookies que otros servicios hayan instalado en su dispositivo desde la configuración de su navegador (Chrome, Firefox, Safari, Edge u otro), en el apartado de privacidad o de datos de sitios web.</p>
<h2>Cambios</h2>
<p>Si en el futuro el sitio utiliza cookies que necesiten su consentimiento, se lo pediremos antes de usarlas, con opciones para aceptarlas, rechazarlas y cambiar de opinión, y actualizaremos esta política.</p>
</div>`;

  return [
    { path: '/aviso-legal/', title: 'Aviso legal · Clínica Dental Airam', desc: 'Aviso legal de Clínica Dental Airam (Clínica Dental de Luis Marcos S.L.P.), Boadilla del Monte.', h1: 'Aviso legal', body: aviso },
    { path: '/politicadeprivacidad/', title: 'Política de privacidad · Clínica Dental Airam', desc: 'Cómo trata Clínica Dental Airam los datos personales de pacientes y usuarios del sitio web.', h1: 'Política de privacidad', body: priv },
    { path: '/politica-de-cookies/', title: 'Política de cookies · Clínica Dental Airam', desc: 'Información sobre el uso de cookies en el sitio web de Clínica Dental Airam.', h1: 'Política de cookies', body: cookies }
  ];
}
