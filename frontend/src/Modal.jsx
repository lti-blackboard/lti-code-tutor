import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/*
 * Ventana modal del panel docente: franja naranja, etiqueta, título y
 * botón de cierre. Se cierra con Escape o haciendo clic fuera de la caja.
 * Se dibuja directamente en <body> para quedar sobre toda la página.
 */
export default function Modal({ etiqueta, titulo, onCerrar, ancho = 600, children }) {
  const caja = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    caja.current?.focus()
    const alPresionar = (e) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPresionar)
    return () => {
      document.removeEventListener('keydown', alPresionar)
      anterior?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="dp-modal-fondo" onMouseDown={onCerrar}>
      <div
        ref={caja}
        className="dp-modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        style={{ maxWidth: ancho }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dp-modal-franja" aria-hidden="true" />
        <div className="dp-modal-cuerpo">
          <div className="dp-modal-cabecera">
            <div className="dp-modal-titulos">
              <span className="dp-modal-etiqueta">{etiqueta}</span>
              <span className="dp-modal-titulo">{titulo}</span>
            </div>
            <button type="button" className="dp-modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
