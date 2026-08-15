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


settings = Settings()
