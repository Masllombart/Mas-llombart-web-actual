# masllombart.com — web nueva (estática, sin WordPress)

> **Camino elegido: Lovable + GitHub + Supabase → ver `lovable/LOVABLE.md`.** Esta versión estática sirve como referencia exacta (HTML, SEO y diseño) para Lovable y como plan B desplegable en Netlify.

Web generada con Node (sin dependencias en producción): HTML estático + 1 CSS + 2 JS. Mismas URLs que la web WordPress actual, presupuestador 2027/2028 y cabeceras de seguridad.

## Estructura

```
src/build.mjs              → genera dist/ (todas las páginas, sitemap.xml, robots.txt)
src/data/precios.json      → precios de menús y extras 2027 y 2028 (sale de los dossiers)
src/data/calendario.json   → tarifa (1-4) y mínimo (0-6) de cada fecha 2027 y 2028
src/data/catalogo.json     → menús, platos, extras, canjes y packs
src/assets/                → CSS, JS, tipografías autoalojadas (Cormorant Garamond + Montserrat, licencia OFL)
docs/                      → dossiers PDF 2027 y 2028 (enlazados desde /presupuesto-online/)
scripts/descargar-imagenes.mjs → baja las fotos de la web actual con las MISMAS rutas y las recomprime
netlify.toml               → build, cabeceras de seguridad, redirecciones 301/410
```

## Puesta en marcha (orden importante)

1. **Antes de tocar DNS**, en tu Mac: `npm install && npm i -D sharp && node scripts/descargar-imagenes.mjs`. Crea `wp-content/uploads/...` y `static/favicon.png`. Si no lo haces antes de apagar WordPress, las fotos se pierden.
2. `node src/build.mjs` y abre `dist/` con cualquier servidor (`npx serve dist`) para revisarla.
3. Sube el proyecto a un repositorio de GitHub tuyo y conéctalo a Netlify (o arrastra `dist/`). Netlify lee `netlify.toml`: build, cabeceras y redirecciones.
4. En Netlify: dominio `masllombart.com` como **primario** y `www` como alias. Activa HTTPS (Let's Encrypt automático).
5. Formularios: Netlify → Forms → activa la detección de formularios y añade notificación por email a info@masllombart.com para `presupuesto` y `contacto`.
6. Cambia las DNS. No borres el WordPress hasta comprobar el punto siguiente.
7. Search Console: verifica la propiedad (por DNS), envía `https://masllombart.com/sitemap.xml` y revisa en 1-2 semanas el informe de páginas.

## Lo que se ha hecho para no perder SEO

- Las 6 URLs indexadas se mantienen idénticas, con barra final: `/`, `/la-masia/`, `/bodas-en-barcelona-mas-llombart/`, `/presupuesto-online/`, `/contactanos/`, `/cotizacion-empresas/` y `/politica-de-privacidad/`.
- Las fotos conservan su ruta `/wp-content/uploads/2025/06/...` (Google Imágenes no ve cambio).
- Textos originales mantenidos; solo se han añadido palabras clave donde faltaban y se ha corregido la jerarquía (1 solo H1 por página; antes había varios H1 sin palabra clave).
- `/contact-form/` y `/presupuestador-empresas/` → 301. Las entradas de demo del tema (`/2021/...` Queensland, Port Douglas…, `hello-world`), categorías, autor y feeds → **410** (dicen a Google que las olvide). Sitemaps de Yoast → 301 a `/sitemap.xml`.
- Titles corregidos donde eran malos: `bodas-mas-llombart - Masllombart`, `cotizacion-empresas - Masllombart` y La Masía (tenía el mismo title que la portada).
- Datos estructurados: EventVenue/LocalBusiness con dirección y teléfonos, WebSite, BreadcrumbList en todas las páginas, FAQPage en La Masía y Service en el presupuestador.
- Los precios detallados solo están en los dossiers PDF descargables (decisión de Javi); la página no muestra tabla de precios.

## Seguridad

- Sin WordPress, sin base de datos, sin panel de administración público: desaparece el 95% de la superficie de ataque (`/wp-admin`, `xmlrpc.php` y `wp-json` devuelven 410).
- CSP estricta (`script-src 'self'`, sin scripts inline ni de terceros), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP.
- Formularios con honeypot + filtro antispam de Netlify, límites de longitud y casilla de privacidad.
- Tipografías autoalojadas (Google Fonts desde Google es problema RGPD) y sin cookies → no hace falta banner.
- Vistas previas de Netlify con `X-Robots-Tag: noindex`.
- HSTS sin `includeSubDomains` a propósito: no sé si todos tus subdominios (eventos., correo) van por HTTPS. Cuando lo confirmes, se añade y se puede pedir el preload.

## Presupuestador

- La fecha decide año, tarifa (colores del dossier) y mínimo. Lunes/martes cerrados salvo los días pintados en el calendario.
- Menú 8 solo en Tarifa 4; menú 9 Viva la Vida solo en domingo.
- Solo computa para el mínimo la gastronomía (menús, infantil, profesionales, extras de aperitivo y discoteca). Si no se llega, muestra cuánto falta, factura el mínimo y ofrece **«Sugerir extras»** (combinación de extras que cubre el déficit con el menor exceso).
- Canjes de aperitivos del dossier: arroces (4 → precio reducido, 6 → gratis), carnes a la brasa (6 + precio en menús 1-6; 9 gratis en menús 4-6), quesos y embutidos (6 → gratis). Tope: 6 aperitivos en menús 1-3 y 12 en menús 4-7.
- Junto al total se muestra «Qué incluye este precio», adaptado al menú (el 9 tiene su lista propia), con la prueba de menú para 2, 4 o 6 personas según el importe y la ceremonia si se ha añadido.
- Packs Full Aperitivo y Full Discoteque bloquean sus componentes sueltos.
- Barra libre extra: precio × horas × máx(adultos, 50). Tasa SGAE/AGEDI de 250 € solo en 2028 (pregunta 52 del dossier).
- **Contacto por WhatsApp (acción principal del paso 5)**: botón «Nos gusta, queremos que nos contactéis» → abre WhatsApp de la pareja con un mensaje ya escrito para el 672 494 212: sus nombres, fecha, tarifa, invitados, desglose, total y el enlace al presupuesto exacto. Os llega desde SU número, así que respondéis en el mismo chat. Lo envía la pareja (pulsa enviar); una web no puede mandar WhatsApps sola sin la API de WhatsApp Business.
- Alternativa por email (desplegable): el formulario envía el desglose completo a Netlify Forms.
- La selección queda en la URL: el enlace reabre el presupuesto tal cual.

### Para actualizar precios o un año nuevo
Edita `src/data/precios.json` y añade el año en `calendario.json` (mismo formato `AAAA-MM-DD: tarifa`). En `presupuestador.js`, amplía `MAX_VISTA`. Rebuild y listo.

## Decisiones pendientes (revisar antes de publicar)

1. **Precios 2028**: uso los del PDF final (Menú 1: 172/156/149/149; Menú 8: 139 €; Menú 9: 111 €).
2. **2027, 23 de septiembre (jueves)**: en el PDF tiene mínimo 4 pero ninguna tarifa pintada. He puesto Tarifa 3.
3. **2027, 6, 7 y 8 de diciembre**: tienen Tarifa 4 pero ningún mínimo pintado. He puesto Mínimo 6 (7.500 €).
4. **Ceremonia 2027**: la página de extras dice 1.250 € y la FAQ 1.200 €. Uso 1.250 €.
5. **Contradicciones de la web actual** que he unificado: la página de empresas decía «siglo XVII» y «20 minutos»; el resto, «siglo XIV» y «15 minutos». He puesto XIV y 15 en todas.
6. **Aviso legal**: faltan los datos del Registro Mercantil (marcados como PENDIENTE).
7. `/presupuestador-empresas/` estaba protegida con contraseña: la redirijo a `/cotizacion-empresas/`. Si se usaba para algo interno, dímelo.
8. Menú 2026: el enlace apunta al PDF actual `/wp-content/uploads/2025/10/AFMasllombart2026casteTRZ.pdf`, que el script de descarga también copia.
