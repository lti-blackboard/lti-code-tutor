"""
Endpoint para ejecutar código real (Python o Java) usando Judge0.

Usa la instancia pública de Judge0 (ce.judge0.com), que no requiere
API key para uso ligero de desarrollo y pruebas. Tiene límites de uso
(rate limits) para evitar abuso — si en el futuro el proyecto pasa a
un piloto real con muchos estudiantes, se recomienda migrar a la
versión de RapidAPI (con key propia) o auto-hospedar Judge0.

Las salidas (stdout, stderr, error de compilación) se truncan si son
muy largas — esto pasa típicamente con errores de recursión infinita
en Java (StackOverflowError), que generan tracebacks de miles de
líneas repetidas. Truncar protege tanto la experiencia visual como el
costo de tokens al mandarle ese texto al tutor de IA después.

Referencia: https://ce.judge0.com/
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
import httpx

from app.config import settings
from app.db import obtener_ejercicio, registrar_ejecucion
from app.logger import logger
from app.utils import salida_coincide, truncar_texto

router = APIRouter()

JUDGE0_URL = "https://ce.judge0.com/submissions"

# IDs de lenguaje según la documentación oficial de Judge0 CE.
LANGUAGE_IDS = {
    "python": 71,  # Python 3.8.1
    "java": 62,    # OpenJDK 13.0.1
}

# Judge0 puede tardar unos segundos en compilar/ejecutar, sobre todo Java.
TIMEOUT_SEGUNDOS = 15


class ConsultaEjecucion(BaseModel):
    codigo: str
    lenguaje: str
    entrada: str = ""  # lo que el programa recibiría por stdin (input()), opcional
    # Opcionales: si vienen, la ejecución se registra para el panel docente.
    sesion_id: Optional[str] = None
    ejercicio_id: Optional[str] = None

    @field_validator("codigo")
    @classmethod
    def validar_codigo(cls, valor: str) -> str:
        if not valor or not valor.strip():
            raise ValueError("El código no puede estar vacío.")
        if len(valor) > settings.max_caracteres_codigo:
            raise ValueError(
                f"El código supera el máximo permitido de {settings.max_caracteres_codigo} caracteres."
            )
        return valor

    @field_validator("lenguaje")
    @classmethod
    def validar_lenguaje(cls, valor: str) -> str:
        valor_normalizado = valor.strip().lower()
        if valor_normalizado not in LANGUAGE_IDS:
            raise ValueError(
                f"Lenguaje no soportado. Los lenguajes permitidos son: "
                f"{', '.join(LANGUAGE_IDS.keys())}."
            )
        return valor_normalizado


@router.post("/ejecutar")
def ejecutar_codigo(consulta: ConsultaEjecucion):
    language_id = LANGUAGE_IDS[consulta.lenguaje]

    payload = {
        "language_id": language_id,
        "source_code": consulta.codigo,
        "stdin": consulta.entrada,
    }

    try:
        respuesta = httpx.post(
            f"{JUDGE0_URL}?base64_encoded=false&wait=true",
            json=payload,
            timeout=TIMEOUT_SEGUNDOS,
        )
        respuesta.raise_for_status()
        resultado = respuesta.json()

    except httpx.TimeoutException:
        logger.error("Judge0 no respondió a tiempo (timeout).")
        raise HTTPException(
            status_code=503,
            detail="El motor de ejecución tardó demasiado en responder. Intenta de nuevo.",
        )

    except httpx.HTTPStatusError as error:
        logger.error(f"Judge0 devolvió un error HTTP: {error.response.status_code}")
        raise HTTPException(
            status_code=503,
            detail="El motor de ejecución no está disponible en este momento (puede estar sobrecargado). Intenta de nuevo en unos minutos.",
        )

    except Exception as error:
        logger.error(f"Error inesperado al conectar con Judge0: {repr(error)}")
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error inesperado al ejecutar el código.",
        )

    estado = resultado.get("status", {}).get("description")
    exitosa = (
        estado == "Accepted"
        and not resultado.get("stderr")
        and not resultado.get("compile_output")
    )

    # Validación sin IA: si el ejercicio tiene salida esperada, se compara
    # con la salida real del programa (antes de recortarla).
    salida_esperada = ""
    if consulta.ejercicio_id:
        try:
            ejercicio = obtener_ejercicio(consulta.ejercicio_id)
            salida_esperada = (ejercicio or {}).get("salida_esperada") or ""
        except Exception as error:
            logger.error(f"No se pudo leer la salida esperada: {repr(error)}")
    resuelto = exitosa and salida_coincide(resultado.get("stdout"), salida_esperada)

    if consulta.sesion_id and consulta.ejercicio_id:
        try:
            registrar_ejecucion(
                consulta.sesion_id, consulta.ejercicio_id, exitosa, resuelto
            )
        except Exception as error:
            # Registrar es secundario: nunca debe impedir mostrar el resultado.
            logger.error(f"No se pudo registrar la ejecución: {repr(error)}")

    return {
        "salida": truncar_texto(resultado.get("stdout")),
        "error": truncar_texto(resultado.get("stderr")),
        "error_compilacion": truncar_texto(resultado.get("compile_output")),
        "estado": resultado.get("status", {}).get("description"),
        "tiempo_segundos": resultado.get("time"),
        "memoria_kb": resultado.get("memory"),
        # validable: el ejercicio tiene salida esperada con la cual comparar.
        "validable": bool(salida_esperada.strip()),
        "resuelto": resuelto,
        # La salida esperada solo se muestra cuando ya se resolvió.
        "salida_esperada": salida_esperada if resuelto else None,
    }
