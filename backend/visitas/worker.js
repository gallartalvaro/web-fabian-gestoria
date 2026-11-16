/**
 * ============================================================
 * Valentramites — Medición de visitas
 * ------------------------------------------------------------
 * Analítica propia, sin cookies y sin terceros. Vive en un
 * Worker aparte del receptor de contactos a propósito: si un
 * día esto se satura o falla, no puede llevarse por delante la
 * captación de clientes, que es lo que de verdad importa.
 *
 * QUÉ SE GUARDA, Y QUÉ NO
 *
 * En la base de datos NO hay ni un solo identificador: ni IP,
 * ni cookie, ni huella de navegador, ni identificador de
 * sesión. Solo filas agregadas con un contador:
 *
 *   día · hora · ruta · referente · país · dispositivo → +1
 *
 * Las "visitas" se cuentan porque el navegador avisa de si esa
 * página es la primera de la sesión (lo sabe por un valor
 * aleatorio que guarda en sessionStorage y que se borra al
 * cerrar la pestaña, y que nunca sale del navegador). Aquí solo
 * llega un sí o un no. Es imposible reconstruir el recorrido de
 * una persona a partir de esta tabla, y esa es la idea.
 *
 * La IP se usa únicamente en tránsito: Cloudflare deduce el
 * país y la IP se descarta sin escribirse en ningún sitio.
 *
 * Rutas:
 *   POST /          registra una página vista
 *   POST /evento    registra un evento con nombre
 *   GET  /stats     devuelve los agregados en JSON (con clave)
 *   GET  /panel     el cuadro de mando en HTML (con clave)
 *
 * Variables de entorno:
 *   ORIGENES   https://valentramites.com,https://gallartalvaro.github.io
 *   CLAVE_PANEL  secreto para ver las estadísticas
 * Enlace D1:
 *   DB         base de datos de visitas (ver schema.sql)
 * ============================================================
 */

const LIMITE_BYTES = 4 * 1024;

// Rutas y nombres que aceptamos. Todo lo que llega del navegador
// es texto que alguien puede falsear, así que se recorta y se
// limpia antes de tocar la base de datos.
const MAX_RUTA = 120;
const MAX_NOMBRE = 60;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origen = request.headers.get("Origin") || "";
    const permitidos = (env.ORIGENES || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const cors = {
      "Access-Control-Allow-Origin": permitidos.includes(origen) ? origen : permitidos[0] || "",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // --- Cuadro de mando y datos: protegidos por clave ---
    if (request.method === "GET" && (url.pathname === "/panel" || url.pathname === "/stats")) {
      if (!env.CLAVE_PANEL || url.searchParams.get("clave") !== env.CLAVE_PANEL) {
        return new Response("No autorizado", { status: 401 });
      }
      const dias = Math.min(Math.max(Number(url.searchParams.get("dias")) || 30, 1), 365);
      const entorno = url.searchParams.get("entorno") === "pruebas" ? "pruebas" : "produccion";
      const datos = await resumen(env, dias, entorno);
      if (url.pathname === "/stats") {
        return new Response(JSON.stringify(datos, null, 1), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }
      return new Response(panel(datos, dias, entorno), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (request.method !== "POST") return new Response("", { status: 405, headers: cors });
    if (origen && !permitidos.includes(origen)) {
      return new Response("", { status: 403, headers: cors });
    }

    let d;
    try {
      const cuerpo = await request.text();
      if (cuerpo.length > LIMITE_BYTES) return new Response("", { status: 413, headers: cors });
      d = JSON.parse(cuerpo);
    } catch (err) {
      return new Response("", { status: 400, headers: cors });
    }

    // Los robots declarados no cuentan: inflan las cifras y hacen
    // que el despacho tome decisiones sobre humo.
    if (esRobot(request.headers.get("User-Agent") || "")) {
      return new Response(null, { status: 204, headers: cors });
    }

    // La respuesta no espera a la escritura: el navegador no debe
    // notar que esto existe.
    const tarea = url.pathname === "/evento" ? guardarEvento(env, d, request) : guardarVisita(env, d, request);
    if (ctx && ctx.waitUntil) ctx.waitUntil(tarea.catch(() => {}));
    else await tarea.catch(() => {});

    return new Response(null, { status: 204, headers: cors });
  },
};

// ------------------------------------------------------------
// Escritura
// ------------------------------------------------------------
async function guardarVisita(env, d, request) {
  const ahora = new Date();
  const fila = {
    dia: ahora.toISOString().slice(0, 10),
    hora: ahora.getUTCHours(),
    ruta: limpiarRuta(d.ruta),
    referente: limpiarReferente(d.referente),
    pais: (request.cf && request.cf.country) || "ND",
    dispositivo: dispositivo(d.ancho),
    entorno: d.entorno === "pruebas" ? "pruebas" : "produccion",
    visitas: d.primera ? 1 : 0,
  };

  await env.DB.prepare(
    `INSERT INTO visitas (dia, hora, ruta, referente, pais, dispositivo, entorno, paginas, visitas)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8)
     ON CONFLICT (dia, hora, ruta, referente, pais, dispositivo, entorno)
     DO UPDATE SET paginas = paginas + 1, visitas = visitas + ?8`
  )
    .bind(fila.dia, fila.hora, fila.ruta, fila.referente, fila.pais, fila.dispositivo, fila.entorno, fila.visitas)
    .run();
}

async function guardarEvento(env, d, request) {
  const nombre = texto(d.nombre) ? d.nombre.trim().slice(0, MAX_NOMBRE) : "";
  if (!nombre) return;
  const dia = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    `INSERT INTO eventos (dia, ruta, nombre, entorno, veces)
     VALUES (?1, ?2, ?3, ?4, 1)
     ON CONFLICT (dia, ruta, nombre, entorno) DO UPDATE SET veces = veces + 1`
  )
    .bind(dia, limpiarRuta(d.ruta), nombre, d.entorno === "pruebas" ? "pruebas" : "produccion")
    .run();
}

// ------------------------------------------------------------
// Limpieza de lo que llega del navegador
// ------------------------------------------------------------
const texto = (v) => typeof v === "string" && v.trim().length > 0;

function limpiarRuta(v) {
  if (!texto(v)) return "/";
  // Sin parámetros ni ancla: ahí es donde se cuelan datos
  // personales (un correo en una utm, por ejemplo).
  let r = v.split("?")[0].split("#")[0].trim();
  if (!r.startsWith("/")) r = "/" + r;
  return r.slice(0, MAX_RUTA);
}

function limpiarReferente(v) {
  if (!texto(v)) return "directo";
  try {
    const h = new URL(v).hostname.replace(/^www\./, "");
    return h ? h.slice(0, MAX_RUTA) : "directo";
  } catch (err) {
    return "directo";
  }
}

function dispositivo(ancho) {
  const n = Number(ancho);
  if (!n || n < 1) return "nd";
  if (n < 768) return "movil";
  if (n < 1100) return "tableta";
  return "escritorio";
}

function esRobot(ua) {
  return /bot|crawler|spider|crawling|headless|lighthouse|pingdom|monitor|preview|curl|wget|python-requests/i.test(ua);
}

// ------------------------------------------------------------
// Consulta
// ------------------------------------------------------------
async function resumen(env, dias, entorno) {
  const desde = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
  const q = (sql) => env.DB.prepare(sql).bind(desde, entorno).all();

  const [porDia, porRuta, porReferente, porPais, porDispositivo, totales, eventos] = await Promise.all([
    q(`SELECT dia, SUM(paginas) AS paginas, SUM(visitas) AS visitas FROM visitas
       WHERE dia >= ?1 AND entorno = ?2 GROUP BY dia ORDER BY dia`),
    q(`SELECT ruta, SUM(paginas) AS paginas, SUM(visitas) AS visitas FROM visitas
       WHERE dia >= ?1 AND entorno = ?2 GROUP BY ruta ORDER BY paginas DESC LIMIT 25`),
    q(`SELECT referente, SUM(visitas) AS visitas FROM visitas
       WHERE dia >= ?1 AND entorno = ?2 GROUP BY referente ORDER BY visitas DESC LIMIT 15`),
    q(`SELECT pais, SUM(visitas) AS visitas FROM visitas
       WHERE dia >= ?1 AND entorno = ?2 GROUP BY pais ORDER BY visitas DESC LIMIT 12`),
    q(`SELECT dispositivo, SUM(paginas) AS paginas, SUM(visitas) AS visitas FROM visitas
       WHERE dia >= ?1 AND entorno = ?2 GROUP BY dispositivo ORDER BY visitas DESC`),
    q(`SELECT SUM(paginas) AS paginas, SUM(visitas) AS visitas FROM visitas
       WHERE dia >= ?1 AND entorno = ?2`),
    env.DB.prepare(
      `SELECT nombre, ruta, SUM(veces) AS veces FROM eventos
       WHERE dia >= ?1 AND entorno = ?2 GROUP BY nombre, ruta ORDER BY veces DESC LIMIT 30`
    ).bind(desde, entorno).all(),
  ]);

  const t = (totales.results && totales.results[0]) || {};
  return {
    desde,
    dias,
    entorno,
    totales: { paginas: t.paginas || 0, visitas: t.visitas || 0 },
    porDia: porDia.results || [],
    porRuta: porRuta.results || [],
    porReferente: porReferente.results || [],
    porPais: porPais.results || [],
    porDispositivo: porDispositivo.results || [],
    eventos: eventos.results || [],
  };
}

// ------------------------------------------------------------
// Cuadro de mando
// ------------------------------------------------------------
function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const num = (n) => Number(n || 0).toLocaleString("es-ES");

function tabla(titulo, filas, campos, vacio) {
  if (!filas.length) return `<section class="caja"><h2>${esc(titulo)}</h2><p class="vacio">${esc(vacio)}</p></section>`;
  const tope = Math.max(...filas.map((f) => Number(f[campos.valor]) || 0)) || 1;
  const cuerpo = filas
    .map((f) => {
      const v = Number(f[campos.valor]) || 0;
      return `<tr>
        <td class="et"><span class="barra" style="width:${((v / tope) * 100).toFixed(1)}%"></span><span>${esc(f[campos.etiqueta] || "—")}</span></td>
        <td class="n">${num(v)}</td>
      </tr>`;
    })
    .join("");
  return `<section class="caja"><h2>${esc(titulo)}</h2><table>${cuerpo}</table></section>`;
}

function panel(d, dias, entorno) {
  const max = Math.max(1, ...d.porDia.map((x) => Number(x.paginas) || 0));
  const barras = d.porDia
    .map(
      (x) =>
        `<div class="dia" title="${esc(x.dia)}: ${num(x.visitas)} visitas, ${num(x.paginas)} páginas">
           <span style="height:${((Number(x.paginas) || 0) / max) * 100}%"></span>
         </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Visitas · Valentramites</title>
<style>
  :root{--ink:#10243d;--suave:#56657a;--linea:rgba(16,36,61,.1);--oro:#c08a3e;--fondo:#f7f8fa}
  *{box-sizing:border-box}
  body{margin:0;background:var(--fondo);color:var(--ink);
       font:15px/1.5 Inter,"Segoe UI",system-ui,sans-serif}
  header{background:var(--ink);color:#fff;padding:1.4rem 1.2rem}
  .envoltorio{max-width:1100px;margin:0 auto}
  h1{margin:0;font-size:1.25rem;letter-spacing:.01em}
  .sub{opacity:.72;font-size:.85rem;margin-top:.3rem}
  .rejilla{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));
           max-width:1100px;margin:1.2rem auto;padding:0 1.2rem}
  .caja{background:#fff;border:1px solid var(--linea);border-radius:12px;padding:1.1rem 1.2rem}
  .caja h2{margin:0 0 .8rem;font-size:.76rem;letter-spacing:.12em;text-transform:uppercase;color:var(--suave)}
  .cifras{display:flex;gap:2.4rem}
  .cifra b{display:block;font-size:2rem;line-height:1.1}
  .cifra span{font-size:.8rem;color:var(--suave)}
  .ancha{grid-column:1/-1}
  .grafico{display:flex;align-items:flex-end;gap:2px;height:130px}
  .dia{flex:1;height:100%;display:flex;align-items:flex-end;min-width:3px}
  .dia span{width:100%;background:var(--ink);border-radius:2px 2px 0 0;min-height:1px}
  .dia:hover span{background:var(--oro)}
  table{width:100%;border-collapse:collapse;font-size:.9rem}
  td{padding:.3rem 0;vertical-align:middle}
  .et{position:relative;padding-left:.5rem;overflow-wrap:anywhere}
  .et .barra{position:absolute;left:0;top:2px;bottom:2px;background:rgba(192,138,62,.17);border-radius:3px;z-index:0}
  .et span:last-child{position:relative}
  .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;padding-left:.8rem;color:var(--suave)}
  .vacio{color:var(--suave);font-size:.9rem;margin:0}
  .pie{max-width:1100px;margin:0 auto 2.5rem;padding:0 1.2rem;color:var(--suave);font-size:.82rem}
  .pie code{background:#eef1f5;padding:.1rem .35rem;border-radius:4px}
  @media(prefers-color-scheme:dark){
    :root{--fondo:#0d1420;--ink:#e8edf5;--suave:#8fa0b8;--linea:rgba(255,255,255,.1)}
    body{background:var(--fondo)} .caja{background:#141d2d}
    header{background:#09101a} .dia span{background:#3f6ea8} .pie code{background:#1c2636}
  }
</style></head><body>
<header><div class="envoltorio">
  <h1>Visitas · Valentramites</h1>
  <div class="sub">Últimos ${dias} días (desde el ${esc(d.desde)}) · ${esc(entorno)} · sin cookies y sin terceros</div>
</div></header>

<div class="rejilla">
  <section class="caja">
    <h2>Resumen</h2>
    <div class="cifras">
      <div class="cifra"><b>${num(d.totales.visitas)}</b><span>visitas</span></div>
      <div class="cifra"><b>${num(d.totales.paginas)}</b><span>páginas vistas</span></div>
      <div class="cifra"><b>${d.totales.visitas ? (d.totales.paginas / d.totales.visitas).toFixed(1) : "—"}</b><span>páginas por visita</span></div>
    </div>
  </section>

  <section class="caja ancha">
    <h2>Páginas vistas por día</h2>
    ${d.porDia.length ? `<div class="grafico">${barras}</div>` : '<p class="vacio">Todavía no hay datos.</p>'}
  </section>

  ${tabla("Páginas más vistas", d.porRuta, { etiqueta: "ruta", valor: "paginas" }, "Todavía no hay datos.")}
  ${tabla("De dónde llegan", d.porReferente, { etiqueta: "referente", valor: "visitas" }, "Todavía no hay datos.")}
  ${tabla("Países", d.porPais, { etiqueta: "pais", valor: "visitas" }, "Todavía no hay datos.")}
  ${tabla("Dispositivos", d.porDispositivo, { etiqueta: "dispositivo", valor: "visitas" }, "Todavía no hay datos.")}
  ${tabla("Qué hace la gente", d.eventos.map((e) => ({ et: e.nombre + "  ·  " + e.ruta, veces: e.veces })), { etiqueta: "et", valor: "veces" }, "Aún no se ha registrado ningún evento.")}
</div>

<p class="pie">
  No se guarda ninguna IP, ninguna cookie ni ningún identificador: la base de datos solo tiene
  contadores por día, ruta, referente, país y tipo de dispositivo. Para ver otro periodo, añada
  <code>&amp;dias=90</code> a la dirección; para ver la copia de pruebas,
  <code>&amp;entorno=pruebas</code>.
</p>
</body></html>`;
}
