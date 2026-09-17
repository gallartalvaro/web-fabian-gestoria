/**
 * ============================================================
 * Gestoría Fabián — Receptor de contactos del test de ayudas
 * ------------------------------------------------------------
 * Recibe el perfil que envía la web, lo valida y crea una
 * oportunidad (crm.lead) en Odoo con el diagnóstico completo.
 * Si el visitante ya existe como contacto, la oportunidad se
 * engancha a su ficha en lugar de duplicarla.
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
 *   ORIGENES      https://gallartalvaro.github.io
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
async function crearOportunidad(p, env) {
  const uid = await autenticar(env);
  const contacto = p.contacto;
  const conv = p.convocatoria;
  const diag = p.diagnostico || {};

  // Si ya es cliente del despacho, la oportunidad se engancha a su ficha.
  const partnerId = await buscarContacto(env, uid, contacto);

  const etiquetas = await etiquetasDe(env, uid, ["Web · Subvenciones", conv.titulo]);

  const titulos = {
    apto: "cumple los requisitos",
    revisar: "con puntos a comprobar",
    "no-apto": "no encaja · avisar de otras ayudas",
  };

  const valores = {
    name: conv.titulo + " — " + (titulos[diag.resultado] || "consulta"),
    type: "opportunity",
    contact_name: contacto.nombre,
    phone: contacto.telefono,
    priority: { alta: "3", media: "2", baja: "1" }[(p.seguimiento || {}).prioridad] || "1",
    description: descripcion(p),
  };

  if (contacto.email) valores.email_from = contacto.email;
  if (partnerId) valores.partner_id = partnerId;
  if (etiquetas.length) valores.tag_ids = [[6, 0, etiquetas]];

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

async function etiquetasDe(env, uid, nombres) {
  const ids = [];
  for (const nombre of nombres.filter(Boolean)) {
    const existentes = await llamar(env, uid, "crm.tag", "search", [[["name", "=", nombre]]], {
      limit: 1,
    });
    ids.push(existentes.length ? existentes[0] : await llamar(env, uid, "crm.tag", "create", [{ name: nombre }]));
  }
  return ids;
}

// ------------------------------------------------------------
// El diagnóstico completo, para no volver a preguntar nada
// ------------------------------------------------------------
function descripcion(p) {
  const c = p.contacto;
  const conv = p.convocatoria;
  const d = p.diagnostico || {};
  const s = p.seguimiento || {};
  const o = s.origen || {};
  const partes = [];

  partes.push("<h3>Contacto</h3><ul>");
  partes.push(fila("Teléfono", c.telefono));
  partes.push(fila("Email", c.email || "no indicado"));
  partes.push(fila("Prefiere que le llamen", c.momentoPreferido));
  partes.push("</ul>");

  partes.push("<h3>Resultado del test</h3><ul>");
  partes.push(fila("Convocatoria", conv.titulo + " (" + conv.organismo + ")"));
  partes.push(fila("Resultado", d.resultado));
  if (d.importeEstimado) partes.push(fila("Importe estimado", d.importeEstimado));
  partes.push(fila("Cierre del plazo", conv.cierraEl));
  if (conv.diasRestantes !== null && conv.diasRestantes !== undefined)
    partes.push(fila("Días restantes al rellenarlo", String(conv.diasRestantes)));
  partes.push("</ul>");

  partes.push(lista("Respuestas", Object.keys(d.respuestas || {}).map((k) => k + ": " + d.respuestas[k])));
  partes.push(lista("Puntos a resolver", d.puntosARevisar));
  partes.push(lista("Motivos de exclusión detectados", d.motivosDeExclusion));

  partes.push("<h3>Procedencia</h3><ul>");
  partes.push(fila("Página", s.pagina));
  if (o.campana) partes.push(fila("Campaña", o.campana));
  if (o.canal) partes.push(fila("Canal", o.canal + (o.medio ? " / " + o.medio : "")));
  if (o.procedencia) partes.push(fila("Llegó desde", o.procedencia));
  partes.push(fila("Fecha", s.fecha));
  partes.push("</ul>");

  partes.push(
    "<p><i>Consentimiento aceptado el " +
      esc((p.consentimiento || {}).fecha || "") +
      ". " +
      esc((p.consentimiento || {}).texto || "") +
      "</i></p>"
  );

  return partes.join("");
}

const fila = (etiqueta, valor) => "<li><b>" + esc(etiqueta) + ":</b> " + esc(valor || "—") + "</li>";

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
