# Marca Valentramites

Los archivos del logotipo que usa la web están en `public/assets/`:

| Archivo | Uso |
|---|---|
| `logo.svg` | Logotipo completo, sobre fondo claro (cabecera) |
| `logo-blanco.svg` | Logotipo completo en blanco, sobre fondo oscuro (pie) |
| `icono.svg` / `favicon.svg` | V blanca sobre cuadrado azul: pestaña del navegador, redes |
| `simbolo.svg` | Solo la V, en azul, sin fondo |
| `apple-touch-icon.png` | Icono de pantalla de inicio en iPhone (180 × 180) |
| `og-imagen.png` | Vista previa al compartir en WhatsApp y redes (1200 × 630) |

## Cómo se construyó

A partir de la imagen de referencia de la marca:

- **La V y el arco dorado** se trazaron midiendo su contorno sobre la imagen original y
  convirtiéndolo en curvas (`rutas.json`). Superpuestos al original, coinciden al píxel.
- **«alentramites»** está compuesto en **Merriweather Bold**, la fuente libre más parecida de
  las probadas, con el tamaño, la línea base y la posición de cada letra ajustados al original
  (79 % de coincidencia de superficie). El texto está convertido en trazados, así que el
  logotipo se ve igual en cualquier sitio, sin depender de tener la fuente.

Merriweather se distribuye con licencia SIL Open Font License, que permite este uso.

## Colores

| | |
|---|---|
| Azul del texto | `#0b3566` |
| V (degradado) | `#174b84` → `#0a2f5e` |
| Arco dorado | `#d89a42` |

## Tarjeta de visita

```bash
cd marca && npm install && npm run tarjeta
```

Deja cuatro archivos:

| Archivo | Para qué |
|---|---|
| `tarjeta-visita.pdf` | **Lo que se manda a la imprenta.** Dos caras, vectorial |
| `tarjeta-anverso.svg` · `tarjeta-reverso.svg` | Por si hay que retocar algo |
| `tarjeta-anverso.png` · `tarjeta-reverso.png` | Para mirarla antes de encargarla |

**85 × 55 mm**, el estándar español, **más 3 mm de sangre** por lado, con marcas de corte. El texto
va convertido en trazados, como el logotipo: la imprenta no necesita las tipografías ni puede
sustituirlas sin que nos enteremos.

> **El generador descodifica su propio QR antes de dar nada por bueno.** Si el código no se lee, o
> lleva a una dirección distinta de la de `DATOS.url`, se detiene y no escribe el PDF. Un QR roto
> no se ve mirando el archivo: se descubre con 500 tarjetas ya impresas.

Para cambiar el teléfono, el correo o el cargo, se edita `DATOS` al principio de
[`tarjeta.cjs`](tarjeta.cjs). Si el cargo se alarga tanto que invade el bloque de contacto, el
generador también se detiene y lo dice.

## Regenerar

Si hay que cambiar un color o una proporción, se edita `generar.cjs` y:

```bash
cd marca && npm install && npm run generar
```

Los archivos resultantes se copian a `public/assets/`.
