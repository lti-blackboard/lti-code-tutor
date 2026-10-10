"""
Sugerencias para el docente a partir de los datos del panel.

Son reglas simples y transparentes (no usan IA): cada sugerencia indica en
qué dato se basa, para que el docente pueda verificarla. Los umbrales están
al inicio del archivo para ajustarlos fácilmente.
"""

UMBRAL_CONCENTRACION = 30      # % de las consultas en un mismo ejercicio
UMBRAL_PROMEDIO_ALTO = 2.5     # consultas promedio por sesión en un ejercicio
UMBRAL_DIRECTA_ALTA = 30       # % de consultas que pidieron explicación directa
UMBRAL_DIRECTA_BAJA = 10
MINIMO_CONSULTAS = 10          # bajo esto, los datos son muy pocos para concluir


def generar_sugerencias(kpis: dict, ejercicios: list, alertas: list) -> list:
    sugerencias = []
    total = kpis.get("total_consultas", 0)

    if total < MINIMO_CONSULTAS:
        return [
            {
                "tipo": "info",
                "texto": "Todavía hay pocas consultas para sacar conclusiones. "
                "Las sugerencias aparecerán a medida que los estudiantes usen el tutor.",
            }
        ]

    # 1. Ejercicio que concentra las consultas -> tema a reforzar.
    if ejercicios:
        mayor = max(ejercicios, key=lambda e: e["total_consultas"])
        porcentaje = round(mayor["total_consultas"] / total * 100)
        if porcentaje >= UMBRAL_CONCENTRACION:
            sugerencias.append(
                {
                    "tipo": "reforzar",
                    "texto": f"Refuerce el tema {mayor['tema']} ({mayor['lenguaje']}): "
                    f"\"{mayor['titulo']}\" concentra el {porcentaje}% de todas las consultas al tutor.",
                }
            )

    # 2. Ejercicios donde se necesitan muchas consultas -> revisar enunciado o concepto previo.
    dificiles = [e for e in ejercicios if e["promedio_intentos"] >= UMBRAL_PROMEDIO_ALTO]
    for e in sorted(dificiles, key=lambda x: -x["promedio_intentos"])[:2]:
        sugerencias.append(
            {
                "tipo": "revisar",
                "texto": f"En \"{e['titulo']}\" ({e['lenguaje']}) los estudiantes necesitan en promedio "
                f"{e['promedio_intentos']} consultas. Revise si el enunciado es claro o si falta "
                "explicar un concepto previo antes de este ejercicio.",
            }
        )

    # 3. Casos con 3+ intentos que todavía no logran ejecutar sin errores -> contactar.
    sin_resolver = [a for a in alertas if not a.get("ejecuto_sin_errores")]
    if sin_resolver:
        n = len(sin_resolver)
        sugerencias.append(
            {
                "tipo": "contactar",
                "texto": f"{n} {'caso' if n == 1 else 'casos'} con 3 o más intentos "
                f"{'todavía no logra' if n == 1 else 'todavía no logran'} ejecutar el ejercicio sin errores. "
                "Considere contactarlos o derivarlos a ayudantía; use Revisar para ver qué preguntaron.",
            }
        )

    # 4. Uso de la explicación directa.
    directa = kpis.get("porcentaje_pidio_directa", 0)
    if directa >= UMBRAL_DIRECTA_ALTA:
        sugerencias.append(
            {
                "tipo": "revisar",
                "texto": f"El {directa}% de las consultas terminó en explicación directa. "
                "Los ejercicios podrían estar por sobre el nivel del curso.",
            }
        )
    elif directa <= UMBRAL_DIRECTA_BAJA:
        inicio = (
            "Ninguna consulta pidió la explicación directa"
            if directa == 0
            else f"Solo el {directa}% de las consultas pidió la explicación directa"
        )
        sugerencias.append(
            {
                "tipo": "positivo",
                "texto": f"{inicio}: la mayoría de los estudiantes sigue intentando con pistas.",
            }
        )

    return sugerencias
