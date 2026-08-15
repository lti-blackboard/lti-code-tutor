"""
Endpoint simple para confirmar que el servidor está vivo.
Útil para pruebas rápidas y, más adelante, para monitoreo del servidor real.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def inicio():
    return {"mensaje": "Backend del proyecto LTI Code Tutor funcionando"}


@router.get("/health")
def health_check():
    return {"status": "ok"}
