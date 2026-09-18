# Valentramites — Sitio web

Web de presentación de una gestoría y asesoría integral. Su función principal es **dar a
conocer el despacho y facilitar al máximo que el cliente se ponga en contacto**.

🔗 **En producción:** https://valentramites.com

## 🧭 Áreas de trabajo

Contenido tomado del documento `actividades.docx` facilitado por el cliente:

1. **Servicios financieros y contables** — contabilidad, asesoría financiera, fiscal y laboral
2. **Servicios de gestión administrativa** — Administración, gestión empresarial, tráfico, extranjería
3. **Exportación de toda clase de mercancías** — consultoría, documentación, aduanas y logística
4. **Comercio menor de vehículos terrestres** — compraventa, intermediación, trámites y complementos

## 🎯 Criterios de diseño

- **Divulgación progresiva.** Los 82 servicios no se muestran de golpe: el visitante
  selecciona su área en el explorador (`.explorer`) y solo ve ese panel, con las subáreas
  plegadas en un acordeón. Así una persona interesada en una única materia no se encuentra
  con el catálogo completo.
- **Registro formal.** Todos los textos emplean tratamiento de **usted**, propio del sector.
  Si se prefiere el tuteo, hay que revisar `index.html` y los mensajes de `js/main.js`.
- **Contacto siempre a mano.** Selector de área en la portada, botón fijo en la cabecera y
  una llamada a la acción al final de cada panel que preselecciona el área en el formulario.
- **Accesible.** Pestañas con patrón ARIA `tablist` (flechas, `Home`/`End`, `aria-selected`),
  acordeones con `aria-expanded` y foco visible. Sin JavaScript se muestra todo desplegado.

## ⚠️ Datos pendientes del cliente

Aparecen como **"Pendiente de confirmar"** en la web. Búscalos con `PENDIENTE`:

| Dato | Dónde se cambia |
|------|-----------------|
| Nombre comercial exacto y CIF/NIF | `index.html` (título, marca, Schema.org, pie) |
| Dirección del despacho | `index.html` → sección `#contacto` |
| Endpoint del formulario | `js/config.js` → `formEndpoint` |

> Mientras `email` esté vacío, el formulario de contacto valida los campos pero avisa de que
> el envío por correo aún no está configurado, en vez de abrir un `mailto:` sin destino.

## 💶 Sección de subvenciones

Capta clientes a partir de las convocatorias de ayudas: el visitante llega buscando
*"emprende y concilia requisitos"*, resuelve su duda en un test de un minuto y, si encaja,
deja sus datos para que el despacho presente la solicitud.

```
subvenciones.html  →  ayuda-<convocatoria>.html  →  test  →  resultado  →  datos de contacto
```

Convocatorias publicadas: **Emprende y Concilia** (Ayuntamiento de València),
**renovación de equipamiento en hostelería** (Ministerio de Industria y Turismo) y
**EMDANA** (Generalitat Valenciana, municipios de la DANA).

**El test no descarta a nadie a la ligera.** Solo devuelve "no encaja" ante un requisito que
la convocatoria excluye sin matices (fecha de alta, municipio, padrón, plantilla, tipo de
entidad). Todo lo demás —IAE pendiente, deudas, falta de certificado digital— se presenta
como *punto a resolver*, que es justamente el trabajo que se contrata. Quien no encaja
tampoco se pierde: se le ofrece aviso de futuras convocatorias.

### Añadir una convocatoria nueva

1. Añada un objeto en `js/subvenciones-data.js` con su `plazo`, sus `preguntas` y su
   función `evaluar()`.
2. Duplique una de las fichas existentes, actualice el contenido y ponga el `id` de la
   convocatoria en `<div class="wiz" id="wizard" data-grant="...">`.
   Si la ayuda no es de cuantía fija, `evaluar()` puede devolver `importeTexto`
   e `importeDetalle` para mostrar un rango en lugar de una cifra.
3. Añada la tarjeta en `subvenciones.html` y, si procede, el banner de `index.html`.

Las etiquetas de estado se calculan solas a partir de las fechas: cualquier elemento con
`data-plazo data-inicio="AAAA-MM-DD" data-fin="AAAA-MM-DD"` muestra "Quedan N días de plazo",
"Abre el …" o "Plazo cerrado", sin tener que tocar la web el día del cierre.

### Dónde llegan los contactos

Quien termina el test y deja sus datos genera un **perfil de cliente**: contacto, convocatoria,
diagnóstico con todas sus respuestas, prioridad de seguimiento y procedencia de la visita.
Ese perfil se envía a `js/config.js` → `formEndpoint`.

El destino previsto es **[backend/](backend/README.md)**, un receptor que crea la oportunidad
en el **CRM de Odoo** con el diagnóstico completo, la fecha de cierre de la convocatoria como
fecha límite y la prioridad ya puesta; si el teléfono o el email ya existen en Contactos, la
oportunidad se engancha a esa ficha en lugar de duplicarla. Vive fuera de Odoo, así que **no
factura "Custom Code Maintenance"**.

Se prueba sin tocar la instancia real ni necesitar credenciales:

```bash
node backend/test-worker.mjs
```

Sin endpoint configurado, o si el envío falla, el test muestra el diagnóstico ya redactado con
botones de WhatsApp y correo, y opción de copiarlo: el contacto no se pierde por un problema de
configuración.

El formato del perfil está versionado (`version: 2`), de modo que se puede cambiar de destino
—una hoja de cálculo del despacho, otro CRM— sin tocar la web.

> El aviso legal del formulario enlaza a `privacidad.html`, que es **un borrador** y debe
> revisarse con los datos reales del despacho antes de publicar.

## 🛠️ Tecnología

Sitio estático sin dependencias ni proceso de compilación:

- **HTML5** semántico con datos estructurados (Schema.org `ProfessionalService`) para SEO
- **CSS3** moderno: variables, grid, `clamp()`, despliegue con `grid-template-rows: 0fr → 1fr`
  y respeto a `prefers-reduced-motion`
- **JavaScript** vanilla: explorador de áreas, acordeones, menú móvil, revelado al hacer
  scroll, scroll-spy y formulario `mailto:`

## 📂 Estructura

```
├── public/                          # LA WEB. Es lo único que se publica
│   ├── index.html                   # Página principal (one-page)
│   ├── subvenciones.html            # Listado de convocatorias abiertas
│   ├── ayuda-*.html                 # Ficha + test de cada convocatoria
│   ├── privacidad.html              # Política de privacidad (borrador)
│   ├── .htaccess                    # Configuración del servidor (Hostinger)
│   ├── css/                         # styles.css y subvenciones.css
│   ├── js/                          # config, main, datos y test de ayudas
│   └── assets/                      # Logo y favicon (SVG)
├── backend/                         # Receptor que crea la oportunidad en Odoo
└── .github/workflows/               # Pruebas y producción
```

La web vive dentro de `public/` para que lo que se sube al servidor sea exactamente
eso: ni el receptor, ni la documentación, ni los archivos de git.

Enlaces profundos: `#financiero`, `#administrativa`, `#exportacion` y `#vehiculos` abren
la página con esa área ya seleccionada (útil para campañas o para el perfil de Google).

## 🚀 Desarrollo local

No necesita instalación: abre `index.html` en el navegador, o sirve la carpeta con:

```bash
python -m http.server 8124
```

## 📦 Despliegue

Dos ramas. Nada llega a los clientes sin verlo antes en una copia real.

```
rama pruebas  →  GitHub Pages   →  [usted revisa]  →  main  →  Hostinger
                   automático                                  automático
```

### 1. Trabajar y revisar

Los cambios se suben a la rama **`pruebas`**. Cada push lanza
`.github/workflows/pruebas.yml`, que comprueba que estén las seis páginas, ejecuta la prueba
del receptor de contactos y publica en **GitHub Pages**:

🔗 https://gallartalvaro.github.io/web-fabian-gestoria/

Esa copia lleva `noindex` y un `robots.txt` que impiden su indexación —si no, competiría en
Google con la web real— y un distintivo **«Copia de pruebas»** en la esquina inferior
izquierda, para no confundirla con producción.

> Requiere **Settings → Pages → Source** en *GitHub Actions*. Si el flujo falla diciendo que
> la rama no puede desplegar, añada `pruebas` en **Settings → Environments → github-pages →
> Deployment branches**.

### 2. Publicar

Cuando la copia de pruebas está conforme, se pasa `pruebas` a **`main`**:

```bash
git checkout main && git merge pruebas && git push
```

Eso dispara `.github/workflows/produccion.yml`, que repite las comprobaciones y sube el
contenido de `public/` por FTP a `public_html/`. **Todo lo que entra en `main` se publica**,
así que main es producción y no se trabaja directamente sobre ella.

Hacen falta tres secretos en **Settings → Secrets and variables → Actions**, con los datos
de *hPanel → Archivos → Cuentas FTP*:

| Secreto | Valor |
|---|---|
| `FTP_SERVIDOR` | El servidor FTP que indica Hostinger (p. ej. `ftp.valentramites.com`) |
| `FTP_USUARIO` | El usuario de la cuenta FTP |
| `FTP_CONTRASENA` | Su contraseña |

Mientras falten, el flujo no da error: avisa en el resumen de la ejecución de que la
publicación está pendiente de configurar.

> **Si prefiere el gestor de git de Hostinger** (hPanel → Avanzado → GIT), conéctelo a la
> rama `main` y seleccione la carpeta **`public`**.

## ✅ Pendiente / mejoras futuras

- [ ] Rellenar la dirección del despacho y confirmar los días de atención
- [ ] Fotos reales del despacho / del equipo
- [ ] Logotipo definitivo (el actual es una propuesta hecha a medida)
- [ ] Revisar `privacidad.html` con los datos reales y redactar el aviso legal
- [ ] Desplegar el receptor de `backend/` y poner su URL en `formEndpoint` (`js/config.js`)
- [ ] Ir publicando nuevas convocatorias en la sección de subvenciones
- [ ] Dominio propio + Google Business Profile
