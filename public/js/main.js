// ============================================================
// Valentramites — Interacciones de la página
// ============================================================

(function () {
  "use strict";

  // ----------------------------------------------------------
  // El email del despacho se configura en js/config.js, que es
  // donde están todos los datos de contacto. Mientras esté vacío,
  // el formulario avisa de que use el teléfono en lugar de
  // intentar abrir un correo sin destino.
  // ----------------------------------------------------------
  const CONTACT_EMAIL = (window.SITE_CONFIG && window.SITE_CONFIG.email) || "";

  // --- Cabecera y botón de volver arriba ---
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

  const closeNav = () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menú");
  };

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest(".nav__link")) closeNav();
  });

  // ============================================================
  // Explorador de áreas: solo se muestra el área seleccionada,
  // y dentro de ella el detalle va plegado en un acordeón.
  // ============================================================
  const explorer = document.getElementById("explorer");

  if (explorer) {
    const tabs = Array.from(explorer.querySelectorAll(".etab"));
    const panels = Array.from(explorer.querySelectorAll(".epanel"));

    const selectArea = (area, { focusTab = false } = {}) => {
      const tab = tabs.find((t) => t.dataset.area === area);
      if (!tab) return false;

      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
      });

      panels.forEach((p) => {
        p.classList.toggle("is-active", p.dataset.area === area);
      });

      if (focusTab) tab.focus();
      return true;
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => selectArea(tab.dataset.area));
    });

    // Navegación con teclado dentro de la lista de pestañas
    explorer.querySelector(".explorer__tabs").addEventListener("keydown", (e) => {
      const current = tabs.findIndex((t) => t === document.activeElement);
      if (current === -1) return;

      const keys = {
        ArrowDown: current + 1,
        ArrowRight: current + 1,
        ArrowUp: current - 1,
        ArrowLeft: current - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(e.key in keys)) return;

      e.preventDefault();
      const next = (keys[e.key] + tabs.length) % tabs.length;
      selectArea(tabs[next].dataset.area, { focusTab: true });
    });

    // --- Acordeón de subáreas ---
    explorer.querySelectorAll(".acc__item").forEach((item) => {
      const btn = item.querySelector(".acc__btn");
      const count = item.querySelector(".acc__count");
      const total = item.querySelectorAll(".acc__list li").length;

      // La etiqueta con el número de servicios se calcula sola,
      // así no se queda desfasada si cambia el listado.
      if (count) count.textContent = total === 1 ? "1 servicio" : total + " servicios";

      btn.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
      });
    });

    // --- Enlaces que llevan a un área concreta ---
    document.querySelectorAll("[data-goto-area]").forEach((link) => {
      link.addEventListener("click", () => {
        selectArea(link.dataset.gotoArea);
        closeNav();
      });
    });

    // --- Enlace directo del tipo pagina.html#exportacion ---
    const applyHash = () => {
      const area = window.location.hash.replace("#", "");
      if (area && selectArea(area)) {
        document.getElementById("servicios").scrollIntoView({ block: "start" });
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
  }

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

  // ============================================================
  // Formulario de contacto (sin backend: abre el correo)
  // ============================================================
  const form = document.getElementById("contact-form");
  const hint = document.getElementById("form-hint");

  const setHint = (text, state) => {
    hint.textContent = text;
    hint.classList.toggle("is-error", state === "error");
    hint.classList.toggle("is-ok", state === "ok");
  };

  // "Consultar sobre esta área" llega al formulario con el área ya elegida
  document.querySelectorAll("[data-ask]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!form) return;
      const select = form.area;
      const wanted = link.dataset.ask;
      if ([...select.options].some((o) => o.value === wanted)) {
        select.value = wanted;
        select.classList.add("is-prefilled");
      }
    });
  });

  if (form) {
    form.area.addEventListener("change", () => {
      form.area.classList.remove("is-prefilled");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const { nombre, email, telefono, area, mensaje, privacidad } = form;

      // Validación mínima en cliente
      let firstInvalid = null;

      [nombre, email, mensaje].forEach((el) => {
        const invalid = !el.value.trim() || !el.checkValidity();
        el.classList.toggle("is-invalid", invalid);
        if (invalid && !firstInvalid) firstInvalid = el;
      });

      const checkLabel = privacidad.closest(".check");
      checkLabel.classList.toggle("is-invalid", !privacidad.checked);
      if (!privacidad.checked && !firstInvalid) firstInvalid = privacidad;

      if (firstInvalid) {
        setHint("Por favor, revise los campos marcados antes de enviar.", "error");
        firstInvalid.focus();
        return;
      }

      if (!CONTACT_EMAIL) {
        setHint(
          "El envío por correo electrónico aún no está disponible. Puede contactarnos por teléfono.",
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

      setHint("Abriendo su programa de correo con el mensaje redactado…", "ok");
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
