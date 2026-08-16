"""
Script de DATOS DE PRUEBA (seed data) para el panel docente.

Genera actividad simulada de varios "estudiantes" (sesiones distintas)
interactuando con distintos ejercicios, para poder demostrar el panel
de analítica sin necesitar semanas de uso real acumulado.

IMPORTANTE: esto es solo para pruebas y demostración. Estos datos son
CLARAMENTE FICTICIOS — no representan estudiantes ni actividad real.
En cualquier presentación o memoria, se debe declarar explícitamente
que estos son datos de prueba generados por este script.

Uso:
    python generar_datos_demo.py

No consume créditos de la API de Claude ni de Judge0 — inserta
directamente en la base de datos, sin llamar a ningún servicio externo.
"""

import random
import uuid

from app.db import init_db, registrar_intento

# Ejercicios reales del catálogo sobre los que se simula actividad,
# elegidos para mostrar distintos niveles de dificultad en la demo.
EJERCICIOS_DEMO = [
    ("lista-02-java", 1, 5),   # Sumar ArrayList (Java) -> dificil
    ("rec-02-py", 1, 4),       # Fibonacci (Python) -> dificil
    ("func-01-py", 1, 3),      # Promedio con None (Python) -> medio
    ("var-01-py", 1, 2),       # Precio con IVA (Python) -> facil
    ("cond-01-java", 1, 2),    # Año bisiesto (Java) -> facil
]

PREGUNTAS_EJEMPLO = [
    "por que me tira este error?",
    "no entiendo que esta mal",
    "sigo sin lograrlo",
    "puedes ayudarme?",
    "que significa este mensaje?",
]


def generar_datos_demo(cantidad_estudiantes: int = 12):
    init_db()

    print(f"Generando actividad simulada de {cantidad_estudiantes} sesiones de estudiante...")

    total_registros = 0

    for _ in range(cantidad_estudiantes):
        sesion_id = f"demo-{uuid.uuid4().hex[:8]}"

        # Cada "estudiante" simulado interactúa con 1 a 3 ejercicios.
        ejercicios_elegidos = random.sample(EJERCICIOS_DEMO, k=random.randint(1, 3))

        for ejercicio_id, minimo, maximo in ejercicios_elegidos:
            intentos = random.randint(minimo, maximo)
            for i in range(intentos):
                pidio_directa = i == intentos - 1 and intentos >= 3 and random.random() < 0.5
                registrar_intento(
                    sesion_id=sesion_id,
                    ejercicio_id=ejercicio_id,
                    pregunta=random.choice(PREGUNTAS_EJEMPLO),
                    pidio_respuesta_directa=pidio_directa,
                )
                total_registros += 1

    print(f"Listo. Se generaron {total_registros} registros de actividad simulada.")
    print("Recuerda: estos son datos de PRUEBA, no de estudiantes reales.")


if __name__ == "__main__":
    generar_datos_demo()
