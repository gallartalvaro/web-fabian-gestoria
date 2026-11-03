/* Demostraciones de los cinco agentes.
   ============================================================
   Cada agente enseña su flujo en una escena que se reproduce, y cada
   escena tiene tres versiones: la misma mecánica con los datos de tres
   negocios distintos. El visitante elige el suyo y la ve con sus
   palabras —su tarifa, su horario, su papeleo—, que es cuando deja de
   ser una demostración genérica y se reconoce en ella.

   Se construyen a mano, sin biblioteca de animación: el contenido es
   nuestro, la web no tiene empaquetador donde meter un runtime y una
   escena de estas pesa menos que una fotografía.

   Sin JavaScript, o con "reducir movimiento" activado, se queda la
   ilustración de portada: el mismo flujo está escrito al lado. */
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
    linea.classList.remove("es-nuevo");
    void linea.offsetWidth; // reinicia la animación en cada cambio
    linea.classList.add("es-nuevo");
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

  function datos(escena, filas) {
    var caja = poner(escena, el("div", "resumen-demo"));
    filas.forEach(function (fila, i) {
      var dato = el("div", "resumen-demo__dato" + (fila[2] ? " es-aviso" : ""));
      dato.appendChild(el("strong", null, fila[0]));
      dato.appendChild(el("span", null, fila[1]));
      dato.style.animationDelay = i * 110 + "ms";
      caja.appendChild(dato);
    });
  }

  // --------------------------------------------------- 01 · atención

  function hacerAtencion(d) {
    var hilo, puntos;
    var pasos = [
      { ms: 200, hacer: function (e) { hilo = poner(e, el("div", "hilo")); } },
    ];

    d.mensajes.forEach(function (m) {
      if (m.de === "bot") {
        pasos.push({ ms: 650, hacer: function () {
          puntos = el("p", "burbujilla burbujilla--bot escribiendo");
          for (var i = 0; i < 3; i++) puntos.appendChild(el("span"));
          hilo.appendChild(puntos);
        } });
      }
      pasos.push({ ms: m.de === "bot" ? 1150 : 900, hacer: function () {
        if (puntos && puntos.parentNode) puntos.parentNode.removeChild(puntos);
        puntos = null;
        var b = el("p", "burbujilla burbujilla--" + (m.de === "bot" ? "bot" : "ellos"), m.texto);
        if (m.hora) b.appendChild(el("span", "burbujilla__hora", m.hora));
        if (m.firma) b.appendChild(el("span", "burbujilla__firma", m.firma));
        hilo.appendChild(b);
      } });
    });

    pasos.push({ ms: 900, hacer: function (e) {
      var fila = poner(e, el("div", "fichas-demo"));
      d.fichas.forEach(function (par, i) {
        var caja = el("div", "ficha-demo");
        caja.appendChild(el("p", null, par[0]));
        var fuerte = el("strong");
        fuerte.appendChild(marca());
        fuerte.appendChild(document.createTextNode(par[1]));
        caja.appendChild(fuerte);
        caja.style.animationDelay = i * 160 + "ms";
        fila.appendChild(caja);
      });
    } });

    return pasos;
  }

  // ------------------------------------------------------ 02 · agenda

  function hacerAgenda(d) {
    var celdas = [];

    return [
      { ms: 200, hacer: function (e) {
          // Se dibuja como una agenda de verdad: las franjas a la
          // izquierda y los días arriba. Una cuadrícula suelta no se
          // reconoce; esto sí.
          var cal = poner(e, el("div", "calendario"));

          var cabecera = el("div", "calendario__fila calendario__fila--dias");
          cabecera.appendChild(el("span", "calendario__franja"));
          d.dias.forEach(function (dia) { cabecera.appendChild(el("span", null, dia)); });
          cal.appendChild(cabecera);

          d.horas.forEach(function (franja, fila) {
            var linea = el("div", "calendario__fila");
            linea.appendChild(el("span", "calendario__franja", franja));
            for (var col = 0; col < d.dias.length; col++) {
              var i = fila * d.dias.length + col;
              var celda = el("span", "hueco");
              if (d.ocupacion[i]) {
                celda.classList.add("hueco--ocupado");
                celda.style.animationDelay = i * 40 + "ms";
              }
              celdas.push(celda);
              linea.appendChild(celda);
            }
            cal.appendChild(linea);
          });

          rotulo(e, d.rotulos[0]);
        } },
      { ms: 1700, hacer: function (e) { rotulo(e, d.rotulos[1]); } },
      { ms: 850, hacer: function () {
          celdas[d.libera].classList.remove("hueco--ocupado");
          celdas[d.libera].classList.add("hueco--libre");
        } },
      { ms: 1200, hacer: function (e) { rotulo(e, d.rotulos[2]); } },
      { ms: 1300, hacer: function () {
          celdas[d.libera].classList.remove("hueco--libre");
          celdas[d.libera].classList.add("hueco--cubierto");
          celdas[d.libera].appendChild(marca());
        } },
      { ms: 1000, hacer: function (e) {
          rotulo(e, d.rotulos[3]);
          datos(e, d.resumen);
        } },
    ];
  }

  // ---------------------------------------------- 03 · administración

  function hacerAdministracion(d) {
    return [
      { ms: 200, hacer: function (e) {
          rotulo(e, d.rotulos[0]);
          var papel = poner(e, el("div", "papel"));
          papel.appendChild(el("p", "papel__titulo", d.documento));
          [82, 94, 66, 88, 50].forEach(function (ancho) {
            var linea = el("span", "papel__linea");
            linea.style.width = ancho + "%";
            papel.appendChild(linea);
          });
          papel.appendChild(el("span", "papel__barrido"));
        } },
      { ms: 1600, hacer: function (e) {
          rotulo(e, d.rotulos[1]);
          var caja = poner(e, el("div", "campos"));
          d.campos.forEach(function (par, i) {
            var fila = el("div", "campo" + (par[2] ? " campo--ojo" : ""));
            fila.appendChild(el("span", "campo__eti", par[0]));
            fila.appendChild(el("span", "campo__val", par[1]));
            fila.style.animationDelay = i * 150 + "ms";
            caja.appendChild(fila);
          });
        } },
      { ms: 1800, hacer: function (e) {
          var sello = poner(e, el("p", "sello sello--" + d.sello.tipo));
          if (d.sello.tipo === "bien") sello.appendChild(marca());
          sello.appendChild(document.createTextNode(d.sello.texto));
        } },
      { ms: 1200, hacer: function (e) {
          rotulo(e, d.rotulos[2]);
          datos(e, d.resumen);
        } },
      { ms: 900, hacer: function (e) {
          poner(e, el("p", "sello sello--aviso", d.motivos));
        } },
    ];
  }

  // ----------------------------------------------- 04 · conocimiento

  function hacerConocimiento(d) {
    var hilo, fichas;

    return [
      { ms: 200, hacer: function (e) {
          hilo = poner(e, el("div", "hilo"));
          var p = el("p", "burbujilla burbujilla--ellos", d.pregunta);
          p.appendChild(el("span", "burbujilla__hora", d.quien));
          hilo.appendChild(p);
        } },
      { ms: 950, hacer: function (e) {
          rotulo(e, "Buscando en los documentos de la empresa…");
          fichas = poner(e, el("div", "documentos"));
          d.documentos.forEach(function (nombre, i) {
            var doc = el("span", "documento", nombre);
            doc.style.animationDelay = i * 260 + "ms";
            fichas.appendChild(doc);
          });
        } },
      { ms: 1500, hacer: function () { fichas.children[0].classList.add("documento--usado"); } },
      { ms: 750, hacer: function (e) {
          rotulo(e, "Responde, y dice de dónde lo ha sacado.");
          hilo.appendChild(el("p", "burbujilla burbujilla--bot", d.respuesta));
        } },
      { ms: 1100, hacer: function (e) {
          poner(e, el("p", "sello sello--fuente", d.fuente));
        } },
      { ms: 900, hacer: function (e) {
          poner(e, el("p", "sello sello--aviso", d.nota));
        } },
    ];
  }

  // ------------------------------------------------------ 05 · ventas

  function hacerVentas(d) {
    var cajas = [];
    var tarjeta;

    function insignia(texto, dorada) {
      var vieja = tarjeta.querySelector(".insignia");
      if (vieja) tarjeta.removeChild(vieja);
      tarjeta.appendChild(el("span", "insignia" + (dorada ? " insignia--avisa" : ""), texto));
    }

    var pasos = [
      { ms: 200, hacer: function (e) {
          var embudo = poner(e, el("div", "embudo"));
          d.columnas.forEach(function (nombre) {
            var col = el("div", "embudo__col");
            col.appendChild(el("p", "embudo__eti", nombre));
            var caja = el("div", "embudo__caja");
            col.appendChild(caja);
            cajas.push(caja);
            embudo.appendChild(col);
          });
          rotulo(e, d.pasos[0].rotulo);
        } },
      { ms: 750, hacer: function () {
          tarjeta = el("div", "oportunidad es-nuevo");
          tarjeta.appendChild(el("strong", null, d.tarjeta[0]));
          tarjeta.appendChild(el("span", "oportunidad__origen", d.tarjeta[1]));
          cajas[0].appendChild(tarjeta);
        } },
    ];

    d.pasos.slice(1).forEach(function (p) {
      pasos.push({ ms: 1500, hacer: function (e) {
        rotulo(e, p.rotulo);
        if (p.columna !== undefined) {
          cajas[p.columna].appendChild(tarjeta);
          tarjeta.classList.remove("es-nuevo");
          void tarjeta.offsetWidth;
          tarjeta.classList.add("es-nuevo");
          if (p.columna === cajas.length - 1) tarjeta.classList.add("oportunidad--ganada");
        }
        if (p.insignia) insignia(p.insignia, p.avisa);
      } });
    });

    pasos.push({ ms: 1200, hacer: function (e) {
      rotulo(e, d.cierre);
      datos(e, d.resumen);
    } });

    return pasos;
  }

  // --------------------------------------------------------- contenido

  var AGENTES = {
    atencion: {
      hacer: hacerAtencion,
      sectores: [
        {
          nombre: "Taller",
          barra: "WhatsApp · sábado, 21:46",
          pie: "Fuera de horario, con la tarifa delante y la agenda abierta.",
          datos: {
            mensajes: [
              { de: "ellos", texto: "Buenas, ¿hacéis la ITV? Tengo que pasarla antes del día 15.", hora: "21:46" },
              { de: "bot", texto: "Sí, la llevamos nosotros. Son 45 € e incluye la gestión y el traslado. ¿Me dice matrícula y modelo?", firma: "Asistente · respuesta automática" },
              { de: "ellos", texto: "1234 LMN, un León de 2017.", hora: "21:48" },
              { de: "bot", texto: "Perfecto. Tengo martes a las 10:00 o miércoles a las 16:30." },
              { de: "ellos", texto: "El martes.", hora: "21:49" },
              { de: "bot", texto: "Reservado: martes a las 10:00. Traiga ficha técnica y permiso. El lunes le recuerdo." },
            ],
            fichas: [["En la agenda", "Mar 10:00 · ITV"], ["En el CRM", "1234 LMN · León 2017"]],
          },
        },
        {
          nombre: "Clínica dental",
          barra: "WhatsApp · domingo, 22:10",
          pie: "Reconoce la urgencia, no diagnostica y avisa a una persona.",
          datos: {
            mensajes: [
              { de: "ellos", texto: "Se me ha partido un trozo de muela y me duele bastante.", hora: "22:10" },
              { de: "bot", texto: "Siento oír eso. Esto tiene que verlo el dentista: no se lo puedo valorar yo.", firma: "Asistente · respuesta automática" },
              { de: "bot", texto: "Dejo aviso en el teléfono de guardia y le guardo el primer hueco de mañana, a las 09:30." },
              { de: "ellos", texto: "Gracias, a las 9:30 me va bien.", hora: "22:12" },
            ],
            fichas: [["Aviso enviado", "Teléfono de guardia"], ["En la agenda", "Lun 09:30 · urgencia"]],
          },
        },
        {
          nombre: "Academia",
          barra: "Chat de la web · jueves, 20:05",
          pie: "Precio, horario y plazas libres sin que nadie esté delante.",
          datos: {
            mensajes: [
              { de: "ellos", texto: "¿Cuánto vale el curso de inglés B2 y cuándo empieza?", hora: "20:05" },
              { de: "bot", texto: "320 € el trimestre. Martes y jueves de 18:00 a 19:30, empieza el 12 de enero y quedan 4 plazas.", firma: "Asistente · respuesta automática" },
              { de: "ellos", texto: "¿Puedo reservar una?", hora: "20:07" },
              { de: "bot", texto: "Sí, se la guardo 72 horas. ¿Me dice su nombre y un teléfono de contacto?" },
              { de: "ellos", texto: "Marta Server, el mismo de este chat.", hora: "20:08" },
            ],
            fichas: [["Plaza reservada", "B2 · 72 horas"], ["En el CRM", "Marta Server · matrícula"]],
          },
        },
      ],
    },

    agenda: {
      hacer: hacerAgenda,
      sectores: [
        {
          nombre: "Fisioterapia",
          barra: "Agenda · semana del 9 al 13",
          pie: "Sesiones de 45 minutos, bonos descontados y lista de espera.",
          datos: {
            dias: ["L", "M", "X", "J", "V"],
            horas: ["09:00", "11:00", "13:00", "17:00"],
            ocupacion: [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
            libera: 13,
            rotulos: [
              "Semana cerrada: 15 sesiones puestas.",
              "Jueves, 09:10 · Ana anula su sesión de las 17:00.",
              "El agente ofrece el hueco a quien estaba en espera.",
              "Cubierto en nueve minutos. Y descontada la sesión del bono.",
            ],
            resumen: [["9 min", "en cubrirse"], ["0", "llamadas"], ["15", "sesiones firmes"]],
          },
        },
        {
          nombre: "Peluquería",
          barra: "Agenda · jueves",
          pie: "Cada servicio ocupa lo que dura, no una hora por defecto.",
          datos: {
            dias: ["L", "M", "X", "J", "V"],
            horas: ["10:00", "12:00", "16:00", "18:00"],
            ocupacion: [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1],
            libera: 12,
            rotulos: [
              "Jueves lleno: 16 servicios entre cortes y colores.",
              "12:40 · se cae un color de noventa minutos.",
              "Ese hueco no da para otro color, pero sí para dos cortes.",
              "Dos clientas avisadas y el hueco cerrado.",
            ],
            resumen: [["90 min", "liberados"], ["2", "cortes encajados"], ["0", "huecos muertos"]],
          },
        },
        {
          nombre: "Taller",
          barra: "Entradas de taller · semana",
          pie: "Reparte por capacidad real del taller, no por hueco en el reloj.",
          datos: {
            dias: ["L", "M", "X", "J", "V"],
            horas: ["08:00", "11:00", "15:00", "17:00"],
            ocupacion: [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
            libera: 6,
            rotulos: [
              "Dos fosos y dieciséis entradas repartidas.",
              "Martes · entra una distribución de cuatro horas.",
              "El agente mira capacidad de foso, no solo hora libre.",
              "Encajada en el foso 2 sin mover nada de lo demás.",
            ],
            resumen: [["2", "fosos"], ["16", "entradas"], ["0", "solapes"]],
          },
        },
      ],
    },

    administracion: {
      hacer: hacerAdministracion,
      sectores: [
        {
          nombre: "Facturas",
          barra: "Buzón de administración · lunes, 08:00",
          pie: "Registra lo que cuadra y aparta lo que no, con el motivo escrito.",
          datos: {
            documento: "FACTURA · F-2026/0418",
            rotulos: [
              "Lunes, 08:00 · cuarenta correos en el buzón.",
              "Lee el documento y saca los datos.",
              "Lo que no cuadra se aparta con el motivo escrito.",
            ],
            campos: [
              ["Proveedor", "Suministros Bénager, S.L."],
              ["NIF", "B-12345678"],
              ["Fecha", "03/11/2026"],
              ["Base", "1.240,00 €"],
              ["IVA 21 %", "260,40 €"],
              ["Total", "1.500,40 €"],
            ],
            sello: { tipo: "bien", texto: "Cuadra con el pedido 2026/0418" },
            resumen: [["40", "recibidas"], ["35", "registradas"], ["5", "apartadas", true]],
            motivos: "3 · el IVA no coincide   ·   2 · proveedor nuevo",
          },
        },
        {
          nombre: "Albaranes",
          barra: "Reparto del día · martes",
          pie: "Cruza lo pedido con lo recibido y deja la reclamación escrita.",
          datos: {
            documento: "ALBARÁN · A-7714",
            rotulos: [
              "Martes · llegan veintidós albaranes del reparto.",
              "Compara el albarán con el pedido.",
              "Las diferencias quedan señaladas una a una.",
            ],
            campos: [
              ["Pedido", "P-2026/0912"],
              ["Proveedor", "Frutas del Turia"],
              ["Bultos pedidos", "40"],
              ["Bultos recibidos", "37", true],
              ["Fecha", "03/11/2026"],
              ["Diferencia", "−3 cajas", true],
            ],
            sello: { tipo: "aviso", texto: "Faltan 3 cajas · reclamación redactada" },
            resumen: [["22", "albaranes"], ["19", "conformes"], ["3", "con diferencia", true]],
            motivos: "2 · faltan bultos   ·   1 · referencia distinta",
          },
        },
        {
          nombre: "Notificaciones",
          barra: "Buzón electrónico · lunes",
          pie: "Clasifica por cliente y por plazo, y sube lo urgente arriba.",
          datos: {
            documento: "AEAT · REQUERIMIENTO",
            rotulos: [
              "Lunes · dieciocho notificaciones en el buzón.",
              "Identifica cliente, asunto y fecha límite.",
              "Las que tienen plazo se separan del resto.",
            ],
            campos: [
              ["Cliente", "Martínez Soler, M."],
              ["Organismo", "AEAT"],
              ["Asunto", "Requerimiento de IVA"],
              ["Modelo", "303 · 3T"],
              ["Recibida", "28/10/2026"],
              ["Vence", "11/11/2026", true],
            ],
            sello: { tipo: "aviso", texto: "Vence en ocho días · avisado el responsable" },
            resumen: [["18", "recibidas"], ["14", "informativas"], ["4", "con plazo", true]],
            motivos: "1 vence esta semana   ·   3 vencen el mes que viene",
          },
        },
      ],
    },

    conocimiento: {
      hacer: hacerConocimiento,
      sectores: [
        {
          nombre: "Gestoría",
          barra: "Consulta del equipo · martes",
          pie: "Responde con la tarifa del despacho y enseña de dónde sale.",
          datos: {
            quien: "Nuevo en el despacho",
            pregunta: "¿Qué cobramos por un cambio de titularidad de un coche importado?",
            documentos: ["Tarifa 2026", "Manual de trámites", "Criterios internos"],
            respuesta: "180 € + IVA de honorarios. Las tasas de la DGT y el impuesto de transmisiones van aparte y los paga el cliente.",
            fuente: "Fuente: Tarifa 2026 · apartado 4.2",
            nota: "Documento revisado hace dos meses.",
          },
        },
        {
          nombre: "Taller",
          barra: "Consulta de recepción · jueves",
          pie: "Lo que cubre la marca y lo que no, sin abrir el manual entero.",
          datos: {
            quien: "Recepción",
            pregunta: "¿La garantía cubre el embrague de un coche de tres años?",
            documentos: ["Condiciones de marca", "Historial del vehículo", "Manual de garantías"],
            respuesta: "No. A partir del segundo año el embrague queda fuera por desgaste. Se presupuesta como reparación normal.",
            fuente: "Fuente: Condiciones de marca · página 12",
            nota: "Las condiciones cambiaron en enero: esta es la versión vigente.",
          },
        },
        {
          nombre: "Comercio",
          barra: "Consulta de tienda · sábado",
          pie: "La misma respuesta en todo el mostrador, venga quien venga.",
          datos: {
            quien: "Mostrador",
            pregunta: "Compró por la web y quiere devolverlo aquí en tienda. ¿Se puede?",
            documentos: ["Política de devoluciones", "Condiciones de la web", "Circular de tienda"],
            respuesta: "Sí. En compra por internet hay 30 días y se admite la entrega en tienda. En compra presencial son 15 días y hace falta el tique.",
            fuente: "Fuente: Política de devoluciones · apartado 3",
            nota: "Si no estuviera escrito, diría que no lo sabe.",
          },
        },
      ],
    },

    ventas: {
      hacer: hacerVentas,
      sectores: [
        {
          nombre: "Instalaciones",
          barra: "Cartera de oportunidades",
          pie: "Ningún presupuesto se queda sin segunda llamada.",
          datos: {
            columnas: ["Nueva", "Presupuesto enviado", "Ganada"],
            tarjeta: ["Instalación de clima · 4.200 €", "Origen: formulario de la web"],
            pasos: [
              { rotulo: "Día 1 · entra una solicitud por la web." },
              { rotulo: "Día 2 · se envía el presupuesto.", columna: 1, insignia: "Seguimiento el día 5" },
              { rotulo: "Día 5 · sin respuesta. El recordatorio queda redactado.", insignia: "Recordatorio listo para enviar", avisa: true },
              { rotulo: "Día 16 · el cliente acepta.", columna: 2, insignia: "Ganada" },
            ],
            cierre: "Y cada lunes, la foto de la cartera.",
            resumen: [["7", "abiertas"], ["3", "paradas +15 días"], ["1", "caduca el jueves", true]],
          },
        },
        {
          nombre: "Contratos anuales",
          barra: "Renovaciones del trimestre",
          pie: "Avisa con margen, no el día antes de que se renueve solo.",
          datos: {
            columnas: ["En vigor", "Aviso de renovación", "Renovado"],
            tarjeta: ["Mantenimiento anual · 1.800 €", "Cliente desde 2021"],
            pasos: [
              { rotulo: "El contrato vence dentro de sesenta días." },
              { rotulo: "Quedan 60 días · todavía se puede negociar.", columna: 1, insignia: "Preparar propuesta" },
              { rotulo: "Quedan 45 días · la revisión de tarifa va calculada.", insignia: "Propuesta lista para enviar", avisa: true },
              { rotulo: "Quedan 30 días · firmado otro año.", columna: 2, insignia: "Renovado" },
            ],
            cierre: "Ninguna renovación se da por hecha.",
            resumen: [["12", "contratos"], ["4", "vencen este trimestre"], ["1", "sin avisar", true]],
          },
        },
        {
          nombre: "Mayorista",
          barra: "Clientes que se apagan",
          pie: "Detecta al cliente que deja de pedir antes de perderlo del todo.",
          datos: {
            columnas: ["Compra cada mes", "Seis meses sin pedir", "Recuperado"],
            tarjeta: ["Hostelería Ruzafa · 620 €/mes", "Última compra: abril"],
            pasos: [
              { rotulo: "El agente compara con lo que este cliente compraba antes." },
              { rotulo: "Seis meses sin pedido, y antes pedía todos los meses.", columna: 1, insignia: "Avisar al comercial" },
              { rotulo: "Prepara el histórico y lo que solía llevar.", insignia: "Ficha de visita lista", avisa: true },
              { rotulo: "Vuelve a pedir.", columna: 2, insignia: "Recuperado" },
            ],
            cierre: "Cada lunes, los que se están apagando.",
            resumen: [["184", "clientes"], ["11", "dormidos"], ["3", "recuperados este mes"]],
          },
        },
      ],
    },
  };

  // ---------------------------------------------------------- montaje

  function preparar(bloque) {
    var agente = AGENTES[bloque.dataset.demo];
    if (!agente) return;

    var marco = bloque.querySelector(".demo__marco");
    var barra = bloque.querySelector(".demo__barra");
    var escena = bloque.querySelector(".demo__escena");
    var boton = bloque.querySelector(".demo__boton");
    var portada = bloque.querySelector(".demo__portada");
    var relojes = [];
    var corriendo = false;
    var actual = 0;

    // Pestañas de sector, delante del marco.
    var tiras = el("div", "demo__sectores");
    tiras.setAttribute("role", "tablist");
    tiras.setAttribute("aria-label", "Elija el sector de la demostración");
    var botones = agente.sectores.map(function (sector, i) {
      var b = el("button", "demo__sector", sector.nombre);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.addEventListener("click", function () {
        if (actual === i && corriendo) return;
        actual = i;
        pintarPestanas();
        reproducir();
      });
      tiras.appendChild(b);
      return b;
    });
    bloque.insertBefore(tiras, marco);

    var pie = el("p", "demo__pie");
    bloque.insertBefore(pie, boton);

    function pintarPestanas() {
      botones.forEach(function (b, i) {
        b.classList.toggle("es-activo", i === actual);
        b.setAttribute("aria-selected", i === actual ? "true" : "false");
      });
      var sector = agente.sectores[actual];
      barra.lastChild.textContent = " " + sector.barra;
      pie.textContent = sector.pie;
    }

    function limpiar() {
      relojes.forEach(clearTimeout);
      relojes = [];
    }

    function reproducir() {
      limpiar();
      corriendo = true;
      bloque.classList.add("esta-sonando");
      bloque.classList.remove("ya-reproducida");
      boton.textContent = "Reproduciendo…";
      if (portada && portada.parentNode) portada.parentNode.removeChild(portada);
      escena.innerHTML = "";

      var sector = agente.sectores[actual];
      var guion = agente.hacer(sector.datos);
      var t = 0;
      guion.forEach(function (paso) {
        t += paso.ms;
        relojes.push(setTimeout(function () { paso.hacer(escena); }, t));
      });
      relojes.push(setTimeout(function () {
        corriendo = false;
        bloque.classList.remove("esta-sonando");
        // Si el navegador no ejecutó las animaciones, la escena
        // acabada se quedaría invisible: se fuerza el estado final.
        bloque.classList.add("ya-reproducida");
        boton.textContent = "Repetir";
      }, t + 600));
    }

    pintarPestanas();

    boton.addEventListener("click", function () {
      if (corriendo) return;
      reproducir();
    });

    // Arranca sola la primera vez que se ve, que es cuando el visitante
    // la tiene delante. El umbral es bajo a propósito: la escena es más
    // alta que la pantalla de un móvil.
    if ("IntersectionObserver" in window) {
      var miron = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (entrada) {
            if (!entrada.isIntersecting) return;
            miron.unobserve(entrada.target);
            reproducir();
          });
        },
        { threshold: 0.2 }
      );
      miron.observe(bloque);
    }
  }

  var bloques = document.querySelectorAll(".demo[data-demo]");
  if (!bloques.length) return;

  if (quieto) {
    // Sin movimiento no hay nada que reproducir: se queda la
    // ilustración y se retira el botón, para no prometer algo que no
    // va a pasar.
    Array.prototype.forEach.call(bloques, function (bloque) {
      var boton = bloque.querySelector(".demo__boton");
      if (boton) boton.hidden = true;
    });
    return;
  }

  Array.prototype.forEach.call(bloques, preparar);
})();
