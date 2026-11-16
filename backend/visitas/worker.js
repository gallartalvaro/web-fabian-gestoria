/**
 * ============================================================
 * Valentramites — Medición de visitas
 * ------------------------------------------------------------
 * Analítica propia, sin cookies y sin terceros. Vive en un
 * Worker aparte del receptor de contactos a propósito: si un día
 * esto se satura o falla, no puede llevarse por delante la
 * captación de clientes, que es lo que de verdad importa.
 *
 * EN LA BASE DE DATOS NO HAY NINGÚN IDENTIFICADOR. Ni IP, ni
 * cookie, ni huella, ni identificador de sesión. Solo filas
 * agregadas con contadores. A partir de ellas es imposible
 * reconstruir el recorrido de una persona concreta, y esa es la
 * intención.
 *
 * La IP se usa en tránsito: Cloudflare deduce el país y la IP se
 * descarta sin escribirse.
 *
 * Entradas (POST):
 *   /             página vista
 *   /contexto     navegador, sistema, idioma, campaña (1 por visita)
 *   /clic         dónde se pulsa
 *   /lectura      hasta dónde se baja (25/50/75/100 %)
 *   /permanencia  cuánto se queda, por tramos
 *   /evento       acción con nombre
 *
 * Salidas (GET, con clave):
 *   /panel        cuadro de mando
 *   /stats        los mismos datos en JSON
 *
 * Variables: ORIGENES, CLAVE_PANEL. Enlace D1: DB.
 * ============================================================
 */

const LIMITE_BYTES = 4 * 1024;
const MAX_TEXTO = 120;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origen = request.headers.get("Origin") || "";
    const permitidos = (env.ORIGENES || "").split(",").map((o) => o.trim()).filter(Boolean);

    const cors = {
      "Access-Control-Allow-Origin": permitidos.includes(origen) ? origen : permitidos[0] || "",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      // Corto a propósito. Aquí no debería haber nunca comprobación
      // previa (todo va en text/plain), pero si un día se cuela un
      // despliegue que sí la provoque, el navegador se queda con la
      // respuesta cacheada y sigue sin medir aunque ya esté
      // arreglado. Con 86400 eso duraba un día entero.
      "Access-Control-Max-Age": "600",
      Vary: "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // --- Consulta: protegida por clave ---
    if (request.method === "GET" && (url.pathname === "/panel" || url.pathname === "/stats")) {
      if (!env.CLAVE_PANEL || url.searchParams.get("clave") !== env.CLAVE_PANEL) {
        return new Response("No autorizado", { status: 401 });
      }
      const f = filtros(url.searchParams);
      const datos = await resumen(env, f);
      if (url.pathname === "/stats") {
        return new Response(JSON.stringify(datos, null, 1), {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }
      const rutas = await listaDeRutas(env, f.entorno);
      const paises = await listaDe(env, f.entorno, "pais");
      return new Response(panel(datos, f, url.searchParams.get("clave"), rutas, paises), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (request.method !== "POST") return new Response("", { status: 405, headers: cors });
    if (origen && !permitidos.includes(origen)) return new Response("", { status: 403, headers: cors });

    let d;
    try {
      const cuerpo = await request.text();
      if (cuerpo.length > LIMITE_BYTES) return new Response("", { status: 413, headers: cors });
      d = JSON.parse(cuerpo);
    } catch (err) {
      return new Response("", { status: 400, headers: cors });
    }

    if (esRobot(request.headers.get("User-Agent") || "")) {
      return new Response(null, { status: 204, headers: cors });
    }

    const tarea = escribir(url.pathname, env, d, request);
    if (ctx && ctx.waitUntil) ctx.waitUntil(tarea.catch(() => {}));
    else await tarea.catch(() => {});

    return new Response(null, { status: 204, headers: cors });
  },
};

// ------------------------------------------------------------
// Escritura
// ------------------------------------------------------------
const hoy = () => new Date().toISOString().slice(0, 10);
const ent = (v) => (v === "pruebas" ? "pruebas" : "produccion");

async function escribir(camino, env, d, request) {
  switch (camino) {
    case "/contexto":
      return guardarContexto(env, d);
    case "/clic":
      return sumar(env, "clics", ["dia", "ruta", "elemento", "tipo", "entorno"], [
        hoy(), limpiarRuta(d.ruta), corta(d.elemento, 60) || "(sin texto)", tipoClic(d.tipo), ent(d.entorno),
      ]);
    case "/lectura": {
      const p = [25, 50, 75, 100].includes(Number(d.profundidad)) ? Number(d.profundidad) : 0;
      if (!p) return;
      return sumar(env, "lectura", ["dia", "ruta", "profundidad", "entorno"], [
        hoy(), limpiarRuta(d.ruta), p, ent(d.entorno),
      ]);
    }
    case "/permanencia": {
      const TRAMOS = ["0-10s", "10-30s", "30-60s", "1-3min", "3min+"];
      if (!TRAMOS.includes(d.tramo)) return;
      return sumar(env, "permanencia", ["dia", "ruta", "tramo", "entorno"], [
        hoy(), limpiarRuta(d.ruta), d.tramo, ent(d.entorno),
      ]);
    }
    case "/evento": {
      const n = corta(d.nombre, 60);
      if (!n) return;
      return sumar(env, "eventos", ["dia", "ruta", "nombre", "entorno"], [
        hoy(), limpiarRuta(d.ruta), n, ent(d.entorno),
      ]);
    }
    default:
      return guardarVisita(env, d, request);
  }
}

// Un UPSERT genérico: todas las tablas tienen la misma forma,
// clave compuesta más un contador.
function sumar(env, tabla, columnas, valores, contador) {
  const c = contador || "veces";
  const huecos = columnas.map((_, i) => "?" + (i + 1)).join(", ");
  return env.DB.prepare(
    `INSERT INTO ${tabla} (${columnas.join(", ")}, ${c}) VALUES (${huecos}, 1)
     ON CONFLICT (${columnas.join(", ")}) DO UPDATE SET ${c} = ${c} + 1`
  )
    .bind(...valores)
    .run();
}

async function guardarVisita(env, d, request) {
  const ahora = new Date();
  await env.DB.prepare(
    `INSERT INTO visitas (dia, hora, ruta, referente, pais, dispositivo, entorno, paginas, visitas)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8)
     ON CONFLICT (dia, hora, ruta, referente, pais, dispositivo, entorno)
     DO UPDATE SET paginas = paginas + 1, visitas = visitas + ?8`
  )
    .bind(
      ahora.toISOString().slice(0, 10),
      ahora.getUTCHours(),
      limpiarRuta(d.ruta),
      limpiarReferente(d.referente),
      (request.cf && request.cf.country) || "ND",
      dispositivo(d.ancho),
      ent(d.entorno),
      d.primera ? 1 : 0
    )
    .run();
}

async function guardarContexto(env, d) {
  const e = ent(d.entorno);
  const pares = [
    ["navegador", corta(d.navegador, 30)],
    ["sistema", corta(d.sistema, 30)],
    ["idioma", corta(d.idioma, 10)],
    ["campana", corta(d.campana, 40)],
  ];
  for (const [clase, valor] of pares) {
    if (!valor) continue;
    await sumar(env, "contexto", ["dia", "clase", "valor", "entorno"], [hoy(), clase, valor, e]);
  }
}

// ------------------------------------------------------------
// Limpieza de lo que llega del navegador
// ------------------------------------------------------------
const texto = (v) => typeof v === "string" && v.trim().length > 0;
const corta = (v, n) => (texto(v) ? v.trim().replace(/\s+/g, " ").slice(0, n) : "");

function tipoClic(v) {
  return ["enlace", "boton", "pestana", "detalle"].includes(v) ? v : "enlace";
}

function limpiarRuta(v) {
  if (!texto(v)) return "/";
  // Sin parámetros ni ancla: ahí es donde se cuelan datos
  // personales (un correo dentro de una utm, por ejemplo).
  let r = v.split("?")[0].split("#")[0].trim();
  if (!r.startsWith("/")) r = "/" + r;
  return r.slice(0, MAX_TEXTO);
}

function limpiarReferente(v) {
  if (!texto(v)) return "directo";
  try {
    const h = new URL(v).hostname.replace(/^www\./, "");
    return h ? h.slice(0, MAX_TEXTO) : "directo";
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
// Filtros
// ------------------------------------------------------------
const DIA = 86400000;
const fecha = (t) => new Date(t).toISOString().slice(0, 10);
const esFecha = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

function filtros(p) {
  const dias = Math.min(Math.max(Number(p.get("dias")) || 30, 1), 730);
  const hasta = esFecha(p.get("hasta")) ? p.get("hasta") : fecha(Date.now());
  const desde = esFecha(p.get("desde")) ? p.get("desde") : fecha(Date.parse(hasta) - (dias - 1) * DIA);
  const largo = Math.max(1, Math.round((Date.parse(hasta) - Date.parse(desde)) / DIA) + 1);
  return {
    desde,
    hasta,
    dias: largo,
    // Periodo anterior del mismo tamaño, para comparar.
    desdeAnt: fecha(Date.parse(desde) - largo * DIA),
    hastaAnt: fecha(Date.parse(desde) - DIA),
    entorno: ent(p.get("entorno")),
    dispositivo: ["movil", "tableta", "escritorio"].includes(p.get("dispositivo")) ? p.get("dispositivo") : "",
    pais: /^[A-Z]{2}$/.test(p.get("pais") || "") ? p.get("pais") : "",
    ruta: texto(p.get("ruta")) ? limpiarRuta(p.get("ruta")) : "",
  };
}

// Construye el WHERE y los valores. "completo" añade las
// columnas que solo existen en la tabla de visitas.
function donde(f, completo, desde, hasta) {
  const cond = ["dia >= ?", "dia <= ?", "entorno = ?"];
  const val = [desde || f.desde, hasta || f.hasta, f.entorno];
  if (f.ruta) {
    cond.push("ruta = ?");
    val.push(f.ruta);
  }
  if (completo && f.dispositivo) {
    cond.push("dispositivo = ?");
    val.push(f.dispositivo);
  }
  if (completo && f.pais) {
    cond.push("pais = ?");
    val.push(f.pais);
  }
  return { sql: cond.join(" AND "), val };
}

// ------------------------------------------------------------
// Consulta
// ------------------------------------------------------------
async function resumen(env, f) {
  const V = donde(f, true);
  const O = donde(f, false); // tablas sin país ni dispositivo
  const Vant = donde(f, true, f.desdeAnt, f.hastaAnt);

  const q = (sql, w) => env.DB.prepare(sql.replace("@W", w.sql)).bind(...w.val).all();
  const uno = async (sql, w) => ((await q(sql, w)).results || [])[0] || {};

  const [
    totales, totalesAnt, porDia, porHora, porRuta, entradas, porReferente,
    porPais, porDispositivo, contexto, clics, lectura, permanencia, eventos,
  ] = await Promise.all([
    uno(`SELECT SUM(paginas) p, SUM(visitas) v FROM visitas WHERE @W`, V),
    uno(`SELECT SUM(paginas) p, SUM(visitas) v FROM visitas WHERE @W`, Vant),
    q(`SELECT dia, SUM(paginas) paginas, SUM(visitas) visitas FROM visitas WHERE @W GROUP BY dia ORDER BY dia`, V),
    q(`SELECT hora, SUM(paginas) paginas FROM visitas WHERE @W GROUP BY hora ORDER BY hora`, V),
    q(`SELECT ruta, SUM(paginas) paginas, SUM(visitas) visitas FROM visitas WHERE @W GROUP BY ruta ORDER BY paginas DESC LIMIT 30`, V),
    q(`SELECT ruta, SUM(visitas) visitas FROM visitas WHERE @W GROUP BY ruta HAVING visitas > 0 ORDER BY visitas DESC LIMIT 15`, V),
    q(`SELECT referente, SUM(visitas) visitas FROM visitas WHERE @W AND visitas > 0 GROUP BY referente ORDER BY visitas DESC LIMIT 15`, V),
    q(`SELECT pais, SUM(visitas) visitas FROM visitas WHERE @W AND visitas > 0 GROUP BY pais ORDER BY visitas DESC LIMIT 15`, V),
    q(`SELECT dispositivo, SUM(paginas) paginas, SUM(visitas) visitas FROM visitas WHERE @W GROUP BY dispositivo ORDER BY paginas DESC`, V),
    q(`SELECT clase, valor, SUM(veces) veces FROM contexto WHERE @W GROUP BY clase, valor ORDER BY veces DESC`, O),
    q(`SELECT elemento, tipo, SUM(veces) veces FROM clics WHERE @W GROUP BY elemento, tipo ORDER BY veces DESC LIMIT 40`, O),
    q(`SELECT profundidad, SUM(veces) veces FROM lectura WHERE @W GROUP BY profundidad ORDER BY profundidad`, O),
    q(`SELECT tramo, SUM(veces) veces FROM permanencia WHERE @W GROUP BY tramo`, O),
    q(`SELECT nombre, SUM(veces) veces FROM eventos WHERE @W GROUP BY nombre ORDER BY veces DESC LIMIT 30`, O),
  ]);

  const r = (x) => x.results || [];
  const porClase = (c) => r(contexto).filter((x) => x.clase === c).map((x) => ({ valor: x.valor, veces: x.veces }));
  const sumaEventos = r(eventos).reduce((n, e) => n + Number(e.veces || 0), 0);
  const sumaClics = r(clics).reduce((n, e) => n + Number(e.veces || 0), 0);

  return {
    filtros: f,
    totales: {
      paginas: Number(totales.p || 0),
      visitas: Number(totales.v || 0),
      eventos: sumaEventos,
      clics: sumaClics,
    },
    anterior: { paginas: Number(totalesAnt.p || 0), visitas: Number(totalesAnt.v || 0) },
    porDia: r(porDia),
    porHora: r(porHora),
    porRuta: r(porRuta),
    entradas: r(entradas),
    porReferente: r(porReferente),
    porPais: r(porPais),
    porDispositivo: r(porDispositivo),
    navegadores: porClase("navegador"),
    sistemas: porClase("sistema"),
    idiomas: porClase("idioma"),
    campanas: porClase("campana"),
    clics: r(clics),
    lectura: r(lectura),
    permanencia: r(permanencia),
    eventos: r(eventos),
  };
}

async function listaDeRutas(env, entorno) {
  const x = await env.DB.prepare(
    `SELECT ruta, SUM(paginas) p FROM visitas WHERE entorno = ? GROUP BY ruta ORDER BY p DESC LIMIT 60`
  ).bind(entorno).all();
  return (x.results || []).map((r) => r.ruta);
}

async function listaDe(env, entorno, columna) {
  const x = await env.DB.prepare(
    `SELECT ${columna} v, SUM(visitas) n FROM visitas WHERE entorno = ? GROUP BY ${columna} ORDER BY n DESC LIMIT 40`
  ).bind(entorno).all();
  return (x.results || []).map((r) => r.v);
}

// ------------------------------------------------------------
// Cuadro de mando
// ------------------------------------------------------------
function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const num = (n) => Number(n || 0).toLocaleString("es-ES");

function variacion(ahora, antes) {
  if (!antes) return ahora ? '<span class="var sube">nuevo</span>' : "";
  const p = Math.round(((ahora - antes) / antes) * 100);
  if (p === 0) return '<span class="var igual">=</span>';
  return `<span class="var ${p > 0 ? "sube" : "baja"}">${p > 0 ? "▲" : "▼"} ${Math.abs(p)} %</span>`;
}

function barras(filas, etiqueta, valor, vacio, sufijo) {
  if (!filas.length) return `<p class="vacio">${esc(vacio)}</p>`;
  const tope = Math.max(...filas.map((f) => Number(f[valor]) || 0)) || 1;
  return (
    "<table>" +
    filas
      .map((f) => {
        const v = Number(f[valor]) || 0;
        return `<tr><td class="et"><span class="barra" style="width:${((v / tope) * 100).toFixed(1)}%"></span><span>${esc(
          f[etiqueta] || "—"
        )}</span></td><td class="n">${num(v)}${sufijo || ""}</td></tr>`;
      })
      .join("") +
    "</table>"
  );
}

const caja = (titulo, contenido, ancha) =>
  `<section class="caja${ancha ? " ancha" : ""}"><h2>${esc(titulo)}</h2>${contenido}</section>`;

function panel(d, f, clave, rutas, paises) {
  const t = d.totales;
  const porVisita = t.visitas ? (t.paginas / t.visitas).toFixed(1) : "—";
  const interaccion = t.visitas ? Math.round((t.eventos / t.visitas) * 100) : 0;

  // --- gráfico diario ---
  const maxDia = Math.max(1, ...d.porDia.map((x) => Number(x.paginas) || 0));
  const grafico = d.porDia
    .map(
      (x) => `<div class="dia" title="${esc(x.dia)}: ${num(x.visitas)} visitas · ${num(x.paginas)} páginas">
        <span class="pag" style="height:${((Number(x.paginas) || 0) / maxDia) * 100}%"></span>
        <span class="vis" style="height:${((Number(x.visitas) || 0) / maxDia) * 100}%"></span></div>`
    )
    .join("");

  // --- franja horaria ---
  const porHora = [];
  for (let h = 0; h < 24; h++) {
    const fila = d.porHora.find((x) => Number(x.hora) === h);
    porHora.push(Number(fila ? fila.paginas : 0));
  }
  const maxHora = Math.max(1, ...porHora);
  const horas = porHora
    .map(
      (v, h) =>
        `<div class="hora" title="${h}:00 UTC · ${num(v)} páginas"><span style="height:${(v / maxHora) * 100}%"></span><i>${
          h % 6 === 0 ? h : ""
        }</i></div>`
    )
    .join("");

  // --- lectura: % de páginas vistas que llegan a cada hito ---
  const base = d.lectura.find((x) => Number(x.profundidad) === 25);
  const refLectura = Number(base ? base.veces : 0) || t.paginas || 1;
  const prof = [25, 50, 75, 100].map((p) => {
    const fila = d.lectura.find((x) => Number(x.profundidad) === p);
    const v = Number(fila ? fila.veces : 0);
    return { etiqueta: p + " % de la página", veces: v, pct: Math.round((v / refLectura) * 100) };
  });

  const ORDEN = ["0-10s", "10-30s", "30-60s", "1-3min", "3min+"];
  const perm = ORDEN.map((x) => {
    const fila = d.permanencia.find((y) => y.tramo === x);
    return { tramo: x, veces: Number(fila ? fila.veces : 0) };
  }).filter((x) => x.veces > 0);

  const opciones = (lista, actual, vacio) =>
    `<option value="">${esc(vacio)}</option>` +
    lista.map((x) => `<option value="${esc(x)}"${x === actual ? " selected" : ""}>${esc(x)}</option>`).join("");

  const clicsPorTipo = (tipo) => d.clics.filter((c) => c.tipo === tipo);

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Estadísticas · Valentramites</title>
<style>
  :root{--ink:#10243d;--suave:#56657a;--linea:rgba(16,36,61,.12);--oro:#c08a3e;
        --fondo:#f7f8fa;--caja:#fff;--verde:#1d7a4c;--rojo:#b1402f}
  *{box-sizing:border-box}
  body{margin:0;background:var(--fondo);color:var(--ink);font:15px/1.5 Inter,"Segoe UI",system-ui,sans-serif}
  header{background:var(--ink);color:#fff;padding:1.3rem 1.2rem .1rem}
  .env{max-width:1240px;margin:0 auto}
  h1{margin:0;font-size:1.2rem}
  .sub{opacity:.72;font-size:.84rem;margin:.25rem 0 1rem}
  form.filtros{display:flex;flex-wrap:wrap;gap:.5rem;align-items:flex-end;
               max-width:1240px;margin:0 auto;padding:0 0 1.1rem}
  .campo{display:flex;flex-direction:column;gap:.2rem}
  .campo label{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;opacity:.65}
  .filtros select,.filtros input{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.25);
    border-radius:7px;padding:.4rem .55rem;font:inherit;font-size:.86rem;min-width:110px}
  .filtros select option{color:#10243d}
  .filtros button{background:var(--oro);color:#10243d;border:0;border-radius:7px;
    padding:.48rem 1rem;font:inherit;font-weight:600;cursor:pointer}
  .atajos{display:flex;gap:.4rem;flex-wrap:wrap;max-width:1240px;margin:0 auto;padding:0 0 1.1rem}
  .atajos a{font-size:.8rem;color:rgba(255,255,255,.8);text-decoration:none;
    border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:.22rem .7rem}
  .atajos a.on{background:#fff;color:#10243d;border-color:#fff;font-weight:600}
  .rejilla{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));
           max-width:1240px;margin:1.2rem auto;padding:0 1.2rem}
  .caja{background:var(--caja);border:1px solid var(--linea);border-radius:12px;padding:1.05rem 1.15rem}
  .caja h2{margin:0 0 .75rem;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--suave)}
  .ancha{grid-column:1/-1}
  .cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:1.1rem}
  .cifra b{display:block;font-size:1.9rem;line-height:1.1}
  .cifra span{font-size:.78rem;color:var(--suave)}
  .var{font-size:.72rem;font-weight:600;margin-left:.3rem;vertical-align:.35em}
  .sube{color:var(--verde)} .baja{color:var(--rojo)} .igual{color:var(--suave)}
  .grafico{display:flex;align-items:flex-end;gap:2px;height:150px}
  .dia{flex:1;height:100%;display:flex;align-items:flex-end;min-width:3px;position:relative}
  .dia span{position:absolute;bottom:0;border-radius:2px 2px 0 0;min-height:1px}
  .dia .pag{width:100%;background:rgba(22,58,99,.22)}
  .dia .vis{width:100%;background:var(--ink)}
  .dia:hover .vis{background:var(--oro)}
  .reloj{display:flex;align-items:flex-end;gap:2px;height:80px}
  .hora{flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;position:relative}
  .hora span{background:rgba(22,58,99,.5);border-radius:2px 2px 0 0;min-height:1px}
  .hora i{font-style:normal;font-size:.6rem;color:var(--suave);text-align:center;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:.88rem}
  td{padding:.28rem 0;vertical-align:middle}
  .et{position:relative;padding-left:.45rem;overflow-wrap:anywhere}
  .et .barra{position:absolute;left:0;top:2px;bottom:2px;background:rgba(192,138,62,.18);border-radius:3px}
  .et span:last-child{position:relative}
  .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;padding-left:.7rem;color:var(--suave)}
  .vacio{color:var(--suave);font-size:.87rem;margin:0}
  .leyenda{font-size:.73rem;color:var(--suave);margin:.5rem 0 0}
  .pie{max-width:1240px;margin:0 auto 2.5rem;padding:0 1.2rem;color:var(--suave);font-size:.8rem;line-height:1.6}
  @media(prefers-color-scheme:dark){
    :root{--fondo:#0d1420;--ink:#e8edf5;--suave:#8fa0b8;--linea:rgba(255,255,255,.1);--caja:#141d2d;
          --verde:#54c08a;--rojo:#e08273}
    header{background:#09101a}
    .dia .vis{background:#4e86c4} .dia .pag{background:rgba(78,134,196,.25)}
    .hora span{background:rgba(78,134,196,.55)}
  }
</style></head><body>

<header>
  <div class="env">
    <h1>Estadísticas · Valentramites</h1>
    <p class="sub">Del ${esc(d.filtros.desde)} al ${esc(d.filtros.hasta)} · ${esc(d.filtros.entorno)} · sin cookies y sin terceros</p>
  </div>
  <div class="atajos">
    ${[7, 30, 90, 365]
      .map(
        (n) =>
          `<a class="${d.filtros.dias === n ? "on" : ""}" href="?clave=${esc(clave)}&dias=${n}&entorno=${esc(
            d.filtros.entorno
          )}">${n} días</a>`
      )
      .join("")}
    <a class="${d.filtros.entorno === "produccion" ? "on" : ""}" href="?clave=${esc(clave)}&dias=${d.filtros.dias}&entorno=produccion">producción</a>
    <a class="${d.filtros.entorno === "pruebas" ? "on" : ""}" href="?clave=${esc(clave)}&dias=${d.filtros.dias}&entorno=pruebas">pruebas</a>
  </div>
  <form class="filtros" method="get">
    <input type="hidden" name="clave" value="${esc(clave)}">
    <div class="campo"><label for="desde">Desde</label><input type="date" id="desde" name="desde" value="${esc(d.filtros.desde)}"></div>
    <div class="campo"><label for="hasta">Hasta</label><input type="date" id="hasta" name="hasta" value="${esc(d.filtros.hasta)}"></div>
    <div class="campo"><label for="entorno">Entorno</label><select id="entorno" name="entorno">
      <option value="produccion"${d.filtros.entorno === "produccion" ? " selected" : ""}>producción</option>
      <option value="pruebas"${d.filtros.entorno === "pruebas" ? " selected" : ""}>pruebas</option>
    </select></div>
    <div class="campo"><label for="dispositivo">Dispositivo</label><select id="dispositivo" name="dispositivo">
      ${opciones(["movil", "tableta", "escritorio"], d.filtros.dispositivo, "todos")}
    </select></div>
    <div class="campo"><label for="pais">País</label><select id="pais" name="pais">
      ${opciones(paises, d.filtros.pais, "todos")}
    </select></div>
    <div class="campo"><label for="ruta">Página</label><select id="ruta" name="ruta">
      ${opciones(rutas, d.filtros.ruta, "todas")}
    </select></div>
    <button type="submit">Aplicar</button>
  </form>
</header>

<div class="rejilla">

  ${caja(
    "Resumen · comparado con los " + d.filtros.dias + " días anteriores",
    `<div class="cifras">
      <div class="cifra"><b>${num(t.visitas)}${variacion(t.visitas, d.anterior.visitas)}</b><span>visitas</span></div>
      <div class="cifra"><b>${num(t.paginas)}${variacion(t.paginas, d.anterior.paginas)}</b><span>páginas vistas</span></div>
      <div class="cifra"><b>${porVisita}</b><span>páginas por visita</span></div>
      <div class="cifra"><b>${num(t.clics)}</b><span>clics medidos</span></div>
      <div class="cifra"><b>${num(t.eventos)}</b><span>acciones de valor</span></div>
      <div class="cifra"><b>${interaccion} %</b><span>visitas que actúan</span></div>
    </div>
    <p class="leyenda">«Acciones de valor» son WhatsApp, llamada, correo, abrir un test, enviar una consulta
    o darse de alta en el aviso. El porcentaje es acciones entre visitas: por encima de 100 % significa
    que una misma visita hace varias.</p>`,
    true
  )}

  ${caja(
    "Evolución diaria",
    d.porDia.length
      ? `<div class="grafico">${grafico}</div>
         <p class="leyenda">Barra oscura: visitas. Fondo claro: páginas vistas.</p>`
      : '<p class="vacio">Todavía no hay datos en este periodo.</p>',
    true
  )}

  ${caja(
    "A qué hora entran (UTC)",
    d.porHora.length ? `<div class="reloj">${horas}</div>` : '<p class="vacio">Sin datos.</p>',
    true
  )}

  ${caja("Páginas más vistas", barras(d.porRuta, "ruta", "paginas", "Sin datos."))}
  ${caja("Por dónde entran", barras(d.entradas, "ruta", "visitas", "Sin datos."))}
  ${caja("De dónde llegan", barras(d.porReferente, "referente", "visitas", "Sin datos."))}
  ${caja("Campañas", barras(d.campanas, "valor", "veces", "Ninguna visita con etiqueta de campaña. Añada ?utm_campaign=lo-que-sea a los enlaces que reparta."))}
  ${caja("Países", barras(d.porPais, "pais", "visitas", "Sin datos."))}
  ${caja("Dispositivos", barras(d.porDispositivo, "dispositivo", "paginas", "Sin datos."))}
  ${caja("Navegadores", barras(d.navegadores, "valor", "veces", "Sin datos."))}
  ${caja("Sistemas", barras(d.sistemas, "valor", "veces", "Sin datos."))}
  ${caja("Idioma del navegador", barras(d.idiomas, "valor", "veces", "Sin datos."))}

  ${caja(
    "Hasta dónde leen",
    prof.some((p) => p.veces)
      ? barras(prof, "etiqueta", "veces", "Sin datos.") +
          `<p class="leyenda">De quien empieza a bajar, un ${prof[3].pct} % llega al final.</p>`
      : '<p class="vacio">Sin datos.</p>'
  )}

  ${caja("Cuánto se quedan", perm.length ? barras(perm, "tramo", "veces", "Sin datos.") : '<p class="vacio">Sin datos.</p>')}

  ${caja("Acciones de valor", barras(d.eventos, "nombre", "veces", "Todavía nadie ha hecho nada medible."), true)}

  ${caja(
    "Dónde pulsan · enlaces",
    barras(clicsPorTipo("enlace"), "elemento", "veces", "Sin datos."),
    true
  )}
  ${caja("Dónde pulsan · botones", barras(clicsPorTipo("boton"), "elemento", "veces", "Sin datos."))}
  ${caja("Dónde pulsan · pestañas", barras(clicsPorTipo("pestana"), "elemento", "veces", "Sin datos."))}
  ${caja("Preguntas que despliegan", barras(clicsPorTipo("detalle"), "elemento", "veces", "Sin datos."))}

</div>

<p class="pie">
  <strong>No se guarda ninguna IP, ninguna cookie ni ningún identificador.</strong> La base de datos solo
  contiene contadores agregados, así que no se puede reconstruir el recorrido de una persona concreta.
  Por el mismo motivo no hay «visitantes nuevos frente a recurrentes»: saber si alguien ya había venido
  exigiría dejarle algo guardado en el navegador de un día para otro, y eso es justo lo que esta web
  promete no hacer.<br>
  Lo que se pulsa dentro del test de subvenciones <strong>no se mide</strong>: sus opciones incluyen
  situaciones personales delicadas y contarlas no se justifica por saber qué botón se usa más. Sí se mide
  que el test se abre.<br>
  Las horas son UTC. En invierno España va una hora por delante.
</p>
</body></html>`;
}
