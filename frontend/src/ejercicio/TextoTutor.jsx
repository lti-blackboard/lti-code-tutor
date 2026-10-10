// Muestra el texto del tutor con un formato mínimo y seguro (sin HTML):
// párrafos, listas con "-" o "1.", **negrita** y `código`.

function enLinea(texto) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return partes.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <b key={i}>{p.slice(2, -2)}</b>
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) return <code key={i}>{p.slice(1, -1)}</code>
    return p
  })
}

export default function TextoTutor({ texto }) {
  const bloques = []
  let lista = null
  for (const linea of (texto || '').split('\n')) {
    const item = linea.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/)
    if (item) {
      if (!lista) {
        lista = []
        bloques.push({ tipo: 'lista', items: lista })
      }
      lista.push(item[1])
      continue
    }
    lista = null
    if (linea.trim()) bloques.push({ tipo: 'parrafo', texto: linea.replace(/^#+\s*/, '') })
  }
  return (
    <>
      {bloques.map((b, i) =>
        b.tipo === 'lista' ? (
          <ul key={i}>{b.items.map((it, j) => <li key={j}>{enLinea(it)}</li>)}</ul>
        ) : (
          <p key={i}>{enLinea(b.texto)}</p>
        ),
      )}
    </>
  )
}
