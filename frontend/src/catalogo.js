// Datos y funciones comunes del catálogo para las pantallas del estudiante.

export const TEMAS = [
  // clave, nombre completo, nombre corto (píldoras)
  ['variables', 'Variables y tipos de datos', 'Variables'],
  ['condicionales', 'Condicionales', 'Condicionales'],
  ['ciclos', 'Ciclos', 'Ciclos'],
  ['funciones', 'Funciones', 'Funciones'],
  ['listas', 'Listas y arreglos', 'Listas y arreglos'],
  ['recursividad', 'Recursividad', 'Recursividad'],
  ['poo', 'Programación orientada a objetos', 'Objetos (POO)'],
]

export const NIVELES = [
  // clave (como viene del backend), etiqueta, número de barritas
  ['básico', 'Básico', 1],
  ['intermedio', 'Intermedio', 2],
  ['avanzado', 'Avanzado', 3],
]

export const NOMBRE_LENGUAJE = { python: 'Python', java: 'Java' }

export const nombreTema = (clave) => (TEMAS.find((t) => t[0] === clave) || [clave, clave])[1]
export const nombreCortoTema = (clave) =>
  (TEMAS.find((t) => t[0] === clave) || [clave, clave, clave])[2]
export const etiquetaNivel = (clave) => (NIVELES.find((n) => n[0] === clave) || [clave, clave])[1]
export const numeroNivel = (clave) => (NIVELES.find((n) => n[0] === clave) || [clave, clave, 1])[2]

export const plural = (n, uno, varios) => (n === 1 ? `1 ${uno}` : `${n} ${varios}`)

/**
 * Ejercicios que corresponden a los filtros del Paso 2 (lenguaje, nivel y
 * tema), en el orden del catálogo. Se usa también para Anterior/Siguiente.
 */
export function filtrarEjercicios(ejercicios, { lenguaje, nivel, tema }) {
  return ejercicios.filter(
    (e) =>
      e.lenguaje === lenguaje && (!nivel || e.nivel === nivel) && (!tema || e.tema === tema),
  )
}
