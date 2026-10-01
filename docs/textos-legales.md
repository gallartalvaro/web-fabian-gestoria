# Textos legales: qué falta para completarlos

Estado a 1 de octubre de 2026:

| Documento | Estado |
|---|---|
| Aviso legal | **completo y publicado** en producción |
| Condiciones de contratación | **completas y publicadas** en producción |
| Política de privacidad | **completa y publicada** en producción |
| Política de cookies | no existe, y puede que no haga falta: ver la decisión 3 |
| Tipografías de Google | resuelto: se sirven desde el propio dominio |

> **Decidido el 1 de octubre de 2026:** se publica el aviso legal con el domicilio particular,
> que es lo que exige el artículo 10.1.a de la LSSI. Se descartó dar de alta un domicilio
> profesional.
>
> El domicilio está escrito **solo en `aviso-legal.html`**: no aparece en la política de
> privacidad —el RGPD se satisface con los datos de contacto—, ni en el pie, ni en la portada, ni
> en los datos estructurados. Si algún día se da de alta un domicilio profesional, se cambia en
> ese único sitio.

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
3. ✅ **Domicilio facilitado** (1/10/2026) y escrito en el aviso legal, que es el único sitio
   donde la ley lo exige. Es una vivienda particular: de ahí la decisión de arriba.
4. ✅ **Contacto legal**: los mismos correo y teléfono que ya figuran en la web.

### b) Colegio profesional — casi seguro que aplica

La web anuncia «asesor fiscal personal» en el plan de autónomos, y su correo de Odoo es de
dominio `coev.com`, que es el Col·legi d'Economistes de València. Si ejerce profesión colegiada,
el aviso legal debe recoger:

5. ✅ **Ilustre Colegio de Economistas de Valencia**, colegiado número **3692**.
6. ✅ **Graduado en Administración y Dirección de Empresas** por la Universitat de València, con
   estudios de máster en Derecho de la Empresa, especialidad fiscal, por la misma universidad.
   Títulos expedidos en **España**.
7. ✅ **Normas profesionales**, verificadas leyendo los propios documentos del Colegio
   (30/09/2026): la Ley 2/1974 sobre Colegios Profesionales, la Ley de Colegios Profesionales de
   la Generalitat Valenciana y los [estatutos del COEV](https://www.coev.com/estatuto-del-coev),
   que son los que recogen los deberes profesionales, las normas deontológicas y el régimen
   disciplinario de los colegiados. Se enlaza también el
   [reglamento de colegiación](https://www.coev.com/reglamento-de-colegiacion).

   > **El código de buen gobierno se ha retirado de la cita.** Lo había puesto yo por su título;
   > al leerlo resulta que regula «la conducta de los miembros de la Junta de Gobierno», no el
   > ejercicio profesional del colegiado. Citarlo como norma aplicable a la actividad del
   > despacho habría sido inexacto. Procede volver a incluirlo solo si se forma parte de la Junta.

   > Los estatutos figuran en la web del Colegio como **provisionales**, aprobados por la
   > Comisión Gestora el 31 de marzo de 2026. Si se aprueban los definitivos, hay que revisar el
   > enlace y la cita.

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

| Qué | Bloquea |
|---|---|
| **Contratos de encargado** con Cloudflare, Odoo y Hostinger | nada en la web, pero la privacidad ya los declara |

Los tres documentos están publicados y enlazados desde el pie de las doce páginas.

**Condiciones ya cerradas** (30/09/2026): sin permanencia; preaviso de 15 días para la baja; el
mes en que se solicita la baja se factura completo; los trabajos fuera de cuota ya contratados se
terminan y se facturan según su presupuesto; y las cuotas se revisan una vez al año, avisando con
un mes de antelación. **Fuero** (1/10/2026): juzgados y tribunales de València, salvo que
quien contrate sea consumidor, en cuyo caso prevalece el fuero que le reconozca su normativa.
