# Decisiones

Por qué el proyecto es como es. Sirve para no volver a discutir lo ya discutido, y para saber
qué habría que revisar si cambian las circunstancias.

---

## El test no descarta a la ligera

**Qué se hizo.** El test solo devuelve «no encaja» ante un requisito que la convocatoria excluye
sin matices: fecha de alta, municipio, padrón, plantilla, tipo de entidad. Todo lo demás —falta
el IAE, hay deudas, no tiene certificado digital— se presenta como *punto a resolver*.

**Por qué.** Esos «puntos a resolver» son justamente el trabajo que se contrata. Un test que
descarta por ellos regala clientes a la competencia. Y al revés: decirle a alguien «usted cumple»
cuando no cumple es un problema del despacho.

**Caso real:** en Emprende y Concilia, el requisito de no haber estado de alta en el RETA en los
meses anteriores no aparecía literal en la ficha pública. Se trató como punto a comprobar, no
como exclusión.

---

## Publicar bien el trámite no regala trabajo

**Qué se hizo.** Las fichas explican requisitos, importes, plazos y documentación con detalle.
No explican el paso a paso de la sede electrónica.

**Por qué.** El detalle es lo que posiciona la página en Google y lo que genera confianza; sin
él no llega nadie. Quien iba a hacerlo solo nunca fue cliente. Lo que se cobra no es saber qué
papeles hacen falta, sino el certificado digital, el plazo, la responsabilidad y saber qué
deniegan en la práctica.

**Corrección aplicada.** La FAQ «¿Puedo presentarla yo mismo?» respondía «por supuesto… para
hacerlo por su cuenta»: invitaba a no contratar. Ahora reconoce que se puede, pero sitúa el valor
en que el expediente se presenta una sola vez y no admite ensayo. Se añadió el bloque «Por qué se
quedan sin la ayuda quienes cumplen los requisitos», que aumenta el riesgo percibido de hacerlo
solo con información que no está en las bases.

---

## Nada llega a producción sin revisión

**Qué se hizo.** Rama `pruebas` → GitHub Pages → aprobación → rama `main` → Hostinger.

**Por qué.** La web publica requisitos legales y precios. Un error tipográfico en un plazo o en
una tarifa tiene consecuencias. La copia de revisión lleva `noindex` y un distintivo visible para
no confundirla con la real.

---

## Las convocatorias se retiran con un día de plazo

**Qué se hizo.** Con menos de dos días, la convocatoria desaparece del listado y su ficha deja de
ofrecer el test.

**Por qué.** No da tiempo a reunir documentación y presentar con garantías. Anunciarla solo
genera llamadas que hay que rechazar, y deja al cliente con la sensación de haber llegado tarde
por culpa de la web.

---

## La redacción de fichas nunca será automática

**Qué se hizo.** La vigilancia detecta convocatorias nuevas y avisa. La ficha y el test los
redacta una persona, y pasan por la copia de revisión.

**Por qué.** Detectar es mecánico; interpretar unas bases no lo es. Un test que diga «usted
cumple» a quien no cumple es responsabilidad del despacho, no del programa.

---

## Filtrar la BDNS es lo que hace útil el aviso

**Qué se hizo.** Territorio, municipios del área metropolitana, destinatario «pyme y personas
físicas con actividad económica» e importe mínimo de 20.000 €.

**Por qué.** En quince días se publican ~230 convocatorias solo en la Comunitat, casi todas
nominativas de ayuntamientos pequeños a fallas, clubes y asociaciones. Sin filtrar, el aviso se
vuelve ruido y deja de leerse. Con los filtros quedan entre una y tres por semana.

---

## Los contactos van al CRM, no al correo

**Qué se hizo.** Cada formulario crea una oportunidad en Odoo con el diagnóstico completo,
etiquetas de perfil, procedencia y prioridad.

**Por qué.** Un correo hay que leerlo, interpretarlo y copiarlo a algún sitio. Una oportunidad
etiquetada permite filtrar la cartera —«todos los de hostelería», «los que no tienen certificado
digital»— y ordena el embudo solo: arriba lo que cierra antes.

**Consecuencia.** Hizo falta una pieza intermedia (Cloudflare Worker) para no exponer la clave de
API en el navegador.

---

## El contacto no manda al final de la página

**Qué se hizo.** Los botones abren un panel en la propia página con cuatro vías: reservar
llamada, WhatsApp con el mensaje redactado, llamar ahora y «que me llamen» con dos campos.

**Por qué.** Bajar al formulario hacía perder el sitio y obligaba a escribir. Cada vía cubre un
momento distinto: quien quiere hablar ya, quien prefiere planificar y quien solo deja el teléfono.

---

## El teléfono es obligatorio

**Qué se hizo.** En todos los formularios, con al menos nueve cifras.

**Por qué.** En una gestoría, la conversión ocurre por teléfono. Un contacto sin teléfono obliga
a escribir un correo y esperar.

---

## Nada de código dentro de Odoo

**Qué se hizo.** Toda la lógica vive fuera: el receptor en Cloudflare, la vigilancia en GitHub.

**Por qué.** Odoo factura las acciones de servidor con código como «Custom Code Maintenance»
(144 €/año por bloque de 100 líneas). Regla 1 de `CLAUDE.md`.

---

## Los precios se publican

**Qué se hizo.** Tarifas cerradas para autónomos y empresas, y «precio según el caso» en las
áreas donde cada trabajo es distinto.

**Por qué.** Quien busca gestoría compara precios; no encontrarlos es motivo de abandono.
Los planes se tomaron de una referencia de mercado con un descuento aplicado, con nombres y
redacción propios, y **sin prometer funciones de plataforma que el despacho no ofrece**.

⚠️ Cada línea de cada plan debe corresponder a algo que el despacho presta de verdad: una tarifa
publicada compromete. Ver [pendientes.md](pendientes.md).

---

## CSS y JS se revalidan; sus rutas se versionan

**Qué se hizo.** El HTML, el CSS y los guiones se revalidan en cada visita, y cada publicación
añade la versión del commit a la ruta de CSS y JS.

**Por qué.** Se cachearon los guiones siete días y la CDN de Hostinger sirvió el `config.js`
antiguo: el formulario dejó de registrar en Odoo sin que nada pareciera roto. En esos archivos
viven los plazos de las convocatorias.

---

## El logotipo se reconstruyó en vectorial

**Qué se hizo.** La V y el arco, trazados midiendo el contorno del original. El texto, compuesto
en Merriweather Bold (licencia libre) con cada letra ajustada, y convertido a trazados.

**Por qué.** La imagen de marca era un mapa de bits: no escala, no sirve para favicon ni para
documentos. Convertir el texto a trazados evita depender de tener la fuente instalada.

Se añadió una imagen PNG de vista previa porque **WhatsApp y las redes no muestran SVG**, y
compartir enlaces por WhatsApp es un canal principal del despacho.
