# Validaciones pendientes de la clínica o de acceso adicional

Estado a 12-11-2026. Nada de esta lista se ha inventado ni rellenado con supuestos en el sitio.

## A. Equipo y datos profesionales
1. **Lista vigente del equipo.** La web actual muestra 10 personas en /equipo/; el aviso legal lista 5 profesionales colegiados. **Belén Granja** aparece en el equipo pero no en el aviso legal; **David de Paz** aparece en el aviso legal pero no en el equipo. No se ha eliminado ni añadido a nadie. Los datos están centralizados en `src/data/team.json` (equipo) y `tools/legal.mjs` (aviso legal) para actualizarlos en un solo sitio.
2. Número de colegiado de cada profesional, colegio (probablemente COEM), título y país de expedición, y enlace a las normas deontológicas (LSSI art. 10.1.f).
3. Autorización de uso de las fotografías de cada persona del equipo y de los pacientes que aparecen en imágenes.
4. Revisión de los textos del equipo: se retiraron superlativos y promesas («tándem insuperable», «empresa líder a nivel nacional», «sonrisa perfecta», «tengo la solución») y un dato personal («mami primeriza»). Detalle en `src/data/text-overrides.json` → `team`.

## B. Datos legales y de privacidad
5. Datos registrales completos (Registro Mercantil de Madrid: tomo, folio, hoja, inscripción).
6. Confirmar que **CS-04932** es el número de registro sanitario que debe figurar en la publicidad (Comunidad de Madrid).
7. Confirmar que el DPD sigue siendo CONSENUR SANITARIOS S.L.U. y su correo `delegadopd.sanitarios@urbaser.com`.
8. Correo para el ejercicio de derechos (se ha usado `info@airamdental.com`; la política actual cita `info@dentistainfantilboadilla.com`).
9. Proveedores reales: alojamiento definitivo, correo, software de gestión clínica, y si existen cesiones a laboratorios o aseguradoras. Ubicación de los datos (transferencias internacionales).
10. Newsletter: confirmar que la lista de Brevo sigue activa, quién es la cuenta titular y el texto de consentimiento del formulario. El sitio solo enlaza al formulario alojado por Brevo; no recoge datos.
11. Revisión jurídica de las tres páginas legales antes de la publicación oficial. El sitio no declara cumplimiento normativo completo.

## C. Contacto y horario
12. Confirmar que **+34 91 633 46 36 atiende por WhatsApp**. El chat flotante actual usa `34916334636` (correcto); el enlace del pie actual usaba `wa.me/916334636` (sin prefijo, corregido en la nueva versión).
13. Un artículo de 2026 («10 propósitos de año nuevo…») enlazaba a WhatsApp con otro número (**626 241 982**). Se ha sustituido por el canal confirmado; la clínica debe indicar si ese número es suyo y si debe mantenerse.
14. Confirmar el horario publicado y facilitar un **calendario de festivos, vacaciones y cierres** (se carga en `src/data/site.json` → `hoursExceptions`). Mientras no exista, el sitio indica el estado «según el horario habitual».
15. Destino de «Cómo llegar»: la web actual usaba el nombre antiguo «Clínica Dental Smile Boadilla» en Google Maps. La nueva versión usa la dirección postal. Si la clínica tiene ficha de Google Business con el nombre Airam, puede sustituirse por su enlace.

## D. Contenido clínico y publicidad sanitaria
16. Revisar y aprobar las **14 reformulaciones** de textos clínicos que evitaban promesas absolutas (dolor, «definitiva», «garantiza», 98 % sin fuente). Original y nuevo texto en `src/data/text-overrides.json` → `treatments`. El resto del contenido clínico se ha migrado sin cambios de fondo y también debe revisarlo la clínica antes de la publicación oficial.
17. Otras afirmaciones detectadas que se han mantenido pero conviene revisar: lista completa en `migration/claims-scan.json` (p. ej. «más rentables a largo plazo, a partir de unos 7 años»).
18. Opiniones de pacientes: confirmar que las tres son reales, que hay permiso para publicarlas y su fuente. Se muestran con el texto íntegro de la web actual y la mención «Opinión publicada en la web de la clínica», sin estrellas ni puntuaciones. Su uso en publicidad sanitaria debe valorarlo el asesor jurídico (RD 1907/1996 y código deontológico).
19. Páginas de campaña heredadas (`/especialistas-estetica-dental-madrid/`, `/implantes-cirugia-guiada/`): mantienen sus textos promocionales originales («¡Te regala…»). Confirmar si siguen vigentes.

## E. Blog
20. **44 imágenes** de artículos antiguos apuntaban al dominio antiguo `clinicadentalsmileboadilla.com` y ya no existen en ninguno de los dos dominios (también están rotas en la web actual). Se han retirado de los artículos migrados; listado en `migration/blog-imagenes-perdidas.json`. Si la clínica conserva los originales, pueden reincorporarse.
21. Dos archivos de artículos siguen alojados en `airamdental.com/wp-content/uploads/` (una imagen y un vídeo MP4). En la migración a producción hay que conservar esa carpeta o copiar esos archivos.
22. Enlaces internos antiguos dentro de artículos (rutas `/especialidades/...`, dominio de desarrollo `dev31.especialistasweb.es`, dominio antiguo) y un marcador `#URL-PENDIENTE` sin destino: corregidos o retirados; detalle en `migration/enlaces-legados-en-posts.json`. Las propias páginas de tratamiento de la web actual enlazan a `dev31.especialistasweb.es/contacto/` (error del sitio actual, corregido aquí).

## F. Acceso necesario para la publicación oficial
23. Acceso al alojamiento y al DNS de `airamdental.com` para publicar `dist/prod`, aplicar el `.htaccess` (redirecciones 301, 404, HTTPS) y dar de alta el sitemap en Google Search Console.
24. Decidir qué se hace con el WordPress actual (copia de seguridad completa antes de sustituirlo; la carpeta `wp-content/uploads` debe conservarse al menos temporalmente por los enlaces externos que apunten a archivos).
