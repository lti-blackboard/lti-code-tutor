"""
Configuración de logs del sistema.

Registra eventos importantes (errores, rate limiting activado, intentos
sospechosos de inyección de prompt) en un archivo, para poder diagnosticar
problemas después sin tener que adivinar qué pasó.

Los logs se guardan en backend/logs/app.log — esa carpeta no se sube a
GitHub (se agrega al .gitignore).
"""

import logging
from pathlib import Path

LOGS_DIR = Path(__file__).parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

logger = logging.getLogger("lti_code_tutor")
logger.setLevel(logging.INFO)

if not logger.handlers:
    manejador_archivo = logging.FileHandler(LOGS_DIR / "app.log", encoding="utf-8")
    manejador_archivo.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    )
    logger.addHandler(manejador_archivo)

    # También muestra los logs en la terminal, para verlos en tiempo real
    # mientras desarrollan.
    manejador_consola = logging.StreamHandler()
    manejador_consola.setFormatter(
        logging.Formatter("%(levelname)s | %(message)s")
    )
    logger.addHandler(manejador_consola)
