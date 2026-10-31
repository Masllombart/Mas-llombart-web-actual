// COPIA de src/lib/pdfElegante.js de la intranet (mismo diseño «Elegante» que la intranet). No editar aquí:
// se cambia allí y se vuelve a copiar.
(function () {
// Diseño «Elegante» de Mas Llombart para los PDF de presupuesto y factura (jsPDF).
// Marco dorado doble, logo en Cormorant cursiva, títulos espaciados y tablas con punteado, como las minutas.
// Todo cabe SIEMPRE en un A4: se dibuja con una escala k (letra y espacios) y se va reduciendo hasta que quepa.
// Si ni con la escala mínima cabe, devuelve cabe:false (la factura no se saca y se pide resumir).
//
// Este archivo se usa tal cual en la intranet y se copia a la web (src/assets/js/pdf-elegante.js) con
// scripts/copiar-pdf-web.mjs: no importa nada y no depende de React. Las fuentes llegan en base64 (fuentesPdf.js).

var W = 210, H = 297, M = 20, ANCHO = W - 2 * M, K_MIN = 0.62;
var ORO = [184, 150, 110], ORO_D = [154, 122, 82], ORO_L = [226, 211, 184], TINTA = [26, 35, 50], GRIS = [107, 114, 128], GRIS_L = [138, 143, 153], PUNTO = [217, 201, 173];

/** 1234.5 → «1.234,50 €» (siempre con punto de miles y dos decimales) */
function eurPdf(n) {
  var r = Math.round((Number(n) || 0) * 100) / 100, neg = r < 0, a = Math.abs(r), e = Math.floor(a), c = Math.round((a - e) * 100);
  if (c === 100) { e += 1; c = 0; }
  return (neg ? "-" : "") + String(e).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + String(c).padStart(2, "0") + " €";
}
/** «ES7400810191940001533257» → «ES74 0081 0191 9400 0153 3257» */
function ibanBonito(iban) { return String(iban || "").replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim(); }

var SEPARADORES = new RegExp("[\\u00a0\\u2028\\u2029]", "g");
var limpio = function (t) { return String(t == null ? "" : t).replace(SEPARADORES, " "); };

function nuevoDoc(jsPDF, F) {
  var doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  Object.keys(F).forEach(function (n) { doc.addFileToVFS(n + ".ttf", F[n]); doc.addFont(n + ".ttf", n, "normal"); });
  return doc;
}
function color(doc, c, que) { if (que === "fill") doc.setFillColor(c[0], c[1], c[2]); else if (que === "draw") doc.setDrawColor(c[0], c[1], c[2]); else doc.setTextColor(c[0], c[1], c[2]); }
function letra(doc, fuente, pt) { doc.setFont(fuente, "normal"); doc.setFontSize(pt); }
var mmDe = function (pt) { return pt * 0.3528; }; // altura de una línea de esa letra (sin interlineado)

function marco(doc) {
  color(doc, ORO, "draw"); doc.setLineWidth(0.35); doc.rect(8, 8, W - 16, H - 16);
  color(doc, ORO_L, "draw"); doc.setLineWidth(0.15); doc.rect(9.6, 9.6, W - 19.2, H - 19.2);
}
function rombo(doc, x, y, r) { doc.triangle(x - r, y, x, y - r, x + r, y, "F"); doc.triangle(x - r, y, x, y + r, x + r, y, "F"); }
function espaciado(doc, t, xCentro, y, sep) {
  var w = doc.getTextWidth(t) + sep * (t.length - 1);
  doc.text(t, xCentro - w / 2, y, { charSpace: sep });
}
// Cabecera centrada: logo, rombos, título espaciado y una línea de datos. Devuelve la y donde sigue.
function cabecera(doc, k, titulo, linea) {
  var y = 14 + 13 * k;
  letra(doc, "Cor-500i", 18 + 18 * k); color(doc, ORO_D); doc.text("Mas Llombart", W / 2, y, { align: "center" });
  y += 2 + 4.5 * k; color(doc, ORO, "fill"); rombo(doc, W / 2 - 6, y, 0.9); rombo(doc, W / 2, y, 0.9); rombo(doc, W / 2 + 6, y, 0.9);
  y += 3 + 5 * k; letra(doc, "Cor-600", 9 + 6 * k); color(doc, TINTA); espaciado(doc, titulo, W / 2, y, 2.6);
  if (linea) { y += 2 + 3.5 * k; letra(doc, "Out-300", 6 + 3.4 * k); color(doc, GRIS); doc.text(limpio(linea), W / 2, y, { align: "center" }); }
  return y + 2 + 7 * k;
}
// Dos columnas «De / Para» (o las que sean): [{titulo, lineas:[...] }]. Devuelve la y donde sigue.
function columnas(doc, k, y, cols) {
  var gap = 10, cw = (ANCHO - gap * (cols.length - 1)) / cols.length, alto = 0, pt = 3 + 6.8 * k, lh = mmDe(pt) * 1.45;
  cols.forEach(function (c, i) {
    var x = M + i * (cw + gap), yy = y;
    letra(doc, "Cor-500i", 4 + 9 * k); color(doc, ORO_D); doc.text(c.titulo, x, yy);
    color(doc, [238, 230, 216], "draw"); doc.setLineWidth(0.25); doc.line(x, yy + 1.6, x + cw, yy + 1.6);
    yy += 2 + lh;
    letra(doc, "Out-300", pt); color(doc, TINTA);
    c.lineas.filter(function (l) { return l != null && l !== ""; }).forEach(function (l, j) {
      if (j === 0 && c.destacarPrimera) letra(doc, "Out-500", pt); else letra(doc, "Out-300", pt);
      var p = doc.splitTextToSize(limpio(l), cw); doc.text(p, x, yy); yy += p.length * lh;
    });
    alto = Math.max(alto, yy - y);
  });
  return y + alto + 1 + 5 * k;
}
// Tabla: cols [{t:"Concepto", w: ancho|null(=resto), al:"left"|"right"}], filas: arrays de textos. Devuelve la y donde sigue.
function tabla(doc, k, y, cols, filas) {
  var fijo = cols.reduce(function (s, c) { return s + (c.w || 0); }, 0), resto = ANCHO - fijo;
  var xs = [], x = M; cols.forEach(function (c) { var w = c.w || resto; xs.push({ x: x, w: w }); x += w; });
  var ptH = 3 + 8 * k, pt = 2 + 8 * k, lh = mmDe(pt) * 1.28, pad = 0.25 + 1.35 * k;
  color(doc, ORO, "draw"); doc.setLineWidth(0.3); doc.line(M, y, W - M, y);
  letra(doc, "Cor-600", ptH); color(doc, TINTA);
  var yH = y + pad + mmDe(ptH) * 0.8;
  cols.forEach(function (c, i) { var p = xs[i]; if (c.al === "right") doc.text(c.t, p.x + p.w - 1, yH, { align: "right" }); else doc.text(c.t, p.x + 1, yH); });
  y = yH + pad; doc.line(M, y, W - M, y);
  letra(doc, "Out-300", pt);
  filas.forEach(function (f) {
    var partes = f.map(function (t, i) { return cols[i].al === "right" ? [limpio(t)] : doc.splitTextToSize(limpio(t), xs[i].w - 2); });
    var n = Math.max.apply(null, partes.map(function (p) { return p.length; }));
    var yT = y + pad + mmDe(pt) * 0.78;
    color(doc, TINTA);
    partes.forEach(function (p, i) { var c = xs[i]; if (cols[i].al === "right") doc.text(p, c.x + c.w - 1, yT, { align: "right" }); else doc.text(p, c.x + 1, yT); });
    y = yT + (n - 1) * lh + pad;
    color(doc, PUNTO, "draw"); doc.setLineWidth(0.2); doc.setLineDashPattern([0.35, 0.7], 0); doc.line(M, y, W - M, y); doc.setLineDashPattern([], 0);
  });
  return y + 1 + 5 * k;
}
// Bloque de totales centrado (50 % del ancho): filas [[texto, importe]] y el total grande. Devuelve la y donde sigue.
function totales(doc, k, y, filas, etiquetaTotal, total, debajo) {
  var w = ANCHO * 0.5, x0 = (W - w) / 2, pt = 3 + 7 * k, lh = mmDe(pt) * 1.5;
  letra(doc, "Out-300", pt); color(doc, [74, 82, 99]);
  filas.forEach(function (f) { y += lh; doc.text(limpio(f[0]), x0 + 1, y); doc.text(limpio(f[1]), x0 + w - 1, y, { align: "right" }); });
  y += 2.2; color(doc, ORO, "draw"); doc.setLineWidth(0.3); doc.line(x0, y, x0 + w, y);
  var ptT = 8 + 14 * k; y += mmDe(ptT) * 0.95 + 1;
  letra(doc, "Cor-600", ptT); color(doc, TINTA);
  doc.text(etiquetaTotal, x0 + 1, y);
  letra(doc, "Out-500", ptT * 0.78); doc.text(limpio(total), x0 + w - 1, y, { align: "right" });
  if (debajo) { y += mmDe(pt) * 1.4; letra(doc, "Out-300", pt * 0.92); color(doc, GRIS); doc.text(limpio(debajo), x0 + w - 1, y, { align: "right" }); }
  return y + 1 + 6 * k;
}
// Texto centrado en gris (avisos). Devuelve la y donde sigue.
function aviso(doc, k, y, texto, colorTexto) {
  var pt = 3 + 6 * k; letra(doc, "Out-300", pt); color(doc, colorTexto || ORO_D);
  var p = doc.splitTextToSize(limpio(texto), ANCHO - 20); doc.text(p, W / 2, y + mmDe(pt), { align: "center" });
  return y + p.length * mmDe(pt) * 1.4 + 2 + 2 * k;
}
// Pie fijo abajo, centrado y sin escalar. Devuelve la y donde empieza (límite del contenido).
function pie(doc, lineas, pintar) {
  var pt = 7.4, lh = mmDe(pt) * 1.45, todas = [];
  letra(doc, "Out-300", pt);
  lineas.filter(Boolean).forEach(function (l) { todas = todas.concat(doc.splitTextToSize(limpio(l), ANCHO)); });
  var y0 = H - 15 - (todas.length - 1) * lh;
  if (pintar) { color(doc, GRIS_L); todas.forEach(function (l, i) { doc.text(l, W / 2, y0 + i * lh, { align: "center" }); }); }
  return y0 - mmDe(pt) - 3;
}
// Prueba escalas de 1 a K_MIN hasta que el contenido no pisa el pie.
function ajustar(jsPDF, F, dibujar) {
  var ultimo = null;
  for (var k = 1; k >= K_MIN - 0.001; k = Math.round((k - 0.04) * 100) / 100) {
    var doc = nuevoDoc(jsPDF, F), r = dibujar(doc, k);
    ultimo = { doc: doc, k: k, cabe: r.yFin <= r.limite };
    if (ultimo.cabe) return ultimo;
  }
  return ultimo;
}

/**
 * Presupuesto de boda.
 * p = { fechaTexto, tarifaTexto, invitadosTexto, menuTexto, cliente?, lineas:[{concepto, importe:number}], total:number,
 *       porAdulto?:number, avisoMinimo?:string, incluidos:[string], senal:number, contacto?:string }
 */
function pdfPresupuestoElegante(jsPDF, F, p) {
  return ajustar(jsPDF, F, function (doc, k) {
    marco(doc);
    var limite = pie(doc, [
      "Paga y señal para reservar la fecha: " + eurPdf(p.senal) + ". Presupuesto orientativo y sin compromiso, sujeto a disponibilidad de la fecha. Las horas extra de barra libre y DJ se pueden decidir el mismo día.",
      p.contacto || "Mas Llombart · Avda. de la Conreria, 16 · Sant Fost de Campsentelles (Barcelona) · info@masllombart.com · WhatsApp 672 494 212 · masllombart.com",
    ], true);
    var y = cabecera(doc, k, "PRESUPUESTO", p.cliente ? "Para " + p.cliente : "Presupuesto estimado de boda");
    y = columnas(doc, k, y, [
      { titulo: "Vuestra boda", destacarPrimera: true, lineas: [p.fechaTexto, p.tarifaTexto] },
      { titulo: "Invitados y menú", lineas: [p.invitadosTexto, p.menuTexto] },
    ]);
    y = tabla(doc, k, y, [{ t: "Concepto", al: "left" }, { t: "Importe", w: 34, al: "right" }],
      p.lineas.map(function (l) { return [l.concepto, eurPdf(l.importe)]; }));
    y = totales(doc, k, y - 3, [], "Total", eurPdf(p.total), "IVA incluido" + (p.porAdulto ? " · " + eurPdf(p.porAdulto) + " por adulto" : ""));
    if (p.avisoMinimo) y = aviso(doc, k, y, p.avisoMinimo);
    // Qué incluye: título centrado y dos columnas con rombos
    y += 3 * k;
    letra(doc, "Cor-500i", 5 + 11 * k); color(doc, ORO_D); doc.text("Qué incluye vuestro menú", W / 2, y, { align: "center" });
    y += 1 + 1.5 * k; color(doc, ORO, "draw"); doc.setLineWidth(0.25); doc.line(W / 2 - 30, y, W / 2 + 30, y); y += 1 + 4.5 * k;
    var pt = 2.5 + 6.6 * k, lh = mmDe(pt) * 1.35, gap = 8, cw = (ANCHO - gap) / 2, col = [[], []], alto = [0, 0];
    letra(doc, "Out-300", pt);
    var items = (p.incluidos || []).map(function (t) { var l = doc.splitTextToSize(limpio(t), cw - 4); return { l: l, h: l.length * lh + 0.8 * k + 0.4 }; });
    var total = items.reduce(function (s, it) { return s + it.h; }, 0), acum = 0;
    // primera mitad (por altura) a la izquierda, el resto a la derecha, en orden
    items.forEach(function (it) { var c = acum + it.h / 2 <= total / 2 ? 0 : 1; col[c].push(it); alto[c] += it.h; acum += it.h; });
    color(doc, TINTA);
    col.forEach(function (lista, c) {
      var yy = y + mmDe(pt) * 0.8, x = M + c * (cw + gap);
      lista.forEach(function (it) { color(doc, ORO, "fill"); rombo(doc, x + 1, yy - mmDe(pt) * 0.33, 0.6); color(doc, TINTA); doc.text(it.l, x + 4, yy); yy += it.h; });
    });
    y += Math.max(alto[0], alto[1]);
    return { yFin: y, limite: limite };
  });
}

/**
 * Factura (o rectificativa).
 * f = { num, fecha:"AAAA-MM-DD", fechaEvento?, rectifica?, motivo?, emisor:{nombre,cif,dir,estab,email,tel},
 *       cliente:{nombre,nif,dir,ref}, lineas:[{concepto,uds,precio,dto,iva,total}], desglose:[{iva,base,cuota}],
 *       dtoGlobal?, total, iban?, notas?:[string] }
 */
function pdfFacturaElegante(jsPDF, F, f) {
  var fD = function (s) { if (!s) return ""; var p = String(s).slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
  var conDto = f.lineas.some(function (l) { return Number(l.dto) > 0; });
  var e = f.emisor || {};
  return ajustar(jsPDF, F, function (doc, k) {
    marco(doc);
    var limite = pie(doc, [
      "Precios con IVA incluido. Base imponible y cuota de IVA desglosadas por tipo.",
      f.iban ? "Forma de pago: transferencia bancaria · IBAN " + ibanBonito(f.iban) : "",
    ].concat(f.notas || []).concat([(e.estab || "") + " · " + (e.email || "") + " · " + (e.tel || "")]), true);
    var y = cabecera(doc, k, f.rectifica ? "FACTURA RECTIFICATIVA" : "FACTURA",
      "Nº " + f.num + " · " + fD(f.fecha) + (f.fechaEvento ? " · Evento " + fD(f.fechaEvento) : ""));
    y = columnas(doc, k, y, [
      { titulo: "De", lineas: [e.nombre, "CIF " + e.cif, e.dir] },
      { titulo: "Para", destacarPrimera: true, lineas: [f.cliente.nombre, f.cliente.nif ? "NIF/CIF " + f.cliente.nif : "", f.cliente.dir, f.cliente.ref ? "Su referencia: " + f.cliente.ref : ""] },
    ]);
    if (f.rectifica) y = aviso(doc, k, y - 2, "Rectifica y anula la factura nº " + f.rectifica + (f.motivo ? ". Motivo: " + f.motivo : ""), [197, 48, 48]);
    var cols = [{ t: "Concepto", al: "left" }, { t: "Uds.", w: 13, al: "right" }, { t: "Precio", w: 25, al: "right" }];
    if (conDto) cols.push({ t: "Dto.", w: 13, al: "right" });
    cols.push({ t: "IVA", w: 13, al: "right" }, { t: "Importe", w: 28, al: "right" });
    y = tabla(doc, k, y, cols, f.lineas.map(function (l) {
      var r = [l.concepto, String(l.uds), eurPdf(l.precio)];
      if (conDto) r.push(Number(l.dto) > 0 ? l.dto + " %" : "");
      return r.concat([l.iva + " %", eurPdf(l.total)]);
    }));
    var filas = [];
    if (f.dtoGlobal) filas.push(["Descuento global", f.dtoGlobal + " %"]);
    f.desglose.forEach(function (d) { filas.push(["Base imponible " + d.iva + " %", eurPdf(d.base)]); filas.push(["IVA " + d.iva + " %", eurPdf(d.cuota)]); });
    y = totales(doc, k, y - 3, filas, "Total", eurPdf(f.total));
    return { yFin: y, limite: limite };
  });
}

window.MLPdf = { pdfPresupuestoElegante: pdfPresupuestoElegante, pdfFacturaElegante: pdfFacturaElegante, eurPdf: eurPdf };
})();
