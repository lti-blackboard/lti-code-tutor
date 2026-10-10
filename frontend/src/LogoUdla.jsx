/*
 * Logo de la UDLA en el encabezado, seguido del divisor.
 * Está aislado en este archivo a propósito: el uso del logo está pendiente
 * de confirmar con el profesor. Para quitarlo, basta con cambiar
 * MOSTRAR_LOGO_UDLA a false (o borrar este componente y su uso en Encabezado).
 */

export const MOSTRAR_LOGO_UDLA = true

export default function LogoUdla() {
  if (!MOSTRAR_LOGO_UDLA) return null
  return (
    <>
      <img className="ct-logo-udla" src="/logo-udla.png" alt="Universidad de Las Américas" />
      <div className="ct-divisor" aria-hidden="true" />
    </>
  )
}
