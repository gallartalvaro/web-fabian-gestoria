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
  if (!p.contacto || !texto(p.contacto.nombre)) return "Falta el nombre";
  if (!texto(p.contacto.telefono)) return "Falta el teléfono";
  if (!p.consentimiento || p.consentimiento.aceptado !== true) return "Falta el consentimiento";
  if (!p.convocatoria || !texto(p.convocatoria.titulo)) return "Falta la convocatoria";
  if (p.contacto.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.contacto.email))
    return "El email no es válido";
  return null;
}

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
