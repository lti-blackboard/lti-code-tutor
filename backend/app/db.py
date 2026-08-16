"""
Base de datos local (SQLite).

Tablas:
- intentos: historial de consultas al tutor de IA.
- ejercicios: catálogo de ejercicios.

Incluye también las consultas de agregación para el panel docente
(resumen por ejercicio, alertas de estudiantes atascados, y el
detalle de una sesión puntual sobre un ejercicio).
"""

import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

DB_PATH = Path(__file__).parent.parent / "tutor.db"

UMBRAL_ATASCADO = 3  # intentos en el mismo ejercicio para considerarlo "atascado"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS intentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sesion_id TEXT NOT NULL,
            ejercicio_id TEXT NOT NULL,
            pregunta TEXT NOT NULL,
            pidio_respuesta_directa INTEGER DEFAULT 0,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    conn.commit()
    conn.close()


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
    conn = get_connection()
    fila = conn.execute(
        "SELECT COUNT(*) AS total FROM intentos WHERE sesion_id = ? AND creado_en >= ?",
        (sesion_id, limite_tiempo.strftime("%Y-%m-%d %H:%M:%S")),
    ).fetchone()
    conn.close()
    return fila["total"]


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


def listar_ejercicios(lenguaje: str = None, tema: str = None):
    conn = get_connection()
    query = "SELECT * FROM ejercicios WHERE 1=1"
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


def cargar_catalogo_inicial(ejercicios: list):
    conn = get_connection()
    for ej in ejercicios:
        conn.execute(
            """
            INSERT OR IGNORE INTO ejercicios
                (id, tema, titulo, enunciado, lenguaje, nivel, codigo_base, orden)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ej["id"], ej["tema"], ej["titulo"], ej["enunciado"],
                ej["lenguaje"], ej["nivel"], ej["codigo_base"], ej["orden"],
            ),
        )
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
            HAVING intentos >= ?
        )
        """,
        (UMBRAL_ATASCADO,),
    ).fetchone()["total"]

    pidieron_directa = conn.execute(
        "SELECT COUNT(*) AS total FROM intentos WHERE pidio_respuesta_directa = 1"
    ).fetchone()["total"]

    conn.close()

    porcentaje_directa = (
        round((pidieron_directa / total_consultas) * 100) if total_consultas else 0
    )

    return {
        "total_consultas": total_consultas,
        "estudiantes_activos": estudiantes_activos,
        "estudiantes_atascados": estudiantes_atascados,
        "porcentaje_pidio_directa": porcentaje_directa,
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
        GROUP BY i.ejercicio_id
        ORDER BY total_consultas DESC
        """
    ).fetchall()
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
        GROUP BY i.sesion_id, i.ejercicio_id
        HAVING intentos >= ?
        ORDER BY intentos DESC
        """,
        (UMBRAL_ATASCADO,),
    ).fetchall()
    conn.close()

    return [
        {
            "sesion_id": fila["sesion_id"],
            "ejercicio_id": fila["ejercicio_id"],
            "titulo": fila["titulo"] or fila["ejercicio_id"],
            "lenguaje": fila["lenguaje"] or "-",
            "intentos": fila["intentos"],
        }
        for fila in filas
    ]


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
