# Gestoría Fabián — Sitio web

Web de presentación de una gestoría y asesoría integral. Su función principal es **dar a
conocer el despacho y facilitar al máximo que el cliente se ponga en contacto**.

🔗 **En producción:** https://gallartalvaro.github.io/web-fabian-gestoria/

## 🧭 Áreas de trabajo

Contenido tomado del documento `actividades.docx` facilitado por el cliente:

1. **Servicios financieros y contables** — contabilidad, asesoría financiera, fiscal y laboral
2. **Servicios de gestión administrativa** — Administración, gestión empresarial, tráfico, extranjería
3. **Exportación de toda clase de mercancías** — consultoría, documentación, aduanas y logística
4. **Comercio menor de vehículos terrestres** — compraventa, intermediación, trámites y complementos

## ⚠️ Datos pendientes del cliente

Aparecen como **"Pendiente de confirmar"** en la web. Búscalos con `PENDIENTE`:

| Dato | Dónde se cambia |
|------|-----------------|
| Nombre comercial exacto y CIF/NIF | `index.html` (título, marca, Schema.org, pie) |
| Dirección del despacho | `index.html` → sección `#contacto` |
| Teléfono / WhatsApp | `index.html` → sección `#contacto` |
| Email de contacto | `index.html` → `#contacto` **y** `js/main.js` → `CONTACT_EMAIL` |
| Horario de atención | `index.html` → `#contacto` |

> Mientras `CONTACT_EMAIL` esté vacío, el formulario valida los campos pero avisa de que
> el envío por correo aún no está configurado, en vez de abrir un `mailto:` sin destino.

## 🛠️ Tecnología

Sitio estático sin dependencias ni proceso de compilación:

- **HTML5** semántico con datos estructurados (Schema.org `ProfessionalService`) para SEO
- **CSS3** moderno: variables, grid, `clamp()` y respeto a `prefers-reduced-motion`
- **JavaScript** vanilla: menú móvil, revelado al hacer scroll, scroll-spy y formulario `mailto:`

## 📂 Estructura

```
├── index.html          # Página principal (one-page)
├── css/styles.css      # Estilos
├── js/main.js          # Interacciones y formulario
└── assets/             # Logo y favicon (SVG)
```

## 🚀 Desarrollo local

No necesita instalación: abre `index.html` en el navegador, o sirve la carpeta con:

```bash
python -m http.server 8124
```

## 📦 Despliegue

GitHub Pages sirve la rama `main` desde la raíz. **Cada `push` a `main` publica la web
automáticamente**, sin pasos adicionales.

## ✅ Pendiente / mejoras futuras

- [ ] Rellenar los datos de contacto marcados como pendientes
- [ ] Fotos reales del despacho / del equipo
- [ ] Logotipo definitivo (el actual es una propuesta hecha a medida)
- [ ] Página de política de privacidad y aviso legal (obligatorio con formulario de contacto)
- [ ] Formulario con envío real (Formspree, Netlify Forms o similar) en lugar de `mailto:`
- [ ] Dominio propio + Google Business Profile
