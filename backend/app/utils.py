"""
Utilidades compartidas del backend.
"""

MAX_LINEAS_ERROR = 20


def truncar_texto(texto: str, max_lineas: int = MAX_LINEAS_ERROR) -> str:
    """
    Corta un texto largo (por ejemplo, un traceback de StackOverflowError
    con miles de líneas repetidas) a un máximo de líneas, agregando un
    aviso de cuántas líneas se omitieron.

    Esto protege dos cosas a la vez:
    - La experiencia visual del estudiante (no ver miles de líneas iguales).
    - El costo real de la API de Claude: mandar un traceback gigante como
      contexto consume muchos más tokens de los necesarios, sin aportar
      información adicional después de las primeras líneas.
    """
    if not texto:
        return texto

    lineas = texto.splitlines()

    if len(lineas) <= max_lineas:
        return texto

    lineas_omitidas = len(lineas) - max_lineas
    lineas_truncadas = lineas[:max_lineas]
    lineas_truncadas.append(f"... (+{lineas_omitidas} líneas repetidas, omitidas)")

    return "\n".join(lineas_truncadas)


def normalizar_salida(texto) -> str:
    """Quita espacios al final de cada línea y líneas vacías al final,
    y unifica los saltos de línea (Windows/Linux)."""
    if not texto:
        return ""
    lineas = str(texto).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    return "\n".join(linea.rstrip() for linea in lineas).rstrip("\n")


def salida_coincide(salida, esperada) -> bool:
    """True si la salida del programa es igual a la salida esperada
    (después de normalizar). Una salida esperada vacía nunca coincide."""
    esperada_normal = normalizar_salida(esperada)
    if not esperada_normal:
        return False
    return normalizar_salida(salida) == esperada_normal

