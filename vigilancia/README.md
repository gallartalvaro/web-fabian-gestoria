# Vigilancia de convocatorias

Cada lunes por la mañana, un proceso consulta la **BDNS** —la Base de Datos Nacional de
Subvenciones, donde por ley se publican todas las convocatorias de España— y abre una
incidencia en GitHub con las ayudas nuevas que pueden interesar al despacho. GitHub avisa por
correo.

Si esa semana no ha salido nada, no se abre nada. Ningún aviso vacío.

## Por qué hace falta filtrar

En quince días se publican unas **230 convocatorias** solo en la Comunitat Valenciana. La
inmensa mayoría son subvenciones nominativas de ayuntamientos pequeños a fallas, clubes
deportivos y asociaciones: dinero que va a una entidad concreta y que nadie más puede pedir.

Los filtros dejan pasar entre una y tres por semana. Sin ellos, el aviso sería ruido y dejaría
de leerse.

```
233 publicadas   →   50 en el ámbito del despacho   →   2 para empresas y autónomos
```

## Los criterios, y cómo cambiarlos

Están todos juntos al principio de [`buscar-ayudas.mjs`](buscar-ayudas.mjs):

| Criterio | Qué hace | Valor actual |
|---|---|---|
| `REGIONES` | Territorio | Comunitat Valenciana y sus tres provincias, Comunidad de Madrid y Principado de Asturias |
| `MUNICIPIOS` | Qué convocatorias locales se admiten | València y su área metropolitana, Madrid capital y los principales concejos asturianos |
| `DESTINATARIOS` | A quién debe dirigirse la ayuda | pymes, empresas y personas físicas con actividad económica |
| `ASOCIACIONES` | Segundo público, en bloque aparte | personas jurídicas sin actividad económica |
| `YA_ADJUDICADA` · `NO_ES_CLIENTE` | Lo que se descarta por no poder solicitarlo un cliente | ver abajo |
| `PRESUPUESTO_MINIMO` | Descarta las de importe testimonial | 20.000 € |
| `DIAS` | Periodo que se revisa en cada pasada | 10 (con margen sobre la semana) |

Lo que conviene ajustar con el tiempo es `MUNICIPIOS` —según dónde estén sus clientes— y
`PRESUPUESTO_MINIMO`. Si llegan pocas, baje el importe; si llega ruido, súbalo.

## Dos consultas, no una

Desde octubre de 2026 la vigilancia hace **dos búsquedas** y junta los resultados:

1. Filtrada por territorio, con los códigos de región de la Comunitat Valenciana y de Madrid.
2. Solo del Estado (`tipoAdministracion=C`), **sin filtro de región**.

La segunda hace falta porque muchas convocatorias estatales no van etiquetadas por comunidad: con
el filtro de regiones no salían nunca, aunque se puedan pedir desde cualquier sitio. Las que
aparecen en las dos se deduplican por número de convocatoria.

> Antes de ese cambio el filtro buscaba el nivel `ESTATAL`, y la BDNS lo llama `ESTADO`: **ninguna
> convocatoria del Estado pasó nunca el filtro.** Las dos cosas están corregidas.

El precio de ampliar el alcance es algo más de ruido: el aviso pasa de una o dos por semana a
cuatro o cinco, con alguna convocatoria estatal de sectores que no son los del despacho.

## Probarlo a mano

```bash
DIAS=14 node vigilancia/buscar-ayudas.mjs
```

Deja el resultado en `informe.md` y anota lo revisado en `vistas.json`, que es lo que impide
volver a avisar de la misma convocatoria. Para forzar que vuelva a mirarlo todo, vacíe ese
archivo:

```bash
echo '{"codigos": []}' > vigilancia/vistas.json
```

También puede lanzarse desde **Actions → Vigilancia de convocatorias → Run workflow**,
indicando cuántos días revisar.

## A quién se avisa

Desde noviembre de 2026 esta vigilancia no es solo para uso interno del despacho: es **la puerta
de entrada comercial de la web**. Cualquiera puede darse de alta desde la portada o desde la
página de subvenciones, y queda en Odoo como contacto con la etiqueta `Aviso de subvenciones`
más su actividad y su provincia.

El razonamiento es que una pyme no cambia de asesoría porque vea un anuncio; cambia cuando la
suya le falla. Avisar de una ayuda no le pide que cambie de nada, y el día que el cambio toque,
el despacho ya no es un desconocido.

El recorrido completo está en [`backend/README.md`](../backend/README.md): el alta entra sola en
la lista «Aviso de subvenciones» de *Marketing por correo electrónico*, y el envío se hace
duplicando la plantilla que ya está creada.

### Lo que el aviso NO puede decidir

El alta recoge correo, actividad y provincia. Con eso **no se puede saber si alguien cumple los
requisitos de una convocatoria**, y conviene no confundirse: de los 42 criterios de exclusión de
las diez convocatorias publicadas, esos datos cubren **uno**. Lo que deciden de verdad son la
forma jurídica, el municipio exacto, la antigüedad del alta, la plantilla o el importe de la
inversión, y eso no se pregunta en un formulario de dos campos.

El reparto de papeles es ese, y está bien así:

- **el aviso** acierta con *a quién le puede interesar* (que no le llegue una ayuda de hostelería
  a un transportista);
- **el test de cada convocatoria**, que ya existe y pregunta entre seis y nueve cosas, decide
  *quién cumple*.

El aviso solo tiene que conseguir que entren al test.

## El criterio: que un cliente pueda pedirla y haya trámite que cobrar

Durante un tiempo el filtro era «¿va dirigida a empresas?». No bastaba. La BDNS publica, con esa
misma etiqueta, muchísimos **convenios ya adjudicados a una entidad concreta**: el Ayuntamiento de
Oviedo, por ejemplo, publicó en treinta días un millón de euros repartido en ocho convenios con
fundaciones y asociaciones nombradas. Ahí no hay nada que solicitar ni nada que cobrar.

Desde noviembre de 2026 el criterio es el del despacho: **¿puede presentarse un cliente nuestro, y
hay un trámite por el que facturar?** Se descartan tres cosas:

- **Lo ya adjudicado.** Títulos con «convenio», «nominativa», «subvención directa a…», «a favor
  de…». El beneficiario va nombrado en el propio título.
- **Lo que es para otra administración.** «A los ayuntamientos», «a la universidad».
- **Cooperación internacional.** Las «convocatorias instrumentales» de la AECID.

**No se descarta por ser concesión directa.** Es tentador, porque casi todas las adjudicadas lo
son, pero hay concesiones directas abiertas a cualquiera: la línea **ICO Crecimiento**, de 57
millones, es una de ellas. Lo que descarta es que el beneficiario ya esté puesto.

El aviso dice cuántas se han descartado. Si ese número se dispara una semana, conviene mirarlo en
vez de que la pérdida sea invisible.

En una semana de noviembre de 2026 el efecto fue: 65 convocatorias en el ámbito del despacho → 48
descartadas → **10 aprovechables**. Sin esto, el aviso traía 59 y no se leía.

## Dos públicos, dos bloques

El aviso separa **empresas y autónomos** de **asociaciones y entidades sin actividad económica**.
Son clientes distintos y el segundo bloque es mucho más voluminoso; quien no trabaje con
asociaciones puede saltárselo entero.

## Las que se anuncian antes de salir en el boletín

Una convocatoria **no es válida hasta que su extracto se publica en el diario oficial**, y la BDNS
suele conocerla antes. En ese hueco las fechas que muestra pueden ser de relleno: las dos ayudas de
Torrent de noviembre de 2026 aparecían con plazo «hasta octubre de 2027» cuando sus bases decían
«15 días hábiles desde la publicación del extracto en el BOP», que no había salido.

Avisar de una así y darla por vista es perderla: cuando por fin se publica, ya nadie la mira.

Por eso la vigilancia **las apunta aparte**, en `pendientes` dentro de `vistas.json`, y las vuelve a
consultar en cada pasada. El día que aparece el extracto salen en el aviso bajo el epígrafe
**«Ya han salido en el diario oficial»**, con su fecha de cierre real, que es el momento de
redactar la ficha.

Se dejan de mirar a los **120 días** (`DIAS_PENDIENTE`): o se publicaron sin que nos enterásemos, o
se quedaron en nada.

## Cuando una convocatoria interesa

Dígaselo a Claude con el código BDNS que aparece en el aviso. Redactará la ficha y el test en la
rama `pruebas`, se publicará en la web de revisión, y usted decide si pasa a producción.

**La redacción de los requisitos no se publica sola nunca.** Un test que diga «usted cumple» a
quien no cumple es un problema del despacho, no del programa.

## Dos particularidades de la BDNS

Están resueltas en el código, pero conviene saberlas si algún día hay que tocarlo:

- **Mezcla codificaciones.** Unos registros vienen en Latin-1 y otros en UTF-8, en la misma
  respuesta. Se leen como Latin-1 y se reparan uno a uno.
- **Limita la frecuencia de consultas** y responde `429` si se le aprieta. Hay reintentos con
  espera creciente.
