"""
Base de datos local (SQLite) para llevar el historial de intentos
del estudiante por ejercicio, dentro de una sesión, y controlar el
límite de consultas por tiempo (rate limiting).

SQLite se eligió por ser la opción más simple posible para esta etapa
del proyecto: no requiere instalar ni configurar un servidor de base
de datos aparte, el archivo vive dentro del propio proyecto, y viene
incluido en Python. Si más adelante el sistema crece (múltiples
servidores, muchos usuarios concurrentes), se puede migrar a
PostgreSQL sin rediseñar esta lógica.
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
    conn.commit()
    conn.close()


def contar_intentos(sesion_id: str, ejercicio_id: str) -> int:
    """Cuenta cuántas veces esta sesión ha preguntado sobre este ejercicio."""
    conn = get_connection()
    fila = conn.execute(
        "SELECT COUNT(*) AS total FROM intentos WHERE sesion_id = ? AND ejercicio_id = ?",
        (sesion_id, ejercicio_id),
    ).fetchone()
    conn.close()
    return fila["total"]


def contar_consultas_recientes(sesion_id: str, ventana_minutos: int) -> int:
    """
    Cuenta cuántas consultas ha hecho esta sesión (sobre cualquier ejercicio)
    en los últimos X minutos — usado para el rate limiting.
    """
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
