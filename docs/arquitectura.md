# Arquitectura

Qué hay montado y por qué cada pieza está donde está. Para el día a día —publicar, añadir una
ayuda, resolver una avería— vaya a [operacion.md](operacion.md).

## El conjunto

```
                    ┌──────────────────────────────────────────┐
  rama pruebas ───► │ GitHub Pages · copia de revisión         │
                    └──────────────────────────────────────────┘
                                   │ usted aprueba
                                   ▼
                    ┌──────────────────────────────────────────┐
  rama main ──────► │ Hostinger · valentramites.com            │
                    └──────────────────────────────────────────┘
                                   │ formularios y tests
                                   ▼
        Cloudflare Worker ──────► Odoo CRM (oportunidades)
                                   ▲
        Odoo Citas (agenda) ───────┘

  BDNS ──► GitHub Actions (lunes) ──► incidencia con las convocatorias nuevas
```

## Las piezas

| Carpeta | Qué es | Dónde se ejecuta |
|---|---|---|
| `public/` | La web. HTML, CSS y JavaScript planos, sin compilación | Navegador del visitante |
| `backend/` | Receptor que convierte los formularios en oportunidades de Odoo | Cloudflare Workers |
| `vigilancia/` | Revisión semanal de convocatorias nuevas en la BDNS | GitHub Actions |
| `marca/` | Generador de los archivos del logotipo | A mano, cuando cambie la marca |
| `.github/workflows/` | Publicación, vigilancia y diagnóstico | GitHub Actions |

**Solo se publica `public/`.** Al servidor no llegan ni el receptor, ni la documentación, ni
nada propio de git.

## La web

Siete páginas, 440 KB en total, sin dependencias ni proceso de compilación:

| Página | Para qué |
|---|---|
| `index.html` | Portada: servicios por áreas, proceso, contacto |
| `subvenciones.html` | Listado de convocatorias en plazo |
| `ayuda-*.html` | Una por convocatoria: ficha + test de elegibilidad |
| `precios.html` | Tarifas de autónomos y empresas |
| `privacidad.html` | Política de privacidad (**borrador**, ver [pendientes.md](pendientes.md)) |

Los guiones que las mueven:

| Archivo | Responsabilidad |
|---|---|
| `js/config.js` | Todos los datos de contacto y la dirección del receptor, en un solo sitio |
| `js/main.js` | Menú, explorador de áreas, acordeones, formulario largo |
| `js/subvenciones-data.js` | **Las convocatorias**: plazos, preguntas del test y reglas de evaluación |
| `js/subvenciones.js` | Motor del test, estado de los plazos y captación |
| `js/contacto.js` | Panel de contacto con las cuatro vías |
| `js/precios.js` | Selector de tarifas autónomos / empresas |

### Las fechas mandan

Ningún plazo está escrito a mano en el texto. Cualquier elemento con
`data-plazo data-inicio="AAAA-MM-DD" data-fin="AAAA-MM-DD"` se rellena solo con «Quedan N días»,
«Abre el …» o «Plazo cerrado», y **cuando quedan menos de dos días la convocatoria se retira**:
desaparece del listado y su ficha deja de ofrecer el test. El margen es la constante
`MARGEN_MINIMO` de `js/subvenciones.js`.

Consecuencia práctica: la web no se queda desfasada aunque nadie la toque durante semanas.

### El test de elegibilidad

Cada convocatoria es un objeto en `js/subvenciones-data.js` con tres partes: `preguntas`,
`evaluar()` —que decide si encaja— y `etiquetar()` —que deduce el perfil del cliente—. El motor
(`js/subvenciones.js`) es genérico: no sabe nada de ninguna ayuda concreta.

El criterio de `evaluar()` está explicado en [decisiones.md](decisiones.md#el-test-no-descarta-a-la-ligera).

## El receptor de contactos

La web es estática y no puede hablar con Odoo: haría falta la clave de API en el navegador. El
Worker de Cloudflare es la pieza mínima que guarda ese secreto.

Recibe un **perfil de cliente** versionado (`version: 2`) y crea una oportunidad en el CRM con el
diagnóstico completo, las etiquetas de perfil, la procedencia de la visita y la fecha de cierre
de la convocatoria como fecha límite. Detalle en [backend/README.md](../backend/README.md).

Vive **fuera de Odoo**, así que no factura «Custom Code Maintenance» (regla 1 de `CLAUDE.md`).

Si el receptor falla, el formulario ofrece el diagnóstico ya redactado por WhatsApp o correo: un
fallo de red no cuesta un cliente.

## La vigilancia de convocatorias

Cada lunes consulta la BDNS —el registro donde por ley se publican todas las convocatorias de
España— y abre una incidencia en GitHub con las que encajan. Filtra de 230 a 2 por quincena.
Detalle y criterios en [vigilancia/README.md](../vigilancia/README.md).

## La publicación

Dos ramas, explicado en [operacion.md](operacion.md#publicar).

Tres salvaguardas antes de subir nada a producción: que estén las siete páginas y el `.htaccess`,
que las pruebas del receptor pasen, y que cada página conserve su hoja de estilos y sus guiones
tras versionar las rutas.

**Las rutas de CSS y JS se versionan en cada publicación** (`styles.css?v=3405163`) porque la CDN
de Hostinger cachea con agresividad. Sin eso, un cambio de plazo tardaba días en llegar a quien
ya había visitado la web.

## Servicios externos

| Servicio | Para qué | Coste |
|---|---|---|
| Hostinger | Alojamiento de la web y el dominio | Contratado |
| GitHub | Código, publicación y vigilancia | Gratuito |
| Cloudflare Workers | Receptor de contactos | Gratuito (100.000 peticiones/día) |
| Odoo | CRM, agenda de citas | Contratado |
| BDNS | Fuente de convocatorias | Gratuito, sin registro |

## Lo que no hay, a propósito

- **Sin base de datos propia.** Los contactos viven en Odoo, que es donde se trabajan.
- **Sin cookies ni analítica.** Ver [pendientes.md](pendientes.md) para la decisión pendiente.
- **Sin compilación.** Lo que hay en `public/` es exactamente lo que se sirve.
- **Sin publicación automática de fichas de ayudas.** Ver [decisiones.md](decisiones.md).
