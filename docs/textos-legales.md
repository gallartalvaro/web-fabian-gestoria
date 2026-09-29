# Textos legales: qué falta para completarlos

Estado a 29 de septiembre de 2026:

| Documento | Estado |
|---|---|
| Política de privacidad | `public/privacidad.html`, **borrador con tres huecos marcados** |
| Aviso legal | **no existe** |
| Política de cookies | **no existe** (puede que no haga falta: ver la decisión 3) |
| Enlaces en el pie | solo apunta a privacidad, en las nueve páginas |

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

Trece preguntas. Puede responderlas de corrido en un correo; no hace falta formato.

### a) Identificación — obligatoria en el aviso legal

1. **¿Confirma que el prestador es usted como persona física**, con el nombre y el NIF que
   constan en `CLAUDE.md`? (No los repito aquí: este archivo está en el repositorio.)
2. **Nombre comercial**: ¿«Valentramites» a secas?
3. **Domicilio a publicar** — ver la decisión ⚠️ del punto 3.
4. **Correo y teléfono de contacto legal**: ¿los mismos que ya están en la web, o prefiere
   separarlos de los comerciales?

### b) Colegio profesional — casi seguro que aplica

La web anuncia «asesor fiscal personal» en el plan de autónomos, y su correo de Odoo es de
dominio `coev.com`, que es el Col·legi d'Economistes de València. Si ejerce profesión colegiada,
el aviso legal debe recoger:

5. **Colegio** y **número de colegiado**.
6. **Título académico** y país que lo expidió.
7. **Normas profesionales** aplicables y dónde se consultan.

### c) Protección de datos

8. **Cuánto se conservan** los contactos que no llegan a ser clientes: ¿un año? ¿dos? Hoy el
   borrador dice «se suprimen una vez atendida la consulta», que en la práctica no se cumple:
   la oportunidad se queda en el CRM.
9. **Avisos de nuevas convocatorias.** La web ya ofrece «avíseme de las próximas ayudas», y eso
   es una finalidad distinta de «atender su consulta»: necesita su propia casilla. ¿Quiere
   poder enviarlos? Si sí, añado la casilla al formulario.
10. **Contratos de encargado de tratamiento** con Cloudflare, Odoo y Hostinger: ¿los tiene
    aceptados y guardados? Los tres los ofrecen; hay que aceptarlos expresamente.
11. **Registro de actividades de tratamiento**: ¿existe? Habría que añadirle esta actividad.

### d) Condiciones de contratación

Los planes son cuotas mensuales recurrentes (35,90 / 53,90 / 89,90 € + IVA), así que esto no es
opcional:

12. **¿Hay permanencia?** Si no la hay, conviene decirlo en la página de precios: vende.
13. **Cobro y baja**: ¿se domicilian por SEPA, como las cuotas de renta? ¿Qué ocurre si alguien
    se da de baja a mitad de mes?

---

## 3. Tres decisiones que afectan al contenido

### ⚠️ El aviso legal exige un domicilio

La ley de servicios de la sociedad de la información obliga a indicar el domicilio del prestador.
Usted pidió no publicar dirección, y en la página de contacto se retiró. **En el aviso legal no
es opcional.**

Las salidas habituales: usar el domicilio fiscal aunque sea el particular, o dar de alta un
domicilio profesional —despacho compartido, centro de negocios— y usar ese.

### Las tipografías de Google

La web carga las fuentes desde los servidores de Google, lo que comunica la IP del visitante a un
tercero fuera de la UE. Es motivo frecuente de reclamaciones.

**Se soluciona en media hora**: alojar las tipografías en el propio servidor. Además la web carga
algo más rápido y desaparece un tercero de la política de privacidad. Lo recomiendo, y no
depende de que usted decida nada más.

### La casilla de cookies

Hoy **la web no pone ninguna cookie**, así que no hace falta el banner que molesta a todo el
mundo. Lo único discutible es guardar la procedencia de la visita.

1. **Sin banner** — dejo de guardar la procedencia entre páginas. Se pierde saber que alguien
   llegó por una campaña y navegó tres páginas antes de escribir.
2. **Con banner** — se mantiene, y hay que pedir consentimiento previo.

Mi recomendación es el camino 1: la atribución exacta vale poco cuando el volumen es pequeño, y
un banner menos es una fricción menos.

---

## 4. Cuando me pase lo anterior

Redacto los tres documentos —aviso legal, privacidad y cookies, si hace falta—, los enlazo desde
el pie de las nueve páginas y los dejo en la rama `pruebas` para que los revise su asesoría antes
de publicarlos.

Lo que puedo hacer **sin esperar a nada**, si me lo dice: alojar las tipografías en el servidor y
rellenar en el borrador de privacidad los encargados del tratamiento, que ya están identificados.
