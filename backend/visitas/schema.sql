-- ============================================================
-- Valentramites — Medición de visitas
-- ------------------------------------------------------------
-- Dos tablas de contadores. Ni una columna con un identificador:
-- no hay IP, ni cookie, ni huella, ni identificador de sesión.
-- Cada fila es una combinación de características y un número.
--
--   wrangler d1 execute valentramites-visitas --file=schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS visitas (
  dia         TEXT    NOT NULL,   -- 2026-11-16 (UTC)
  hora        INTEGER NOT NULL,   -- 0..23 (UTC)
  ruta        TEXT    NOT NULL,   -- /subvenciones.html, sin parámetros ni ancla
  referente   TEXT    NOT NULL,   -- solo el dominio, o 'directo'
  pais        TEXT    NOT NULL,   -- código de dos letras que deduce Cloudflare
  dispositivo TEXT    NOT NULL,   -- movil | tableta | escritorio | nd
  entorno     TEXT    NOT NULL,   -- produccion | pruebas
  paginas     INTEGER NOT NULL DEFAULT 0,  -- páginas vistas
  visitas     INTEGER NOT NULL DEFAULT 0,  -- sesiones que empezaron aquí
  PRIMARY KEY (dia, hora, ruta, referente, pais, dispositivo, entorno)
);

-- El cuadro de mando siempre filtra por fecha y entorno.
CREATE INDEX IF NOT EXISTS visitas_dia ON visitas (entorno, dia);

CREATE TABLE IF NOT EXISTS eventos (
  dia     TEXT    NOT NULL,
  ruta    TEXT    NOT NULL,
  nombre  TEXT    NOT NULL,   -- 'test-empezado', 'consulta-enviada'…
  entorno TEXT    NOT NULL,
  veces   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, ruta, nombre, entorno)
);

CREATE INDEX IF NOT EXISTS eventos_dia ON eventos (entorno, dia);
