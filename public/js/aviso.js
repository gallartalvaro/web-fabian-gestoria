// ============================================================
// Valentramites — Aviso de convocatorias
// ------------------------------------------------------------
// Dos cosas pequeñas y sin relación entre sí, juntas porque
// viven en el mismo sitio de la portada:
//
//   1. La franja rotatoria de "puertas de entrada": en cada
//      visita se descubre una de las cuatro.
//   2. El alta en el aviso de convocatorias, que se registra
//      como contacto etiquetado en Odoo.
//
// El alta NO crea oportunidad en el embudo: quien pide que le
// avisen de ayudas todavía no lo es. Ver backend/README.md.
// ============================================================
(() => {
  "use strict";

  // ----------------------------------------------------------
  // 1. Puertas de entrada
  // ----------------------------------------------------------
  // La elección de cuál se ve la hace el guion en línea que va
  // justo detrás de la franja en el HTML, para que ocurra antes
  // de que el navegador pinte esa zona y no se vea un cambiazo.
  // Aquí solo queda la red de seguridad: si por lo que sea aquel
  // guion no llegó a correr, se descubre la primera. Una franja
  // vacía sería peor que una franja repetida.
  const puertas = document.querySelectorAll(".puerta");
  if (puertas.length && !document.querySelector(".puerta.es-visible")) {
    puertas[0].classList.add("es-visible");
  }

  // ----------------------------------------------------------
  // 2. Alta en el aviso
  // ----------------------------------------------------------
  const form = document.getElementById("aviso-form");
  if (!form) return;

  const hint = document.getElementById("aviso-hint");
  const original = hint ? hint.textContent : "";

  const setHint = (texto, estado) => {
    if (!hint) return;
    hint.textContent = texto;
    hint.classList.toggle("is-error", estado === "error");
    hint.classList.toggle("is-ok", estado === "ok");
  };

  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // main.js ya guardó la procedencia de la visita al cargar la
  // página; aquí se lee, no se vuelve a calcular.
  const origenGuardado = () => {
    try {
      return JSON.parse(sessionStorage.getItem("origen") || "{}");
    } catch (err) {
      return {};
    }
  };

  const CONSENTIMIENTO =
    "Acepta recibir avisos de convocatorias de subvenciones y el tratamiento de sus " +
    "datos con esa finalidad, con baja en cualquier momento.";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const { nombre, email, actividad, provincia, privacidad } = form;

    // --- Validación mínima en cliente ---
    let primerFallo = null;

    const malEmail = !EMAIL.test(email.value.trim());
    email.classList.toggle("is-invalid", malEmail);
    if (malEmail) primerFallo = email;

    const malActividad = !actividad.value;
    actividad.classList.toggle("is-invalid", malActividad);
    if (malActividad && !primerFallo) primerFallo = actividad;

    const marca = privacidad.closest(".check");
    marca.classList.toggle("is-invalid", !privacidad.checked);
    if (!privacidad.checked && !primerFallo) primerFallo = privacidad;

    if (primerFallo) {
      setHint("Revise los campos marcados: el correo y la actividad hacen falta.", "error");
      primerFallo.focus();
      return;
    }

    // --- Camino alternativo -------------------------------------
    // Si el receptor no contesta, se ofrece el alta por correo ya
    // redactada. Vale menos que el registro automático, pero no
    // pierde a quien se ha molestado en pedirlo.
    const porCorreo = () => {
      const destino = (window.SITE_CONFIG && window.SITE_CONFIG.email) || "";
      if (!destino) {
        setHint("No hemos podido registrar el alta. Vuelva a intentarlo en un momento.", "error");
        return;
      }
      const cuerpo = [
        "Quiero recibir el aviso de convocatorias.",
        "",
        "Nombre o empresa: " + (nombre.value.trim() || "—"),
        "Correo: " + email.value.trim(),
        "Actividad: " + actividad.value,
        "Provincia: " + (provincia.value || "Indiferente"),
      ].join("\n");

      setHint("No hemos podido registrarlo. Le abrimos el correo con el alta ya escrita…", "error");
      window.location.href =
        "mailto:" + destino +
        "?subject=" + encodeURIComponent("Alta en el aviso de convocatorias") +
        "&body=" + encodeURIComponent(cuerpo);
    };

    const endpoint = (window.SITE_CONFIG && window.SITE_CONFIG.formEndpoint) || "";
    if (!endpoint) return porCorreo();

    const boton = form.querySelector('button[type="submit"]');
    if (boton) boton.disabled = true;
    setHint("Dándole de alta…", null);

    // Mismo perfil versionado que el resto de la web. Lo que lo
    // distingue es el tipo: el receptor no crea oportunidad, crea
    // un contacto con las etiquetas que arman la lista de envío.
    const perfil = {
      version: 2,
      tipo: "aviso-subvenciones",
      suscripcion: {
        nombre: nombre.value.trim(),
        email: email.value.trim(),
        actividad: actividad.value,
        provincia: provincia.value,
      },
      consentimiento: {
        aceptado: true,
        texto: CONSENTIMIENTO,
        fecha: new Date().toISOString(),
      },
      seguimiento: {
        pagina: window.location.origin + window.location.pathname,
        origen: origenGuardado(),
        fecha: new Date().toISOString(),
      },
      apellido2: (form.apellido2 && form.apellido2.value) || "",
    };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(perfil),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
      .then(() => {
        form.reset();
        setHint(
          "Hecho. Le escribiremos en cuanto se abra una convocatoria que le encaje.",
          "ok"
        );
      })
      .catch(porCorreo)
      .finally(() => {
        if (boton) boton.disabled = false;
      });
  });

  // Limpiar el aviso de error al corregir
  form.addEventListener("input", (e) => {
    const el = e.target;
    if (el.classList.contains("is-invalid")) el.classList.remove("is-invalid");
    if (el.id === "aviso-privacidad") el.closest(".check").classList.remove("is-invalid");
    if (hint && hint.classList.contains("is-error")) setHint(original, null);
  });
})();
