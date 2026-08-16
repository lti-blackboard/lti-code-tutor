"""
Punto de entrada del backend — lti-code-tutor

Levanta el servidor con:
    uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, lti, ai, ejercicios, sandbox
from app.db import init_db, cargar_catalogo_inicial
from app.catalogo_ejercicios import CATALOGO_EJERCICIOS

app = FastAPI(
    title="LTI Code Tutor API",
    description="Backend del sistema LTI-Blackboard con tutor de IA para Python y Java.",
    version="0.1.0",
)

init_db()
cargar_catalogo_inicial(CATALOGO_EJERCICIOS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(lti.router, prefix="/lti", tags=["LTI"])
app.include_router(ai.router, prefix="/ai", tags=["IA / Tutor"])
app.include_router(ejercicios.router, prefix="/ejercicios", tags=["Ejercicios"])
app.include_router(sandbox.router, prefix="/sandbox", tags=["Sandbox de ejecución"])
