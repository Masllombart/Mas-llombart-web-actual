(function () {
  'use strict';
  var abrir = document.querySelector('.boton-menu'), panel = document.getElementById('panel-menu'), velo = document.getElementById('velo');
  if (!abrir || !panel) return;
  var cerrarBtn = panel.querySelector('.cerrar');
  function estado(abierto) {
    panel.classList.toggle('abierto', abierto);
    panel.setAttribute('aria-hidden', abierto ? 'false' : 'true');
    panel.inert = !abierto;
    abrir.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    if (velo) velo.hidden = !abierto;
    if (abierto) cerrarBtn.focus(); else abrir.focus();
  }
  panel.inert = true;
  abrir.addEventListener('click', function () { estado(true); });
  cerrarBtn.addEventListener('click', function () { estado(false); });
  if (velo) velo.addEventListener('click', function () { estado(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('abierto')) estado(false); });
})();

/* Formulario de Contáctanos: llega a la intranet (bandeja "Solicitudes web") y, de respaldo, a Netlify Forms */
(function () {
  var form = document.querySelector('form[name="contacto"]');
  if (!form || !window.fetch || !window.Promise || !Promise.allSettled) return;
  var URL_INTRANET = 'https://mtmiykxmxcchubgewpyq.supabase.co/functions/v1/solicitud-web';
  var est = document.createElement('p');
  est.className = 'estado-form'; est.setAttribute('role', 'status');
  form.appendChild(est);
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var fd = new FormData(form), obj = { origen: 'contacto' };
    fd.forEach(function (v, k) { obj[k] = v; });
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    est.className = 'estado-form'; est.textContent = 'Enviando…';
    var aIntranet = fetch(URL_INTRANET, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); });
    var aNetlify = fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() })
      .then(function (r) { if (!r.ok) throw new Error(r.status); });
    Promise.allSettled([aIntranet, aNetlify]).then(function (res) {
      if (res[0].status === 'fulfilled' || res[1].status === 'fulfilled') { window.location.href = '/gracias/'; return; }
      if (btn) btn.disabled = false;
      est.className = 'estado-form error';
      est.innerHTML = 'No se ha podido enviar. Escribidnos a <a href="mailto:info@masllombart.com">info@masllombart.com</a> o por WhatsApp al 672 494 212.';
    });
  });
})();
