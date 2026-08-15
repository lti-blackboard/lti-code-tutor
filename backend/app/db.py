"""
Base de datos local (SQLite).

Tablas:
- intentos: historial de consultas al tutor de IA (por sesión + ejercicio),
  usado para la lógica pedagógica de intentos progresivos y rate limiting.
- ejercicios: catálogo de ejercicios disponibles, organizados por tema,
  lenguaje y nivel.

SQLite se eligió por ser la opción más simple para esta etapa del proyecto.
"""

import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

DB_PATH = Path(__file__).parent.parent / "tutor.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Crea las tablas si no existen. Se llama al iniciar el servidor."""
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
    """
    Inserta el catálogo de ejercicios si la tabla está vacía.
    No duplica datos si se llama más de una vez (usa INSERT OR IGNORE).
    """
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
