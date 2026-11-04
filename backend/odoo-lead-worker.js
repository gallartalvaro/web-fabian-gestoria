/**
 * ============================================================
 * Valentramites — Receptor de contactos del test de ayudas
 * ------------------------------------------------------------
 * Recibe el perfil que envía la web, lo valida y crea una
 * oportunidad (crm.lead) en Odoo con el diagnóstico completo.
 * Si el visitante ya existe como contacto, la oportunidad se
 * engancha a su ficha en lugar de duplicarla.
 *
 * Todo lo que el visitante respondió llega por partida doble:
 * como texto legible en la descripción, y como campos y
 * etiquetas con los que se puede filtrar y agrupar el embudo.
 *
 * Se despliega como Cloudflare Worker. Vive FUERA de Odoo: la
 * clave de API nunca llega al navegador, y no cuenta como
 * "Custom Code Maintenance" porque no es código alojado en la
 * instancia (ver regla 1 de CLAUDE.md).
 *
 * Variables de entorno (secretos de Worker):
 *   ODOO_URL      https://fabian-okue-kung-mangue.odoo.com
 *   ODOO_DB       fabian-okue-kung-mangue
 *   ODOO_USER     fabian.kung@coev.com
 *   ODOO_API_KEY  (clave de API, nunca la contraseña)
 *   ORIGENES      https://valentramites.com,https://gallartalvaro.github.io
 * ============================================================
 */

const LIMITE_BYTES = 64 * 1024;

export default {
  async fetch(request, env) {
    const origen = request.headers.get("Origin") || "";
    const permitidos = (env.ORIGENES || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const admitido = permitidos.includes(origen) ? origen : permitidos[0] || "";

    const cors = {
      "Access-Control-Allow-Origin": admitido,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Método no permitido" }, 405, cors);
    if (origen && !permitidos.includes(origen)) return json({ error: "Origen no permitido" }, 403, cors);

    let perfil;
    try {
      const cuerpo = await request.text();
      if (cuerpo.length > LIMITE_BYTES) return json({ error: "Envío demasiado grande" }, 413, cors);
      perfil = JSON.parse(cuerpo);
    } catch (err) {
      return json({ error: "JSON no válido" }, 400, cors);
    }

    // --- Robots: el campo trampa siempre debe llegar vacío ---
    // Se responde 200 a propósito: así el robot no aprende nada.
    if (perfil.apellido2) return json({ ok: true }, 200, cors);

    const fallo = validar(perfil);
    if (fallo) return json({ error: fallo }, 422, cors);

    try {
      if (perfil.tipo === "solicitud-llamada") {
        const id = await crearSolicitudLlamada(perfil, env);
        return json({ ok: true, referencia: "LLA-" + id }, 200, cors);
      }
      if (perfil.tipo === "consulta-web") {
        const id = await crearConsulta(perfil, env);
        return json({ ok: true, referencia: "CON-" + id }, 200, cors);
      }
      if (perfil.tipo === "aviso-subvenciones") {
        const id = await crearSuscripcion(perfil, env);
        return json({ ok: true, referencia: "AVI-" + id }, 200, cors);
      }
      const id = await crearOportunidad(perfil, env);
      return json({ ok: true, referencia: "SUB-" + id }, 200, cors);
    } catch (err) {
      // El mensaje interno no se expone: la web tiene su propio
      // camino alternativo (WhatsApp / correo) para no perder el contacto.
      console.error("Odoo:", err && err.message);
      return json({ error: "No se ha podido registrar la solicitud" }, 502, cors);
    }
  },
};

// ------------------------------------------------------------
// Validación
// ------------------------------------------------------------
function validar(p) {
  if (!p || p.version !== 2) return "Formato de perfil no reconocido";

  // El alta en el aviso de convocatorias no es una solicitud de
  // contacto: solo pide lo justo para poder escribir y para acertar
  // con lo que se envía. Exigir aquí nombre y teléfono, como en el
  // resto de envíos, hundiría las altas: nadie da el teléfono a cambio
  // de que le avisen de una ayuda.
  if (p.tipo === "aviso-subvenciones") {
    const s = p.suscripcion || {};
    if (!texto(s.email)) return "Falta el correo";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) return "El email no es válido";
    if (!texto(s.actividad)) return "Falta la actividad";
    if (!ACTIVIDADES.includes(s.actividad.trim())) return "Actividad no reconocida";
    if (texto(s.provincia) && !PROVINCIAS.includes(s.provincia.trim()))
      return "Provincia no reconocida";
    // Un nombre desmesurado no aporta nada y sí puede ensuciar la agenda.
    if (texto(s.nombre) && s.nombre.trim().length > 120) return "El nombre es demasiado largo";
    if (!p.consentimiento || p.consentimiento.aceptado !== true) return "Falta el consentimiento";
    return null;
  }

  if (!p.contacto || !texto(p.contacto.nombre)) return "Falta el nombre";
  if (!texto(p.contacto.telefono)) return "Falta el teléfono";
  if (!p.consentimiento || p.consentimiento.aceptado !== true) return "Falta el consentimiento";
  if (String(p.contacto.telefono).replace(/\D/g, "").length < 9) return "El teléfono no es válido";
  if (p.contacto.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.contacto.email))
    return "El email no es válido";
  if (p.tipo === "solicitud-llamada") return null;
  // La consulta escrita de la portada: lo que la hace útil es el texto,
  // así que sin él no se registra.
  if (p.tipo === "consulta-web") {
    if (!p.solicitud || !texto(p.solicitud.mensaje)) return "Falta el mensaje";
    return null;
  }
  if (!p.convocatoria || !texto(p.convocatoria.titulo)) return "Falta la convocatoria";
  return null;
}

// Listas cerradas del alta en el aviso.
//
// El formulario ya solo ofrece estos valores, pero eso no basta: la
// cabecera Origin se falsifica desde cualquier cliente que no sea un
// navegador, así que sin comprobarlo aquí cualquiera podría llenar la
// agenda del despacho de etiquetas inventadas, y esas etiquetas son
// justo lo que decide a quién se le envía cada convocatoria.
//
// DEBEN COINCIDIR con los <option> de public/index.html. Hay una
// prueba que lo comprueba (backend/test-worker.mjs) para que no se
// separen con el tiempo.
const ACTIVIDADES = [
  "Comercio minorista",
  "Hostelería y alimentación",
  "Construcción y reformas",
  "Industria y taller",
  "Transporte y logística",
  "Servicios profesionales",
  "Salud y bienestar",
  "Agricultura y ganadería",
  "Otra actividad",
];
const PROVINCIAS = ["Valencia", "Alicante", "Castellón", "Madrid", "Otra"];

const texto = (v) => typeof v === "string" && v.trim().length > 0;

// ------------------------------------------------------------
// Alta en Odoo
// ------------------------------------------------------------
const RESULTADOS = {
  apto: "cumple los requisitos",
  revisar: "con puntos a comprobar",
  "no-apto": "no encaja · avisar de otras ayudas",
};

async function crearOportunidad(p, env) {
  const uid = await autenticar(env);
  const contacto = p.contacto;
  const conv = p.convocatoria;
  const diag = p.diagnostico || {};
  const seg = p.seguimiento || {};
  const org = seg.origen || {};

  // Si ya es cliente del despacho, la oportunidad se engancha a su ficha.
  const partnerId = await buscarContacto(env, uid, contacto);

  // Etiquetas: la convocatoria y los rasgos del cliente que dedujo el
  // test. Son el criterio con el que después se filtra el embudo.
  const etiquetas = await idsDe(env, uid, "crm.tag", [
    "Web · Subvenciones",
    conv.nombreCorto || conv.titulo,
    ...(Array.isArray(diag.etiquetas) ? diag.etiquetas : []),
  ]);

  const corto = conv.nombreCorto || conv.titulo;
  const importe = diag.importeEstimado ? " · " + diag.importeEstimado : "";

  const valores = {
    name: corto + " · " + (RESULTADOS[diag.resultado] || "consulta") + importe,
    type: "opportunity",
    contact_name: contacto.nombre,
    phone: contacto.telefono,
    priority: { alta: "3", media: "2", baja: "1" }[seg.prioridad] || "1",
    description: descripcion(p),
  };

  if (contacto.email) valores.email_from = contacto.email;
  if (partnerId) valores.partner_id = partnerId;
  if (etiquetas.length) valores.tag_ids = [[6, 0, etiquetas]];

  // Procedencia en los campos propios de Odoo, para que estas
  // oportunidades salgan en los informes de origen y campaña del CRM.
  const fuente = await unId(env, uid, "utm.source", org.canal || "Web Valentramites");
  if (fuente) valores.source_id = fuente;
  if (org.medio) {
    const medio = await unId(env, uid, "utm.medium", org.medio);
    if (medio) valores.medium_id = medio;
  }
  if (org.campana) {
    const campana = await unId(env, uid, "utm.campaign", org.campana);
    if (campana) valores.campaign_id = campana;
  }

  // El cierre de la convocatoria marca la fecha límite en el
  // pipeline: en el kanban se ve solo lo que corre prisa.
  if (/^\d{4}-\d{2}-\d{2}$/.test(conv.cierraEl || "")) valores.date_deadline = conv.cierraEl;

  return llamar(env, uid, "crm.lead", "create", [valores]);
}

// ------------------------------------------------------------
// Consulta escrita del formulario de la portada: trae área y un
// mensaje redactado por la persona, que es lo que de verdad hay que
// leer. Prioridad alta, pero no máxima: quien escribe un mensaje
// acepta esperar algo más que quien pide expresamente una llamada.
// ------------------------------------------------------------
async function crearConsulta(p, env) {
  const uid = await autenticar(env);
  const contacto = p.contacto;
  const sol = p.solicitud || {};
  const area = texto(sol.area) ? sol.area : "Consulta general";
  const seg = p.seguimiento || {};
  const org = seg.origen || {};

  const partnerId = await buscarContacto(env, uid, contacto);
  const etiquetas = await idsDe(env, uid, "crm.tag", ["Web · Consulta", area]);

  const valores = {
    name: "Consulta · " + area,
    type: "opportunity",
    contact_name: contacto.nombre,
    phone: contacto.telefono,
    priority: "2",
    description:
      tabla("Consulta desde la web", [
        ["Área", area],
        ["Teléfono", contacto.telefono],
        ["Email", contacto.email],
        ["Página", seg.pagina],
        ["Fecha", seg.fecha],
      ]) +
      "<h3>Lo que nos cuenta</h3><p>" +
      esc(sol.mensaje).replace(/\r?\n/g, "<br>") +
      "</p>" +
      "<p><i>Consentimiento aceptado el " +
      esc((p.consentimiento || {}).fecha || "") +
      ". " +
      esc((p.consentimiento || {}).texto || "") +
      "</i></p>",
    // Un día para contestar por escrito.
    date_deadline: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  };
  if (contacto.email) valores.email_from = contacto.email;
  if (partnerId) valores.partner_id = partnerId;
  if (etiquetas.length) valores.tag_ids = [[6, 0, etiquetas]];

  const fuente = await unId(env, uid, "utm.source", org.canal || "Web Valentramites");
  if (fuente) valores.source_id = fuente;
  if (org.campana) {
    const campana = await unId(env, uid, "utm.campaign", org.campana);
    if (campana) valores.campaign_id = campana;
  }

  return llamar(env, uid, "crm.lead", "create", [valores]);
}

// ------------------------------------------------------------
// «Que me llamen»: alguien ha dejado nombre y teléfono desde el
// panel de contacto, sin pasar por un test. Se registra como
// oportunidad con prioridad alta: es una petición expresa de
// llamada y conviene atenderla el mismo día.
// ------------------------------------------------------------
async function crearSolicitudLlamada(p, env) {
  const uid = await autenticar(env);
  const contacto = p.contacto;
  const contexto = (p.solicitud && p.solicitud.contexto) || "Consulta general";
  const seg = p.seguimiento || {};
  const org = seg.origen || {};

  const partnerId = await buscarContacto(env, uid, contacto);
  const etiquetas = await idsDe(env, uid, "crm.tag", ["Web · Que me llamen", contexto]);

  const valores = {
    name: "Llamar · " + contexto,
    type: "opportunity",
    contact_name: contacto.nombre,
    phone: contacto.telefono,
    priority: "3",
    description:
      tabla("Solicitud de llamada", [
        ["Sobre", contexto],
        ["Teléfono", contacto.telefono],
        ["Cuándo prefiere", contacto.momentoPreferido],
        ["Página", seg.pagina],
        ["Fecha", seg.fecha],
      ]) +
      "<p><i>Consentimiento aceptado el " +
      esc((p.consentimiento || {}).fecha || "") +
      ". " +
      esc((p.consentimiento || {}).texto || "") +
      "</i></p>",
    // Plazo para devolver la llamada: hoy mismo.
    date_deadline: new Date().toISOString().slice(0, 10),
  };
  if (partnerId) valores.partner_id = partnerId;
  if (etiquetas.length) valores.tag_ids = [[6, 0, etiquetas]];

  const fuente = await unId(env, uid, "utm.source", org.canal || "Web Valentramites");
  if (fuente) valores.source_id = fuente;
  if (org.campana) {
    const campana = await unId(env, uid, "utm.campaign", org.campana);
    if (campana) valores.campaign_id = campana;
  }

  return llamar(env, uid, "crm.lead", "create", [valores]);
}

// ------------------------------------------------------------
// Alta en el aviso de convocatorias.
//
// No crea oportunidad: quien pide que le avisen de ayudas no es
// todavía una oportunidad, y meterlo en el embudo lo ensucia. Lo que
// crea es un CONTACTO etiquetado, que es lo que luego se filtra para
// enviar el aviso desde Odoo.
// ------------------------------------------------------------
const ETIQUETA_AVISO = "Aviso de subvenciones";

async function crearSuscripcion(p, env) {
  const uid = await autenticar(env);
  const sus = p.suscripcion;
  const email = sus.email.trim();

  // Las etiquetas son la lista: "Aviso de subvenciones" marca a quién
  // hay que escribir, y la actividad y la provincia deciden a quién le
  // encaja cada convocatoria. Un aviso que no le sirve a nadie deja de
  // abrirse a la tercera.
  const etiquetas = await idsDe(env, uid, "res.partner.category", [
    ETIQUETA_AVISO,
    sus.actividad,
    sus.provincia,
  ]);
  // [4, id] ENLAZA sin tocar las etiquetas que el contacto ya tuviera.
  // Con [6, 0, ids] se borrarían, y muchos suscriptores van a ser
  // clientes del despacho con su ficha ya montada.
  const enlaces = etiquetas.map((id) => [4, id]);

  const existentes = await llamar(env, uid, "res.partner", "search", [
    [["email", "=ilike", email]],
  ], { limit: 1 });

  if (existentes.length) {
    const id = existentes[0];
    if (enlaces.length) {
      await llamar(env, uid, "res.partner", "write", [[id], { category_id: enlaces }]);
    }
    // En una ficha que ya existe no se pisa el campo de notas: la
    // constancia del consentimiento va al historial.
    try {
      await llamar(env, uid, "res.partner", "message_post", [[id]], { body: notaDeAlta(p) });
    } catch (err) {
      // Si la instancia no admite message_post, el alta no se pierde
      // por eso: la etiqueta, que es lo que arma la lista, ya está.
      console.error("message_post:", err && err.message);
    }
    await apuntarEnLaLista(env, uid, p);
    return id;
  }

  const valores = {
    name: texto(sus.nombre) ? sus.nombre.trim() : email,
    email,
    comment: notaDeAlta(p),
  };
  if (enlaces.length) valores.category_id = enlaces;
  const id = await llamar(env, uid, "res.partner", "create", [valores]);
  await apuntarEnLaLista(env, uid, p);
  return id;
}

// Apunta el correo en la lista de *Marketing por correo electrónico*.
// Es lo que convierte el envío en un clic y, sobre todo, lo que hace
// que cada aviso lleve su enlace de baja: eso se promete en el
// formulario y en la política de privacidad, así que tiene que salir
// solo y no depender de que alguien se acuerde de ponerlo.
//
// mailing.contact.tag_ids apunta al mismo modelo de etiquetas que
// res.partner (res.partner.category), de modo que la actividad y la
// provincia sirven para filtrar el envío sin duplicar nada.
//
// Si el módulo no estuviera instalado, el alta NO se pierde: el
// contacto etiquetado ya está creado y se puede importar a mano.
const LISTA_AVISO = "Aviso de subvenciones";

async function apuntarEnLaLista(env, uid, p) {
  const sus = p.suscripcion;
  const email = sus.email.trim();
  try {
    const lista = await unId(env, uid, "mailing.list", LISTA_AVISO);
    if (!lista) return null;

    const etiquetas = await idsDe(env, uid, "res.partner.category", [
      sus.actividad,
      sus.provincia,
    ]);
    const valores = { list_ids: [[4, lista]] };
    if (etiquetas.length) valores.tag_ids = etiquetas.map((id) => [4, id]);

    const existentes = await llamar(env, uid, "mailing.contact", "search", [
      [["email", "=ilike", email]],
    ], { limit: 1 });

    if (existentes.length) {
      await llamar(env, uid, "mailing.contact", "write", [[existentes[0]], valores]);
      return existentes[0];
    }

    valores.email = email;
    valores.name = texto(sus.nombre) ? sus.nombre.trim() : email;
    return llamar(env, uid, "mailing.contact", "create", [valores]);
  } catch (err) {
    // Que falte el módulo no puede tumbar un alta que el visitante ya
    // ha dado por hecha.
    console.error("mailing.contact:", err && err.message);
    return null;
  }
}

// Deja por escrito qué aceptó, cuándo y desde dónde. Es lo que hay
// que poder enseñar si alguien pregunta por qué recibe el aviso.
function notaDeAlta(p) {
  const sus = p.suscripcion;
  const seg = p.seguimiento || {};
  const org = seg.origen || {};
  const cons = p.consentimiento || {};

  const filas = [
    ["Alta en", "Aviso de convocatorias"],
    ["Actividad", sus.actividad],
    ["Provincia", sus.provincia],
    ["Página", seg.pagina],
  ];
  if (org.campana) filas.push(["Campaña", org.campana]);
  if (org.canal) filas.push(["Canal", org.canal + (org.medio ? " / " + org.medio : "")]);
  if (org.procedencia) filas.push(["Llegó desde", org.procedencia]);

  return (
    tabla(ETIQUETA_AVISO, filas) +
    "<p><i>Consentimiento aceptado el " +
    esc(cons.fecha || "") +
    ". " +
    esc(cons.texto || "") +
    "</i></p>"
  );
}

async function buscarContacto(env, uid, contacto) {
  const criterios = [];
  if (contacto.email) criterios.push(["email", "=ilike", contacto.email]);
  const telefono = contacto.telefono.replace(/[\s.\-()]/g, "");
  if (telefono.length >= 9) criterios.push(["phone", "like", telefono.slice(-9)]);
  if (!criterios.length) return null;

  const dominio = criterios.length > 1 ? ["|", ...criterios] : criterios;
  const encontrados = await llamar(env, uid, "res.partner", "search", [dominio], { limit: 1 });
  return encontrados.length ? encontrados[0] : null;
}

// Busca un registro por nombre y lo crea si no existe. Sirve para
// etiquetas, orígenes, medios y campañas: todos tienen campo "name".
async function unId(env, uid, modelo, nombre) {
  if (!texto(nombre)) return null;
  const limpio = nombre.trim().slice(0, 60);
  const existentes = await llamar(env, uid, modelo, "search", [[["name", "=", limpio]]], { limit: 1 });
  if (existentes.length) return existentes[0];
  return llamar(env, uid, modelo, "create", [{ name: limpio }]);
}

async function idsDe(env, uid, modelo, nombres) {
  const vistos = new Set();
  const ids = [];
  for (const nombre of nombres) {
    if (!texto(nombre) || vistos.has(nombre)) continue;
    vistos.add(nombre);
    const id = await unId(env, uid, modelo, nombre);
    if (id) ids.push(id);
  }
  return ids;
}

// ------------------------------------------------------------
// El diagnóstico completo, para no volver a preguntar nada.
// Arriba una ficha de un vistazo; debajo, el detalle.
// ------------------------------------------------------------
function descripcion(p) {
  const c = p.contacto;
  const conv = p.convocatoria;
  const d = p.diagnostico || {};
  const s = p.seguimiento || {};
  const o = s.origen || {};
  const partes = [];

  partes.push(
    tabla("Resumen", [
      ["Convocatoria", conv.titulo],
      ["Organismo", conv.organismo],
      ["Resultado del test", RESULTADOS[d.resultado] || d.resultado],
      ["Importe estimado", d.importeEstimado || "—"],
      ["Cierre del plazo", conv.cierraEl],
      [
        "Días que quedaban",
        conv.diasRestantes === null || conv.diasRestantes === undefined
          ? "—"
          : String(conv.diasRestantes),
      ],
      ["Prioridad de seguimiento", s.prioridad],
    ])
  );

  partes.push(
    tabla("Contacto", [
      ["Teléfono", c.telefono],
      ["Email", c.email || "no indicado"],
      ["Prefiere que le llamen", c.momentoPreferido],
    ])
  );

  const respuestas = d.respuestas || {};
  partes.push(
    tabla(
      "Lo que respondió",
      Object.keys(respuestas).map((k) => [k, respuestas[k]])
    )
  );

  partes.push(lista("Puntos a resolver antes de solicitar", d.puntosARevisar));
  partes.push(lista("Motivos de exclusión detectados", d.motivosDeExclusion));

  const procedencia = [["Página", s.pagina]];
  if (o.campana) procedencia.push(["Campaña", o.campana]);
  if (o.canal) procedencia.push(["Canal", o.canal + (o.medio ? " / " + o.medio : "")]);
  if (o.procedencia) procedencia.push(["Llegó desde", o.procedencia]);
  procedencia.push(["Fecha del test", s.fecha]);
  partes.push(tabla("Procedencia", procedencia));

  partes.push(
    "<p><i>Consentimiento aceptado el " +
      esc((p.consentimiento || {}).fecha || "") +
      ". " +
      esc((p.consentimiento || {}).texto || "") +
      "</i></p>"
  );

  return partes.join("");
}

function tabla(titulo, filas) {
  const utiles = (filas || []).filter(
    (f) => f && f[1] !== undefined && f[1] !== null && f[1] !== ""
  );
  if (!utiles.length) return "";
  return (
    "<h3>" +
    esc(titulo) +
    "</h3><table><tbody>" +
    utiles
      .map((f) => "<tr><td><b>" + esc(f[0]) + "</b></td><td>" + esc(f[1]) + "</td></tr>")
      .join("") +
    "</tbody></table>"
  );
}

function lista(titulo, items) {
  if (!items || !items.length) return "";
  return (
    "<h3>" + esc(titulo) + "</h3><ul>" + items.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>"
  );
}

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ------------------------------------------------------------
// JSON-RPC de Odoo
// ------------------------------------------------------------
async function autenticar(env) {
  const uid = await rpc(env, "common", "authenticate", [
    env.ODOO_DB,
    env.ODOO_USER,
    env.ODOO_API_KEY,
    {},
  ]);
  if (!uid) throw new Error("Autenticación rechazada por Odoo");
  return uid;
}

function llamar(env, uid, modelo, metodo, args, kwargs) {
  return rpc(env, "object", "execute_kw", [
    env.ODOO_DB,
    uid,
    env.ODOO_API_KEY,
    modelo,
    metodo,
    args,
    kwargs || {},
  ]);
}

async function rpc(env, service, method, args) {
  const res = await fetch(env.ODOO_URL.replace(/\/$/, "") + "/jsonrpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Date.now(),
    }),
  });

  if (!res.ok) throw new Error("Odoo respondió " + res.status);

  const datos = await res.json();
  if (datos.error) {
    const d = datos.error.data || {};
    throw new Error(d.message || datos.error.message || "Error de Odoo");
  }
  return datos.result;
}

function json(cuerpo, status, cors) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}
