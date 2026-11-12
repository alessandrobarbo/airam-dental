# Clínica Dental Airam — nueva web

Sitio estático generado a partir de datos (sin CMS ni dependencias en el navegador). Reúne el diseño de la demo con todo el contenido de la web actual (airamdental.com): 11 páginas de tratamiento, 10 recomendaciones, 98 artículos del blog con sus etiquetas y paginación, equipo, instalaciones, contacto y páginas legales, en las **mismas URL** que la web actual.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/index.html` | Página de inicio (diseño propio, con marcadores que rellena el build) |
| `src/data/` | Datos centralizados: `site.json` (contacto, horario, excepciones, dominios), `team.json`, `treatments.json`, `recommendations.json`, `blog.json`, `gallery.json`, `landings.json`, `text-overrides.json` |
| `src/css`, `src/js`, `src/fonts`, `src/img`, `src/partials` | Estilos, comportamiento, tipografía Maven Pro autoalojada, imágenes originales, iconos |
| `tools/` | `import-wp.mjs` (migración desde WordPress), `build.mjs` (generador), `legal.mjs`, `check.mjs` (enlaces y estructura), `test-browser.mjs` (anchos, teclado, accesibilidad, cookies), `perf.mjs` (Lighthouse), `serve.mjs` |
| `migration/` | Exportación de WordPress (REST API) e informes de migración |
| `docs/` | Matriz de criterios, mapa de URL, inventario, pendientes de la clínica, resultados de pruebas |

## Uso

```bash
npm install
node tools/build.mjs demo   # dist/demo: noindex, franja de demostración
node tools/build.mjs prod   # dist/prod: canonical, sitemap.xml, robots.txt, .htaccess con 301
node tools/check.mjs demo   # comprobación estática
node tools/serve.mjs demo 5179   # vista previa en http://localhost:5179
```

Para volver a importar el contenido de WordPress: `node tools/import-wp.mjs` (sobrescribe `src/data/treatments.json`, `recommendations.json`, `landings.json` y `blog.json`; después `node tools/patch-recs.mjs`).

## Publicación

- **Demo**: el contenido de `dist/demo` se publica en la rama `demo`, que el Git de cPanel despliega en `https://climbahia.com.br/demo-airam/`.
- **Producción**: publicar `dist/prod` en la raíz de `airamdental.com` cuando la clínica haya validado `docs/pendientes-clinica.md`. No publicar `dist/demo` en producción ni `dist/prod` en la demo.
