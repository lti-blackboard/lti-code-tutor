"""
Endpoint del tutor de IA.

Usa la API de Claude (Anthropic) para responder como un tutor pedagógico:
da pistas guiadas, no soluciones directas.

Requiere la variable de entorno ANTHROPIC_API_KEY (ver .env.example).
"""

from fastapi import APIRouter
from pydantic import BaseModel
import anthropic

from app.config import settings

router = APIRouter()

# Prompt de sistema: aquí vive el "enfoque pedagógico" que define
# la personalidad del tutor. Se puede ir refinando con el tiempo.
SYSTEM_PROMPT = """
Eres un tutor de programación para estudiantes de Ingeniería en Informática
que están aprendiendo Python y Java.

Reglas:
- Nunca entregues la solución completa directamente.
- Guía con preguntas o pistas que ayuden al estudiante a encontrar el error por sí mismo.
- Identifica si el error es de sintaxis, de lógica, o de un concepto mal entendido,
  y adapta tu respuesta según ese tipo de error.
- Sé breve, claro y alentador.
"""


class ConsultaTutor(BaseModel):
    codigo: str
    pregunta: str
    lenguaje: str = "python"


@router.post("/tutor")
def consultar_tutor(consulta: ConsultaTutor):
    """
    Recibe el código del estudiante y su pregunta, y devuelve
    una respuesta pedagógica generada por el modelo de IA.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    mensaje = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Lenguaje: {consulta.lenguaje}\n\n"
                    f"Código del estudiante:\n{consulta.codigo}\n\n"
                    f"Pregunta del estudiante: {consulta.pregunta}"
                ),
            }
        ],
    )

    respuesta_texto = "".join(
        bloque.text for bloque in mensaje.content if bloque.type == "text"
    )

    return {"respuesta": respuesta_texto}
