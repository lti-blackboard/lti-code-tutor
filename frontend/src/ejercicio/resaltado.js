// Resaltado de sintaxis simple para Python y Java (sin librerías).
// Convierte cada línea en una lista de fragmentos { texto, clase }.

const PALABRAS = {
  python: new Set([
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'is',
    'class', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'pass',
    'break', 'continue', 'lambda', 'None', 'True', 'False', 'self', 'global', 'yield',
  ]),
  java: new Set([
    'public', 'private', 'protected', 'static', 'final', 'class', 'extends', 'implements',
    'return', 'if', 'else', 'for', 'while', 'do', 'new', 'void', 'int', 'double', 'float',
    'long', 'short', 'byte', 'char', 'boolean', 'String', 'true', 'false', 'null', 'this',
    'super', 'import', 'package', 'try', 'catch', 'finally', 'throw', 'throws', 'break',
    'continue', 'switch', 'case', 'default', 'interface', 'abstract',
  ]),
}

const COMENTARIO = { python: /^#.*/, java: /^\/\/.*/ }

const REGLAS = [
  [/^("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)/, 'ct-tk-texto'],
  [/^\d+(?:\.\d+)?/, 'ct-tk-numero'],
  [/^[A-Za-z_]\w*(?=\s*\()/, 'ct-tk-funcion'],
  [/^[A-Za-z_]\w*/, null], // palabra: se decide abajo
  [/^\s+/, null],
]

export function resaltarLinea(linea, lenguaje) {
  const palabras = PALABRAS[lenguaje] || PALABRAS.python
  const fragmentos = []
  let resto = linea
  while (resto.length) {
    const comentario = resto.match(COMENTARIO[lenguaje] || COMENTARIO.python)
    if (comentario) {
      fragmentos.push({ texto: comentario[0], clase: 'ct-tk-comentario' })
      break
    }
    let encontrado = false
    for (const [regla, clase] of REGLAS) {
      const m = resto.match(regla)
      if (m) {
        let c = clase
        if (clase === null && /^[A-Za-z_]/.test(m[0])) {
          c = palabras.has(m[0]) ? 'ct-tk-clave' : null
        }
        // Una palabra clave seguida de "(" (como "if (") sigue siendo clave.
        if (clase === 'ct-tk-funcion' && palabras.has(m[0])) c = 'ct-tk-clave'
        fragmentos.push({ texto: m[0], clase: c })
        resto = resto.slice(m[0].length)
        encontrado = true
        break
      }
    }
    if (!encontrado) {
      fragmentos.push({ texto: resto[0], clase: null })
      resto = resto.slice(1)
    }
  }
  return fragmentos
}
