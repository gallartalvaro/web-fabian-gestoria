# Pendientes

Lo que está esperando una decisión o un dato. Ordenado por lo que más cuesta dejarlo como está.

## Decisiones del despacho

| | Qué hay que decidir | Por qué importa |
|---|---|---|
| ⬜ | **Textos legales**: aviso legal, privacidad y cookies | `privacidad.html` es un borrador con huecos y no hay aviso legal. Lista completa en [textos-legales.md](textos-legales.md) |
| ⬜ | **Revisar cada línea de los planes de precios** | Una tarifa publicada compromete: hay que confirmar que el despacho presta de verdad todo lo que aparece |
| ⬜ | **Correo visible en la agenda de citas** | La agenda de Odoo muestra `fabian.kung@coev.com`, que es el usuario administrador. Cambiarlo por `hola@valentramites.com` haría que los correos de Odoo, incluidas las facturas, salieran con esa dirección |
| ⬜ | **Logotipo en Odoo** | Quitaría el «Your logo» de la agenda, pero aparecería también en facturas y documentos |
| ⬜ | **Borrar las oportunidades de prueba** del CRM (llevan «PRUEBA» en el contacto) | Ensucian el embudo |
| ⬜ | **Rotar la clave de API de Odoo** | Se compartió por chat durante la puesta en marcha. Conviene generar otra y sustituirla con `wrangler secret put` |

## Mejoras propuestas y no ejecutadas

| | Qué | Estado |
|---|---|---|
| ⬜ | **Afinar la vigilancia**: añadir finalidad, excluir nominativas y descartar las cerradas | Propuesto; los tres criterios cortan ruido sin perder nada útil |
| ⬜ | **Alojar las tipografías** en el propio servidor | Quita un tercero de la política de privacidad y acelera la carga |
| ⬜ | **Contratación del plan online** (Odoo Ventas + Firma + SEPA) | Era la opción D del panel de contacto. Presupuesto firmado y mandato SEPA sin papeles. Pendiente de que las tarifas estén confirmadas |
| ⬜ | **Chat en vivo** de Odoo | Descartado de momento: sin alguien atendiendo, un chat sin respuesta resta |
| ⬜ | **Borrador automático de fichas de ayudas** (fase 2 de la automatización) | Solo cuando la vigilancia lleve unos meses y se vea que compensa. La publicación seguiría siendo manual |
| ⬜ | **Anexo II de EMDANA** | El test pregunta por el municipio y admite «no lo sé» porque no se pudo obtener la lista oficial completa |

## Datos que siguen faltando en la web

| | Dato | Dónde |
|---|---|---|
| ⬜ | Nombre comercial exacto y NIF | Pie de página y datos estructurados de `public/index.html` |

## Fechas

| Cuándo | Qué |
|---|---|
| 30 de septiembre de 2026 | Cierran las ayudas de hostelería y EMDANA. Las fichas se retiran solas el día 29 |
| Cada lunes | La vigilancia revisa la BDNS y abre una incidencia si hay algo |
| Marzo de 2027 (aprox.) | Suele convocarse «Emprende y Contrata» del Ayuntamiento de València |
| Septiembre de 2027 (aprox.) | Suele convocarse «Emprende y Concilia» |
