# -*- coding: utf-8 -*-
"""Genera las ilustraciones vectoriales de la web.

Se generan en lugar de dibujarlas a mano para que todas compartan la
misma retícula, la misma paleta y el mismo grosor de línea: en cuanto
cada escena se dibuja por separado, el conjunto deja de parecer una
familia.

    python -I marca/ilustraciones.py

Escribe public/assets/ilustraciones/*.svg. No se usa texto en ningún
dibujo: así valen igual en castellano que en valenciano o inglés.
"""
import io
import os

# Los mismos valores que css/styles.css. Si allí cambia la marca,
# cambia aquí y se vuelven a generar.
AZUL = "#10243d"
PRIM = "#163a63"
CLARO = "#487ab4"
ORO = "#c08a3e"
ORO_S = "#f2e5cf"
PAPEL = "#ffffff"
FONDO = "#e8eef6"

ANCHO, ALTO = 320, 240          # escenas de los agentes
SALIDA = "public/assets/ilustraciones"


# --------------------------------------------------------------- base

def envoltura(contenido, w=ANCHO, h=ALTO):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
        'viewBox="0 0 %d %d" fill="none">'
        '<defs>'
        '<radialGradient id="d"><stop offset=".45" stop-color="#fff"/>'
        '<stop offset="1" stop-color="#000"/></radialGradient>'
        '<mask id="m"><rect width="%d" height="%d" fill="url(#d)"/></mask>'
        '</defs>%s</svg>\n' % (w, h, w, h, w, h, contenido)
    )


def reticula(w=ANCHO, h=ALTO, paso=20):
    """El mismo cuadriculado que el fondo del hero, desvanecido."""
    trazos = []
    x = paso
    while x < w:
        trazos.append("M%d 0V%d" % (x, h))
        x += paso
    y = paso
    while y < h:
        trazos.append("M0 %dH%d" % (y, w))
        y += paso
    return ('<g stroke="%s" stroke-width="1" opacity=".12" mask="url(#m)">'
            '<path d="%s"/></g>' % (AZUL, " ".join(trazos)))


def fondo(w=ANCHO, h=ALTO, rx=18):
    return ('<rect width="%d" height="%d" rx="%d" fill="%s"/>%s'
            % (w, h, rx, FONDO, reticula(w, h)))


def tarjeta(x, y, w, h, rx=10, relleno=PAPEL, borde=None, giro=None):
    """Rectángulo con una sombra plana debajo: da profundidad sin filtros,
    que es lo que encarece el renderizado de un SVG repetido."""
    borde = borde or "rgba(16,36,61,.16)"
    cuerpo = (
        '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" opacity=".08"'
        ' transform="translate(0 3)"/>'
        '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" stroke="%s"/>'
        % (x, y, w, h, rx, AZUL, x, y, w, h, rx, relleno, borde)
    )
    if giro is None:
        return cuerpo
    return '<g transform="rotate(%s %s %s)">%s</g>' % (
        giro, x + w / 2.0, y + h / 2.0, cuerpo)


def renglones(x, y, anchos, alto=6, salto=14, color=None, op=".55"):
    """Líneas de texto simuladas. Nunca texto de verdad."""
    color = color or CLARO
    piezas = []
    for i, w in enumerate(anchos):
        piezas.append('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"/>'
                      % (x, y + i * salto, w, alto, alto / 2.0, color))
    return '<g opacity="%s">%s</g>' % (op, "".join(piezas))


def flecha(x, y, largo=34):
    """Flecha dorada de 'esto se convierte en aquello'."""
    return ('<g stroke="%s" stroke-width="2.4" stroke-linecap="round" '
            'stroke-linejoin="round"><path d="M%s %sh%s"/>'
            '<path d="M%s %sl7 7-7 7"/></g>'
            % (ORO, x, y, largo, x + largo - 7, y - 7))


# ------------------------------------------------------------ escenas

def comercial():
    """A1 · atiende, responde y agenda a cualquier hora."""
    p = [fondo()]
    # Mensaje de quien pregunta.
    p.append(tarjeta(26, 44, 168, 92, rx=16))
    p.append('<path d="M40 136v16l18-16Z" fill="%s" stroke="rgba(16,36,61,.16)"/>' % PAPEL)
    p.append(renglones(46, 66, [120, 136, 84]))
    # Respuesta del agente, en dorado.
    p.append(tarjeta(118, 152, 168, 62, rx=16, relleno=ORO_S, borde=ORO))
    p.append(renglones(136, 170, [120, 92], color=ORO, op=".75"))
    # Reloj: también de noche.
    p.append(tarjeta(228, 30, 62, 62, rx=31))
    p.append('<g stroke="%s" stroke-width="2.4" stroke-linecap="round">'
             '<path d="M259 46v15l11 7"/></g>' % PRIM)
    p.append('<circle cx="259" cy="61" r="22" stroke="%s" stroke-width="1.5" opacity=".35"/>' % CLARO)
    return envoltura("".join(p))


def administrativo():
    """A2 · entra papel, salen datos."""
    p = [fondo()]
    # Pila de documentos.
    p.append(tarjeta(26, 54, 86, 112, rx=8, giro=-7))
    p.append(tarjeta(34, 48, 86, 112, rx=8, giro=-3))
    p.append(tarjeta(42, 44, 86, 112, rx=8))
    p.append(renglones(54, 62, [62, 48, 56], alto=5, salto=12))
    p.append('<rect x="54" y="118" width="40" height="18" rx="4" fill="%s" opacity=".18"/>' % ORO)
    p.append(flecha(140, 108))
    # Tabla con los datos ya extraídos.
    p.append(tarjeta(192, 50, 102, 118, rx=10))
    p.append('<rect x="192" y="50" width="102" height="22" rx="10" fill="%s"/>' % PRIM)
    p.append('<rect x="192" y="62" width="102" height="10" fill="%s"/>' % PRIM)
    p.append(renglones(204, 57, [34], alto=7, salto=0, color=PAPEL, op=".8"))
    for i in range(4):
        y = 86 + i * 20
        p.append('<rect x="204" y="%d" width="42" height="6" rx="3" fill="%s" opacity=".5"/>'
                 % (y, CLARO))
        p.append('<rect x="254" y="%d" width="28" height="6" rx="3" fill="%s" opacity=".3"/>'
                 % (y, CLARO))
    # El visto bueno sigue siendo humano.
    p.append('<circle cx="286" cy="172" r="18" fill="%s"/>' % ORO)
    p.append('<path d="M278 172l6 6 11-12" stroke="#fff" stroke-width="2.6" '
             'stroke-linecap="round" stroke-linejoin="round"/>')
    return envoltura("".join(p))


def conocimiento():
    """A3 · lo que sabe la empresa, a mano."""
    p = [fondo()]
    # Estantería.
    alturas = [(34, 96), (62, 124), (90, 76), (118, 110), (146, 88)]
    colores = [PRIM, CLARO, ORO, PRIM, CLARO]
    for (x, h), c in zip(alturas, colores):
        p.append('<rect x="%d" y="%d" width="22" height="%d" rx="5" fill="%s" opacity=".9"/>'
                 % (x, 172 - h, h, c))
        p.append('<rect x="%d" y="%d" width="22" height="5" fill="#fff" opacity=".35"/>'
                 % (x, 172 - h + 14))
    p.append('<rect x="26" y="172" width="148" height="7" rx="3.5" fill="%s" opacity=".35"/>' % AZUL)
    # La pregunta.
    p.append(tarjeta(188, 42, 104, 58, rx=14, relleno=ORO_S, borde=ORO))
    p.append('<path d="M232 60a8 8 0 0 1 14 5c0 5-7 6-7 11" stroke="%s" '
             'stroke-width="2.6" stroke-linecap="round"/>' % ORO)
    p.append('<circle cx="239" cy="84" r="2.2" fill="%s"/>' % ORO)
    p.append('<path d="M202 100v14l16-14Z" fill="%s" stroke="%s"/>' % (ORO_S, ORO))
    # Lupa: la respuesta, con su fuente.
    p.append('<circle cx="222" cy="150" r="30" fill="%s" stroke="%s" stroke-width="2"/>'
             % (PAPEL, PRIM))
    p.append(renglones(206, 140, [32, 22], alto=5, salto=11))
    p.append('<path d="M244 172l22 22" stroke="%s" stroke-width="6" stroke-linecap="round"/>' % PRIM)
    return envoltura("".join(p))


def ventas():
    """A4 · la cartera ordenada y con seguimiento."""
    p = [fondo()]
    # Tres columnas con fichas que avanzan.
    for i, fichas in enumerate((3, 2, 1)):
        x = 30 + i * 92
        p.append('<rect x="%d" y="78" width="76" height="130" rx="12" fill="%s" opacity=".5"/>'
                 % (x, PAPEL))
        p.append('<rect x="%d" y="90" width="34" height="6" rx="3" fill="%s" opacity=".45"/>'
                 % (x + 12, CLARO))
        for j in range(fichas):
            y = 108 + j * 34
            ultimo = (i == 2)
            p.append(tarjeta(x + 10, y, 56, 26, rx=7,
                             relleno=ORO_S if ultimo else PAPEL,
                             borde=ORO if ultimo else None))
            p.append('<rect x="%d" y="%d" width="30" height="5" rx="2.5" fill="%s" opacity=".55"/>'
                     % (x + 20, y + 10, ORO if ultimo else CLARO))
    # La tendencia.
    p.append('<path d="M38 60l58-22 54 16 56-30" stroke="%s" stroke-width="2.6" '
             'stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>' % ORO)
    p.append('<circle cx="206" cy="24" r="6" fill="%s"/>' % ORO)
    p.append('<circle cx="96" cy="38" r="4" fill="%s" opacity=".5"/>' % ORO)
    p.append('<circle cx="150" cy="54" r="4" fill="%s" opacity=".5"/>' % ORO)
    return envoltura("".join(p))


def reservas():
    """A5 · agenda, hueco libre y recordatorio."""
    p = [fondo()]
    p.append(tarjeta(30, 40, 196, 164, rx=14))
    p.append('<path d="M30 54a14 14 0 0 1 14-14h168a14 14 0 0 1 14 14v22H30Z" fill="%s"/>' % PRIM)
    p.append('<g stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8">'
             '<path d="M62 32v14M194 32v14"/></g>')
    for fila in range(4):
        for col in range(5):
            cx = 52 + col * 36
            cy = 100 + fila * 26
            if fila == 2 and col == 3:
                continue
            p.append('<circle cx="%d" cy="%d" r="6" fill="%s" opacity=".3"/>' % (cx, cy, CLARO))
    # El hueco que se acaba de ocupar.
    p.append('<rect x="148" y="142" width="56" height="20" rx="10" fill="%s"/>' % ORO)
    p.append('<path d="M164 152l5 5 9-10" stroke="#fff" stroke-width="2.4" '
             'stroke-linecap="round" stroke-linejoin="round"/>')
    # El aviso de la víspera.
    p.append('<circle cx="258" cy="168" r="34" fill="%s"/>' % PAPEL)
    p.append('<circle cx="258" cy="168" r="34" stroke="rgba(16,36,61,.16)"/>')
    p.append('<path d="M258 150a11 11 0 0 1 11 11v8l4 6h-30l4-6v-8a11 11 0 0 1 11-11Z" '
             'stroke="%s" stroke-width="2.2" stroke-linejoin="round"/>' % PRIM)
    p.append('<path d="M253 180a5 5 0 0 0 10 0" stroke="%s" stroke-width="2.2" '
             'stroke-linecap="round"/>' % PRIM)
    p.append('<circle cx="258" cy="147" r="3" fill="%s"/>' % ORO)
    return envoltura("".join(p))


def nucleo():
    """Ilustración de cabecera: un agente conectado a lo que ya usa el
    despacho. Va sobre fondo azul oscuro, así que la paleta se invierte."""
    W, H = 520, 420
    LINEA = "rgba(255,255,255,.28)"
    VIDRIO = "rgba(255,255,255,.07)"
    BORDE = "rgba(255,255,255,.22)"
    p = []

    def satelite(x, y, w, h, dentro):
        return ('<rect x="%s" y="%s" width="%s" height="%s" rx="14" fill="%s" stroke="%s"/>%s'
                % (x, y, w, h, VIDRIO, BORDE, dentro))

    # Conexiones: salen del núcleo y llegan a cada pieza.
    p.append('<g stroke="%s" stroke-width="1.6" stroke-dasharray="5 7">'
             '<path d="M232 196C196 184 168 150 134 128"/>'
             '<path d="M288 196c36-12 62-44 98-66"/>'
             '<path d="M232 236c-36 14-64 44-98 66"/>'
             '<path d="M288 236c36 14 62 44 98 66"/>'
             '</g>' % LINEA)

    # Núcleo.
    p.append('<circle cx="260" cy="216" r="78" fill="rgba(192,138,62,.14)"/>')
    p.append('<circle cx="260" cy="216" r="78" stroke="rgba(192,138,62,.4)"/>')
    p.append('<rect x="206" y="162" width="108" height="108" rx="28" fill="%s" stroke="%s"/>'
             % ("rgba(255,255,255,.12)", "rgba(255,255,255,.34)"))
    p.append('<path d="M260 184l9 20 20 9-20 9-9 20-9-20-20-9 20-9Z" fill="%s"/>' % "#e8c68d")
    p.append('<circle cx="260" cy="216" r="46" stroke="rgba(232,198,141,.35)"/>')

    # Arriba izquierda: la conversación.
    p.append(satelite(36, 76, 128, 84,
                      '<g opacity=".75"><rect x="56" y="100" width="76" height="7" rx="3.5" '
                      'fill="#fff"/><rect x="56" y="116" width="58" height="7" rx="3.5" '
                      'fill="#fff" opacity=".6"/></g>'
                      '<path d="M56 160v16l18-16Z" fill="rgba(255,255,255,.07)" '
                      'stroke="rgba(255,255,255,.22)"/>'))
    # Arriba derecha: el documento.
    p.append(satelite(372, 60, 112, 100,
                      '<g opacity=".7"><rect x="392" y="84" width="54" height="6" rx="3" '
                      'fill="#fff"/><rect x="392" y="100" width="72" height="6" rx="3" '
                      'fill="#fff" opacity=".6"/><rect x="392" y="116" width="46" height="6" '
                      'rx="3" fill="#fff" opacity=".6"/></g>'
                      '<rect x="392" y="132" width="34" height="14" rx="4" '
                      'fill="rgba(232,198,141,.5)"/>'))
    # Abajo izquierda: la agenda.
    p.append(satelite(36, 268, 120, 96,
                      '<rect x="36" y="268" width="120" height="26" rx="14" '
                      'fill="rgba(255,255,255,.14)"/>'
                      '<rect x="36" y="282" width="120" height="12" '
                      'fill="rgba(255,255,255,.14)"/>'
                      + "".join(
                          '<circle cx="%d" cy="%d" r="5" fill="#fff" opacity=".35"/>'
                          % (58 + c * 26, 314 + f * 24)
                          for f in range(2) for c in range(4)
                          if not (f == 1 and c == 2))
                      + '<rect x="98" y="332" width="34" height="14" rx="7" fill="#e8c68d"/>'))
    # Abajo derecha: la ficha del cliente.
    p.append(satelite(372, 262, 112, 104,
                      '<circle cx="402" cy="292" r="14" fill="#fff" opacity=".35"/>'
                      '<rect x="424" y="286" width="44" height="7" rx="3.5" fill="#fff" '
                      'opacity=".6"/><rect x="424" y="299" width="30" height="6" rx="3" '
                      'fill="#fff" opacity=".35"/>'
                      '<g opacity=".55"><rect x="392" y="322" width="76" height="6" rx="3" '
                      'fill="#fff"/><rect x="392" y="336" width="56" height="6" rx="3" '
                      'fill="#fff"/></g>'))
    return envoltura("".join(p), W, H)


# ------------------------------------------------------------- salida

DIBUJOS = {
    "agente-comercial.svg": comercial,
    "agente-administrativo.svg": administrativo,
    "agente-conocimiento.svg": conocimiento,
    "agente-ventas.svg": ventas,
    "agente-reservas.svg": reservas,
    "nucleo-agentes.svg": nucleo,
}

if __name__ == "__main__":
    if not os.path.isdir(SALIDA):
        os.makedirs(SALIDA)
    for nombre, dibujo in sorted(DIBUJOS.items()):
        ruta = os.path.join(SALIDA, nombre)
        contenido = dibujo()
        io.open(ruta, "w", encoding="utf-8", newline="\n").write(contenido)
        print("%-30s %5d bytes" % (nombre, len(contenido)))
