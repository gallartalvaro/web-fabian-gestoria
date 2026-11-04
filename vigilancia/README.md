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
| `REGIONES` | Territorio | Comunitat Valenciana y sus tres provincias, y Comunidad de Madrid |
| `MUNICIPIOS` | Qué convocatorias locales se admiten | València y su área metropolitana, y Madrid capital |
| `DESTINATARIOS` | A quién debe dirigirse la ayuda | pymes, empresas y personas físicas con actividad económica |
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
