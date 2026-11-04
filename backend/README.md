# Receptor de contactos → Odoo CRM

Cuando alguien termina un test de subvenciones y deja sus datos, la web envía un **perfil de
cliente** a este receptor, que crea una **oportunidad en el CRM de Odoo** con el diagnóstico
completo. El comercial no tiene que volver a preguntar nada: al llamar ya sabe quién es, a qué
ayuda opta, cuánto le tocaría y qué le falta.

```
Test (navegador)  →  Worker  →  Odoo CRM (crm.lead)
                       │
                       └── la clave de API vive aquí, nunca en el navegador
```

## Por qué hace falta una pieza intermedia

La web es estática (GitHub Pages) y no puede hablar con Odoo directamente: haría falta la clave
de API en el navegador, es decir, a la vista de cualquiera. Este Worker es la pieza mínima que
guarda ese secreto. Es un único archivo y se ejecuta gratis dentro del plan sin coste de
Cloudflare.

> **No factura "Custom Code Maintenance".** Este código vive fuera de Odoo: no es una acción de
> servidor, ni una automatización, ni un campo calculado. La regla 1 de `CLAUDE.md` se respeta.

## Qué crea en Odoo

Una oportunidad (`crm.lead`) con:

| Campo de Odoo | Contenido |
|---|---|
| Nombre | Convocatoria + resultado del test |
| Contacto, teléfono, email | Lo que dejó en el formulario |
| Prioridad | ⭐⭐⭐ si cumple y quedan ≤ 10 días · ⭐⭐ si cumple · ⭐ si no encaja |
| Fecha límite | El día en que cierra la convocatoria |
| Etiquetas | `Web · Subvenciones` y el nombre de la convocatoria |
| Descripción | Todas las respuestas, puntos a resolver, motivos de exclusión, procedencia y consentimiento con su fecha |
| Cliente | Si el teléfono o el email ya existen en Contactos, la oportunidad se engancha a esa ficha |

Así, el pipeline del CRM se ordena solo: lo que cierra antes y tiene más posibilidades sube arriba.

## Los tres tipos de envío

El perfil que llega lleva un campo `tipo`, y de él depende qué se crea:

| `tipo` | De dónde viene | Referencia | Prioridad | Plazo |
|---|---|---|---|---|
| (sin `tipo`) o `test-subvencion` | El test de una convocatoria | `SUB-n` | según resultado y días | cierre de la convocatoria |
| `solicitud-llamada` | Panel «Que me llamen» | `LLA-n` | ⭐⭐⭐ | hoy |
| `consulta-web` | Formulario largo de la portada | `CON-n` | ⭐⭐ | mañana |
| `aviso-subvenciones` | Alta en el aviso de convocatorias | `AVI-n` | — | — |

**`consulta-web`** es el único que trae un texto redactado por la persona. Exige `solicitud.mensaje`:
sin él se rechaza con 422, porque una consulta sin consulta no sirve de nada. El mensaje se guarda
en la descripción escapado y respetando los saltos de línea, y el área elegida va en el título de
la oportunidad y como etiqueta.

> Hasta octubre de 2026 el formulario de la portada **no pasaba por aquí**: abría un `mailto:` y no
> registraba nada. En un equipo sin cliente de correo configurado, no ocurría absolutamente nada y
> el contacto se perdía sin que nadie se enterara.

## El alta en el aviso es el único que no crea oportunidad

`aviso-subvenciones` es distinto de los otros tres: **no crea nada en el CRM**. Quien pide que le
avisen de ayudas todavía no es una oportunidad, y meterlo en el embudo lo llena de fichas que
nadie va a trabajar y que falsean el recuento.

Lo que crea es un **contacto** (`res.partner`) con tres etiquetas:

| Etiqueta | Para qué |
|---|---|
| `Aviso de subvenciones` | marca a quién hay que escribir |
| La actividad | decide a quién le encaja cada convocatoria |
| La provincia | lo mismo, para las ayudas municipales y autonómicas |

Esas etiquetas **son** la lista de envío: en *Contactos* se filtra por ellas y se escribe solo a
quien le sirve. Un aviso que no le vale a nadie deja de abrirse a la tercera.

Dos cuidados que el código ya tiene:

- **No duplica.** Si el correo ya está en Contactos —y muchos suscriptores van a ser clientes del
  despacho— se reutiliza esa ficha.
- **No pisa nada.** Las etiquetas se añaden con `[4, id]`, que enlaza, en vez de `[6, 0, ids]`,
  que sustituye y habría borrado las que el cliente ya tuviera. El campo de notas de una ficha
  existente no se toca: la constancia del consentimiento va al historial con `message_post`.

### Cómo se envía el aviso

*Marketing por correo electrónico* (`mass_mailing`) está **instalado** desde el 4 de noviembre de
2026, con la lista **«Aviso de subvenciones»** (`mailing.list` id 2) y una plantilla en borrador.

Por eso el alta hace **dos cosas**, no una:

| Qué crea | Para qué |
|---|---|
| `res.partner` etiquetado | la ficha del despacho, que puede acabar siendo un cliente |
| `mailing.contact` en la lista | el envío, y el **enlace de baja automático** |

`mailing.contact.tag_ids` apunta al mismo modelo de etiquetas que `res.partner`
(`res.partner.category`), así que la actividad y la provincia sirven para filtrar el envío sin
duplicar nada.

El recorrido semanal queda así:

1. La vigilancia abre la incidencia con las convocatorias nuevas (`vigilancia/README.md`).
2. En *Marketing por correo electrónico* → *Correos*, **duplicar** la plantilla
   `PLANTILLA — NO ENVIAR`.
3. Rellenar los corchetes, apuntar el botón a la ficha de esa convocatoria y, si la ayuda es
   solo de un sector o un municipio, **añadir la etiqueta al filtro de destinatarios**.
4. Enviar.

> **El destinatario de la plantilla está fijado a mano.** Al crearla por API no se disparó el
> cálculo automático que la ata a la lista, y el filtro quedó en «todos los contactos de correo»:
> el aviso habría salido también a quien solo está en *Newsletter*. Está corregido a
> `[('list_ids', 'in', [2])]` y comprobado. **Si algún día se crea otra plantilla por API, hay que
> revisar ese campo**; haciéndolo desde la interfaz, Odoo lo pone solo.

### Dos cosas que quedan por confirmar

- **El límite diario de envío de Odoo Online.** Hay uno, depende del plan, y con la lista
  pequeña no se va a notar; conviene saberlo antes de que crezca.
- **Que el correo salga desde el dominio del despacho** y no desde el remitente por defecto de
  Odoo: si no, acaba en la carpeta de no deseados. Se configura en *Ajustes → Conversaciones*.

## Puesta en marcha

**1. Crear la clave de API en Odoo**

En Odoo: foto de perfil → *Mi perfil* → *Seguridad de la cuenta* → *Claves API* → *Nueva clave*.
Se muestra una sola vez; cópiela antes de cerrar.

**2. Instalar las herramientas y entrar en Cloudflare**

```bash
npm install -g wrangler
```

```bash
wrangler login
```

**3. Configurar el proyecto**

Copie `wrangler.toml.ejemplo` a `wrangler.toml` y ajuste el nombre si quiere otro.

**4. Guardar los secretos** (uno por comando; los pide por teclado y no quedan en el disco)

```bash
wrangler secret put ODOO_API_KEY
```

Y las demás variables, que no son secretas, van en `wrangler.toml`: `ODOO_URL`, `ODOO_DB`,
`ODOO_USER` y `ORIGENES`.

**5. Desplegar**

```bash
wrangler deploy
```

Wrangler devuelve una URL del tipo `https://valentramites-leads.<subdominio>.workers.dev`.

**6. Conectar la web**

En `public/js/config.js`, poner esa URL en `formEndpoint`, y confirmar el push a `main`:

```js
formEndpoint: "https://valentramites-leads.xxxx.workers.dev",
```

## Comprobar que funciona

```bash
curl -X POST https://valentramites-leads.xxxx.workers.dev -H "Content-Type: application/json" -d "{\"version\":2,\"contacto\":{\"nombre\":\"Prueba Prueba\",\"telefono\":\"600000000\",\"email\":\"prueba@example.com\",\"momentoPreferido\":\"Indiferente\"},\"consentimiento\":{\"aceptado\":true,\"texto\":\"prueba\",\"fecha\":\"2026-09-17T10:00:00Z\"},\"convocatoria\":{\"id\":\"prueba\",\"titulo\":\"PRUEBA - borrar\",\"organismo\":\"Prueba\",\"cierraEl\":\"2026-09-30\",\"diasRestantes\":13},\"diagnostico\":{\"resultado\":\"apto\",\"importeEstimado\":\"4.000 EUR\",\"respuestas\":{},\"puntosARevisar\":[],\"motivosDeExclusion\":[]},\"seguimiento\":{\"prioridad\":\"alta\",\"pagina\":\"prueba\",\"origen\":{},\"fecha\":\"2026-09-17T10:00:00Z\"}}"
```

Debe responder `{"ok":true,"referencia":"SUB-123"}` y aparecer la oportunidad en el CRM. Bórrela
después.

Para ver los errores en vivo mientras prueba:

```bash
wrangler tail
```

## Si algo falla, el contacto no se pierde

El formulario tiene camino alternativo: si el Worker no responde, el visitante ve su diagnóstico
ya redactado con botones de WhatsApp, correo y copiar. Un fallo de red no cuesta un cliente.

## Protección frente a robots

El formulario incluye un campo trampa invisible (`apellido2`). Si llega relleno, el Worker
responde `200` pero no crea nada, de modo que el robot no aprende que ha sido detectado. Además,
solo se aceptan peticiones desde los orígenes de `ORIGENES` y con consentimiento marcado.

Si algún día llegara spam en volumen, lo siguiente sería añadir una regla de límite de peticiones
por IP en el panel de Cloudflare, sin tocar este código.

## Otros destinos posibles

`formEndpoint` acepta cualquier URL que reciba un `POST` con JSON, así que el mismo formulario
puede apuntar a otro sitio sin cambiar la web:

- **Hoja de cálculo del despacho** — un Google Apps Script publicado como aplicación web.
- **Formspree o Netlify Forms** — llega por correo, pero no crea ficha en el CRM y los datos
  pasan por un tercero, algo a valorar tratándose de datos personales de clientes.

El formato del perfil está versionado (`version: 2`) para que el destino pueda cambiar sin
romper nada.
