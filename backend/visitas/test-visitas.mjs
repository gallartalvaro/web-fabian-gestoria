// Prueba del contador de visitas contra una D1 simulada. No toca
// Cloudflare ni necesita credenciales:
//
//   node backend/visitas/test-visitas.mjs
//
import worker from "./worker.js";
import fs from "node:fs";

// --- D1 simulada ---------------------------------------------------
// Guarda las sentencias y aplica el UPSERT a mano, que es justo lo
// que hay que comprobar: que dos páginas de la misma sesión suman
// una visita, no dos.
let filas = new Map();
let eventos = new Map();
let sentencias = [];

const DB = {
  prepare(sql) {
    return {
      sql,
      bind(...args) {
        return {
          async run() {
            sentencias.push({ sql, args });
            if (sql.includes("INTO visitas")) {
              const [dia, hora, ruta, referente, pais, dispositivo, entorno, visitas] = args;
              const k = [dia, hora, ruta, referente, pais, dispositivo, entorno].join("|");
              const f = filas.get(k) || { dia, hora, ruta, referente, pais, dispositivo, entorno, paginas: 0, visitas: 0 };
              f.paginas += 1;
              f.visitas += visitas;
              filas.set(k, f);
            }
            if (sql.includes("INTO eventos")) {
              const [dia, ruta, nombre, entorno] = args;
              const k = [dia, ruta, nombre, entorno].join("|");
              eventos.set(k, (eventos.get(k) || 0) + 1);
            }
          },
          async all() {
            return { results: [] };
          },
        };
      },
    };
  },
};

const env = {
  DB,
  ORIGENES: "https://valentramites.com,https://gallartalvaro.github.io",
  CLAVE_PANEL: "secreta",
};

const ctx = { waitUntil: (p) => p };

const pedir = (cuerpo, opciones = {}) =>
  worker.fetch(
    new Request("https://visitas.test" + (opciones.ruta || "/"), {
      method: opciones.metodo || "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: opciones.origin === null ? undefined : opciones.origin || "https://valentramites.com",
        "User-Agent": opciones.ua || "Mozilla/5.0 (Windows NT 10.0) Chrome/140",
      },
      body: opciones.metodo === "GET" ? undefined : JSON.stringify(cuerpo),
    }),
    env,
    ctx
  );

let fallos = 0;
const comprobar = (nombre, cond, detalle) => {
  console.log((cond ? "  OK   " : "  FALLA") + "  " + nombre + (cond ? "" : "  → " + detalle));
  if (!cond) fallos++;
};
const limpiar = () => {
  filas = new Map();
  eventos = new Map();
  sentencias = [];
};

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
let f = [...filas.values()][0];
comprobar("responde 204 sin cuerpo", res.status === 204, res.status);
comprobar("una fila", filas.size === 1, filas.size);
comprobar("cuenta 1 página y 1 visita", f.paginas === 1 && f.visitas === 1, JSON.stringify(f));
comprobar("guarda la ruta", f.ruta === "/subvenciones.html", f.ruta);
comprobar("del referente solo el dominio, sin la búsqueda", f.referente === "google.com", f.referente);
comprobar("deduce escritorio por el ancho", f.dispositivo === "escritorio", f.dispositivo);

// --- 2 -------------------------------------------------------------
console.log("\n2. Segunda página de la misma sesión");
await pedir(visita({ ruta: "/precios.html", primera: false }));
const f2 = [...filas.values()].find((x) => x.ruta === "/precios.html");
const totalVisitas = [...filas.values()].reduce((n, x) => n + x.visitas, 0);
comprobar("cuenta la página", f2.paginas === 1, f2.paginas);
comprobar("NO cuenta una segunda visita", f2.visitas === 0, f2.visitas);
comprobar("la sesión sigue siendo una", totalVisitas === 1, totalVisitas);

// --- 3 -------------------------------------------------------------
console.log("\n3. Nada que identifique a nadie");
const todas = [...filas.values()];
const prohibidas = ["ip", "sesion", "usuario", "cookie", "id", "huella"];
comprobar(
  "ninguna columna identifica a una persona",
  todas.every((x) => Object.keys(x).every((k) => !prohibidas.includes(k.toLowerCase()))),
  Object.keys(todas[0]).join(",")
);
comprobar(
  "la consulta no recibe ninguna IP",
  !sentencias.some((s) => s.args.some((a) => typeof a === "string" && /\d+\.\d+\.\d+\.\d+/.test(a))),
  "hay algo con pinta de IP"
);

// --- 4 -------------------------------------------------------------
console.log("\n4. La ruta se limpia antes de guardarla");
limpiar();
await pedir(visita({ ruta: "/index.html?utm_source=correo&email=cliente@example.com#contacto" }));
f = [...filas.values()][0];
comprobar("sin parámetros ni ancla", f.ruta === "/index.html", f.ruta);
comprobar("el correo de la url no se guarda", !JSON.stringify(f).includes("cliente@example.com"), "se ha colado");

limpiar();
await pedir(visita({ ruta: "x".repeat(400) }));
f = [...filas.values()][0];
comprobar("una ruta larguísima se recorta", f.ruta.length <= 121, f.ruta.length);

// --- 5 -------------------------------------------------------------
console.log("\n5. Referente directo y dispositivos");
limpiar();
await pedir(visita({ referente: "" }));
comprobar("sin referente es 'directo'", [...filas.values()][0].referente === "directo", "mal");
limpiar();
await pedir(visita({ referente: "no-es-una-url" }));
comprobar("un referente ilegible es 'directo'", [...filas.values()][0].referente === "directo", "mal");
limpiar();
await pedir(visita({ ancho: 375 }));
comprobar("375 px es móvil", [...filas.values()][0].dispositivo === "movil", "mal");
limpiar();
await pedir(visita({ ancho: 900 }));
comprobar("900 px es tableta", [...filas.values()][0].dispositivo === "tableta", "mal");

// --- 6 -------------------------------------------------------------
console.log("\n6. Robots y orígenes ajenos");
limpiar();
res = await pedir(visita(), { ua: "Mozilla/5.0 (compatible; Googlebot/2.1)" });
comprobar("el robot recibe 204 y no cuenta", res.status === 204 && filas.size === 0, filas.size);
limpiar();
res = await pedir(visita(), { origin: "https://sitio-ajeno.com" });
comprobar("origen ajeno, 403 y no cuenta", res.status === 403 && filas.size === 0, res.status);

// --- 7 -------------------------------------------------------------
console.log("\n7. Entorno");
limpiar();
await pedir(visita({ entorno: "pruebas" }));
comprobar("la copia de pruebas se marca aparte", [...filas.values()][0].entorno === "pruebas", "mal");
limpiar();
await pedir(visita({ entorno: "inventado" }));
comprobar("un entorno inventado cae en produccion", [...filas.values()][0].entorno === "produccion", "mal");

// --- 8 -------------------------------------------------------------
console.log("\n8. Eventos");
limpiar();
res = await pedir({ nombre: "consulta-enviada", ruta: "/index.html", entorno: "produccion" }, { ruta: "/evento" });
comprobar("responde 204", res.status === 204, res.status);
comprobar("guarda el evento", eventos.size === 1 && [...eventos.values()][0] === 1, eventos.size);
await pedir({ nombre: "consulta-enviada", ruta: "/index.html", entorno: "produccion" }, { ruta: "/evento" });
comprobar("el segundo suma en la misma fila", eventos.size === 1 && [...eventos.values()][0] === 2, [...eventos.values()][0]);
limpiar();
await pedir({ nombre: "", ruta: "/index.html" }, { ruta: "/evento" });
comprobar("un evento sin nombre no se guarda", eventos.size === 0, eventos.size);

// --- 9 -------------------------------------------------------------
console.log("\n9. El cuadro de mando está protegido");
res = await pedir(null, { metodo: "GET", ruta: "/panel" });
comprobar("sin clave, 401", res.status === 401, res.status);
res = await pedir(null, { metodo: "GET", ruta: "/panel?clave=equivocada" });
comprobar("con clave falsa, 401", res.status === 401, res.status);
res = await pedir(null, { metodo: "GET", ruta: "/stats?clave=equivocada" });
comprobar("los datos en bruto también, 401", res.status === 401, res.status);
res = await pedir(null, { metodo: "GET", ruta: "/panel?clave=secreta" });
const html = await res.text();
comprobar("con la clave correcta, 200", res.status === 200, res.status);
comprobar("el panel no se indexa", html.includes('content="noindex'), "falta el noindex");
comprobar("dice que no hay cookies", html.includes("No se guarda ninguna IP"), "falta la nota");

// --- 10 ------------------------------------------------------------
console.log("\n10. Envíos malformados");
limpiar();
res = await worker.fetch(
  new Request("https://visitas.test/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://valentramites.com" },
    body: "{esto no es json",
  }),
  env,
  ctx
);
comprobar("JSON roto, 400 y no cuenta", res.status === 400 && filas.size === 0, res.status);
res = await worker.fetch(
  new Request("https://visitas.test/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://valentramites.com" },
    body: JSON.stringify({ ruta: "/x", relleno: "y".repeat(5000) }),
  }),
  env,
  ctx
);
comprobar("envío gigante, 413", res.status === 413, res.status);
res = await pedir(null, { metodo: "GET", ruta: "/" });
comprobar("GET a la raíz, 405", res.status === 405, res.status);

// --- 11 ------------------------------------------------------------
// Esta no comprueba el Worker, comprueba el guion del navegador, y
// esta aqui porque el fallo que evita NO DA ERROR VISIBLE: la web
// sigue funcionando y simplemente deja de medirse.
//
// sendBeacon envia en modo credentials:"include". Con un tipo de
// contenido que no sea seguro (application/json, por ejemplo) el
// navegador exige comprobacion previa y la bloquea. Paso en la copia
// de pruebas el 16 de noviembre de 2026.
console.log("\n11. El guion no provoca comprobacion previa de CORS");
const guion = fs.readFileSync("public/js/visitas.js", "utf8");
comprobar(
  "el beacon se envia como text/plain",
  /new Blob\(\[texto\], \{ type: "text\/plain/.test(guion),
  "usa un tipo que dispara preflight"
);
// Se miran solo las lineas de codigo: el comentario que explica todo
// esto menciona application/json a proposito.
const codigo = guion
  .split(String.fromCharCode(10))
  .filter((l) => !l.trim().startsWith("//"))
  .join(String.fromCharCode(10));
comprobar(
  "ninguna cabecera ni blob usa application/json",
  !codigo.includes("application/json"),
  "hay un application/json que bloqueara el envio"
);

console.log("\n" + (fallos ? fallos + " COMPROBACIONES FALLIDAS" : "Todas las comprobaciones correctas"));
process.exit(fallos ? 1 : 0);
