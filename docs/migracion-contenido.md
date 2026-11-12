# Migración de contenido: airamdental.com → nueva web

Fuente: API REST de WordPress (98 entradas, 34 páginas, 317 medios) y HTML renderizado de cada página, extraídos el 12-11-2026 (`migration/wp-export/`). Comparación automática frase a frase en `docs/inventario-contenido.json` (`node tools/inventory-report.mjs`).

## Páginas migradas (misma URL salvo indicación)

| Página actual | Nueva | Contenido |
|---|---|---|
| `/` | `/` | Inicio con el diseño de la demo; texto de presentación, lema, especialidades, sedación, instalaciones, equipo, opiniones (íntegras), contacto y horario |
| `/especialidades/` | `/especialidades/` | Listado de las 10 especialidades + sedación consciente (separada como apoyo), lema y «Consejos a seguir post tratamiento» |
| `/implantologia/`, `/ortodoncia/`, `/odontopediatria/`, `/estetica-dental/`, `/blanqueamiento-dental/`, `/restauradora/`, `/endodoncia/`, `/protesis/`, `/cirugia-dental/`, `/periodoncia/`, `/sedacion-consciente/` | idénticas | Contenido íntegro reorganizado: lema, índice «En esta página», todas las secciones del acordeón original como apartados H2 (preguntas, indicaciones, etapas, ventajas, factores de precio…), imágenes, valoración individual, enlaces a recomendaciones, profesionales del área, otros tratamientos y contacto contextual con mensaje de WhatsApp por tratamiento. Implantología conserva sus seis temas: ¿Puedo ponerme un implante?, ¿Qué es un implante dental?, ¿Cómo se coloca?, Tipos de prótesis sobre implante, Ventajas y Factores que influyen en el precio |
| `/recomendaciones/` | `/recomendaciones/` | Índice de las 9 categorías del original + ortodoncia invisible |
| 10 subpáginas de recomendaciones (p. ej. `/cirugia-dental/recomendaciones-tras-una-extraccion-dental/`) | idénticas | Pautas íntegras; se añadió la única frase que solo figuraba en la página general («Puede ocurrir dolor post-operatorio…»). Cobertura verificada: 193 frases de la página general, 0 ausentes salvo el pie genérico (`migration/recomendaciones-cobertura.json`) |
| `/equipo/` | `/equipo/` | 10 integrantes con foto, función, descripción y cita; introducción «Profesionales de confianza» y los 6 valores con sus fotos |
| `/instalaciones/`, `/la-clinica/` | `/instalaciones/` (`/la-clinica/` → 301) | Texto de la clínica, galerías de 4 y 6 fotos con ampliación accesible, tecnología, «tu boca a boca» |
| `/contacto/` | `/contacto/` | Teléfono, WhatsApp, correo, dirección, horario con estado orientativo, mapa bajo demanda, ruta |
| `/noticias/` y `/noticias/page/2…10/` | idénticas | Archivo completo: 98 artículos (2017–2026), 10 por página, con fecha, imagen y extracto |
| 98 artículos `/noticias/<slug>/` | idénticas | Título, fecha de publicación y de actualización, imagen destacada, contenido, etiquetas, artículo anterior/siguiente; título y descripción SEO de Yoast |
| 74 etiquetas `/noticias/tag/<slug>/` | idénticas | Archivo por etiqueta |
| `/especialistas-estetica-dental-madrid/`, `/implantes-cirugia-guiada/` | idénticas | Textos de campaña íntegros |
| `/aviso-legal/`, `/politicadeprivacidad/`, `/politica-de-cookies/` | idénticas | Reescritas (los textos actuales citan dominios ajenos, «Belleepock», bases jurídicas incorrectas y fecha de 2018) |
| `/noticias/category/blog/`, autoras/autores, `/feed/` | 301 → `/noticias/` | Sin equivalente propio |

## Omisiones y cambios deliberados

| Elemento | Motivo | Registro |
|---|---|---|
| 14 frases clínicas reformuladas | Promesas absolutas (dolor, «definitiva», «garantiza», 98 % sin fuente) | `src/data/text-overrides.json` |
| Frases retiradas de las fichas del equipo | Superlativos, promesas y un dato personal | `src/data/text-overrides.json` → `team` |
| «Cualquier duda o consulta, acuda a la clínica…» y «Llámenos» repetidos | Sustituidos por el bloque de contacto común | — |
| Párrafo duplicado de /equipo/ con el nombre antiguo «Clínica Dental Smile» | Duplicado con nombre obsoleto | — |
| Frase de /instalaciones/ «…orientada a la excelencia… con total seguridad» y «resultados… de alta calidad» | Promesas absolutas; la información de equipamiento se conserva | — |
| 44 imágenes de artículos antiguos | Ya no existen en ningún dominio (rotas también en la web actual) | `migration/blog-imagenes-perdidas.json` |
| Enlaces antiguos dentro de artículos y de páginas de tratamiento (`/especialidades/...`, `dev31.especialistasweb.es`, dominio antiguo, `#URL-PENDIENTE`) | Destino inexistente; redirigidos a la página equivalente o retirados conservando el texto | `migration/enlaces-legados-en-posts.json` |
| Enlace de WhatsApp a 626 241 982 en un artículo de 2026 | Número distinto del canal confirmado | `docs/pendientes-clinica.md` |
| Textos legales antiguos | Contenían errores; reescritos con datos confirmados | `tools/legal.mjs` |

## Dependencias que siguen en airamdental.com
- Dos archivos enlazados desde artículos (`/wp-content/uploads/2018/03/encias-sanas.jpg`, `/wp-content/uploads/2017/09/VIDEO-DISNEY.mp4`). En producción, conservar `wp-content/uploads`.
- Ninguna imagen, fuente ni script del sitio se carga ya desde airamdental.com ni desde Google Fonts.
