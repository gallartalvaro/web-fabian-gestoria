/* Demostraciones de los cinco agentes.
   ============================================================
   Cada ficha de agente lleva una escena que representa su flujo de
   trabajo: la conversación de un sábado, la factura que se lee sola,
   el hueco de agenda que se cubre.

   Se construyen a mano, sin ninguna biblioteca de animación, por tres
   razones: el contenido es nuestro —tarifas, plazos y textos reales—,
   la web no tiene empaquetador donde meter un runtime, y una escena
   de estas pesa menos que el logotipo.

   Si no hay JavaScript, o el visitante ha pedido menos movimiento, se
   queda la ilustración de portada y no se pierde nada: el mismo flujo
   está escrito en texto justo al lado. */
(function () {
  "use strict";

  var quieto =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------- utilidades

  function el(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  function poner(escena, nodo) {
    escena.appendChild(nodo);
    return nodo;
  }

  function rotulo(escena, texto) {
    var linea = escena.querySelector(".demo__paso");
    if (!linea) linea = poner(escena, el("p", "demo__paso"));
    linea.textContent = texto;
    // Reinicia la animación para que cada cambio se note.
    linea.classList.remove("es-nuevo");
    void linea.offsetWidth;
    linea.classList.add("es-nuevo");
    return linea;
  }

  function campo(etiqueta, valor) {
    var fila = el("div", "campo");
    fila.appendChild(el("span", "campo__eti", etiqueta));
    fila.appendChild(el("span", "campo__val", valor));
    return fila;
  }

  function marca() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "3");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    var trazo = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trazo.setAttribute("d", "m5 13 4 4 10-10");
    svg.appendChild(trazo);
    return svg;
  }

  // ------------------------------------------------------------- guiones

  var GUIONES = {};

  /* 01 · Atención: el sábado por la noche del taller. */
  GUIONES.atencion = function () {
    var hilo;
    var escribiendo;

    function burbuja(clase, texto, firma) {
      var b = el("p", "burbujilla " + clase, texto);
      if (firma) b.appendChild(el("span", "burbujilla__firma", firma));
      hilo.appendChild(b);
      return b;
    }

    function puntos() {
      escribiendo = el("p", "burbujilla burbujilla--bot escribiendo");
      for (var i = 0; i < 3; i++) escribiendo.appendChild(el("span"));
      hilo.appendChild(escribiendo);
    }

    function quitarPuntos() {
      if (escribiendo && escribiendo.parentNode) escribiendo.parentNode.removeChild(escribiendo);
      escribiendo = null;
    }

    return [
      { ms: 200, hacer: function (e) { hilo = poner(e, el("div", "hilo")); } },
      { ms: 300, hacer: function () { burbuja("burbujilla--ellos", "¿Hacéis la ITV? ¿Cuánto es y cuándo podéis?"); } },
      { ms: 800, hacer: puntos },
      { ms: 1300, hacer: function () {
          quitarPuntos();
          burbuja("burbujilla--bot",
            "Sí. Son 45 € e incluye la gestión. Tengo martes a las 10:00 o miércoles a las 16:30.",
            "Asistente · respuesta automática");
        } },
      { ms: 1500, hacer: function () { burbuja("burbujilla--ellos", "El martes a las 10."); } },
      { ms: 700, hacer: puntos },
      { ms: 1200, hacer: function () {
          quitarPuntos();
          burbuja("burbujilla--bot", "Reservado. El lunes le llega el recordatorio.");
        } },
      { ms: 900, hacer: function (e) {
          var fila = poner(e, el("div", "fichas-demo"));
          [["En la agenda", "Martes 10:00"], ["En el CRM", "Ficha creada"]].forEach(function (par) {
            var caja = el("div", "ficha-demo");
            caja.appendChild(el("p", null, par[0]));
            var fuerte = el("strong");
            fuerte.appendChild(marca());
            fuerte.appendChild(document.createTextNode(par[1]));
            caja.appendChild(fuerte);
            fila.appendChild(caja);
          });
        } },
    ];
  };

  /* 02 · Agenda: el hueco que se libera y se vuelve a llenar. */
  GUIONES.agenda = function () {
    var rejilla;
    var huecos = [];
    var LIBERADO = 8;

    return [
      { ms: 200, hacer: function (e) {
          rejilla = poner(e, el("div", "rejilla"));
          for (var i = 0; i < 20; i++) {
            var h = el("span", "hueco");
            // Siete de los veinte huecos quedan libres: una semana
            // normal, ni vacía ni imposible. Las dos condiciones no se
            // solapan, así que salen 13 ocupados, que es lo que dicen
            // los rótulos de abajo.
            if (i % 7 !== 3 && i % 5 !== 4) {
              h.classList.add("hueco--ocupado");
              h.style.animationDelay = (i * 45) + "ms";
            }
            huecos.push(h);
            rejilla.appendChild(h);
          }
          rotulo(e, "Semana cerrada: 13 citas puestas.");
        } },
      { ms: 1600, hacer: function (e) { rotulo(e, "Jueves, 09:10 · un paciente anula su sesión."); } },
      { ms: 900, hacer: function () {
          huecos[LIBERADO].classList.remove("hueco--ocupado");
          huecos[LIBERADO].classList.add("hueco--libre");
        } },
      { ms: 1100, hacer: function (e) { rotulo(e, "El agente ofrece el hueco a la lista de espera."); } },
      { ms: 1300, hacer: function () {
          huecos[LIBERADO].classList.remove("hueco--libre");
          huecos[LIBERADO].classList.add("hueco--cubierto");
          huecos[LIBERADO].appendChild(marca());
        } },
      { ms: 1000, hacer: function (e) {
          rotulo(e, "Cubierto en nueve minutos, sin llamar a nadie.");
          var r = poner(e, el("div", "resumen-demo"));
          [["9 min", "en cubrirse"], ["0", "llamadas"], ["13", "citas firmes"]].forEach(function (par) {
            var caja = el("div", "resumen-demo__dato");
            caja.appendChild(el("strong", null, par[0]));
            caja.appendChild(el("span", null, par[1]));
            r.appendChild(caja);
          });
        } },
    ];
  };

  /* 03 · Administración: la factura que se lee sola. */
  GUIONES.administracion = function () {
    var documento, campos;

    return [
      { ms: 200, hacer: function (e) {
          rotulo(e, "Llegan 40 correos al buzón de administración.");
          documento = poner(e, el("div", "papel"));
          documento.appendChild(el("p", "papel__titulo", "FACTURA · 2026/0418"));
          [78, 92, 64, 86, 48].forEach(function (ancho) {
            var linea = el("span", "papel__linea");
            linea.style.width = ancho + "%";
            documento.appendChild(linea);
          });
          documento.appendChild(el("span", "papel__barrido"));
        } },
      { ms: 1500, hacer: function (e) {
          rotulo(e, "Lee el documento y saca los datos.");
          campos = poner(e, el("div", "campos"));
          [
            ["Proveedor", "Suministros Bénager, S.L."],
            ["NIF", "B-12345678"],
            ["Fecha", "03/11/2026"],
            ["Base", "1.240,00 €"],
            ["IVA 21 %", "260,40 €"],
            ["Total", "1.500,40 €"],
          ].forEach(function (par, i) {
            var fila = campo(par[0], par[1]);
            fila.style.animationDelay = (i * 160) + "ms";
            campos.appendChild(fila);
          });
        } },
      { ms: 1700, hacer: function (e) {
          var ok = poner(e, el("p", "sello sello--bien"));
          ok.appendChild(marca());
          ok.appendChild(document.createTextNode("Cuadra con el pedido 2026/0418"));
        } },
      { ms: 1200, hacer: function (e) {
          rotulo(e, "Lo que no cuadra se aparta con el motivo escrito.");
          var r = poner(e, el("div", "resumen-demo"));
          [["40", "recibidas"], ["35", "registradas"], ["5", "apartadas"]].forEach(function (par, i) {
            var caja = el("div", "resumen-demo__dato" + (i === 2 ? " es-aviso" : ""));
            caja.appendChild(el("strong", null, par[0]));
            caja.appendChild(el("span", null, par[1]));
            r.appendChild(caja);
          });
        } },
      { ms: 900, hacer: function (e) {
          poner(e, el("p", "sello sello--aviso", "3 · el IVA no coincide   ·   2 · proveedor nuevo"));
        } },
    ];
  };

  /* 04 · Conocimiento: la respuesta con su fuente. */
  GUIONES.conocimiento = function () {
    var hilo, docs;

    return [
      { ms: 200, hacer: function (e) {
          hilo = poner(e, el("div", "hilo"));
          hilo.appendChild(el("p", "burbujilla burbujilla--ellos",
            "¿Qué cobramos por un cambio de titularidad de un coche importado?"));
        } },
      { ms: 900, hacer: function (e) {
          rotulo(e, "Buscando en los documentos del despacho…");
          docs = poner(e, el("div", "documentos"));
          ["Tarifa 2026", "Manual de trámites", "Criterios internos"].forEach(function (nombre, i) {
            var d = el("span", "documento", nombre);
            d.style.animationDelay = (i * 280) + "ms";
            docs.appendChild(d);
          });
        } },
      { ms: 1500, hacer: function () {
          docs.children[0].classList.add("documento--usado");
        } },
      { ms: 700, hacer: function (e) {
          rotulo(e, "Responde, y dice de dónde lo ha sacado.");
          var r = el("p", "burbujilla burbujilla--bot",
            "180 € + IVA. Incluye el trámite completo. Las tasas de la DGT van aparte.");
          hilo.appendChild(r);
        } },
      { ms: 1000, hacer: function (e) {
          var f = poner(e, el("p", "sello sello--fuente", "Fuente: Tarifa 2026 · apartado 4.2"));
          f.setAttribute("title", "Siempre cita el documento");
        } },
      { ms: 900, hacer: function (e) {
          poner(e, el("p", "sello sello--aviso", "Documento revisado hace dos meses."));
        } },
    ];
  };

  /* 05 · Ventas: el presupuesto que no se queda sin seguimiento. */
  GUIONES.ventas = function () {
    var columnas = [];
    var tarjeta;

    function mover(destino) {
      columnas[destino].appendChild(tarjeta);
      tarjeta.classList.remove("es-nuevo");
      void tarjeta.offsetWidth;
      tarjeta.classList.add("es-nuevo");
    }

    function insignia(texto, dorada) {
      var vieja = tarjeta.querySelector(".insignia");
      if (vieja) tarjeta.removeChild(vieja);
      var i = el("span", "insignia" + (dorada ? " insignia--avisa" : ""), texto);
      tarjeta.appendChild(i);
    }

    return [
      { ms: 200, hacer: function (e) {
          var embudo = poner(e, el("div", "embudo"));
          ["Nueva", "Presupuesto enviado", "Ganada"].forEach(function (nombre) {
            var col = el("div", "embudo__col");
            col.appendChild(el("p", "embudo__eti", nombre));
            var caja = el("div", "embudo__caja");
            col.appendChild(caja);
            columnas.push(caja);
            embudo.appendChild(col);
          });
          rotulo(e, "Día 1 · entra una solicitud por la web.");
        } },
      { ms: 700, hacer: function () {
          tarjeta = el("div", "oportunidad es-nuevo");
          tarjeta.appendChild(el("strong", null, "Instalación · 4.200 €"));
          tarjeta.appendChild(el("span", "oportunidad__origen", "Origen: formulario web"));
          columnas[0].appendChild(tarjeta);
        } },
      { ms: 1300, hacer: function (e) {
          rotulo(e, "Día 2 · se envía el presupuesto.");
          mover(1);
          insignia("Seguimiento en 3 días");
        } },
      { ms: 1500, hacer: function (e) {
          rotulo(e, "Día 5 · sin respuesta. El recordatorio queda preparado.");
          insignia("Recordatorio listo para enviar", true);
        } },
      { ms: 1500, hacer: function (e) {
          rotulo(e, "Día 16 · el cliente acepta.");
          mover(2);
          insignia("Ganada");
          tarjeta.classList.add("oportunidad--ganada");
        } },
      { ms: 1100, hacer: function (e) {
          rotulo(e, "Y cada lunes, la foto de la cartera.");
          var r = poner(e, el("div", "resumen-demo"));
          [["7", "abiertas"], ["3", "paradas +15 días"], ["1", "caduca el jueves"]].forEach(function (par, i) {
            var caja = el("div", "resumen-demo__dato" + (i === 2 ? " es-aviso" : ""));
            caja.appendChild(el("strong", null, par[0]));
            caja.appendChild(el("span", null, par[1]));
            r.appendChild(caja);
          });
        } },
    ];
  };

  // ---------------------------------------------------------- reproductor

  function preparar(bloque) {
    var clave = bloque.dataset.demo;
    if (!GUIONES[clave]) return;

    var escena = bloque.querySelector(".demo__escena");
    var boton = bloque.querySelector(".demo__boton");
    var portada = bloque.querySelector(".demo__portada");
    var relojes = [];
    var corriendo = false;

    function limpiar() {
      relojes.forEach(clearTimeout);
      relojes = [];
    }

    function reproducir() {
      limpiar();
      corriendo = true;
      bloque.classList.add("esta-sonando");
      boton.textContent = "Reproduciendo…";
      if (portada && portada.parentNode) portada.parentNode.removeChild(portada);
      escena.innerHTML = "";

      var guion = GUIONES[clave]();
      var t = 0;
      guion.forEach(function (paso) {
        t += paso.ms;
        relojes.push(setTimeout(function () { paso.hacer(escena); }, t));
      });
      relojes.push(setTimeout(function () {
        corriendo = false;
        bloque.classList.remove("esta-sonando");
        boton.textContent = "Repetir";
      }, t + 600));
    }

    boton.addEventListener("click", function () {
      if (corriendo) return;
      reproducir();
    });

    // Arranca sola la primera vez que se ve entera, que es cuando el
    // visitante está mirándola. Después, solo a petición.
    if ("IntersectionObserver" in window) {
      var mirón = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (entrada) {
            if (!entrada.isIntersecting) return;
            mirón.unobserve(entrada.target);
            reproducir();
          });
        },
        // Bajo a propósito: la escena es más alta que la pantalla de un
        // móvil, y con un umbral alto no llegaría a dispararse nunca.
        { threshold: 0.2 }
      );
      mirón.observe(bloque);
    }
  }

  var bloques = document.querySelectorAll(".demo[data-demo]");
  if (!bloques.length) return;

  if (quieto) {
    // Sin movimiento: se queda la ilustración y se retira el botón,
    // para no prometer algo que no va a pasar.
    Array.prototype.forEach.call(bloques, function (bloque) {
      var boton = bloque.querySelector(".demo__boton");
      if (boton) boton.hidden = true;
    });
    return;
  }

  Array.prototype.forEach.call(bloques, preparar);
})();
