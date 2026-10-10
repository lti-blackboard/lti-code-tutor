import { useEffect, useState } from 'react'
import { fetchDocente, guardarTokenDocente, obtenerTokenDocente } from './api.js'
import LoginDocente from './LoginDocente.jsx'
import EjerciciosDocente from './EjerciciosDocente.jsx'

function claseDificultad(promedio) {
  if (promedio >= 2.5) return 'fill-alta'
  if (promedio >= 1.5) return 'fill-media'
  return 'fill-baja'
}

function porcentajeDificultad(promedio) {
  return Math.min(100, Math.round((promedio / 4) * 100))
}

function formatearFecha(fechaTexto) {
  try {
    const fecha = new Date(fechaTexto.replace(' ', 'T') + 'Z')
    return fecha.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return fechaTexto
  }
}

// Contenedor del panel: pide inicio de sesión y separa las dos secciones.
export default function PanelDocente({ onVolver }) {
  const [token, setToken] = useState(obtenerTokenDocente())
  const [seccion, setSeccion] = useState('actividad') // 'actividad' | 'ejercicios'

  function cerrarSesion() {
    guardarTokenDocente(null)
    setToken(null)
  }

  return (
    <div className="panel-docente">
      <div className="header">
        <div />
        <div className="pd-acciones">
          {token && (
            <button className="volver-btn" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          )}
          <button className="volver-btn" onClick={onVolver}>
            ← Volver al catálogo
          </button>
        </div>
      </div>

      {!token ? (
        <LoginDocente onEntrar={setToken} />
      ) : (
        <>
          <div className="pd-tabs">
            <button
              className={seccion === 'actividad' ? 'pd-tab activo' : 'pd-tab'}
              onClick={() => setSeccion('actividad')}
            >
              Actividad del curso
            </button>
            <button
              className={seccion === 'ejercicios' ? 'pd-tab activo' : 'pd-tab'}
              onClick={() => setSeccion('ejercicios')}
            >
              Mis ejercicios
            </button>
          </div>
          {seccion === 'actividad' ? (
            <ActividadCurso onNoAutorizado={cerrarSesion} />
          ) : (
            <EjerciciosDocente onNoAutorizado={cerrarSesion} />
          )}
        </>
      )}
    </div>
  )
}

function ActividadCurso({ onNoAutorizado }) {
  const [resumen, setResumen] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Análisis de las preguntas con IA (a pedido, porque consume la API).
  const [analisis, setAnalisis] = useState(null)
  const [analizando, setAnalizando] = useState(false)

  // Estado del modal de detalle.
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchDocente('/docente/resumen'),
      fetchDocente('/docente/alertas'),
      fetchDocente('/docente/sugerencias').catch(() => ({ sugerencias: [] })),
    ])
      .then(([resumenData, alertasData, sugerenciasData]) => {
        setResumen(resumenData)
        setAlertas(alertasData.alertas)
        setSugerencias(sugerenciasData.sugerencias || [])
      })
      .catch((err) => {
        if (err.codigo === 'NO_AUTORIZADO') onNoAutorizado()
        else setError('No se pudo conectar con el backend.')
      })
      .finally(() => setCargando(false))
  }, [])

  async function pedirAnalisis() {
    setAnalizando(true)
    try {
      const datos = await fetchDocente('/docente/analisis-ia', { method: 'POST' })
      setAnalisis(datos)
    } catch (err) {
      if (err.codigo === 'NO_AUTORIZADO') return onNoAutorizado()
      setAnalisis({ error: err.message || 'No se pudo generar el análisis.' })
    } finally {
      setAnalizando(false)
    }
  }

  async function abrirDetalle(sesionId, ejercicioId) {
    setDetalleAbierto(true)
    setCargandoDetalle(true)
    setDetalle(null)
    try {
      const datos = await fetchDocente(`/docente/detalle/${sesionId}/${ejercicioId}`)
      setDetalle(datos)
    } catch (err) {
      if (err.codigo === 'NO_AUTORIZADO') return onNoAutorizado()
      setDetalle({ error: true })
    } finally {
      setCargandoDetalle(false)
    }
  }

  if (cargando) return <div className="estado-carga">Cargando panel del profesor…</div>
  if (error) return <div className="estado-error">{error}</div>

  const { kpis, ejercicios } = resumen

  return (
    <div>
      <h1 className="pd-titulo">Actividad del curso</h1>
      <p className="pd-subtitulo">
        Resumen de cómo están usando el tutor tus estudiantes, por ejercicio.
      </p>

      <div className="kpis">
        <div className="kpi-card">
          <div className="kpi-numero">{kpis.total_consultas}</div>
          <div className="kpi-etiqueta">Consultas al tutor registradas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-numero">{kpis.estudiantes_activos}</div>
          <div className="kpi-etiqueta">Sesiones de estudiante</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-numero">{kpis.estudiantes_atascados}</div>
          <div className="kpi-etiqueta">Casos con 3+ intentos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-numero">{kpis.porcentaje_pidio_directa}%</div>
          <div className="kpi-etiqueta">Pidió explicación directa</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-numero">{kpis.porcentaje_sin_errores ?? 0}%</div>
          <div className="kpi-etiqueta">
            Ejercicios ejecutados sin errores ({kpis.ejercicios_sin_errores ?? 0} de{' '}
            {kpis.ejercicios_trabajados ?? 0})
          </div>
        </div>
      </div>

      <div className="seccion-titulo">Sugerencias para el docente</div>
      <div className="sugerencias">
        {sugerencias.map((s, i) => (
          <div className={`sugerencia sugerencia-${s.tipo}`} key={i}>
            {s.texto}
          </div>
        ))}
        <div className="analisis-ia">
          {!analisis && (
            <button className="analisis-btn" onClick={pedirAnalisis} disabled={analizando}>
              {analizando ? 'Analizando preguntas…' : 'Analizar las preguntas con IA'}
            </button>
          )}
          {analisis && !analisis.error && (
            <div className="analisis-texto">
              <div className="analisis-meta">
                Análisis con IA de {analisis.preguntas_analizadas} preguntas recientes. Es una
                ayuda para interpretar los datos, no un diagnóstico.
              </div>
              {analisis.analisis}
            </div>
          )}
          {analisis?.error && <div className="mensaje-sistema">{analisis.error}</div>}
        </div>
      </div>

      <div className="seccion-titulo">Alertas</div>
      {alertas.length === 0 ? (
        <div className="margen-vacio" style={{ marginBottom: 30 }}>
          Sin alertas por ahora — ningún estudiante lleva 3 o más intentos seguidos en el mismo
          ejercicio.
        </div>
      ) : (
        <div className="alertas">
          {alertas.map((a, i) => (
            <div className="alerta" key={i}>
              <div className="alerta-texto">
                Sesión <b>{a.sesion_id}</b> lleva <b>{a.intentos} intentos</b> en "{a.titulo}" (
                {a.lenguaje})
                <span className={a.ejecuto_sin_errores ? 'estado-ok' : 'estado-pendiente'}>
                  {a.ejecuto_sin_errores ? 'Ya lo ejecutó sin errores' : 'Aún sin ejecutar sin errores'}
                </span>
              </div>
              <button
                className="alerta-badge alerta-badge-btn"
                onClick={() => abrirDetalle(a.sesion_id, a.ejercicio_id)}
              >
                Revisar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="seccion-titulo">Ejercicios — mapa de dificultad</div>
      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>Ejercicio</th>
              <th>Lenguaje</th>
              <th>Consultas</th>
              <th>Prom. intentos</th>
              <th>Sin errores</th>
              <th>Dificultad percibida</th>
            </tr>
          </thead>
          <tbody>
            {ejercicios.map((ej) => (
              <tr key={ej.ejercicio_id}>
                <td>
                  <div className="ejercicio-nombre">{ej.titulo}</div>
                  <div className="ejercicio-tema">{ej.tema}</div>
                </td>
                <td>
                  <span className="lenguaje-pill">{ej.lenguaje}</span>
                </td>
                <td>{ej.total_consultas}</td>
                <td>{ej.promedio_intentos}</td>
                <td>
                  {ej.sesiones_sin_errores ?? 0} de {ej.sesiones_unicas}
                </td>
                <td>
                  <div className="barra-dificultad">
                    <div
                      className={`barra-dificultad-fill ${claseDificultad(ej.promedio_intentos)}`}
                      style={{ width: `${porcentajeDificultad(ej.promedio_intentos)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="pd-nota-demo">
        Nota: las sesiones cuyo nombre empieza con "demo-" son datos ficticios generados
        para esta demostración, no actividad real de estudiantes.
      </p>

      {detalleAbierto && (
        <div className="modal-overlay" onClick={() => setDetalleAbierto(false)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">Detalle de sesión</div>
                <h2 className="modal-titulo">
                  {cargandoDetalle ? 'Cargando…' : detalle?.titulo || 'Sin datos'}
                </h2>
              </div>
              <button className="modal-cerrar" onClick={() => setDetalleAbierto(false)}>
                ✕
              </button>
            </div>

            {cargandoDetalle && <div className="margen-vacio">Cargando historial…</div>}

            {!cargandoDetalle && detalle && !detalle.error && (
              <>
                <p className="modal-enunciado">{detalle.enunciado}</p>
                <div className="modal-lista-intentos">
                  {detalle.intentos.map((intento, i) => (
                    <div className="modal-intento" key={i}>
                      <div className="modal-intento-numero">Intento {i + 1}</div>
                      <div className="modal-intento-pregunta">"{intento.pregunta}"</div>
                      <div className="modal-intento-meta">
                        {formatearFecha(intento.creado_en)}
                        {intento.pidio_respuesta_directa && (
                          <span className="modal-badge-directa"> · pidió explicación directa</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!cargandoDetalle && detalle?.error && (
              <div className="mensaje-sistema">No se pudo cargar el detalle de esta sesión.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
