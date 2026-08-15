"""
Endpoints del flujo LTI 1.3 (OIDC Login + Launch).

Esto es un ESQUELETO (stub): las rutas existen y responden, pero todavía
no implementan la validación real de JWT/OIDC contra Blackboard.
Esa lógica se agrega cuando tengan acceso al sandbox de Blackboard,
probablemente usando la librería `pylti1p3`.

Referencia futura:
  pip install pylti1p3
  https://github.com/dmitry-viskov/pylti1.3
"""

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/login")
def lti_login(request: Request):
    """
    Blackboard llama primero a este endpoint (OIDC Login Initiation)
    antes de mandar al estudiante al 'launch'.
    """
    return {
        "status": "pendiente_implementacion",
        "detalle": "Aquí se validará la solicitud de login OIDC de Blackboard.",
    }


@router.post("/launch")
def lti_launch(request: Request):
    """
    Blackboard llama a este endpoint cuando un estudiante hace clic
    en la herramienta dentro del curso. Aquí se valida el JWT firmado
    y se identifica al usuario, su rol y el curso.
    """
    return {
        "status": "pendiente_implementacion",
        "detalle": "Aquí se validará el JWT del LTI Launch y se creará la sesión del usuario.",
    }


@router.get("/jwks")
def jwks():
    """
    Expone las llaves públicas de este sistema, para que Blackboard
    pueda verificar la autenticidad de las respuestas que enviamos
    (necesario para Deep Linking y Assignment/Grade Services).
    """
    return {"keys": []}
