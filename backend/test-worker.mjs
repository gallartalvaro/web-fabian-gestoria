// Prueba del receptor contra un Odoo simulado. No toca la instancia
// real ni necesita credenciales:
//
//   node backend/test-worker.mjs
//
import worker from "./odoo-lead-worker.js";

const env = {
  ODOO_URL: "https://odoo.example.com",
  ODOO_DB: "db",
  ODOO_USER: "u@example.com",
  ODOO_API_KEY: "clave",
  ORIGENES: "https://gallartalvaro.github.io",
};

// --- Odoo simulado -------------------------------------------------
let llamadas = [];
globalThis.fetch = async (url, opts) => {
  const body = JSON.parse(opts.body);
  const [service, method, args] = [body.params.service, body.params.method, body.params.args];
  llamadas.push({ service, method, modelo: args[3], metodo: args[4], valores: args[5] });

  let result;
  if (service === "common") result = 7; // uid
  else if (args[3] === "res.partner" && args[4] === "search") result = [42];
  else if (args[4] === "search" && ["crm.tag", "utm.source", "utm.medium", "utm.campaign"].includes(args[3]))
    result = [];
  else if (args[4] === "create" && ["crm.tag", "utm.source", "utm.medium", "utm.campaign"].includes(args[3]))
    result = 90 + llamadas.filter((l) => l.metodo === "create").length;
  else if (args[3] === "crm.lead" && args[4] === "create") result = 417;
  else result = [];

  return { ok: true, json: async () => ({ jsonrpc: "2.0", result }) };
};

const perfil = {
  version: 2,
  tipo: "test-subvencion",
  contacto: {
    nombre: "Lucía Ferrer Montes",
    telefono: "600 11 22 33",
    email: "lucia@example.com",
    momentoPreferido: "Por la tarde",
  },
  consentimiento: { aceptado: true, texto: "Acepta el tratamiento.", fecha: "2026-09-17T14:29:38Z" },
  convocatoria: {
    id: "emprende-y-concilia-2026",
    titulo: "Subvenciones «Emprende y Concilia» 2026",
    nombreCorto: "Emprende y Concilia 2026",
    organismo: "Ayuntamiento de València",
    cierraEl: "2026-09-22",
    diasRestantes: 5,
  },
  diagnostico: {
    resultado: "revisar",
    importeEstimado: "4.000 €",
    respuestas: { "¿A nombre de quién?": "Persona física <autónoma>" },
    respuestasCrudas: { perfil: "fisica", joven: "si" },
    etiquetas: ["Nuevo autónomo", "Menor de 36"],
    puntosARevisar: ["Comprobar deudas con el Ayuntamiento."],
    motivosDeExclusion: [],
  },
  seguimiento: {
    prioridad: "alta",
    pagina: "https://gallartalvaro.github.io/web-fabian-gestoria/ayuda-emprende-y-concilia.html",
    origen: { campana: "prueba-sept", canal: "whatsapp", medio: "difusion", procedencia: "" },
    fecha: "2026-09-17T14:29:38Z",
  },
  apellido2: "",
};

const pedir = (cuerpo, origin = "https://gallartalvaro.github.io") =>
  worker.fetch(
    new Request("https://leads.test/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(cuerpo),
    }),
    env
  );

let fallos = 0;
const comprobar = (nombre, condicion, detalle) => {
  console.log((condicion ? "  OK   " : "  FALLA") + "  " + nombre + (condicion ? "" : "  → " + detalle));
  if (!condicion) fallos++;
};

// --- 1. Envío correcto ---------------------------------------------
console.log("\n1. Perfil válido");
llamadas = [];
let res = await pedir(perfil);
let datos = await res.json();
const lead = llamadas.find((l) => l.modelo === "crm.lead").valores[0];

comprobar("responde 200", res.status === 200, res.status);
comprobar("devuelve referencia", datos.referencia === "SUB-417", JSON.stringify(datos));
comprobar("cabecera CORS del origen", res.headers.get("Access-Control-Allow-Origin") === "https://gallartalvaro.github.io", res.headers.get("Access-Control-Allow-Origin"));
comprobar("crea oportunidad, no lead oculto", lead.type === "opportunity", lead.type);
comprobar("prioridad alta = 3", lead.priority === "3", lead.priority);
comprobar("fecha límite = cierre convocatoria", lead.date_deadline === "2026-09-22", lead.date_deadline);
comprobar("engancha el contacto existente", lead.partner_id === 42, lead.partner_id);
comprobar(
  "etiqueta general + convocatoria + 2 rasgos",
  lead.tag_ids[0][2].length === 4,
  JSON.stringify(lead.tag_ids)
);
comprobar(
  "nombre corto, resultado e importe en el titulo",
  /^Emprende y Concilia 2026 · con puntos a comprobar · 4\.000 €$/.test(lead.name),
  lead.name
);
comprobar("origen de la visita como fuente del CRM", !!lead.source_id, lead.source_id);
comprobar("medio de la visita", !!lead.medium_id, lead.medium_id);
comprobar("campaña de la visita", !!lead.campaign_id, lead.campaign_id);
comprobar(
  "las etiquetas de perfil llegan a Odoo",
  llamadas.some((l) => l.modelo === "crm.tag" && l.metodo === "create" && l.valores?.[0]?.name === "Menor de 36"),
  "no se creó la etiqueta"
);
comprobar(
  "descripción con ficha resumen",
  lead.description.includes("<h3>Resumen</h3>") && lead.description.includes("Lo que respondió"),
  "sin resumen"
);
comprobar("teléfono y email", lead.phone === "600 11 22 33" && lead.email_from === "lucia@example.com", lead.phone);
comprobar("descripción escapa el HTML del visitante", lead.description.includes("&lt;autónoma&gt;"), "sin escapar");
comprobar("descripción incluye la campaña", lead.description.includes("prueba-sept"), "falta origen");
comprobar("descripción incluye el consentimiento", lead.description.includes("Consentimiento aceptado"), "falta");

// --- 2. Robot -------------------------------------------------------
console.log("\n2. Campo trampa relleno (robot)");
llamadas = [];
res = await pedir({ ...perfil, apellido2: "Spam SL" });
comprobar("responde 200 sin delatar la trampa", res.status === 200, res.status);
comprobar("NO crea nada en Odoo", llamadas.length === 0, llamadas.length + " llamadas");

// --- 3. Sin consentimiento ------------------------------------------
console.log("\n3. Sin consentimiento");
llamadas = [];
res = await pedir({ ...perfil, consentimiento: { aceptado: false } });
comprobar("rechaza con 422", res.status === 422, res.status);
comprobar("NO crea nada en Odoo", llamadas.length === 0, llamadas.length + " llamadas");

// --- 4. Datos incompletos -------------------------------------------
console.log("\n4. Sin teléfono");
res = await pedir({ ...perfil, contacto: { ...perfil.contacto, telefono: "" } });
comprobar("rechaza con 422", res.status === 422, res.status);

// --- 5. Origen no permitido -----------------------------------------
console.log("\n5. Origen ajeno");
llamadas = [];
res = await pedir(perfil, "https://sitio-ajeno.example");
comprobar("rechaza con 403", res.status === 403, res.status);
comprobar("NO crea nada en Odoo", llamadas.length === 0, llamadas.length + " llamadas");

// --- 6. Odoo caído ---------------------------------------------------
console.log("\n6. Odoo no responde");
globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
res = await pedir(perfil);
comprobar("devuelve 502 para que la web use el camino alternativo", res.status === 502, res.status);

// --- 7. Preflight ----------------------------------------------------
console.log("\n7. Preflight CORS");
res = await worker.fetch(
  new Request("https://leads.test/", { method: "OPTIONS", headers: { Origin: "https://gallartalvaro.github.io" } }),
  env
);
comprobar("responde 204", res.status === 204, res.status);

console.log("\n" + (fallos ? fallos + " COMPROBACIONES FALLIDAS" : "Todas las comprobaciones correctas"));
process.exit(fallos ? 1 : 0);
