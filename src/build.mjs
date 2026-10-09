// Generador estático de masllombart.com — sin dependencias.
// Uso:  node src/build.mjs            → dist/ para producción (imágenes en /wp-content/uploads)
//       IMG_BASE=https://masllombart.com/wp-content/uploads node src/build.mjs   → vista previa con fotos de la web actual
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const SITIO = 'https://masllombart.com';
const IMG_BASE = process.env.IMG_BASE || '/wp-content/uploads';
const HOY = new Date().toISOString().slice(0, 10);
const leer = (p) => JSON.parse(readFileSync(join(RAIZ, 'src/data', p), 'utf8'));
const precios = leer('precios.json'), calendario = leer('calendario.json'), catalogo = leer('catalogo.json');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (ruta) => `${IMG_BASE}/${ruta}`;
const eur = (n) => { const r = Math.round(n * 100) / 100, e = Math.floor(r), d = Math.round((r - e) * 100); return String(e).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + String(d).padStart(2, '0') : '') + '\u00a0€'; };

const TEL = [
  { nombre: 'Javi', tel: '672 494 212' },
  { nombre: 'Juan', tel: '664 563 403' },
  { nombre: 'Elisabet', tel: '611 821 360' },
];
const telHref = (t) => 'tel:+34' + t.replace(/\s/g, '');
// Intranet de novios. Cambiar a https://eventos.masllombart.com cuando ese dominio apunte a Netlify.
const INTRANET = 'https://masllombart-intranet.netlify.app';
const WA = 'https://api.whatsapp.com/send?phone=34672494212&text=' + encodeURIComponent('Hola, vengo de la web de Mas Llombart y me gustaría información para nuestra boda.');
const IG = 'https://www.instagram.com/masllombart/';
const MAPA = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Mas Llombart, Avinguda de la Conreria 16, 08105 Sant Fost de Campsentelles');

const SVG = {
  wa: '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
  ig: '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM21.9 7a6 6 0 0 0-1.6-4.2A6 6 0 0 0 16 1.1C14.4 1 9.6 1 8 1.1a6 6 0 0 0-4.2 1.6A6 6 0 0 0 2.1 7C2 8.6 2 15.4 2.1 17a6 6 0 0 0 1.6 4.2A6 6 0 0 0 8 22.9c1.6.1 6.4.1 8 0a6 6 0 0 0 4.2-1.6 6 6 0 0 0 1.6-4.2c.1-1.6.1-8.4 0-10zm-2.1 12a3.3 3.3 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.7.4s-4.4.1-5.7-.4A3.3 3.3 0 0 1 4.8 19c-.5-1.3-.4-4.3-.4-5.7s-.1-4.4.4-5.7A3.3 3.3 0 0 1 6.6 5.8C7.9 5.3 10.9 5.4 12.3 5.4s4.4-.1 5.7.4a3.3 3.3 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.7s.1 4.4-.4 5.7z"/></svg>',
  user: '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>',
  menu: '<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>',
};

/* ---------- Schema.org ---------- */
const NEGOCIO = {
  '@type': ['EventVenue', 'LocalBusiness'],
  '@id': SITIO + '/#negocio',
  name: 'Mas Llombart',
  alternateName: 'Masia Mas Llombart',
  description: 'Masía catalana del siglo XIV para bodas exclusivas a 15 minutos de Barcelona, con cocina propia, ceremonia al aire libre con plan B interior y un único evento al día.',
  url: SITIO + '/',
  logo: SITIO + '/wp-content/uploads/2025/06/Logo.jpg',
  image: [SITIO + '/wp-content/uploads/2025/06/massllombart-novios.jpg', SITIO + '/wp-content/uploads/2025/06/ceremonia-exterior-mas-llombart-jardin.jpeg'],
  telephone: '+34672494212',
  email: 'info@masllombart.com',
  priceRange: '€€€',
  address: { '@type': 'PostalAddress', streetAddress: 'Avinguda de la Conreria, 16', postalCode: '08105', addressLocality: 'Sant Fost de Campsentelles', addressRegion: 'Barcelona', addressCountry: 'ES' },
  hasMap: MAPA,
  areaServed: ['Barcelona', 'Maresme', 'Vallès Oriental', 'Badalona'],
  maximumAttendeeCapacity: 210,
  sameAs: [IG],
  contactPoint: TEL.map((t) => ({ '@type': 'ContactPoint', telephone: '+34' + t.tel.replace(/\s/g, ''), contactType: 'sales', name: t.nombre, availableLanguage: ['es', 'ca'] })),
};
const WEB = { '@type': 'WebSite', '@id': SITIO + '/#web', url: SITIO + '/', name: 'Mas Llombart', inLanguage: 'es-ES', publisher: { '@id': SITIO + '/#negocio' } };

function migas(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITIO + u })),
  };
}

/* ---------- Plantilla ---------- */
const NAV = [
  ['/', 'Inicio'], ['/la-masia/', 'La Masía'], ['/bodas-en-barcelona-mas-llombart/', 'Bodas en Barcelona'], ['/presupuesto-online/', 'Presupuesto online'], ['/contactanos/', 'Contáctanos'], ['/cotizacion-empresas/', 'Empresas'],
];

function layout(p) {
  const url = SITIO + p.ruta;
  const grafo = { '@context': 'https://schema.org', '@graph': [NEGOCIO, WEB, { '@type': 'WebPage', '@id': url + '#pagina', url, name: p.titulo, description: p.descripcion, isPartOf: { '@id': SITIO + '/#web' }, about: { '@id': SITIO + '/#negocio' }, inLanguage: 'es-ES', ...(p.imagenOg ? { primaryImageOfPage: SITIO + '/wp-content/uploads/' + p.imagenOg } : {}) }, ...(p.migas ? [migas(p.migas)] : []), ...(p.schema || [])] };
  const og = SITIO + '/wp-content/uploads/' + (p.imagenOg || '2025/06/massllombart-novios.jpg');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.titulo)}</title>
<meta name="description" content="${esc(p.descripcion)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">
<meta property="og:locale" content="es_ES">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mas Llombart">
<meta property="og:title" content="${esc(p.ogTitulo || p.titulo)}">
<meta property="og:description" content="${esc(p.ogDescripcion || p.descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F4ECE2">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/cormorant-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
${p.heroImg ? `<link rel="preload" as="image" href="${img(p.heroImg)}" fetchpriority="high">` : ''}
<link rel="stylesheet" href="/assets/css/site.css?v=${HOY}">
<script type="application/ld+json">${JSON.stringify(grafo).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
<header class="cabecera">
  <div class="contenedor">
    <button class="boton-menu" type="button" aria-controls="panel-menu" aria-expanded="false" aria-label="Abrir menú">${SVG.menu}</button>
    <a class="logo" href="/" aria-label="Mas Llombart, ir a inicio"><img src="${img('2025/06/Logo-removebg-preview.png')}" alt="Mas Llombart" width="72" height="72"></a>
    <div class="acciones-cab">
      <a href="${IG}" aria-label="Instagram de Mas Llombart" rel="noopener" target="_blank">${SVG.ig.replace('class="icono"', 'class="icono icono-sm"')}</a>
      <a href="${WA}" aria-label="Escribir por WhatsApp" rel="noopener" target="_blank">${SVG.wa.replace('class="icono"', 'class="icono icono-sm"')}</a>
      <a href="${INTRANET}" aria-label="Área de novios" rel="noopener">${SVG.user}</a>
    </div>
  </div>
  ${p.migas && p.ruta !== '/' ? `<nav class="migas contenedor" aria-label="Migas de pan"><ol>${p.migas.map(([n, u], i) => i === p.migas.length - 1 ? `<li aria-current="page">${n}</li>` : `<li><a href="${u}">${n}</a></li>`).join('')}</ol></nav>` : ''}
</header>
<nav class="panel-menu" id="panel-menu" aria-label="Principal" aria-hidden="true">
  <button class="cerrar" type="button" aria-label="Cerrar menú">×</button>
  <ul>${NAV.map(([u, t]) => `<li><a href="${u}"${u === p.ruta ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul>
  <div class="redes"><a href="${IG}" target="_blank" rel="noopener" aria-label="Instagram">${SVG.ig}</a><a href="${WA}" target="_blank" rel="noopener" aria-label="WhatsApp">${SVG.wa}</a></div>
</nav>
<div class="velo" id="velo" hidden></div>
<main id="contenido">
${p.cuerpo}
</main>
${pie()}
<a class="whatsapp-flotante" href="${WA}" target="_blank" rel="noopener" aria-label="Chatear por WhatsApp">${SVG.wa}</a>
<script src="/assets/js/site.js?v=${HOY}" defer></script>
${p.scripts || ''}
</body>
</html>
`;
}

function pie() {
  return `<footer class="pie">
  <div class="contenedor">
    <div class="rejilla">
      <div>
        <p class="cierre">Permítenos ser quienes hagan realidad la boda de tus sueños.</p>
        <a class="boton-wa-pie" href="${WA}" target="_blank" rel="noopener">${SVG.wa} Chat on WhatsApp</a>
      </div>
      <div>
        <h2>Menú</h2>
        <ul>${NAV.map(([u, t]) => `<li><a href="${u}">${t}</a></li>`).join('')}<li><a href="/politica-de-privacidad/">Política de Privacidad</a></li></ul>
      </div>
      <div>
        <h2>Contáctanos</h2>
        <ul>
          <li>✉️ <a href="mailto:info@masllombart.com">info@masllombart.com</a></li>
          ${TEL.map((t) => `<li>📞 Teléfono ${t.nombre}: <a href="${telHref(t.tel)}">${t.tel}</a></li>`).join('')}
          <li>📍 <a href="${MAPA}" target="_blank" rel="noopener">Avda. De la Conreria, 16<br>08105 Sant Fost de Campsentelles, Barcelona</a></li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <span>© ${new Date().getFullYear()} Mas Llombart · Sinsofood 1996, S.L.</span>
      <span><a href="/aviso-legal/">Aviso legal</a> · <a href="/politica-de-privacidad/">Privacidad</a> · <a href="/politica-de-cookies/">Cookies</a></span>
    </div>
  </div>
</footer>`;
}

const foto = (ruta, alt, cls = '', carga = 'lazy') => `<figure class="foto ${cls}"><img src="${img(ruta)}" alt="${esc(alt)}" loading="${carga}" decoding="async" width="1200" height="800"></figure>`;
const hero = (ruta, alt, interior) => `<section class="hero"><img class="fondo" src="${img(ruta)}" alt="${esc(alt)}" fetchpriority="high" decoding="async" width="2000" height="1333"><div class="contenido"><div class="texto">${interior}</div></div></section>`;
const tituloXL = (grande, sub1, sub2) => `<div class="contenedor bloque-titulo"><h2 class="titulo-xl">${grande}</h2>${sub1 ? `<p class="titulo-sub">${sub1}</p>` : ''}${sub2 ? `<p class="titulo-xl titulo-sub2">${sub2}</p>` : ''}</div>`;
const ICONOS = {
  plato: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 20h22M7 20a9 9 0 0 1 18 0M16 9V7M4 24h24"/></svg>',
  chef: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="M11 18v8h10v-8M10 18a5 5 0 1 1 3-9 4 4 0 0 1 6 0 5 5 0 1 1 3 9z"/></svg>',
  hoja: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 26C6 14 14 6 26 6c0 12-8 20-20 20zM6 26l12-12"/></svg>',
  medalla: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="19" r="7"/><path d="M11 4l5 8 5-8M16 16v6"/></svg>',
  contrato: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4h12l5 5v19H8zM12 14h9M12 18h9M12 22h5"/></svg>',
  masia: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 15 16 6l12 9M7 13v13h18V13M13 26v-7h6v7"/></svg>',
  estrella: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 4 3.6 7.6 8.4 1-6.2 5.8 1.6 8.3L16 22.6l-7.4 4.1 1.6-8.3L4 12.6l8.4-1z"/></svg>',
  copa: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="M10 4h12l-1 9a5 5 0 0 1-10 0zM16 18v8M11 28h10"/></svg>',
  pantalla: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="6" width="24" height="15" rx="1"/><path d="M12 26h8M16 21v5"/></svg>',
  descarga: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5v15M10 14l6 6 6-6M5 25h22"/></svg>',
  grupo: '<svg class="icono-l" viewBox="0 0 32 32" aria-hidden="true"><circle cx="11" cy="11" r="4"/><circle cx="22" cy="12" r="3"/><path d="M3 26c0-5 4-8 8-8s8 3 8 8M19 26c0-4 2-7 5-7s5 2 5 6"/></svg>',
};

/* ---------- Bandas oscuras reutilizadas ---------- */
const bandaContacto = (txt = 'En Sant Fost de Campsentelles') => `<section class="banda">
  <img class="fondo" src="${img('2025/06/massllombart-novios-noche-jardin.jpeg')}" alt="" loading="lazy" decoding="async">
  <div class="contenido">
    <span class="antetitulo">Contáctanos</span>
    <h2>Celebra tu boda en una masía con alma,<br>${txt}<br>( Barcelona )</h2>
    <p>Mas Llombart no es solo una masía para bodas. Es un lugar donde se celebran emociones reales, con estilo, con alma… y con una cocina que habla por sí sola.</p>
    <a class="boton azul" href="/contactanos/">Agenda tu visita</a>
  </div>
</section>`;
const bandaPresupuesto = `<section class="banda">
  <img class="fondo" src="${img('2025/06/masslombart-luces-mesas-boda.jpeg')}" alt="" loading="lazy" decoding="async">
  <div class="contenido">
    <span class="antetitulo">Presupuestador online</span>
    <h2>Presupuesto de boda online<br>Calcula tu día perfecto</h2>
    <p>Con nuestro presupuestador online podéis obtener una estimación personalizada de forma rápida y sencilla, con los precios reales de 2027 y 2028. Solo tenéis que elegir la fecha, los invitados y el menú que más se ajuste a vuestro estilo.</p>
    <a class="boton azul" href="/presupuesto-online/">Haz tu presupuesto ahora</a>
  </div>
</section>`;

/* ---------- Páginas ---------- */
const paginas = [];

// INICIO
paginas.push({
  ruta: '/', archivo: 'index.html',
  titulo: 'Masía para Bodas Exclusivas en Barcelona | Mas Llombart',
  ogTitulo: 'Mas Llombart – Masía para Bodas Exclusivas en Barcelona',
  descripcion: 'Descubre Mas Llombart, una masía histórica para bodas exclusivas en Barcelona. Gastronomía propia, naturaleza y emoción a solo 15 min de la ciudad.',
  heroImg: '2025/06/massllombart-novios.jpg', imagenOg: '2025/06/massllombart-novios.jpg',
  cuerpo: `${hero('2025/06/massllombart-novios.jpg', 'Novio poniendo el anillo a la novia en una boda en Mas Llombart, masía para bodas en Barcelona', `
    <span class="lema">Aquí no hablamos solo de bodas.</span>
    <h1 class="h1-pequena">Hablamos de abrazos que no se olvidan, de lágrimas que valen oro y de miradas que lo dicen todo.</h1>
    <p class="sub">No es lo que somos, es lo que te hacemos sentir.</p>
    <a class="boton blanco" href="/la-masia/">Conocer más</a>
    <span class="sr-only">Mas Llombart, masía para bodas exclusivas en Barcelona</span>`)}

<section id="ceremonias">
  ${tituloXL('Ceremonias', 'Ceremonia al aire libre o interior…', 'Siempre inolvidable')}
  <div class="contenedor dos-col arriba">
    ${foto('2025/06/ceremonia-exterior-mas-llombart-jardin.jpeg', 'Ceremonia de boda al aire libre en el jardín de Mas Llombart', 'vertical desplaza', 'eager')}
    <div>
      <p class="texto-serif justif">Imagina caminar descalzo entre suspiros, por un pasillo de plantas vivas que te lleva al corazón de este claro. Bajo un techo de luces cálidas, rodeado de naturaleza y miradas cómplices, el “sí, quiero” suena distinto.</p>
      <p class="texto-serif">Aquí, cada hoja se convierte en testigo y cada rayo de sol bendice el momento.</p>
      <p class="cita centro">Este es nuestro plan A: una ceremonia en exterior donde todo florece, incluso los nervios más bonitos.</p>
      ${foto('2025/06/massllombart-ceremonia-aire-libre-boda.jpeg', 'Pasillo de ceremonia al aire libre con guirnaldas de luces en Mas Llombart', 'vertical')}
    </div>
  </div>
</section>

<section class="seccion">
  <div class="contenedor dos-col arriba">
    <div>
      <p class="texto-serif">Pero si el cielo decide llorar de emoción ese día, no hay por qué preocuparse.</p>
      <p class="texto-serif justif">Nuestro plan B es un espacio acristalado, con vistas a cascadas que parecen salidas de un sueño y techos de madera que arropan cada palabra con calidez. La lluvia no arruina nada, simplemente le da otra textura a los recuerdos.</p>
      ${foto('2025/06/masllombart-ceremonia-jardin-techo-luces-cascada.jpeg', 'Espacio de ceremonia interior con techo de madera, luces y cascada en Mas Llombart')}
    </div>
    ${foto('2025/06/masslombart-luces-mesas-boda.jpeg', 'Mesas del banquete de boda bajo un techo de luces en Mas Llombart', 'vertical desplaza')}
  </div>
</section>

<section class="frase">
  <div class="estrecho">
    <p class="grande">Porque, pase lo que pase,<br>vas a vivir un día <span class="subraya amarillo">precioso.</span></p>
    <p class="media">Y lo más importante de todo:</p>
    <p class="media">No es lo que somos, <span class="subraya amarillo">es lo que te hacemos sentir.</span></p>
  </div>
</section>

${bandaPresupuesto}

<section id="gastronomia" class="seccion">
  ${tituloXL('Gastronomía', 'Gastronomía que emociona. Sabor que recuerda.')}
  <div class="estrecho centro">
    <p class="u18 frase grande">En Mas Llombart, la cocina no es un añadido…</p>
    <p class="u19 frase grande">es parte esencial de la <span class="resalta">experiencia.</span></p>
  </div>
  <div class="contenedor dos-col arriba">
    <p class="justif">Desde el primer pan recién horneado hasta el último bocado del pastel nupcial, todo lo elaboramos nosotros. Aquí no hay atajos: amasamos, cocemos, creamos y reinventamos cada plato desde cero. Pasteles, helados, snacks, fondos, salsas… todo lleva nuestro sello.</p>
    <div>
      <p class="justif">Ofrecemos una cocina de autor moderna, con alma mediterránea y técnica contemporánea, pensada para adaptarse a la diversidad real que hoy define un gran banquete.</p>
      <p class="justif">Atendemos opciones veganas, vegetarianas, sin gluten y menús especiales para personas con alergias o intolerancias, sin perder un ápice de sabor ni presentación.</p>
    </div>
  </div>
  <div class="contenedor">
    <p class="u20 frase grande"><span class="subraya negro">Porque un gran día merece una gran mesa.</span></p>
    <div class="trio">
      ${foto('2025/06/masllombart-buffet-boda-barcelona.jpeg', 'Buffet de quesos y frutas en una boda en Mas Llombart, Barcelona')}
      ${foto('2025/06/masllombart-mesa-charcuteria-boda-barcelona.jpeg', 'Mesa de charcutería artesanal en una boda en Mas Llombart, Barcelona', 'centro-alta')}
      ${foto('2025/06/masllombart-postres-caseros-boda-barcelona.jpeg', 'Postres caseros individuales en una boda celebrada en Mas Llombart, Barcelona')}
    </div>
  </div>
</section>

${bandaContacto()}

<section id="reconocimientos" class="seccion">
  ${tituloXL('Reconocimientos', '<span class="subraya negro">Reconocimientos que avalan, parejas que confían</span>')}
  <div class="contenedor dos-col">
    ${foto('2025/06/massllombart-novios-ramo-boda.jpg', 'Novios abrazados bajo el velo en una boda en Mas Llombart')}
    <div class="justif">
      <p>Desde 2015, Mas Llombart ha estado <strong>entre los 3 espacios de bodas más recomendados de toda España,</strong> y eso no ocurre por casualidad.</p>
      <p>Hemos recibido premios del sector, pero lo que más valoramos es tener una <strong>valoración de 5 sobre 5</strong> gracias a quienes de verdad importan: las parejas que han confiado en nosotros para vivir su día más especial.</p>
      <p>Trabajamos con cercanía, sin rodeos, y con una seguridad contractual que da tranquilidad desde el primer minuto.</p>
      <p>Porque cuando sabes que estás en buenas manos, solo queda disfrutar. <a href="/la-masia/">Conoce la masía</a>.</p>
    </div>
  </div>
</section>`,
});

// LA MASÍA
const FAQ_MASIA = [
  ['¿Dónde se ubica Mas Llombart?', 'Mas Llombart se encuentra en Sant Fost de Campsentelles, a aproximadamente 15 minutos de Barcelona.'],
  ['¿Qué tipo de evento se celebra en Mas Llombart?', 'Mas Llombart está especializado en bodas exclusivas y personalizadas, transformando cada celebración en algo único.'],
  ['¿Cuántos eventos realizan al día?', 'Solo se celebra un evento por día para garantizar la exclusividad y que el equipo dedique toda la atención a los novios.'],
  ['¿Qué tipo de gastronomía ofrecen?', 'Ofrecemos gastronomía de autor elaborada en casa: panes, pasteles, sorbetes y helados propios. Los menús se adaptan con opciones para invitados veganos, vegetarianos, sin gluten o con alergias.'],
  ['¿El lugar tiene jardines o espacios exteriores?', 'Sí, la finca cuenta con más de 5.500 m² de jardines que sirven de escenario natural para las celebraciones.'],
  ['¿Qué capacidad tiene la masía?', 'Disponemos de dos salones: el salón panorámico, con capacidad para 210 comensales, y el salón tradicional, para 140 personas.'],
  ['¿Tenéis parking?', 'Sí, junto a la masía tenemos un parking privado y gratuito para nuestros clientes.'],
  ['¿Cómo puedo contactar con Mas Llombart para más información?', 'Puedes contactar mediante el formulario de contacto de la web, por correo electrónico a info@masllombart.com o llamando a los números 672 494 212, 664 563 403 o 611 821 360.'],
];
paginas.push({
  ruta: '/la-masia/', archivo: 'la-masia/index.html',
  titulo: 'Masía del siglo XIV para bodas en Barcelona | Mas Llombart',
  descripcion: 'Mas Llombart, masía catalana del siglo XIV con 5.500 m² de jardines a 15 minutos de Barcelona. Bodas personalizadas, un único evento al día y cocina propia.',
  heroImg: '2025/06/masllombart-novia-vestido-frente-al-espejo-jardin.jpeg', imagenOg: '2025/06/masllombart-novia-vestido-frente-al-espejo-jardin.jpeg',
  migas: [['Portada', '/'], ['La Masía', '/la-masia/']],
  schema: [{ '@type': 'FAQPage', mainEntity: FAQ_MASIA.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
  cuerpo: `${hero('2025/06/masllombart-novia-vestido-frente-al-espejo-jardin.jpeg', 'Novia con su vestido frente a la cristalera del jardín de Mas Llombart', `
    <h1>Mas Llombart<span class="u0 h1-pequena">una masía con historia,<br>para bodas inolvidables en Barcelona</span></h1>`)}
<section class="seccion">
  <div class="contenedor dos-col">
    ${foto('2025/06/masllombart-boda-jardin.jpeg', 'Pasillo de boda entre setos en el jardín de Mas Llombart')}
    <p class="justif">A tan solo 15 minutos de Barcelona, en el encantador municipio de Sant Fost de Campsentelles, se encuentra <strong>Mas Llombart</strong>, una auténtica masía catalana del siglo XIV que ha sido restaurada con sensibilidad y buen gusto, fusionando la esencia histórica con una estética moderna, natural y minimalista. Cada rincón respira romanticismo y calma. Rodeada de más de 5.500 m² de jardines, esta finca ha sido testigo de siglos de vida, y hoy se convierte en el escenario perfecto para celebrar bodas exclusivas y llenas de emoción.</p>
  </div>
  <div class="u13 contenedor dos-col invertida">
    ${foto('2025/06/masllombart-ceremonia-nocturna-exterior-si-quiero.jpeg', 'Ceremonia nocturna al aire libre con guirnaldas de luces en Mas Llombart')}
    <div class="justif">
      <p>En Mas Llombart, vuestra historia de amor se convierte en una celebración a medida. Diseñamos <strong>bodas personalizadas</strong>, adaptadas a vuestro estilo, con un solo objetivo: que cada pareja viva un día único e irrepetible. Y por eso, solo celebramos un evento por día, garantizando total exclusividad y la atención completa de nuestro equipo.</p>
      <p>Nuestra gastronomía de autor es uno de los grandes pilares. Elaboramos todo en casa —panes, pasteles, sorbetes, helados— con productos frescos y de calidad. Disponemos de menús tradicionales, menús de aperitivo con un plato y menús de solo aperitivo, con opciones para invitados veganos, vegetarianos, sin gluten o con alergias. El mejor sabor con la mejor calidad-precio del mercado. <a href="/presupuesto-online/">Calculad vuestro presupuesto</a>.</p>
    </div>
  </div>
</section>
<section class="frase">
  <div class="estrecho">
    <h2 class="grande">Reconocida como una de las masías para bodas más recomendadas de España, desde 2015, Mas Llombart ha sido premiada en los principales portales del sector, convirtiéndose así en referencia para otras fincas y caterings.</h2>
    <p class="u12 grande">Si queréis un lugar con <span class="resalta">alma</span>, <span class="resalta">historia</span> y <span class="resalta">corazón</span>,<br>Mas Llombart es vuestra masía.</p>
  </div>
</section>
<section class="u17 seccion">
  <div class="contenedor galeria">
    ${foto('2025/06/masllombart-centro-mesa-rustico-flores-frascos-boda.jpeg', 'Centro de mesa rústico con flores y frascos en una boda en Mas Llombart', 'alta')}
    ${foto('2025/06/masllombart-altar-exterior-arco-flores.jpeg', 'Altar exterior con arco de flores para ceremonia de boda en Mas Llombart', 'alta')}
    ${foto('2025/06/masllombart-boda-decoracion-mesa.jpeg', 'Decoración de mesa de banquete de boda en Mas Llombart', 'alta')}
    ${foto('2025/06/IMG_9147-1.jpeg', 'Rincón de la masía Mas Llombart preparado para una boda', 'alta')}
    ${foto('2025/06/masllombart-ramo-novia-entrega-boda.jpeg', 'Entrega del ramo de novia durante una boda en Mas Llombart', 'alta')}
    ${foto('2025/06/massllombart-novios-noche-jardin.jpeg', 'Novios de noche en el jardín de Mas Llombart', 'alta')}
  </div>
  <div class="estrecho centro"><p class="u21 frase grande">Un equipo cercano, profesional y lleno de ilusión os espera para hacer realidad ese gran día que ya habéis empezado a imaginar</p></div>
</section>
${bandaContacto('en Sant Fost de Campsentelles')}
<section class="seccion">
  <div class="contenedor faq">
    <h2>Preguntas frecuentes sobre Mas Llombart</h2>
    ${FAQ_MASIA.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n    ')}
  </div>
</section>`,
});

// BODAS EN BARCELONA
paginas.push({
  ruta: '/bodas-en-barcelona-mas-llombart/', archivo: 'bodas-en-barcelona-mas-llombart/index.html',
  titulo: 'Bodas en Barcelona: Masía con Historia y Encanto | Mas Llombart',
  ogTitulo: 'Bodas en Barcelona – Mas Llombart, Masía con Historia y Encanto',
  descripcion: 'Mas Llombart es una masía ideal para bodas en Barcelona. Espacios únicos, gastronomía de autor y un entorno con historia para un día inolvidable.',
  imagenOg: '2025/06/masllombart-ramo-novia-entrega-boda.jpeg',
  migas: [['Portada', '/'], ['Bodas en Barcelona', '/bodas-en-barcelona-mas-llombart/']],
  cuerpo: `<section class="seccion">
  <div class="estrecho centro"><h1>Bodas en Barcelona Mas Llombart, Masía con Historia y Encanto</h1></div>
  <div class="u13 contenedor dos-col">
    <div class="justif">
      <h2>El lugar donde tu historia comienza</h2>
      <p>¿Buscas una masía para bodas en Barcelona que combine historia, naturaleza y emoción?</p>
      <p>Nosotros en Mas Llombart hacemos realidad tu boda soñada, a solo 15 minutos de Barcelona, en un entorno exclusivo rodeado de jardines.</p>
      <p>Más que un lugar, somos una <strong>finca con historia</strong>. Creamos <strong>bodas en Barcelona personalizadas</strong>, cuidando cada detalle y emoción.</p>
    </div>
    ${foto('2025/06/masllombart-ramo-novia-entrega-boda.jpeg', 'Entrega del ramo de novia en una boda en Barcelona', 'vertical', 'eager')}
  </div>
  <div class="u13 contenedor dos-col invertida">
    <div class="justif">
      <h2 class="centro">Ceremonia de boda en Barcelona:<br>Al aire libre o interior, siempre inolvidable</h2>
      <p><strong>Nuestra masía para bodas en Barcelona</strong> convierte cada ceremonia en un recuerdo inolvidable. Puede ser al aire libre o en un espacio interior. El entorno, la emoción y cada detalle marcan la diferencia.</p>
      <p>Plan A es nuestra <strong>ceremonia de bodas en Barcelona</strong> al aire libre, rodeada de jardines, luces cálidas y naturaleza envolvente. Caminar entre plantas vivas y miradas cómplices convierte el “sí, quiero” en un instante verdaderamente mágico.</p>
      <p>¿Y si llueve? Tenemos un Plan B igual de especial. Es una <strong>ceremonia interior</strong> en un salón acristalado, con vistas a cascadas, techos de madera y luz natural. La lluvia no interrumpe tu historia. La hace aún más memorable.</p>
    </div>
    ${foto('2025/06/IMG_9142.jpeg', 'Jardín de ceremonias con carpa blanca en una masía para bodas en Barcelona')}
  </div>
</section>
<section class="banda foto-visible">
  <img class="fondo" src="${img('2025/06/masllombart-postres-caseros-boda-barcelona.jpeg')}" alt="" loading="lazy" decoding="async">
  <div class="contenido">
    <h2>Catering para bodas en Barcelona:<br>Gastronomía de autor en Mas Llombart</h2>
    <p>En <strong>Mas Llombart</strong>, la <strong>gastronomía</strong> es clave para hacer de tu <strong>boda en Barcelona</strong> una experiencia inolvidable. Empieza con el primer bocado y se recuerda más allá del último brindis.</p>
    <p>Nuestra <strong>cocina de autor</strong> combina alma mediterránea y técnica moderna. Todo se elabora artesanalmente en la <strong>masía</strong>, desde el pan hasta los postres. Nada industrial. Todo cuidado al detalle. Ofrecemos <strong>menús veganos, sin gluten y adaptados a alergias</strong>, sin perder sabor ni presentación. En Mas Llombart, nos adaptamos a ti.</p>
    <a class="boton blanco" href="/presupuesto-online/">Descubre nuestros menús</a>
  </div>
</section>
<section class="seccion">
  <div class="contenedor dos-col">
    <div class="justif">
      <h2 class="centro">Un lugar con historia para bodas inolvidables en Barcelona:</h2>
      <h3 class="centro">Mas Llombart</h3>
      <p>A solo 15 minutos de Barcelona, esta <strong>masía del siglo XIV</strong> cuenta con más de <strong>5.500 m² de jardines</strong> para bodas únicas y con encanto. Un lugar único para <strong>bodas íntimas y románticas</strong> en Sant Fost de Campsentelles.</p>
      <p>Diseñamos cada <strong>boda a medida</strong>, con atención total y un solo evento por día. Nuestra <strong>gastronomía de autor</strong> incluye panes, helados y pasteles elaborados en casa, con <strong>opciones veganas, sin gluten y más</strong>.</p>
      <p>Desde 2015, Mas Llombart ha sido reconocida como una de las <strong>masías para bodas en Barcelona</strong> más recomendadas por su dedicación, calidad y alma. <a href="/la-masia/">Conoce la masía</a>.</p>
    </div>
    ${foto('2025/06/massllombart-novios-noche-jardin-1.jpeg', 'Novios en una boda nocturna en una masía de Barcelona', 'vertical')}
  </div>
</section>
${bandaContacto()}
<section class="frase">
  <div class="estrecho">
    <h2 class="grande">¿Listos para empezar a imaginar su boda perfecta?</h2>
    <p class="media">El primer paso es hablar con nosotros</p>
    <p>Conoce a nuestro equipo y déjate guiar por personas que aman lo que hacen. Llámanos o escríbenos, y empieza a darle forma al gran día en Mas Llombart.</p>
    <a class="boton" href="/contactanos/">Contáctanos</a>
  </div>
</section>
${bandaPresupuesto}`,
});

// PRESUPUESTO ONLINE
const datosPz = JSON.stringify({ precios, calendario, catalogo }).replace(/</g, '\\u003c');
paginas.push({
  ruta: '/presupuesto-online/', archivo: 'presupuesto-online/index.html',
  titulo: 'Presupuesto para boda online 2027 y 2028 | Mas Llombart',
  ogTitulo: 'Presupuesto de Boda Online – Calcula tu Día Perfecto con Mas Llombart',
  descripcion: 'Calcula el presupuesto de tu boda online en minutos para 2027 y 2028. Elige fecha, invitados, menú y extras en Mas Llombart, sin compromiso.',
  imagenOg: '2025/06/massllombart-novios-noche-jardin.jpeg',
  migas: [['Portada', '/'], ['Presupuesto online', '/presupuesto-online/']],
  schema: [{ '@type': 'Service', name: 'Banquete de boda en Mas Llombart', serviceType: 'Organización y catering de bodas', provider: { '@id': SITIO + '/#negocio' }, areaServed: 'Barcelona' }],
  scripts: `<script type="application/json" id="pz-datos">${datosPz}</script>\n<script src="/assets/js/presupuestador.js?v=${HOY}" defer></script>`,
  cuerpo: `<section class="frase">
  <div class="contenedor">
    <h1 class="u7 titulo-xl">Presupuesto de boda online</h1>
    <p class="titulo-sub"><span class="subraya amarillo">Calcula tu día perfecto</span></p>
    <p class="u11 grande">¿Queréis empezar a imaginar vuestro gran día con <span class="subraya">cifras reales?</span></p>
    <div class="u10 estrecho"><p class="justif">Con nuestro presupuestador online, podéis obtener una estimación personalizada de forma rápida y sencilla para bodas en 2027 y 2028: elegid la fecha, el número de invitados, el menú que más se ajusta a vuestro estilo y los extras que os hagan ilusión.</p></div>
  </div>
</section>
<section class="u17 seccion" id="presupuestador">
  <div class="contenedor pz">
    <div>
      <noscript><p class="pz-paso">El presupuestador necesita JavaScript. Más abajo podéis descargar los dossiers de 2027 y 2028, o escribidnos a <a href="mailto:info@masllombart.com">info@masllombart.com</a>.</p></noscript>
      <div class="pz-paso">
        <h3><span class="n">PASO 1</span> Elegid la fecha</h3>
        <p class="pz-nota">Los colores indican la tarifa del día. Lunes y martes la finca está cerrada salvo vísperas y festivos.</p>
        <div class="cal-cab"><button type="button" id="cal-prev" aria-label="Mes anterior">‹</button><span class="cal-mes" id="cal-mes" aria-live="polite"></span><button type="button" id="cal-next" aria-label="Mes siguiente">›</button></div>
        <div class="cal" id="cal"></div>
        <div class="leyenda"><span><i class="t1"></i>Tarifa 1</span><span><i class="t2"></i>Tarifa 2</span><span><i class="t3"></i>Tarifa 3</span><span><i class="t4"></i>Tarifa 4</span></div>
        <div class="fecha-info" id="fecha-info" hidden aria-live="polite"></div>
      </div>
      <div class="pz-paso">
        <h3><span class="n">PASO 2</span> Invitados</h3>
        <div class="num-grid">
          <div><label for="n-adultos">Adultos</label><input id="n-adultos" type="number" min="0" max="400" value="100" inputmode="numeric"></div>
          <div><label for="n-ninos">Niños (hasta 12 años)</label><input id="n-ninos" type="number" min="0" max="200" value="0" inputmode="numeric"></div>
          <div><label for="n-prof">Profesionales (foto, vídeo…)</label><input id="n-prof" type="number" min="0" max="20" value="0" inputmode="numeric"></div>
        </div>
      </div>
      <div class="pz-paso">
        <h3 id="menus-titulo"><span class="n">PASO 3</span> Elegid el menú</h3>
        <div class="menus-grid" id="menus" role="radiogroup" aria-labelledby="menus-titulo"></div>
        <details class="platos" id="menu-platos" hidden><summary id="menu-platos-titulo">Ver platos del menú</summary><div id="menu-platos-cuerpo"></div></details>
      </div>
      <div class="pz-paso">
        <h3><span class="n">PASO 4</span> Extras para vuestra boda</h3>
        <p class="pz-nota">En los menús 1 a 7 podéis canjear aperitivos por algunos buffets (máximo 6 aperitivos en los menús 1–3 y 12 en los menús 4–7).</p>
        <div id="extras"></div>
      </div>
      <div class="pz-paso no-imprimir" id="solicitar">
        <h3><span class="n">PASO 5</span> ¿Os gusta? Hablamos</h3>
        <div class="wa-cta">
          <p>Si el presupuesto os encaja y queréis que os contactemos, enviádnoslo por WhatsApp: os llega a Javi con todo el desglose y os responde directamente.</p>
          <label for="wa-nombre">Vuestros nombres (para saber quién nos escribe)</label>
          <input id="wa-nombre" autocomplete="name" maxlength="80" placeholder="Laura y Marc">
          <a class="boton boton-wa" id="btn-whatsapp" href="https://wa.me/34672494212" target="_blank" rel="noopener">${SVG.wa} Nos gusta, queremos que nos contactéis</a>
          <p class="pz-nota">Se abre WhatsApp con el mensaje ya escrito; solo tenéis que pulsar enviar.</p>
        </div>
        <details class="alt-email">
        <summary>¿Preferís recibirlo por email?</summary>
        <form id="form-presupuesto" class="form" name="presupuesto" method="POST" data-netlify="true" netlify-honeypot="empresa-web" action="/gracias/">
          <input type="hidden" name="form-name" value="presupuesto">
          <p class="oculto-bot"><label>No rellenar: <input name="empresa-web" tabindex="-1" autocomplete="off"></label></p>
          <input type="hidden" name="fecha" id="lead-fecha"><input type="hidden" name="total" id="lead-total"><input type="hidden" name="adultos" id="lead-adultos"><input type="hidden" name="ninos" id="lead-ninos"><input type="hidden" name="menu" id="lead-menu">
          <textarea name="resumen" id="lead-resumen" hidden readonly></textarea>
          <div class="fila"><div><label for="l-nombre">Nombres de la pareja</label><input id="l-nombre" name="nombre" required autocomplete="name" maxlength="120"></div>
          <div><label for="l-tel">Teléfono</label><input id="l-tel" name="telefono" type="tel" required autocomplete="tel" maxlength="30"></div></div>
          <div><label for="l-email">Correo electrónico</label><input id="l-email" name="email" type="email" required autocomplete="email" maxlength="160"></div>
          <div><label for="l-msg">¿Algo más que debamos saber? (opcional)</label><textarea id="l-msg" name="mensaje" maxlength="2000"></textarea></div>
          <label class="check"><input type="checkbox" name="privacidad" value="acepto" required> <span>Acepto la <a href="/politica-de-privacidad/">política de privacidad</a>.</span></label>
          <p class="aviso-legal-form">Responsable: Sinsofood 1996, S.L. Finalidad: enviaros el presupuesto y atender vuestra consulta. Podéis ejercer vuestros derechos en info@masllombart.com.</p>
          <div class="botones"><button class="boton" type="submit">Enviar</button> <button class="boton contorno" type="button" id="btn-imprimir">Imprimir / PDF</button></div>
          <p id="lead-estado" class="estado-form" role="status"></p>
        </form>
        </details>
      </div>
    </div>
    <aside class="resumen" aria-labelledby="resumen-titulo">
      <h3 id="resumen-titulo">Vuestro presupuesto</h3>
      <div id="resumen-cuerpo" aria-live="polite"></div>
      <a class="boton azul no-imprimir" href="#solicitar">Nos gusta, contactadnos</a>
    </aside>
  </div>
  <div class="resumen-movil" id="resumen-movil" hidden><span>Total estimado <strong id="resumen-movil-total"></strong></span><a href="#resumen-titulo">Ver qué incluye</a></div>
</section>

${bandaContacto()}

<section class="seccion">
  <div class="estrecho centro">
    <h2><span class="resalta">Tres formas de vivir un banquete perfecto</span></h2>
    <p class="justif">En Mas Llombart entendemos que cada pareja es única, y por eso ofrecemos distintos tipos de menú para adaptarnos a vuestro estilo y al ambiente que queráis crear.</p>
  </div>
  <div class="u13 contenedor tarjetas">
    <div class="tarjeta">${ICONOS.plato}<h3>Menú Tradicional</h3><span class="sub">Una propuesta elegante que nunca falla.</span><p>Para quienes prefieren la estructura clásica de un gran banquete: primer plato, sorbete, segundo y pastel.</p></div>
    <div class="tarjeta">${ICONOS.copa}<h3>Aperitivo Completo</h3><span class="sub">Si queréis algo más dinámico pero lleno de sabor.</span><p>Una extensa selección de aperitivos, sorbete y un segundo plato de autor. Perfecto para un ambiente moderno.</p></div>
    <div class="tarjeta">${ICONOS.hoja}<h3>Solo Aperitivo</h3><span class="sub">Ideal para bodas ágiles, frescas y al aire libre.</span><p>Solo aperitivos, pensados al detalle para que no falte de nada. Cada bocado es una experiencia.</p></div>
  </div>
  <div class="estrecho centro">
    <p class="u3 frase grande">Todos nuestros menús comparten el mismo compromiso: <span class="resalta">cocina hecha 100% por nosotros</span>, con ingredientes frescos, creatividad, y servicio impecable.</p>
    <span class="antetitulo">¿Queréis conocer todas las opciones al detalle?</span>
    <h2>Descargad aquí el PDF con toda la información de menús, platos y combinaciones disponibles</h2>
    <p>Podéis ver todas las opciones de menú haciendo clic en los siguientes botones.</p>
    <div class="cta-centro"><div class="botones">
      <a class="boton contorno" href="/docs/dossier-bodas-2027-mas-llombart.pdf">Menú 2027</a>
      <a class="boton contorno" href="/docs/dossier-bodas-2028-mas-llombart.pdf">Menú 2028</a>
    </div></div>
    <h2 class="u14">¿Qué incluye cada presupuesto?</h2>
    <p class="justif">Todos nuestros presupuestos están pensados para ofrecer una experiencia completa y sin sorpresas. Incluyen todo lo necesario para celebrar una boda inolvidable en una masía exclusiva en Sant Fost de Campsentelles, rodeados de naturaleza, con una gastronomía de autor 100% elaborada por nosotros.</p>
    <ul class="lista-incluye">${['Aperitivo de Gala (24 referencias) en los menús 1, 2 y 3; Gran Aperitivo (42 referencias) en los menús 4, 5, 6 y 7; Aperitivo Mas Llombart (15 referencias) en el menú 8', ...catalogo.incluido, 'Prueba de menú para la pareja (para 4 o 6 personas en los presupuestos más altos)'].map((x) => `<li>${x}</li>`).join('')}</ul>
    <p class="pz-nota">El menú 9 “Viva la Vida” tiene su propio formato e incluye lo detallado en su ficha.</p>
    <p class="u2 frase grande">Empezad a soñar. Calculad vuestro presupuesto sin compromiso y descubrid todo lo que puede ofreceros Mas Llombart.</p>
  </div>
</section>`,
});

// CONTACTO
paginas.push({
  ruta: '/contactanos/', archivo: 'contactanos/index.html',
  titulo: 'Contacto y visitas | Masía para bodas en Barcelona | Mas Llombart',
  descripcion: '¿Queréis contactar una masía para bodas en Barcelona? En Mas Llombart podéis pedir cita para visitarnos y solicitar el dossier con menús y servicios.',
  ogDescripcion: 'Visítanos en Sant Fost de Campsentelles. Pide cita para conocer Mas Llombart y empieza a soñar con tu boda en una masía exclusiva cerca de Barcelona.',
  imagenOg: '2025/06/masllombart-boda-anochecer-novios-edificio-iluminado.jpeg',
  migas: [['Portada', '/'], ['Contáctanos', '/contactanos/']],
  cuerpo: `<div class="contenedor bloque-titulo"><h1 class="titulo-xl">Contacto</h1><p class="titulo-sub">Si has llegado hasta aquí,</p><p class="u5 titulo-sub">Quizás ya lo has sentido:</p></div>
<section class="u17 seccion">
  <div class="contenedor dos-col">
    <div class="justif">
      <p>Mas Llombart no es solo una masía para bodas. Es un lugar donde se celebran emociones reales, con estilo, con alma… y con una cocina que habla por sí sola.</p>
      <p>Queremos conoceros, saber cómo imagináis vuestro gran día y ayudaros a construirlo paso a paso. Desde la <strong>ceremonia al aire libre</strong>, caminando entre plantas hacia el altar, hasta nuestro plan B interior, acristalado, con vistas a cascadas y techos de madera. <strong>Aquí todo está pensado para que sea perfecto, llueva o brille el sol.</strong></p>
    </div>
    ${foto('2025/06/masllombart-boda-anochecer-novios-edificio-iluminado.jpeg', 'Novios al anochecer frente a la masía Mas Llombart iluminada', '', 'eager')}
  </div>
</section>
<section class="seccion">
  <div class="contenedor">
    <h2 class="u9 centro">Ofrecemos una experiencia completa:</h2>
    <div class="ventajas">
      <div class="ventaja">${ICONOS.plato}<h3>Banquetes a medida</h3><p>Menú tradicional, aperitivo más un plato o solo aperitivo.</p></div>
      <div class="ventaja">${ICONOS.chef}<h3>Cocina elaborada 100% por nosotros</h3><p>Panes, pasteles, helados, salsas… todo hecho en casa.</p></div>
      <div class="ventaja">${ICONOS.hoja}<h3>Opciones para todos</h3><p>Menús veganos, vegetarianos, sin gluten y adaptados a alergias.</p></div>
    </div>
    <div class="u11 ventajas dos">
      <div class="ventaja">${ICONOS.medalla}<h3>Reconocimientos reales</h3><p>Valoración 5/5 de nuestras parejas y entre los 3 espacios más recomendados de España desde 2015.</p></div>
      <div class="ventaja">${ICONOS.contrato}<h3>Cercanía, profesionalidad y seguridad contractual</h3><p>Para que podáis confiar desde el primer día.</p></div>
    </div>
  </div>
</section>
<section class="seccion">
  <div class="contenedor">
    <div class="estrecho centro">
      <h2>Pedid cita para una visita personalizada o solicitad el dossier completo con menús y servicios.</h2>
      <p class="u2 titulo-sub">Os esperamos con la misma ilusión que <span class="resalta">el primer día.</span></p>
    </div>
    <div class="u13 equipo">
      <div class="persona"><h3>Elisabet</h3><span class="tagline">Ilusión renovada, aire fresco y energía que contagia.</span><p>Aunque es la última incorporación en Mas Llombart, su ilusión desmesurada y su sensibilidad hacen que cada pareja se sienta como en casa. Tiene ese don de cuidar los detalles con dulzura, y su sonrisa os va a acompañar desde el primer minuto.</p><p class="tel">Teléfono: <a href="${telHref('611 821 360')}">611 821 360</a></p></div>
      <div class="persona"><h3>Javi</h3><span class="tagline">El alma veterana de la masía</span><p>Desde el primer día ha sido testigo de más de 1.600 bodas. Con miles de recuerdos compartidos y parejas que ya son amigos, su experiencia es garantía y su trato, pura confianza. Si alguien conoce cada rincón de Mas Llombart, es él.</p><p class="tel">Teléfono: <a href="${telHref('672 494 212')}">672 494 212</a></p></div>
      <div class="persona"><h3>Juan</h3><span class="tagline">Juventud, alegría y un punto alocado que enamora.</span><p>Cercano, curioso y siempre con una broma a mano para relajar el momento. Juan transforma cada visita en una experiencia divertida y real, donde las parejas se sienten escuchadas de verdad.</p><p class="tel">Teléfono: <a href="${telHref('664 563 403')}">664 563 403</a></p></div>
    </div>
  </div>
</section>
<section class="seccion" id="escribenos">
  <div class="contenedor centro"><h2 class="u8 titulo-xl">Escríbenos</h2><hr class="u16 fina"><p class="u1 titulo-sub">Celebra tu boda en una masía con alma, en Sant Fost de Campsentelles (Barcelona)</p></div>
  <div class="u15 estrecho">
    <form class="form" name="contacto" method="POST" data-netlify="true" netlify-honeypot="empresa-web" action="/gracias/">
      <input type="hidden" name="form-name" value="contacto">
      <p class="oculto-bot"><label>No rellenar: <input name="empresa-web" tabindex="-1" autocomplete="off"></label></p>
      <div><label for="c-nombre">Nombre</label><input id="c-nombre" name="nombre" required autocomplete="name" maxlength="120" placeholder="Ingresa tu nombre completo"></div>
      <div><label for="c-email">Correo electrónico</label><input id="c-email" name="email" type="email" required autocomplete="email" maxlength="160" placeholder="Ingresa tu correo electrónico"></div>
      <div class="fila"><div><label for="c-tel">Teléfono</label><input id="c-tel" name="telefono" type="tel" autocomplete="tel" maxlength="30"></div>
      <div><label for="c-fecha">Fecha aproximada de la boda</label><input id="c-fecha" name="fecha" type="date" min="2026-10-01"></div></div>
      <div><label for="c-msg">Mensaje</label><textarea id="c-msg" name="mensaje" required maxlength="3000" placeholder="Escribe tu mensaje aquí"></textarea></div>
      <label class="check"><input type="checkbox" name="privacidad" value="acepto" required> <span>Acepto la <a href="/politica-de-privacidad/">política de privacidad</a>.</span></label>
      <p class="aviso-legal-form">Responsable: Sinsofood 1996, S.L. Finalidad: atender vuestra solicitud. Derechos: acceso, rectificación, supresión y demás en info@masllombart.com.</p>
      <div><button class="boton" type="submit">Enviar</button></div>
    </form>
  </div>
</section>`,
});

// EMPRESAS
paginas.push({
  ruta: '/cotizacion-empresas/', archivo: 'cotizacion-empresas/index.html',
  titulo: 'Eventos de empresa en una masía cerca de Barcelona | Mas Llombart',
  descripcion: 'Organiza tu evento corporativo en Mas Llombart: convenciones, formaciones, team building y cenas de empresa en una masía a pocos minutos de Barcelona. Presupuesto rápido.',
  imagenOg: '2025/08/personas-en-eventos-de-negocios.jpg',
  migas: [['Portada', '/'], ['Eventos de empresa', '/cotizacion-empresas/']],
  cuerpo: `<section class="frase">
  <div class="estrecho">
    <h1 class="u6 grande"><span class="subraya amarillo">Solicita tu Presupuesto Rápido</span> para Eventos de Empresa en Mas Llombart</h1>
    <p class="u4 titulo-sub">Organiza tu evento corporativo en una masía única cerca de Barcelona. Solicita ahora tu propuesta personalizada.</p>
    <hr class="fina">
  </div>
</section>
<section class="u17 seccion">
  <div class="contenedor dos-col">
    <div>
      <h2>¿Estás buscando un lugar exclusivo y con encanto para celebrar tu evento de empresa?</h2>
      <p>En Mas Llombart te ofrecemos un entorno privilegiado, rodeado de naturaleza y a solo 15 minutos de Barcelona. Ya sea para una convención, formación, team building, presentación de producto o celebración corporativa, te lo ponemos fácil.</p>
    </div>
    ${foto('2025/06/massllombart-ceremonia-aire-libre-boda.jpeg', 'Jardín de Mas Llombart con guirnaldas de luces preparado para un evento', 'vertical', 'eager')}
  </div>
</section>
<section class="banda">
  <img class="fondo" src="${img('2025/08/personas-en-eventos-de-negocios.jpg')}" alt="" loading="lazy" decoding="async">
  <div class="contenido">
    <h2>Descarga nuestro dossier y solicita tu presupuesto en menos de 1 minuto. ¡Sin compromiso!</h2>
    <div class="botones">
      <a class="boton azul" href="/docs/dossier-empresas-2027-mas-llombart.pdf" download>Descargar dossier de empresas 2027</a>
      <a class="boton azul" href="/contactanos/#escribenos">Solicita tu presupuesto</a>
    </div>
  </div>
</section>
<section class="seccion">
  <div class="contenedor">
    <h2 class="u9 centro"><span class="subraya amarillo">¿Por qué Mas Llombart?</span></h2>
    <div class="ventajas">
      <div class="ventaja grande">${ICONOS.masia}<p>Masía con encanto del siglo XIV totalmente equipada.</p></div>
      <div class="ventaja grande">${ICONOS.estrella}<p>Diferentes espacios interiores y exteriores para personalizar tu evento.</p></div>
      <div class="ventaja grande">${ICONOS.copa}<p>Amplia variedad de menús: coffee breaks, cócteles y menús servidos.</p></div>
      <div class="ventaja grande">${ICONOS.pantalla}<p>Equipamiento audiovisual disponible (pantalla, micros, sonido).</p></div>
      <div class="ventaja grande">${ICONOS.descarga}<p><a href="/docs/dossier-empresas-2027-mas-llombart.pdf" download>Dossier descargable</a> con precios y condiciones.</p></div>
      <div class="ventaja grande">${ICONOS.grupo}<p>Presupuestos para eventos desde 50 personas.</p></div>
    </div>
  </div>
  <div class="u14 contenedor galeria">
    ${foto('2025/08/personas-en-eventos-de-negocios.jpg', 'Asistentes brindando en un evento de empresa en una masía cerca de Barcelona')}
    ${foto('2025/06/RAFA1023.jpeg', 'Mesa preparada para un evento en Mas Llombart')}
    ${foto('2025/06/plato-bocas.jpeg', 'Aperitivos de cóctel para eventos de empresa en Mas Llombart')}
  </div>
</section>
<section class="banda">
  <img class="fondo" src="${img('2025/06/masllombart-buffet-boda-barcelona.jpeg')}" alt="" loading="lazy" decoding="async">
  <div class="contenido">
    <span class="antetitulo">Contáctanos</span>
    <h2>Organiza tu evento corporativo en una masía con alma, en Sant Fost de Campsentelles (Barcelona)</h2>
    <p>Celebra tu evento corporativo en una masía exclusiva a pocos minutos de Barcelona. Llámanos y descubre todo lo que podemos ofrecerte.</p>
    <a class="boton azul" href="/contactanos/">Agenda tu visita</a>
  </div>
</section>`,
});

// LEGALES
const EMPRESA = `<p><strong>Sinsofood 1996, S.L.</strong> · CIF B67342568<br>Domicilio social: C/ Turó de la Trinitat, 2-4-6, 3º 3ª · 08002 Barcelona<br>Establecimiento: Mas Llombart, Avda. de la Conreria, 16 · 08105 Sant Fost de Campsentelles (Barcelona)<br>Email: <a href="mailto:info@masllombart.com">info@masllombart.com</a> · Teléfono: <a href="tel:+34672494212">672 494 212</a><br>Datos registrales: [PENDIENTE: Registro Mercantil de Barcelona, tomo, folio, hoja]</p>`;
paginas.push({
  ruta: '/aviso-legal/', archivo: 'aviso-legal/index.html', titulo: 'Aviso legal | Mas Llombart', descripcion: 'Aviso legal del sitio web masllombart.com, titularidad de Sinsofood 1996, S.L.', migas: [['Portada', '/'], ['Aviso legal', '/aviso-legal/']], sinCierre: true,
  cuerpo: `<section class="seccion"><div class="estrecho legal-texto"><h1>Aviso legal</h1>
<h2>Titular del sitio web</h2>${EMPRESA}
<p>En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos identificativos del titular de este sitio web.</p>
<h2>Condiciones de uso</h2><p>El acceso a este sitio web atribuye la condición de usuario e implica la aceptación de estas condiciones. El usuario se compromete a hacer un uso adecuado de los contenidos y a no emplearlos para actividades ilícitas o contrarias a la buena fe.</p>
<h2>Precios y presupuestos</h2><p>Los importes mostrados en el presupuestador online son orientativos, incluyen IVA al tipo vigente (10%) y no constituyen una oferta vinculante. La reserva de fecha solo es firme tras la firma del contrato y el abono de la paga y señal. La disponibilidad de fechas se confirma siempre con nuestro equipo.</p>
<h2>Propiedad intelectual e industrial</h2><p>Los textos, fotografías, logotipos y diseño de este sitio son propiedad de Sinsofood 1996, S.L. o de sus legítimos titulares, y no pueden reproducirse sin autorización.</p>
<h2>Enlaces</h2><p>Este sitio puede contener enlaces a sitios de terceros (Instagram, WhatsApp, Google Maps) cuyos contenidos y políticas no controlamos.</p>
<h2>Legislación aplicable</h2><p>Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona, salvo que la normativa de consumidores disponga otra cosa.</p>
</div></section>`,
});
paginas.push({
  ruta: '/politica-de-privacidad/', archivo: 'politica-de-privacidad/index.html', titulo: 'Política de privacidad | Mas Llombart', descripcion: 'Cómo trata Mas Llombart (Sinsofood 1996, S.L.) los datos personales de parejas, clientes y usuarios de la web.', migas: [['Portada', '/'], ['Política de privacidad', '/politica-de-privacidad/']], sinCierre: true,
  cuerpo: `<section class="seccion"><div class="estrecho legal-texto"><h1>Política de privacidad</h1>
<p>En Sinsofood 1996, S.L. nos preocupamos por la privacidad y la transparencia. A continuación os explicamos los tratamientos de datos personales que realizamos.</p>
<h2>Responsable del tratamiento</h2>${EMPRESA}
<h2>Tratamientos</h2>
<table><thead><tr><th>Tratamiento</th><th>Finalidad</th><th>Base jurídica</th><th>Conservación</th><th>Destinatarios</th></tr></thead><tbody>
<tr><td>Formularios de contacto y presupuesto de la web</td><td>Atender solicitudes, enviar presupuestos y, si lo aceptáis, comunicaciones comerciales</td><td>Consentimiento y medidas precontractuales</td><td>Hasta que solicitéis su supresión o deje de ser necesario</td><td>Proveedor de alojamiento web (Netlify, Inc.) como encargado del tratamiento</td></tr>
<tr><td>Correo electrónico y WhatsApp</td><td>Prestar el servicio, atender peticiones de información y comunicaciones comerciales</td><td>Ejecución de contrato, interés legítimo y consentimiento</td><td>Hasta que solicitéis su supresión</td><td>No se ceden, salvo obligación legal</td></tr>
<tr><td>Clientes (contratos y presupuestos)</td><td>Gestión administrativa, contable y fiscal; comunicaciones comerciales</td><td>Ejecución de contrato, obligación legal y consentimiento</td><td>Durante la relación y los plazos legales</td><td>Administración tributaria y entidades financieras</td></tr>
<tr><td>Videovigilancia</td><td>Garantizar la seguridad de personas, bienes e instalaciones</td><td>Misión de interés público</td><td>Máximo 30 días, salvo comunicación a autoridades</td><td>Fuerzas y Cuerpos de Seguridad y juzgados, cuando proceda</td></tr>
<tr><td>Candidatos a empleo</td><td>Gestionar currículums y procesos de selección</td><td>Medidas precontractuales y consentimiento</td><td>Dos años desde el último contacto</td><td>No se ceden, salvo obligación legal</td></tr>
</tbody></table>
<h2>Transferencias internacionales</h2><p>El alojamiento de la web y los formularios lo presta Netlify, Inc. (EE. UU.), adherida al Marco de Privacidad de Datos UE-EE. UU., con cláusulas contractuales tipo como garantía adicional.</p>
<h2>Vuestros derechos</h2><p>Podéis solicitar el acceso, rectificación, supresión, portabilidad, limitación u oposición al tratamiento de vuestros datos, y retirar el consentimiento en cualquier momento, escribiendo a <a href="mailto:info@masllombart.com">info@masllombart.com</a>. Si consideráis que no se han atendido correctamente, podéis reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">www.aepd.es</a>).</p>
<h2>Seguridad</h2><p>La web se sirve únicamente por HTTPS, no utiliza gestores de contenido con acceso público de administración y aplica medidas técnicas para proteger los datos enviados en los formularios.</p>
</div></section>`,
});
paginas.push({
  ruta: '/politica-de-cookies/', archivo: 'politica-de-cookies/index.html', titulo: 'Política de cookies | Mas Llombart', descripcion: 'Información sobre el uso de cookies en masllombart.com.', migas: [['Portada', '/'], ['Política de cookies', '/politica-de-cookies/']], sinCierre: true,
  cuerpo: `<section class="seccion"><div class="estrecho legal-texto"><h1>Política de cookies</h1>
<p>Esta web <strong>no utiliza cookies propias ni de terceros con fines analíticos, publicitarios ni de personalización</strong>. Por eso no os mostramos ningún banner de consentimiento.</p>
<p>Las tipografías se sirven desde nuestro propio servidor y no cargamos mapas, vídeos ni redes sociales incrustados. Los enlaces a Instagram, WhatsApp o Google Maps solo os llevan a esos servicios si hacéis clic, y a partir de ahí se aplican sus propias políticas.</p>
<p>El presupuestador guarda vuestra selección únicamente en la dirección (URL) de la página, para que podáis compartirla; no se almacena nada en vuestro dispositivo.</p>
<p>Si en el futuro incorporamos herramientas de medición, actualizaremos esta política y os pediremos el consentimiento antes de activarlas.</p>
</div></section>`,
});
paginas.push({
  ruta: '/gracias/', archivo: 'gracias/index.html', titulo: 'Gracias | Mas Llombart', descripcion: 'Hemos recibido vuestro mensaje.', noindex: true, sinCierre: true,
  cuerpo: `<section class="seccion"><div class="estrecho centro"><h1>¡Gracias!</h1><p class="lead">Hemos recibido vuestro mensaje. Os contestaremos lo antes posible, normalmente en menos de 24 horas laborables.</p><p>Si os corre prisa, llamadnos al <a href="tel:+34672494212">672 494 212</a> o escribidnos por <a href="${WA}" target="_blank" rel="noopener">WhatsApp</a>.</p><a class="boton" href="/">Volver al inicio</a></div></section>`,
});
paginas.push({
  ruta: '/404.html', archivo: '404.html', titulo: 'Página no encontrada | Mas Llombart', descripcion: 'La página que buscáis no existe.', noindex: true, sinCierre: true,
  cuerpo: `<section class="seccion"><div class="estrecho centro"><h1>Esta página no existe</h1><p class="lead">Puede que el enlace haya cambiado. Estas son las páginas más visitadas:</p><p><a href="/">Inicio</a> · <a href="/la-masia/">La Masía</a> · <a href="/presupuesto-online/">Presupuesto online</a> · <a href="/contactanos/">Contacto</a></p></div></section>`,
});
paginas.push({
  ruta: '/410.html', archivo: '410.html', titulo: 'Contenido retirado | Mas Llombart', descripcion: 'Este contenido ya no está disponible.', noindex: true, sinCierre: true,
  cuerpo: `<section class="seccion"><div class="estrecho centro"><h1>Este contenido se ha retirado</h1><p><a class="boton" href="/">Ir a la web de Mas Llombart</a></p></div></section>`,
});

/* ---------- Escritura ---------- */
if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(DIST, { recursive: true });
for (const p of paginas) {
  const destino = join(DIST, p.archivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, layout(p));
}
cpSync(join(RAIZ, 'src/assets'), join(DIST, 'assets'), { recursive: true });
cpSync(join(RAIZ, 'docs'), join(DIST, 'docs'), { recursive: true });
for (const f of ['favicon.png', 'apple-touch-icon.png']) if (existsSync(join(RAIZ, 'static', f))) cpSync(join(RAIZ, 'static', f), join(DIST, f));
if (existsSync(join(RAIZ, 'wp-content'))) cpSync(join(RAIZ, 'wp-content'), join(DIST, 'wp-content'), { recursive: true });

const indexables = paginas.filter((p) => !p.noindex && p.ruta.endsWith('/'));
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexables.map((p) => `  <url><loc>${SITIO}${p.ruta}</loc><lastmod>${HOY}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /gracias/

Sitemap: ${SITIO}/sitemap.xml
`);
console.log(`OK · ${paginas.length} páginas · imágenes desde ${IMG_BASE}`);
