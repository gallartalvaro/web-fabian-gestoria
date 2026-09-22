// ============================================================
// Valentramites — Selector de tarifas (Autónomos / Empresas)
// Patrón ARIA de pestañas: flechas, Inicio y Fin. El grupo elegido
// se refleja en la dirección (#empresas) para poder enlazarlo.
// ============================================================

(function () {
  "use strict";

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tarifa-tipo__btn"));
  var paneles = Array.prototype.slice.call(document.querySelectorAll(".planes"));
  if (!tabs.length) return;

  function elegir(tipo, opciones) {
    opciones = opciones || {};
    tabs.forEach(function (t) {
      var activo = t.dataset.tipo === tipo;
      t.classList.toggle("is-active", activo);
      t.setAttribute("aria-selected", String(activo));
      t.tabIndex = activo ? 0 : -1;
      if (activo && opciones.foco) t.focus();
    });
    paneles.forEach(function (p) {
      p.classList.toggle("is-active", p.dataset.tipo === tipo);
    });
    if (opciones.historial) {
      try {
        history.replaceState(null, "", tipo === "empresas" ? "#empresas" : "#autonomos");
      } catch (err) {
        /* sin historial: no pasa nada */
      }
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      elegir(t.dataset.tipo, { historial: true });
    });
  });

  document.querySelector(".tarifa-tipo").addEventListener("keydown", function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i === -1) return;
    var destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    var t = tabs[(destino + tabs.length) % tabs.length];
    elegir(t.dataset.tipo, { foco: true, historial: true });
  });

  // Enlace directo: precios.html#empresas
  if (window.location.hash === "#empresas") elegir("empresas");
})();
