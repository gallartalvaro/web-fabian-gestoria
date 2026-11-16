// Prueba del contador de visitas contra una D1 simulada. No toca
// Cloudflare ni necesita credenciales:
//
//   node backend/visitas/test-visitas.mjs
//
import worker from "./worker.js";
import fs from "node:fs";

// --- D1 simulada ---------------------------------------------------
// Aplica el UPSERT a mano, que es justo lo que hay que comprobar:
// que dos páginas de la misma sesión suman una visita, no dos.
let tablas = {};
let sentencias = [];

const nombreTabla = (sql) => (sql.match(/INSERT INTO (\w+)/) || [])[1];

const DB = {
  prepare(sql) {
    return {
      bind(...args) {
        return {
          async run() {
            sentencias.push({ sql, args });
            const t = nombreTabla(sql);
            if (!t) return;
            const cols = (sql.match(/INSERT INTO \w+ \(([^)]+)\)/) || [])[1].split(",").map((c) => c.trim());
            const fila = {};
            cols.forEach((c, i) => {
              if (i < args.length) fila[c] = args[i];
            });
            const contador = t === "visitas" ? "visitas" : "veces";
            const clave = cols
              .filter((c) => c !== "paginas" && c !== "visitas" && c !== "veces")
              .map((c) => fila[c])
              .join("|");
            tablas[t] = tablas[t] || new Map();
            const prev = tablas[t].get(clave) || { ...fila, paginas: 0, veces: 0, visitas: 0 };
            if (t === "visitas") {
              prev.paginas += 1;
              prev.visitas += args[args.length - 1];
            } else {
              prev.veces += 1;
            }
            tablas[t].set(clave, prev);
          },
          async all() {
            sentencias.push({ sql, args });
            return { results: [] };
          },
        };
      },
    };
  },
};

const env = { DB, ORIGENES: "https://valentramites.com,https://gallartalvaro.github.io", CLAVE_PANEL: "secreta" };
// waitUntil tiene que esperarse de verdad: el Worker responde antes
// de terminar de escribir, y sin esto las comprobaciones miraban la
// base a medio llenar.
let enVuelo = [];
const ctx = { waitUntil: (p) => enVuelo.push(p) };
const asentar = async () => {
  await Promise.allSettled(enVuelo);
  enVuelo = [];
};
const UA = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140 Safari/537.36";

const pedir = (cuerpo, o = {}) =>
  worker.fetch(
    new Request("https://visitas.test" + (o.ruta || "/"), {
      method: o.metodo || "POST",
      headers: {
        "Content-Type": "text/plain",
        Origin: o.origin === null ? undefined : o.origin || "https://valentramites.com",
        "User-Agent": o.ua || UA,
      },
      body: o.metodo === "GET" ? undefined : JSON.stringify(cuerpo),
    }),
    env,
    ctx
  ).then(async (r) => {
    await asentar();
    return r;
  });

let fallos = 0;
const comprobar = (nombre, cond, detalle) => {
  console.log((cond ? "  OK   " : "  FALLA") + "  " + nombre + (cond ? "" : "  → " + detalle));
  if (!cond) fallos++;
};
const limpiar = () => {
  tablas = {};
  sentencias = [];
};
const filas = (t) => [...(tablas[t] || new Map()).values()];

const visita = (extra = {}) => ({
  ruta: "/subvenciones.html",
  referente: "https://www.google.com/search?q=asesoria",
  ancho: 1440,
  primera: true,
  entorno: "produccion",
  ...extra,
});

// --- 1 -------------------------------------------------------------
console.log("\n1. Una página vista");
limpiar();
let res = await pedir(visita());
let f = filas("visitas")[0];
comprobar("responde 204 sin cuerpo", res.status === 204, res.status);
comprobar("cuenta 1 página y 1 visita", f.paginas === 1 && f.visitas === 1, JSON.stringify(f));
comprobar("guarda la ruta", f.ruta === "/subvenciones.html", f.ruta);
comprobar("del referente solo el dominio", f.referente === "google.com", f.referente);
comprobar("deduce escritorio por el ancho", f.dispositivo === "escritorio", f.dispositivo);

// --- 2 -------------------------------------------------------------
console.log("\n2. Segunda página de la misma sesión");
await pedir(visita({ ruta: "/precios.html", primera: false }));
const f2 = filas("visitas").find((x) => x.ruta === "/precios.html");
comprobar("cuenta la página", f2.paginas === 1, f2.paginas);
comprobar("NO cuenta una segunda visita", f2.visitas === 0, f2.visitas);
comprobar("la sesión sigue siendo una", filas("visitas").reduce((n, x) => n + x.visitas, 0) === 1, "mal");

// --- 3 -------------------------------------------------------------
console.log("\n3. Nada que identifique a nadie");
const prohibidas = ["ip", "sesion", "usuario", "cookie", "huella", "id"];
comprobar(
  "ninguna columna identifica a una persona",
  filas("visitas").every((x) => Object.keys(x).every((k) => !prohibidas.includes(k.toLowerCase()))),
  Object.keys(filas("visitas")[0]).join(",")
);
comprobar(
  "no llega nada con pinta de IP",
  !sentencias.some((s) => s.args.some((a) => typeof a === "string" && /^\d+\.\d+\.\d+\.\d+$/.test(a))),
  "hay algo con pinta de IP"
);

// --- 4 -------------------------------------------------------------
console.log("\n4. La ruta se limpia antes de guardarla");
limpiar();
await pedir(visita({ ruta: "/index.html?utm_source=correo&email=cliente@example.com#contacto" }));
f = filas("visitas")[0];
comprobar("sin parámetros ni ancla", f.ruta === "/index.html", f.ruta);
comprobar("el correo de la url no se guarda", !JSON.stringify(f).includes("cliente@example.com"), "se ha colado");
limpiar();
await pedir(visita({ ruta: "x".repeat(400) }));
comprobar("una ruta larguísima se recorta", filas("visitas")[0].ruta.length <= 121, "mal");

// --- 5 -------------------------------------------------------------
console.log("\n5. Referente y dispositivos");
for (const [ref, esperado] of [["", "directo"], ["no-es-una-url", "directo"]]) {
  limpiar();
  await pedir(visita({ referente: ref }));
  comprobar(`referente ${ref || "(vacío)"} → ${esperado}`, filas("visitas")[0].referente === esperado, "mal");
}
for (const [ancho, esperado] of [[375, "movil"], [900, "tableta"], [1440, "escritorio"], [0, "nd"]]) {
  limpiar();
  await pedir(visita({ ancho }));
  comprobar(`${ancho} px → ${esperado}`, filas("visitas")[0].dispositivo === esperado, "mal");
}

// --- 6 -------------------------------------------------------------
console.log("\n6. Robots y orígenes ajenos");
limpiar();
res = await pedir(visita(), { ua: "Mozilla/5.0 (compatible; Googlebot/2.1)" });
comprobar("el robot recibe 204 y no cuenta", res.status === 204 && !tablas.visitas, "contó");
limpiar();
res = await pedir(visita(), { origin: "https://sitio-ajeno.com" });
comprobar("origen ajeno, 403 y no cuenta", res.status === 403 && !tablas.visitas, res.status);

// --- 7 -------------------------------------------------------------
console.log("\n7. Entorno");
limpiar();
await pedir(visita({ entorno: "pruebas" }));
comprobar("la copia de pruebas se marca aparte", filas("visitas")[0].entorno === "pruebas", "mal");
limpiar();
await pedir(visita({ entorno: "inventado" }));
comprobar("un entorno inventado cae en produccion", filas("visitas")[0].entorno === "produccion", "mal");

// --- 8 -------------------------------------------------------------
console.log("\n8. Contexto de la visita");
limpiar();
await pedir(
  { entorno: "produccion", navegador: "Chrome", sistema: "Windows", idioma: "es-es", campana: "aviso-noviembre" },
  { ruta: "/contexto" }
);
const ctxs = filas("contexto");
comprobar("guarda las cuatro dimensiones", ctxs.length === 4, ctxs.length);
comprobar("una fila por clase", ["navegador", "sistema", "idioma", "campana"].every((c) => ctxs.some((x) => x.clase === c)), "falta alguna");
limpiar();
await pedir({ entorno: "produccion", navegador: "Chrome", sistema: "Windows", idioma: "es-es", campana: "" }, { ruta: "/contexto" });
comprobar("sin campaña, no crea fila vacía", filas("contexto").length === 3, filas("contexto").length);

// --- 9 -------------------------------------------------------------
console.log("\n9. Clics");
limpiar();
await pedir({ ruta: "/index.html", elemento: "Pedir presupuesto", tipo: "boton", entorno: "produccion" }, { ruta: "/clic" });
await pedir({ ruta: "/index.html", elemento: "Pedir presupuesto", tipo: "boton", entorno: "produccion" }, { ruta: "/clic" });
comprobar("dos clics iguales suman en una fila", filas("clics").length === 1 && filas("clics")[0].veces === 2, "mal");
limpiar();
await pedir({ ruta: "/x", elemento: "a".repeat(200), tipo: "inventado", entorno: "produccion" }, { ruta: "/clic" });
f = filas("clics")[0];
comprobar("el texto se recorta a 60", f.elemento.length === 60, f.elemento.length);
comprobar("un tipo inventado cae en 'enlace'", f.tipo === "enlace", f.tipo);
limpiar();
await pedir({ ruta: "/x", elemento: "", tipo: "enlace", entorno: "produccion" }, { ruta: "/clic" });
comprobar("sin texto, queda etiquetado y no se pierde", filas("clics")[0].elemento === "(sin texto)", "mal");

// --- 10 ------------------------------------------------------------
console.log("\n10. Lectura y permanencia");
limpiar();
for (const p of [25, 50, 75, 100]) await pedir({ ruta: "/x", profundidad: p, entorno: "produccion" }, { ruta: "/lectura" });
comprobar("los cuatro hitos se guardan", filas("lectura").length === 4, filas("lectura").length);
limpiar();
await pedir({ ruta: "/x", profundidad: 33, entorno: "produccion" }, { ruta: "/lectura" });
comprobar("una profundidad inventada se descarta", !tablas.lectura, "se guardó");
limpiar();
await pedir({ ruta: "/x", tramo: "1-3min", entorno: "produccion" }, { ruta: "/permanencia" });
comprobar("un tramo válido se guarda", filas("permanencia")[0].tramo === "1-3min", "mal");
limpiar();
await pedir({ ruta: "/x", tramo: "47 segundos", entorno: "produccion" }, { ruta: "/permanencia" });
comprobar("un tramo inventado se descarta", !tablas.permanencia, "se guardó");

// --- 11 ------------------------------------------------------------
console.log("\n11. Eventos");
limpiar();
await pedir({ nombre: "consulta-enviada", ruta: "/index.html", entorno: "produccion" }, { ruta: "/evento" });
await pedir({ nombre: "consulta-enviada", ruta: "/index.html", entorno: "produccion" }, { ruta: "/evento" });
comprobar("el segundo suma en la misma fila", filas("eventos").length === 1 && filas("eventos")[0].veces === 2, "mal");
limpiar();
await pedir({ nombre: "", ruta: "/index.html" }, { ruta: "/evento" });
comprobar("un evento sin nombre no se guarda", !tablas.eventos, "se guardó");

// --- 12 ------------------------------------------------------------
console.log("\n12. El cuadro de mando está protegido");
for (const r of ["/panel", "/panel?clave=equivocada", "/stats", "/stats?clave=equivocada"]) {
  res = await pedir(null, { metodo: "GET", ruta: r });
  comprobar(`${r} → 401`, res.status === 401, res.status);
}
res = await pedir(null, { metodo: "GET", ruta: "/panel?clave=secreta" });
const html = await res.text();
comprobar("con la clave correcta, 200", res.status === 200, res.status);
comprobar("el panel no se indexa", html.includes('content="noindex'), "falta el noindex");
comprobar("lleva barra de filtros", html.includes('form class="filtros"'), "sin filtros");
comprobar("deja claro que no hay identificadores", html.includes("No se guarda ninguna IP"), "falta la nota");
comprobar("explica por qué no hay recurrentes", html.includes("recurrentes"), "falta la explicación");

// --- 13 ------------------------------------------------------------
console.log("\n13. Filtros");
limpiar();
await pedir(null, { metodo: "GET", ruta: "/stats?clave=secreta&dias=7&dispositivo=movil&pais=ES&ruta=/precios.html" });
const consultas = sentencias.filter((s) => s.sql.includes("FROM visitas"));
comprobar("el filtro de dispositivo llega a la consulta", consultas.some((s) => s.args.includes("movil")), "no llega");
comprobar("el de país también", consultas.some((s) => s.args.includes("ES")), "no llega");
comprobar("el de página también", consultas.some((s) => s.args.includes("/precios.html")), "no llega");
limpiar();
await pedir(null, { metodo: "GET", ruta: "/stats?clave=secreta&dispositivo=inventado&pais=xx" });
const c2 = sentencias.filter((s) => s.sql.includes("FROM visitas"));
comprobar("un dispositivo inventado se ignora", !c2.some((s) => s.args.includes("inventado")), "se cuela");
comprobar("un país mal formado se ignora", !c2.some((s) => s.args.includes("xx")), "se cuela");
res = await pedir(null, { metodo: "GET", ruta: "/stats?clave=secreta&desde=2026-01-01&hasta=2026-01-31" });
let datos = await res.json();
comprobar("respeta las fechas dadas", datos.filtros.desde === "2026-01-01" && datos.filtros.hasta === "2026-01-31", JSON.stringify(datos.filtros));
comprobar("calcula los 31 días", datos.filtros.dias === 31, datos.filtros.dias);
comprobar("y el periodo anterior, del mismo tamaño", datos.filtros.desdeAnt === "2025-12-01" && datos.filtros.hastaAnt === "2025-12-31", datos.filtros.desdeAnt + " / " + datos.filtros.hastaAnt);

// --- 14 ------------------------------------------------------------
console.log("\n14. Envíos malformados");
limpiar();
res = await worker.fetch(
  new Request("https://visitas.test/", {
    method: "POST",
    headers: { "Content-Type": "text/plain", Origin: "https://valentramites.com", "User-Agent": UA },
    body: "{esto no es json",
  }),
  env,
  ctx
);
await asentar();
comprobar("JSON roto, 400 y no cuenta", res.status === 400 && !tablas.visitas, res.status);
res = await worker.fetch(
  new Request("https://visitas.test/", {
    method: "POST",
    headers: { "Content-Type": "text/plain", Origin: "https://valentramites.com", "User-Agent": UA },
    body: JSON.stringify({ ruta: "/x", relleno: "y".repeat(5000) }),
  }),
  env,
  ctx
);
await asentar();
comprobar("envío gigante, 413", res.status === 413, res.status);
res = await pedir(null, { metodo: "GET", ruta: "/" });
comprobar("GET a la raíz, 405", res.status === 405, res.status);

// --- 15 ------------------------------------------------------------
// Esta no comprueba el Worker, comprueba el guion del navegador, y
// esta aqui porque el fallo que evita NO DA ERROR VISIBLE: la web
// sigue funcionando y simplemente deja de medirse.
console.log("\n15. El guion del navegador");
const guion = fs.readFileSync("public/js/visitas.js", "utf8");
const codigo = guion
  .split(String.fromCharCode(10))
  .filter((l) => !l.trim().startsWith("//"))
  .join(String.fromCharCode(10));

comprobar(
  "el beacon se envia como text/plain, sin parametros",
  codigo.includes('new Blob([texto], { type: "text/plain" })'),
  "usa un tipo que dispara comprobacion previa"
);
comprobar("ningun charset pegado al tipo", !codigo.includes("text/plain;"), "con charset Chrome vuelve a bloquear");
comprobar("ninguna cabecera ni blob usa application/json", !codigo.includes("application/json"), "bloqueara el envio");
comprobar(
  "el test de subvenciones queda fuera de la medicion de clics",
  codigo.includes('SIN_MEDIR = ".wiz'),
  "se medirian opciones con datos sensibles"
);
comprobar("los formularios tampoco se miden al pulsar", /SIN_MEDIR = "[^"]*form/.test(codigo), "falta form en la exclusion");
comprobar("respeta No rastrear", codigo.includes("doNotTrack"), "ignora la senal del navegador");
comprobar("no mide en localhost", codigo.includes('"localhost"'), "ensuciaria las cifras");

console.log("\n" + (fallos ? fallos + " COMPROBACIONES FALLIDAS" : "Todas las comprobaciones correctas"));
process.exit(fallos ? 1 : 0);
