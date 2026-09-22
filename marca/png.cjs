const fs = require("fs");
const { Resvg } = require("@resvg/resvg-js");
const svg = (f) => fs.readFileSync(f, "utf8");
const png = (codigo, ancho, salida) => {
  const r = new Resvg(codigo, { fitTo: { mode: "width", value: ancho }, background: "rgba(0,0,0,0)" });
  fs.writeFileSync(salida, r.render().asPng());
  console.log(salida.padEnd(26), fs.statSync(salida).size, "bytes");
};

// Imagen para compartir en redes y WhatsApp (1200×630): logotipo centrado sobre fondo claro
const logo = svg("logo.svg").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>.*?<\/title>/, "");
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#f5f7f9"/>
<rect y="598" width="1200" height="32" fill="#10243d"/><rect y="594" width="1200" height="4" fill="#d89a42"/>
<svg x="170" y="190" width="860" height="179" viewBox="228 183 1378 287">${logo}</svg>
<text x="600" y="455" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#56657a">Gestoría y asesoría en València</text>
</svg>`;
png(og, 1200, "og-imagen.png");

// Icono de pantalla de inicio en iPhone (180×180): sin transparencia
png(svg("icono.svg"), 180, "apple-touch-icon.png");
