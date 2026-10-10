import { useMemo, useRef, useState } from 'react'
import { resaltarLinea } from './resaltado.js'

const INDENTACION = '    '

/*
 * Editor de código: un <textarea> transparente sobre una capa con el código
 * resaltado. Así se mantiene el comportamiento normal de escritura (y el
 * bloqueo de pegado) sin depender de librerías externas.
 *
 * - Tab inserta 4 espacios y Shift+Tab los quita. Para salir del editor con
 *   el teclado: Esc y luego Tab.
 * - lineaError marca esa línea en naranja.
 */
export default function Editor({ codigo, onCambio, lenguaje, lineaError, onPegadoBloqueado }) {
  const areaRef = useRef(null)
  const capaRef = useRef(null)
  const numerosRef = useRef(null)
  const salirConTab = useRef(false)
  const [cursor, setCursor] = useState({ linea: 1, columna: 1 })

  const lineas = useMemo(() => codigo.split('\n'), [codigo])
  const resaltadas = useMemo(
    () => lineas.map((l) => resaltarLinea(l, lenguaje)),
    [lineas, lenguaje],
  )

  function sincronizarScroll(e) {
    const { scrollTop, scrollLeft } = e.target
    if (capaRef.current) {
      capaRef.current.scrollTop = scrollTop
      capaRef.current.scrollLeft = scrollLeft
    }
    if (numerosRef.current) numerosRef.current.scrollTop = scrollTop
  }

  function actualizarCursor() {
    const area = areaRef.current
    if (!area) return
    const antes = area.value.slice(0, area.selectionStart)
    const partes = antes.split('\n')
    setCursor({ linea: partes.length, columna: partes[partes.length - 1].length + 1 })
  }

  // Reemplaza el texto y deja el cursor en la posición indicada.
  function aplicar(nuevo, inicio, fin = inicio) {
    onCambio(nuevo)
    requestAnimationFrame(() => {
      const area = areaRef.current
      if (area) {
        area.selectionStart = inicio
        area.selectionEnd = fin
        actualizarCursor()
      }
    })
  }

  function manejarTecla(e) {
    if (e.key === 'Escape') {
      salirConTab.current = true
      return
    }
    if (e.key !== 'Tab') {
      salirConTab.current = false
      return
    }
    if (salirConTab.current) {
      salirConTab.current = false
      return // deja que Tab mueva el foco fuera del editor
    }
    e.preventDefault()
    const area = e.target
    const { selectionStart: ini, selectionEnd: fin, value } = area
    const inicioLinea = value.lastIndexOf('\n', ini - 1) + 1

    if (e.shiftKey) {
      // Quita hasta 4 espacios al inicio de la línea actual.
      const quitar = value.slice(inicioLinea).match(/^ {1,4}/)
      if (!quitar) return
      const n = quitar[0].length
      area.selectionStart = inicioLinea
      area.selectionEnd = inicioLinea + n
      // execCommand conserva el historial de deshacer (Ctrl+Z) del navegador.
      if (!document.execCommand('delete')) {
        aplicar(value.slice(0, inicioLinea) + value.slice(inicioLinea + n),
          Math.max(inicioLinea, ini - n), Math.max(inicioLinea, fin - n))
      }
      return
    }
    if (!document.execCommand('insertText', false, INDENTACION)) {
      aplicar(value.slice(0, ini) + INDENTACION + value.slice(fin), ini + INDENTACION.length)
    }
  }

  return (
    <div className="ct-editor">
      <div className="ct-editor-cuerpo">
        <div className="ct-editor-numeros" ref={numerosRef} aria-hidden="true">
          {lineas.map((_, i) => (
            <div key={i} className={i + 1 === lineaError ? 'ct-num-error' : undefined}>{i + 1}</div>
          ))}
        </div>
        <div className="ct-editor-zona">
          <pre className="ct-editor-capa" ref={capaRef} aria-hidden="true">
            {resaltadas.map((frags, i) => (
              <div key={i} className={i + 1 === lineaError ? 'ct-linea ct-linea-error' : 'ct-linea'}>
                {frags.length === 0
                  ? ' '
                  : frags.map((f, j) => (f.clase ? <span key={j} className={f.clase}>{f.texto}</span> : f.texto))}
              </div>
            ))}
          </pre>
          <textarea
            ref={areaRef}
            className="ct-editor-area"
            value={codigo}
            onChange={(e) => {
              onCambio(e.target.value)
              actualizarCursor()
            }}
            onKeyDown={manejarTecla}
            onKeyUp={actualizarCursor}
            onClick={actualizarCursor}
            onScroll={sincronizarScroll}
            onPaste={onPegadoBloqueado}
            onDrop={onPegadoBloqueado}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-label="Editor de código"
            aria-describedby="ct-editor-ayuda"
          />
        </div>
      </div>
      <div className="ct-editor-estado">
        <span id="ct-editor-ayuda">
          Tab para indentar (Esc y Tab para salir) · pegar está desactivado: escríbelo tú para practicar
        </span>
        <span>Línea {cursor.linea}, columna {cursor.columna}</span>
      </div>
    </div>
  )
}
