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
