/**
 * ============================================================
 * Valentramites — Vigilancia de convocatorias
 * ------------------------------------------------------------
 * Consulta la BDNS (Base de Datos Nacional de Subvenciones), el
 * registro donde por ley se publican todas las convocatorias de
 * España, y deja un informe con las que pueden interesar al
 * despacho: las de la Comunitat Valenciana dirigidas a empresas
 * y personas autónomas.
 *
 *   node vigilancia/buscar-ayudas.mjs
 *
 * Escribe vigilancia/informe.md y actualiza vigilancia/vistas.json
 * para no volver a avisar de lo mismo.
 *
 * Los criterios están todos aquí arriba, para poder afinarlos sin
 * tocar el resto del programa.
 * ============================================================
 */

import fs from "node:fs";
import path from "node:path";

// --- Criterios de búsqueda --------------------------------------

// Días hacia atrás que se revisan en cada pasada. Con margen sobre
// la semana, por si una ejecución falla.
const DIAS = Number(process.env.DIAS || 10);

// Comunitat Valenciana y sus tres provincias, según la BDNS.
const REGIONES = [54, 55, 56, 57];

// Convocatorias locales que se tienen en cuenta. Las de pueblos
// alejados se descartan: son ayudas pequeñas para sus vecinos.
// Añada o quite municipios según dónde estén sus clientes.
const MUNICIPIOS = [
  "VALENCIA",
  "DIPUTACION PROV. DE VALENCIA",
  "PAIPORTA", "CATARROJA", "ALFAFAR", "BENETUSSER", "SEDAVI", "MASSANASSA",
  "PICANYA", "TORRENT", "ALDAIA", "ALAQUAS", "MISLATA", "QUART DE POBLET",
  "BURJASSOT", "PATERNA", "XIRIVELLA", "MANISES", "ALBAL", "SILLA",
];

// Solo interesan las que pueden pedir empresas o autónomos. Esto
// descarta de un golpe las nominativas a fallas, clubes y
// asociaciones, que son la mayor parte de lo que se publica.
const DESTINATARIOS = ["PYME", "EMPRESA", "FISICAS QUE DESARROLLAN"];

// Por debajo de esta cifra rara vez compensa el trabajo de tramitar.
// Ponga 0 para no descartar ninguna por importe.
const PRESUPUESTO_MINIMO = Number(process.env.PRESUPUESTO_MINIMO || 20000);

// --- Fin de los criterios ---------------------------------------

const API = "https://www.infosubvenciones.es/bdnstrans/api";
const FICHA = "https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria/";
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// La BDNS responde en Latin-1 sin declararlo: si se lee como UTF-8,
// los acentos llegan rotos. Además limita la frecuencia de consultas
// y contesta 429 si se le aprieta, así que se reintenta esperando
// cada vez un poco más.
async function pedir(url, intento = 1) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if ((res.status === 429 || res.status >= 500) && intento <= 4) {
    await esperar(1500 * intento);
    return pedir(url, intento + 1);
  }
  if (!res.ok) throw new Error("BDNS respondió " + res.status);

  // La BDNS no usa una sola codificación: hay registros en Latin-1 y
  // otros en UTF-8, mezclados en la misma respuesta. Se lee todo como
  // Latin-1 puro —que nunca falla y conserva el byte original— y
  // después se repara texto a texto.
  //
  // Se usa Buffer y no TextDecoder porque este último trata "latin1"
  // como windows-1252, que cambia unos cuantos bytes y estropea la
  // reconstrucción.
  const crudo = Buffer.from(await res.arrayBuffer()).toString("latin1");
  return reparar(JSON.parse(crudo));
}

// Si un texto son en realidad bytes UTF-8 leídos como Latin-1
// ("RESOLUCIÃ“N"), al devolverlos a bytes y releerlos como UTF-8 se
// recompone ("RESOLUCIÓN"). Si no lo eran, la relectura deja
// caracteres de sustitución y se conserva el texto original.
function repararTexto(t) {
  if (!/[ÃÂ]/.test(t)) return t;
  const recompuesto = Buffer.from(t, "latin1").toString("utf8");
  return recompuesto.includes("�") ? t : recompuesto;
}

function reparar(v) {
  if (typeof v === "string") return repararTexto(v);
  if (Array.isArray(v)) return v.map(reparar);
  if (v && typeof v === "object") {
    const salida = {};
    for (const k of Object.keys(v)) salida[k] = reparar(v[k]);
    return salida;
  }
  return v;
}

const sinAcentos = (t) =>
  String(t || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();

const fechaBDNS = (d) =>
  String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();

const euros = (n) =>
  n ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €" : "no consta";

function interesaPorTerritorio(c) {
  const n1 = sinAcentos(c.nivel1);
  if (n1 === "AUTONOMICA" || n1 === "ESTATAL") return true;
  if (n1 !== "LOCAL") return false;
  const n2 = sinAcentos(c.nivel2);
  return MUNICIPIOS.some((m) => n2 === m || n2.startsWith(m + "/"));
}

const interesaPorDestinatario = (tipos) => {
  const t = sinAcentos((tipos || []).map((x) => x.descripcion).join(" · "));
  return DESTINATARIOS.some((d) => t.includes(d));
};

// ------------------------------------------------------------
async function main() {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - DIAS * 86400000);

  const parametros = new URLSearchParams({
    vpd: "GE",
    page: "0",
    pageSize: "500",
    order: "fechaRecepcion",
    direccion: "desc",
    fechaDesde: fechaBDNS(desde),
    fechaHasta: fechaBDNS(hasta),
  });
  REGIONES.forEach((r) => parametros.append("regiones", String(r)));

  const busqueda = await pedir(API + "/convocatorias/busqueda?" + parametros);
  const todas = busqueda.content || [];

  const rutaVistas = path.join(AQUI, "vistas.json");
  const vistas = fs.existsSync(rutaVistas)
    ? JSON.parse(fs.readFileSync(rutaVistas, "utf8"))
    : { codigos: [] };
  const yaVistas = new Set(vistas.codigos);

  const candidatas = todas.filter(
    (c) => interesaPorTerritorio(c) && !yaVistas.has(String(c.numeroConvocatoria))
  );

  const utiles = [];
  for (const c of candidatas) {
    let d;
    try {
      d = await pedir(API + "/convocatorias?vpd=GE&numConv=" + c.numeroConvocatoria);
    } catch (err) {
      console.error("No se pudo leer " + c.numeroConvocatoria + ": " + err.message);
      continue;
    }
    if (!interesaPorDestinatario(d.tiposBeneficiarios)) continue;
    if (PRESUPUESTO_MINIMO && (d.presupuestoTotal || 0) < PRESUPUESTO_MINIMO) continue;
    utiles.push({ ...c, ...d });
    await esperar(400);
  }

  // Se anotan todas las revisadas, no solo las útiles: así no se
  // vuelven a consultar sus fichas la semana que viene.
  vistas.codigos = [
    ...new Set([...vistas.codigos, ...candidatas.map((c) => String(c.numeroConvocatoria))]),
  ].slice(-3000);
  vistas.ultimaRevision = new Date().toISOString();
  fs.writeFileSync(rutaVistas, JSON.stringify(vistas, null, 2) + "\n", "utf8");

  fs.writeFileSync(path.join(AQUI, "informe.md"), informe(utiles, todas.length, candidatas.length, DIAS), "utf8");

  console.log(
    `${todas.length} publicadas en la Comunitat · ${candidatas.length} en el ámbito del despacho · ${utiles.length} para empresas y autónomos`
  );
  console.log("HAY=" + (utiles.length ? "si" : "no"));
  console.log("CUANTAS=" + utiles.length);
}

function informe(utiles, total, candidatas, dias) {
  const l = [];
  l.push(`Revisión de los últimos **${dias} días** en la BDNS.`);
  l.push("");
  l.push(
    `\`${total}\` convocatorias publicadas en la Comunitat Valenciana · ` +
      `\`${candidatas}\` en el ámbito del despacho · ` +
      `**\`${utiles.length}\` dirigidas a empresas o personas autónomas**.`
  );
  l.push("");

  if (!utiles.length) {
    l.push("Esta semana no ha salido nada que encaje con los criterios.");
    return l.join("\n");
  }

  l.push("---");
  for (const c of utiles) {
    const plazo = c.fechaFinSolicitud
      ? "hasta el " + c.fechaFinSolicitud.split("-").reverse().join("/")
      : (c.textInicio || "plazo sin fecha concreta").slice(0, 90);

    l.push("");
    l.push(`### ${c.descripcion}`);
    l.push("");
    l.push(`| | |`);
    l.push(`|---|---|`);
    l.push(`| **Convoca** | ${c.organo?.nivel2 || c.nivel2} |`);
    l.push(`| **Presupuesto** | ${euros(c.presupuestoTotal)} |`);
    l.push(`| **Plazo** | ${c.abierto ? "🟢 abierta · " : ""}${plazo} |`);
    l.push(`| **Dirigida a** | ${(c.tiposBeneficiarios || []).map((x) => x.descripcion).join(" · ")} |`);
    if (c.sectores?.length) {
      l.push(`| **Sectores** | ${c.sectores.slice(0, 4).map((x) => x.descripcion).join(" · ")} |`);
    }
    l.push(`| **Tipo** | ${c.tipoConvocatoria || "—"} |`);
    l.push("");
    l.push(`[Ficha en la BDNS](${FICHA}${c.codigoBDNS})` + (c.urlBasesReguladoras ? ` · [Bases reguladoras](${c.urlBasesReguladoras})` : ""));
    l.push("");
  }

  l.push("---");
  l.push("");
  l.push("**Para publicar alguna en la web**, dígaselo a Claude indicando el código BDNS:");
  l.push("redactará la ficha y el test en la rama `pruebas` para que los revise antes de publicarlos.");
  return l.join("\n");
}

main().catch((err) => {
  console.error("La vigilancia ha fallado:", err.message);
  process.exit(1);
});
