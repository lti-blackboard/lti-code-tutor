import LogoUdla from './LogoUdla.jsx'

/*
 * Encabezado común a todas las pantallas: franja naranja, logo UDLA,
 * divisor y la marca codetutor (que siempre lleva al inicio).
 * "acciones" es el contenido de la derecha (por ejemplo, el botón
 * "Panel docente", que solo se muestra en el Paso 1).
 * "etiqueta" es una insignia junto a la marca (por ejemplo, "Vista docente").
 */
export default function Encabezado({ onInicio, acciones = null, etiqueta = null }) {
  return (
    <>
      <div className="ct-franja" aria-hidden="true" />
      <header className="ct-encabezado">
        <div className="ct-encabezado-interior">
          <div className="ct-identidad">
            <LogoUdla onInicio={onInicio} />
            <button
              type="button"
              className="ct-marca"
              onClick={onInicio}
              aria-label="codetutor, ir al inicio"
              title="Ir al inicio"
            >
              <span className="ct-marca-icono" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF"
                  strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 6 3 12 8 18" />
                  <polyline points="16 6 21 12 16 18" />
                  <line x1="13.5" y1="4" x2="10.5" y2="20" />
                </svg>
              </span>
              <span className="ct-marca-texto">
                <span className="ct-marca-bajada">Tutor de programación</span>
                <span className="ct-marca-nombre">
                  code<span className="ct-marca-acento">tutor</span>
                </span>
              </span>
            </button>
            {etiqueta && <span className="ct-etiqueta-vista">{etiqueta}</span>}
          </div>
          {acciones && <div className="ct-encabezado-acciones">{acciones}</div>}
        </div>
      </header>
    </>
  )
}
