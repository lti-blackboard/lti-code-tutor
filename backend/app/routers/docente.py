"""
Endpoints para el panel del profesor (analítica del curso).

GET /docente/resumen                          -> KPIs + estadísticas por ejercicio
GET /docente/alertas                          -> sesiones con 3+ intentos
GET /docente/detalle/{sesion_id}/{ejercicio_id} -> historial completo de una sesión puntual

Nota: esta primera versión no tiene autenticación de profesor todavía
(cualquiera con la URL puede verlo) — se deja como trabajo futuro,
junto con el inicio de sesión real vía LTI.
"""

from fastapi import APIRouter, HTTPException

from app.db import (
    obtener_kpis,
    obtener_resumen_por_ejercicio,
    obtener_alertas,
    obtener_detalle_sesion_ejercicio,
)

router = APIRouter()


@router.get("/resumen")
def resumen():
    return {
        "kpis": obtener_kpis(),
        "ejercicios": obtener_resumen_por_ejercicio(),
    }


@router.get("/alertas")
def alertas():
    return {"alertas": obtener_alertas()}


@router.get("/detalle/{sesion_id}/{ejercicio_id}")
def detalle(sesion_id: str, ejercicio_id: str):
    resultado = obtener_detalle_sesion_ejercicio(sesion_id, ejercicio_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="No se encontró actividad para esa combinación.")
    return resultado
