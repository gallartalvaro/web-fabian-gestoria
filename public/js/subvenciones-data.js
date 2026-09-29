// ============================================================
// Valentramites — Catálogo de ayudas y sus cuestionarios
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
    nombreCorto: "Emprende y Concilia 2026",
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
        titulo: "¿A nombre de quién se pediría la ayuda?",
        ayuda:
          "Nos referimos a quién sería la persona o la entidad beneficiaria. De presentar la " +
          "solicitud nos encargamos nosotros, si así lo desea.",
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
    // Rasgos del cliente que en Odoo se pueden filtrar y agrupar.
    // Se mantienen pocos y concretos: sirven para segmentar, no para
    // repetir el diagnóstico, que ya va en la descripción.
    etiquetar: function (r) {
      var e = ["Nuevo autónomo"];
      if (r.perfil === "societaria") e.push("Sociedad o CB");
      if (r.altaReta === "pendiente") e.push("Alta RETA pendiente");
      if (r.joven === "si") e.push("Menor de 36");
      var c = r.conciliacion || [];
      if (c.indexOf("hijos") !== -1) e.push("Con hijos menores de 12");
      if (c.indexOf("dependientes") !== -1) e.push("Familiar dependiente");
      if ((r.situacion || []).indexOf("certificado") === -1) e.push("Sin certificado digital");
      return e;
    },

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
          "Falta el alta en el impuesto de actividades económicas (modelo 036/037). Debe constar antes de solicitar y encaja con la actividad real: es una de las causas habituales de denegación."
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

  // ============================================================
  // Renovación de equipamiento de hostelería (RD 638/2026)
  // Ministerio de Industria y Turismo — concesión directa por
  // orden de llegada hasta agotar los 15 M€.
  // ============================================================
  "hosteleria-equipamiento-2026": {
    id: "hosteleria-equipamiento-2026",
    titulo: "Plan de choque para la renovación de equipamiento en hostelería",
    nombreCorto: "Equipamiento hostelería 2026",
    organismo: "Ministerio de Industria y Turismo",
    importeBase: 5000,
    plazo: { inicio: "2026-08-05", fin: "2026-09-30" },

    preguntas: [
      {
        id: "titular",
        tipo: "unica",
        titulo: "¿Quién figura como titular del establecimiento?",
        ayuda: "Hace falta un título jurídico válido para ejercer la actividad en el local.",
        opciones: [
          { valor: "fisica", etiqueta: "Yo mismo, como persona física dada de alta como autónoma" },
          {
            valor: "sociedad",
            etiqueta: "Una sociedad, comunidad de bienes o sociedad civil de la que formo parte",
          },
          { valor: "ninguno", etiqueta: "No soy titular de la actividad del establecimiento" },
        ],
      },
      {
        id: "actividad",
        tipo: "unica",
        titulo: "¿Qué actividad se desarrolla en el establecimiento?",
        ayuda:
          "La convocatoria se limita a los epígrafes CNAE 55 (alojamiento) y 56 (comidas y bebidas).",
        opciones: [
          {
            valor: "restauracion",
            etiqueta: "Restaurante, bar, cafetería, catering o servicio de comidas y bebidas",
          },
          {
            valor: "alojamiento",
            etiqueta: "Hotel, apartamento turístico, camping u otro alojamiento turístico",
          },
          { valor: "otra", etiqueta: "Otra actividad distinta de la hostelería o el alojamiento" },
        ],
      },
      {
        id: "equipo",
        tipo: "multiple",
        titulo: "¿Qué tiene previsto renovar?",
        ayuda: "Puede incluir varios equipos en una misma solicitud.",
        opciones: [
          {
            valor: "maquinaria",
            etiqueta:
              "Electrodomésticos o maquinaria industrial: cámaras, hornos, lavavajillas, vitrinas, abatidores…",
          },
          { valor: "climatizacion", etiqueta: "Terminales de climatización" },
          { valor: "toldos", etiqueta: "Toldos o sombrillas de terraza" },
        ],
      },
      {
        id: "fosiles",
        tipo: "unica",
        titulo: "¿El equipo nuevo funcionaría con gas u otro combustible fósil?",
        ayuda:
          "El real decreto deja fuera expresamente la sustitución por equipos que utilicen combustibles fósiles, incluido el gas natural.",
        opciones: [
          { valor: "no", etiqueta: "No, sería eléctrico" },
          { valor: "si", etiqueta: "Sí, funcionaría con gas" },
          { valor: "nose", etiqueta: "Todavía no he elegido el equipo" },
        ],
      },
      {
        id: "comprado",
        tipo: "unica",
        titulo: "¿Ya ha comprado o instalado el equipo?",
        ayuda: "Solo son imputables los gastos realizados a partir del 1 de marzo de 2026.",
        opciones: [
          { valor: "no", etiqueta: "No, de momento solo tengo el presupuesto" },
          { valor: "marzo", etiqueta: "Sí, a partir del 1 de marzo de 2026" },
          { valor: "antes", etiqueta: "Sí, antes del 1 de marzo de 2026" },
        ],
      },
      {
        id: "importe",
        tipo: "unica",
        titulo: "¿Cuánto calcula que costará la renovación, sin IVA?",
        ayuda:
          "La ayuda cubre hasta el 100 % del coste, con un mínimo de 5.000 € y un máximo de 11.000 € por establecimiento.",
        opciones: [
          { valor: "menos", etiqueta: "Menos de 5.000 €" },
          { valor: "entre", etiqueta: "Entre 5.000 y 11.000 €" },
          { valor: "mas", etiqueta: "Más de 11.000 €" },
          { valor: "nose", etiqueta: "Todavía no lo sé" },
        ],
      },
      {
        id: "establecimientos",
        tipo: "unica",
        titulo: "¿Cuántos establecimientos tiene?",
        ayuda: "Se admite una solicitud por cada establecimiento.",
        opciones: [
          { valor: "uno", etiqueta: "Uno" },
          { valor: "varios", etiqueta: "Más de uno" },
        ],
      },
      {
        id: "situacion",
        tipo: "multiple",
        titulo: "De lo siguiente, ¿qué tiene ya en regla?",
        ayuda: "Marque únicamente lo que ya cumple.",
        opciones: [
          { valor: "censo", etiqueta: "Alta en el Censo de Empresarios con el CNAE de hostelería" },
          { valor: "corriente", etiqueta: "Al corriente con Hacienda y con la Seguridad Social" },
          { valor: "minimis", etiqueta: "No he recibido 300.000 € en ayudas de minimis en tres años" },
          { valor: "certificado", etiqueta: "Certificado digital para firmar la solicitud" },
        ],
      },
    ],

    etiquetar: function (r) {
      var e = ["Hostelería"];
      if (r.actividad === "restauracion") e.push("Restauración");
      if (r.actividad === "alojamiento") e.push("Alojamiento");
      if (r.establecimientos === "varios") e.push("Varios establecimientos");
      if (r.comprado === "marzo") e.push("Equipo ya adquirido");
      if (r.importe === "mas") e.push("Inversión superior al tope");
      if ((r.situacion || []).indexOf("certificado") === -1) e.push("Sin certificado digital");
      return e;
    },

    evaluar: function (r) {
      var bloqueos = [];
      var revisar = [];
      var favorables = [];

      if (r.titular === "ninguno") {
        bloqueos.push(
          "La ayuda la solicita quien es titular de la actividad del establecimiento y puede acreditarlo."
        );
      }
      if (r.actividad === "otra") {
        bloqueos.push(
          "Solo se admiten establecimientos de alojamiento y de restauración, encuadrados en los CNAE 55 y 56."
        );
      }
      if (r.fosiles === "si") {
        bloqueos.push(
          "Queda fuera la sustitución por equipos que utilicen combustibles fósiles, incluido el gas natural."
        );
      }
      if (r.comprado === "antes") {
        bloqueos.push(
          "Los gastos solo son imputables a partir del 1 de marzo de 2026; una compra anterior no es subvencionable."
        );
      }

      var equipo = r.equipo || [];
      if (!equipo.length) {
        revisar.push(
          "Falta concretar qué equipamiento se renueva: la solicitud exige una memoria descriptiva con el ahorro energético que se consigue."
        );
      }
      if (r.fosiles === "nose") {
        revisar.push(
          "Antes de pedir presupuesto conviene descartar los equipos de gas, que no entran en la convocatoria."
        );
      }
      if (r.comprado === "marzo") {
        revisar.push(
          "Al estar el equipo ya adquirido, hay que revisar las fechas de factura y de pago para que encajen en el periodo subvencionable."
        );
      }
      if (r.importe === "menos") {
        revisar.push(
          "Con menos de 5.000 € no se alcanza la ayuda mínima. Suele compensar agrupar varios equipos en una misma solicitud."
        );
      }
      if (r.importe === "nose") {
        revisar.push(
          "Hace falta un presupuesto detallado del instalador para cerrar el importe de la solicitud."
        );
      }

      var situacion = r.situacion || [];
      if (situacion.indexOf("censo") === -1) {
        revisar.push(
          "Hay que comprobar que el alta censal recoge un CNAE de hostelería o alojamiento: es lo primero que se verifica."
        );
      }
      if (situacion.indexOf("corriente") === -1) {
        revisar.push(
          "Se exige estar al corriente con Hacienda y con la Seguridad Social en el momento de solicitar."
        );
      }
      if (situacion.indexOf("minimis") === -1) {
        revisar.push(
          "Hay que sumar las ayudas de minimis de los tres últimos ejercicios: el límite es de 300.000 € por empresa."
        );
      }
      if (situacion.indexOf("certificado") === -1) {
        revisar.push(
          "La solicitud se presenta íntegramente por medios electrónicos. Podemos presentarla en su nombre."
        );
      }

      if (r.establecimientos === "varios") {
        favorables.push("Puede presentar una solicitud por cada establecimiento.");
      }

      var texto = "5.000 – 11.000 €";
      if (r.importe === "mas") texto = "11.000 €";
      if (r.importe === "menos") texto = "Desde 5.000 €";

      var estado = "apto";
      if (bloqueos.length) estado = "no-apto";
      else if (revisar.length) estado = "revisar";

      return {
        estado: estado,
        importe: 5000,
        importeTexto: texto,
        importeDetalle: "Hasta el 100 % del coste, IVA excluido, por establecimiento",
        bloqueos: bloqueos,
        revisar: revisar,
        favorables: favorables,
      };
    },
  },

  // ============================================================
  // EMDANA 2026 — Emprendimiento (Generalitat Valenciana)
  // Reactivación económica de los municipios de la DANA.
  // ============================================================
  "emdana-emprendimiento-2026": {
    id: "emdana-emprendimiento-2026",
    titulo: "Ayudas EMDANA 2026 a la reactivación económica",
    nombreCorto: "EMDANA 2026",
    organismo: "Generalitat Valenciana",
    importeBase: 20000,
    plazo: { inicio: "2026-09-15", fin: "2026-09-30" },

    preguntas: [
      {
        id: "forma",
        tipo: "unica",
        titulo: "¿Bajo qué forma jurídica ejerce la actividad?",
        ayuda: "La convocatoria deja fuera algunas formas sin personalidad jurídica propia.",
        opciones: [
          {
            valor: "autonomo",
            etiqueta: "Persona autónoma, en el RETA o en una mutualidad alternativa",
          },
          {
            valor: "pyme",
            etiqueta: "Pyme, cooperativa o sociedad civil con personalidad jurídica propia",
          },
          {
            valor: "sinpj",
            etiqueta: "Comunidad de bienes o sociedad civil sin personalidad jurídica propia",
          },
          { valor: "excluida", etiqueta: "Entidad sin ánimo de lucro o empresa pública" },
        ],
      },
      {
        id: "inicio",
        tipo: "unica",
        titulo: "¿Cuándo inició la nueva actividad económica?",
        ayuda: "La ayuda se dirige a quien emprendió después de la DANA del 29 de octubre de 2024.",
        opciones: [
          {
            valor: "despues",
            etiqueta: "El 1 de noviembre de 2024 o después, y el alta en el IAE también es posterior",
          },
          {
            valor: "iaeantes",
            etiqueta: "Inicié la actividad después, pero el alta en el IAE es anterior",
          },
          { valor: "antes", etiqueta: "Antes del 1 de noviembre de 2024" },
        ],
      },
      {
        id: "municipio",
        tipo: "unica",
        titulo: "¿Dónde está el centro de trabajo?",
        ayuda:
          "El ámbito son los municipios afectados por la DANA que recoge el Anexo II de la resolución.",
        opciones: [
          {
            valor: "anexo",
            etiqueta:
              "En un municipio afectado por la DANA (Paiporta, Catarroja, Alfafar, Torrent, Algemesí, Utiel…)",
          },
          {
            valor: "pedania",
            etiqueta:
              "En una pedanía del sur de València (La Torre, Forn d’Alcedo, Castellar-l’Oliveral…)",
          },
          { valor: "nose", etiqueta: "No sé si mi municipio está en la lista" },
          { valor: "fuera", etiqueta: "En un municipio que no resultó afectado" },
        ],
      },
      {
        id: "empyme",
        tipo: "unica",
        titulo: "¿Ha solicitado la ayuda EMPYME 2026?",
        ayuda: "Ambas ayudas no pueden percibirse a la vez.",
        opciones: [
          { valor: "no", etiqueta: "No" },
          { valor: "si", etiqueta: "Sí, la he solicitado o la he recibido" },
        ],
      },
      {
        id: "gastos",
        tipo: "unica",
        titulo: "¿A cuánto ascienden los gastos corrientes del negocio ya pagados?",
        ayuda:
          "Alquiler, suministros, personal, seguros, servicios profesionales… La ayuda cubre los gastos corrientes admitidos, no las inversiones ni las compras patrimoniales.",
        opciones: [
          { valor: "mas", etiqueta: "Más de 20.000 €" },
          { valor: "medio", etiqueta: "Entre 5.000 y 20.000 €" },
          { valor: "poco", etiqueta: "Menos de 5.000 €" },
          { valor: "nose", etiqueta: "No lo tengo calculado" },
        ],
      },
      {
        id: "situacion",
        tipo: "multiple",
        titulo: "De lo siguiente, ¿qué tiene ya preparado?",
        ayuda:
          "En esta convocatoria la solicitud y la cuenta justificativa se presentan a la vez, así que los justificantes hacen falta desde el primer día.",
        opciones: [
          { valor: "facturas", etiqueta: "Las facturas de los gastos, a mi nombre" },
          { valor: "pagos", etiqueta: "Los justificantes bancarios de haberlas pagado" },
          { valor: "corriente", etiqueta: "Al corriente con Hacienda y con la Seguridad Social" },
          { valor: "certificado", etiqueta: "Certificado digital para firmar la solicitud" },
        ],
      },
    ],

    etiquetar: function (r) {
      var e = ["Zona DANA"];
      if (r.forma === "autonomo") e.push("Autónomo");
      if (r.forma === "pyme") e.push("Pyme o cooperativa");
      if (r.municipio === "pedania" || r.municipio === "nose") e.push("Municipio por confirmar");
      var sit = r.situacion || [];
      if (sit.indexOf("facturas") === -1 || sit.indexOf("pagos") === -1) e.push("Justificantes por reunir");
      return e;
    },

    evaluar: function (r) {
      var bloqueos = [];
      var revisar = [];
      var favorables = [];

      if (r.forma === "sinpj") {
        bloqueos.push(
          "Las comunidades de bienes y las sociedades civiles sin personalidad jurídica propia quedan excluidas de esta convocatoria."
        );
      }
      if (r.forma === "excluida") {
        bloqueos.push(
          "Las entidades sin ánimo de lucro y las empresas públicas quedan fuera de estas ayudas."
        );
      }
      if (r.inicio === "antes") {
        bloqueos.push(
          "La ayuda exige haber iniciado una nueva actividad económica a partir del 1 de noviembre de 2024."
        );
      }
      if (r.municipio === "fuera") {
        bloqueos.push(
          "El centro de trabajo debe estar en uno de los municipios afectados por la DANA que recoge el Anexo II."
        );
      }
      if (r.empyme === "si") {
        bloqueos.push("No se puede percibir esta ayuda al mismo tiempo que la EMPYME 2026.");
      }

      if (r.inicio === "iaeantes") {
        revisar.push(
          "Hay que revisar la fecha del alta censal: la convocatoria pide que el alta en el IAE sea posterior al 1 de noviembre de 2024."
        );
      }
      if (r.municipio === "pedania") {
        revisar.push(
          "Las pedanías afectadas del sur de València exigen comprobar cómo figura el municipio en el Anexo II antes de presentar."
        );
      }
      if (r.municipio === "nose") {
        revisar.push("Comprobamos en un momento si su municipio está en el Anexo II de la resolución.");
      }
      if (r.gastos === "poco") {
        revisar.push(
          "La ayuda se calcula sobre los gastos corrientes justificados, así que conviene revisar qué gastos del periodo pueden incorporarse."
        );
      }
      if (r.gastos === "nose") {
        revisar.push(
          "Hay que cuantificar los gastos corrientes del periodo: de esa cifra depende el importe."
        );
      }

      var situacion = r.situacion || [];
      if (situacion.indexOf("facturas") === -1 || situacion.indexOf("pagos") === -1) {
        revisar.push(
          "La cuenta justificativa se presenta junto con la solicitud: sin las facturas y sus justificantes de pago no hay expediente."
        );
      }
      if (situacion.indexOf("corriente") === -1) {
        revisar.push("Se exige estar al corriente con Hacienda y con la Seguridad Social.");
      }
      if (situacion.indexOf("certificado") === -1) {
        revisar.push("La presentación es telemática y firmada. Podemos presentarla en su nombre.");
      }

      if (r.gastos === "mas") {
        favorables.push("Sus gastos superan el tope, de modo que optaría al importe máximo.");
      }

      var texto = "Hasta 20.000 €";
      if (r.gastos === "mas") texto = "20.000 €";
      if (r.gastos === "medio") texto = "5.000 – 20.000 €";

      var estado = "apto";
      if (bloqueos.length) estado = "no-apto";
      else if (revisar.length) estado = "revisar";

      return {
        estado: estado,
        importe: 20000,
        importeTexto: texto,
        importeDetalle: "100 % de los gastos corrientes admitidos, con el tope de la convocatoria",
        bloqueos: bloqueos,
        revisar: revisar,
        favorables: favorables,
      };
    },
  },

  // ============================================================
  // Paiporta — Nuevos Emprendedores (línea 2)
  // Ayudas a la reactivación económica tras la DANA del 29 de
  // octubre de 2024. Cuantía fija y por orden de registro de
  // entrada hasta agotar el crédito. BDNS 923051.
  // ============================================================
  "paiporta-emprendedores-2026": {
    id: "paiporta-emprendedores-2026",
    titulo: "Ayudas a nuevos emprendedores de Paiporta tras la DANA",
    nombreCorto: "Emprendedores Paiporta 2026",
    organismo: "Ayuntamiento de Paiporta",
    importeBase: 2500,

    // Línea 2 de la convocatoria. La línea 1 —hostelería y
    // servicios deportivos de los polígonos— cerró a los 30 días
    // de su publicación en el BOP y no se publica en la web.
    plazo: { inicio: "2026-07-03", fin: "2026-12-10" },

    preguntas: [
      {
        id: "perfil",
        tipo: "unica",
        titulo: "¿A nombre de quién se pediría la ayuda?",
        ayuda:
          "La convocatoria admite tanto personas físicas como jurídicas. De presentar la " +
          "solicitud nos encargamos nosotros, si así lo desea.",
        opciones: [
          { valor: "fisica", etiqueta: "Una persona física dada de alta como autónoma" },
          { valor: "societaria", etiqueta: "Una sociedad, comunidad de bienes o sociedad civil" },
          {
            valor: "excluida",
            etiqueta: "Una administración pública o una entidad sin ánimo de lucro",
          },
        ],
      },
      {
        id: "desempleo",
        tipo: "unica",
        titulo: "Antes de darse de alta, ¿estaba en situación de desempleo?",
        ayuda:
          "Es el requisito que define esta línea: la ayuda es para quien sale del desempleo " +
          "montando su propia actividad. Se acredita con el informe de vida laboral.",
        opciones: [
          { valor: "si", etiqueta: "Sí, venía de una situación de desempleo" },
          { valor: "no", etiqueta: "No; venía de trabajar por cuenta ajena o propia" },
          { valor: "nose", etiqueta: "No estoy seguro o segura de cómo consta" },
        ],
      },
      {
        id: "fechaAlta",
        tipo: "unica",
        titulo: "¿Cuándo se dio de alta en el censo (036/037) y en el RETA?",
        ayuda:
          "La convocatoria admite las altas producidas desde el 30 de octubre de 2024 —el día " +
          "siguiente a la DANA— hasta la víspera de presentar la solicitud.",
        opciones: [
          { valor: "dentro", etiqueta: "El 30 de octubre de 2024 o después" },
          { valor: "antes", etiqueta: "Antes del 30 de octubre de 2024" },
          { valor: "pendiente", etiqueta: "Todavía no me he dado de alta" },
        ],
      },
      {
        id: "ubicacion",
        tipo: "unica",
        titulo: "¿Dónde se desarrolla la actividad?",
        ayuda:
          "Esta línea exige que la actividad radique y se mantenga en el casco urbano " +
          "residencial de Paiporta.",
        opciones: [
          { valor: "casco", etiqueta: "En el casco urbano de Paiporta" },
          { valor: "poligono", etiqueta: "En un polígono industrial de Paiporta" },
          { valor: "otro", etiqueta: "En otro municipio" },
        ],
      },
      {
        id: "local",
        tipo: "unica",
        titulo: "¿Cómo es el local de la actividad?",
        ayuda:
          "Se exige local abierto al público a pie de calle, con el título habilitante " +
          "municipal para ejercer la actividad o, al menos, solicitado.",
        opciones: [
          { valor: "licencia", etiqueta: "Local a pie de calle, con la licencia concedida" },
          { valor: "tramite", etiqueta: "Local a pie de calle, con la licencia en trámite" },
          { valor: "sinlocal", etiqueta: "Trabajo desde casa, en línea o sin local propio" },
        ],
      },
      {
        id: "documentacion",
        tipo: "multiple",
        titulo: "De lo siguiente, ¿qué tiene ya preparado?",
        ayuda:
          "Marque únicamente lo que ya tiene. Lo que quede sin marcar no le excluye: " +
          "es justamente lo que preparamos nosotros antes de presentar.",
        opciones: [
          { valor: "vidalaboral", etiqueta: "Informe de vida laboral actualizado" },
          { valor: "modelo036", etiqueta: "Modelo 036 o 037 con la fecha de alta y el domicilio" },
          { valor: "altass", etiqueta: "Alta en la Seguridad Social en el régimen que corresponda" },
          { valor: "memoria", etiqueta: "Memoria del proyecto empresarial (máximo 2 páginas)" },
          { valor: "certificado", etiqueta: "Certificado digital o Cl@ve para firmar la solicitud" },
        ],
      },
    ],

    etiquetar: function (r) {
      var e = ["Nuevo autónomo", "Zona DANA", "Paiporta"];
      if (r.perfil === "societaria") e.push("Sociedad o CB");
      if (r.fechaAlta === "pendiente") e.push("Alta RETA pendiente");
      if (r.local === "tramite") e.push("Licencia en trámite");
      if ((r.documentacion || []).indexOf("certificado") === -1) e.push("Sin certificado digital");
      return e;
    },

    evaluar: function (r) {
      var bloqueos = [];
      var revisar = [];
      var favorables = [];

      // --- Motivos de exclusión claros ---
      if (r.perfil === "excluida") {
        bloqueos.push(
          "La ayuda se dirige a quien ejerce una actividad económica; las administraciones y las entidades sin ánimo de lucro quedan fuera."
        );
      }
      if (r.desempleo === "no") {
        bloqueos.push(
          "Esta línea exige haber estado en situación de desempleo inmediatamente antes del alta en el censo de obligados tributarios."
        );
      }
      if (r.fechaAlta === "antes") {
        bloqueos.push(
          "El alta en el censo y en el RETA es anterior al 30 de octubre de 2024, fecha desde la que se admiten las altas en esta convocatoria."
        );
      }
      if (r.ubicacion === "otro") {
        bloqueos.push(
          "La actividad debe radicarse y mantenerse dentro del término municipal de Paiporta."
        );
      }
      if (r.ubicacion === "poligono") {
        bloqueos.push(
          "Esta línea exige que la actividad esté en el casco urbano residencial. Los polígonos Pascualeta, Estación y Mina entraban en la línea 1, cuyo plazo ya ha terminado."
        );
      }
      if (r.local === "sinlocal") {
        bloqueos.push(
          "Se exige un local abierto al público a pie de calle. La actividad ejercida desde el domicilio o sin establecimiento no cumple ese requisito."
        );
      }

      // --- Puntos que conviene comprobar, pero que no excluyen ---
      if (r.perfil === "societaria") {
        revisar.push(
          "Tratándose de una persona jurídica, hay que concretar en quién se acredita la situación de desempleo previa al alta de la actividad."
        );
      }
      if (r.desempleo === "nose") {
        revisar.push(
          "Conviene confirmar en el informe de vida laboral que la situación anterior al alta consta como desempleo."
        );
      }
      if (r.fechaAlta === "pendiente") {
        revisar.push(
          "Todavía no hay alta. El alta en el censo y en el RETA debe ser anterior al día de la solicitud, de modo que aún se llega si se tramita de inmediato."
        );
      }
      if (r.local === "tramite") {
        revisar.push(
          "La convocatoria admite el título habilitante en trámite, pero hay que acreditar que está solicitado ante el Ayuntamiento."
        );
      }

      var doc = r.documentacion || [];
      if (doc.indexOf("vidalaboral") === -1) {
        revisar.push(
          "Falta el informe de vida laboral actualizado, que es lo que acredita el desempleo previo al alta."
        );
      }
      if (doc.indexOf("modelo036") === -1) {
        revisar.push(
          "Falta la copia del modelo 036 o 037 en la que consten la fecha de alta y el domicilio de la actividad."
        );
      }
      if (doc.indexOf("altass") === -1) {
        revisar.push(
          "Falta el documento de alta en la Seguridad Social en el régimen que corresponda."
        );
      }
      if (doc.indexOf("memoria") === -1) {
        revisar.push(
          "Falta la memoria descriptiva del proyecto, de dos páginas como máximo, con su viabilidad y su aportación a la reactivación de la zona. La redactamos nosotros."
        );
      }
      if (doc.indexOf("certificado") === -1) {
        revisar.push(
          "La solicitud se presenta en la sede electrónica con certificado digital o Cl@ve. Podemos presentarla en su nombre."
        );
      }

      // Particularidad de esta convocatoria: el Decreto Ley 11/2024
      // exime del requisito general de estar al corriente.
      if (!bloqueos.length) {
        favorables.push(
          "No se exige estar al corriente con Hacienda ni con la Seguridad Social (Decreto Ley 11/2024)."
        );
      }

      var estado = "apto";
      if (bloqueos.length) estado = "no-apto";
      else if (revisar.length) estado = "revisar";

      return {
        estado: estado,
        importe: 2500,
        importeTexto: "2.500 €",
        importeDetalle: "Cuantía fija, por orden de registro de entrada hasta agotar el crédito",
        bloqueos: bloqueos,
        revisar: revisar,
        favorables: favorables,
      };
    },
  },

  // ============================================================
  // IVACE — Eficiencia energética en empresas 2026
  // Bases: Resolución de 18/08/2025 (DOGV 10179). Convocatoria:
  // Resolución de 18/06/2026. Cofinanciada por FEDER.
  // BDNS 914587.
  // ============================================================
  "ivace-eficiencia-energetica-2026": {
    id: "ivace-eficiencia-energetica-2026",
    titulo: "Ayudas del IVACE a la eficiencia energética en empresas 2026",
    nombreCorto: "Eficiencia energética IVACE 2026",
    organismo: "IVACE · Generalitat Valenciana",

    // La cuantía depende de la inversión, así que evaluar()
    // devuelve importeTexto en lugar de una cifra fija.
    importeBase: 0,
    plazo: { inicio: "2026-06-27", fin: "2026-10-29" },

    preguntas: [
      {
        id: "perfil",
        tipo: "unica",
        titulo: "¿Quién solicitaría la ayuda?",
        ayuda:
          "La convocatoria admite cualquier entidad privada, incluidos los empresarios " +
          "individuales y las entidades sin ánimo de lucro. El tamaño decide el porcentaje.",
        opciones: [
          { valor: "autonomo", etiqueta: "Un empresario o empresaria individual (autónomo)" },
          { valor: "pequena", etiqueta: "Una empresa de menos de 50 personas" },
          { valor: "mediana", etiqueta: "Una empresa de entre 50 y 249 personas" },
          { valor: "grande", etiqueta: "Una empresa de 250 personas o más" },
        ],
      },
      {
        id: "actuacion",
        tipo: "unica",
        titulo: "¿Qué tiene previsto hacer?",
        ayuda:
          "Se apoyan las actuaciones que producen un ahorro de energía medible. Las " +
          "instalaciones de energías renovables no entran en esta convocatoria.",
        opciones: [
          {
            valor: "equipos",
            etiqueta:
              "Sustituir maquinaria o equipos auxiliares —calderas, compresores, motores, quemadores— por otros de alta eficiencia",
          },
          {
            valor: "frio",
            etiqueta: "Renovar equipos de refrigeración o armarios de conservación profesionales",
          },
          {
            valor: "control",
            etiqueta: "Implantar sistemas de gestión energética, medida, control o automatización",
          },
          {
            valor: "edificio",
            etiqueta: "Mejorar la iluminación, la climatización o el aislamiento del edificio",
          },
          { valor: "renovable", etiqueta: "Instalar placas solares u otra energía renovable" },
        ],
      },
      {
        id: "uso",
        tipo: "unica",
        titulo: "¿Qué uso tiene el edificio o la instalación?",
        ayuda:
          "La convocatoria excluye las mejoras de iluminación, climatización y aislamiento en " +
          "determinados usos de edificio. La maquinaria de proceso, en cambio, se apoya sea " +
          "cual sea el uso.",
        opciones: [
          { valor: "industrial", etiqueta: "Industrial, taller, obrador, almacén o logística" },
          {
            valor: "terciario",
            etiqueta: "Comercio, restauración, hotel, oficina, centro docente, sanitario o deportivo",
          },
          { valor: "otro", etiqueta: "Otro uso, o todavía sin definir" },
        ],
      },
      {
        id: "inicio",
        tipo: "unica",
        titulo: "¿Ha empezado ya la inversión?",
        ayuda:
          "La ayuda tiene carácter incentivador: la actuación no puede haberse iniciado antes " +
          "de registrar la solicitud. Un pedido en firme o un anticipo ya cuentan como inicio.",
        opciones: [
          { valor: "no", etiqueta: "No, todavía no he encargado ni pagado nada" },
          { valor: "presupuestos", etiqueta: "Solo tengo presupuestos pedidos, sin encargo en firme" },
          { valor: "si", etiqueta: "Sí; hay pedido en firme, obra empezada o equipos comprados" },
        ],
      },
      {
        id: "inversion",
        tipo: "unica",
        titulo: "¿De cuánto sería aproximadamente la inversión?",
        ayuda:
          "Sirve para estimar el importe. La ayuda se calcula sobre el coste subvencionable, " +
          "que no siempre coincide con el total de la factura.",
        opciones: [
          { valor: "baja", etiqueta: "Menos de 20.000 €" },
          { valor: "media", etiqueta: "Entre 20.000 y 100.000 €" },
          { valor: "alta", etiqueta: "Más de 100.000 €" },
          { valor: "nose", etiqueta: "Todavía no lo sé" },
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
          { valor: "ubicacion", etiqueta: "La instalación está en la Comunitat Valenciana" },
          { valor: "ahorro", etiqueta: "Un técnico ha calculado el ahorro energético previsto" },
          { valor: "ofertas", etiqueta: "Tengo tres ofertas de proveedores distintos" },
          { valor: "corriente", etiqueta: "Al corriente con Hacienda y con la Seguridad Social" },
          { valor: "certificado", etiqueta: "Certificado digital para firmar la solicitud" },
        ],
      },
    ],

    etiquetar: function (r) {
      var e = ["Eficiencia energética"];
      if (r.perfil === "autonomo") e.push("Autónomo");
      if (r.perfil === "pequena") e.push("Pequeña empresa");
      if (r.perfil === "mediana") e.push("Mediana empresa");
      if (r.perfil === "grande") e.push("Gran empresa");
      if (r.uso === "industrial") e.push("Industria o taller");
      if (r.uso === "terciario") e.push("Comercio u hostelería");
      if (r.inversion === "alta") e.push("Inversión alta");
      if ((r.situacion || []).indexOf("certificado") === -1) e.push("Sin certificado digital");
      return e;
    },

    evaluar: function (r) {
      var bloqueos = [];
      var revisar = [];
      var favorables = [];

      // --- Motivos de exclusión claros ---
      if (r.actuacion === "renovable") {
        bloqueos.push(
          "Los proyectos de instalación de energías renovables quedan expresamente fuera de esta convocatoria, que es solo de ahorro y eficiencia energética."
        );
      }
      if (r.actuacion === "edificio" && r.uso === "terciario") {
        bloqueos.push(
          "Las mejoras de iluminación, climatización y envolvente térmica no se apoyan en edificios de uso comercial, de restauración, hotelero, administrativo, docente, sanitario, cultural, recreativo o deportivo."
        );
      }
      if (r.inicio === "si") {
        bloqueos.push(
          "La actuación no puede haberse iniciado antes de registrar la solicitud: con el pedido en firme o la compra ya hecha, la ayuda pierde su carácter incentivador."
        );
      }

      // --- Puntos que conviene comprobar, pero que no excluyen ---
      if (r.actuacion === "edificio" && r.uso === "otro") {
        revisar.push(
          "Hay que concretar el uso del edificio: esta clase de mejora está excluida en los usos comercial, de restauración, hotelero, administrativo, docente, sanitario, cultural, recreativo y deportivo, pero sí se apoya en instalaciones industriales."
        );
      }
      if (r.actuacion === "frio" && r.uso === "terciario") {
        revisar.push(
          "La renovación de equipos de refrigeración profesionales figura entre las actuaciones apoyables, pero hay que delimitarla bien frente a la mejora de las instalaciones térmicas del edificio, que en este uso sí queda excluida."
        );
      }
      if (r.inicio === "presupuestos") {
        revisar.push(
          "Pedir presupuestos no inicia la actuación, pero no debe firmarse ningún encargo ni anticipo hasta que la solicitud esté registrada."
        );
      }

      var s = r.situacion || [];
      if (s.indexOf("ubicacion") === -1) {
        revisar.push("El proyecto debe ejecutarse dentro del territorio de la Comunitat Valenciana.");
      }
      if (s.indexOf("ahorro") === -1) {
        revisar.push(
          "Hay que justificar documentalmente el ahorro de energía y de emisiones, con un ratio mínimo de 150 tep por millón de euros de inversión elegible. Es el punto técnico que más solicitudes deja fuera."
        );
      }
      if (s.indexOf("ofertas") === -1 && r.inversion !== "baja") {
        revisar.push(
          "Cuando un gasto supera los 15.000 € en suministros o servicios, o los 40.000 € en obra —IVA excluido—, hay que aportar tres ofertas de proveedoras distintas y sin vinculación entre sí."
        );
      }
      if (s.indexOf("corriente") === -1) {
        revisar.push(
          "Hay que estar al corriente con Hacienda y con la Seguridad Social en el momento de solicitar."
        );
      }
      if (s.indexOf("certificado") === -1) {
        revisar.push(
          "La solicitud se presenta obligatoriamente por vía telemática en la sede de la Generalitat. Podemos presentarla en su nombre."
        );
      }

      // --- Intensidad de la ayuda e importe estimado ---
      // 35 % general, +20 puntos para pequeña empresa y +10 para
      // mediana, con un tope de 400.000 € por proyecto.
      var intensidad = 35;
      if (r.perfil === "pequena" || r.perfil === "autonomo") intensidad = 55;
      else if (r.perfil === "mediana") intensidad = 45;

      if (intensidad === 55) {
        favorables.push(
          "Intensidad máxima del 55 %, la que corresponde a la pequeña empresa."
        );
      } else if (intensidad === 45) {
        favorables.push("Intensidad máxima del 45 % por tratarse de una mediana empresa.");
      }

      var redondo = function (bruto) {
        return String(Math.round(bruto / 100) * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      };
      var texto = "Hasta el " + intensidad + " % de la inversión";
      if (r.inversion === "baja") {
        texto = "Hasta unos " + redondo((20000 * intensidad) / 100) + " €";
      } else if (r.inversion === "media") {
        texto =
          redondo((20000 * intensidad) / 100) + " – " + redondo((100000 * intensidad) / 100) + " €";
      } else if (r.inversion === "alta") {
        texto = "Desde " + redondo((100000 * intensidad) / 100) + " €";
      }

      var estado = "apto";
      if (bloqueos.length) estado = "no-apto";
      else if (revisar.length) estado = "revisar";

      return {
        estado: estado,
        importe: 0,
        importeTexto: texto,
        importeDetalle:
          "El " + intensidad + " % del coste subvencionable, con un tope de 400.000 € por proyecto",
        bloqueos: bloqueos,
        revisar: revisar,
        favorables: favorables,
      };
    },
  },
};
