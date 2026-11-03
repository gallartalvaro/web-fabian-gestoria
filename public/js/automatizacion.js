/* Página de automatización: las tres cifras de la sección de prueba
   cuentan hasta su valor la primera vez que entran en pantalla.

   Si el visitante ha pedido menos movimiento, o el navegador no tiene
   IntersectionObserver, no se toca nada: la cifra ya está escrita en
   el HTML, así que se ve igual. */
(function () {
  "use strict";

  var cifras = document.querySelectorAll(".prueba__cifra");
  if (!cifras.length) return;
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function contar(nodo) {
    var destino = parseInt(nodo.textContent, 10);
    if (isNaN(destino) || destino === 0) return;

    var inicio = null;
    var duracion = 900;

    function paso(ahora) {
      if (inicio === null) inicio = ahora;
      var avance = Math.min((ahora - inicio) / duracion, 1);
      // Frena al llegar en vez de ir a velocidad constante.
      var suave = 1 - Math.pow(1 - avance, 3);
      nodo.textContent = String(Math.round(destino * suave));
      if (avance < 1) requestAnimationFrame(paso);
    }

    nodo.textContent = "0";
    requestAnimationFrame(paso);
  }

  var observador = new IntersectionObserver(
    function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        contar(entrada.target);
        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.6 }
  );

  Array.prototype.forEach.call(cifras, function (cifra) {
    observador.observe(cifra);
  });
})();
