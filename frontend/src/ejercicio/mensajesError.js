// Mensajes en simple para la consola, generados POR REGLAS (sin IA).
// A partir del texto del error de Python o Java se obtiene la línea del
// error y una explicación corta para el estudiante.

const REGLAS_PYTHON = [
  [/IndentationError/, 'Error de indentación', 'Revisa los espacios al inicio de la línea: los bloques dentro de if, for, def o class deben ir más a la derecha, todos con la misma sangría.'],
  [/unexpected EOF|was never closed|EOF while scanning/, 'Falta cerrar algo', 'Parece que falta cerrar un paréntesis, corchete o comillas.'],
  [/SyntaxError/, 'Error de sintaxis', 'Python no entiende cómo está escrita esa línea. Revisa signos como :, =, == y los paréntesis.'],
  [/NameError: name '([^']+)'/, (m) => `No existe "${m[1]}"`, (m) => `Python no conoce el nombre "${m[1]}". Revisa si está bien escrito o si falta definirlo antes de usarlo.`],
  [/TypeError: .*missing \d+ required positional argument/, 'Faltan datos en la llamada', 'Llamaste a una función con menos valores de los que necesita. Revisa sus parámetros.'],
  [/TypeError: unsupported operand|can only concatenate|can't multiply sequence/, 'Tipos que no se pueden combinar', 'Estás operando valores de distinto tipo, por ejemplo un texto con un número. Revisa el tipo de cada valor.'],
  [/TypeError/, 'Error de tipo', 'Una operación recibió un valor de un tipo que no corresponde (por ejemplo, un texto donde se esperaba un número).'],
  [/ZeroDivisionError/, 'División por cero', 'En algún momento se divide por cero. Revisa qué valor tiene el divisor.'],
  [/IndexError/, 'Posición fuera de la lista', 'Se intentó leer una posición que no existe. Recuerda que las posiciones parten en 0.'],
  [/KeyError/, 'Clave inexistente', 'Se buscó en un diccionario una clave que no está.'],
  [/AttributeError: '(\w+)' object has no attribute '(\w+)'/, (m) => `"${m[2]}" no existe`, (m) => `El objeto de tipo ${m[1]} no tiene "${m[2]}". Revisa si está bien escrito o si falta crearlo (por ejemplo, en __init__).`],
  [/AttributeError/, 'Atributo inexistente', 'Se usó un atributo o método que el objeto no tiene.'],
  [/ValueError/, 'Valor no válido', 'Una función recibió un valor con el tipo correcto, pero que no puede usar.'],
  [/RecursionError/, 'Recursión sin fin', 'La función se llama a sí misma sin parar. Revisa el caso base y que cada llamada se acerque a él.'],
]

const REGLAS_JAVA = [
  [/';' expected/, 'Falta un punto y coma', 'En Java cada instrucción termina con ;. Revisa el final de esa línea o de la anterior.'],
  [/cannot find symbol/, 'Nombre desconocido', 'Java no encuentra una variable, método o clase con ese nombre. Revisa si está bien escrito o si falta declararlo.'],
  [/incompatible types/, 'Tipos incompatibles', 'Estás guardando o usando un valor de un tipo distinto al esperado.'],
  [/missing return statement/, 'Falta un return', 'El método debe devolver un valor en todos los caminos posibles, también cuando el if no se cumple.'],
  [/bad operand types/, 'Operación no válida para esos tipos', 'El operador no se puede usar con esos tipos de datos.'],
  [/unexpected type/, 'Tipo inesperado', 'En esa posición Java esperaba una variable y encontró un valor. Revisa si en esa línea quieres guardar un valor o comparar dos valores.'],
  [/cannot be applied to given types|no suitable method found/, 'Parámetros que no coinciden', 'Llamaste a un método con una cantidad o tipo de valores distinto al que recibe.'],
  [/char cannot be converted|cannot be converted to/, 'Conversión no permitida', 'Java no puede convertir automáticamente ese valor al tipo que se pide.'],
  [/class \w+ is public, should be declared in a file named/, 'Nombre de la clase', 'La clase pública debe llamarse igual que el archivo (Main).'],
  [/reached end of file while parsing/, 'Falta cerrar una llave', 'Parece que falta una } para cerrar un bloque.'],
  [/StackOverflowError/, 'Recursión sin fin', 'El método se llama a sí mismo sin parar. Revisa el caso base y que cada llamada se acerque a él.'],
  [/ArithmeticException: \/ by zero/, 'División por cero', 'En algún momento se divide por cero. Revisa qué valor tiene el divisor.'],
  [/IndexOutOfBoundsException/, 'Posición fuera de rango', 'Se intentó leer una posición que no existe. Las posiciones van de 0 a largo − 1: revisa la condición del for.'],
  [/NullPointerException/, 'Valor nulo', 'Se usó un objeto que todavía no tiene valor (null).'],
  [/NumberFormatException/, 'Número mal escrito', 'Se intentó convertir a número un texto que no lo es.'],
  [/error:/, 'Error de compilación', 'Java no pudo compilar el programa. Revisa la línea indicada.'],
]

function lineaDelError(texto, lenguaje) {
  if (lenguaje === 'java') {
    // Ejecución: "at Main.metodo(Main.java:7)" (primer marco propio).
    const marco = texto.match(/\(\w+\.java:(\d+)\)/)
    if (marco) return Number(marco[1])
    // Compilación: "Main.java:5: error: ..."
    const comp = texto.match(/\.java:(\d+): error/)
    return comp ? Number(comp[1]) : null
  }
  // Python: la última referencia "line N" del traceback es donde ocurrió.
  const lineas = [...texto.matchAll(/line (\d+)/g)]
  return lineas.length ? Number(lineas[lineas.length - 1][1]) : null
}

/**
 * Devuelve { tipo, titulo, texto, linea } a partir del resultado de ejecutar.
 * tipo: "error" | "tiempo" | "ok" | "distinta" | "resuelto" | "sin_salida"
 */
export function explicarResultado(resultado, lenguaje) {
  const textoError = resultado.error_compilacion || resultado.error || ''
  const estado = resultado.estado || ''

  if (/Time Limit Exceeded/i.test(estado)) {
    return {
      tipo: 'tiempo',
      titulo: 'El programa tardó demasiado.',
      texto: 'Probablemente hay un ciclo que nunca termina. Revisa que la condición del ciclo llegue a ser falsa.',
      linea: null,
    }
  }

  if (textoError) {
    const linea = lineaDelError(textoError, lenguaje)
    const reglas = lenguaje === 'java' ? REGLAS_JAVA : REGLAS_PYTHON
    for (const [patron, titulo, texto] of reglas) {
      const m = textoError.match(patron)
      if (m) {
        const t = typeof titulo === 'function' ? titulo(m) : titulo
        return {
          tipo: 'error',
          titulo: linea ? `${t} en la línea ${linea}.` : `${t}.`,
          texto: typeof texto === 'function' ? texto(m) : texto,
          linea,
        }
      }
    }
    return {
      tipo: 'error',
      titulo: linea ? `Error en la línea ${linea}.` : 'El programa terminó con un error.',
      texto: 'Lee el mensaje de abajo; si no lo entiendes, pregúntale al tutor.',
      linea,
    }
  }

  if (resultado.resuelto) {
    return { tipo: 'resuelto', titulo: '¡Resuelto!', texto: 'Tu programa entrega el resultado esperado.', linea: null }
  }
  if (resultado.validable) {
    return {
      tipo: 'distinta',
      titulo: 'Se ejecutó sin errores, pero el resultado todavía no es el esperado.',
      texto: 'Compara lo que imprime tu programa con lo que pide el enunciado.',
      linea: null,
    }
  }
  if (!resultado.salida) {
    return { tipo: 'sin_salida', titulo: 'Se ejecutó sin errores.', texto: 'El programa no imprimió nada.', linea: null }
  }
  return { tipo: 'ok', titulo: 'Se ejecutó sin errores.', texto: 'Revisa que la salida sea la que pide el enunciado.', linea: null }
}
