# Operación

Cómo se hacen las cosas del día a día.

## Publicar

```bash
git checkout pruebas          # aquí se trabaja
# … cambios …
git add -A && git commit -m "…" && git push
```

Eso publica en la **copia de revisión**: https://gallartalvaro.github.io/web-fabian-gestoria/

Cuando esté conforme:

```bash
git checkout main && git merge pruebas && git push && git checkout pruebas
```

Eso publica en **valentramites.com**, en un par de minutos. El resultado de cada publicación se
ve en la pestaña *Actions* del repositorio.

> `main` recibe también commits automáticos de la vigilancia (`Anotar las convocatorias ya
> revisadas [skip ci]`). Si un push a `main` se rechaza, haga `git fetch && git merge origin/main`
> y vuelva a subir.

## Añadir una convocatoria

1. **Un objeto en `public/js/subvenciones-data.js`** con `titulo`, `nombreCorto`, `organismo`,
   `plazo` (fechas `AAAA-MM-DD`), `preguntas`, `evaluar()` y `etiquetar()`.
2. **Duplicar una ficha** (`public/ayuda-*.html`), actualizar el contenido y poner el
   identificador en `<div class="wiz" id="wizard" data-grant="…">`.
3. **Una tarjeta en `public/subvenciones.html`** con `data-convocatoria` y los `data-plazo`.
4. Añadir la página a la lista de comprobación de los dos flujos de `.github/workflows/`.

Los plazos se calculan solos: no escriba «quedan N días» en ningún texto.

Criterio de redacción del test: ver [decisiones.md](decisiones.md#el-test-no-descarta-a-la-ligera).

## Cambiar un dato de contacto

Todo está en `public/js/config.js`: correo, teléfono, WhatsApp, agenda de citas, horario de
atención y dirección del receptor. El horario decide si el panel invita a llamar o a reservar.

## Tocar el receptor de contactos

```bash
cd backend
node test-worker.mjs      # 26 comprobaciones contra un Odoo simulado, sin credenciales
npx wrangler deploy       # publica el cambio
npx wrangler tail         # ver errores en vivo
```

La clave de API de Odoo **no está en el repositorio**: vive en `backend/.dev.vars` (excluido) y,
en producción, cifrada en Cloudflare (`npx wrangler secret put ODOO_API_KEY`).

## Afinar la vigilancia

Los criterios están al principio de `vigilancia/buscar-ayudas.mjs`. Para probarlos:

```bash
DIAS=14 node vigilancia/buscar-ayudas.mjs
```

Para que vuelva a mirar todo desde cero: `echo '{"codigos": []}' > vigilancia/vistas.json`.

También se puede lanzar a mano desde *Actions → Vigilancia de convocatorias → Run workflow*.

## Regenerar el logotipo

```bash
cd marca && npm install && npm run generar
```

Y copiar los archivos a `public/assets/`. Detalle en [marca/README.md](../marca/README.md).

## Trabajar en local

```bash
python -m http.server 8124 --directory public
```

O el perfil `web-fabian` de `.claude/launch.json`.

> El navegador cachea el CSS y los guiones en local. Si un cambio no aparece, fuerce la recarga
> del archivo concreto, no solo de la página.

---

# Averías conocidas

Todas ocurrieron de verdad. Se documentan porque el síntoma no señalaba a la causa.

### La web da 403 y los archivos parecen subidos

`valentramites.com` está dado de alta como **dominio adicional**: no se sirve desde el
`public_html` de la cuenta, sino desde `domains/valentramites.com/public_html`. Un 403 en la raíz
con 404 en cada archivo significa carpeta vacía: los archivos están, pero en otra carpeta.

Para ver la estructura real del FTP sin adivinar: *Actions → Diagnóstico del FTP → Run workflow*.

### Un cambio no llega a los visitantes

La CDN de Hostinger cachea. El origen puede estar bien y la CDN servir lo viejo: compruébelo
añadiendo un parámetro (`?x=1`) a la dirección, que evita la caché. Las rutas versionadas lo
previenen; si aun así ocurre, vacíe la caché en *hPanel → Rendimiento → CDN*.

### El FTP falla con «530 Login incorrect»

Credenciales. El flujo avisa si el usuario o la contraseña llevan espacios invisibles. Si están
limpios, rehaga la contraseña en *hPanel → Archivos → Cuentas FTP* y actualice los secretos.

### El FTP falla con «ENOTFOUND»

El servidor no resuelve. Debe ser `ftp.valentramites.com`, sin `ftp://` delante ni puerto detrás.

### GitHub Pages no publica desde `pruebas`

*Settings → Environments → github-pages → Deployment branches* debe incluir `pruebas`.

### La vigilancia devuelve acentos rotos o falla con 429

La BDNS mezcla registros en Latin-1 y UTF-8 en la misma respuesta, y limita la frecuencia de
consultas. Ambas cosas están resueltas en el código; si se toca, no las pierda de vista.
