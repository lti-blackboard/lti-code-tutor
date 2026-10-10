export function FlechaDerecha({ ancho = 30, alto = 18 }) {
  return (
    <svg width={ancho} height={alto} viewBox="0 0 30 18" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="2" y1="9" x2="26" y2="9" />
      <polyline points="19 2 27 9 19 16" />
    </svg>
  )
}

export function FlechaIzquierda({ ancho = 20, alto = 14 }) {
  return (
    <svg width={ancho} height={alto} viewBox="0 0 30 18" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="28" y1="9" x2="4" y2="9" />
      <polyline points="11 2 3 9 11 16" />
    </svg>
  )
}
