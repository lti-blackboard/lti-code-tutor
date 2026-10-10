"""
Base de datos del backend.

- Si existe la variable de entorno DATABASE_URL, se usa PostgreSQL (por
  ejemplo Neon): los datos son permanentes y sobreviven a cada despliegue.
- Si no existe, se usa SQLite en un archivo local (tutor.db): cómodo para
  desarrollar en el computador, pero en Render ese archivo se borra cada
  vez que el servidor se reinicia o se vuelve a desplegar.

Las consultas se escriben con "?" como marcador; para PostgreSQL se
traducen automáticamente a "%s".

Tablas:
- intentos: historial de consultas al tutor de IA.
- ejecuciones: cada ejecución de código (exitosa = sin errores;
  resuelto = la salida coincidió con la salida esperada).
- ejercicios: catálogo de ejercicios (incluye la salida esperada).

Incluye también las consultas de agregación para el panel docente
(resumen por ejercicio, alertas de estudiantes atascados, y el
detalle de una sesión puntual sobre un ejercicio).
"""

import os
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv()

DB_PATH = Path(__file__).parent.parent / "tutor.db"

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
USA_POSTGRES = DATABASE_URL.startswith(("postgres://", "postgresql://"))

if USA_POSTGRES:
    import psycopg
    from psycopg.rows import dict_row

UMBRAL_ATASCADO = 3  # intentos en el mismo ejercicio para considerarlo "atascado"


class _Conexion:
    """
    Envoltorio mínimo para que el resto del código use la misma interfaz
    (execute / commit / close) con SQLite y con PostgreSQL.
    """

    def __init__(self):
        if USA_POSTGRES:
            self._conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        else:
            self._conn = sqlite3.connect(DB_PATH)
            self._conn.row_factory = sqlite3.Row

    def execute(self, sql, params=()):
        if USA_POSTGRES:
            sql = sql.replace("?", "%s")
        return self._conn.execute(sql, params)

    def commit(self):
        self._conn.commit()

    def close(self):
        self._conn.close()


def get_connection():
    return _Conexion()


def init_db():
    conn = get_connection()
    if USA_POSTGRES:
        columnas_id = "id SERIAL PRIMARY KEY"
        fecha_por_defecto = "(NOW() AT TIME ZONE 'UTC')"
    else:
        columnas_id = "id INTEGER PRIMARY KEY AUTOINCREMENT"
        fecha_por_defecto = "CURRENT_TIMESTAMP"
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS intentos (
            {columnas_id},
            sesion_id TEXT NOT NULL,
            ejercicio_id TEXT NOT NULL,
            pregunta TEXT NOT NULL,
            pidio_respuesta_directa INTEGER DEFAULT 0,
            creado_en TIMESTAMP DEFAULT {fecha_por_defecto}
        )
        """
    )
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS ejecuciones (
            {columnas_id},
            sesion_id TEXT NOT NULL,
            ejercicio_id TEXT NOT NULL,
            exitosa INTEGER NOT NULL,
            creado_en TIMESTAMP DEFAULT {fecha_por_defecto}
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS ejercicios (
            id TEXT PRIMARY KEY,
            tema TEXT NOT NULL,
            titulo TEXT NOT NULL,
            enunciado TEXT NOT NULL,
            lenguaje TEXT NOT NULL,
            nivel TEXT NOT NULL,
            codigo_base TEXT NOT NULL,
            orden INTEGER NOT NULL
        )
        """
    )
    # Columna agregada después: marca los ejercicios creados por el docente.
    if not _existe_columna(conn, "ejercicios", "personalizado"):
        conn.execute("ALTER TABLE ejercicios ADD COLUMN personalizado INTEGER DEFAULT 0")
    # Salida que debe imprimir una solución correcta (vacía = no se valida).
    if not _existe_columna(conn, "ejercicios", "salida_esperada"):
        conn.execute("ALTER TABLE ejercicios ADD COLUMN salida_esperada TEXT DEFAULT ''")
    # Ejercicios base editados por el docente (el original sigue en el catálogo).
    if not _existe_columna(conn, "ejercicios", "modificado"):
        conn.execute("ALTER TABLE ejercicios ADD COLUMN modificado INTEGER DEFAULT 0")
    # Ejercicios ocultos para los estudiantes (los base no se borran).
    if not _existe_columna(conn, "ejercicios", "oculto"):
        conn.execute("ALTER TABLE ejercicios ADD COLUMN oculto INTEGER DEFAULT 0")
    # Marca las ejecuciones cuya salida coincidió con la salida esperada.
    if not _existe_columna(conn, "ejecuciones", "resuelto"):
        conn.execute("ALTER TABLE ejecuciones ADD COLUMN resuelto INTEGER DEFAULT 0")
    conn.commit()
    conn.close()


def _existe_columna(conn, tabla: str, columna: str) -> bool:
    if USA_POSTGRES:
        fila = conn.execute(
            "SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?",
            (tabla, columna),
        ).fetchone()
        return fila is not None
    filas = conn.execute(f"PRAGMA table_info({tabla})").fetchall()
    return any(f["name"] == columna for f in filas)


def contar_intentos(sesion_id: str, ejercicio_id: str) -> int:
    conn = get_connection()
    fila = conn.execute(
        "SELECT COUNT(*) AS total FROM intentos WHERE sesion_id = ? AND ejercicio_id = ?",
        (sesion_id, ejercicio_id),
    ).fetchone()
    conn.close()
    return fila["total"]


def contar_consultas_recientes(sesion_id: str, ventana_minutos: int) -> int:
    limite_tiempo = datetime.utcnow() - timedelta(minutes=ventana_minutos)
    limite = limite_tiempo if USA_POSTGRES else limite_tiempo.strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    fila = conn.execute(
        "SELECT COUNT(*) AS total FROM intentos WHERE sesion_id = ? AND creado_en >= ?",
        (sesion_id, limite),
    ).fetchone()
    conn.close()
    return fila["total"]


def segundos_para_nueva_consulta(sesion_id: str, ventana_minutos: int) -> int:
    """
    Segundos que faltan para que la consulta más antigua de la ventana deje
    de contar (es decir, para que se libere un cupo). 0 si no hay consultas.
    """
    ahora = datetime.utcnow()
    limite_tiempo = ahora - timedelta(minutes=ventana_minutos)
    limite = limite_tiempo if USA_POSTGRES else limite_tiempo.strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    fila = conn.execute(
        "SELECT MIN(creado_en) AS primera FROM intentos WHERE sesion_id = ? AND creado_en >= ?",
        (sesion_id, limite),
    ).fetchone()
    conn.close()
    primera = fila["primera"]
    if not primera:
        return 0
    if isinstance(primera, str):
        primera = datetime.strptime(primera[:19], "%Y-%m-%d %H:%M:%S")
    if primera.tzinfo is not None:
        primera = primera.replace(tzinfo=None)
    libera = primera + timedelta(minutes=ventana_minutos)
    return max(0, int((libera - ahora).total_seconds()) + 1)


def registrar_intento(
    sesion_id: str, ejercicio_id: str, pregunta: str, pidio_respuesta_directa: bool
):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO intentos (sesion_id, ejercicio_id, pregunta, pidio_respuesta_directa)
        VALUES (?, ?, ?, ?)
        """,
        (sesion_id, ejercicio_id, pregunta, int(pidio_respuesta_directa)),
    )
    conn.commit()
    conn.close()


def registrar_ejecucion(
    sesion_id: str, ejercicio_id: str, exitosa: bool, resuelto: bool = False
):
    """Registra cada ejecución de código: sirve para saber quién logró
    ejecutar el ejercicio sin errores, y quién lo resolvió (salida correcta)."""
    conn = get_connection()
    conn.execute(
        "INSERT INTO ejecuciones (sesion_id, ejercicio_id, exitosa, resuelto) VALUES (?, ?, ?, ?)",
        (sesion_id, ejercicio_id, int(exitosa), int(resuelto)),
    )
    conn.commit()
    conn.close()


def _pares_con_exito(conn):
    """Conjunto de (sesion_id, ejercicio_id) con al menos una ejecución sin errores."""
    filas = conn.execute(
        "SELECT DISTINCT sesion_id, ejercicio_id FROM ejecuciones WHERE exitosa = 1"
    ).fetchall()
    return {(f["sesion_id"], f["ejercicio_id"]) for f in filas}


def estado_ejercicios_sesion(sesion_id: str) -> dict:
    """
    Estado de cada ejercicio trabajado por una sesión:
    - "resuelto": alguna ejecución entregó la salida esperada.
    - "en_progreso": tiene consultas al tutor o ejecuciones, pero no está resuelto.
    Los ejercicios que no aparecen están "sin empezar".
    """
    conn = get_connection()
    filas = conn.execute(
        """
        SELECT ejercicio_id, MAX(resuelto) AS resuelto FROM (
            SELECT ejercicio_id, resuelto FROM ejecuciones WHERE sesion_id = ?
            UNION ALL
            SELECT ejercicio_id, 0 AS resuelto FROM intentos WHERE sesion_id = ?
        ) t
        GROUP BY ejercicio_id
        """,
        (sesion_id, sesion_id),
    ).fetchall()
    conn.close()
    return {
        f["ejercicio_id"]: "resuelto" if f["resuelto"] else "en_progreso"
        for f in filas
    }


def _pares_resueltos(conn):
    """Conjunto de (sesion_id, ejercicio_id) con al menos una ejecución resuelta."""
    filas = conn.execute(
        "SELECT DISTINCT sesion_id, ejercicio_id FROM ejecuciones WHERE resuelto = 1"
    ).fetchall()
    return {(f["sesion_id"], f["ejercicio_id"]) for f in filas}


def origen_ejercicio(ejercicio: dict) -> str:
    """"creado" (por el docente), "modificado" (base editado) o "base"."""
    if ejercicio.get("personalizado"):
        return "creado"
    if ejercicio.get("modificado"):
        return "modificado"
    return "base"


def listar_ejercicios(lenguaje: str = None, tema: str = None):
    """Ejercicios visibles para los estudiantes (sin los ocultos)."""
    conn = get_connection()
    query = "SELECT * FROM ejercicios WHERE COALESCE(oculto, 0) = 0"
    params = []
    if lenguaje:
        query += " AND lenguaje = ?"
        params.append(lenguaje)
    if tema:
        query += " AND tema = ?"
        params.append(tema)
    query += " ORDER BY orden ASC"
    filas = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(fila) for fila in filas]


def obtener_ejercicio(ejercicio_id: str):
    conn = get_connection()
    fila = conn.execute(
        "SELECT * FROM ejercicios WHERE id = ?", (ejercicio_id,)
    ).fetchone()
    conn.close()
    return dict(fila) if fila else None


# ---------- Gestión de ejercicios por el docente ----------
# El docente puede editar todos los ejercicios. Los del catálogo base no se
# borran: se ocultan, y si se editaron se pueden restaurar al original (que
# sigue en catalogo_ejercicios.py). Los creados por el docente sí se eliminan.

def listar_ejercicios_docente():
    """Todos los ejercicios, incluidos los ocultos, con su origen."""
    conn = get_connection()
    filas = conn.execute("SELECT * FROM ejercicios ORDER BY orden ASC").fetchall()
    conn.close()
    resultado = []
    for f in filas:
        ej = dict(f)
        ej["origen"] = origen_ejercicio(ej)
        ej["oculto"] = int(ej.get("oculto") or 0)
        resultado.append(ej)
    return resultado


def crear_ejercicio_docente(datos: dict) -> dict:
    conn = get_connection()
    siguiente = conn.execute(
        "SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM ejercicios"
    ).fetchone()["siguiente"]
    conn.execute(
        """
        INSERT INTO ejercicios
            (id, tema, titulo, enunciado, lenguaje, nivel, codigo_base, orden,
             personalizado, salida_esperada)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """,
        (
            datos["id"], datos["tema"], datos["titulo"], datos["enunciado"],
            datos["lenguaje"], datos["nivel"], datos["codigo_base"], siguiente,
            datos.get("salida_esperada", ""),
        ),
    )
    conn.commit()
    conn.close()
    return obtener_ejercicio(datos["id"])


def actualizar_ejercicio_docente(ejercicio_id: str, datos: dict):
    """Edita cualquier ejercicio. Si es del catálogo base, queda como "modificado"."""
    conn = get_connection()
    cursor = conn.execute(
        """
        UPDATE ejercicios
        SET tema = ?, titulo = ?, enunciado = ?, lenguaje = ?, nivel = ?, codigo_base = ?,
            salida_esperada = ?,
            modificado = CASE WHEN personalizado = 1 THEN 0 ELSE 1 END
        WHERE id = ?
        """,
        (
            datos["tema"], datos["titulo"], datos["enunciado"], datos["lenguaje"],
            datos["nivel"], datos["codigo_base"], datos.get("salida_esperada", ""),
            ejercicio_id,
        ),
    )
    actualizados = cursor.rowcount
    conn.commit()
    conn.close()
    return obtener_ejercicio(ejercicio_id) if actualizados else None


def cambiar_visibilidad_ejercicio(ejercicio_id: str, oculto: bool):
    conn = get_connection()
    cursor = conn.execute(
        "UPDATE ejercicios SET oculto = ? WHERE id = ?", (int(oculto), ejercicio_id)
    )
    actualizados = cursor.rowcount
    conn.commit()
    conn.close()
    return obtener_ejercicio(ejercicio_id) if actualizados else None


def restaurar_ejercicio_base(ejercicio_id: str, original: dict):
    """Vuelve un ejercicio base a su versión del catálogo (mantiene si está oculto)."""
    conn = get_connection()
    cursor = conn.execute(
        """
        UPDATE ejercicios
        SET tema = ?, titulo = ?, enunciado = ?, lenguaje = ?, nivel = ?, codigo_base = ?,
            salida_esperada = ?, modificado = 0
        WHERE id = ? AND COALESCE(personalizado, 0) = 0
        """,
        (
            original["tema"], original["titulo"], original["enunciado"],
            original["lenguaje"], original["nivel"], original["codigo_base"],
            original.get("salida_esperada", ""), ejercicio_id,
        ),
    )
    actualizados = cursor.rowcount
    conn.commit()
    conn.close()
    return obtener_ejercicio(ejercicio_id) if actualizados else None


def eliminar_ejercicio_docente(ejercicio_id: str) -> bool:
    """Solo elimina ejercicios creados por el docente; los base se ocultan."""
    conn = get_connection()
    cursor = conn.execute(
        "DELETE FROM ejercicios WHERE id = ? AND personalizado = 1", (ejercicio_id,)
    )
    eliminados = cursor.rowcount
    conn.commit()
    conn.close()
    return eliminados > 0


def cargar_catalogo_inicial(ejercicios: list):
    # Inserta solo los ejercicios que todavía no existen (por id).
    sql = """
        INSERT INTO ejercicios
            (id, tema, titulo, enunciado, lenguaje, nivel, codigo_base, orden, salida_esperada)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING
    """
    # Los ejercicios que ya existían antes de agregar la salida esperada la
    # reciben ahora, solo si todavía no tienen una.
    sql_salida = """
        UPDATE ejercicios SET salida_esperada = ?
        WHERE id = ? AND (salida_esperada IS NULL OR salida_esperada = '')
          AND COALESCE(modificado, 0) = 0
    """
    conn = get_connection()
    for ej in ejercicios:
        conn.execute(
            sql,
            (
                ej["id"], ej["tema"], ej["titulo"], ej["enunciado"],
                ej["lenguaje"], ej["nivel"], ej["codigo_base"], ej["orden"],
                ej.get("salida_esperada", ""),
            ),
        )
        if ej.get("salida_esperada"):
            conn.execute(sql_salida, (ej["salida_esperada"], ej["id"]))
    conn.commit()
    conn.close()


# ---------- Agregaciones para el panel docente ----------

def obtener_kpis():
    conn = get_connection()

    total_consultas = conn.execute(
        "SELECT COUNT(*) AS total FROM intentos"
    ).fetchone()["total"]

    estudiantes_activos = conn.execute(
        "SELECT COUNT(DISTINCT sesion_id) AS total FROM intentos"
    ).fetchone()["total"]

    estudiantes_atascados = conn.execute(
        """
        SELECT COUNT(*) AS total FROM (
            SELECT sesion_id, ejercicio_id, COUNT(*) AS intentos
            FROM intentos
            GROUP BY sesion_id, ejercicio_id
            HAVING COUNT(*) >= ?
        )
        """,
        (UMBRAL_ATASCADO,),
    ).fetchone()["total"]

    pidieron_directa = conn.execute(
        "SELECT COUNT(*) AS total FROM intentos WHERE pidio_respuesta_directa = 1"
    ).fetchone()["total"]

    # Ejercicios trabajados: cada combinación sesión + ejercicio con alguna
    # consulta al tutor o alguna ejecución.
    trabajados = conn.execute(
        """
        SELECT COUNT(*) AS total FROM (
            SELECT sesion_id, ejercicio_id FROM intentos
            UNION
            SELECT sesion_id, ejercicio_id FROM ejecuciones
        ) t
        """
    ).fetchone()["total"]
    con_exito = len(_pares_con_exito(conn))
    resueltos = len(_pares_resueltos(conn))

    conn.close()

    porcentaje_directa = (
        round((pidieron_directa / total_consultas) * 100) if total_consultas else 0
    )

    return {
        "total_consultas": total_consultas,
        "estudiantes_activos": estudiantes_activos,
        "estudiantes_atascados": estudiantes_atascados,
        "porcentaje_pidio_directa": porcentaje_directa,
        "ejercicios_trabajados": trabajados,
        "ejercicios_sin_errores": con_exito,
        "porcentaje_sin_errores": round((con_exito / trabajados) * 100) if trabajados else 0,
        "ejercicios_resueltos": resueltos,
        # Tasa de resolución: ejercicios resueltos / ejercicios trabajados.
        "tasa_resolucion": round((resueltos / trabajados) * 100) if trabajados else 0,
    }


def obtener_resumen_por_ejercicio():
    conn = get_connection()
    filas = conn.execute(
        """
        SELECT
            i.ejercicio_id,
            e.titulo,
            e.tema,
            e.lenguaje,
            COUNT(*) AS total_consultas,
            COUNT(DISTINCT i.sesion_id) AS sesiones_unicas
        FROM intentos i
        LEFT JOIN ejercicios e ON e.id = i.ejercicio_id
        GROUP BY i.ejercicio_id, e.titulo, e.tema, e.lenguaje
        ORDER BY total_consultas DESC
        """
    ).fetchall()
    con_exito = _pares_con_exito(conn)
    resueltos = _pares_resueltos(conn)
    conn.close()

    resultado = []
    for fila in filas:
        promedio = (
            round(fila["total_consultas"] / fila["sesiones_unicas"], 1)
            if fila["sesiones_unicas"]
            else 0
        )
        resultado.append(
            {
                "ejercicio_id": fila["ejercicio_id"],
                "titulo": fila["titulo"] or fila["ejercicio_id"],
                "tema": fila["tema"] or "sin catalogar",
                "lenguaje": fila["lenguaje"] or "-",
                "total_consultas": fila["total_consultas"],
                "sesiones_unicas": fila["sesiones_unicas"],
                "promedio_intentos": promedio,
                "sesiones_sin_errores": sum(
                    1 for (_, ej) in con_exito if ej == fila["ejercicio_id"]
                ),
                "sesiones_resueltas": sum(
                    1 for (_, ej) in resueltos if ej == fila["ejercicio_id"]
                ),
            }
        )
    return resultado


def obtener_alertas():
    conn = get_connection()
    filas = conn.execute(
        """
        SELECT
            i.sesion_id,
            i.ejercicio_id,
            e.titulo,
            e.lenguaje,
            COUNT(*) AS intentos
        FROM intentos i
        LEFT JOIN ejercicios e ON e.id = i.ejercicio_id
        GROUP BY i.sesion_id, i.ejercicio_id, e.titulo, e.lenguaje
        HAVING COUNT(*) >= ?
        ORDER BY intentos DESC
        """,
        (UMBRAL_ATASCADO,),
    ).fetchall()
    con_exito = _pares_con_exito(conn)
    resueltos = _pares_resueltos(conn)
    conn.close()

    return [
        {
            "sesion_id": fila["sesion_id"],
            "ejercicio_id": fila["ejercicio_id"],
            "titulo": fila["titulo"] or fila["ejercicio_id"],
            "lenguaje": fila["lenguaje"] or "-",
            "intentos": fila["intentos"],
            "ejecuto_sin_errores": (fila["sesion_id"], fila["ejercicio_id"]) in con_exito,
            "resuelto": (fila["sesion_id"], fila["ejercicio_id"]) in resueltos,
        }
        for fila in filas
    ]


def obtener_preguntas_recientes(limite_por_ejercicio: int = 25, max_ejercicios: int = 5):
    """
    Preguntas al tutor de los ejercicios con más consultas, para que la IA
    pueda identificar dificultades comunes del curso.
    """
    conn = get_connection()
    top = conn.execute(
        """
        SELECT i.ejercicio_id, e.titulo, e.tema, e.lenguaje, COUNT(*) AS total
        FROM intentos i
        LEFT JOIN ejercicios e ON e.id = i.ejercicio_id
        GROUP BY i.ejercicio_id, e.titulo, e.tema, e.lenguaje
        ORDER BY total DESC
        LIMIT ?
        """,
        (max_ejercicios,),
    ).fetchall()
    resultado = []
    for t in top:
        preguntas = conn.execute(
            """
            SELECT pregunta, pidio_respuesta_directa FROM intentos
            WHERE ejercicio_id = ?
            ORDER BY creado_en DESC
            LIMIT ?
            """,
            (t["ejercicio_id"], limite_por_ejercicio),
        ).fetchall()
        resultado.append(
            {
                "titulo": t["titulo"] or t["ejercicio_id"],
                "tema": t["tema"] or "sin catalogar",
                "lenguaje": t["lenguaje"] or "-",
                "total_consultas": t["total"],
                "preguntas": [p["pregunta"] for p in preguntas],
            }
        )
    conn.close()
    return resultado


def obtener_detalle_sesion_ejercicio(sesion_id: str, ejercicio_id: str):
    """
    Trae el historial completo de preguntas de una sesión sobre un
    ejercicio en particular, en orden cronológico — para que el
    profesor pueda ver exactamente qué fue preguntando el estudiante.
    """
    conn = get_connection()
    filas = conn.execute(
        """
        SELECT
            i.pregunta,
            i.pidio_respuesta_directa,
            i.creado_en,
            e.titulo,
            e.enunciado,
            e.lenguaje
        FROM intentos i
        LEFT JOIN ejercicios e ON e.id = i.ejercicio_id
        WHERE i.sesion_id = ? AND i.ejercicio_id = ?
        ORDER BY i.creado_en ASC
        """,
        (sesion_id, ejercicio_id),
    ).fetchall()
    conn.close()

    if not filas:
        return None

    return {
        "sesion_id": sesion_id,
        "ejercicio_id": ejercicio_id,
        "titulo": filas[0]["titulo"] or ejercicio_id,
        "enunciado": filas[0]["enunciado"],
        "lenguaje": filas[0]["lenguaje"] or "-",
        "intentos": [
            {
                "pregunta": fila["pregunta"],
                "pidio_respuesta_directa": bool(fila["pidio_respuesta_directa"]),
                "creado_en": fila["creado_en"],
            }
            for fila in filas
        ],
    }
