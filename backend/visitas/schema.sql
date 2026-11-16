-- ============================================================
-- Valentramites — Medición de visitas
-- ------------------------------------------------------------
-- Tablas de contadores. Ni una columna con un identificador: no
-- hay IP, ni cookie, ni huella, ni identificador de sesión. Cada
-- fila es una combinación de características y un número.
--
--   wrangler d1 execute valentramites-visitas --remote --file=schema.sql
--
-- El fichero es idempotente: se puede volver a ejecutar sobre una
-- base que ya tiene datos sin perder nada.
-- ============================================================

-- Páginas vistas y visitas.
CREATE TABLE IF NOT EXISTS visitas (
  dia         TEXT    NOT NULL,   -- 2026-11-16 (UTC)
  hora        INTEGER NOT NULL,   -- 0..23 (UTC)
  ruta        TEXT    NOT NULL,   -- /subvenciones.html, sin parámetros ni ancla
  referente   TEXT    NOT NULL,   -- solo el dominio, o 'directo'
  pais        TEXT    NOT NULL,   -- código de dos letras que deduce Cloudflare
  dispositivo TEXT    NOT NULL,   -- movil | tableta | escritorio | nd
  entorno     TEXT    NOT NULL,   -- produccion | pruebas
  paginas     INTEGER NOT NULL DEFAULT 0,
  visitas     INTEGER NOT NULL DEFAULT 0,  -- sesiones que empezaron aquí
  PRIMARY KEY (dia, hora, ruta, referente, pais, dispositivo, entorno)
);
CREATE INDEX IF NOT EXISTS visitas_dia ON visitas (entorno, dia);

-- Acciones con nombre: enviar el formulario, pulsar WhatsApp…
CREATE TABLE IF NOT EXISTS eventos (
  dia     TEXT    NOT NULL,
  ruta    TEXT    NOT NULL,
  nombre  TEXT    NOT NULL,
  entorno TEXT    NOT NULL,
  veces   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, ruta, nombre, entorno)
);
CREATE INDEX IF NOT EXISTS eventos_dia ON eventos (entorno, dia);

-- Dónde se pulsa. El "elemento" es el texto visible del enlace o
-- botón, recortado. No se guardan coordenadas: con una web que se
-- adapta a la pantalla no significan nada.
CREATE TABLE IF NOT EXISTS clics (
  dia      TEXT    NOT NULL,
  ruta     TEXT    NOT NULL,
  elemento TEXT    NOT NULL,
  tipo     TEXT    NOT NULL,   -- enlace | boton | pestana | detalle
  entorno  TEXT    NOT NULL,
  veces    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, ruta, elemento, tipo, entorno)
);
CREATE INDEX IF NOT EXISTS clics_dia ON clics (entorno, dia);

-- Hasta dónde se baja en cada página: 25, 50, 75 o 100 %.
CREATE TABLE IF NOT EXISTS lectura (
  dia          TEXT    NOT NULL,
  ruta         TEXT    NOT NULL,
  profundidad  INTEGER NOT NULL,
  entorno      TEXT    NOT NULL,
  veces        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, ruta, profundidad, entorno)
);
CREATE INDEX IF NOT EXISTS lectura_dia ON lectura (entorno, dia);

-- Cuánto se queda la gente, por tramos. No se guarda el segundo
-- exacto: el tramo dice lo mismo y no individualiza a nadie.
CREATE TABLE IF NOT EXISTS permanencia (
  dia     TEXT    NOT NULL,
  ruta    TEXT    NOT NULL,
  tramo   TEXT    NOT NULL,   -- '0-10s' | '10-30s' | '30-60s' | '1-3min' | '3min+'
  entorno TEXT    NOT NULL,
  veces   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, ruta, tramo, entorno)
);
CREATE INDEX IF NOT EXISTS permanencia_dia ON permanencia (entorno, dia);

-- Dimensiones de poca variedad, todas en una tabla para no
-- multiplicar las filas de "visitas". Se cuentan una vez por
-- visita, no por página.
CREATE TABLE IF NOT EXISTS contexto (
  dia     TEXT    NOT NULL,
  clase   TEXT    NOT NULL,   -- navegador | sistema | idioma | campana
  valor   TEXT    NOT NULL,
  entorno TEXT    NOT NULL,
  veces   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, clase, valor, entorno)
);
CREATE INDEX IF NOT EXISTS contexto_dia ON contexto (entorno, dia);
