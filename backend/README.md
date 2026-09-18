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

Wrangler devuelve una URL del tipo `https://valentramite-leads.<subdominio>.workers.dev`.

**6. Conectar la web**

En `js/config.js`, poner esa URL en `formEndpoint`, y confirmar el push a `main`:

```js
formEndpoint: "https://valentramite-leads.xxxx.workers.dev",
```

## Comprobar que funciona

```bash
curl -X POST https://valentramite-leads.xxxx.workers.dev -H "Content-Type: application/json" -d "{\"version\":2,\"contacto\":{\"nombre\":\"Prueba Prueba\",\"telefono\":\"600000000\",\"email\":\"prueba@example.com\",\"momentoPreferido\":\"Indiferente\"},\"consentimiento\":{\"aceptado\":true,\"texto\":\"prueba\",\"fecha\":\"2026-09-17T10:00:00Z\"},\"convocatoria\":{\"id\":\"prueba\",\"titulo\":\"PRUEBA - borrar\",\"organismo\":\"Prueba\",\"cierraEl\":\"2026-09-30\",\"diasRestantes\":13},\"diagnostico\":{\"resultado\":\"apto\",\"importeEstimado\":\"4.000 EUR\",\"respuestas\":{},\"puntosARevisar\":[],\"motivosDeExclusion\":[]},\"seguimiento\":{\"prioridad\":\"alta\",\"pagina\":\"prueba\",\"origen\":{},\"fecha\":\"2026-09-17T10:00:00Z\"}}"
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
