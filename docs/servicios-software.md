# Servicios de software y agentes de IA: qué publicar

Documento de trabajo abierto el 3 de noviembre de 2026. Lista de candidatos a publicar en la
web, para repasar uno por uno. **Nada de esto está publicado todavía.**

Regla de este documento: se separa lo que **ya está hecho y se puede demostrar** de lo que
**habría que construir**. Un servicio del segundo grupo no se anuncia como si existiera.

| Estado | Significado |
|---|---|
| ⬜ | sin repasar |
| ✅ | aprobado para publicar |
| ❌ | descartado |
| 🕓 | aprobado, pero más adelante |

---

## Bloque A · Lo que ya existe (prueba, no promesa)

Todo lo de este bloque está construido y funcionando. Se puede enseñar.

### ⬜ 1. Implantación de Odoo sin código facturable

Puesta en marcha completa: apps, localización española, plan contable, impuestos, diarios
bancarios, productos, clientes. **Todo por configuración, cero líneas de código.**

- *Prueba*: la instancia del despacho, con «Count LoC» a 0 facturable.
- *Diferencia real*: Odoo cobra 144 €/año por cada bloque de 100 líneas de código a medida.
  Casi ningún implantador lo dice. La plantilla del sector traía 68 líneas facturables y se
  quitaron. Ese es el argumento de venta: una implantación que no deja factura recurrente oculta.
- *A quién*: pyme de 1 a 15 personas que quiere salir del Excel, y otros despachos.
- *Modelo*: precio cerrado por proyecto.

### ⬜ 2. Cobro recurrente por domiciliación SEPA

Mandatos, lotes de adeudos, generación del fichero pain.008 y envío al banco.

- *Prueba*: remesa BATCH/IN/2026/0001, 1.149,50 € en 19 adeudos.
- *A quién*: cualquier negocio con cuota mensual (academias, clínicas, mantenimientos, gimnasios).
- *Modelo*: precio cerrado de puesta en marcha.

### ⬜ 3. Web conectada al CRM

Formulario que no abre el correo del visitante: entra en el CRM como oportunidad, con el área,
el origen de la visita y el consentimiento fechado.

- *Prueba*: valentramites.com → receptor en Cloudflare → CRM, con 38 comprobaciones automáticas.
- *A quién*: quien ya tiene web y pierde los contactos por el camino.
- *Modelo*: precio cerrado.

### ⬜ 4. Web profesional con despliegue controlado

Sitio estático rápido, tipografías propias (sin terceros), textos legales completos, y dos
ramas: nada llega a producción sin pasar por una copia de revisión.

- *Prueba*: este mismo sitio.
- *A quién*: autónomo o pyme que necesita presencia seria, no una plantilla.
- *Modelo*: precio cerrado + cuota de mantenimiento.

### ⬜ 5. Vigilancia de convocatorias de ayudas

Barrido automático de la Base de Datos Nacional de Subvenciones por región y actividad, con
ficha redactada y plazo verificado contra el boletín oficial.

- *Prueba*: el buscador del repositorio y las once fichas publicadas.
- *A quién*: otros despachos y asociaciones empresariales; también producto propio.
- *Modelo*: cuota mensual.
- *Ojo*: aquí el trabajo humano no es el barrido, es **leer las bases y verificar el plazo**.
  Eso no se automatiza sin responsabilidad. Hay que decidir si se vende el aviso o el aviso
  ya revisado, porque el precio y el riesgo son distintos.

---

## Bloque B · Los cinco agentes

Lista fijada por el despacho el 3 de noviembre de 2026. Sustituye a los puntos 6 a 11 de la
primera versión de este documento. **Ninguno está construido todavía.**

| # | Agente | Qué hace | Estado |
|---|---|---|---|
| A1 | **Comercial y atención al cliente** | Atiende WhatsApp y web, responde, prepara presupuestos, recoge solicitudes y agenda | ⬜ en repaso |
| A2 | **Administrativo** | Lee facturas, clasifica documentos, extrae datos, prepara informes | ⬜ |
| A3 | **Conocimiento interno** | Conoce documentos, procedimientos, tarifas y políticas; el equipo le pregunta | ⬜ |
| A4 | **Ventas y CRM** | Registra oportunidades, hace seguimientos, actualiza clientes, prepara comunicaciones | ⬜ |
| A5 | **Gestión y reservas** | Citas, reservas, cancelaciones, disponibilidad y recordatorios | ⬜ |

### Lo que hay que decidir sobre el conjunto, no sobre cada uno

**Se solapan.** A1 agenda citas y A5 gestiona citas. A1 recoge solicitudes y A4 registra
oportunidades. Publicados como cinco productos independientes, el cliente no sabrá cuál
comprar y nosotros acabaremos vendiendo tres veces lo mismo.

Propuesta: **dos que miran afuera y tres que miran adentro.**

- **De cara al cliente**: A1 (habla) y A5 (agenda). Se venden juntos o A1 incluye lo básico de A5.
- **De cara al equipo**: A2 (papel), A3 (saber) y A4 (cartera).

Así son cinco capacidades y dos conversaciones de venta, que es lo que un comprador entiende.

**El diagnóstico sigue haciendo falta.** Era el punto 6 y lo mantengo como paso previo, no como
producto: ningún cliente debería contratar un agente sin que antes alguien haya mirado cómo
trabaja. Si se publica, se publica como «primero miramos, luego montamos».

---

### A1 · Agente comercial y atención al cliente

El más vendible de los cinco, y el que más fácil es hacer mal.

#### Qué hace

1. Atiende en WhatsApp y en el chat de la web, a cualquier hora.
2. Responde con la información del negocio: qué hace, qué cuesta lo que tiene tarifa, cómo se
   trabaja, dónde está, cuándo abre.
3. Pregunta lo imprescindible para entender qué necesita quien escribe.
4. Agenda la cita en el calendario real, con su hueco libre.
5. Deja la ficha en el CRM con la conversación, el canal y el consentimiento fechado.
6. Cuando no sabe, lo dice y pasa el asunto a una persona.

#### Qué no hace nunca

Esta lista no es prudencia: es lo que hace que el servicio se pueda vender sin miedo.

- **No cierra precios.** Lo de «prepara presupuestos» hay que acotarlo: el agente redacta un
  **borrador** con la tarifa publicada y lo deja para que una persona lo valide y lo envíe. Un
  precio dicho por el agente es un precio ofrecido por el negocio, y de ahí no se sale diciendo
  que se equivocó la máquina.
- **No asesora.** Ni fiscal, ni jurídica, ni médica, ni nada que dependa del caso concreto.
  Informa y agenda; el criterio lo pone el profesional.
- **No cobra ni cierra ventas.**
- **No finge ser humano.** Dice que es un asistente en el primer mensaje.

#### Qué hace falta del cliente antes de empezar

Si no tiene esto, el agente no puede funcionar y conviene saberlo antes de cobrar:

- Tarifa escrita, con lo que entra y lo que no.
- Las veinte preguntas que de verdad le hacen, con la respuesta buena.
- Horario y calendario de citas accesible.
- Quién recibe lo que el agente no sabe resolver, y en cuánto tiempo contesta.

#### Qué hay que montar por nuestra parte

| Pieza | Estado |
|---|---|
| Puente del formulario web al CRM | **ya lo tenemos** (punto 3 del bloque A) |
| Chat en la web | nuevo, pero sencillo |
| Agenda de citas | Odoo Citas ya está instalado; falta conectarlo |
| WhatsApp | **la pieza con dependencia externa**: ver abajo |
| Registro de conversaciones y escalado | nuevo |

**WhatsApp no es gratis ni inmediato.** La aplicación gratuita de WhatsApp Business no se puede
automatizar de forma oficial. Hace falta la API de WhatsApp Business, que exige cuenta de
empresa verificada en Meta, un número dedicado y pagar por conversación. Odoo Enterprise trae
módulo de WhatsApp, lo que ahorraría intermediario: **hay que comprobar si está disponible en
nuestra instancia antes de prometer plazos**. Mientras no esté resuelto, A1 se puede vender
solo con el chat de la web.

#### Dos obligaciones legales que conviene convertir en argumento

- **Avisar de que es una máquina.** El reglamento europeo de inteligencia artificial exige
  decirle a la persona que está hablando con un sistema de IA. Es exigible desde agosto de 2026.
- **Declarar el tratamiento.** Las conversaciones son datos personales, y en WhatsApp el
  intermediario es Meta. Hay que decirlo en la política de privacidad del cliente, fijar cuánto
  se conservan y firmar el encargo de tratamiento.

Un despacho que entrega esto resuelto de serie vende algo que un desarrollador suelto no suele
ni mencionar. **Es la mejor baza que tenemos en este servicio**, más que la técnica.

#### Precio propuesto

Alta cerrada + cuota mensual que incluya el consumo, para que el cliente no reciba una factura
variable que no entiende. Cifras a cerrar al repasar el bloque de precios.

#### Riesgos que hay que vigilar

- Que se invente un precio o un plazo. Se ataja con la regla de no cerrar precios y con un
  guion de respuestas cerrado para lo que tenga tarifa.
- Que el cliente espere que resuelva todo y se lleve una decepción. Se ataja prometiendo menos
  en la web de lo que hace.

---

### A2 a A5

Pendientes de repasar. Se definen igual que A1: qué hace, qué no hace nunca, qué hace falta del
cliente, qué hay que montar, obligaciones legales, precio y riesgos.

## Bloque C · Lo que recomiendo no publicar

### ⬜ C1. «Desarrollo a medida» sin más

Aplicaciones móviles, tiendas online, cualquier cosa que pida el cliente. Es un pozo de horas,
no hay nada que enseñar y se compite por precio contra gente que tiene equipo. Mejor decir no.

### ⬜ C2. Agentes que decidan solos en materia fiscal o laboral

Un agente que calcule una cuota, clasifique un gasto como deducible o conteste a una
notificación es responsabilidad profesional del colegiado. No se publica.

### ⬜ C3. Soporte 24/7 o compromiso de disponibilidad

Siendo una persona, prometerlo es prometer lo que no se puede cumplir. Horario de respuesta
claro y honesto en su lugar.

---

## Dos cosas que hay que resolver antes de publicar

### Dónde va

Mi recomendación: **una quinta área dentro de Valentramites**, no una marca nueva. La
credibilidad viene del despacho —un economista colegiado que además automatiza es una
combinación que casi nadie ofrece—, y una marca nueva empieza de cero. Si más adelante crece,
se separa.

### El alta de actividad

Los servicios informáticos no entran en el epígrafe de la actividad de asesoría. Antes de
facturar el primero hay que mirar el alta de IAE y, con ella, si esas facturas llevan o no
retención de IRPF: la actividad empresarial y la profesional no se tratan igual. Es su terreno,
pero conviene no descubrirlo con la primera factura emitida.

---

## Estado de la página web (3 de noviembre de 2026)

`public/automatizacion.html` existe como **borrador**, visible solo en la copia de pruebas.
Lleva la marca `NO-PUBLICAR`: el flujo de producción la retira y borra sus enlaces, así que no
puede llegar a valentramites.com por accidente.

Para publicarla hay que quitar esa marca, y antes:

| Qué | Quién decide |
|---|---|
| Confirmar o cambiar las tres cifras de precio | el despacho |
| Confirmar que WhatsApp es viable en la instancia de Odoo | comprobación técnica |
| Resolver el alta de IAE de la actividad informática | el despacho |

Las ilustraciones se generan con `python -I marca/ilustraciones.py`; no se editan a mano.
