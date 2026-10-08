// Descarga de la web WordPress actual todas las fotos y PDFs que usa la web nueva,
// manteniendo EXACTAMENTE las mismas rutas (/wp-content/uploads/...) para no perder
// el posicionamiento en Google Imágenes. Después las recomprime sin cambiar el nombre.
//
// Uso (en tu Mac, ANTES de cambiar las DNS):
//   npm install
//   node scripts/descargar-imagenes.mjs
//
// Resultado: carpeta wp-content/ y static/favicon.png listas; `node src/build.mjs` las copia a dist/.
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = 'https://masllombart.com';

if (!existsSync(join(RAIZ, 'dist'))) execSync('node src/build.mjs', { cwd: RAIZ, stdio: 'inherit' });
const rutas = new Set();
(function recorrer(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (f.endsWith('.html')) for (const m of readFileSync(p, 'utf8').matchAll(/\/wp-content\/uploads\/[^"?)\s]+/g)) rutas.add(m[0]);
  }
})(join(RAIZ, 'dist'));
rutas.add('/wp-content/uploads/2025/06/cropped-masLLombart_ico.png');

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { console.log('ℹ️  sharp no instalado: se descargan sin recomprimir (npm i -D sharp para optimizar).'); }

let ok = 0, ahorro = 0;
for (const r of rutas) {
  const destino = join(RAIZ, r);
  mkdirSync(dirname(destino), { recursive: true });
  const res = await fetch(ORIGEN + r);
  if (!res.ok) { console.log('✗', res.status, r); continue; }
  let buf = Buffer.from(await res.arrayBuffer());
  const original = buf.length;
  if (sharp && /\.(jpe?g)$/i.test(r)) {
    buf = await sharp(buf).rotate().resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer();
    if (buf.length > original) buf = Buffer.from(await (await fetch(ORIGEN + r)).arrayBuffer());
  }
  writeFileSync(destino, buf);
  ahorro += original - buf.length; ok++;
  console.log('✓', r, Math.round(original / 1024) + ' KB →', Math.round(buf.length / 1024) + ' KB');
}
// Favicon
const ico = join(RAIZ, 'wp-content/uploads/2025/06/cropped-masLLombart_ico.png');
if (existsSync(ico)) {
  mkdirSync(join(RAIZ, 'static'), { recursive: true });
  if (sharp) {
    await sharp(ico).resize(64, 64).png().toFile(join(RAIZ, 'static/favicon.png'));
    await sharp(ico).resize(180, 180).png().toFile(join(RAIZ, 'static/apple-touch-icon.png'));
  } else {
    writeFileSync(join(RAIZ, 'static/favicon.png'), readFileSync(ico));
    writeFileSync(join(RAIZ, 'static/apple-touch-icon.png'), readFileSync(ico));
  }
}
console.log(`\n${ok}/${rutas.size} archivos · ahorro ${Math.round(ahorro / 1024 / 1024 * 10) / 10} MB`);
console.log('Ahora: node src/build.mjs  → y despliega la carpeta dist/.');
