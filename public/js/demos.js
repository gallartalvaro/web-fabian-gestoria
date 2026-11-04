/* Demostraciones de los cinco agentes.
   ============================================================
   Cada escena imita la pantalla real en la que ocurriría la cosa: una
   agenda con sus franjas y sus bloques de color, una conversación de
   WhatsApp con su cabecera y sus dobles marcas, una bandeja de
   facturas con el documento a un lado y los datos al otro, un embudo
   con el total de cada columna. El objetivo es que quien la mire
   piense "esto es mi negocio", no "esto es un dibujo".

   Y cada una tiene tres versiones, una por sector, con pestañas para
   cambiar.

   Sin biblioteca de animación: el contenido es nuestro, la web no
   tiene empaquetador y todo esto pesa menos que una fotografía.
   Sin JavaScript, o con "reducir movimiento", se queda la ilustración
   de portada y el flujo escrito al lado. */
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

  function poner(padre, nodo) {
    padre.appendChild(nodo);
    return nodo;
  }

  function rotulo(escena, texto) {
    var linea = escena.querySelector(".demo__paso");
    if (!linea) linea = poner(escena, el("p", "demo__paso"));
    linea.textContent = texto;
    linea.classList.remove("es-nuevo");
    void linea.offsetWidth;
    linea.classList.add("es-nuevo");
  }

  function icono(d, grosor) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", grosor || 2.6);
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    var trazo = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trazo.setAttribute("d", d);
    svg.appendChild(trazo);
    return svg;
  }

  var VISTO = "m2 13 4 4 9-10M9 17l9-10"; // dobles marcas de entregado
  var MARCA = "m5 13 4 4 10-10";

  function resumen(escena, filas) {
    var caja = poner(escena, el("div", "resumen-demo"));
    filas.forEach(function (fila, i) {
      var dato = el("div", "resumen-demo__dato" + (fila[2] ? " es-aviso" : ""));
      dato.appendChild(el("strong", null, fila[0]));
      dato.appendChild(el("span", null, fila[1]));
      dato.style.animationDelay = i * 110 + "ms";
      caja.appendChild(dato);
    });
  }

  // =================================================== 01 · ATENCIÓN
  // Una conversación tal como se ve en el teléfono.

  function hacerAtencion(d) {
    var hilo, puntos;

    function burbuja(m) {
      var b = el("p", "chat__msg chat__msg--" + (m.de === "bot" ? "sale" : "entra"));
      b.appendChild(document.createTextNode(m.texto));
      var pie = el("span", "chat__meta");
      pie.appendChild(el("span", null, m.hora));
      if (m.de === "bot") pie.appendChild(icono(VISTO, 2.2));
      b.appendChild(pie);
      if (m.firma) b.insertBefore(el("span", "chat__firma", m.firma), b.firstChild);
      hilo.appendChild(b);
      hilo.scrollTop = hilo.scrollHeight;
    }

    var pasos = [
      { ms: 200, hacer: function (e) {
          var app = poner(e, el("div", "chat"));

          var cab = poner(app, el("div", "chat__cab"));
          cab.appendChild(el("span", "chat__avatar", d.iniciales));
          var quien = poner(cab, el("div", "chat__quien"));
          quien.appendChild(el("strong", null, d.negocio));
          quien.appendChild(el("span", null, d.canal));

          hilo = poner(app, el("div", "chat__hilo"));
          hilo.appendChild(el("span", "chat__fecha", d.dia));

          var barra = poner(app, el("div", "chat__barra"));
          barra.appendChild(el("span", "chat__campo", "Escribe un mensaje"));
          var env = el("span", "chat__enviar");
          env.appendChild(icono("M4 12h14M13 6l6 6-6 6", 2.4));
          barra.appendChild(env);
        } },
    ];

    d.mensajes.forEach(function (m) {
      if (m.de === "bot") {
        // Los tiempos son los de una conversacion de verdad: se
        // tarda en leer, en escribir y en contestar. Si va mas
        // rapido parece un volcado, no una conversacion.
        pasos.push({ ms: 850, hacer: function () {
          puntos = el("p", "chat__msg chat__msg--sale chat__escribiendo");
          for (var i = 0; i < 3; i++) puntos.appendChild(el("span"));
          hilo.appendChild(puntos);
          hilo.scrollTop = hilo.scrollHeight;
        } });
      }
      pasos.push({ ms: m.de === "bot" ? 1400 : 1150, hacer: function () {
        if (puntos && puntos.parentNode) puntos.parentNode.removeChild(puntos);
        puntos = null;
        burbuja(m);
      } });
    });

    pasos.push({ ms: 1050, hacer: function (e) {
      rotulo(e, d.cierre);
      var fila = poner(e, el("div", "fichas-demo"));
      d.fichas.forEach(function (par, i) {
        var caja = el("div", "ficha-demo");
        caja.appendChild(el("p", null, par[0]));
        var fuerte = el("strong");
        fuerte.appendChild(icono(MARCA, 3));
        fuerte.appendChild(document.createTextNode(par[1]));
        caja.appendChild(fuerte);
        caja.style.animationDelay = i * 160 + "ms";
        fila.appendChild(caja);
      });
    } });

    return pasos;
  }

  // ===================================================== 02 · AGENDA
  // Una agenda semanal de verdad: franjas a la izquierda, días
  // arriba y bloques de color proporcionales a lo que dura cada cosa.

  var PASO = 15; // minutos por fila de la rejilla
  var FILAS = 28; // siete horas

  function hacerAgenda(d) {
    var rejilla;
    var bloques = {};

    function cita(c, clave) {
      var b = el("div", "cita cita--t" + c[4]);
      b.style.gridColumn = c[0] + 1;
      b.style.gridRow = c[1] / PASO + 1 + " / span " + c[2] / PASO;
      b.appendChild(el("b", null, hora(c[1]) + " " + c[3]));
      b.appendChild(el("span", null, c[5] || d.tipos[c[4]]));
      if (clave) bloques[clave] = b;
      rejilla.appendChild(b);
      return b;
    }

    function hora(min) {
      var t = d.desde * 60 + min;
      return ("0" + Math.floor(t / 60)).slice(-2) + ":" + ("0" + (t % 60)).slice(-2);
    }

    return [
      { ms: 200, hacer: function (e) {
          var cal = poner(e, el("div", "cal"));

          var barra = poner(cal, el("div", "cal__barra"));
          barra.appendChild(el("span", "cal__flecha", "‹"));
          barra.appendChild(el("strong", null, d.semana));
          barra.appendChild(el("span", "cal__flecha", "›"));
          barra.appendChild(el("span", "cal__vista", "Semana"));

          var cabecera = poner(cal, el("div", "cal__dias"));
          cabecera.appendChild(el("span", "cal__esquina"));
          d.dias.forEach(function (dia) {
            var c = el("span", "cal__dia");
            c.appendChild(el("b", null, dia[0]));
            c.appendChild(el("i", null, dia[1]));
            cabecera.appendChild(c);
          });

          var cuerpo = poner(cal, el("div", "cal__cuerpo"));
          var horas = poner(cuerpo, el("div", "cal__horas"));
          for (var h = 0; h < FILAS / 4; h++) {
            horas.appendChild(el("span", null, hora(h * 60)));
          }
          rejilla = poner(cuerpo, el("div", "cal__rejilla"));

          d.citas.forEach(function (c, i) {
            var b = cita(c);
            b.style.animationDelay = i * 45 + "ms";
          });

          var leyenda = poner(cal, el("div", "cal__leyenda"));
          d.tipos.forEach(function (nombre, i) {
            var t = el("span", "cal__tipo cal__tipo--t" + i, nombre);
            leyenda.appendChild(t);
          });

          rotulo(e, d.rotulos[0]);
        } },

      { ms: 1800, hacer: function (e) { rotulo(e, d.rotulos[1]); } },

      { ms: 900, hacer: function () {
          var fuera = cita(d.anula, "hueco");
          fuera.classList.add("cita--libre");
          fuera.lastChild.textContent = "Libre";
          fuera.firstChild.textContent = hora(d.anula[1]);
          // La cita que se cae deja de contar: se marca la que había.
          Array.prototype.forEach.call(rejilla.children, function (b) {
            if (b !== fuera && b.style.gridRow === fuera.style.gridRow &&
                b.style.gridColumn === fuera.style.gridColumn) {
              b.classList.add("cita--fuera");
            }
          });
        } },

      { ms: 1300, hacer: function (e) { rotulo(e, d.rotulos[2]); } },

      { ms: 1300, hacer: function () {
          if (bloques.hueco) rejilla.removeChild(bloques.hueco);
          d.cubre.forEach(function (c) {
            var b = cita(c);
            b.classList.add("cita--nueva");
          });
        } },

      { ms: 1100, hacer: function (e) {
          rotulo(e, d.rotulos[3]);
          resumen(e, d.resumen);
        } },
    ];
  }

  // ============================================= 03 · ADMINISTRACIÓN
  // La bandeja de documentos: el papel a un lado, lo extraído al otro.

  function hacerAdministracion(d) {
    var panel;

    return [
      { ms: 200, hacer: function (e) {
          rotulo(e, d.rotulos[0]);
          var app = poner(e, el("div", "bandeja"));

          var barra = poner(app, el("div", "bandeja__barra"));
          barra.appendChild(el("strong", null, d.bandeja));
          barra.appendChild(el("span", "bandeja__contador", d.posicion));

          panel = poner(app, el("div", "bandeja__cuerpo"));

          var papel = poner(panel, el("div", "papel"));
          papel.appendChild(el("p", "papel__cab", d.emisor));
          papel.appendChild(el("p", "papel__titulo", d.documento));
          d.lineas.forEach(function (linea) {
            var fila = el("div", "papel__fila");
            fila.appendChild(el("span", null, linea[0]));
            fila.appendChild(el("b", null, linea[1]));
            papel.appendChild(fila);
          });
          var total = el("div", "papel__fila papel__fila--total");
          total.appendChild(el("span", null, d.totalEtiqueta));
          total.appendChild(el("b", null, d.total));
          papel.appendChild(total);
          papel.appendChild(el("span", "papel__barrido"));
        } },

      { ms: 1700, hacer: function (e) {
          rotulo(e, d.rotulos[1]);
          var caja = poner(panel, el("div", "campos"));
          d.campos.forEach(function (par, i) {
            var fila = el("div", "campo" + (par[2] ? " campo--ojo" : ""));
            fila.appendChild(el("span", "campo__eti", par[0]));
            var valor = el("span", "campo__val");
            valor.appendChild(document.createTextNode(par[1]));
            valor.appendChild(icono(MARCA, 3));
            fila.appendChild(valor);
            fila.style.animationDelay = i * 140 + "ms";
            caja.appendChild(fila);
          });
        } },

      { ms: 1800, hacer: function (e) {
          var sello = poner(e, el("p", "sello sello--" + d.sello.tipo));
          if (d.sello.tipo === "bien") sello.appendChild(icono(MARCA, 3));
          sello.appendChild(document.createTextNode(d.sello.texto));
        } },

      { ms: 1200, hacer: function (e) {
          rotulo(e, d.rotulos[2]);
          resumen(e, d.resumen);
        } },

      { ms: 900, hacer: function (e) {
          poner(e, el("p", "sello sello--aviso", d.motivos));
        } },
    ];
  }

  // ============================================== 04 · CONOCIMIENTO
  // La consulta del equipo, con la respuesta y su fuente citada.

  function hacerConocimiento(d) {
    var hilo, fichas;

    return [
      { ms: 200, hacer: function (e) {
          var app = poner(e, el("div", "chat chat--interno"));
          var cab = poner(app, el("div", "chat__cab"));
          cab.appendChild(el("span", "chat__avatar", d.iniciales));
          var quien = poner(cab, el("div", "chat__quien"));
          quien.appendChild(el("strong", null, d.quien));
          quien.appendChild(el("span", null, d.canal));

          hilo = poner(app, el("div", "chat__hilo"));
          var p = el("p", "chat__msg chat__msg--entra");
          p.appendChild(document.createTextNode(d.pregunta));
          var meta = el("span", "chat__meta");
          meta.appendChild(el("span", null, d.hora));
          p.appendChild(meta);
          hilo.appendChild(p);
        } },

      { ms: 950, hacer: function (e) {
          rotulo(e, "Busca en los documentos de la empresa…");
          fichas = poner(e, el("div", "documentos"));
          d.documentos.forEach(function (nombre, i) {
            var doc = el("span", "documento");
            doc.appendChild(icono("M14 3v5h5M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7Z", 1.8));
            doc.appendChild(document.createTextNode(nombre));
            doc.style.animationDelay = i * 250 + "ms";
            fichas.appendChild(doc);
          });
        } },

      { ms: 1500, hacer: function () { fichas.children[0].classList.add("documento--usado"); } },

      { ms: 800, hacer: function (e) {
          rotulo(e, "Responde, y enseña de dónde lo ha sacado.");
          var r = el("p", "chat__msg chat__msg--sale");
          r.appendChild(el("span", "chat__firma", "Agente de conocimiento"));
          r.appendChild(document.createTextNode(d.respuesta));
          var meta = el("span", "chat__meta");
          meta.appendChild(el("span", null, d.hora));
          meta.appendChild(icono(VISTO, 2.2));
          r.appendChild(meta);
          hilo.appendChild(r);
          hilo.scrollTop = hilo.scrollHeight;
        } },

      { ms: 1200, hacer: function (e) {
          var f = poner(e, el("p", "sello sello--fuente"));
          f.appendChild(icono("M14 3v5h5M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7Z", 1.8));
          f.appendChild(document.createTextNode(d.fuente));
        } },

      { ms: 900, hacer: function (e) {
          poner(e, el("p", "sello sello--aviso", d.nota));
        } },
    ];
  }

  // ==================================================== 05 · VENTAS
  // El embudo del CRM, con el total de cada columna.

  function hacerVentas(d) {
    var cajas = [];
    var totales = [];
    var tarjeta;

    function ficha(info, nueva) {
      var t = el("div", "trato" + (nueva ? " es-nuevo" : ""));
      t.appendChild(el("strong", null, info[0]));
      t.appendChild(el("span", "trato__euros", info[1]));
      var pie = el("div", "trato__pie");
      pie.appendChild(el("span", "trato__quien", d.comercial));
      if (info[2]) pie.appendChild(el("span", "trato__dia", info[2]));
      t.appendChild(pie);
      return t;
    }

    function insignia(texto, avisa) {
      var vieja = tarjeta.querySelector(".insignia");
      if (vieja) tarjeta.removeChild(vieja);
      tarjeta.appendChild(el("span", "insignia" + (avisa ? " insignia--avisa" : ""), texto));
    }

    var pasos = [
      { ms: 200, hacer: function (e) {
          var embudo = poner(e, el("div", "embudo"));
          d.columnas.forEach(function (col, i) {
            var c = el("div", "embudo__col");
            var cab = el("div", "embudo__cab");
            cab.appendChild(el("p", "embudo__eti", col[0]));
            var tot = el("span", "embudo__total", col[1]);
            totales.push(tot);
            cab.appendChild(tot);
            c.appendChild(cab);
            var caja = el("div", "embudo__caja");
            (d.relleno[i] || []).forEach(function (info) {
              caja.appendChild(ficha(info));
            });
            c.appendChild(caja);
            cajas.push(caja);
            embudo.appendChild(c);
          });
          rotulo(e, d.pasos[0].rotulo);
        } },

      { ms: 800, hacer: function () {
          tarjeta = ficha(d.trato, true);
          tarjeta.classList.add("trato--foco");
          cajas[0].insertBefore(tarjeta, cajas[0].firstChild);
        } },
    ];

    d.pasos.slice(1).forEach(function (p) {
      pasos.push({ ms: 1500, hacer: function (e) {
        rotulo(e, p.rotulo);
        if (p.columna !== undefined) {
          cajas[p.columna].insertBefore(tarjeta, cajas[p.columna].firstChild);
          tarjeta.classList.remove("es-nuevo");
          void tarjeta.offsetWidth;
          tarjeta.classList.add("es-nuevo");
          if (p.columna === cajas.length - 1) tarjeta.classList.add("trato--ganado");
          if (p.totales) p.totales.forEach(function (t, i) { totales[i].textContent = t; });
        }
        if (p.insignia) insignia(p.insignia, p.avisa);
      } });
    });

    pasos.push({ ms: 1200, hacer: function (e) {
      rotulo(e, d.cierre);
      resumen(e, d.resumen);
    } });

    return pasos;
  }

  // --------------------------------------------------------- contenido

  var AGENTES = {
    atencion: {
      hacer: hacerAtencion,
      sectores: [
        {
          nombre: "Clínica dental",
          barra: "WhatsApp · domingo, 22:10",
          pie: "Reconoce la urgencia, no diagnostica y avisa a una persona.",
          datos: {
            negocio: "Clínica Dental Russafa", iniciales: "CR", canal: "WhatsApp Business",
            dia: "DOMINGO", cierre: "El lunes la doctora ya sabe lo que le espera.",
            mensajes: [
              { de: "ellos", hora: "22:10", texto: "Se me ha partido un trozo de muela y me duele bastante." },
              { de: "bot", hora: "22:10", firma: "Asistente · respuesta automática", texto: "Siento oír eso. Esto tiene que verlo la doctora: no se lo puedo valorar yo." },
              { de: "bot", hora: "22:11", texto: "Dejo aviso en el teléfono de guardia y le guardo el primer hueco de mañana, a las 09:30." },
              { de: "ellos", hora: "22:12", texto: "Gracias, a las 9:30 me va bien." },
            ],
            fichas: [["Aviso enviado", "Teléfono de guardia"], ["En la agenda", "Lun 09:30 · urgencia"]],
          },
        },
        {
          nombre: "Taller",
          barra: "WhatsApp · sábado, 21:46",
          pie: "Fuera de horario, con la tarifa delante y la agenda abierta.",
          datos: {
            negocio: "Taller Benimaclet", iniciales: "TB", canal: "WhatsApp Business",
            dia: "SÁBADO", cierre: "Y el lunes ya está todo puesto.",
            mensajes: [
              { de: "ellos", hora: "21:46", texto: "Buenas, ¿hacéis la ITV? Tengo que pasarla antes del día 15." },
              { de: "bot", hora: "21:46", firma: "Asistente · respuesta automática", texto: "Sí, la llevamos nosotros: 45 € con la gestión y el traslado incluidos. ¿Me dice matrícula y modelo?" },
              { de: "ellos", hora: "21:48", texto: "1234 LMN, un León de 2017." },
              { de: "bot", hora: "21:48", texto: "Tengo martes a las 10:00 o miércoles a las 16:30." },
              { de: "ellos", hora: "21:49", texto: "El martes." },
              { de: "bot", hora: "21:49", texto: "Reservado: martes a las 10:00. Traiga ficha técnica y permiso. El lunes le recuerdo." },
            ],
            fichas: [["En la agenda", "Mar 10:00 · ITV"], ["En el CRM", "1234 LMN · León 2017"]],
          },
        },
        {
          nombre: "Academia",
          barra: "Chat de la web · jueves, 20:05",
          pie: "Precio, horario y plazas libres sin que nadie esté delante.",
          datos: {
            negocio: "Academia Blasco", iniciales: "AB", canal: "Chat de la web",
            dia: "JUEVES", cierre: "Plaza guardada y matrícula en marcha.",
            mensajes: [
              { de: "ellos", hora: "20:05", texto: "¿Cuánto vale el curso de inglés B2 y cuándo empieza?" },
              { de: "bot", hora: "20:05", firma: "Asistente · respuesta automática", texto: "320 € el trimestre. Martes y jueves de 18:00 a 19:30, empieza el 12 de enero y quedan 4 plazas." },
              { de: "ellos", hora: "20:07", texto: "¿Puedo reservar una?" },
              { de: "bot", hora: "20:07", texto: "Sí, se la guardo 72 horas. ¿Me dice su nombre y un teléfono de contacto?" },
              { de: "ellos", hora: "20:08", texto: "Marta Server, el mismo de este chat." },
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
            semana: "9 – 13 de noviembre",
            desde: 9,
            dias: [["LUN", "9"], ["MAR", "10"], ["MIÉ", "11"], ["JUE", "12"], ["VIE", "13"]],
            tipos: ["Sesión 45 min", "Primera visita", "Bono"],
            // [día, minuto desde la primera franja, duración, quién, tipo]
            citas: [
              [0, 0, 45, "Ana G.", 0], [0, 75, 45, "Luis P.", 0], [0, 210, 30, "Marta R.", 2],
              [1, 0, 60, "Nuria V.", 1], [1, 120, 45, "Joan M.", 0], [1, 255, 45, "Pere S.", 0],
              [2, 30, 45, "Ana G.", 0], [2, 165, 45, "Rosa T.", 0],
              [3, 0, 45, "Pau E.", 0], [3, 120, 45, "Ana G.", 0], [3, 270, 30, "Eli C.", 2],
              [4, 60, 45, "Clara B.", 0], [4, 180, 60, "Jordi L.", 1],
            ],
            anula: [3, 120, 45, "", 0],
            cubre: [[3, 120, 45, "Nuria V.", 0, "De la lista de espera"]],
            rotulos: [
              "Semana cerrada: trece sesiones puestas.",
              "Jueves, 09:10 · Ana anula su sesión de las 11:00.",
              "El agente ofrece el hueco a quien estaba en espera.",
              "Cubierto en nueve minutos y descontada la sesión del bono.",
            ],
            resumen: [["9 min", "en cubrirse"], ["0", "llamadas"], ["13", "sesiones firmes"]],
          },
        },
        {
          nombre: "Peluquería",
          barra: "Agenda · jueves",
          pie: "Cada servicio ocupa lo que dura, no una hora por defecto.",
          datos: {
            semana: "9 – 13 de noviembre",
            desde: 10,
            dias: [["LUN", "9"], ["MAR", "10"], ["MIÉ", "11"], ["JUE", "12"], ["VIE", "13"]],
            tipos: ["Corte 30 min", "Color 90 min", "Peinado 45 min"],
            citas: [
              [0, 0, 30, "Marta", 0], [0, 60, 90, "Pilar", 1], [0, 225, 30, "Luz", 0],
              [1, 30, 45, "Inés", 2], [1, 135, 30, "Sara", 0], [1, 225, 30, "Vega", 0],
              [2, 0, 90, "Rosa", 1], [2, 150, 30, "Ana", 0], [2, 210, 45, "Nuria", 2],
              [3, 30, 30, "Eva", 0], [3, 120, 90, "Carmen", 1], [3, 255, 30, "Pepa", 0],
              [4, 0, 30, "Lola", 0], [4, 90, 90, "Gema", 1],
            ],
            anula: [3, 120, 90, "", 1],
            cubre: [
              [3, 120, 30, "Rocío", 0, "Lista de espera"],
              [3, 165, 30, "Berta", 0, "Lista de espera"],
            ],
            rotulos: [
              "Jueves lleno: catorce servicios entre cortes y colores.",
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
            semana: "9 – 13 de noviembre",
            desde: 8,
            dias: [["LUN", "9"], ["MAR", "10"], ["MIÉ", "11"], ["JUE", "12"], ["VIE", "13"]],
            tipos: ["Mecánica · foso 1", "ITV y gestión", "Chapa · foso 2"],
            citas: [
              [0, 0, 120, "4521 KLM", 0], [0, 150, 60, "1234 LMN", 1], [0, 240, 90, "7788 BCD", 2],
              [1, 0, 60, "9012 GHT", 1], [1, 210, 90, "3344 PLM", 2],
              [2, 30, 120, "5566 TRV", 0], [2, 195, 60, "8899 QWE", 1],
              [3, 0, 90, "2233 ASD", 2], [3, 150, 120, "6677 ZXC", 0],
              [4, 30, 60, "4455 NBV", 1], [4, 150, 120, "1122 MNB", 0],
            ],
            anula: [1, 75, 120, "", 0],
            cubre: [[1, 75, 120, "9988 RTY", 0, "Distribución · foso 2"]],
            rotulos: [
              "Dos fosos y once entradas repartidas.",
              "Martes · entra una distribución de cuatro horas.",
              "El agente mira capacidad de foso, no solo hora libre.",
              "Encajada en el foso 2 sin mover nada de lo demás.",
            ],
            resumen: [["2", "fosos"], ["12", "entradas"], ["0", "solapes"]],
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
            bandeja: "Facturas de proveedor", posicion: "12 de 40",
            emisor: "Suministros Bénager, S.L.", documento: "FACTURA F-2026/0418",
            lineas: [
              ["Filtro de aceite · 12 ud.", "148,80 €"],
              ["Pastillas de freno · 6 ud.", "414,00 €"],
              ["Aceite 5W30 · 40 l", "677,20 €"],
            ],
            totalEtiqueta: "Total con IVA", total: "1.500,40 €",
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
            sello: { tipo: "bien", texto: "Cuadra con el pedido 2026/0418 · registrada" },
            resumen: [["40", "recibidas"], ["35", "registradas"], ["5", "apartadas", true]],
            motivos: "3 · el IVA no coincide   ·   2 · proveedor nuevo",
          },
        },
        {
          nombre: "Albaranes",
          barra: "Reparto del día · martes",
          pie: "Cruza lo pedido con lo recibido y deja la reclamación escrita.",
          datos: {
            bandeja: "Albaranes del reparto", posicion: "8 de 22",
            emisor: "Frutas del Turia, S.L.", documento: "ALBARÁN A-7714",
            lineas: [
              ["Naranja navelina · cajas", "18 / 20"],
              ["Limón fino · cajas", "12 / 12"],
              ["Mandarina clemenules · cajas", "7 / 8"],
            ],
            totalEtiqueta: "Bultos", total: "37 / 40",
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
            bandeja: "Notificaciones electrónicas", posicion: "4 de 18",
            emisor: "Agencia Tributaria", documento: "REQUERIMIENTO DE IVA",
            lineas: [
              ["Obligado", "Martínez Soler, M."],
              ["Modelo", "303 · 3T 2026"],
              ["Puesta a disposición", "28/10/2026"],
            ],
            totalEtiqueta: "Plazo máximo", total: "11/11/2026",
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
            quien: "Agente de conocimiento", iniciales: "AC", canal: "Chat interno del despacho",
            hora: "10:24",
            pregunta: "¿Qué cobramos por un cambio de titularidad de un coche importado?",
            documentos: ["Tarifa 2026", "Manual de trámites", "Criterios internos"],
            respuesta: "180 € + IVA de honorarios. Las tasas de la DGT y el impuesto de transmisiones van aparte y los paga el cliente.",
            fuente: "Tarifa 2026 · apartado 4.2",
            nota: "Documento revisado hace dos meses.",
          },
        },
        {
          nombre: "Taller",
          barra: "Consulta de recepción · jueves",
          pie: "Lo que cubre la marca y lo que no, sin abrir el manual entero.",
          datos: {
            quien: "Agente de conocimiento", iniciales: "AC", canal: "Chat interno del taller",
            hora: "12:05",
            pregunta: "¿La garantía cubre el embrague de un coche de tres años?",
            documentos: ["Condiciones de marca", "Historial del vehículo", "Manual de garantías"],
            respuesta: "No. A partir del segundo año el embrague queda fuera por desgaste. Se presupuesta como reparación normal.",
            fuente: "Condiciones de marca · página 12",
            nota: "Las condiciones cambiaron en enero: esta es la versión vigente.",
          },
        },
        {
          nombre: "Comercio",
          barra: "Consulta de tienda · sábado",
          pie: "La misma respuesta en todo el mostrador, venga quien venga.",
          datos: {
            quien: "Agente de conocimiento", iniciales: "AC", canal: "Chat interno de tienda",
            hora: "17:41",
            pregunta: "Compró por la web y quiere devolverlo aquí en tienda. ¿Se puede?",
            documentos: ["Política de devoluciones", "Condiciones de la web", "Circular de tienda"],
            respuesta: "Sí. En compra por internet hay 30 días y se admite la entrega en tienda. En compra presencial son 15 días y hace falta el tique.",
            fuente: "Política de devoluciones · apartado 3",
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
          barra: "Embudo de ventas · noviembre",
          pie: "Ningún presupuesto se queda sin segunda llamada.",
          datos: {
            comercial: "FO",
            columnas: [["Nueva", "6.900 €"], ["Presupuesto enviado", "18.300 €"], ["Ganada", "9.100 €"]],
            relleno: [
              [["Aire en oficina", "2.700 €", "6 nov"]],
              [["Caldera comunidad", "7.400 €", "4 nov"], ["Suelo radiante", "6.700 €", "9 nov"]],
              [["Mantenimiento hotel", "9.100 €", ""]],
            ],
            trato: ["Instalación de clima", "4.200 €", "Hoy"],
            pasos: [
              { rotulo: "Día 1 · entra una solicitud por la web." },
              { rotulo: "Día 2 · se envía el presupuesto.", columna: 1, insignia: "Seguimiento el día 5" },
              { rotulo: "Día 5 · sin respuesta. El recordatorio queda redactado.", insignia: "Recordatorio listo para enviar", avisa: true },
              { rotulo: "Día 16 · el cliente acepta.", columna: 2, insignia: "Ganada",
                totales: ["2.700 €", "14.100 €", "13.300 €"] },
            ],
            cierre: "Y cada lunes, la foto de la cartera.",
            resumen: [["7", "abiertas"], ["3", "paradas +15 días"], ["1", "caduca el jueves", true]],
          },
        },
        {
          nombre: "Contratos anuales",
          barra: "Renovaciones · cuarto trimestre",
          pie: "Avisa con margen, no el día antes de que se renueve solo.",
          datos: {
            comercial: "FO",
            columnas: [["En vigor", "32.400 €"], ["Aviso de renovación", "5.200 €"], ["Renovado", "11.600 €"]],
            relleno: [
              [["Soporte informático", "2.400 €", "ene"]],
              [["Limpieza oficinas", "5.200 €", "dic"]],
              [["Alarma y vigilancia", "11.600 €", ""]],
            ],
            trato: ["Mantenimiento anual", "1.800 €", "ene"],
            pasos: [
              { rotulo: "El contrato vence dentro de sesenta días." },
              { rotulo: "Quedan 60 días · todavía se puede negociar.", columna: 1, insignia: "Preparar propuesta" },
              { rotulo: "Quedan 45 días · la revisión de tarifa va calculada.", insignia: "Propuesta lista para enviar", avisa: true },
              { rotulo: "Quedan 30 días · firmado otro año.", columna: 2, insignia: "Renovado",
                totales: ["30.600 €", "5.200 €", "13.400 €"] },
            ],
            cierre: "Ninguna renovación se da por hecha.",
            resumen: [["12", "contratos"], ["4", "vencen este trimestre"], ["1", "sin avisar", true]],
          },
        },
        {
          nombre: "Mayorista",
          barra: "Clientes por recuperar",
          pie: "Detecta al cliente que deja de pedir antes de perderlo del todo.",
          datos: {
            comercial: "FO",
            columnas: [["Compra cada mes", "48.200 €"], ["Seis meses sin pedir", "7.440 €"], ["Recuperado", "3.100 €"]],
            relleno: [
              [["Bar La Pérgola", "410 €/mes", "4 nov"]],
              [["Cafetería Central", "380 €/mes", "abr"], ["Horno Castellar", "290 €/mes", "mar"]],
              [["Mesón del Carmen", "520 €/mes", ""]],
            ],
            trato: ["Hostelería Ruzafa", "620 €/mes", "abr"],
            pasos: [
              { rotulo: "El agente compara con lo que este cliente compraba antes." },
              { rotulo: "Seis meses sin pedido, y antes pedía todos los meses.", columna: 1, insignia: "Avisar al comercial" },
              { rotulo: "Prepara el histórico y lo que solía llevar.", insignia: "Ficha de visita lista", avisa: true },
              { rotulo: "Vuelve a pedir.", columna: 2, insignia: "Recuperado",
                totales: ["48.820 €", "6.820 €", "3.720 €"] },
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

    var tiras = el("div", "demo__sectores");
    tiras.setAttribute("role", "tablist");
    tiras.setAttribute("aria-label", "Elija el sector de la demostración");
    var botones = agente.sectores.map(function (sector, i) {
      var b = el("button", "demo__sector", sector.nombre);
      b.type = "button";
      b.setAttribute("role", "tab");
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
        bloque.classList.add("ya-reproducida");
        boton.textContent = "Repetir";
      }, t + 600));
    }

    pintarPestanas();

    boton.addEventListener("click", function () {
      if (corriendo) return;
      reproducir();
    });

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
    Array.prototype.forEach.call(bloques, function (bloque) {
      var boton = bloque.querySelector(".demo__boton");
      if (boton) boton.hidden = true;
    });
    return;
  }

  Array.prototype.forEach.call(bloques, preparar);
})();
