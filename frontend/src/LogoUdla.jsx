/*
 * Logo de la UDLA en el encabezado, seguido del divisor.
 * Está aislado en este archivo a propósito: el uso del logo está pendiente
 * de confirmar con el profesor. Para quitarlo, basta con cambiar
 * MOSTRAR_LOGO_UDLA a false (o borrar este componente y su uso en Encabezado).
 */

export const MOSTRAR_LOGO_UDLA = true

export default function LogoUdla({ onInicio }) {
  if (!MOSTRAR_LOGO_UDLA) return null
  return (
    <>
      {/* Igual que la marca codetutor, el logo lleva al inicio. */}
      <button type="button" className="ct-logo-boton" onClick={onInicio} title="Ir al inicio"
        aria-label="Universidad de Las Américas, ir al inicio">
        <img className="ct-logo-udla" src="/logo-udla.png" alt="" />
      </button>
      <div className="ct-divisor" aria-hidden="true" />
    </>
  )
}
