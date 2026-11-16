# Medición de visitas

Analítica propia de valentramites.com. **Sin cookies, sin terceros y sin guardar ni un solo
identificador.** Vive en Cloudflare, en un Worker aparte del receptor de contactos.

```
Navegador  →  Worker (valentramites-visitas)  →  D1
   │                                              │
   └── js/visitas.js, 2 KB                        └── dos tablas de contadores
```

## Por qué no se usa Google Analytics

Esta web la publica una asesoría que vende, entre otras cosas, tratar bien los datos de sus
clientes. Poner Google Analytics obligaría a un aviso de cookies, enviaría los datos de cada
visitante a un tercero fuera de la UE y contradiría lo que dice la propia política de privacidad
del sitio. Medir las visitas no justifica nada de eso.

## Qué se guarda exactamente

**En la base de datos no hay ninguna columna que identifique a nadie.** No hay IP, ni cookie, ni
huella de navegador, ni identificador de sesión. Solo filas agregadas con un contador:

| Columna | Ejemplo |
|---|---|
| `dia`, `hora` | `2026-11-16`, `14` (UTC) |
| `ruta` | `/subvenciones.html` — sin parámetros ni ancla |
| `referente` | `google.com` — solo el dominio, o `directo` |
| `pais` | `ES` — lo deduce Cloudflare de la IP, que **no se escribe** |
| `dispositivo` | `movil`, `tableta`, `escritorio` |
| `entorno` | `produccion` o `pruebas` |
| `paginas`, `visitas` | los dos contadores |

A partir de esa tabla **es imposible reconstruir el recorrido de una persona concreta**, y esa es
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

- La **ruta se limpia** de parámetros y anclas antes de guardarla. Ahí es donde se cuelan datos
  personales: una `utm` con el correo de alguien, por ejemplo. Hay una prueba que lo comprueba.
- Del **referente solo se queda el dominio**. La búsqueda que trajo al visitante no se guarda.
- Los **robots declarados** no cuentan. Inflan las cifras y hacen tomar decisiones sobre humo.
- En **localhost no se mide**.

## El cuadro de mando

```
https://valentramites-visitas.gallart-alvaro.workers.dev/panel?clave=LA-CLAVE
```

La clave está en `backend/visitas/CLAVE-DEL-PANEL.txt`, que **no se sube al repositorio**. Si se
pierde, se genera otra con `wrangler secret put CLAVE_PANEL`.

| Parámetro | Para qué |
|---|---|
| `&dias=90` | cambiar el periodo (1 a 365, por defecto 30) |
| `&entorno=pruebas` | ver la copia de pruebas en vez de la web real |

En `/stats` con la misma clave están los mismos datos en JSON, por si algún día se quieren llevar
a una hoja de cálculo.

## Eventos

Además de las páginas, se cuenta lo que la gente hace. Se enganchan solos:

| Evento | Cuándo |
|---|---|
| `whatsapp`, `llamada`, `correo` | al pulsar un enlace de contacto |
| `test-abierto` | al ir al test de una convocatoria |
| `consulta-enviada` | al enviar el formulario de la portada |
| `alta-aviso` | al darse de alta en el aviso de convocatorias |

Para añadir uno nuevo desde cualquier guion:

```js
window.vtEvento("nombre-del-evento");
```

Esto es lo que de verdad dice si la web funciona: no cuántos entran, sino cuántos hacen algo.

## Puesta en marcha

Ya está desplegado. Estos son los pasos, por si hay que rehacerlo:

```bash
cd backend/visitas
npx wrangler d1 create valentramites-visitas
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

## Comprobarlo

```bash
node backend/visitas/test-visitas.mjs
```

Treinta y tres comprobaciones contra una D1 simulada, sin tocar Cloudflare. Entre ellas, las tres
que importan: que dos páginas de la misma sesión cuentan **una** visita, que ninguna columna
identifica a nadie, y que un correo metido en la dirección de la página **no** llega a la base de
datos.

## Coste

Cero. El plan gratuito de Cloudflare cubre 100.000 escrituras al día en D1 y 100.000 peticiones
diarias al Worker; esta web no va a acercarse. Si algún día lo hiciera, sería una buena noticia.

## Lo que este sistema no hace

- **No dice quién le visita.** Ni la empresa, ni la persona. Si eso hiciera falta algún día, es
  otro producto y otra conversación sobre privacidad.
- **No hay embudo por persona.** Se sabe cuántos abrieron el test y cuántos enviaron una consulta,
  pero no si fue la misma gente.
- **No hay tiempo en página ni porcentaje de rebote.** Haría falta un segundo aviso al salir, y no
  compensa el ruido.
