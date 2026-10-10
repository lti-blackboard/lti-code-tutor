import { useEffect, useState } from 'react'
import { fetchDocente } from './api.js'

const TEMAS = [
  ['variables', 'Variables y tipos de datos'],
  ['condicionales', 'Condicionales'],
  ['ciclos', 'Ciclos'],
  ['funciones', 'Funciones'],
  ['listas', 'Listas / arreglos'],
  ['recursividad', 'Recursividad'],
  ['poo', 'Programación orientada a objetos'],
]
const NIVELES = ['básico', 'intermedio', 'avanzado']
const nombreTema = (clave) => (TEMAS.find((t) => t[0] === clave) || [clave, clave])[1]

const VACIO = {
  titulo: '',
  tema: 'variables',
  nivel: 'básico',
  lenguaje: 'python',
  enunciado: '',
  codigo_base: '',
}

export default function EjerciciosDocente({ onNoAutorizado }) {
  const [ejercicios, setEjercicios] = useState([])
  const [form, setForm] = useState(VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const [confirmarBorrar, setConfirmarBorrar] = useState(null)

  function manejarError(err) {
    if (err.codigo === 'NO_AUTORIZADO') onNoAutorizado()
    else setError(err.message)
  }

  function cargar() {
    fetchDocente('/docente/ejercicios')
      .then((datos) => setEjercicios(datos.ejercicios))
      .catch(manejarError)
  }

  useEffect(cargar, [])

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    setMensaje(null)
    try {
      const ruta = editandoId ? `/docente/ejercicios/${editandoId}` : '/docente/ejercicios'
      await fetchDocente(ruta, {
        method: editandoId ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      })
      const lenguaje = form.lenguaje === 'python' ? 'Python' : 'Java'
      setMensaje(
        editandoId
          ? 'Cambios guardados.'
          : `Ejercicio creado. Ya aparece en el catálogo de ${lenguaje}, en el tema ${nombreTema(form.tema)}.`
      )
      setForm(VACIO)
      setEditandoId(null)
      cargar()
    } catch (err) {
      manejarError(err)
    } finally {
      setGuardando(false)
    }
  }

  function editar(ej) {
    setEditandoId(ej.id)
    setForm({
      titulo: ej.titulo,
      tema: ej.tema,
      nivel: ej.nivel,
      lenguaje: ej.lenguaje,
      enunciado: ej.enunciado,
      codigo_base: ej.codigo_base,
    })
    setMensaje(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function borrar(id) {
    if (confirmarBorrar !== id) {
      setConfirmarBorrar(id)
      return
    }
    try {
      await fetchDocente(`/docente/ejercicios/${id}`, { method: 'DELETE' })
      setConfirmarBorrar(null)
      if (editandoId === id) {
        setEditandoId(null)
        setForm(VACIO)
      }
      setMensaje('Ejercicio eliminado del catálogo.')
      cargar()
    } catch (err) {
      manejarError(err)
    }
  }

  return (
    <div>
      <h1 className="pd-titulo">Mis ejercicios</h1>
      <p className="pd-subtitulo">
        Los ejercicios que crees aparecen en el catálogo principal, en el lenguaje y el tema que
        elijas, junto a los ejercicios base.
      </p>

      <form className="form-ejercicio" onSubmit={guardar}>
        <div className="seccion-titulo">{editandoId ? 'Editar ejercicio' : 'Nuevo ejercicio'}</div>

        <label className="campo">
          <span>Título</span>
          <input
            value={form.titulo}
            onChange={(e) => cambiar('titulo', e.target.value)}
            placeholder="Ej.: Tabla de multiplicar"
            required
          />
        </label>

        <div className="campos-fila">
          <div className="campo">
            <span>Lenguaje</span>
            <div className="lang-toggle">
              {[
                ['python', 'Python'],
                ['java', 'Java'],
              ].map(([valor, texto]) => (
                <button
                  type="button"
                  key={valor}
                  className={form.lenguaje === valor ? 'lang-btn activo' : 'lang-btn'}
                  onClick={() => cambiar('lenguaje', valor)}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>
          <label className="campo">
            <span>Tema</span>
            <select value={form.tema} onChange={(e) => cambiar('tema', e.target.value)}>
              {TEMAS.map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Nivel</span>
            <select value={form.nivel} onChange={(e) => cambiar('nivel', e.target.value)}>
              {NIVELES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="campo">
          <span>Enunciado</span>
          <textarea
            rows={3}
            value={form.enunciado}
            onChange={(e) => cambiar('enunciado', e.target.value)}
            placeholder="Lo que el estudiante debe lograr."
            required
          />
        </label>

        <label className="campo">
          <span>Código base (opcional)</span>
          <textarea
            className="codigo-base"
            rows={8}
            value={form.codigo_base}
            onChange={(e) => cambiar('codigo_base', e.target.value)}
            placeholder={
              form.lenguaje === 'java'
                ? 'public class Main {\n    public static void main(String[] args) {\n    }\n}'
                : 'def mi_funcion():\n    pass'
            }
            spellCheck={false}
          />
          <small>
            Es el código con el que parte el estudiante. Puede traer un error intencional o estar
            incompleto. En Java, la clase principal debe llamarse Main.
          </small>
        </label>

        {error && <div className="mensaje-sistema">{error}</div>}
        {mensaje && <div className="mensaje-ok">{mensaje}</div>}

        <div className="form-acciones">
          <button className="analisis-btn" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear ejercicio'}
          </button>
          {editandoId && (
            <button
              type="button"
              className="volver-btn"
              onClick={() => {
                setEditandoId(null)
                setForm(VACIO)
              }}
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="seccion-titulo">Ejercicios creados ({ejercicios.length})</div>
      {ejercicios.length === 0 ? (
        <div className="margen-vacio">Todavía no has creado ejercicios.</div>
      ) : (
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th>Ejercicio</th>
                <th>Lenguaje</th>
                <th>Nivel</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ejercicios.map((ej) => (
                <tr key={ej.id}>
                  <td>
                    <div className="ejercicio-nombre">{ej.titulo}</div>
                    <div className="ejercicio-tema">{nombreTema(ej.tema)}</div>
                  </td>
                  <td>
                    <span className="lenguaje-pill">{ej.lenguaje}</span>
                  </td>
                  <td>
                    <span className={`nivel-tag nivel-${ej.nivel}`}>{ej.nivel}</span>
                  </td>
                  <td className="acciones-celda">
                    <button className="volver-btn" onClick={() => editar(ej)}>
                      Editar
                    </button>
                    <button
                      className={confirmarBorrar === ej.id ? 'borrar-btn confirmar' : 'borrar-btn'}
                      onClick={() => borrar(ej.id)}
                    >
                      {confirmarBorrar === ej.id ? '¿Seguro? Eliminar' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
