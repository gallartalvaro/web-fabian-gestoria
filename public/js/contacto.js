// ============================================================
// Valentramites — Panel de contacto
// ------------------------------------------------------------
// Cualquier botón que antes bajaba al formulario del final abre
// ahora un panel en la propia página con cuatro vías:
//   · Reservar una llamada (agenda de Odoo Citas)
//   · Escribir por WhatsApp, con el mensaje ya redactado
//   · Llamar ahora
//   · Que me llamen: nombre y teléfono, y entra en el CRM
// El formulario largo sigue existiendo para quien prefiera
// escribir un mensaje detallado.
// ============================================================

(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  if (typeof HTMLDialogElement !== "function") return; // navegador muy antiguo: se queda el enlace de siempre

  // ----------------------------------------------------------
  // Utilidades
  // ----------------------------------------------------------
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  // ¿Estamos dentro del horario de atención? Se calcula en la hora
  // de Madrid, no en la del visitante.
  function abiertoAhora() {
    var h = CFG.horario || { dias: [1, 2, 3, 4, 5], desde: 16, hasta: 21 };
    var partes = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    var valor = function (tipo) {
      return (partes.filter(function (p) { return p.type === tipo; })[0] || {}).value;
    };
    var dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(valor("weekday"));
    var hora = Number(valor("hour")) + Number(valor("minute")) / 60;
    return h.dias.indexOf(dia) !== -1 && hora >= h.desde && hora < h.hasta;
  }

  // Misma procedencia que usan los tests, para que el CRM sepa por
  // qué canal llegó cada contacto.
  function origenVisita() {
    try {
      var guardado = sessionStorage.getItem("origen");
      if (guardado) return JSON.parse(guardado);
    } catch (err) { /* sin sessionStorage */ }
    var p = new URLSearchParams(window.location.search);
    return {
      campana: p.get("utm_campaign") || "",
      canal: p.get("utm_source") || "",
      medio: p.get("utm_medium") || "",
      procedencia:
        document.referrer && document.referrer.indexOf(window.location.host) === -1 ? document.referrer : "",
      entrada: window.location.pathname,
    };
  }

  // De qué quiere hablar el visitante, según el botón que ha pulsado.
  function contextoDe(enlace) {
    if (enlace.dataset.contexto) return enlace.dataset.contexto;
    var plan = enlace.closest(".plan");
    if (plan) {
      var grupo = plan.closest(".planes");
      var tipo = grupo && grupo.dataset.tipo === "empresas" ? "empresas" : "autónomos";
      return "Plan " + plan.querySelector(".plan__nombre").textContent.trim() + " (" + tipo + ")";
    }
    if (enlace.dataset.ask) return enlace.dataset.ask;
    if (enlace.closest(".grant--proxima")) return "Aviso de nuevas convocatorias";
    if (enlace.closest(".puntuales, .puntuales__cta")) return "Presupuesto de un servicio puntual";
    var h1 = document.querySelector("main h1");
    return document.body.dataset.contexto || (h1 && h1 !== document.querySelector(".hero__title") ? h1.textContent.trim() : "Consulta general");
  }

  // ----------------------------------------------------------
  // El panel
  // ----------------------------------------------------------
  var dialogo = el("dialog", "contacto");
  dialogo.setAttribute("aria-labelledby", "contacto-titulo");
  document.body.appendChild(dialogo);

  var contextoActual = "";
  var enlaceOrigen = null;

  function abrir(contexto, enlace) {
    contextoActual = contexto;
    enlaceOrigen = enlace;
    pintar();
    dialogo.showModal();
    document.documentElement.classList.add("contacto-abierto");
  }

  function cerrar() {
    dialogo.close();
  }

  dialogo.addEventListener("close", function () {
    document.documentElement.classList.remove("contacto-abierto");
  });

  // Clic fuera de la caja: cerrar.
  dialogo.addEventListener("click", function (e) {
    if (e.target === dialogo) cerrar();
  });

  function pintar() {
    dialogo.innerHTML = "";
    var caja = el("div", "contacto__caja");

    var cabecera = el("div", "contacto__cabecera");
    var titulo = el("h2", "contacto__titulo", "¿Cómo prefiere que hablemos?");
    titulo.id = "contacto-titulo";
    var cerrarBtn = el("button", "contacto__cerrar");
    cerrarBtn.type = "button";
    cerrarBtn.setAttribute("aria-label", "Cerrar");
    cerrarBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    cerrarBtn.addEventListener("click", cerrar);
    cabecera.appendChild(titulo);
    cabecera.appendChild(cerrarBtn);
    caja.appendChild(cabecera);

    if (contextoActual && contextoActual !== "Consulta general") {
      var ctx = el("p", "contacto__contexto");
      ctx.appendChild(el("span", null, "Sobre: "));
      ctx.appendChild(el("strong", null, contextoActual));
      caja.appendChild(ctx);
    }

    var opciones = el("div", "contacto__opciones");

    // --- 1. Reservar llamada ---
    if (CFG.cita) {
      opciones.appendChild(
        opcion({
          icono: '<path d="M8 2v3M16 2v3M3.5 9h17"/><rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M8 13h3v3H8z"/>',
          titulo: "Reservar una llamada",
          detalle: "Elija día y hora en nuestra agenda · 15 minutos",
          href: CFG.cita,
          nuevaPestana: true,
          destacada: true,
        })
      );
    }

    // --- 2. WhatsApp ---
    if (CFG.whatsapp) {
      var texto =
        "Hola, les escribo desde la web de Valentramites." +
        (contextoActual && contextoActual !== "Consulta general" ? " Me interesa: " + contextoActual + "." : "") +
        " ¿Podemos hablar?";
      opciones.appendChild(
        opcion({
          icono: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z"/><path d="M8.8 9.2c.3 2.4 2.6 4.8 5 5.1l1.2-1.2 2 .8-.3 1.6c-3.9.4-8.4-4-8-8l1.6-.3.8 2Z"/>',
          titulo: "Escribir por WhatsApp",
          detalle: "Le respondemos en el horario de atención",
          href: "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(texto),
          nuevaPestana: true,
        })
      );
    }

    // --- 3. Llamar ahora ---
    if (CFG.telefono) {
      var abierto = abiertoAhora();
      opciones.appendChild(
        opcion({
          icono: '<path d="M5 4h3l1.5 4-2 1.2a11 11 0 0 0 7.3 7.3l1.2-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
          titulo: "Llamar ahora",
          detalle: abierto
            ? CFG.telefono + " · ahora le atendemos"
            : CFG.telefono + " · fuera de horario: mejor reserve una llamada",
          href: "tel:" + CFG.telefono.replace(/\s+/g, ""),
          aviso: !abierto,
        })
      );
    }

    // --- 4. Que me llamen ---
    var llamenme = opcion({
      icono: '<path d="M12 21a9 9 0 1 0-9-9"/><path d="M3 21l4-4M3 17v4h4"/>',
      titulo: "Que me llamen",
      detalle: "Déjenos su nombre y su teléfono",
      boton: true,
    });
    opciones.appendChild(llamenme);
    caja.appendChild(opciones);

    var formulario = formularioLlamada();
    formulario.hidden = true;
    caja.appendChild(formulario);
    llamenme.addEventListener("click", function () {
      opciones.hidden = true;
      formulario.hidden = false;
      formulario.querySelector("input").focus();
    });

    // --- Mensaje detallado: el formulario de siempre ---
    var pie = el("p", "contacto__pie");
    var largo = el("a", null, "Prefiero escribir un mensaje detallado");
    largo.href = "index.html#contacto";
    largo.dataset.contactoLibre = "";
    largo.addEventListener("click", function (e) {
      var enPortada = document.getElementById("contact-form");
      if (!enPortada) return; // desde otra página, se navega a la portada
      e.preventDefault();
      cerrar();
      var select = enPortada.area;
      if (enlaceOrigen && enlaceOrigen.dataset.ask && select) {
        var opt = [].filter.call(select.options, function (o) { return o.value === enlaceOrigen.dataset.ask; })[0];
        if (opt) { select.value = opt.value; select.classList.add("is-prefilled"); }
      }
      document.getElementById("contacto").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () { enPortada.nombre.focus({ preventScroll: true }); }, 500);
    });
    pie.appendChild(largo);
    caja.appendChild(pie);

    dialogo.appendChild(caja);
  }

  function opcion(o) {
    var n = el(o.boton ? "button" : "a", "contacto__opcion" + (o.destacada ? " contacto__opcion--destacada" : ""));
    if (o.boton) n.type = "button";
    else {
      n.href = o.href;
      if (o.nuevaPestana) { n.target = "_blank"; n.rel = "noopener"; }
    }
    var ico = el("span", "contacto__icono");
    ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + o.icono + "</svg>";
    var textos = el("span", "contacto__textos");
    textos.appendChild(el("span", "contacto__opcion-titulo", o.titulo));
    textos.appendChild(el("span", "contacto__opcion-detalle" + (o.aviso ? " is-aviso" : ""), o.detalle));
    n.appendChild(ico);
    n.appendChild(textos);
    return n;
  }

  // ----------------------------------------------------------
  // «Que me llamen»: dos datos y al CRM
  // ----------------------------------------------------------
  function formularioLlamada() {
    var f = document.createElement("form");
    f.className = "contacto__form";
    f.noValidate = true;

    f.appendChild(el("p", "contacto__form-intro", "Le llamamos nosotros, normalmente el mismo día laborable."));

    f.appendChild(campo("contacto-nombre", "nombre", "Nombre", "text", "name"));
    f.appendChild(campo("contacto-telefono", "telefono", "Teléfono", "tel", "tel"));

    var momento = el("div", "field");
    var lab = el("label", null, "¿Cuándo le viene mejor?");
    lab.setAttribute("for", "contacto-momento");
    var sel = document.createElement("select");
    sel.id = "contacto-momento";
    sel.name = "momento";
    ["Lo antes posible", "Esta tarde", "Mañana por la tarde"].forEach(function (t) {
      var op = document.createElement("option");
      op.value = op.textContent = t;
      sel.appendChild(op);
    });
    momento.appendChild(lab);
    momento.appendChild(sel);
    f.appendChild(momento);

    var trampa = el("div", "lead__trampa");
    trampa.setAttribute("aria-hidden", "true");
    var trampaInput = document.createElement("input");
    trampaInput.type = "text";
    trampaInput.name = "apellido2";
    trampaInput.tabIndex = -1;
    trampaInput.autocomplete = "off";
    trampa.appendChild(trampaInput);
    f.appendChild(trampa);

    var check = el("label", "check");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.name = "privacidad";
    var span = el("span");
    span.innerHTML = 'Acepto el <a href="privacidad.html" target="_blank" rel="noopener">tratamiento de mis datos</a> para que me contacten.';
    check.appendChild(cb);
    check.appendChild(span);
    f.appendChild(check);

    var acciones = el("div", "contacto__form-acciones");
    var volver = el("button", "btn btn--ghost btn--sm", "Atrás");
    volver.type = "button";
    volver.addEventListener("click", function () {
      f.hidden = true;
      dialogo.querySelector(".contacto__opciones").hidden = false;
    });
    var enviar = el("button", "btn btn--primary btn--sm", "Que me llamen");
    enviar.type = "submit";
    acciones.appendChild(volver);
    acciones.appendChild(enviar);
    f.appendChild(acciones);

    var aviso = el("p", "form__hint");
    f.appendChild(aviso);

    f.addEventListener("input", function (e) {
      if (e.target.classList) e.target.classList.remove("is-invalid");
      if (e.target === cb) check.classList.remove("is-invalid");
    });

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = f.nombre, telefono = f.telefono, invalido = null;

      if (!nombre.value.trim()) { nombre.classList.add("is-invalid"); invalido = nombre; }
      if (telefono.value.replace(/\D/g, "").length < 9) { telefono.classList.add("is-invalid"); invalido = invalido || telefono; }
      if (!cb.checked) { check.classList.add("is-invalid"); invalido = invalido || cb; }
      if (invalido) {
        aviso.className = "form__hint is-error";
        aviso.textContent = "Revise los campos marcados.";
        invalido.focus();
        return;
      }

      enviar.disabled = true;
      aviso.className = "form__hint";
      aviso.textContent = "Enviando…";

      var datos = {
        version: 2,
        tipo: "solicitud-llamada",
        contacto: {
          nombre: nombre.value.trim(),
          telefono: telefono.value.trim(),
          email: "",
          momentoPreferido: sel.value,
        },
        consentimiento: {
          aceptado: true,
          texto: "Acepta el tratamiento de sus datos para que le contacten.",
          fecha: new Date().toISOString(),
        },
        solicitud: { contexto: contextoActual || "Consulta general" },
        seguimiento: {
          prioridad: "media",
          pagina: window.location.origin + window.location.pathname,
          origen: origenVisita(),
          fecha: new Date().toISOString(),
        },
        apellido2: trampaInput.value,
      };

      var fallo = function () {
        enviar.disabled = false;
        aviso.className = "form__hint is-error";
        aviso.innerHTML = "";
        aviso.appendChild(document.createTextNode("No hemos podido registrar la solicitud. "));
        if (CFG.whatsapp) {
          var wa = el("a", null, "Escríbanos por WhatsApp");
          wa.href = "https://wa.me/" + CFG.whatsapp + "?text=" +
            encodeURIComponent("Hola, soy " + datos.contacto.nombre + ". ¿Pueden llamarme al " + datos.contacto.telefono + "? Tema: " + datos.solicitud.contexto + ".");
          wa.target = "_blank";
          wa.rel = "noopener";
          aviso.appendChild(wa);
          aviso.appendChild(document.createTextNode(" y le atendemos igual."));
        }
      };

      if (!CFG.formEndpoint) return fallo();

      fetch(CFG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(datos),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function (r) {
          var ok = el("div", "contacto__ok");
          ok.appendChild(el("h3", null, "Le llamamos en breve"));
          ok.appendChild(
            el("p", null,
              "Gracias, " + datos.contacto.nombre.split(" ")[0] +
              ". Hemos anotado su teléfono y le llamaremos " +
              (sel.value === "Lo antes posible" ? "en cuanto podamos, dentro de nuestro horario." : sel.value.toLowerCase() + ".")
            )
          );
          if (r && r.referencia) ok.appendChild(el("p", "lead__ref", "Referencia: " + r.referencia));
          var hecho = el("button", "btn btn--primary btn--sm", "Cerrar");
          hecho.type = "button";
          hecho.addEventListener("click", cerrar);
          ok.appendChild(hecho);
          f.replaceWith(ok);
          hecho.focus();
        })
        .catch(fallo);
    });

    return f;
  }

  function campo(id, nombre, etiqueta, tipo, auto) {
    var c = el("div", "field");
    var l = el("label", null, etiqueta);
    l.setAttribute("for", id);
    var i = document.createElement("input");
    i.id = id;
    i.name = nombre;
    i.type = tipo;
    i.autocomplete = auto;
    i.required = true;
    if (tipo === "tel") i.inputMode = "tel";
    c.appendChild(l);
    c.appendChild(i);
    return c;
  }

  // ----------------------------------------------------------
  // Qué botones abren el panel: todos los que llevaban al
  // formulario de contacto, salvo el propio enlace de «mensaje
  // detallado» y lo que ya está dentro de la sección de contacto.
  // ----------------------------------------------------------
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.hasAttribute("data-contacto-libre") || a.closest("#contacto, dialog.contacto")) return;
    var href = a.getAttribute("href");
    if (href !== "#contacto" && href !== "index.html#contacto" && !a.hasAttribute("data-contacto")) return;
    e.preventDefault();
    abrir(contextoDe(a), a);
  });
})();
