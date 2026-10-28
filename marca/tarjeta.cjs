/**
 * ============================================================
 * Valentramites — Tarjeta de visita lista para imprenta
 * ------------------------------------------------------------
 *   cd marca && npm install && node tarjeta.cjs
 *
 * Deja cuatro archivos:
 *   tarjeta-anverso.svg / tarjeta-reverso.svg  → vectorial, editable
 *   tarjeta-visita.pdf                         → las dos caras, para la imprenta
 *   tarjeta-vista-previa.png                   → para mirarla antes de encargarla
 *
 * Se construye primero en SVG y de ahí salen el PDF y la vista
 * previa, de modo que las tres cosas son la misma. El texto va
 * convertido en trazados, igual que en el logotipo: así la
 * imprenta no necesita tener las tipografías ni puede sustituirlas
 * por otras sin que nos enteremos.
 *
 * Medidas: 85 × 55 mm, el estándar español, más 3 mm de sangre
 * por lado. El SVG mide por tanto 91 × 61 mm.
 * ============================================================
 */

const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const SVGtoPDF = require("svg-to-pdfkit");
const { Resvg } = require("@resvg/resvg-js");
const { PNG } = require("pngjs");
const jsQR = require("jsqr");

// --- Lo que dice la tarjeta -------------------------------------
const DATOS = {
  nombre: "Fabian Okue Kung Mangue",
  cargo: "Economista · Colegiado 3692 COEV",
  telefono: "+34 613 95 02 55",
  email: "hola@valentramites.com",
  web: "valentramites.com",
  url: "https://valentramites.com",
  reclamo: "Fiscal · Contable · Laboral · Comercio exterior",
};

// --- Colores, los mismos de la web ------------------------------
const AZUL = "#10243d";
const DORADO = "#c08a3e";
const GRIS = "#56657a";
const AZUL_CLARO = "#9fb0c7";
const BLANCO = "#ffffff";

// --- Medidas, en milímetros -------------------------------------
const ANCHO = 85;
const ALTO = 55;
const SANGRE = 3;
const W = ANCHO + SANGRE * 2; // 91
const H = ALTO + SANGRE * 2; // 61
const MARGEN = 7; // zona de seguridad desde el corte

const AQUI = __dirname;
const F = (n) => {
  const b = fs.readFileSync(path.join(AQUI, "fuentes", n));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const FUENTES = {
  serif: F("source-serif-4-600.ttf"),
  normal: F("inter-400.ttf"),
  media: F("inter-600.ttf"),
  negrita: F("inter-700.ttf"),
};

// ----------------------------------------------------------------
// Texto a trazados. `tracking` separa las letras, que es lo que
// pide una línea en versales pequeñas.
// ----------------------------------------------------------------
function ancho(fuente, texto, tam, tracking = 0) {
  return fuente.getAdvanceWidth(texto, tam) + tracking * Math.max(0, texto.length - 1);
}

function texto(fuente, cadena, x, y, tam, color, opciones = {}) {
  const { tracking = 0, align = "left" } = opciones;
  let cursor = x;
  if (align === "center") cursor = x - ancho(fuente, cadena, tam, tracking) / 2;
  if (align === "right") cursor = x - ancho(fuente, cadena, tam, tracking);

  let d = "";
  for (const ch of cadena) {
    const glifo = fuente.charToGlyph(ch);
    d += glifo.getPath(cursor, y, tam).toPathData(3);
    cursor += (glifo.advanceWidth / fuente.unitsPerEm) * tam + tracking;
  }
  return `<path fill="${color}" d="${d}"/>`;
}

// Parte una cadena en las lineas que quepan en `maxAncho`.
// Sin esto hay que ir midiendo a ojo, y se acaba metiendo el
// nombre por debajo del QR.
function partir(fuente, cadena, tam, maxAncho, tracking = 0) {
  const palabras = cadena.split(" ");
  const lineas = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? actual + " " + p : p;
    if (actual && ancho(fuente, prueba, tam, tracking) > maxAncho) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

const envoltura = (contenido) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">\n${contenido}\n</svg>\n`;

// ----------------------------------------------------------------
// Anverso: el logotipo y poco más.
// Es la cara que se mira primero; el minimalismo tipográfico
// funciona porque no compite con nada.
// ----------------------------------------------------------------
function anverso(logo) {
  const cx = W / 2;
  const anchoLogo = 48;
  const altoLogo = anchoLogo * (287 / 1378); // proporción del viewBox del logotipo

  return envoltura(`
  <rect width="${W}" height="${H}" fill="${BLANCO}"/>
  <svg x="${cx - anchoLogo / 2}" y="${H / 2 - altoLogo / 2 - 3}" width="${anchoLogo}" height="${altoLogo}" viewBox="228 183 1378 287">${logo}</svg>
  <rect x="${cx - 7}" y="${H / 2 + 5.5}" width="14" height="0.4" fill="${DORADO}"/>
  ${texto(FUENTES.normal, DATOS.reclamo.toUpperCase(), cx, H / 2 + 11.2, 2.35, GRIS, { align: "center", tracking: 0.22 })}
`);
}

// ----------------------------------------------------------------
// Reverso: el azul de la web, los datos y el QR.
//
// La columna de texto tiene ancho fijo y el texto se parte solo:
// el nombre es largo y a ojo se colaba por debajo del QR.
// ----------------------------------------------------------------
function reverso(qr) {
  const x = SANGRE + MARGEN;

  // El QR va sobre un recuadro blanco aunque el fondo sea azul:
  // los lectores no siempre aceptan un codigo invertido, y una
  // tarjeta cuyo QR no se lee no sirve para nada.
  const panel = 25;
  const ladoQr = 19;
  const panelX = W - SANGRE - MARGEN - panel;
  const panelY = 16.5;

  // La columna de texto termina antes del panel, con un canal de
  // 5 mm entre medias.
  const columna = panelX - 5 - x;

  // Posiciones fijas, no acumuladas: con el nombre a dos lineas
  // lo acumulado empujaba el cargo encima del bloque de contacto.
  const Y = { nombre: 15.2, interlinea: 5.2, filete: 23.4, cargo: 28.4 };

  const piezas = [];
  const nombre = partir(FUENTES.serif, DATOS.nombre, 4.5, columna);
  nombre.forEach((linea, k) => {
    piezas.push(texto(FUENTES.serif, linea, x, Y.nombre + k * Y.interlinea, 4.5, BLANCO));
  });

  piezas.push(`<rect x="${x}" y="${Y.filete}" width="9" height="0.4" fill="${DORADO}"/>`);

  partir(FUENTES.normal, DATOS.cargo, 2.4, columna).forEach((linea, k) => {
    piezas.push(texto(FUENTES.normal, linea, x, Y.cargo + k * 3.3, 2.4, AZUL_CLARO));
  });

  // Bloque de contacto, anclado abajo.
  const base = H - SANGRE - MARGEN;
  const dato = (etiqueta, valor, yEtiqueta, fuenteValor) => {
    piezas.push(texto(FUENTES.negrita, etiqueta, x, yEtiqueta, 1.9, DORADO, { tracking: 0.26 }));
    piezas.push(texto(fuenteValor, valor, x, yEtiqueta + 4.2, 3.1, BLANCO));
  };
  dato("TEL\u00c9FONO", DATOS.telefono, base - 14.6, FUENTES.media);
  dato("CORREO", DATOS.email, base - 5.4, FUENTES.normal);

  // Si algun dia se alarga el cargo y vuelve a invadir el bloque de
  // contacto, que se note al generar y no en la imprenta.
  const finCargo = Y.cargo + (partir(FUENTES.normal, DATOS.cargo, 2.4, columna).length - 1) * 3.3;
  if (finCargo > base - 14.6 - 3) {
    throw new Error("El cargo se solapa con el bloque de contacto: acortelo o suba Y.cargo");
  }

  // El QR, centrado en su panel, con los 3 mm de blanco alrededor
  // que la norma pide como zona de silencio.
  piezas.push(`<rect x="${panelX}" y="${panelY}" width="${panel}" height="${panel}" rx="1.6" fill="${BLANCO}"/>`);
  piezas.push(
    `<svg x="${panelX + (panel - ladoQr) / 2}" y="${panelY + (panel - ladoQr) / 2}" width="${ladoQr}" height="${ladoQr}" viewBox="0 0 ${qr.modulos} ${qr.modulos}">${qr.cuerpo}</svg>`
  );
  // La direccion va fuera del panel: dentro invadia la zona de
  // silencio del codigo.
  piezas.push(
    texto(FUENTES.media, DATOS.web, panelX + panel / 2, panelY + panel + 4.2, 2.4, AZUL_CLARO, {
      align: "center",
      tracking: 0.1,
    })
  );

  return envoltura(`
  <rect width="${W}" height="${H}" fill="${AZUL}"/>
${piezas.join("\n")}
`);
}

// ----------------------------------------------------------------
// Marcas de corte, para que la guillotina sepa dónde cortar.
// ----------------------------------------------------------------
function conMarcas(svg) {
  const largo = 2.4;
  const sep = 1.2;
  const lineas = [];
  for (const [px, dx] of [[SANGRE, -1], [SANGRE + ANCHO, 1]]) {
    for (const [py, dy] of [[SANGRE, -1], [SANGRE + ALTO, 1]]) {
      lineas.push(`<path d="M${px + dx * sep} ${py} H${px + dx * (sep + largo)}" stroke="#000" stroke-width="0.12"/>`);
      lineas.push(`<path d="M${px} ${py + dy * sep} V${py + dy * (sep + largo)}" stroke="#000" stroke-width="0.12"/>`);
    }
  }
  return svg.replace("</svg>\n", lineas.join("\n") + "\n</svg>\n");
}

// ----------------------------------------------------------------
async function main() {
  const logo = fs
    .readFileSync(path.join(AQUI, "..", "public", "assets", "logo.svg"), "utf8")
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<title>.*?<\/title>/, "");

  // Corrección alta: el QR va impreso y puede sufrir roces o un
  // recorte desafortunado. Es el nivel que más redundancia da.
  const qrSvg = await QRCode.toString(DATOS.url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
  });
  const modulos = Number(/viewBox="0 0 (\d+)/.exec(qrSvg)[1]);
  const cuerpo = qrSvg
    .replace(/^[\s\S]*?<path/, "<path")
    .replace(/<\/svg>\s*$/, "")
    .replace(/fill="#ffffff"/g, 'fill="none"')
    .replace(/fill="#000000"/g, `fill="${AZUL}"`);

  const caras = {
    "tarjeta-anverso.svg": conMarcas(anverso(logo)),
    "tarjeta-reverso.svg": conMarcas(reverso({ modulos, cuerpo })),
  };

  for (const [nombre, svg] of Object.entries(caras)) {
    fs.writeFileSync(path.join(AQUI, nombre), svg, "utf8");
    console.log(nombre.padEnd(24), (fs.statSync(path.join(AQUI, nombre)).size / 1024).toFixed(1) + " KB");
  }

  // --- Vista previa: las dos caras, una al lado de la otra ------
  const mm = 11.811; // 300 ppp
  const previa = [];
  for (const [i, svg] of Object.values(caras).entries()) {
    const r = new Resvg(svg, { fitTo: { mode: "width", value: Math.round(W * mm) } });
    previa.push({ x: i, png: r.render().asPng() });
  }
  fs.writeFileSync(path.join(AQUI, "tarjeta-anverso.png"), previa[0].png);
  fs.writeFileSync(path.join(AQUI, "tarjeta-reverso.png"), previa[1].png);
  console.log("tarjeta-*.png".padEnd(24), "vista previa a 300 ppp");

  // --- El QR tiene que leerse de verdad -------------------------
  // Mirando el PDF no se sabe: se descodifica de la imagen ya
  // rasterizada, que es lo mas parecido a lo que saldra impreso.
  const imagen = PNG.sync.read(previa[1].png);
  const leido = jsQR(new Uint8ClampedArray(imagen.data), imagen.width, imagen.height);
  if (!leido) {
    throw new Error("El QR de la tarjeta no se puede leer: no se genera nada");
  }
  if (leido.data !== DATOS.url) {
    throw new Error(`El QR apunta a ${leido.data} y deberia apuntar a ${DATOS.url}`);
  }
  console.log("QR".padEnd(24), `comprobado: lleva a ${leido.data}`);

  // --- PDF para la imprenta -------------------------------------
  const pt = 2.834645;
  const doc = new PDFDocument({
    size: [W * pt, H * pt],
    margin: 0,
    info: {
      Title: "Valentramites — tarjeta de visita",
      Author: DATOS.nombre,
      Subject: `${ANCHO} × ${ALTO} mm con ${SANGRE} mm de sangre`,
    },
  });
  const salida = path.join(AQUI, "tarjeta-visita.pdf");
  doc.pipe(fs.createWriteStream(salida));

  const svgs = Object.values(caras);
  SVGtoPDF(doc, svgs[0], 0, 0, { width: W * pt, height: H * pt, assumePt: true });
  doc.addPage({ size: [W * pt, H * pt], margin: 0 });
  SVGtoPDF(doc, svgs[1], 0, 0, { width: W * pt, height: H * pt, assumePt: true });
  doc.end();
  await new Promise((r) => doc.on("end", r));

  console.log(
    "tarjeta-visita.pdf".padEnd(24),
    `2 caras · ${W} × ${H} mm con sangre · ${(fs.statSync(salida).size / 1024).toFixed(0)} KB`
  );
}

main().catch((e) => {
  console.error("No se ha podido generar la tarjeta:", e.message);
  process.exit(1);
});
