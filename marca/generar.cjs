// Genera los SVG de la marca a partir de:
//  - la V y el arco trazados sobre el original (rutas.json, origen 225,180)
//  - "alentramites" en Merriweather Bold (SIL OFL), convertido a trazados,
//    con tamaño, línea base y posición de cada letra ajustados al original
const fs = require("fs");
const opentype = require("opentype.js");
const R = JSON.parse(fs.readFileSync("rutas.json", "utf8"));
const buf = fs.readFileSync("merriweather-700.woff");
const fuente = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const size = 194, base = 421;
const xs = [483, 587, 638, 734, 851, 918, 1004, 1099, 1277, 1332, 1401, 1509];
const texto = [..."alentramites"].map((ch, i) => fuente.charToGlyph(ch).getPath(xs[i], base, size).toPathData(1)).join("");

const AZUL = "#0b3566";
const V = (id, desde, hasta) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${desde}"/><stop offset="1" stop-color="${hasta}"/></linearGradient>`;
const marcaV = (relleno) => `<path fill="${relleno}" d="${R.izq}"/><path fill="${relleno}" d="${R.der}"/>`;
const cabecera = (vb, titulo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${titulo}">\n<title>${titulo}</title>\n`;

// 1. Logotipo completo (fondo transparente). Caja: x 228–1606, y 183–470
fs.writeFileSync("logo.svg",
  cabecera("228 183 1378 287", "Valentramites") +
  `<defs>${V("v", "#174b84", "#0a2f5e")}</defs>\n` +
  `<g transform="translate(225 180)">\n<path fill="#d89a42" d="${R.arco}"/>\n${marcaV("url(#v)")}\n</g>\n` +
  `<path fill="${AZUL}" d="${texto}"/>\n</svg>\n`);

// 2. Versión en blanco, para fondos oscuros (pie de página)
fs.writeFileSync("logo-blanco.svg",
  cabecera("228 183 1378 287", "Valentramites") +
  `<g transform="translate(225 180)">\n<path fill="#e3b068" d="${R.arco}"/>\n${marcaV("#ffffff")}\n</g>\n` +
  `<path fill="#ffffff" d="${texto}"/>\n</svg>\n`);

// La V ocupa en el recorte x 7–317, y 64–287 (≈310×223). Se centra en un cuadrado.
const lado = 400, vx = (lado - 310) / 2 - 7, vy = (lado - 223) / 2 - 64 + 6;

// 3. Icono: V blanca sobre cuadrado azul redondeado (favicon, app, redes)
fs.writeFileSync("icono.svg",
  cabecera(`0 0 ${lado} ${lado}`, "Valentramites") +
  `<defs>${V("f", "#124279", "#0a2f5e")}</defs>\n<rect width="${lado}" height="${lado}" rx="88" fill="url(#f)"/>\n` +
  `<g transform="translate(${vx} ${vy})">${marcaV("#ffffff")}</g>\n</svg>\n`);

// 4. Solo la V, en azul, sin fondo
fs.writeFileSync("simbolo.svg",
  cabecera("232 243 256 225", "Valentramites") +
  `<defs>${V("v", "#174b84", "#0a2f5e")}</defs>\n<g transform="translate(225 180)">${marcaV("url(#v)")}</g>\n</svg>\n`);

for (const f of ["logo.svg", "logo-blanco.svg", "icono.svg", "simbolo.svg"]) console.log(f.padEnd(18), fs.statSync(f).size, "bytes");
