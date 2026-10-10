import { numeroNivel } from './catalogo.js'

/* Barritas de nivel: 1 encendida = básico, 2 = intermedio, 3 = avanzado. */
export default function Barras({ nivel, grande = false }) {
  const n = numeroNivel(nivel)
  return (
    <span className={grande ? 'ct-barras ct-barras-grandes' : 'ct-barras'} aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? 'ct-barra ct-barra-on' : 'ct-barra'} />
      ))}
    </span>
  )
}
