# Valentramites — Sitio web

Web de la gestoría **Valentramites** (València): presenta el despacho, publica las convocatorias
de subvenciones en plazo con un test que dice al visitante si puede optar a ellas, y convierte a
quien deja sus datos en una oportunidad del CRM.

🔗 **Producción:** https://valentramites.com
🔎 **Copia de revisión:** https://gallartalvaro.github.io/web-fabian-gestoria/

---

## Empiece por aquí

| Documento | Para qué |
|---|---|
| **[docs/operacion.md](docs/operacion.md)** | Publicar, añadir una convocatoria, cambiar datos, y las averías conocidas |
| **[docs/arquitectura.md](docs/arquitectura.md)** | Qué hay montado y cómo encajan las piezas |
| **[docs/decisiones.md](docs/decisiones.md)** | Por qué el proyecto es como es |
| **[docs/pendientes.md](docs/pendientes.md)** | Lo que espera una decisión o un dato |
| **[docs/textos-legales.md](docs/textos-legales.md)** | Qué falta para cerrar aviso legal, privacidad y cookies |

Documentación de cada pieza: [backend/](backend/README.md) ·
[vigilancia/](vigilancia/README.md) · [marca/](marca/README.md)

---

## En dos minutos

**Qué es.** Siete páginas de HTML, CSS y JavaScript planos. Sin dependencias ni compilación: lo
que hay en `public/` es exactamente lo que se sirve.

**Cómo se publica.** Se trabaja en la rama `pruebas`, que se publica sola en GitHub Pages para
revisarla. Al pasarla a `main`, se publica sola en Hostinger.

**Qué pasa cuando alguien deja sus datos.** Un receptor alojado en Cloudflare crea una
oportunidad en Odoo con el diagnóstico completo, etiquetas de perfil y prioridad. Si falla, la
web ofrece el mismo diagnóstico por WhatsApp o correo: nunca se pierde un contacto.

**Qué se actualiza solo.** Los plazos de las convocatorias —incluida su retirada cuando quedan
menos de dos días— y la revisión semanal de convocatorias nuevas en la BDNS.

```
public/          la web (lo único que se publica)
backend/         receptor de contactos → Odoo CRM
vigilancia/      revisión semanal de la BDNS
marca/           generador del logotipo
docs/            esta documentación
```

## Trabajar en local

```bash
python -m http.server 8124 --directory public
```

---

## Criterios que conviene respetar

- **Tratamiento de usted** y registro formal, propio del sector.
- **Divulgación progresiva:** el visitante elige su área y solo ve esa; los 82 servicios no se
  muestran de golpe.
- **Ningún plazo escrito a mano:** las fechas se calculan solas a partir de `data-plazo`.
- **Nada de código dentro de Odoo:** se factura aparte. Toda la lógica vive fuera.
- **Nada llega a producción sin pasar por la copia de revisión.**

El porqué de cada uno está en [docs/decisiones.md](docs/decisiones.md).
