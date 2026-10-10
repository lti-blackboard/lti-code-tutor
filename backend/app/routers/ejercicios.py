"""
Endpoints para consultar el catálogo de ejercicios.

GET /ejercicios                  -> lista todos los ejercicios (con filtros opcionales)
GET /ejercicios/estado?sesion_id -> estado de cada ejercicio para una sesión
GET /ejercicios/{ejercicio_id}   -> detalle de un ejercicio puntual

La salida esperada no se entrega al estudiante (solo se indica si el
ejercicio es "validable"): se usa en el backend para marcarlo como resuelto.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.db import estado_ejercicios_sesion, listar_ejercicios, obtener_ejercicio

router = APIRouter()


def _para_estudiante(ejercicio: dict) -> dict:
    datos = dict(ejercicio)
    salida = datos.pop("salida_esperada", "") or ""
    datos["validable"] = bool(salida.strip())
    return datos


@router.get("")
def obtener_lista_ejercicios(
    lenguaje: Optional[str] = Query(None, description="Filtrar por 'python' o 'java'"),
    tema: Optional[str] = Query(None, description="Filtrar por tema, ej: 'ciclos'"),
):
    ejercicios = [_para_estudiante(e) for e in listar_ejercicios(lenguaje=lenguaje, tema=tema)]
    return {"total": len(ejercicios), "ejercicios": ejercicios}


@router.get("/estado")
def obtener_estado_ejercicios(
    sesion_id: str = Query(..., description="Identificador de la sesión del estudiante"),
):
    """Ejercicios en progreso o resueltos; los que no aparecen están sin empezar."""
    return {"sesion_id": sesion_id, "estados": estado_ejercicios_sesion(sesion_id)}


@router.get("/{ejercicio_id}")
def obtener_detalle_ejercicio(ejercicio_id: str):
    ejercicio = obtener_ejercicio(ejercicio_id)
    if not ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado.")
    return _para_estudiante(ejercicio)
