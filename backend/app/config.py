"""
Configuración centralizada del backend.

Lee las variables sensibles (API keys, credenciales) desde un archivo .env
que NUNCA debe subirse a GitHub (ya está en .gitignore).

Cada integrante del equipo debe crear su propio archivo .env local,
copiando .env.example y completando sus propios valores.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    lti_client_id: str = os.getenv("LTI_CLIENT_ID", "")
    lti_issuer: str = os.getenv("LTI_ISSUER", "")

    # Modelo de IA a usar — configurable sin tocar código.
    modelo_ia: str = os.getenv("MODELO_IA", "claude-sonnet-4-6")

    # Límites de validación de entradas.
    max_caracteres_codigo: int = int(os.getenv("MAX_CARACTERES_CODIGO", "5000"))
    max_caracteres_pregunta: int = int(os.getenv("MAX_CARACTERES_PREGUNTA", "500"))
    lenguajes_permitidos: list = ["python", "java"]

    # Rate limiting: máximo de consultas por sesión en la ventana de tiempo.
    rate_limit_max_consultas: int = int(os.getenv("RATE_LIMIT_MAX_CONSULTAS", "15"))
    rate_limit_ventana_minutos: int = int(os.getenv("RATE_LIMIT_VENTANA_MINUTOS", "10"))


settings = Settings()
