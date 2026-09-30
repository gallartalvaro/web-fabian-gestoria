# Textos legales: qué falta para completarlos

Estado a 30 de septiembre de 2026:

| Documento | Estado |
|---|---|
| Aviso legal | `public/aviso-legal.html`, **borrador: falta el domicilio** |
| Política de privacidad | `public/privacidad.html`, **borrador: falta el domicilio** |
| Condiciones de contratación | `public/condiciones.html`, **borrador: faltan cuatro decisiones** |
| Política de cookies | no existe, y puede que no haga falta: ver la decisión 3 |
| Enlaces en el pie | los tres, en las once páginas |
| Tipografías de Google | resuelto: se sirven desde el propio dominio |

> ⚠️ **Los tres borradores están en la rama `pruebas` y no deben pasar a producción.** Un aviso
> legal sin domicilio incumple el artículo 10.1.a de la LSSI, que es justo lo que viene a
> resolver esa página.

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

1. ✅ **Prestador**: Fabian Okue Kung Mangue, NIF 55626142K, persona física.
2. ✅ **Nombre comercial**: «Valentramites» a secas.
3. ❌ **Domicilio a publicar** — ver la decisión ⚠️ del punto 3. **Es lo único que impide
   publicar el aviso legal y la política de privacidad.**
4. ✅ **Contacto legal**: los mismos correo y teléfono que ya figuran en la web.

### b) Colegio profesional — casi seguro que aplica

La web anuncia «asesor fiscal personal» en el plan de autónomos, y su correo de Odoo es de
dominio `coev.com`, que es el Col·legi d'Economistes de València. Si ejerce profesión colegiada,
el aviso legal debe recoger:

5. ✅ **Ilustre Colegio de Economistas de Valencia**, colegiado número **3692**.
6. ✅ **Graduado en Administración y Dirección de Empresas** por la Universitat de València, con
   estudios de máster en Derecho de la Empresa, especialidad fiscal, por la misma universidad.
   Títulos expedidos en **España**.
7. ⚠️ **Normas profesionales**: en el borrador constan los estatutos del Colegio y el código
   deontológico del Consejo General de Economistas. No lo he verificado con el Colegio, y la
   LSSI pide indicar también dónde se consultan: conviene confirmar la referencia exacta.

### c) Protección de datos

8. ✅ **Conservación**: un año los contactos que no llegan a ser clientes.
9. ✅ **Avisos de nuevas convocatorias**: no se van a enviar. → **pero ver el aviso de abajo.**
10. ❌ **Contratos de encargado de tratamiento** con Cloudflare, Odoo y Hostinger: ¿los tiene
    aceptados y guardados? Los tres los ofrecen; hay que aceptarlos expresamente.
11. ⚠️ **Registro de actividades de tratamiento**: no consta que exista. Siendo responsable de
    datos de clientes, conviene resolverlo aunque sea al margen de la web.

> ### La respuesta 9, resuelta en la web
>
> `subvenciones.html` prometía *«díganos a qué se dedica y le avisaremos solo cuando aparezca una
> que encaje con su actividad»*, y el listado vacío y la pantalla de fuera de plazo decían lo
> mismo. Como no se van a enviar esos avisos, **se ha quitado la promesa de los cinco sitios en
> que aparecía** (29/09/2026): ahora la web dice que las convocatorias nuevas **se publican aquí**
> y los botones piden consultar el caso, que sí es la finalidad declarada.
>
> Consecuencia para los textos legales: **no hace falta casilla de consentimiento adicional.** La
> única finalidad sigue siendo atender la consulta.

### d) Condiciones de contratación

12. ✅ **Sin permanencia.**
13. ✅ **Cobro por domiciliación SEPA**, y la baja con el mes ya empezado **factura el mes
    completo**.

> Ambas están ya publicadas en `precios.html` (29/09/2026), fuera de los grupos de planes para
> que se vean tanto en autónomos como en empresas. Falta redactarlas como condiciones de
> contratación formales, para lo que no hace falta ningún dato más.

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
