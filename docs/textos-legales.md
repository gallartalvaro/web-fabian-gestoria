# Textos legales: qué falta para completarlos

Estado a 29 de septiembre de 2026:

| Documento | Estado |
|---|---|
| Política de privacidad | `public/privacidad.html`, **borrador con tres huecos marcados** |
| Aviso legal | **no existe** |
| Política de cookies | **no existe** (puede que no haga falta: ver la decisión 3) |
| Enlaces en el pie | solo apunta a privacidad, en las nueve páginas |
| Tipografías de Google | **resuelto**: se sirven desde el propio dominio (29/09/2026) |

> No soy abogado y usted trabaja en un despacho: lo que sigue es el inventario técnico de lo que
> la web hace de verdad, más la lista de datos que hay que decidir. Los textos finales debería
> validarlos quien lleve el cumplimiento normativo.

---

## 1. Lo que ya sé y no hace falta que me diga

Comprobado sobre el código, no supuesto.

### Datos que se recogen

| Momento | Datos |
|---|---|
| Formulario de contacto | Nombre, email, teléfono, área de consulta, mensaje |
| Panel «Que me llamen» | Nombre, teléfono, franja preferida |
| Test de subvenciones | Todo lo anterior más las respuestas del test, el resultado y el importe estimado |
| Reserva de cita | Se hace **en la web de Odoo**, no en la nuestra: los datos los pide y los guarda Odoo |
| Siempre que se envía algo | Página desde la que se envió, procedencia de la visita y consentimiento con su fecha |

La procedencia son los parámetros de campaña de la dirección (`utm_*`) y, si viene de fuera, el
sitio de origen.

**No se recoge nada más.** Sin analítica, sin píxeles de redes, sin perfilado, sin pagos.

### Dónde acaban, y quién es encargado del tratamiento

Esto ya **no** está pendiente de determinar, como todavía dice el borrador de privacidad:

| Quién | Papel | Qué recibe |
|---|---|---|
| **Cloudflare** | Encargado: recibe el formulario y crea la oportunidad | Todos los datos del formulario |
| **Odoo** | Encargado: CRM y agenda de citas | Los datos del formulario y los de las citas |
| **Hostinger** | Alojamiento de la web | Registros del servidor (IP, páginas) |
| Google Fonts | Tipografías | La IP del visitante, al cargar las fuentes |
| Meta (WhatsApp) | Solo si el visitante pulsa el botón | Lo que él decida escribir |

El receptor concreto es `valentramites-leads.gallart-alvaro.workers.dev`, en Cloudflare Workers.

### Qué se guarda en el navegador

**Ninguna cookie.** Dos usos de almacenamiento de sesión, que se borran al cerrar la pestaña:

| Clave | Contenido | Para qué |
|---|---|---|
| `test:<convocatoria>` | Las respuestas marcadas en el test | No perder el progreso al navegar a la ficha y volver |
| `origen` | Campaña y procedencia de la visita | Atribuir el contacto al canal por el que llegó |

### Datos de contacto publicados

`hola@valentramites.com` · `+34 615 78 08 36` · WhatsApp al mismo número ·
atención telefónica de lunes a viernes, de 16:00 a 21:00 (`js/config.js`).

---

## 2. Lo que necesito de usted

Siete respuestas recibidas el 29 de septiembre de 2026. **Quedan seis preguntas.**

### a) Identificación — obligatoria en el aviso legal

1. ❌ **¿Confirma que el prestador es usted como persona física**, con el nombre y el NIF que
   constan en `CLAUDE.md`? (No los repito aquí: este archivo está en el repositorio.)
2. ✅ **Nombre comercial**: «Valentramites» a secas.
3. ❌ **Domicilio a publicar** — ver la decisión ⚠️ del punto 3. Es lo único que impide
   cerrar el aviso legal.
4. ✅ **Contacto legal**: los mismos correo y teléfono que ya figuran en la web.

### b) Colegio profesional — casi seguro que aplica

La web anuncia «asesor fiscal personal» en el plan de autónomos, y su correo de Odoo es de
dominio `coev.com`, que es el Col·legi d'Economistes de València. Si ejerce profesión colegiada,
el aviso legal debe recoger:

5. ❌ **Colegio** y **número de colegiado**.
6. ❌ **Título académico** y país que lo expidió.
7. ❌ **Normas profesionales** aplicables y dónde se consultan.

### c) Protección de datos

8. ✅ **Conservación**: un año los contactos que no llegan a ser clientes.
9. ✅ **Avisos de nuevas convocatorias**: no se van a enviar. → **pero ver el aviso de abajo.**
10. ❌ **Contratos de encargado de tratamiento** con Cloudflare, Odoo y Hostinger: ¿los tiene
    aceptados y guardados? Los tres los ofrecen; hay que aceptarlos expresamente.
11. ⚠️ **Registro de actividades de tratamiento**: no consta que exista. Siendo responsable de
    datos de clientes, conviene resolverlo aunque sea al margen de la web.

> ### ⚠️ La respuesta 9 choca con lo que la web promete hoy
>
> En `subvenciones.html` hay una tarjeta —«¿Y si la suya todavía no está publicada?»— que dice
> literalmente: *«díganos a qué se dedica y le avisaremos solo cuando aparezca una que encaje con
> su actividad»*. El listado vacío ofrece lo mismo con el botón «Quiero que me avisen».
>
> Si no se van a enviar esos avisos, la web está pidiendo datos para una finalidad que no se
> cumple. Hay dos salidas, y hay que elegir una:
>
> 1. **Quitar la promesa** de la web y dejar esos botones como un contacto normal.
> 2. **Mantenerla** y añadir su casilla de consentimiento propia, separada de la de «atender su
>    consulta».
>
> Dígame cuál y lo dejo hecho. La 1 son diez minutos.

### d) Condiciones de contratación

12. ✅ **Sin permanencia.**
13. ✅ **Cobro por domiciliación SEPA**, y la baja a mitad de mes **contabiliza el mes completo**.

> Lo de «sin permanencia» hoy no se dice en ningún sitio, y vende. Puedo añadirlo a
> `precios.html` junto con la forma de cobro, si quiere.

## 3. Tres decisiones que afectan al contenido

### ⚠️ El aviso legal exige un domicilio

La ley de servicios de la sociedad de la información obliga a indicar el domicilio del prestador.
Usted pidió no publicar dirección, y en la página de contacto se retiró. **En el aviso legal no
es opcional.**

Las salidas habituales: usar el domicilio fiscal aunque sea el particular, o dar de alta un
domicilio profesional —despacho compartido, centro de negocios— y usar ese.

### ~~Las tipografías de Google~~ — resuelto

Se cargaban desde los servidores de Google, lo que comunicaba la IP de cada visitante a un
tercero fuera de la UE. **Desde el 29 de septiembre de 2026 se sirven desde el propio dominio**:
Google desaparece de la política de privacidad y la web carga algo antes.

### La casilla de cookies

Hoy **la web no pone ninguna cookie**, así que no hace falta el banner que molesta a todo el
mundo. Lo único discutible es guardar la procedencia de la visita.

1. **Sin banner** — dejo de guardar la procedencia entre páginas. Se pierde saber que alguien
   llegó por una campaña y navegó tres páginas antes de escribir.
2. **Con banner** — se mantiene, y hay que pedir consentimiento previo.

Mi recomendación es el camino 1: la atribución exacta vale poco cuando el volumen es pequeño, y
un banner menos es una fricción menos.

---

## 4. Qué falta para cerrar esto

Para el **aviso legal** basta con las preguntas 1, 3, 5, 6 y 7. La 3 —el domicilio— es la única
que no tiene alternativa técnica.

Para la **política de privacidad** ya está casi todo: con la 1 y la 3 se puede cerrar. La 10 y la
11 no cambian el texto, pero sí su exposición si alguien reclama.

Para las **condiciones de contratación** no falta nada: se pueden redactar ya.

Cuando me lo diga, redacto los documentos, los enlazo desde el pie de las nueve páginas y los
dejo en la rama `pruebas` para que los revise su asesoría antes de publicarlos.
