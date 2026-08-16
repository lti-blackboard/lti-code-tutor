import { useEffect, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000'

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

export default function PanelDocente({ onVolver }) {
  const [resumen, setResumen] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Estado del modal de detalle.
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/docente/resumen`).then((r) => r.json()),
      fetch(`${API_BASE}/docente/alertas`).then((r) => r.json()),
    ])
      .then(([resumenData, alertasData]) => {
        setResumen(resumenData)
        setAlertas(alertasData.alertas)
      })
      .catch(() => setError('No se pudo conectar con el backend.'))
      .finally(() => setCargando(false))
  }, [])

  async function abrirDetalle(sesionId, ejercicioId) {
    setDetalleAbierto(true)
    setCargandoDetalle(true)
    setDetalle(null)
    try {
      const respuesta = await fetch(`${API_BASE}/docente/detalle/${sesionId}/${ejercicioId}`)
      const datos = await respuesta.json()
      setDetalle(datos)
    } catch {
      setDetalle({ error: true })
    } finally {
      setCargandoDetalle(false)
    }
  }

  if (cargando) return <div className="estado-carga">Cargando panel del profesor…</div>
  if (error) return <div className="estado-error">{error}</div>

  const { kpis, ejercicios } = resumen

  return (
    <div className="panel-docente">
      <div className="header">
        <div className="brand">
          code<span>tutor</span>
        </div>
        <button className="volver-btn" onClick={onVolver}>
          ← Volver al catálogo
        </button>
      </div>

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
        Nota: si estos datos provienen del script de prueba (generar_datos_demo.py), son datos
        ficticios generados para esta demostración, no actividad real de estudiantes.
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
