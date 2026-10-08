# Web Mas Llombart en Lovable + GitHub + Supabase

## Arquitectura

```
GitHub (repo único, fuente de verdad) ⇄ Lovable (edición y hosting) → masllombart.com
                                         │
                                         ▼
                     Supabase (el MISMO proyecto que la intranet)
   web_calendario · web_minimos · web_precios · web_catalogo  → los lee la web, los edita el personal
   presupuestos_web                                           → los escribe la web, los ve la intranet
```

- **La intranet sigue en eventos.masllombart.com** y lee `presupuestos_web` y edita precios y calendario. Cuando subáis las tarifas de 2029, se cambian en la intranet y la web se actualiza sola, sin tocar código.
- **El presupuestador** usa `src/lib/presupuesto.ts`, un motor sin React que ya está probado (`presupuesto.test.ts`, 8 casos con importes reales). Lovable solo tiene que pintar la interfaz.

## Pasos

1. **Supabase** (proyecto de la intranet), en el SQL Editor:
   1. Ejecuta `supabase/migrations/20261006000000_web_publica.sql`.
   2. Ejecuta `supabase/seed.sql` (calendario, mínimos y precios 2027-2028 y catálogo).
   3. Date el rol de personal: `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol":"personal"}' where email = 'TU_EMAIL';`. Haz lo mismo con Juan y Elisabet. Los novios que entran en la intranet NO tienen ese rol: no ven presupuestos ajenos ni pueden tocar precios.
2. **Lovable**: crea un proyecto **nuevo**. Los creados desde mayo de 2026 salen con renderizado en servidor; los antiguos son SPA y Google los ve peor. Conecta **GitHub** (Lovable crea el repo) y **Supabase** (el mismo proyecto de la intranet).
3. Sube a ese repo la carpeta de este kit (o pásamela y lo subo yo): `src/lib/presupuesto.ts`, `src/data/*.json` (respaldo si falla Supabase), `public/docs/*.pdf`, `public/fonts/*.woff2`, y las fotos en `public/wp-content/uploads/...` con las MISMAS rutas (salen de `scripts/descargar-imagenes.mjs`).
4. Pega en Lovable el **prompt** de abajo.
5. **Dominio**: masllombart.com en Lovable. Pon **Cloudflare** (gratis) delante para las redirecciones 301/410 y las cabeceras de seguridad (ver más abajo). No he podido confirmar que el hosting de Lovable permita configurarlas por sí mismo.
6. Search Console: envía el sitemap y vigila el informe de cobertura 2-3 semanas.

## Prompt para Lovable

```
Construye la web pública de Mas Llombart (masía para bodas en Sant Fost de Campsentelles, Barcelona).
Es la migración de una web WordPress con posicionamiento: las URLs, textos, titles y meta descriptions
deben ser EXACTAMENTE los de la carpeta de referencia `referencia-estatica/` (HTML ya generado).
Usa ese HTML y src/assets/css/site.css como especificación visual y de contenido.

RUTAS (con barra final, renderizadas en servidor, una sola H1 por página):
/  ·  /la-masia/  ·  /bodas-en-barcelona-mas-llombart/  ·  /presupuesto-online/  ·  /contactanos/
/cotizacion-empresas/  ·  /politica-de-privacidad/  ·  /aviso-legal/  ·  /politica-de-cookies/  ·  /gracias/ (noindex)
Cada ruta: <title>, meta description, canonical https://masllombart.com/<ruta>, Open Graph y el JSON-LD
que aparece en el HTML de referencia. Genera /sitemap.xml y /robots.txt iguales a los de referencia.
Imágenes: rutas /wp-content/uploads/... sin cambiar nombres, con width/height y loading="lazy" salvo la del hero.
Tipografías autoalojadas (public/fonts), nada de Google Fonts ni scripts de terceros. Sin cookies ni analítica.

PRESUPUESTADOR (/presupuesto-online/):
- Lógica: usa SOLO src/lib/presupuesto.ts (no reescribas reglas ni precios). Datos: lee de Supabase
  web_calendario, web_minimos, web_precios y web_catalogo y conviértelos con datosDesdeSupabase().
  Si Supabase falla, usa src/data/*.json.
- Pasos: 1) calendario mensual (2027-2028) con cada día disponible coloreado por tarifa
  (T1 #8CC152, T2 #9B8EC7, T3 #A9CCE8, T4 #F2B134), los demás deshabilitados; al elegir, muestra fecha
  larga, tarifa y mínimo. 2) adultos, niños, profesionales. 3) menús en tarjetas con precio (menuDisponible()
  explica por qué uno no está disponible) y desplegable de platos. 4) extras agrupados (aperitivo, discoteca,
  servicios) con variantes, canjes (canjesValidos), horas, bloqueo por pack y requisito.
- Panel de precio fijo a la derecha (abajo en móvil): líneas, barra de progreso hacia el mínimo, aviso con
  botón «Sugerir extras» (sugerirExtras) si falta, TOTAL y precio por adulto y, JUSTO DEBAJO DEL TOTAL, la lista
  «Qué incluye este precio» (resultado.incluidos), siempre visible.
- Guarda la selección en la URL con aQuery()/desdeQuery() para que el enlace reabra el presupuesto.
- Paso 5 «¿Os gusta? Hablamos»: campo nombres y botón principal verde «Nos gusta, queremos que nos
  contactéis» = <a href={enlaceWhatsapp(...)} target="_blank">. Al pulsarlo, ANTES inserta en Supabase
  presupuestos_web {canal:'whatsapp', nombre, fecha_boda, adultos, ninos, profesionales, menu, total,
  desglose: resultado.lineas, enlace}. Debajo, desplegable «¿Preferís recibirlo por email?» con formulario
  (nombre, teléfono, email, mensaje, casilla de privacidad, campo honeypot oculto) que inserta con canal 'email'.
- No muestres tablas de precios en la página: el detalle está en los PDF descargables (public/docs).

SEGURIDAD: nada de claves de servicio en el cliente (solo la anon key). Valida longitudes en cliente.
```

## Cloudflare delante de Lovable (redirecciones y cabeceras)

**Redirect Rules / Bulk redirects (301):**
- `www.masllombart.com/*` → `https://masllombart.com/${1}`
- `/contact-form/` → `/contactanos/`
- `/presupuestador-empresas/` → `/cotizacion-empresas/`
- `/sitemap_index.xml` y `/page-sitemap.xml` → `/sitemap.xml`
- `/wp-content/uploads/2025/06/Masllombart2025.pdf` → `/docs/dossier-bodas-2027-mas-llombart.pdf`

**410 (WAF → Custom rule → Block con respuesta personalizada 410)**: rutas que empiezan por `/2021/`, `/2025/05/`, `/category/`, `/author/`, `/feed`, `/comments/feed`, `/wp-admin`, `/wp-login.php`, `/xmlrpc.php`, `/wp-json`, `/post-sitemap.xml`, `/category-sitemap.xml`, `/author-sitemap.xml`.

**Transform Rules → Modify response header (todas las rutas):**
- `Strict-Transport-Security: max-age=31536000`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Content-Security-Policy`: empieza en modo `Content-Security-Policy-Report-Only` con
  `default-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`
  y pásala a obligatoria cuando no salgan avisos en la consola. Lovable puede meter scripts o estilos inline.

## Antispam de los presupuestos

La migración limita a 20 inserciones por minuto y las longitudes de cada campo. Si aparece spam, el siguiente paso es una Edge Function con Cloudflare Turnstile que haga la inserción. Te lo preparo si hace falta.
