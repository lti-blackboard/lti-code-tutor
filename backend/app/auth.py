"""
Inicio de sesión del docente para el panel.

Las credenciales NO están en el código (el repositorio es público): se leen
de las variables de entorno DOCENTE_USUARIO y DOCENTE_CLAVE, configuradas en
el servidor. Si no están configuradas, el panel queda cerrado.

Al iniciar sesión se entrega un token firmado (HMAC-SHA256) que vence en
8 horas. Es una solución simple para el prototipo; con la integración LTI,
el acceso del docente vendrá del rol que entrega Blackboard.

Para la evaluación del proyecto el panel queda ABIERTO por defecto (sin
usuario ni contraseña), para que el profesor pueda revisarlo libremente.
Para volver a exigir el inicio de sesión basta con definir en el servidor
la variable de entorno PANEL_DOCENTE_ABIERTO=false.
"""

import base64
import hashlib
import hmac
import os
import secrets
import time

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

from app.logger import logger

DURACION_TOKEN_SEGUNDOS = 8 * 60 * 60
MAX_INTENTOS_FALLIDOS = 5
VENTANA_BLOQUEO_SEGUNDOS = 10 * 60

# Si no se define DOCENTE_SECRETO, se genera uno al iniciar el servidor:
# los tokens dejan de valer cuando el servidor se reinicia (basta volver a entrar).
_SECRETO = (os.getenv("DOCENTE_SECRETO") or secrets.token_hex(32)).encode()

_fallidos: dict = {}  # ip -> lista de momentos de intentos fallidos

router = APIRouter()


def _credenciales():
    return os.getenv("DOCENTE_USUARIO", "").strip(), os.getenv("DOCENTE_CLAVE", "").strip()


def _firmar(texto: str) -> str:
    return hmac.new(_SECRETO, texto.encode(), hashlib.sha256).hexdigest()


def crear_token(usuario: str) -> str:
    vence = int(time.time()) + DURACION_TOKEN_SEGUNDOS
    carga = base64.urlsafe_b64encode(f"{usuario}|{vence}".encode()).decode()
    return f"{carga}.{_firmar(carga)}"


def token_valido(token: str) -> bool:
    try:
        carga, firma = token.split(".", 1)
        if not hmac.compare_digest(firma, _firmar(carga)):
            return False
        _, vence = base64.urlsafe_b64decode(carga.encode()).decode().rsplit("|", 1)
        return int(vence) > time.time()
    except Exception:
        return False


def panel_abierto() -> bool:
    """True si el panel docente no exige inicio de sesión (valor por defecto)."""
    return os.getenv("PANEL_DOCENTE_ABIERTO", "true").strip().lower() not in ("false", "0", "no")


def requiere_docente(authorization: str = Header(default="")):
    """Dependencia de FastAPI: exige un token válido en 'Authorization: Bearer ...',
    salvo que el panel esté abierto."""
    if panel_abierto():
        return
    token = authorization.removeprefix("Bearer ").strip()
    if not token or not token_valido(token):
        raise HTTPException(status_code=401, detail="Sesión de docente no válida o vencida.")


@router.get("/estado")
def estado():
    """Indica al frontend si el panel docente pide inicio de sesión."""
    return {"abierto": panel_abierto()}


class Credenciales(BaseModel):
    usuario: str
    clave: str


@router.post("/login")
def login(datos: Credenciales, request: Request):
    usuario_ok, clave_ok = _credenciales()
    if not usuario_ok or not clave_ok:
        raise HTTPException(
            status_code=503,
            detail="El acceso docente no está configurado en el servidor.",
        )

    ip = request.client.host if request.client else "desconocida"
    ahora = time.time()
    recientes = [t for t in _fallidos.get(ip, []) if ahora - t < VENTANA_BLOQUEO_SEGUNDOS]
    if len(recientes) >= MAX_INTENTOS_FALLIDOS:
        raise HTTPException(
            status_code=429,
            detail="Demasiados intentos fallidos. Espera unos minutos antes de volver a intentar.",
        )

    correcto = hmac.compare_digest(datos.usuario.strip(), usuario_ok) and hmac.compare_digest(
        datos.clave, clave_ok
    )
    if not correcto:
        recientes.append(ahora)
        _fallidos[ip] = recientes
        logger.warning(f"Inicio de sesión docente fallido | ip={ip}")
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")

    _fallidos.pop(ip, None)
    return {"token": crear_token(usuario_ok), "vence_en_segundos": DURACION_TOKEN_SEGUNDOS}
