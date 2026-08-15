"""
Endpoints para consultar el catálogo de ejercicios.

GET /ejercicios              -> lista todos los ejercicios (con filtros opcionales)
GET /ejercicios/{ejercicio_id} -> detalle de un ejercicio puntual
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.db import listar_ejercicios, obtener_ejercicio

router = APIRouter()


@router.get("")
def obtener_lista_ejercicios(
    lenguaje: Optional[str] = Query(None, description="Filtrar por 'python' o 'java'"),
    tema: Optional[str] = Query(None, description="Filtrar por tema, ej: 'ciclos'"),
):
    ejercicios = listar_ejercicios(lenguaje=lenguaje, tema=tema)
    return {"total": len(ejercicios), "ejercicios": ejercicios}


@router.get("/{ejercicio_id}")
def obtener_detalle_ejercicio(ejercicio_id: str):
    ejercicio = obtener_ejercicio(ejercicio_id)
    if not ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado.")
    return ejercicio
