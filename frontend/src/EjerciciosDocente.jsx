import { useEffect, useState } from 'react'
import { fetchDocente } from './api.js'
import { NIVELES, NOMBRE_LENGUAJE, TEMAS, etiquetaNivel, nombreTema } from './catalogo.js'
import Modal from './Modal.jsx'

const VACIO = {
  titulo: '',
  tema: 'variables',
  nivel: 'básico',
  lenguaje: 'python',
  enunciado: '',
  codigo_base: '',
  salida_esperada: '',
}

// Origen de cada ejercicio (lo calcula el backend).
const ORIGEN = {
  base: { texto: 'Base', ayuda: 'catálogo inicial del sistema' },
  modificado: { texto: 'Modificado', ayuda: 'base editado por ti, se puede restaurar' },
  creado: { texto: 'Creado por ti', ayuda: 'se puede eliminar' },
}

export default function EjerciciosDocente({ onNoAutorizado }) {
  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)

  // Edición: null (cerrado), 'nuevo' o el ejercicio que se edita.
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState(null)

  // Acciones que piden confirmación con un segundo clic: { id, accion }.
  const [confirmar, setConfirmar] = useState(null)

  // Filtro por lenguaje para recorrer la lista con más comodidad.
  const [lenguaje, setLenguaje] = useState('todos')

  function manejarError(err, enFormulario = false) {
    if (err.codigo === 'NO_AUTORIZADO') return onNoAutorizado()
    if (enFormulario) setErrorForm(err.message)
    else setError(err.message)
  }

  function cargar() {
    fetchDocente('/docente/ejercicios')
      .then((datos) => setEjercicios(datos.ejercicios))
      .catch((err) => manejarError(err))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  function avisar(texto) {
    setError(null)
    setMensaje(texto)
  }

  function abrirNuevo() {
    setEditando('nuevo')
    setForm(VACIO)
    setErrorForm(null)
  }

  function abrirEdicion(ej) {
    setEditando(ej)
    setForm({
      titulo: ej.titulo,
      tema: ej.tema,
      nivel: ej.nivel,
      lenguaje: ej.lenguaje,
      enunciado: ej.enunciado,
      codigo_base: ej.codigo_base || '',
      salida_esperada: ej.salida_esperada || '',
    })
    setErrorForm(null)
  }

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setErrorForm(null)
    const esNuevo = editando === 'nuevo'
    try {
      await fetchDocente(esNuevo ? '/docente/ejercicios' : `/docente/ejercicios/${editando.id}`, {
        method: esNuevo ? 'POST' : 'PUT',
        body: JSON.stringify(form),
      })
      avisar(
        esNuevo
          ? `Ejercicio creado. Ya aparece para los estudiantes en ${NOMBRE_LENGUAJE[form.lenguaje]}, tema ${nombreTema(form.tema)}.`
          : `Cambios guardados en «${form.titulo}».`,
      )
      setEditando(null)
      cargar()
    } catch (err) {
      manejarError(err, true)
    } finally {
      setGuardando(false)
    }
  }

  async function alternarVisible(ej) {
    const oculto = !ej.oculto
    // Se actualiza la fila de inmediato y se revierte si falla.
    setEjercicios((lista) => lista.map((x) => (x.id === ej.id ? { ...x, oculto: oculto ? 1 : 0 } : x)))
    try {
      await fetchDocente(`/docente/ejercicios/${ej.id}/visibilidad`, {
        method: 'POST',
        body: JSON.stringify({ oculto }),
      })
      avisar(
        oculto
          ? `«${ej.titulo}» quedó oculto para los estudiantes.`
          : `«${ej.titulo}» vuelve a estar visible para los estudiantes.`,
      )
    } catch (err) {
      setEjercicios((lista) => lista.map((x) => (x.id === ej.id ? { ...x, oculto: ej.oculto } : x)))
      manejarError(err)
    }
  }

  async function accionConConfirmacion(ej, accion) {
    if (confirmar?.id !== ej.id || confirmar?.accion !== accion) {
      setConfirmar({ id: ej.id, accion })
      return
    }
    setConfirmar(null)
    try {
      if (accion === 'restaurar') {
        await fetchDocente(`/docente/ejercicios/${ej.id}/restaurar`, { method: 'POST' })
        avisar(`«${ej.titulo}» volvió a su versión original.`)
      } else {
        await fetchDocente(`/docente/ejercicios/${ej.id}`, { method: 'DELETE' })
        avisar(`«${ej.titulo}» fue eliminado.`)
      }
      cargar()
    } catch (err) {
      manejarError(err)
    }
  }

  const esNuevo = editando === 'nuevo'
  const origenEditado = !esNuevo && editando ? editando.origen : null

  return (
    <div className="dp-seccion">
      <div className="dp-cabecera">
        <div className="dp-cabecera-texto">
          <h1 className="dp-titulo">
            Ejercicios <b>del curso</b>
          </h1>
          <p className="dp-bajada dp-bajada-limitada">
            Edita cualquier ejercicio, ocúltalo a los estudiantes o crea los tuyos. Los ejercicios
            base modificados se pueden restaurar a su versión original.
          </p>
        </div>
        <button type="button" className="ct-btn ct-btn-accion dp-btn-grande" onClick={abrirNuevo}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo ejercicio
        </button>
      </div>

      <div className="dp-leyenda-fila">
        <div className="dp-leyenda">
          {Object.entries(ORIGEN).map(([clave, o]) => (
            <span key={clave} className="dp-leyenda-item">
              <span className={`dp-origen dp-origen-${clave}`}>{o.texto}</span> {o.ayuda}
            </span>
          ))}
        </div>
        <div role="group" aria-label="Filtrar ejercicios por lenguaje" className="dp-filtros">
          {[
            ['todos', 'Todos'],
            ['python', 'Python'],
            ['java', 'Java'],
          ].map(([clave, texto]) => (
            <button
              key={clave}
              type="button"
              aria-pressed={lenguaje === clave}
              className="dp-filtro"
              onClick={() => setLenguaje(clave)}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>

      {mensaje && <div className="dp-mensaje-ok" role="status">{mensaje}</div>}
      {error && <div className="dp-error" role="alert">{error}</div>}

      {cargando ? (
        <div className="dp-estado">Cargando ejercicios…</div>
      ) : (
        <div className="dp-tabla-caja">
          <table className="dp-tabla dp-tabla-ejercicios">
            <thead>
              <tr>
                <th scope="col">Ejercicio</th>
                <th scope="col">Lenguaje</th>
                <th scope="col">Nivel</th>
                <th scope="col">Origen</th>
                <th scope="col">Visible</th>
                <th scope="col" className="dp-col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ejercicios.filter((ej) => lenguaje === 'todos' || ej.lenguaje === lenguaje).map((ej) => {
                const oculto = !!ej.oculto
                const confirmando = (accion) => confirmar?.id === ej.id && confirmar?.accion === accion
                return (
                  <tr key={ej.id} className={oculto ? 'dp-fila-oculta' : ''}>
                    <td>
                      <div className="dp-celda-titulo">{ej.titulo}</div>
                      <div className="dp-celda-tema">{nombreTema(ej.tema)}</div>
                    </td>
                    <td><span className="dp-lenguaje">{ej.lenguaje}</span></td>
                    <td>{etiquetaNivel(ej.nivel)}</td>
                    <td>
                      <span className={`dp-origen dp-origen-${ej.origen}`}>
                        {(ORIGEN[ej.origen] || ORIGEN.base).texto}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dp-interruptor"
                        role="switch"
                        aria-checked={!oculto}
                        aria-label={`Visible para estudiantes: ${ej.titulo} (${ej.lenguaje})`}
                        onClick={() => alternarVisible(ej)}
                      >
                        <span className="dp-interruptor-perilla" aria-hidden="true" />
                      </button>
                    </td>
                    <td className="dp-col-acciones">
                      <span className="dp-acciones">
                        <button type="button" className="dp-accion" onClick={() => abrirEdicion(ej)}>
                          Editar
                        </button>
                        {ej.origen === 'modificado' && (
                          <button
                            type="button"
                            className="dp-accion dp-accion-restaurar"
                            onClick={() => accionConConfirmacion(ej, 'restaurar')}
                          >
                            {confirmando('restaurar') ? '¿Seguro? Restaurar' : 'Restaurar original'}
                          </button>
                        )}
                        {ej.origen === 'creado' && (
                          <button
                            type="button"
                            className="dp-accion dp-accion-eliminar"
                            onClick={() => accionConConfirmacion(ej, 'eliminar')}
                          >
                            {confirmando('eliminar') ? '¿Seguro? Eliminar' : 'Eliminar'}
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <Modal
          etiqueta={esNuevo ? 'Nuevo ejercicio' : `Editar ejercicio · ${ORIGEN[origenEditado]?.texto || ''}`}
          titulo={esNuevo ? 'Crear ejercicio' : editando.titulo}
          ancho={760}
          onCerrar={() => setEditando(null)}
        >
          <form className="dp-form" onSubmit={guardar}>
            {origenEditado === 'base' && (
              <p className="dp-form-aviso">
                Es un ejercicio del catálogo base: al guardar quedará como «Modificado» y podrás
                restaurar la versión original cuando quieras.
              </p>
            )}
            <label className="dp-campo">
              Título
              <input
                value={form.titulo}
                onChange={(e) => cambiar('titulo', e.target.value)}
                placeholder="Ej.: Tabla de multiplicar"
                required
              />
            </label>
            <div className="dp-campos-fila">
              <label className="dp-campo">
                Lenguaje
                <select value={form.lenguaje} onChange={(e) => cambiar('lenguaje', e.target.value)}>
                  {Object.entries(NOMBRE_LENGUAJE).map(([valor, texto]) => (
                    <option key={valor} value={valor}>{texto}</option>
                  ))}
                </select>
              </label>
              <label className="dp-campo">
                Tema
                <select value={form.tema} onChange={(e) => cambiar('tema', e.target.value)}>
                  {TEMAS.map(([valor, texto]) => (
                    <option key={valor} value={valor}>{texto}</option>
                  ))}
                </select>
              </label>
              <label className="dp-campo">
                Nivel
                <select value={form.nivel} onChange={(e) => cambiar('nivel', e.target.value)}>
                  {NIVELES.map(([valor, texto]) => (
                    <option key={valor} value={valor}>{texto}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="dp-campo">
              Enunciado
              <textarea
                rows={3}
                value={form.enunciado}
                onChange={(e) => cambiar('enunciado', e.target.value)}
                placeholder="Lo que el estudiante debe lograr."
                required
              />
            </label>
            <div className="dp-campos-codigo">
              <label className="dp-campo">
                Código base
                <textarea
                  className="dp-codigo-oscuro"
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
                <span className="dp-campo-ayuda">
                  Código con el que parte el estudiante; puede traer un error intencional. En Java,
                  la clase principal debe llamarse Main.
                </span>
              </label>
              <label className="dp-campo">
                Salida esperada
                <textarea
                  className="dp-codigo-claro"
                  rows={8}
                  value={form.salida_esperada}
                  onChange={(e) => cambiar('salida_esperada', e.target.value)}
                  spellCheck={false}
                />
                <span className="dp-campo-ayuda">
                  Lo que debe imprimir el programa correcto. Se usa para marcar el ejercicio como
                  resuelto; si la dejas vacía, el ejercicio no se marca como resuelto.
                </span>
              </label>
            </div>

            {errorForm && <div className="dp-error" role="alert">{errorForm}</div>}

            <div className="dp-form-acciones">
              <button type="button" className="ct-btn ct-btn-secundario" onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button type="submit" className="ct-btn ct-btn-accion" disabled={guardando}>
                {guardando ? 'Guardando…' : esNuevo ? 'Crear ejercicio' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
