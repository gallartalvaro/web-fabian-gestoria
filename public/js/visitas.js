// ============================================================
// Valentramites — Medición de visitas
// ------------------------------------------------------------
// Mide sin cookies, sin terceros y sin guardar ningún
// identificador. Lo único que vive en el navegador es una marca
// en sessionStorage que se borra al cerrar la pestaña y que
// NUNCA se envía: al servidor solo viaja un sí o un no.
//
// Qué se envía:
//   · la página vista (ruta, referente, ancho, país lo pone CF)
//   · el contexto de la visita (navegador, sistema, idioma,
//     campaña), una sola vez por sesión
//   · los clics en enlaces y botones, por su texto visible
//   · hasta dónde se baja en la página (25/50/75/100 %)
//   · cuánto se queda, por tramos
//   · eventos con nombre
//
// Qué NO se envía, a propósito:
//   · nada escrito en un formulario
//   · nada pulsado dentro del test de subvenciones (ver abajo)
//   · coordenadas del ratón: con un diseño que se adapta a la
//     pantalla no significan nada
//   · si alguien vuelve otro día: eso exigiría almacenamiento
//     persistente, que es justo lo que esta web promete no usar
//
// Si el navegador envía "No rastrear", no se envía nada.
// ============================================================
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var destino = cfg.visitasEndpoint || "";
  if (!destino) return;

  var nav = window.navigator || {};
  if (nav.doNotTrack === "1" || window.doNotTrack === "1" || nav.msDoNotTrack === "1") return;

  var host = window.location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "[::1]") return;
  var entorno = host === "valentramites.com" || host === "www.valentramites.com" ? "produccion" : "pruebas";
  var ruta = window.location.pathname;

  var MARCA = "vt-sesion";
  var primera = false;
  try {
    if (!sessionStorage.getItem(MARCA)) {
      sessionStorage.setItem(MARCA, "1");
      primera = true;
    }
  } catch (e) {
    primera = true;
  }

  // ----------------------------------------------------------
  // Envío
  // ----------------------------------------------------------
  // OJO con el tipo de contenido: tiene que ser "text/plain", y a
  // secas. sendBeacon envía siempre en modo credentials:"include";
  // con un tipo que no sea de los seguros el navegador exige
  // comprobación previa (preflight) y la bloquea. La salida fácil
  // sería permitir credenciales en el servidor, pero eso es
  // abrirle la puerta a las cookies justo en la pieza que presume
  // de no usarlas.
  //
  // Y sin charset: con "text/plain;charset=UTF-8" Chrome deja de
  // considerarlo seguro y vuelve a bloquear. Comprobado.
  function enviar(sufijo, cuerpo) {
    var texto = JSON.stringify(cuerpo);
    try {
      if (nav.sendBeacon) {
        var blob = new Blob([texto], { type: "text/plain" });
        if (nav.sendBeacon(destino + sufijo, blob)) return;
      }
    } catch (e) {
      /* cae al fetch de abajo */
    }
    try {
      fetch(destino + sufijo, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: texto,
        keepalive: true,
        mode: "cors",
      }).catch(function () {});
    } catch (e) {
      /* que no se mida nunca puede romper la página */
    }
  }

  // ----------------------------------------------------------
  // 1. La página vista
  // ----------------------------------------------------------
  enviar("", {
    ruta: ruta,
    referente: document.referrer || "",
    ancho: window.innerWidth || 0,
    primera: primera,
    entorno: entorno,
  });

  // ----------------------------------------------------------
  // 2. El contexto de la visita, una sola vez
  // ----------------------------------------------------------
  function navegador(ua) {
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\/|Opera/.test(ua)) return "Opera";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
    if (/Chrome\//.test(ua)) return "Chrome";
    if (/Safari\//.test(ua)) return "Safari";
    return "otro";
  }
  function sistema(ua) {
    if (/Android/.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Windows/.test(ua)) return "Windows";
    if (/Mac OS X/.test(ua)) return "macOS";
    if (/Linux/.test(ua)) return "Linux";
    return "otro";
  }

  if (primera) {
    var ua = nav.userAgent || "";
    var idioma = String(nav.language || "").slice(0, 5).toLowerCase() || "nd";
    var campana = "";
    try {
      campana = new URLSearchParams(window.location.search).get("utm_campaign") || "";
    } catch (e) {
      campana = "";
    }
    enviar("/contexto", {
      entorno: entorno,
      navegador: navegador(ua),
      sistema: sistema(ua),
      idioma: idioma,
      campana: campana.slice(0, 40),
    });
  }

  // ----------------------------------------------------------
  // 3. Clics
  // ----------------------------------------------------------
  // El test de subvenciones queda FUERA a propósito. Sus opciones
  // son cosas como «víctima de violencia de género» o «persona con
  // discapacidad reconocida»: aunque el recuento sea agregado y no
  // haya forma de saber quién pulsó qué, llevar eso a una base de
  // datos de analítica no está justificado por saber qué botón se
  // usa más. Lo que sí se mide es que el test se abre y que se
  // termina, que es lo único que hace falta para decidir.
  var SIN_MEDIR = ".wiz, .lead__trampa, form";

  function etiquetaDe(el) {
    var t = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t) t = el.getAttribute("title") || el.getAttribute("href") || "(sin texto)";
    return t.slice(0, 60);
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest
        ? e.target.closest("a, button, summary, [role='tab']")
        : null;
      if (!el) return;
      if (el.closest(SIN_MEDIR)) return;

      var etiqueta = el.getAttribute("href") || "";
      var tipo = "enlace";
      if (el.tagName === "BUTTON") tipo = "boton";
      else if (el.tagName === "SUMMARY") tipo = "detalle";
      else if (el.getAttribute("role") === "tab") tipo = "pestana";

      enviar("/clic", {
        ruta: ruta,
        elemento: etiquetaDe(el),
        tipo: tipo,
        entorno: entorno,
      });

      // Los de contacto, además, como evento con nombre.
      if (etiqueta.indexOf("wa.me") !== -1) evento("whatsapp");
      else if (etiqueta.indexOf("tel:") === 0) evento("llamada");
      else if (etiqueta.indexOf("mailto:") === 0) evento("correo");
      else if (etiqueta.indexOf("#test") !== -1) evento("test-abierto");
    },
    true
  );

  // ----------------------------------------------------------
  // 4. Hasta dónde se baja
  // ----------------------------------------------------------
  var hitos = [25, 50, 75, 100];
  var alcanzados = {};
  var pendiente = false;

  function mirarScroll() {
    pendiente = false;
    var doc = document.documentElement;
    var alto = doc.scrollHeight - window.innerHeight;
    var pct = alto <= 0 ? 100 : Math.round(((window.scrollY || 0) / alto) * 100);
    for (var i = 0; i < hitos.length; i++) {
      var h = hitos[i];
      if (pct >= h && !alcanzados[h]) {
        alcanzados[h] = true;
        enviar("/lectura", { ruta: ruta, profundidad: h, entorno: entorno });
      }
    }
  }

  window.addEventListener(
    "scroll",
    function () {
      if (pendiente) return;
      pendiente = true;
      setTimeout(mirarScroll, 400);
    },
    { passive: true }
  );
  // Una página que cabe entera en pantalla ya está leída del todo.
  setTimeout(mirarScroll, 1200);

  // ----------------------------------------------------------
  // 5. Cuánto se queda
  // ----------------------------------------------------------
  var entrada = Date.now();
  var despedido = false;

  function tramo(seg) {
    if (seg < 10) return "0-10s";
    if (seg < 30) return "10-30s";
    if (seg < 60) return "30-60s";
    if (seg < 180) return "1-3min";
    return "3min+";
  }

  function despedir() {
    if (despedido) return;
    despedido = true;
    var seg = Math.round((Date.now() - entrada) / 1000);
    enviar("/permanencia", { ruta: ruta, tramo: tramo(seg), entorno: entorno });
  }

  // pagehide es el que de verdad dispara al cerrar o navegar;
  // visibilitychange cubre el caso del móvil que cambia de app.
  window.addEventListener("pagehide", despedir);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") despedir();
  });

  // ----------------------------------------------------------
  // 6. Eventos con nombre
  // ----------------------------------------------------------
  function evento(nombre) {
    if (!nombre) return;
    enviar("/evento", {
      nombre: String(nombre).slice(0, 60),
      ruta: ruta,
      entorno: entorno,
    });
  }
  window.vtEvento = evento;

  document.addEventListener(
    "submit",
    function (e) {
      var f = e.target;
      if (!f || !f.id) return;
      if (f.id === "contact-form") evento("consulta-enviada");
      if (f.id === "aviso-form") evento("alta-aviso");
    },
    true
  );
})();
