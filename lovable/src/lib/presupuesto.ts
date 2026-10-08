/**
 * Motor del presupuestador de bodas Mas Llombart (2027-2028).
 * Funciones puras, sin React ni Supabase: la UI de Lovable solo pinta lo que devuelven.
 * Mismas reglas que la versión estática (probadas con casos reales):
 *  - La fecha decide año, tarifa (1-4) y nivel de mínimo.
 *  - Menú 8 solo en Tarifa 4; menú 9 (Viva la Vida) solo en domingo.
 *  - Solo la gastronomía computa para el mínimo; si no se llega se factura el mínimo.
 *  - Canjes de aperitivos con tope 6 (menús 1-3) / 12 (menús 4-7).
 *  - Barra libre extra: precio × horas × máx(adultos, 50). Tasa SGAE solo si el año la tiene.
 */

export type Tarifa = 1 | 2 | 3 | 4;
export interface PreciosAnio {
  menus: Record<string, (number | null)[] | number>;
  infantil: number; profesional: number; senal: number; tasaSGAE: number;
  extras: Record<string, number | null>;
}
export interface CalendarioAnio {
  tarifas: Record<string, number>;          // 'AAAA-MM-DD' → 1..4
  minimos: Record<string, number>;          // 'AAAA-MM-DD' → 0..6
  importeMinimo: Record<string, number>;    // '0'..'6' → €
}
export interface MenuDef {
  id: string; nombre: string; tipo: string; resumen: string;
  aperitivo: 'gala' | 'gran' | 'basico' | 'vivalavida';
  primero: string | null; segundo: string | null;
  incluye?: string[]; soloTarifa?: number; soloDomingo?: boolean;
}
export interface Canje { aperitivos: number; precio?: number; precioKey?: string; menus?: string[] }
export interface ExtraDef {
  grupo: 'aperitivo' | 'discoteca' | 'servicios'; id: string; nombre: string; desc?: string; gastro: boolean;
  variantes?: [string, string][]; canjes?: Canje[]; excluyeMenus?: string[]; pack?: string[];
  requiere?: string; porPersona?: boolean; minPersonas?: number; horas?: boolean; barra?: boolean;
}
export interface Catalogo {
  menus: MenuDef[]; extras: ExtraDef[]; platos: Record<string, unknown>;
  incluido: string[]; incluidoVivaLaVida: string[];
  pruebaMenu: Record<string, [number, number][]> & { extra: Record<string, number> };
}
export interface Datos { precios: Record<string, PreciosAnio>; calendario: Record<string, CalendarioAnio>; catalogo: Catalogo }

export interface EstadoExtra { on: boolean; variante?: string | null; canje: number; horas: number }
export interface Seleccion {
  fecha: string | null; menu: string | null;
  adultos: number; ninos: number; profesionales: number;
  extras: Record<string, EstadoExtra>;
}
export interface Linea { concepto: string; importe: number; gastro: boolean }
export interface Resultado {
  ok: boolean; motivo?: string;
  anio?: string; tarifa?: number; nivelMinimo?: number;
  lineas: Linea[]; gastro: number; otros: number; minimo: number; ajuste: number;
  total: number; porAdulto: number; canjeados: number; avisos: string[]; incluidos: string[]; senal: number;
}

const CANJE_MAX: Record<string, number> = { gala: 6, gran: 12 };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const euros = (n: number): string => {
  const r = Math.round(n * 100) / 100, e = Math.floor(Math.abs(r)), d = Math.round((Math.abs(r) - e) * 100);
  return (r < 0 ? '-' : '') + String(e).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + String(d).padStart(2, '0') : '') + ' €';
};
const parseIso = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const fechaLarga = (s: string) => { const d = parseIso(s); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };

/** Convierte las filas de Supabase (web_calendario, web_minimos, web_precios, web_catalogo) al formato del motor. */
export function datosDesdeSupabase(
  calendario: { fecha: string; tarifa: number; nivel_minimo: number }[],
  minimos: { anio: number; nivel: number; importe: number | string }[],
  precios: { anio: number; datos: PreciosAnio }[],
  catalogo: Catalogo,
): Datos {
  const cal: Record<string, CalendarioAnio> = {};
  const anio = (a: string | number) => (cal[String(a)] ??= { tarifas: {}, minimos: {}, importeMinimo: {} });
  for (const f of calendario) { const a = anio(f.fecha.slice(0, 4)); a.tarifas[f.fecha] = f.tarifa; a.minimos[f.fecha] = f.nivel_minimo; }
  for (const m of minimos) anio(m.anio).importeMinimo[String(m.nivel)] = Number(m.importe);
  const pr: Record<string, PreciosAnio> = {};
  for (const p of precios) pr[String(p.anio)] = p.datos;
  return { precios: pr, calendario: cal, catalogo };
}

export function estadoInicial(d: Datos, adultos = 100): Seleccion {
  const extras: Record<string, EstadoExtra> = {};
  for (const e of d.catalogo.extras) extras[e.id] = { on: false, variante: e.variantes?.[0][0] ?? null, canje: -1, horas: 1 };
  return { fecha: null, menu: null, adultos, ninos: 0, profesionales: 0, extras };
}

export function infoFecha(d: Datos, fecha: string) {
  const anio = fecha.slice(0, 4), c = d.calendario[anio];
  const tarifa = c?.tarifas[fecha];
  if (!tarifa) return null;
  const nivelMinimo = c.minimos[fecha];
  return { anio, tarifa, nivelMinimo, minimo: c.importeMinimo[String(nivelMinimo)], domingo: parseIso(fecha).getDay() === 0 };
}

/** Fechas reservables (con tarifa) a partir de hoy, para pintar el calendario. */
export function fechasDisponibles(d: Datos, desde = new Date().toISOString().slice(0, 10)) {
  return Object.values(d.calendario).flatMap((c) => Object.keys(c.tarifas)).filter((f) => f >= desde).sort();
}

export const menuDef = (d: Datos, id: string) => d.catalogo.menus.find((m) => m.id === id)!;

export function precioMenu(d: Datos, sel: Seleccion, id: string): number | null {
  const inf = sel.fecha ? infoFecha(d, sel.fecha) : null;
  if (!inf) return null;
  const v = d.precios[inf.anio].menus[id];
  return Array.isArray(v) ? v[inf.tarifa - 1] : v;
}

export function menuDisponible(d: Datos, sel: Seleccion, id: string): { ok: boolean; motivo?: string } {
  if (!sel.fecha) return { ok: false, motivo: 'Elige antes una fecha' };
  const inf = infoFecha(d, sel.fecha)!, m = menuDef(d, id);
  if (m.soloTarifa && inf.tarifa !== m.soloTarifa) return { ok: false, motivo: `Solo en fechas de Tarifa ${m.soloTarifa}` };
  if (m.soloDomingo && !inf.domingo) return { ok: false, motivo: 'Solo domingos' };
  return precioMenu(d, sel, id) == null ? { ok: false, motivo: 'No disponible' } : { ok: true };
}

const precioExtra = (d: Datos, anio: string, key: string) => d.precios[anio].extras[key];

export function extraDisponible(d: Datos, sel: Seleccion, e: ExtraDef): boolean {
  if (!sel.fecha) return false;
  const anio = sel.fecha.slice(0, 4), key = e.variantes ? e.variantes[0][0] : e.id;
  if (precioExtra(d, anio, key) == null) return false;
  return !(e.excluyeMenus && sel.menu && e.excluyeMenus.includes(sel.menu));
}

export function canjesValidos(d: Datos, sel: Seleccion, e: ExtraDef): { canje: Canje; indice: number }[] {
  if (!e.canjes || !sel.menu || !CANJE_MAX[menuDef(d, sel.menu).aperitivo]) return [];
  return e.canjes.map((canje, indice) => ({ canje, indice })).filter(({ canje }) => !canje.menus || canje.menus.includes(sel.menu!));
}

export function bloqueadoPorPack(d: Datos, sel: Seleccion, e: ExtraDef): boolean {
  return d.catalogo.extras.some((p) => p.pack && sel.extras[p.id]?.on && extraDisponible(d, sel, p) && p.pack.includes(e.id));
}

export function requisitoPendiente(d: Datos, sel: Seleccion, e: ExtraDef): ExtraDef | null {
  if (!e.requiere) return null;
  const req = d.catalogo.extras.find((x) => x.id === e.requiere)!;
  return sel.extras[req.id]?.on && extraDisponible(d, sel, req) ? null : req;
}

/** Precio a mostrar junto a cada extra (texto). */
export function etiquetaPrecio(d: Datos, sel: Seleccion, e: ExtraDef): string {
  if (!sel.fecha) return '';
  const anio = sel.fecha.slice(0, 4), st = sel.extras[e.id];
  const p = precioExtra(d, anio, e.variantes ? (st?.variante ?? e.variantes[0][0]) : e.id);
  if (p == null) return '';
  if (e.porPersona) return `${euros(p)} p.p.${e.minPersonas ? ` (mín. ${e.minPersonas})` : ''}`;
  if (e.barra) return `${euros(p)} p.p./h`;
  if (e.horas) return `${euros(p)} /h`;
  return euros(p);
}

function importeExtra(d: Datos, sel: Seleccion, anio: string, e: ExtraDef): { importe: number; canjeAp?: number } {
  const st = sel.extras[e.id];
  const base = precioExtra(d, anio, e.variantes ? (st.variante ?? e.variantes[0][0]) : e.id) ?? 0;
  if (st.canje >= 0 && e.canjes?.[st.canje] && canjesValidos(d, sel, e).some((c) => c.indice === st.canje)) {
    const c = e.canjes[st.canje];
    return { importe: c.precioKey ? (precioExtra(d, anio, c.precioKey) ?? 0) : (c.precio ?? 0), canjeAp: c.aperitivos };
  }
  if (e.porPersona) return { importe: base * Math.max(sel.adultos + sel.ninos, e.minPersonas ?? 0) };
  if (e.barra) return { importe: base * st.horas * Math.max(sel.adultos, 50) };
  if (e.horas) return { importe: base * st.horas };
  return { importe: base };
}

/** Extras que realmente cuentan (activos, disponibles, sin pack que los cubra y con su requisito). */
function extrasActivos(d: Datos, sel: Seleccion): ExtraDef[] {
  return d.catalogo.extras.filter((e) => sel.extras[e.id]?.on && extraDisponible(d, sel, e) && !bloqueadoPorPack(d, sel, e) && !requisitoPendiente(d, sel, e));
}

export function incluidos(d: Datos, sel: Seleccion, baseGastro: number): string[] {
  if (!sel.menu || !sel.fecha) return [];
  const m = menuDef(d, sel.menu), anio = sel.fecha.slice(0, 4), c = d.catalogo;
  if (m.aperitivo === 'vivalavida') return [...c.incluidoVivaLaVida];
  const l: string[] = [];
  if (m.aperitivo === 'gala') l.push('Aperitivo de Gala (24 referencias), primer plato, sorbete casero, segundo plato y postre');
  if (m.aperitivo === 'gran' && m.id !== '7') l.push('Gran Aperitivo Mas Llombart (42 referencias), sorbete casero, segundo plato y postre');
  if (m.id === '7') l.push('Gran Aperitivo Mas Llombart (42 referencias) con ' + (m.incluye ?? []).join(', ').toLowerCase());
  if (m.aperitivo === 'basico') l.push('Aperitivo Mas Llombart (15 referencias), primer plato, segundo plato y postre');
  l.push(...c.incluido);
  let n = 2;
  for (const [umbral, personas] of c.pruebaMenu[anio] ?? []) if (baseGastro > umbral) { n = personas; break; }
  l.push(`Prueba de menú para ${n === 2 ? 'la pareja' : n + ' personas'} (persona adicional: ${euros(c.pruebaMenu.extra[anio])})`);
  if (sel.extras.ceremonia?.on) l.push('Ceremonia civil con sillas, decoración floral, megafonía, música del DJ, agua, limonada, naranjada y cocktail de cava, con plan B interior');
  return l;
}

export function calcular(d: Datos, sel: Seleccion): Resultado {
  const vacio: Resultado = { ok: false, lineas: [], gastro: 0, otros: 0, minimo: 0, ajuste: 0, total: 0, porAdulto: 0, canjeados: 0, avisos: [], incluidos: [], senal: 0 };
  if (!sel.fecha) return { ...vacio, motivo: 'Elige una fecha' };
  const inf = infoFecha(d, sel.fecha);
  if (!inf) return { ...vacio, motivo: 'Fecha no disponible' };
  const base = { ...vacio, anio: inf.anio, tarifa: inf.tarifa, nivelMinimo: inf.nivelMinimo, minimo: inf.minimo, senal: d.precios[inf.anio].senal };
  if (!sel.menu || !menuDisponible(d, sel, sel.menu).ok) return { ...base, motivo: 'Elige el menú' };

  const P = d.precios[inf.anio], md = menuDef(d, sel.menu), pm = precioMenu(d, sel, sel.menu)!;
  const lineas: Linea[] = [];
  if (sel.adultos) lineas.push({ concepto: `${md.nombre} × ${sel.adultos}`, importe: pm * sel.adultos, gastro: true });
  if (sel.ninos) lineas.push({ concepto: `Menú infantil × ${sel.ninos}`, importe: P.infantil * sel.ninos, gastro: true });
  if (sel.profesionales) lineas.push({ concepto: `Menú profesionales × ${sel.profesionales}`, importe: P.profesional * sel.profesionales, gastro: true });
  let canjeados = 0;
  for (const e of extrasActivos(d, sel)) {
    const st = sel.extras[e.id], r = importeExtra(d, sel, inf.anio, e);
    let nom = e.nombre;
    if (e.variantes) nom += ` (${e.variantes.find((v) => v[0] === st.variante)?.[1] ?? e.variantes[0][1]})`;
    if (r.canjeAp) { nom += ` · canje ${r.canjeAp} aperitivos`; canjeados += r.canjeAp; }
    if (e.horas) nom += ` · ${st.horas} h`;
    lineas.push({ concepto: nom, importe: r.importe, gastro: e.gastro });
  }
  if (P.tasaSGAE) lineas.push({ concepto: 'Licencia derechos de comunicación pública (SGAE/AGEDI)', importe: P.tasaSGAE, gastro: false });

  const gastro = lineas.filter((l) => l.gastro).reduce((s, l) => s + l.importe, 0);
  const otros = lineas.filter((l) => !l.gastro).reduce((s, l) => s + l.importe, 0);
  const ajuste = Math.max(0, inf.minimo - gastro);
  const total = gastro + ajuste + otros;
  const avisos: string[] = [];
  const tope = CANJE_MAX[md.aperitivo] ?? 0;
  if (canjeados > tope) avisos.push(`Habéis canjeado ${canjeados} aperitivos y este menú permite un máximo de ${tope}. Cambiad algún extra a "pagar completo".`);
  return { ...base, ok: true, lineas, gastro, otros, ajuste, total, porAdulto: sel.adultos ? total / sel.adultos : 0, canjeados, avisos, incluidos: incluidos(d, sel, gastro + ajuste) };
}

/** Devuelve una selección nueva con los extras de gastronomía que cubren el déficit con el menor exceso. */
export function sugerirExtras(d: Datos, sel: Seleccion): Seleccion | null {
  const r = calcular(d, sel);
  if (!r.ok || !r.ajuste) return null;
  const anio = r.anio!;
  const cand = d.catalogo.extras
    .filter((e) => e.gastro && !e.pack && !e.requiere && !sel.extras[e.id].on && extraDisponible(d, sel, e) && !bloqueadoPorPack(d, sel, e))
    .map((e) => {
      const key = e.variantes ? e.variantes[0][0] : e.id;
      let p = precioExtra(d, anio, key) ?? 0;
      if (e.porPersona) p *= Math.max(sel.adultos + sel.ninos, e.minPersonas ?? 0);
      return { e, p, v: e.variantes ? key : null };
    })
    .filter((c) => c.p > 0).sort((a, b) => b.p - a.p).slice(0, 18);
  let mejor: { mask: number; ex: number; k: number } | null = null;
  for (let mask = 1; mask < 1 << cand.length; mask++) {
    let s = 0, k = 0;
    for (let i = 0; i < cand.length; i++) if (mask & (1 << i)) { s += cand[i].p; k++; }
    if (s < r.ajuste) continue;
    const ex = s - r.ajuste;
    if (!mejor || ex < mejor.ex - 0.01 || (Math.abs(ex - mejor.ex) < 0.01 && k < mejor.k)) mejor = { mask, ex, k };
  }
  if (!mejor) return null;
  const extras = { ...sel.extras };
  cand.forEach((c, i) => { if (mejor!.mask & (1 << i)) extras[c.e.id] = { ...extras[c.e.id], on: true, canje: -1, variante: c.v ?? extras[c.e.id].variante }; });
  return { ...sel, extras };
}

/** Texto del presupuesto (WhatsApp, email, campo desglose). */
export function textoResumen(d: Datos, sel: Seleccion, enlace?: string): string {
  const r = calcular(d, sel);
  if (!r.ok) return '';
  let t = `Presupuesto web Mas Llombart\nFecha: ${fechaLarga(sel.fecha!)} (Tarifa ${r.tarifa}, mínimo ${euros(r.minimo)})\n`;
  t += `Adultos: ${sel.adultos} · Niños: ${sel.ninos} · Profesionales: ${sel.profesionales}\n`;
  for (const l of r.lineas) t += `- ${l.concepto}: ${euros(l.importe)}\n`;
  if (r.ajuste) t += `- Ajuste hasta mínimo: ${euros(r.ajuste)}\n`;
  t += `TOTAL ESTIMADO (IVA incl.): ${euros(r.total)}`;
  if (enlace) t += `\nEnlace: ${enlace}`;
  return t;
}

/** Enlace wa.me al 672 494 212 con el presupuesto ya escrito. */
export function enlaceWhatsapp(d: Datos, sel: Seleccion, nombres = '', enlace?: string, telefono = '34672494212'): string {
  const intro = `Hola, ${nombres.trim() ? 'somos ' + nombres.trim() + '. ' : ''}Hemos hecho nuestro presupuesto en la web, nos gusta y queremos que nos contactéis.\n\n`;
  return `https://wa.me/${telefono}?text=${encodeURIComponent(intro + (textoResumen(d, sel, enlace) || 'Aún no hemos elegido fecha y menú.'))}`;
}

/** Selección ⇄ query string (?f=&m=&a=&n=&p=&x=id:variante:canje:horas,...) para enlaces compartibles. */
export function aQuery(sel: Seleccion): string {
  const q = new URLSearchParams();
  if (sel.fecha) q.set('f', sel.fecha);
  if (sel.menu) q.set('m', sel.menu);
  q.set('a', String(sel.adultos));
  if (sel.ninos) q.set('n', String(sel.ninos));
  if (sel.profesionales) q.set('p', String(sel.profesionales));
  const x = Object.entries(sel.extras).filter(([, s]) => s.on).map(([id, s]) => [id, s.variante ?? '', s.canje, s.horas].join(':'));
  if (x.length) q.set('x', x.join(','));
  return q.toString();
}
export function desdeQuery(d: Datos, query: string): Seleccion {
  const q = new URLSearchParams(query), sel = estadoInicial(d);
  const n = (k: string, max: number) => Math.min(Math.max(parseInt(q.get(k) ?? '', 10) || 0, 0), max);
  sel.adultos = q.get('a') ? n('a', 400) : 100; sel.ninos = n('n', 200); sel.profesionales = n('p', 20);
  const f = q.get('f');
  if (f && /^\d{4}-\d{2}-\d{2}$/.test(f) && infoFecha(d, f)) sel.fecha = f;
  const m = q.get('m');
  if (m && d.catalogo.menus.some((x) => x.id === m)) sel.menu = m;
  for (const t of (q.get('x') ?? '').split(',').filter(Boolean)) {
    const [id, v, c, h] = t.split(':');
    if (!sel.extras[id]) continue;
    sel.extras[id] = { on: true, variante: v || sel.extras[id].variante, canje: Number.isFinite(parseInt(c, 10)) ? parseInt(c, 10) : -1, horas: Math.min(Math.max(parseInt(h, 10) || 1, 1), 6) };
  }
  return sel;
}
