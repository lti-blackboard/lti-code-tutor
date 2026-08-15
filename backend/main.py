"""
Punto de entrada del backend — lti-code-tutor

Levanta el servidor con:
    uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, lti, ai, ejercicios
from app.db import init_db, cargar_catalogo_inicial
from app.catalogo_ejercicios import CATALOGO_EJERCICIOS

app = FastAPI(
    title="LTI Code Tutor API",
    description="Backend del sistema LTI-Blackboard con tutor de IA para Python y Java.",
    version="0.1.0",
)

# Crea las tablas si no existen, y carga el catálogo de ejercicios inicial
# (no duplica datos si el servidor se reinicia varias veces).
init_db()
cargar_catalogo_inicial(CATALOGO_EJERCICIOS)

# Habilita que el frontend (en otro puerto/dominio) pueda llamar a esta API.
# En producción, reemplazar "*" por el dominio real del frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cada área del sistema vive en su propio router — así el proyecto
# crece de forma ordenada en vez de amontonar todo en un solo archivo.
app.include_router(health.router)
app.include_router(lti.router, prefix="/lti", tags=["LTI"])
app.include_router(ai.router, prefix="/ai", tags=["IA / Tutor"])
app.include_router(ejercicios.router, prefix="/ejercicios", tags=["Ejercicios"])
