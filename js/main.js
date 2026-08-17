// ============================================================
// Gestoría Fabián — Interacciones de la página
// ============================================================

(function () {
  "use strict";

  // ----------------------------------------------------------
  // PENDIENTE: email real del despacho.
  // Mientras esté vacío, el formulario avisa de que use el
  // teléfono en lugar de intentar abrir un correo sin destino.
  // ----------------------------------------------------------
  const CONTACT_EMAIL = "";

  // --- Cabecera con sombra al hacer scroll ---
  const header = document.getElementById("header");
  const toTop = document.getElementById("to-top");

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
    toTop.classList.toggle("is-visible", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // --- Menú móvil ---
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });

  // Cerrar el menú al pulsar un enlace
  nav.addEventListener("click", (e) => {
    if (e.target.closest(".nav__link")) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menú");
    }
  });

  // --- Animaciones de aparición al hacer scroll ---
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // --- Resaltar sección activa en el menú ---
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav__link:not(.nav__cta)");
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) => {
              link.classList.toggle(
                "is-active",
                link.getAttribute("href") === "#" + entry.target.id
              );
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // --- Formulario de contacto (sin backend: abre el correo) ---
  const form = document.getElementById("contact-form");
  const hint = document.getElementById("form-hint");

  const setHint = (text, state) => {
    hint.textContent = text;
    hint.classList.toggle("is-error", state === "error");
    hint.classList.toggle("is-ok", state === "ok");
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nombre = form.nombre;
      const email = form.email;
      const telefono = form.telefono;
      const area = form.area;
      const mensaje = form.mensaje;
      const privacidad = form.privacidad;

      // Validación mínima en cliente
      const required = [nombre, email, mensaje];
      let firstInvalid = null;

      required.forEach((el) => {
        const invalid = !el.value.trim() || !el.checkValidity();
        el.classList.toggle("is-invalid", invalid);
        if (invalid && !firstInvalid) firstInvalid = el;
      });

      const checkLabel = privacidad.closest(".check");
      checkLabel.classList.toggle("is-invalid", !privacidad.checked);
      if (!privacidad.checked && !firstInvalid) firstInvalid = privacidad;

      if (firstInvalid) {
        setHint("Revisa los campos marcados antes de enviar.", "error");
        firstInvalid.focus();
        return;
      }

      if (!CONTACT_EMAIL) {
        setHint(
          "El envío por email todavía no está configurado. Contacta por teléfono mientras tanto.",
          "error"
        );
        return;
      }

      const asunto = `Consulta web — ${area.value}`;
      const cuerpo = [
        `Nombre: ${nombre.value.trim()}`,
        `Email: ${email.value.trim()}`,
        `Teléfono: ${telefono.value.trim() || "no indicado"}`,
        `Área: ${area.value}`,
        "",
        "Consulta:",
        mensaje.value.trim(),
      ].join("\n");

      window.location.href =
        `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(asunto)}` +
        `&body=${encodeURIComponent(cuerpo)}`;

      setHint("Abriendo tu programa de correo con el mensaje redactado…", "ok");
    });

    // Limpiar el aviso de error al corregir
    form.addEventListener("input", (e) => {
      const el = e.target;
      if (el.classList.contains("is-invalid")) el.classList.remove("is-invalid");
      if (el.id === "privacidad") el.closest(".check").classList.remove("is-invalid");
    });
  }

  // --- Año actual en el pie ---
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
