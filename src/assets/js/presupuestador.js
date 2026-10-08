/* Presupuestador de bodas Mas Llombart — 2027 y 2028.
   Datos en <script type="application/json" id="pz-datos"> generados desde src/data/*.json.
   Reglas: IVA incluido; solo la gastronomía computa para el mínimo de la fecha. */
(function () {
  'use strict';
  var nodoDatos = document.getElementById('pz-datos');
  if (!nodoDatos) return;
  var D = JSON.parse(nodoDatos.textContent);
  var P = D.precios, CAL = D.calendario, CAT = D.catalogo;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var f = function (n) {
    var r = Math.round(n * 100) / 100, ent = Math.floor(Math.abs(r)), dec = Math.round((Math.abs(r) - ent) * 100);
    var t = String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (r < 0 ? '-' : '') + t + (dec ? ',' + String(dec).padStart(2, '0') : '') + '\u00a0€';
  };
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var CANJE_MAX = { gala: 6, gran: 12 };

  var S = { fecha: null, anio: null, tarifa: null, nivelMin: null, menu: null, adultos: 100, ninos: 0, prof: 0, extras: {} };
  CAT.extras.forEach(function (e) { S.extras[e.id] = { on: false, variante: e.variantes ? e.variantes[0][0] : null, canje: -1, horas: 1 }; });

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function hoyIso() { return iso(new Date()); }
  function infoFecha(s) {
    var a = s.slice(0, 4); if (!CAL[a]) return null;
    var t = CAL[a].tarifas[s]; if (!t) return null;
    var m = CAL[a].minimos[s];
    return { anio: a, tarifa: t, nivelMin: m, minimo: CAL[a].importeMinimo[String(m)] };
  }
  function precioExtra(key) { return P[S.anio].extras[key]; }
  function menuDef(id) { return CAT.menus.filter(function (m) { return m.id === id; })[0]; }
  function precioMenu(id) {
    if (!S.anio) return null;
    var v = P[S.anio].menus[id];
    if (Array.isArray(v)) return v[S.tarifa - 1];
    return v;
  }
  function menuDisponible(id) {
    var m = menuDef(id); if (!S.fecha) return false;
    if (m.soloTarifa && S.tarifa !== m.soloTarifa) return false;
    if (m.soloDomingo && parseIso(S.fecha).getDay() !== 0) return false;
    return precioMenu(id) != null;
  }

  /* ---------- Calendario ---------- */
  var fechas = Object.keys(CAL['2027'].tarifas).concat(Object.keys(CAL['2028'].tarifas)).sort();
  var primera = fechas.filter(function (x) { return x >= hoyIso(); })[0] || fechas[0];
  var vista = parseIso(primera); vista.setDate(1);
  var MIN_VISTA = new Date(2027, 0, 1), MAX_VISTA = new Date(2028, 11, 1);

  function pintarCalendario() {
    $('#cal-mes').textContent = MESES[vista.getMonth()] + ' ' + vista.getFullYear();
    $('#cal-prev').disabled = vista <= MIN_VISTA;
    $('#cal-next').disabled = vista >= MAX_VISTA;
    var g = $('#cal'); g.innerHTML = '';
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (d, i) {
      var c = document.createElement('div'); c.className = 'dow'; c.textContent = d;
      c.setAttribute('aria-hidden', 'true'); g.appendChild(c);
    });
    var y = vista.getFullYear(), mo = vista.getMonth();
    var off = (new Date(y, mo, 1).getDay() + 6) % 7;
    for (var i = 0; i < off; i++) g.appendChild(document.createElement('span'));
    var dias = new Date(y, mo + 1, 0).getDate(), hoy = hoyIso();
    for (var d = 1; d <= dias; d++) {
      var s = iso(new Date(y, mo, d)), inf = infoFecha(s), b = document.createElement('button');
      b.type = 'button'; b.textContent = d;
      var nombre = DIAS[new Date(y, mo, d).getDay()] + ' ' + d + ' de ' + MESES[mo] + ' de ' + y;
      if (inf && s >= hoy) {
        b.className = 'disp t' + inf.tarifa + (s === S.fecha ? ' sel' : '');
        b.setAttribute('aria-label', nombre + ', tarifa ' + inf.tarifa);
        b.dataset.fecha = s;
        if (s === S.fecha) b.setAttribute('aria-pressed', 'true');
      } else {
        b.disabled = true; b.setAttribute('aria-label', nombre + ', no disponible');
      }
      g.appendChild(b);
    }
  }
  $('#cal-prev').addEventListener('click', function () { vista.setMonth(vista.getMonth() - 1); pintarCalendario(); });
  $('#cal-next').addEventListener('click', function () { vista.setMonth(vista.getMonth() + 1); pintarCalendario(); });
  $('#cal').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-fecha]'); if (!b) return;
    elegirFecha(b.dataset.fecha);
  });

  function elegirFecha(s) {
    var inf = infoFecha(s); if (!inf) return;
    S.fecha = s; S.anio = inf.anio; S.tarifa = inf.tarifa; S.nivelMin = inf.nivelMin;
    vista = parseIso(s); vista.setDate(1);
    var d = parseIso(s), dom = d.getDay() === 0;
    var txt = '<strong>' + DIAS[d.getDay()].replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear() + '</strong><br>' +
      'Tarifa ' + inf.tarifa + ' · Mínimo de presupuesto en gastronomía: <strong>' + f(inf.minimo) + '</strong>';
    if (dom) txt += '<br><span class="pz-nota">Las bodas en domingo se celebran a mediodía (ceremonia como máximo a las 14 h)' +
      (inf.anio === '2027' ? ', salvo que el lunes sea festivo nacional o en agosto.' : ', salvo que el día siguiente sea festivo nacional o en Cataluña.') + '</span>';
    txt += '<br><span class="pz-nota">La disponibilidad real de la fecha se confirma con nuestro equipo.</span>';
    $('#fecha-info').innerHTML = txt; $('#fecha-info').hidden = false;
    if (S.menu && !menuDisponible(S.menu)) S.menu = null;
    pintarCalendario(); pintarMenus(); pintarExtras(); calcular();
  }

  /* ---------- Menús ---------- */
  function listaPlatos(m) {
    var h = '', pl = CAT.platos;
    function ul(t, arr) { return '<h4>' + t + '</h4><ul>' + arr.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
    if (m.aperitivo === 'gala') h += ul('Aperitivo de Gala (24 referencias)', pl.gala);
    if (m.aperitivo === 'gran') h += ul('Gran Aperitivo Mas Llombart (42 referencias)', pl.gala.concat(pl.granExtra));
    if (m.aperitivo === 'basico') h += ul('Aperitivo Mas Llombart (15 referencias)', pl.basico);
    if (m.aperitivo === 'vivalavida') h += ul('Qué incluye Viva la Vida', pl.vivalavida);
    if (m.incluye) h += ul('Buffets y shows incluidos', m.incluye);
    if (m.primero) h += ul('Primeros platos (a elegir uno)', pl.primeros[m.primero]);
    if (m.segundo) h += ul('Segundos platos (a elegir uno)', pl.segundos[m.segundo]);
    if (m.aperitivo !== 'vivalavida') h += ul('Postres (a elegir uno)', pl.postres);
    return h;
  }
  function pintarMenus() {
    var c = $('#menus'); c.innerHTML = '';
    CAT.menus.forEach(function (m) {
      var disp = menuDisponible(m.id), pr = precioMenu(m.id);
      var l = document.createElement('label');
      l.className = 'menu-op' + (disp ? '' : ' no-disp');
      var motivo = !S.fecha ? 'Elige antes una fecha' : (m.soloTarifa && S.tarifa !== m.soloTarifa ? 'Solo en fechas de Tarifa ' + m.soloTarifa : (m.soloDomingo ? 'Solo domingos' : ''));
      l.innerHTML = '<input type="radio" name="menu" value="' + m.id + '"' + (S.menu === m.id ? ' checked' : '') + (disp ? '' : ' disabled') + '>' +
        '<span class="pre">' + (disp && pr != null ? f(pr) : '') + '</span>' +
        '<span class="tipo">' + m.tipo + '</span><span class="nom">' + m.nombre + '</span>' +
        '<p class="res">' + (disp ? m.resumen : motivo || m.resumen) + '</p>';
      c.appendChild(l);
    });
    var det = $('#menu-platos');
    if (S.menu) { det.hidden = false; $('#menu-platos-cuerpo').innerHTML = listaPlatos(menuDef(S.menu)); $('#menu-platos-titulo').textContent = 'Ver platos del ' + menuDef(S.menu).nombre; }
    else det.hidden = true;
  }
  $('#menus').addEventListener('change', function (ev) {
    if (ev.target.name !== 'menu') return;
    S.menu = ev.target.value;
    pintarMenus(); pintarExtras(); calcular();
  });

  /* ---------- Comensales ---------- */
  function num(id) { var v = parseInt($(id).value, 10); return isNaN(v) || v < 0 ? 0 : Math.min(v, 400); }
  ['#n-adultos', '#n-ninos', '#n-prof'].forEach(function (id) {
    $(id).addEventListener('input', function () { S.adultos = num('#n-adultos'); S.ninos = num('#n-ninos'); S.prof = num('#n-prof'); pintarExtras(); calcular(); });
  });

  /* ---------- Extras ---------- */
  function extraDisponible(e) {
    if (!S.anio) return false;
    var key = e.variantes ? e.variantes[0][0] : e.id;
    if (precioExtra(key) == null) return false;
    if (e.excluyeMenus && S.menu && e.excluyeMenus.indexOf(S.menu) >= 0) return false;
    return true;
  }
  function canjesValidos(e) {
    if (!e.canjes || !S.menu) return [];
    var ap = menuDef(S.menu).aperitivo; if (!CANJE_MAX[ap]) return [];
    return e.canjes.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) { return !o.c.menus || o.c.menus.indexOf(S.menu) >= 0; });
  }
  function bloqueadoPorPack(e) {
    return CAT.extras.some(function (p) { return p.pack && S.extras[p.id].on && extraDisponible(p) && p.pack.indexOf(e.id) >= 0; });
  }
  function personas() { return S.adultos + S.ninos; }
  function importeExtra(e) {
    var st = S.extras[e.id];
    var key = e.variantes ? st.variante : e.id;
    var base = precioExtra(key);
    if (st.canje >= 0 && e.canjes) {
      var c = e.canjes[st.canje];
      return { importe: c.precioKey ? precioExtra(c.precioKey) : c.precio, canjeAp: c.aperitivos };
    }
    if (e.porPersona) return { importe: base * Math.max(personas(), e.minPersonas || 0) };
    if (e.barra) return { importe: base * st.horas * Math.max(S.adultos, 50) };
    if (e.horas) return { importe: base * st.horas };
    return { importe: base };
  }
  function etiquetaPrecio(e) {
    var key = e.variantes ? S.extras[e.id].variante : e.id, p = precioExtra(key);
    if (p == null) return '';
    if (e.porPersona) return f(p) + ' p.p.' + (e.minPersonas ? ' (mín. ' + e.minPersonas + ')' : '');
    if (e.barra) return f(p) + ' p.p./h';
    if (e.horas) return f(p) + ' /h';
    if (e.pack) { var sin = precioExtra(e.id + 'SinAhorro'); return (sin ? '<s>' + f(sin) + '</s> ' : '') + f(p); }
    return f(p);
  }
  var GRUPOS = { aperitivo: 'Gastronomía en el aperitivo', discoteca: 'Gastronomía en la discoteca', servicios: 'Ceremonia y servicios' };
  function construirExtras() {
    var c = $('#extras'); c.innerHTML = '';
    Object.keys(GRUPOS).forEach(function (g) {
      var sec = document.createElement('div'); sec.className = 'extras-grupo';
      sec.innerHTML = '<h4>' + GRUPOS[g] + '</h4>' + (g !== 'servicios' ? '<p class="pz-nota">Computan para alcanzar el mínimo de presupuesto de la fecha.</p>' : '<p class="pz-nota">No computan para el mínimo de gastronomía.</p>');
      CAT.extras.filter(function (e) { return e.grupo === g; }).forEach(function (e) {
        var d = document.createElement('div'); d.className = 'extra'; d.dataset.id = e.id;
        var idc = 'x-' + e.id;
        var op = '';
        if (e.variantes) op += '<label class="sr-only" for="' + idc + '-v">Opción</label><select id="' + idc + '-v" data-k="variante"></select>';
        if (e.canjes) op += '<label class="sr-only" for="' + idc + '-c">Forma de pago</label><select id="' + idc + '-c" data-k="canje"></select>';
        if (e.horas) op += '<label for="' + idc + '-h">Horas</label><input id="' + idc + '-h" data-k="horas" type="number" min="1" max="6" value="1" inputmode="numeric">';
        d.innerHTML = '<input class="chk" type="checkbox" id="' + idc + '">' +
          '<label for="' + idc + '"><span class="nom">' + e.nombre + '</span>' + (e.desc ? '<span class="desc">' + e.desc + '</span>' : '') + '<span class="desc nota-bloq"></span></label>' +
          '<span class="precio"></span>' + (op ? '<div class="opciones">' + op + '</div>' : '');
        sec.appendChild(d);
      });
      c.appendChild(sec);
    });
  }
  function pintarExtras() {
    CAT.extras.forEach(function (e) {
      var d = $('.extra[data-id="' + e.id + '"]'), st = S.extras[e.id];
      var disp = extraDisponible(e);
      d.classList.toggle('no-disp', !disp);
      if (!disp) { st.on = false; }
      var bloq = disp && bloqueadoPorPack(e);
      var req = e.requiere && !(S.extras[e.requiere].on && extraDisponible(CAT.extras.filter(function (x) { return x.id === e.requiere; })[0]));
      if (bloq || req) st.on = false;
      var chk = $('#x-' + e.id); chk.checked = st.on; chk.disabled = !!(bloq || req || !S.fecha);
      d.classList.toggle('bloqueado', !!(bloq || req));
      $('.nota-bloq', d).textContent = bloq ? 'Incluido en el pack seleccionado.' : (req ? 'Requiere añadir antes: ' + CAT.extras.filter(function (x) { return x.id === e.requiere; })[0].nombre.toLowerCase() + '.' : '');
      d.classList.toggle('activo', st.on);
      if (disp) $('.precio', d).innerHTML = etiquetaPrecio(e);
      if (e.variantes && disp) {
        var sv = $('#x-' + e.id + '-v');
        sv.innerHTML = e.variantes.filter(function (v) { return precioExtra(v[0]) != null; }).map(function (v) { return '<option value="' + v[0] + '"' + (st.variante === v[0] ? ' selected' : '') + '>' + v[1] + ' · ' + f(precioExtra(v[0])) + '</option>'; }).join('');
      }
      if (e.canjes && disp) {
        var sc = $('#x-' + e.id + '-c'), val = canjesValidos(e);
        if (val.every(function (o) { return o.i !== st.canje; })) st.canje = -1;
        var key = e.variantes ? st.variante : e.id;
        sc.innerHTML = '<option value="-1">Pagar completo · ' + f(precioExtra(key)) + '</option>' + val.map(function (o) {
          var pr = o.c.precioKey ? precioExtra(o.c.precioKey) : o.c.precio;
          return '<option value="' + o.i + '"' + (st.canje === o.i ? ' selected' : '') + '>Canjear ' + o.c.aperitivos + ' aperitivos' + (pr ? ' + ' + f(pr) : ' · gratis') + '</option>';
        }).join('');
        sc.disabled = val.length === 0;
      }
    });
  }
  function onExtra(ev) {
    var d = ev.target.closest('.extra'); if (!d) return;
    var id = d.dataset.id, st = S.extras[id], k = ev.target.dataset.k;
    if (ev.target.classList.contains('chk')) st.on = ev.target.checked;
    else if (k === 'variante') st.variante = ev.target.value;
    else if (k === 'canje') st.canje = parseInt(ev.target.value, 10);
    else if (k === 'horas') { var h = parseInt(ev.target.value, 10); st.horas = isNaN(h) || h < 1 ? 1 : Math.min(h, 6); }
    pintarExtras(); calcular();
  }
  $('#extras').addEventListener('change', onExtra);
  $('#extras').addEventListener('input', function (ev) { if (ev.target.dataset.k === 'horas') onExtra(ev); });

  /* ---------- Cálculo ---------- */
  function calcular() {
    var lin = [], gastro = 0, otros = 0, canjeAp = 0, avisos = [];
    if (S.fecha && S.menu && menuDisponible(S.menu)) {
      var pm = precioMenu(S.menu), md = menuDef(S.menu);
      if (S.adultos) { lin.push([md.nombre + ' × ' + S.adultos, pm * S.adultos]); gastro += pm * S.adultos; }
      if (S.ninos) { var pi = P[S.anio].infantil; lin.push(['Menú infantil × ' + S.ninos, pi * S.ninos]); gastro += pi * S.ninos; }
      if (S.prof) { var pp = P[S.anio].profesional; lin.push(['Menú profesionales × ' + S.prof, pp * S.prof]); gastro += pp * S.prof; }
      CAT.extras.forEach(function (e) {
        var st = S.extras[e.id];
        if (!st.on || !extraDisponible(e)) return;
        var r = importeExtra(e), nom = e.nombre;
        if (e.variantes) nom += ' (' + e.variantes.filter(function (v) { return v[0] === st.variante; })[0][1] + ')';
        if (r.canjeAp) { nom += ' · canje ' + r.canjeAp + ' aperitivos'; canjeAp += r.canjeAp; }
        if (e.horas) nom += ' · ' + st.horas + ' h';
        lin.push([nom, r.importe]);
        if (e.gastro) gastro += r.importe; else otros += r.importe;
      });
      var tasa = P[S.anio].tasaSGAE;
      if (tasa) { lin.push(['Licencia derechos de comunicación pública (SGAE/AGEDI)', tasa]); otros += tasa; }
      var cap = CANJE_MAX[md.aperitivo] || 0;
      if (canjeAp > cap) avisos.push('Has canjeado ' + canjeAp + ' aperitivos y este menú permite un máximo de ' + cap + '. Cambia algún extra a "pagar completo".');
    }
    var minimo = S.fecha ? CAL[S.anio].importeMinimo[String(S.nivelMin)] : 0;
    var ajuste = S.menu && gastro < minimo ? minimo - gastro : 0;
    var total = gastro + ajuste + otros;
    pintarResumen({ lin: lin, gastro: gastro, otros: otros, minimo: minimo, ajuste: ajuste, total: total, avisos: avisos, canjeAp: canjeAp });
    guardarUrl();
  }
  var ULTIMO = null;
  function pintarResumen(r) {
    ULTIMO = r;
    var c = $('#resumen-cuerpo');
    if (!S.fecha) { c.innerHTML = '<p>Elige una fecha en el calendario para ver tarifas y mínimos.</p>'; actualizarMovil(null); return; }
    if (!S.menu) { c.innerHTML = '<p>Ahora elige el menú.</p>'; actualizarMovil(null); return; }
    var h = '<table>' + r.lin.map(function (l) { return '<tr><td>' + l[0] + '</td><td>' + f(l[1]) + '</td></tr>'; }).join('');
    if (r.ajuste) h += '<tr><td>Ajuste hasta el mínimo de la fecha</td><td>' + f(r.ajuste) + '</td></tr>';
    h += '</table>';
    var pct = Math.min(100, r.minimo ? r.gastro / r.minimo * 100 : 100);
    h += '<p class="pz-nota">Gastronomía: ' + f(r.gastro) + ' de ' + f(r.minimo) + ' de mínimo</p><div class="barra-min" aria-hidden="true"><i data-w="' + pct.toFixed(0) + '"></i></div>';
    if (r.ajuste) h += '<div class="aviso">Os faltan <strong>' + f(r.ajuste) + '</strong> en gastronomía para el mínimo de esta fecha. Si no lo completáis, se factura el mínimo igualmente: mejor convertirlo en extras para vuestros invitados.<button type="button" class="boton blanco" id="btn-sugerir">Sugerir extras para completarlo</button></div>';
    else h += '<div class="aviso ok">Alcanzáis el mínimo de presupuesto de esta fecha.</div>';
    r.avisos.forEach(function (a) { h += '<div class="aviso">' + a + '</div>'; });
    h += '<p class="total">' + f(r.total) + '</p><p class="pp">Total estimado, IVA incluido' + (S.adultos ? ' · ' + f(r.total / S.adultos) + ' por adulto' : '') + '</p>';
    h += '<p class="pz-nota">Paga y señal para reservar: ' + f(P[S.anio].senal) + '. Las horas extra de barra libre y DJ se recomiendan decidir el mismo día.</p>';
    h += '<details class="incluye" open><summary>Qué incluye este precio</summary><ul>' + incluidos(r).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></details>';
    c.innerHTML = h;
    var barra = $('.barra-min i', c); if (barra) barra.style.width = barra.dataset.w + '%';
    var bs = $('#btn-sugerir'); if (bs) bs.addEventListener('click', sugerir);
    $('#lead-resumen').value = textoResumen();
    if (typeof actualizarWhatsapp === 'function') actualizarWhatsapp();
    actualizarMovil(r.total);
  }
  /* Lo que incluye el precio, según el menú y el importe */
  function incluidos(r) {
    var md = menuDef(S.menu), lst = [];
    if (md.aperitivo === 'vivalavida') return CAT.incluidoVivaLaVida.slice();
    if (md.aperitivo === 'gala') lst.push('Aperitivo de Gala (24 referencias), primer plato, sorbete casero, segundo plato y postre');
    if (md.aperitivo === 'gran' && md.id !== '7') lst.push('Gran Aperitivo Mas Llombart (42 referencias), sorbete casero, segundo plato y postre');
    if (md.id === '7') lst.push('Gran Aperitivo Mas Llombart (42 referencias) con ' + md.incluye.join(', ').toLowerCase());
    if (md.aperitivo === 'basico') lst.push('Aperitivo Mas Llombart (15 referencias), primer plato, segundo plato y postre');
    lst = lst.concat(CAT.incluido);
    var pr = CAT.pruebaMenu[S.anio] || [], base = r.gastro + r.ajuste, n = 2;
    for (var i = 0; i < pr.length; i++) if (base > pr[i][0]) { n = pr[i][1]; break; }
    lst.push('Prueba de menú para ' + (n === 2 ? 'la pareja' : n + ' personas') + ' (persona adicional: ' + f(CAT.pruebaMenu.extra[S.anio]) + ')');
    if (S.extras.ceremonia && S.extras.ceremonia.on) lst.push('Ceremonia civil con sillas, decoración floral, megafonía, música del DJ, agua, limonada, naranjada y cocktail de cava, con plan B interior');
    return lst;
  }
  function actualizarMovil(t) {
    var m = $('#resumen-movil'); if (!m) return;
    if (t == null) { m.hidden = true; document.body.classList.remove('con-resumen'); return; }
    m.hidden = false; document.body.classList.add('con-resumen'); $('#resumen-movil-total').textContent = f(t);
  }
  function textoResumen() {
    if (!ULTIMO || !S.menu) return '';
    var d = parseIso(S.fecha);
    var t = 'Presupuesto web Mas Llombart\nFecha: ' + DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear() + ' (Tarifa ' + S.tarifa + ', mínimo ' + f(ULTIMO.minimo) + ')\n';
    t += 'Adultos: ' + S.adultos + ' · Niños: ' + S.ninos + ' · Profesionales: ' + S.prof + '\n';
    ULTIMO.lin.forEach(function (l) { t += '- ' + l[0] + ': ' + f(l[1]) + '\n'; });
    if (ULTIMO.ajuste) t += '- Ajuste hasta mínimo: ' + f(ULTIMO.ajuste) + '\n';
    t += 'TOTAL ESTIMADO (IVA incl.): ' + f(ULTIMO.total) + '\nEnlace: ' + location.href;
    return t;
  }

  /* Sugerencia: combinación de extras de gastronomía que cubre el déficit con el menor exceso. */
  function sugerir() {
    var falta = ULTIMO.ajuste; if (!falta) return;
    var cand = CAT.extras.filter(function (e) {
      return e.gastro && !e.pack && !S.extras[e.id].on && extraDisponible(e) && !bloqueadoPorPack(e) && !e.requiere;
    }).map(function (e) {
      var key = e.variantes ? e.variantes[0][0] : e.id, p = precioExtra(key);
      if (e.porPersona) p = p * Math.max(personas(), e.minPersonas || 0);
      return { e: e, p: p, v: e.variantes ? key : null };
    }).filter(function (c) { return c.p > 0; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 18);
    var mejor = null, n = cand.length;
    for (var mask = 1; mask < (1 << n); mask++) {
      var s = 0, k = 0;
      for (var i = 0; i < n; i++) if (mask & (1 << i)) { s += cand[i].p; k++; }
      if (s < falta) continue;
      var exceso = s - falta;
      if (!mejor || exceso < mejor.ex - 0.01 || (Math.abs(exceso - mejor.ex) < 0.01 && k < mejor.k)) mejor = { mask: mask, ex: exceso, k: k };
    }
    if (!mejor) { alert('Con los extras disponibles no se alcanza el mínimo; podéis aumentar invitados o cambiar de menú.'); return; }
    for (var j = 0; j < n; j++) if (mejor.mask & (1 << j)) { var st = S.extras[cand[j].e.id]; st.on = true; st.canje = -1; if (cand[j].v) st.variante = cand[j].v; }
    pintarExtras(); calcular();
    $('#extras').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Estado en la URL (enlace compartible) ---------- */
  function guardarUrl() {
    if (!S.fecha) return;
    var q = new URLSearchParams();
    if (S.fecha) q.set('f', S.fecha);
    if (S.menu) q.set('m', S.menu);
    q.set('a', S.adultos); if (S.ninos) q.set('n', S.ninos); if (S.prof) q.set('p', S.prof);
    var ex = [];
    Object.keys(S.extras).forEach(function (id) {
      var st = S.extras[id]; if (!st.on) return;
      ex.push([id, st.variante || '', st.canje, st.horas].join(':'));
    });
    if (ex.length) q.set('x', ex.join(','));
    history.replaceState(null, '', location.pathname + '?' + q.toString() + '#presupuestador');
  }
  function leerUrl() {
    var q = new URLSearchParams(location.search);
    if (q.get('a')) $('#n-adultos').value = q.get('a');
    if (q.get('n')) $('#n-ninos').value = q.get('n');
    if (q.get('p')) $('#n-prof').value = q.get('p');
    S.adultos = num('#n-adultos'); S.ninos = num('#n-ninos'); S.prof = num('#n-prof');
    (q.get('x') || '').split(',').filter(Boolean).forEach(function (t) {
      var p = t.split(':'); if (!S.extras[p[0]]) return;
      var st = S.extras[p[0]]; st.on = true; if (p[1]) st.variante = p[1];
      st.canje = parseInt(p[2], 10); if (isNaN(st.canje)) st.canje = -1;
      st.horas = parseInt(p[3], 10) || 1;
      var hi = $('#x-' + p[0] + '-h'); if (hi) hi.value = st.horas;
    });
    var fq = q.get('f');
    if (fq && /^\d{4}-\d{2}-\d{2}$/.test(fq) && infoFecha(fq) && fq >= hoyIso()) {
      if (q.get('m') && menuDef(q.get('m'))) S.menu = q.get('m');
      elegirFecha(fq);
    }
  }

  /* ---------- Solicitud (lead) ---------- */
  var form = $('#form-presupuesto');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var est = $('#lead-estado');
    if (!S.fecha || !S.menu) { est.className = 'estado-form error'; est.textContent = 'Elige fecha y menú antes de enviar.'; return; }
    $('#lead-resumen').value = textoResumen();
    $('#lead-fecha').value = S.fecha; $('#lead-total').value = ULTIMO ? Math.round(ULTIMO.total) : '';
    var datos = new URLSearchParams(new FormData(form)).toString();
    est.className = 'estado-form'; est.textContent = 'Enviando…';
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: datos })
      .then(function (r) { if (!r.ok) throw new Error(r.status); est.className = 'estado-form ok'; est.textContent = '¡Recibido! Os escribimos en menos de 24 h laborables con vuestro presupuesto detallado.'; form.reset(); })
      .catch(function () { est.className = 'estado-form error'; est.innerHTML = 'No se ha podido enviar. Escribidnos a <a href="mailto:info@masllombart.com">info@masllombart.com</a> o por WhatsApp.'; });
  });
  /* WhatsApp a Javi (672 494 212) con el presupuesto ya escrito */
  var WA_TEL = '34672494212';
  function mensajeWhatsapp() {
    var nom = ($('#wa-nombre').value || $('#l-nombre').value || '').trim();
    var t = 'Hola, ' + (nom ? 'somos ' + nom + '. ' : '') + 'Hemos hecho nuestro presupuesto en la web, nos gusta y queremos que nos contactéis.\n\n';
    return t + (textoResumen() || 'Aún no hemos elegido fecha y menú.');
  }
  function actualizarWhatsapp() {
    $('#btn-whatsapp').href = 'https://wa.me/' + WA_TEL + '?text=' + encodeURIComponent(mensajeWhatsapp());
  }
  $('#wa-nombre').addEventListener('input', actualizarWhatsapp);
  $('#btn-whatsapp').addEventListener('click', function (ev) {
    if (!S.fecha || !S.menu) { ev.preventDefault(); $('#resumen-titulo').scrollIntoView({ behavior: 'smooth' }); return; }
    actualizarWhatsapp();
  });
  $('#btn-imprimir').addEventListener('click', function () { window.print(); });

  construirExtras();
  pintarCalendario(); pintarMenus(); pintarExtras(); leerUrl(); calcular();
})();
