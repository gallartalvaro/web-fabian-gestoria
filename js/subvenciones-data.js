// ============================================================
// Gestoría Fabián — Catálogo de ayudas y sus cuestionarios
// ------------------------------------------------------------
// Cada ayuda es un objeto con el plazo oficial, las preguntas
// del test y la función que decide el resultado. Para añadir una
// convocatoria nueva basta con añadir otro objeto aquí, una
// tarjeta en subvenciones.html y su página de ficha.
//
// IMPORTANTE: el test es una herramienta de orientación previa.
// No sustituye a las bases oficiales de la convocatoria.
// ============================================================

window.SUBVENCIONES = {
  "emprende-y-concilia-2026": {
    id: "emprende-y-concilia-2026",
    titulo: "Subvenciones «Emprende y Concilia» 2026",
    organismo: "Ayuntamiento de València",
    importeBase: 3000,

    // Plazo oficial de presentación de solicitudes (AAAA-MM-DD)
    plazo: { inicio: "2026-09-03", fin: "2026-09-22" },

    // --------------------------------------------------------
    // Preguntas del test. Se muestran de una en una.
    //   tipo "unica"    → opciones excluyentes, avanza sola
    //   tipo "multiple" → casillas, avanza con el botón
    // --------------------------------------------------------
    preguntas: [
      {
        id: "perfil",
        tipo: "unica",
        titulo: "¿Quién presentaría la solicitud?",
        ayuda: "La ayuda se dirige a quien inicia una actividad económica por cuenta propia.",
        opciones: [
          { valor: "fisica", etiqueta: "Una persona física dada de alta como autónoma" },
          { valor: "societaria", etiqueta: "Una sociedad, comunidad de bienes o sociedad civil" },
          {
            valor: "colaborador",
            etiqueta:
              "Un autónomo colaborador, o un alta en mutualidad profesional en lugar de en el RETA",
          },
          {
            valor: "excluida",
            etiqueta:
              "Una administración pública, empresa pública o entidad sin ánimo de lucro",
          },
        ],
      },
      {
        id: "altaReta",
        tipo: "unica",
        titulo: "¿Cuándo se produjo el alta en el RETA?",
        ayuda:
          "El RETA es el régimen especial de trabajadores autónomos de la Seguridad Social. " +
          "Esta convocatoria admite las altas producidas del 8 de octubre de 2025 en adelante.",
        opciones: [
          { valor: "dentro", etiqueta: "El 8 de octubre de 2025 o después" },
          { valor: "antes", etiqueta: "Antes del 8 de octubre de 2025" },
          { valor: "pendiente", etiqueta: "Todavía no se ha dado de alta" },
        ],
      },
      {
        id: "retaPrevio",
        tipo: "unica",
        titulo: "¿Había estado de alta en el RETA en los meses inmediatamente anteriores?",
        ayuda:
          "Se valora que se trate de un inicio real de actividad y no de la reanudación " +
          "inmediata de una anterior.",
        opciones: [
          {
            valor: "no",
            etiqueta: "No; venía de otra situación (cuenta ajena, desempleo, estudios…)",
          },
          { valor: "si", etiqueta: "Sí, estuve de alta poco antes" },
          { valor: "nose", etiqueta: "No lo recuerdo con exactitud" },
        ],
      },
      {
        id: "domicilio",
        tipo: "unica",
        titulo: "¿Dónde radica el domicilio fiscal o el local de la actividad?",
        ayuda: "Debe situarse dentro del término municipal de València.",
        opciones: [
          { valor: "valencia", etiqueta: "En València capital" },
          { valor: "otro", etiqueta: "En otro municipio" },
        ],
      },
      {
        id: "padron",
        tipo: "unica",
        titulo: "¿Lleva al menos cinco años empadronado o empadronada en València?",
        ayuda:
          "Si quien solicita es una sociedad, el requisito se cumple a través de una de las " +
          "personas administradoras.",
        opciones: [
          { valor: "si", etiqueta: "Sí, cinco años o más" },
          { valor: "no", etiqueta: "No, menos de cinco años" },
          { valor: "nose", etiqueta: "No estoy seguro o segura" },
        ],
      },
      {
        id: "situacion",
        tipo: "multiple",
        titulo: "De lo siguiente, ¿qué tiene ya en regla?",
        ayuda:
          "Marque únicamente lo que ya cumple. Lo que quede sin marcar no le excluye: " +
          "en la mayoría de los casos se resuelve antes de presentar la solicitud.",
        opciones: [
          { valor: "iae", etiqueta: "Alta en el impuesto de actividades económicas (IAE)" },
          { valor: "aeat", etiqueta: "Al corriente con Hacienda y con la Seguridad Social" },
          { valor: "ayto", etiqueta: "Sin deudas pendientes con el Ayuntamiento de València" },
          {
            valor: "certificado",
            etiqueta: "Certificado digital o Cl@ve para firmar la solicitud",
          },
        ],
      },
      {
        id: "plantilla",
        tipo: "unica",
        titulo: "¿Cuántas personas ha tenido contratadas de media durante el último año?",
        ayuda: "Plantilla media de los doce meses anteriores a la solicitud.",
        opciones: [
          { valor: "menos10", etiqueta: "Ninguna, o menos de 10 personas" },
          { valor: "diez", etiqueta: "10 personas o más" },
        ],
      },
      {
        id: "conciliacion",
        tipo: "multiple",
        titulo: "¿Se encuentra en alguna de estas situaciones?",
        ayuda:
          "Cualquiera de ellas da derecho al incremento por conciliación. " +
          "Si no le afecta ninguna, continúe sin marcar nada.",
        opciones: [
          { valor: "hijos", etiqueta: "Tengo hijos o hijas menores de 12 años" },
          {
            valor: "dependientes",
            etiqueta: "Tengo a mi cargo un familiar en situación de dependencia",
          },
          {
            valor: "medidas",
            etiqueta:
              "He implantado medidas de conciliación en el negocio (horario flexible, teletrabajo, jornada reducida…)",
          },
        ],
      },
      {
        id: "joven",
        tipo: "unica",
        titulo: "¿Tenía menos de 36 años en la fecha del alta en el RETA?",
        ayuda: "Este incremento se suma al anterior.",
        opciones: [
          { valor: "si", etiqueta: "Sí, menos de 36 años" },
          { valor: "no", etiqueta: "No, 36 años o más" },
        ],
      },
    ],

    // --------------------------------------------------------
    // Resultado. Devuelve el estado, el importe estimado y los
    // motivos que se le muestran al visitante.
    //
    // Criterio: solo se descarta a alguien por un requisito que
    // la convocatoria excluye sin matices. Todo lo demás se
    // presenta como "a comprobar", que es justamente el trabajo
    // del despacho.
    // --------------------------------------------------------
    evaluar: function (r) {
      var bloqueos = [];
      var revisar = [];
      var favorables = [];

      // --- Motivos de exclusión claros ---
      if (r.perfil === "excluida") {
        bloqueos.push(
          "Las administraciones y empresas públicas y las entidades sin ánimo de lucro quedan fuera de esta convocatoria."
        );
      }
      if (r.perfil === "colaborador") {
        bloqueos.push(
          "El alta como autónomo colaborador o en una mutualidad profesional no da acceso a esta ayuda, que exige alta propia en el RETA."
        );
      }
      if (r.altaReta === "antes") {
        bloqueos.push(
          "El alta en el RETA es anterior al 8 de octubre de 2025, fecha desde la que se admiten las altas en esta convocatoria."
        );
      }
      if (r.domicilio === "otro") {
        bloqueos.push(
          "La actividad debe tener su domicilio fiscal o su local dentro del término municipal de València."
        );
      }
      if (r.padron === "no") {
        bloqueos.push(
          "Se exige una antigüedad mínima de cinco años de empadronamiento en València."
        );
      }
      if (r.plantilla === "diez") {
        bloqueos.push("La plantilla media del último año debe ser inferior a 10 personas.");
      }

      // --- Puntos que conviene comprobar, pero que no excluyen ---
      if (r.altaReta === "pendiente") {
        revisar.push(
          "Todavía no hay alta en el RETA. El alta debe ser anterior a la presentación de la solicitud, de modo que aún es posible llegar si se tramita de inmediato."
        );
      }
      if (r.retaPrevio === "si" || r.retaPrevio === "nose") {
        revisar.push(
          "Hay que verificar en el informe de vida laboral que no consta un alta previa en el RETA en los meses anteriores."
        );
      }
      if (r.padron === "nose") {
        revisar.push(
          "Conviene confirmar la antigüedad del empadronamiento con un certificado histórico del padrón."
        );
      }

      var situacion = r.situacion || [];
      if (situacion.indexOf("iae") === -1) {
        revisar.push(
          "Falta el alta en el impuesto de actividades económicas (modelo 036/037). Es un trámite rápido que gestionamos nosotros."
        );
      }
      if (situacion.indexOf("aeat") === -1) {
        revisar.push(
          "Hay que estar al corriente con Hacienda y con la Seguridad Social en el momento de solicitar."
        );
      }
      if (situacion.indexOf("ayto") === -1) {
        revisar.push(
          "Hay que comprobar que no existen deudas pendientes con el Ayuntamiento de València."
        );
      }
      if (situacion.indexOf("certificado") === -1) {
        revisar.push(
          "La solicitud solo se admite en línea y firmada digitalmente. Podemos presentarla en su nombre."
        );
      }

      // --- Importe estimado ---
      var importe = this.importeBase;
      var conciliacion = r.conciliacion || [];
      if (conciliacion.length) {
        importe += 500;
        favorables.push("Incremento de 500 € por conciliación.");
      }
      if (r.joven === "si") {
        importe += 500;
        favorables.push("Incremento de 500 € por tener menos de 36 años en la fecha del alta.");
      }

      var estado = "apto";
      if (bloqueos.length) estado = "no-apto";
      else if (revisar.length) estado = "revisar";

      return {
        estado: estado,
        importe: importe,
        bloqueos: bloqueos,
        revisar: revisar,
        favorables: favorables,
      };
    },
  },
};
