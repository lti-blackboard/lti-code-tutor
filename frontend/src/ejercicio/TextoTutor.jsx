// Muestra el texto del tutor con un formato mínimo y seguro (sin HTML):
// párrafos, listas con "-" o "1.", bloques de código con ```, **negrita**
// (que puede contener `código`) y `código`. Los separadores "---" se omiten.

function enLinea(texto, clave = '') {
  const partes = texto.split(/(\*\*.+?\*\*|`[^`]+`)/g)
  return partes.map((p, i) => {
    const k = `${clave}${i}`
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
      return <b key={k}>{enLinea(p.slice(2, -2), `${k}-`)}</b>
    }
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) return <code key={k}>{p.slice(1, -1)}</code>
    return p
  })
}

export function analizarBloques(texto) {
  const bloques = []
  let lista = null
  let codigo = null
  for (const linea of (texto || '').replace(/\r\n/g, '\n').split('\n')) {
    if (/^\s*```/.test(linea)) {
      if (codigo) {
        bloques.push({ tipo: 'codigo', texto: codigo.join('\n') })
        codigo = null
      } else {
        codigo = []
        lista = null
      }
      continue
    }
    if (codigo) {
      codigo.push(linea)
      continue
    }
    const item = linea.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/)
    if (item && !/^\s*[-*_]{3,}\s*$/.test(linea)) {
      if (!lista) {
        lista = []
        bloques.push({ tipo: 'lista', items: lista })
      }
      lista.push(item[1])
      continue
    }
    lista = null
    if (/^\s*[-*_]{3,}\s*$/.test(linea)) continue // separador
    if (linea.trim()) bloques.push({ tipo: 'parrafo', texto: linea.replace(/^#+\s*/, '') })
  }
  // Bloque de código sin cerrar: se muestra igual.
  if (codigo && codigo.length) bloques.push({ tipo: 'codigo', texto: codigo.join('\n') })
  return bloques
}

export default function TextoTutor({ texto }) {
  return (
    <>
      {analizarBloques(texto).map((b, i) => {
        if (b.tipo === 'codigo') return <pre key={i} className="ct-msj-codigo"><code>{b.texto}</code></pre>
        if (b.tipo === 'lista') return <ul key={i}>{b.items.map((it, j) => <li key={j}>{enLinea(it, `${i}-${j}-`)}</li>)}</ul>
        return <p key={i}>{enLinea(b.texto, `${i}-`)}</p>
      })}
    </>
  )
}
