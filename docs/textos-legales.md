# Textos legales: qué falta para completarlos

Estado: `public/privacidad.html` es **un borrador** con huecos. Faltan el aviso legal y la
política de cookies.

> No soy abogado y usted trabaja en un despacho: lo que sigue es el inventario técnico de lo que
> la web hace de verdad, más la lista de datos que hay que decidir. Los textos finales debería
> validarlos quien lleve el cumplimiento normativo.

---

## 1. Lo que ya sé y no hace falta que me diga

Esto está comprobado sobre el código, no supuesto.

### Datos que se recogen

| Momento | Datos |
|---|---|
| Formulario de contacto | Nombre, email, teléfono, área de consulta, mensaje |
| Panel «Que me llamen» | Nombre, teléfono, franja preferida |
| Test de subvenciones | Todo lo anterior más las respuestas del test, el resultado y el importe estimado |
| Siempre que se envía algo | Página desde la que se envió, procedencia de la visita y consentimiento con su fecha |

La procedencia son los parámetros de campaña de la dirección (`utm_*`) y, si viene de fuera, el
sitio de origen. Sirve para saber qué canal trae clientes.

**No se recoge nada más.** Sin analítica, sin píxeles de redes, sin perfilado, sin pagos.

### Dónde acaban

Los envíos crean una **oportunidad en Odoo**, pasando por un intermediario alojado en
**Cloudflare** que es quien guarda la clave de acceso a Odoo.

### Qué se guarda en el navegador

**Ninguna cookie.** Sí hay dos usos de almacenamiento de sesión, que se borran al cerrar la
pestaña:

| Clave | Contenido | Para qué |
|---|---|---|
| `test:<convocatoria>` | Las respuestas marcadas en el test | No perder el progreso al navegar a la ficha y volver |
| `origen` | Campaña y procedencia de la visita | Atribuir el contacto al canal por el que llegó |

### Terceros que intervienen

| Quién | Papel | Qué recibe |
|---|---|---|
| Hostinger | Alojamiento de la web | Registros del servidor (IP, páginas) |
| Cloudflare | Intermediario del formulario | Los datos del formulario, de paso |
| Odoo | CRM y agenda de citas | Los datos del formulario y de las citas |
| Google Fonts | Tipografías de la web | La IP del visitante, al cargar las fuentes |
| Meta (WhatsApp) | Solo si el visitante pulsa el botón | Lo que él decida escribir |

---

## 2. Lo que necesito de usted

### a) Identificación — obligatoria en el aviso legal

- [ ] **Nombre y apellidos o razón social** con la que se ejerce
- [ ] **NIF / CIF**
- [ ] **Domicilio** (ver el punto ⚠️ de más abajo)
- [ ] **Correo de contacto legal** — ¿el mismo `hola@valentramites.com`?
- [ ] **Teléfono** — ¿el mismo +34 615 78 08 36?
- [ ] **Nombre comercial** — ¿«Valentramites» a secas?

### b) Colegio profesional — probablemente aplica

Si se ejerce una profesión colegiada, el aviso legal debe incluir:

- [ ] **Colegio profesional** al que pertenece (¿Colegio de Economistas de Valencia?)
- [ ] **Número de colegiado**
- [ ] **Título académico** y país que lo expidió
- [ ] **Normas profesionales** aplicables y dónde consultarlas

### c) Protección de datos

- [ ] ¿El **responsable del tratamiento** es el mismo del aviso legal?
- [ ] ¿Hay **delegado de protección de datos**? (con este tamaño, normalmente no)
- [ ] **Cuánto tiempo se conservan** los contactos que no llegan a ser clientes: ¿un año? ¿dos?
- [ ] ¿Quiere poder **enviarles avisos de nuevas convocatorias** más adelante? Es una finalidad
      distinta de «atender su consulta» y necesita su propia casilla de consentimiento. La web ya
      ofrece «avíseme de las próximas ayudas», así que conviene resolverlo.
- [ ] ¿Tiene **contrato de encargado de tratamiento** firmado con Hostinger, Cloudflare y Odoo?
      Los tres lo ofrecen; hay que aceptarlos y guardar copia.
- [ ] ¿Tiene ya un **registro de actividades de tratamiento**? Habría que añadir esta.

### d) Condiciones de los servicios

- [ ] **¿Hay permanencia** en los planes de precios? Si no la hay, conviene decirlo: vende.
- [ ] **Forma de pago y facturación** de las cuotas (¿domiciliación SEPA, como el resto?)
- [ ] ¿Qué ocurre si el cliente **se da de baja** a mitad de mes?

---

## 3. Tres decisiones que afectan al contenido

### ⚠️ El aviso legal exige un domicilio

La ley de servicios de la sociedad de la información obliga a indicar el domicilio del prestador.
Usted pidió no publicar dirección, y en la página de contacto se retiró. **En el aviso legal no
es opcional.**

Las salidas habituales: usar el domicilio fiscal aunque sea el particular, o dar de alta un
domicilio profesional (despacho compartido, centro de negocios) y usar ese.

### Las tipografías de Google

La web carga las fuentes desde los servidores de Google, lo que comunica la IP del visitante a un
tercero fuera de la UE. Es motivo frecuente de reclamaciones.

**Se soluciona en media hora**: alojar las tipografías en el propio servidor. Además la web carga
algo más rápido y desaparece un tercero de la política de privacidad. Lo recomiendo.

### La casilla de cookies

Hoy **la web no pone ninguna cookie**, así que no hace falta el banner que molesta a todo el
mundo. Lo único discutible es guardar la procedencia de la visita.

Dos caminos:

1. **Sin banner** — dejo de guardar la procedencia entre páginas. Se pierde saber que alguien
   llegó por una campaña y navegó tres páginas antes de escribir.
2. **Con banner** — se mantiene, y hay que pedir consentimiento previo.

Mi recomendación es el camino 1: la atribución exacta vale poco cuando el volumen es pequeño, y
un banner menos es una fricción menos.

---

## 4. Cuando me pase lo anterior

Redacto los tres documentos —aviso legal, privacidad y cookies— con los datos reales, enlazados
desde el pie de todas las páginas, y los dejo en la rama de pruebas para que los revise su
asesoría antes de publicarlos.
