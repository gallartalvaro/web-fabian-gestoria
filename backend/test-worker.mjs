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
// Permite probar los dos caminos del alta: contacto nuevo y contacto
// que ya estaba en la agenda del despacho.
let contactoExiste = true;
const fetchSimulado = async (url, opts) => {
  const body = JSON.parse(opts.body);
  const [service, method, args] = [body.params.service, body.params.method, body.params.args];
  llamadas.push({ service, method, modelo: args[3], metodo: args[4], valores: args[5] });

  let result;
  if (service === "common") result = 7; // uid
  else if (args[3] === "res.partner" && args[4] === "search") result = contactoExiste ? [42] : [];
  else if (args[3] === "res.partner" && args[4] === "create") result = 55;
  else if (args[3] === "res.partner" && args[4] === "write") result = true;
  else if (args[3] === "res.partner" && args[4] === "message_post") result = 900;
  else if (args[4] === "search" && ["crm.tag", "res.partner.category", "utm.source", "utm.medium", "utm.campaign"].includes(args[3]))
    result = [];
  else if (args[4] === "create" && ["crm.tag", "res.partner.category", "utm.source", "utm.medium", "utm.campaign"].includes(args[3]))
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

globalThis.fetch = fetchSimulado;

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

// --- 8. Solicitud de llamada (panel de contacto) --------------------
console.log("\n8. Que me llamen");
globalThis.fetch = fetchSimulado;
llamadas = [];
res = await pedir({
  version: 2,
  tipo: "solicitud-llamada",
  contacto: { nombre: "Ana Soler", telefono: "611 22 33 44", email: "", momentoPreferido: "Esta tarde" },
  consentimiento: { aceptado: true, texto: "Acepta.", fecha: "2026-09-22T17:00:00Z" },
  solicitud: { contexto: "Plan Profesional (autónomos)" },
  seguimiento: { prioridad: "media", pagina: "https://valentramites.com/precios.html", origen: {}, fecha: "2026-09-22T17:00:00Z" },
  apellido2: "",
});
datos = await res.json();
const llamada = llamadas.find((l) => l.modelo === "crm.lead")?.valores?.[0] || {};
comprobar("responde 200 con referencia LLA-", res.status === 200 && /^LLA-/.test(datos.referencia || ""), JSON.stringify(datos));
comprobar("no exige convocatoria", !!llamada.name, "no se creó");
comprobar("titulo con el contexto", llamada.name === "Llamar · Plan Profesional (autónomos)", llamada.name);
comprobar("prioridad alta", llamada.priority === "3", llamada.priority);
comprobar("plazo: hoy", /^\d{4}-\d{2}-\d{2}$/.test(llamada.date_deadline || ""), llamada.date_deadline);

// --- 10. Consulta escrita (formulario de la portada) ----------------
console.log("\n10. Consulta de la portada");
llamadas = [];
res = await pedir({
  version: 2,
  tipo: "consulta-web",
  contacto: { nombre: "Jordi Ramos", telefono: "622 33 44 55", email: "jordi@example.com", momentoPreferido: "" },
  consentimiento: { aceptado: true, texto: "Acepta.", fecha: "2026-10-06T09:00:00Z" },
  solicitud: {
    area: "Fiscal y contable",
    mensaje: "Tengo dos <sociedades> y quiero\nunificar la contabilidad.",
  },
  seguimiento: {
    prioridad: "media",
    pagina: "https://valentramites.com/",
    origen: { canal: "google" },
    fecha: "2026-10-06T09:00:00Z",
  },
  apellido2: "",
});
datos = await res.json();
const consulta = llamadas.find((l) => l.modelo === "crm.lead")?.valores?.[0] || {};
comprobar("responde 200 con referencia CON-", res.status === 200 && /^CON-/.test(datos.referencia || ""), JSON.stringify(datos));
comprobar("título con el área", consulta.name === "Consulta · Fiscal y contable", consulta.name);
comprobar("guarda el email", consulta.email_from === "jordi@example.com", consulta.email_from);
comprobar("guarda el teléfono", consulta.phone === "622 33 44 55", consulta.phone);
comprobar("conserva el mensaje", (consulta.description || "").includes("unificar la contabilidad"), "se perdió el mensaje");
comprobar("escapa el HTML del mensaje", (consulta.description || "").includes("&lt;sociedades&gt;"), "sin escapar");
comprobar("respeta los saltos de línea", (consulta.description || "").includes("quiero<br>unificar"), "sin <br>");
comprobar("prioridad alta, no máxima", consulta.priority === "2", consulta.priority);
comprobar("anota la procedencia de la visita", !!consulta.source_id, consulta.source_id);

// --- 11. Lo que hace útil a una consulta es el texto ---------------
console.log("\n11. Consulta sin mensaje");
llamadas = [];
res = await pedir({
  version: 2,
  tipo: "consulta-web",
  contacto: { nombre: "Sin texto", telefono: "622 33 44 55", email: "x@example.com" },
  consentimiento: { aceptado: true },
  solicitud: { area: "Fiscal y contable" },
  seguimiento: {},
  apellido2: "",
});
comprobar("rechaza con 422", res.status === 422, res.status);
comprobar("NO crea nada en Odoo", llamadas.length === 0, llamadas.length + " llamadas");

console.log("\n12. Consulta con email inválido");
res = await pedir({
  version: 2,
  tipo: "consulta-web",
  contacto: { nombre: "Mal email", telefono: "622 33 44 55", email: "no-es-un-email" },
  consentimiento: { aceptado: true },
  solicitud: { area: "Fiscal y contable", mensaje: "Hola" },
  seguimiento: {},
  apellido2: "",
});
comprobar("rechaza con 422", res.status === 422, res.status);

console.log("\n9. Teléfono demasiado corto");
res = await pedir({
  version: 2, tipo: "solicitud-llamada",
  contacto: { nombre: "X", telefono: "1234" },
  consentimiento: { aceptado: true }, solicitud: {}, seguimiento: {}, apellido2: "",
});
comprobar("rechaza con 422", res.status === 422, res.status);

// --- 13 a 16. Alta en el aviso de subvenciones ----------------------
const alta = {
  version: 2,
  tipo: "aviso-subvenciones",
  suscripcion: {
    nombre: "Horno La Esperanza",
    email: "Pan@Example.com",
    actividad: "Hostelería y alimentación",
    provincia: "Valencia",
  },
  consentimiento: {
    aceptado: true,
    texto: "Acepta recibir avisos de convocatorias.",
    fecha: "2026-11-04T09:00:00Z",
  },
  seguimiento: {
    pagina: "https://valentramites.com/",
    origen: { canal: "web", campana: "", medio: "", procedencia: "" },
    fecha: "2026-11-04T09:00:00Z",
  },
  apellido2: "",
};

console.log("\n13. Alta en el aviso · contacto nuevo");
llamadas = [];
contactoExiste = false;
res = await pedir(alta);
datos = await res.json();
const creado = llamadas.find((l) => l.modelo === "res.partner" && l.metodo === "create");
const etiquetasCreadas = llamadas
  .filter((l) => l.modelo === "res.partner.category" && l.metodo === "create")
  .map((l) => l.valores[0].name);

comprobar("responde 200 con referencia AVI-", res.status === 200 && datos.referencia === "AVI-55", JSON.stringify(datos));
comprobar("NO crea oportunidad en el embudo", !llamadas.some((l) => l.modelo === "crm.lead"), "ensucia el CRM");
comprobar("crea el contacto", !!creado, "no se creó");
comprobar("guarda el correo", creado.valores[0].email === "Pan@Example.com", creado.valores[0].email);
comprobar("usa el nombre dado", creado.valores[0].name === "Horno La Esperanza", creado.valores[0].name);
comprobar(
  "etiqueta de lista, actividad y provincia",
  ["Aviso de subvenciones", "Hostelería y alimentación", "Valencia"].every((e) => etiquetasCreadas.includes(e)),
  etiquetasCreadas.join(" / ")
);
comprobar("deja constancia del consentimiento", (creado.valores[0].comment || "").includes("Consentimiento aceptado"), "falta");

console.log("\n14. Alta en el aviso · el contacto ya existía");
llamadas = [];
contactoExiste = true;
res = await pedir(alta);
datos = await res.json();
const escrito = llamadas.find((l) => l.modelo === "res.partner" && l.metodo === "write");

comprobar("responde 200 sobre la ficha existente", res.status === 200 && datos.referencia === "AVI-42", JSON.stringify(datos));
comprobar("NO duplica el contacto", !llamadas.some((l) => l.modelo === "res.partner" && l.metodo === "create"), "duplicado");
comprobar("añade etiquetas con [4, id], sin borrar las suyas", !!escrito && escrito.valores[1].category_id.every((c) => c[0] === 4), JSON.stringify(escrito && escrito.valores[1]));
comprobar("NO pisa el campo de notas de un cliente", !!escrito && escrito.valores[1].comment === undefined, "pisa las notas");
comprobar("anota el consentimiento en el historial", llamadas.some((l) => l.metodo === "message_post"), "sin constancia");

console.log("\n15. Alta sin los datos mínimos");
contactoExiste = false;
llamadas = [];
res = await pedir({ ...alta, suscripcion: { ...alta.suscripcion, email: "" } });
comprobar("sin correo, rechaza con 422", res.status === 422, res.status);
res = await pedir({ ...alta, suscripcion: { ...alta.suscripcion, email: "arroba-no" } });
comprobar("correo mal escrito, rechaza con 422", res.status === 422, res.status);
res = await pedir({ ...alta, suscripcion: { ...alta.suscripcion, actividad: "" } });
comprobar("sin actividad, rechaza con 422", res.status === 422, res.status);
res = await pedir({ ...alta, consentimiento: { aceptado: false } });
comprobar("sin consentimiento, rechaza con 422", res.status === 422, res.status);
comprobar("ninguno de los cuatro toca Odoo", llamadas.length === 0, llamadas.length + " llamadas");
res = await pedir({ ...alta, apellido2: "soy-un-robot" });
comprobar("el robot recibe 200 y no crea nada", res.status === 200 && llamadas.length === 0, llamadas.length + " llamadas");

console.log("\n16. El alta no exige teléfono");
llamadas = [];
res = await pedir({
  version: 2,
  tipo: "aviso-subvenciones",
  suscripcion: { email: "solo@example.com", actividad: "Comercio" },
  consentimiento: { aceptado: true, texto: "Acepta.", fecha: "2026-11-04T09:00:00Z" },
  seguimiento: {},
  apellido2: "",
});
datos = await res.json();
const minimo = llamadas.find((l) => l.modelo === "res.partner" && l.metodo === "create");
comprobar("responde 200 solo con correo y actividad", res.status === 200, res.status);
comprobar("sin nombre, usa el correo", minimo.valores[0].name === "solo@example.com", minimo.valores[0].name);

// --- 7. Preflight ----------------------------------------------------
console.log("\n7. Preflight CORS");
res = await worker.fetch(
  new Request("https://leads.test/", { method: "OPTIONS", headers: { Origin: "https://gallartalvaro.github.io" } }),
  env
);
comprobar("responde 204", res.status === 204, res.status);

console.log("\n" + (fallos ? fallos + " COMPROBACIONES FALLIDAS" : "Todas las comprobaciones correctas"));
process.exit(fallos ? 1 : 0);
