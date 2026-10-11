import { useState } from 'react'
import { loginDocente } from './api.js'

export default function LoginDocente({ onEntrar }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState(null)
  const [entrando, setEntrando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setEntrando(true)
    setError(null)
    try {
      const token = await loginDocente(usuario, clave)
      onEntrar(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setEntrando(false)
    }
  }

  return (
    <form className="dp-login" onSubmit={entrar}>
      <div className="dp-modal-franja" aria-hidden="true" />
      <div className="dp-login-cuerpo">
        <h1 className="dp-titulo">
          Acceso <b>docente</b>
        </h1>
        <p className="dp-bajada">
          Ingresa para ver la actividad del curso y administrar los ejercicios.
        </p>

        <label className="dp-campo">
          Usuario
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </label>
        <label className="dp-campo">
          Contraseña
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="dp-error" role="alert">{error}</div>}

        <button className="ct-btn ct-btn-accion dp-btn-grande" type="submit" disabled={entrando}>
          {entrando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </div>
    </form>
  )
}
