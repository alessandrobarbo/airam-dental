# Mapa de URL y redirecciones para producción

Detalle completo, URL por URL: `docs/mapa-urls.csv` (generado por `tools/build.mjs`).

## Resumen

| Origen | URL | Resultado |
|---|---|---|
| Sitemap actual (Yoast) + `/la-clinica/` + paginación del blog | 218 | **213** se mantienen en la misma ruta (200), **5** con redirección 301 específica, **0** sin destino |
| Rutas antiguas enlazadas desde artículos y páginas (no estaban en el sitemap) | 13 | 301 a la página equivalente (p. ej. `/especialidades/estetica/` → `/estetica-dental/`) |
| Rutas técnicas de WordPress | `/inicio/`, `/feed/`, `/noticias/feed/` | 301 a `/` o `/noticias/` |

Ninguna URL se envía de forma genérica a la página de inicio.

## Redirecciones 301 (sin equivalente en la misma ruta)

| URL actual | Destino |
|---|---|
| `/la-clinica/` | `/instalaciones/` |
| `/noticias/category/blog/` | `/noticias/` |
| `/noticias/autora/maria-de-luis-marcos/` | `/noticias/` |
| `/noticias/author/clinica/` | `/noticias/` |
| `/noticias/author/especialistasweb/` | `/noticias/` |
| `/inicio/` | `/` |
| `/feed/`, `/noticias/feed/` | `/noticias/` |
| 13 rutas antiguas `/especialidades/<…>/` y similares | página de tratamiento correspondiente (lista en `dist/prod/.htaccess`) |

## Configuración de producción (`node tools/build.mjs prod` → `dist/prod`)
- `<link rel="canonical">` a `https://airamdental.com/…` en cada página; sin `noindex`.
- `robots.txt` con `Allow: /` y `Sitemap: https://airamdental.com/sitemap.xml`.
- `sitemap.xml` con 226 URL (páginas reales; sin redirecciones ni 404).
- `.htaccess` (Apache): `ErrorDocument 404 /404.html`, las 21 redirecciones 301 y forzado de HTTPS sin `www`.
- Metadatos Open Graph con imágenes absolutas del dominio oficial; datos estructurados `Dentist` (inicio), `MedicalWebPage` (tratamientos), `BlogPosting` (artículos) y `BreadcrumbList`, solo con datos verificados y sin valoraciones agregadas.

## Demo (`dist/demo`)
- `noindex, nofollow` en todas las páginas y `robots.txt` con `Disallow: /`; sin canonical ni sitemap.
- Franja «Propuesta de rediseño. Versión de demostración…» y aviso del operador de la demo en las páginas legales.
- Todas las rutas son relativas: no hay dependencias del dominio de la demo, y el mismo código funciona en la raíz de airamdental.com.

## Pasos de la migración a producción
1. Copia de seguridad completa del WordPress actual (archivos y base de datos).
2. Publicar el contenido de `dist/prod` en la raíz del dominio, conservando `wp-content/uploads/`.
3. Comprobar las 218 URL del CSV (200 o 301 según la tabla) y los 21 redirecciones.
4. Enviar `sitemap.xml` en Google Search Console y vigilar los errores de cobertura durante las semanas siguientes.
