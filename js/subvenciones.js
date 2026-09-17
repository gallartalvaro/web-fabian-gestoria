// ============================================================
// Gestoría Fabián — Sección de subvenciones
// ------------------------------------------------------------
// 1. Estado del plazo de cada convocatoria (abierto / cierra en
//    X días / cerrado), calculado a partir de las fechas.
// 2. Test de elegibilidad paso a paso.
// 3. Captación del contacto de quien termina el test.
// ============================================================

(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var MS_DIA = 86400000;

  // ----------------------------------------------------------
  // Utilidades
  // ----------------------------------------------------------
  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function hoy() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function fecha(iso) {
    var p = String(iso).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function fechaLarga(iso) {
    return fecha(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Formato español (3.000 €). Se hace a mano porque toLocaleString
  // no agrupa los millares en todos los navegadores.
  function euros(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
  }

  // Estado del plazo: la web nunca queda desfasada aunque nadie
  // la toque el día que cierra la convocatoria.
  function estadoPlazo(inicio, fin) {
    var h = hoy();
    var ini = fecha(inicio);
    var f = fecha(fin);

    if (h < ini) {
      var faltan = Math.round((ini - h) / MS_DIA);
      return {
        clave: "proximo",
        dias: faltan,
        etiqueta: "Abre el " + fechaLarga(inicio),
        breve: "Próxima apertura",
      };
    }
    if (h > f) {
      return {
        clave: "cerrado",
        dias: 0,
        etiqueta: "Plazo cerrado el " + fechaLarga(fin),
        breve: "Plazo cerrado",
      };
    }
    var restan = Math.round((f - h) / MS_DIA);
    return {
      clave: "abierto",
      dias: restan,
      etiqueta:
        restan === 0
          ? "Último día de plazo"
          : restan === 1
          ? "Queda 1 día de plazo"
          : "Quedan " + restan + " días de plazo",
      breve: "Plazo abierto",
    };
  }

  // <span data-plazo data-inicio="AAAA-MM-DD" data-fin="AAAA-MM-DD">
  function pintarPlazos() {
    document.querySelectorAll("[data-plazo]").forEach(function (nodo) {
      var e = estadoPlazo(nodo.dataset.inicio, nodo.dataset.fin);
      nodo.classList.add("estado", "estado--" + e.clave);
      nodo.textContent = nodo.dataset.plazo === "breve" ? e.breve : e.etiqueta;
      var tarjeta = nodo.closest("[data-convocatoria]");
      if (tarjeta) tarjeta.dataset.estado = e.clave;
    });
  }

  // ----------------------------------------------------------
  // Test de elegibilidad
  // ----------------------------------------------------------
  var contenedor = document.getElementById("wizard");
  var ayuda =
    contenedor && window.SUBVENCIONES
      ? window.SUBVENCIONES[contenedor.dataset.grant]
      : null;

  if (!contenedor || !ayuda) {
    pintarPlazos();
    return;
  }

  var preguntas = ayuda.preguntas;
  var estado = { paso: -1, respuestas: {}, resultado: null };

  // El progreso se conserva si el visitante se va a leer la ficha
  // y vuelve, para no obligarle a repetir el test.
  var CLAVE = "test:" + ayuda.id;
  try {
    var guardado = sessionStorage.getItem(CLAVE);
    if (guardado) estado.respuestas = JSON.parse(guardado) || {};
  } catch (err) {
    /* sessionStorage no disponible: el test funciona igual */
  }

  function guardar() {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(estado.respuestas));
    } catch (err) {
      /* sin persistencia */
    }
  }

  function enfocarTitulo() {
    var h = contenedor.querySelector("[data-foco]");
    if (h) h.focus({ preventScroll: true });
  }

  function irA(paso) {
    estado.paso = paso;
    render();
    // Al avanzar, el bloque del test debe quedar a la vista.
    var arriba = contenedor.getBoundingClientRect().top + window.scrollY - 110;
    if (window.scrollY > arriba + 40 || window.scrollY < arriba - 400) {
      window.scrollTo({ top: arriba, behavior: "smooth" });
    }
    enfocarTitulo();
  }

  function render() {
    contenedor.innerHTML = "";
    if (estado.paso === -1) return pantallaIntro();
    if (estado.paso < preguntas.length) return pantallaPregunta(preguntas[estado.paso]);
    return pantallaResultado();
  }

  // --- Pantalla inicial ---
  function pantallaIntro() {
    var caja = el("div", "wiz__screen");

    var h = el("h3", "wiz__title", "Compruebe en un minuto si puede solicitarla");
    h.tabIndex = -1;
    h.setAttribute("data-foco", "");
    caja.appendChild(h);

    caja.appendChild(
      el(
        "p",
        "wiz__lead",
        "Responda a " +
          preguntas.length +
          " preguntas sencillas sobre su situación. Al terminar sabrá si cumple los requisitos, " +
          "qué importe le correspondería y qué tendría que preparar."
      )
    );

    var lista = el("ul", "wiz__points");
    [
      "No se solicita ningún dato personal para ver el resultado.",
      "El diagnóstico es orientativo y no tiene coste ni compromiso.",
      "Si encaja, nos ocupamos nosotros de presentar la solicitud.",
    ].forEach(function (t) {
      lista.appendChild(el("li", null, t));
    });
    caja.appendChild(lista);

    var btn = el("button", "btn btn--primary", "Comenzar el test");
    btn.type = "button";
    btn.addEventListener("click", function () {
      irA(0);
    });
    caja.appendChild(btn);

    var e = estadoPlazo(ayuda.plazo.inicio, ayuda.plazo.fin);
    if (e.clave === "cerrado") {
      caja.appendChild(
        el(
          "p",
          "wiz__nota",
          "El plazo de esta convocatoria ya está cerrado. Puede hacer el test igualmente: " +
            "si encaja en el perfil, le avisaremos en cuanto se publique la siguiente."
        )
      );
    } else if (e.clave === "abierto" && e.dias <= 7) {
      caja.appendChild(el("p", "wiz__nota wiz__nota--urgente", e.etiqueta + ". Conviene no dejarlo para el final."));
    }

    contenedor.appendChild(caja);
  }

  // --- Pantalla de pregunta ---
  function pantallaPregunta(p) {
    var caja = el("div", "wiz__screen");

    // Progreso
    var prog = el("div", "wiz__progress");
    var etiqueta = el("p", "wiz__step", "Pregunta " + (estado.paso + 1) + " de " + preguntas.length);
    var barra = el("div", "wiz__track");
    var relleno = el("div", "wiz__fill");
    relleno.style.width = ((estado.paso + 1) / preguntas.length) * 100 + "%";
    barra.appendChild(relleno);
    barra.setAttribute("role", "progressbar");
    barra.setAttribute("aria-valuemin", "0");
    barra.setAttribute("aria-valuemax", String(preguntas.length));
    barra.setAttribute("aria-valuenow", String(estado.paso + 1));
    prog.appendChild(etiqueta);
    prog.appendChild(barra);
    caja.appendChild(prog);

    var campo = el("fieldset", "wiz__fieldset");
    var leyenda = el("legend", "wiz__question", p.titulo);
    leyenda.tabIndex = -1;
    leyenda.setAttribute("data-foco", "");
    campo.appendChild(leyenda);
    if (p.ayuda) campo.appendChild(el("p", "wiz__help", p.ayuda));

    var multiple = p.tipo === "multiple";
    var previo = estado.respuestas[p.id];
    var opciones = el("div", "wiz__options");

    // Si el visitante vuelve atrás y marca de nuevo la misma opción,
    // el navegador no dispara "change" porque ya estaba marcada. Se
    // escuchan los dos eventos y esta bandera evita avanzar dos veces.
    var avanzando = false;
    function elegir(valor) {
      if (avanzando) return;
      avanzando = true;
      estado.respuestas[p.id] = valor;
      guardar();
      // Pequeña pausa para que se vea la opción marcada.
      window.setTimeout(function () {
        irA(estado.paso + 1);
      }, 180);
    }

    p.opciones.forEach(function (op, i) {
      var etiquetaOp = el("label", "opt");
      var input = document.createElement("input");
      input.type = multiple ? "checkbox" : "radio";
      input.name = p.id;
      input.value = op.valor;
      input.className = "opt__input";
      if (multiple) input.checked = Array.isArray(previo) && previo.indexOf(op.valor) !== -1;
      else input.checked = previo === op.valor;

      var marca = el("span", "opt__mark");
      marca.setAttribute("aria-hidden", "true");
      var texto = el("span", "opt__text", op.etiqueta);

      etiquetaOp.appendChild(input);
      etiquetaOp.appendChild(marca);
      etiquetaOp.appendChild(texto);
      opciones.appendChild(etiquetaOp);

      if (!multiple) {
        var avanzar = function () {
          elegir(op.valor);
        };
        input.addEventListener("change", avanzar);
        input.addEventListener("click", avanzar);
      } else {
        input.addEventListener("change", leerMultiple);
      }

      if (i === 0 && !multiple) input.setAttribute("data-primera", "");
    });

    function leerMultiple() {
      var marcadas = Array.prototype.slice
        .call(opciones.querySelectorAll("input:checked"))
        .map(function (n) {
          return n.value;
        });
      estado.respuestas[p.id] = marcadas;
      guardar();
    }

    campo.appendChild(opciones);
    caja.appendChild(campo);

    // Navegación
    var nav = el("div", "wiz__nav");
    var atras = el("button", "btn btn--ghost btn--sm", "Atrás");
    atras.type = "button";
    atras.addEventListener("click", function () {
      irA(estado.paso - 1);
    });
    nav.appendChild(atras);

    if (multiple) {
      var seguir = el("button", "btn btn--primary btn--sm", "Continuar");
      seguir.type = "button";
      seguir.addEventListener("click", function () {
        leerMultiple();
        if (!estado.respuestas[p.id]) estado.respuestas[p.id] = [];
        irA(estado.paso + 1);
      });
      nav.appendChild(seguir);
      caja.appendChild(nav);
      caja.appendChild(
        el("p", "wiz__nota", "Puede marcar varias opciones, o ninguna si no le afecta ninguna de ellas.")
      );
    } else {
      caja.appendChild(nav);
    }

    contenedor.appendChild(caja);
  }

  // --- Pantalla de resultado ---
  function pantallaResultado() {
    var r = ayuda.evaluar(estado.respuestas);
    estado.resultado = r;

    var plazo = estadoPlazo(ayuda.plazo.inicio, ayuda.plazo.fin);
    var caja = el("div", "wiz__screen wiz__screen--resultado res res--" + r.estado);

    var titulos = {
      apto: "Cumple los requisitos principales",
      revisar: "Puede optar, con algún punto que comprobar",
      "no-apto": "Con estos datos no encaja en esta convocatoria",
    };

    var cabecera = el("div", "res__head");
    cabecera.appendChild(el("span", "res__badge", r.estado === "no-apto" ? "Resultado" : "Buenas noticias"));
    var h = el("h3", "res__title", titulos[r.estado]);
    h.tabIndex = -1;
    h.setAttribute("data-foco", "");
    cabecera.appendChild(h);
    caja.appendChild(cabecera);

    if (r.estado !== "no-apto") {
      var importe = el("div", "res__importe");
      importe.appendChild(el("span", "res__importe-label", "Importe estimado"));
      importe.appendChild(el("strong", "res__importe-cifra", euros(r.importe)));
      if (r.favorables.length) {
        var det = el("span", "res__importe-det", euros(ayuda.importeBase) + " de base · " + r.favorables.join(" · "));
        importe.appendChild(det);
      } else {
        importe.appendChild(el("span", "res__importe-det", "Cuantía base de la convocatoria"));
      }
      caja.appendChild(importe);
    }

    if (r.bloqueos.length) caja.appendChild(bloque("Motivos por los que no encajaría", r.bloqueos, "ko"));
    if (r.revisar.length) caja.appendChild(bloque("Puntos a resolver antes de solicitar", r.revisar, "aviso"));

    if (r.estado === "apto") {
      caja.appendChild(
        el(
          "p",
          "res__texto",
          "Según sus respuestas cumple los requisitos que exige la convocatoria. El siguiente paso es " +
            "reunir la documentación y presentar la solicitud en la sede electrónica, que solo admite firma digital."
        )
      );
    } else if (r.estado === "revisar") {
      caja.appendChild(
        el(
          "p",
          "res__texto",
          "Ninguno de estos puntos le deja fuera: son trámites que se resuelven antes de presentar la solicitud. " +
            "Si nos lo indica, los comprobamos por usted."
        )
      );
    } else {
      caja.appendChild(
        el(
          "p",
          "res__texto",
          "Esta ayuda concreta no encaja con su situación, pero es solo una de las convocatorias abiertas. " +
            "Déjenos sus datos y le avisaremos de las que sí pueda aprovechar, sin coste alguno."
        )
      );
    }

    if (plazo.clave === "abierto") {
      caja.appendChild(
        el(
          "p",
          "res__plazo" + (plazo.dias <= 7 ? " res__plazo--urgente" : ""),
          plazo.etiqueta + " — el plazo termina el " + fechaLarga(ayuda.plazo.fin) + "."
        )
      );
    } else if (plazo.clave === "cerrado") {
      caja.appendChild(
        el("p", "res__plazo", "El plazo de esta convocatoria se cerró el " + fechaLarga(ayuda.plazo.fin) + ".")
      );
    }

    caja.appendChild(formularioContacto(r, plazo));

    var pie = el("div", "res__pie");
    var rehacer = el("button", "wiz__link", "Volver a empezar el test");
    rehacer.type = "button";
    rehacer.addEventListener("click", function () {
      estado.respuestas = {};
      guardar();
      irA(-1);
    });
    pie.appendChild(rehacer);

    var imprimir = el("button", "wiz__link", "Imprimir o guardar en PDF");
    imprimir.type = "button";
    imprimir.addEventListener("click", function () {
      window.print();
    });
    pie.appendChild(imprimir);
    caja.appendChild(pie);

    caja.appendChild(
      el(
        "p",
        "wiz__disclaimer",
        "Resultado orientativo elaborado a partir de sus respuestas. No constituye una resolución " +
          "administrativa ni vincula al organismo convocante; la valoración definitiva corresponde a las bases oficiales."
      )
    );

    contenedor.appendChild(caja);
  }

  function bloque(titulo, items, tipo) {
    var b = el("div", "res__bloque res__bloque--" + tipo);
    b.appendChild(el("h4", null, titulo));
    var ul = el("ul", null);
    items.forEach(function (t) {
      ul.appendChild(el("li", null, t));
    });
    b.appendChild(ul);
    return b;
  }

  // ----------------------------------------------------------
  // Captación del contacto
  // ----------------------------------------------------------
  function formularioContacto(r, plazo) {
    var form = document.createElement("form");
    form.className = "lead";
    form.noValidate = true;

    var titulo =
      r.estado === "no-apto"
        ? "Avíseme de las ayudas que sí puedo solicitar"
        : "Quiero que se encarguen de la solicitud";
    form.appendChild(el("h4", "lead__title", titulo));
    form.appendChild(
      el(
        "p",
        "lead__lead",
        r.estado === "no-apto"
          ? "Le escribiremos únicamente cuando se publique una convocatoria que encaje con su actividad."
          : "Déjenos un teléfono y le llamamos para confirmar los requisitos y darle un presupuesto cerrado."
      )
    );

    form.appendChild(campoTexto("lead-nombre", "nombre", "Nombre y apellidos", "text", "name", true));

    var fila = el("div", "lead__row");
    fila.appendChild(campoTexto("lead-telefono", "telefono", "Teléfono", "tel", "tel", true));
    fila.appendChild(campoTexto("lead-email", "email", "Email (opcional)", "email", "email", false));
    form.appendChild(fila);

    var momento = el("div", "field");
    var labM = el("label", null, "¿Cuándo prefiere que le llamemos?");
    labM.setAttribute("for", "lead-momento");
    var sel = document.createElement("select");
    sel.id = "lead-momento";
    sel.name = "momento";
    [
      ["Indiferente", "Indiferente"],
      ["Por la mañana", "Por la mañana"],
      ["Por la tarde", "Por la tarde"],
    ].forEach(function (o) {
      var op = document.createElement("option");
      op.value = o[0];
      op.textContent = o[1];
      sel.appendChild(op);
    });
    momento.appendChild(labM);
    momento.appendChild(sel);
    form.appendChild(momento);

    var check = el("label", "check");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.name = "privacidad";
    var span = el("span");
    span.innerHTML =
      'He leído y acepto el <a href="privacidad.html" target="_blank" rel="noopener">tratamiento de mis datos</a> ' +
      "con la finalidad de recibir información sobre esta gestión.";
    check.appendChild(cb);
    check.appendChild(span);
    form.appendChild(check);

    var enviar = el("button", "btn btn--primary btn--block", "Enviar y que me llamen");
    enviar.type = "submit";
    form.appendChild(enviar);

    var aviso = el("p", "form__hint");
    form.appendChild(aviso);

    if (plazo.clave === "abierto" && plazo.dias <= 7 && r.estado !== "no-apto") {
      aviso.textContent = "Atendemos las solicitudes por orden de entrada; con el plazo tan cerca, cuanto antes mejor.";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = form.nombre;
      var telefono = form.telefono;
      var email = form.email;

      var invalido = null;
      [nombre, telefono].forEach(function (campo) {
        var mal = !campo.value.trim();
        campo.classList.toggle("is-invalid", mal);
        if (mal && !invalido) invalido = campo;
      });
      if (email.value.trim() && !email.checkValidity()) {
        email.classList.add("is-invalid");
        if (!invalido) invalido = email;
      }
      check.classList.toggle("is-invalid", !cb.checked);
      if (!cb.checked && !invalido) invalido = cb;

      if (invalido) {
        aviso.className = "form__hint is-error";
        aviso.textContent = "Revise los campos marcados antes de enviar.";
        invalido.focus();
        return;
      }

      enviar.disabled = true;
      aviso.className = "form__hint";
      aviso.textContent = "Enviando…";

      var datos = {
        convocatoria: ayuda.titulo,
        organismo: ayuda.organismo,
        resultado: r.estado,
        importeEstimado: r.estado === "no-apto" ? null : euros(r.importe),
        nombre: nombre.value.trim(),
        telefono: telefono.value.trim(),
        email: email.value.trim(),
        momento: sel.value,
        respuestas: resumenRespuestas(),
        puntosARevisar: r.revisar,
        motivosDeExclusion: r.bloqueos,
        origen: window.location.href,
        fecha: new Date().toLocaleString("es-ES"),
      };

      entregar(datos, form, aviso, enviar);
    });

    form.addEventListener("input", function (e) {
      if (e.target.classList) e.target.classList.remove("is-invalid");
      if (e.target === cb) check.classList.remove("is-invalid");
    });

    return form;
  }

  function campoTexto(id, nombre, etiqueta, tipo, autocompletar, obligatorio) {
    var campo = el("div", "field");
    var lab = el("label", null, etiqueta);
    lab.setAttribute("for", id);
    var input = document.createElement("input");
    input.type = tipo;
    input.id = id;
    input.name = nombre;
    input.autocomplete = autocompletar;
    if (obligatorio) input.required = true;
    campo.appendChild(lab);
    campo.appendChild(input);
    return campo;
  }

  function resumenRespuestas() {
    var salida = {};
    preguntas.forEach(function (p) {
      var v = estado.respuestas[p.id];
      var texto;
      if (Array.isArray(v)) {
        texto = v.length
          ? v
              .map(function (valor) {
                return etiquetaDe(p, valor);
              })
              .join("; ")
          : "Ninguna";
      } else {
        texto = v ? etiquetaDe(p, v) : "Sin respuesta";
      }
      salida[p.titulo] = texto;
    });
    return salida;
  }

  function etiquetaDe(p, valor) {
    var op = p.opciones.filter(function (o) {
      return o.valor === valor;
    })[0];
    return op ? op.etiqueta : valor;
  }

  function textoPlano(d) {
    var lineas = [
      "SOLICITUD DE INFORMACIÓN — " + d.convocatoria,
      "",
      "Nombre: " + d.nombre,
      "Teléfono: " + d.telefono,
      "Email: " + (d.email || "no indicado"),
      "Prefiere que le llamen: " + d.momento,
      "",
      "Resultado del test: " + d.resultado + (d.importeEstimado ? " · Importe estimado: " + d.importeEstimado : ""),
      "",
      "Respuestas:",
    ];
    Object.keys(d.respuestas).forEach(function (k) {
      lineas.push("· " + k + " → " + d.respuestas[k]);
    });
    if (d.puntosARevisar.length) {
      lineas.push("", "Puntos a revisar:");
      d.puntosARevisar.forEach(function (t) {
        lineas.push("· " + t);
      });
    }
    if (d.motivosDeExclusion.length) {
      lineas.push("", "Motivos de exclusión detectados:");
      d.motivosDeExclusion.forEach(function (t) {
        lineas.push("· " + t);
      });
    }
    return lineas.join("\n");
  }

  // Envía al endpoint configurado. Si no hay ninguno (o falla),
  // ofrece WhatsApp / correo ya redactados para que el contacto
  // no se pierda por un problema de configuración.
  function entregar(datos, form, aviso, boton) {
    if (!CFG.formEndpoint) return alternativa(datos, form, false);

    fetch(CFG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(datos),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        gracias(datos, form);
      })
      .catch(function () {
        boton.disabled = false;
        alternativa(datos, form, true);
      });
  }

  function gracias(datos, form) {
    var caja = el("div", "lead lead--ok");
    caja.appendChild(el("h4", "lead__title", "Hemos recibido sus datos"));
    caja.appendChild(
      el(
        "p",
        null,
        "Gracias, " +
          datos.nombre.split(" ")[0] +
          ". Nos pondremos en contacto con usted en el teléfono indicado, normalmente dentro del mismo día laborable."
      )
    );
    form.replaceWith(caja);
    caja.tabIndex = -1;
    caja.focus({ preventScroll: true });
  }

  // Camino alternativo: el resumen ya redactado, listo para enviar.
  function alternativa(datos, form, huboFallo) {
    var caja = el("div", "lead lead--alt");
    caja.appendChild(el("h4", "lead__title", "Último paso: envíenos el resumen"));
    caja.appendChild(
      el(
        "p",
        null,
        huboFallo
          ? "No hemos podido completar el envío automático. Su diagnóstico está preparado: elija cómo hacérnoslo llegar."
          : "Su diagnóstico está preparado con todas las respuestas. Elija cómo prefiere hacérnoslo llegar."
      )
    );

    var texto = textoPlano(datos);
    var acciones = el("div", "lead__acciones");

    if (CFG.whatsapp) {
      var wa = el("a", "btn btn--primary", "Enviar por WhatsApp");
      wa.href = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(texto);
      wa.target = "_blank";
      wa.rel = "noopener";
      acciones.appendChild(wa);
    }
    if (CFG.email) {
      var mail = el("a", "btn btn--ghost", "Enviar por correo");
      mail.href =
        "mailto:" +
        CFG.email +
        "?subject=" +
        encodeURIComponent("Test de subvención — " + datos.convocatoria) +
        "&body=" +
        encodeURIComponent(texto);
      acciones.appendChild(mail);
    }

    var copiar = el("button", "btn btn--ghost", "Copiar el resumen");
    copiar.type = "button";
    copiar.addEventListener("click", function () {
      var ok = function () {
        copiar.textContent = "Resumen copiado";
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(ok, function () {
          area.select();
        });
      } else {
        area.select();
        document.execCommand("copy");
        ok();
      }
    });
    acciones.appendChild(copiar);
    caja.appendChild(acciones);

    var area = document.createElement("textarea");
    area.className = "lead__texto";
    area.rows = 8;
    area.readOnly = true;
    area.value = texto;
    area.setAttribute("aria-label", "Resumen de su consulta");
    caja.appendChild(area);

    if (!CFG.whatsapp && !CFG.email) {
      caja.appendChild(
        el(
          "p",
          "form__hint is-error",
          "PENDIENTE: configure el email, el WhatsApp o el endpoint del formulario en js/config.js."
        )
      );
    }

    form.replaceWith(caja);
    caja.tabIndex = -1;
    caja.focus({ preventScroll: true });
  }

  // ----------------------------------------------------------
  pintarPlazos();
  render();
})();
