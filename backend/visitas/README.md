# Medición de visitas

Analítica propia de valentramites.com. **Sin cookies, sin terceros y sin guardar ni un solo
identificador.** Vive en Cloudflare, en un Worker aparte del receptor de contactos.

```
Navegador  →  Worker (valentramites-visitas)  →  D1
   │                                              │
   └── js/visitas.js, 4 KB                        └── seis tablas de contadores
```

## Por qué no se usa Google Analytics

Esta web la publica una asesoría que vende, entre otras cosas, tratar bien los datos de sus
clientes. Poner Google Analytics obligaría a un aviso de cookies, enviaría los datos de cada
visitante a un tercero fuera de la UE y contradiría la política de privacidad del propio sitio.
Medir las visitas no justifica nada de eso.

## El cuadro de mando

```
https://valentramites-visitas.gallart-alvaro.workers.dev/panel?clave=LA-CLAVE
```

La clave está en `backend/visitas/CLAVE-DEL-PANEL.txt`, que **no se sube al repositorio**. Si se
pierde, se genera otra con `npx wrangler secret put CLAVE_PANEL`.

Por defecto enseña **producción** y los últimos 30 días. Tiene barra de filtros —fechas, entorno,
dispositivo, país y página— y atajos de periodo. Los mismos datos en JSON están en `/stats` con la
misma clave.

| Bloque | Qué responde |
|---|---|
| Resumen | Visitas, páginas, clics, acciones de valor y % de visitas que actúan, **comparado con el periodo anterior** |
| Evolución diaria | Visitas y páginas, superpuestas |
| Franja horaria | A qué hora entran (UTC) |
| Páginas más vistas · Por dónde entran | Qué funciona, y cuál es la puerta de entrada |
| De dónde llegan · Campañas | Dominio de origen, y las `utm_campaign` que se repartan |
| Países · Dispositivos · Navegadores · Sistemas · Idioma | |
| Hasta dónde leen | 25 / 50 / 75 / 100 % de la página |
| Cuánto se quedan | Por tramos, de 10 segundos a más de 3 minutos |
| Dónde pulsan | Cuatro tablas: enlaces, botones, pestañas y preguntas desplegadas |
| Acciones de valor | WhatsApp, llamada, correo, test abierto, consulta enviada, alta en el aviso |

## Qué se guarda exactamente

**Ninguna tabla tiene una columna que identifique a nadie.** No hay IP, ni cookie, ni huella de
navegador, ni identificador de sesión. Son contadores agregados:

| Tabla | Clave | Cuenta |
|---|---|---|
| `visitas` | día · hora · ruta · referente · país · dispositivo · entorno | páginas y visitas |
| `eventos` | día · ruta · nombre · entorno | veces |
| `clics` | día · ruta · elemento · tipo · entorno | veces |
| `lectura` | día · ruta · profundidad · entorno | veces |
| `permanencia` | día · ruta · tramo · entorno | veces |
| `contexto` | día · clase · valor · entorno | veces |

`contexto` reúne las dimensiones de poca variedad —navegador, sistema, idioma y campaña— en una
sola tabla, para no multiplicar las filas de `visitas`. Se cuenta **una vez por visita**, no por
página.

A partir de esto **es imposible reconstruir el recorrido de una persona concreta**, y esa es
exactamente la intención.

### Cómo se cuentan las visitas sin seguir a nadie

El navegador guarda una marca en `sessionStorage` que dice «esta sesión ya está contada». Se borra
al cerrar la pestaña y **nunca sale del navegador**: al Worker solo llega un sí o un no en el campo
`primera`. Así se distingue una visita de cinco páginas de cinco visitas, sin que el servidor sepa
nunca quién es quién.

No es una cookie, no persiste entre sesiones y no sirve para seguir a nadie entre sitios web. Por
eso la medición no necesita banner de consentimiento: es medición de audiencia propia y agregada.
Además, **si el navegador envía «Do Not Track» no se registra nada**.

### Lo que se descarta a propósito

- **La ruta se limpia** de parámetros y anclas antes de guardarla. Ahí es donde se cuelan datos
  personales: una `utm` con el correo de alguien, por ejemplo. Hay una prueba que lo comprueba.
- Del **referente solo queda el dominio**. La búsqueda que trajo al visitante no se guarda.
- **Los clics dentro del test de subvenciones no se miden.** Sus opciones incluyen «víctima de
  violencia de género» o «discapacidad reconocida»: aunque el recuento sea agregado y no haya forma
  de saber quién pulsó qué, llevar eso a una base de analítica no se justifica por saber qué botón
  se usa más. Sí se mide que el test se abre y que se termina. La exclusión es la constante
  `SIN_MEDIR` de `visitas.js`, que también deja fuera los formularios.
- **No hay coordenadas del ratón.** Con un diseño que se adapta a la pantalla no significan nada.
- **No hay visitantes nuevos frente a recurrentes.** Exigiría dejar algo guardado en el navegador
  de un día para otro, que es justo lo que esta web promete no hacer. El panel lo explica en el pie
  en lugar de callarlo. Si algún día hiciera falta, se haría con un identificador rotatorio diario
  como el de Plausible o Fathom — y habría que revisar la política de privacidad.
- **Los robots declarados** no cuentan, y **en localhost no se mide**.

## Eventos

Se enganchan solos: `whatsapp`, `llamada`, `correo`, `test-abierto`, `consulta-enviada` y
`alta-aviso`. Para añadir uno desde cualquier guion:

```js
window.vtEvento("nombre-del-evento");
```

Esto es lo que de verdad dice si la web funciona: no cuántos entran, sino cuántos hacen algo.

## Dos trampas que costaron encontrar

Las dos dan el mismo síntoma —**la web funciona y simplemente deja de medirse, sin error
visible**— y por eso hay pruebas de regresión sobre el propio guion.

**1. El tipo de contenido tiene que ser `text/plain`, y a secas.** `sendBeacon` envía siempre en
modo `credentials: "include"`. Con `application/json` el navegador exige comprobación previa
(preflight) y luego una cabecera de credenciales que el Worker no devuelve: todo bloqueado. La
salida fácil sería permitir credenciales en el servidor, pero eso es abrirle la puerta a las
cookies justo en la pieza que presume de no usarlas. Y **sin charset**: con
`text/plain;charset=UTF-8` Chrome deja de considerarlo seguro y vuelve a bloquear.

**2. La caché de esa comprobación estaba en 86400 segundos.** Cuando un despliegue la provocaba, el
navegador se quedaba con la respuesta cacheada y seguía sin medir **durante un día entero, aunque
el código ya estuviera arreglado**. Está en 600.

## Puesta en marcha

Ya está desplegado. Estos son los pasos, por si hay que rehacerlo:

```bash
cd backend/visitas && npx wrangler d1 create valentramites-visitas
```

Copie `wrangler.toml.ejemplo` a `wrangler.toml` y ponga el `database_id` que devuelva.

```bash
npx wrangler d1 execute valentramites-visitas --remote --file=schema.sql
```

```bash
npx wrangler secret put CLAVE_PANEL
```

```bash
npx wrangler deploy
```

Y en `public/js/config.js`, `visitasEndpoint` con la dirección que devuelva el despliegue. Si se
deja vacío, no se mide nada y la web funciona igual.

`schema.sql` es idempotente: se puede volver a ejecutar sobre una base con datos sin perder nada.

## Comprobarlo

```bash
node backend/visitas/test-visitas.mjs
```

Sesenta y cuatro comprobaciones contra una D1 simulada, sin tocar Cloudflare. Corren también en cada
publicación, en los dos flujos. Entre ellas las que de verdad importan: que dos páginas de la misma
sesión cuentan **una** visita, que ninguna columna identifica a nadie, que un correo metido en la
dirección de la página **no** llega a la base de datos, y que el test de subvenciones sigue fuera
de la medición de clics.

## Coste

Cero. El plan gratuito de Cloudflare cubre 100.000 escrituras al día en D1 y 100.000 peticiones
diarias al Worker; esta web no va a acercarse. Si algún día lo hiciera, sería una buena noticia.
