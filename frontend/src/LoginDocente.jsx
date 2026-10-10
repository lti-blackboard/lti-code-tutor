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
    <form className="login-docente" onSubmit={entrar}>
      <h1 className="pd-titulo">Acceso docente</h1>
      <p className="pd-subtitulo">Ingresa para ver la actividad del curso y administrar tus ejercicios.</p>

      <label className="campo">
        <span>Usuario</span>
        <input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          autoFocus
          required
        />
      </label>
      <label className="campo">
        <span>Contraseña</span>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && <div className="mensaje-sistema">{error}</div>}

      <button className="analisis-btn" type="submit" disabled={entrando}>
        {entrando ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}
