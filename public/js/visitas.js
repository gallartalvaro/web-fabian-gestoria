// ============================================================
// Valentramites — Medición de visitas
// ------------------------------------------------------------
// Avisa al contador propio de que se ha visto una página. No usa
// cookies, no guarda nada que persista entre sesiones y no habla
// con ningún tercero.
//
// Lo único que se guarda en el navegador es una marca en
// sessionStorage que dice "esta sesión ya está contada". Se borra
// al cerrar la pestaña y NUNCA sale de aquí: al servidor solo
// viaja un sí o un no, así que en la base de datos no queda
// ningún identificador con el que seguir a nadie.
//
// Si el visitante tiene activado "No rastrear", no se envía nada.
// ============================================================
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var destino = cfg.visitasEndpoint || "";
  if (!destino) return;

  // Respetar "Do Not Track" no lo exige la ley, pero decir que se
  // mide sin cookies y luego ignorar la señal del navegador sería
  // justo lo contrario de lo que esta web promete.
  var nav = window.navigator || {};
  if (nav.doNotTrack === "1" || window.doNotTrack === "1" || nav.msDoNotTrack === "1") return;

  var host = window.location.hostname;
  // En local no se mide: ensuciaría las cifras del despacho.
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "[::1]") return;
  var entorno = host === "valentramites.com" || host === "www.valentramites.com" ? "produccion" : "pruebas";

  var MARCA = "vt-sesion";
  var primera = false;
  try {
    if (!sessionStorage.getItem(MARCA)) {
      sessionStorage.setItem(MARCA, "1");
      primera = true;
    }
  } catch (e) {
    // Navegación privada o almacenamiento bloqueado: se cuenta la
    // página, y la visita también. Preferimos pasarnos por arriba
    // en el recuento antes que perder el dato entero.
    primera = true;
  }

  // OJO con el tipo de contenido: tiene que ser text/plain.
  //
  // sendBeacon envía siempre en modo credentials:"include", y con
  // application/json el navegador exige una comprobación previa
  // (preflight) que entonces pide una cabecera de credenciales. La
  // salida fácil sería permitirlas en el servidor, pero eso es
  // abrirle la puerta a las cookies justo en la pieza que presume
  // de no usarlas. text/plain es uno de los tipos seguros: no hay
  // comprobación previa y no hay nada que permitir. El Worker lee
  // el cuerpo como texto y lo interpreta igual.
  function enviar(ruta, cuerpo) {
    var texto = JSON.stringify(cuerpo);
    try {
      // sendBeacon sobrevive a que la persona cambie de página.
      if (nav.sendBeacon) {
        var blob = new Blob([texto], { type: "text/plain;charset=UTF-8" });
        if (nav.sendBeacon(destino + ruta, blob)) return;
      }
    } catch (e) {
      /* cae al fetch de abajo */
    }
    try {
      fetch(destino + ruta, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: texto,
        keepalive: true,
        mode: "cors",
      }).catch(function () {});
    } catch (e) {
      /* que no se mida nunca puede romper la página */
    }
  }

  enviar("", {
    ruta: window.location.pathname,
    referente: document.referrer || "",
    ancho: window.innerWidth || 0,
    primera: primera,
    entorno: entorno,
  });

  // ----------------------------------------------------------
  // Eventos: lo que la gente hace, no solo lo que mira.
  // Desde cualquier guion:  window.vtEvento("nombre")
  // ----------------------------------------------------------
  function evento(nombre) {
    if (!nombre) return;
    enviar("/evento", {
      nombre: String(nombre).slice(0, 60),
      ruta: window.location.pathname,
      entorno: entorno,
    });
  }
  window.vtEvento = evento;

  // Los que interesan se enganchan solos, para no tener que tocar
  // el resto de guiones cada vez que se añade una página.
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.indexOf("wa.me") !== -1) return evento("whatsapp");
      if (href.indexOf("tel:") === 0) return evento("llamada");
      if (href.indexOf("mailto:") === 0) return evento("correo");
      if (href.indexOf("#test") !== -1) return evento("test-abierto");
    },
    true
  );

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
