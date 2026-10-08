// node --experimental-strip-types src/lib/presupuesto.test.ts
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { calcular, desdeQuery, sugerirExtras, enlaceWhatsapp, type Datos } from './presupuesto.ts';
const leer = (f: string) => JSON.parse(readFileSync(new URL('../data/' + f, import.meta.url), 'utf8'));
const d: Datos = { precios: leer('precios.json'), calendario: leer('calendario.json'), catalogo: leer('catalogo.json') };
const caso = (q: string) => calcular(d, desdeQuery(d, q));

let r = caso('f=2028-06-10&m=4&a=100');
assert.equal(r.total, 17450); assert.equal(r.minimo, 16000);
r = caso('f=2028-06-10&m=4&a=100&x=arroces::0:1,quesos::0:1,ceremonia::-1:1,horaBarra::-1:2');
assert.equal(r.gastro, 17475); assert.equal(r.total, 21875);
r = caso('f=2028-06-10&m=4&a=100&x=quesos::0:1,carnes::1:1');
assert.equal(r.canjeados, 15); assert.ok(r.avisos.length === 1);
r = caso('f=2027-08-01&m=9&a=60');
assert.equal(r.ajuste, 3500); assert.equal(r.total, 9500);
const s = sugerirExtras(d, desdeQuery(d, 'f=2027-08-01&m=9&a=60'))!;
assert.equal(calcular(d, s).ajuste, 0); assert.equal(calcular(d, s).gastro, 9500);
r = caso('f=2028-06-10&m=8&a=100'); assert.equal(r.ok, false);
r = caso('f=2028-02-05&m=8&a=40&n=5&x=packDisco::-1:1,crepes::-1:1,hotdogs::-1:1');
assert.equal(r.total, 7945, 'hot dogs no debe contar: está en el pack');
r = caso('f=2027-05-08&m=2&a=120'); assert.equal(r.total, 20520);
assert.ok(r.incluidos.some((x) => x.startsWith('Prueba de menú para 6')));
assert.ok(enlaceWhatsapp(d, desdeQuery(d, 'f=2027-05-08&m=2&a=120'), 'Laura y Marc').startsWith('https://wa.me/34672494212?text=Hola%2C%20somos%20Laura'));
console.log('✓ 8 casos del presupuestador correctos');
