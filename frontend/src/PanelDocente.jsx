import { useEffect, useState } from 'react'
import { fetchDocente } from './api.js'
import { NOMBRE_LENGUAJE, nombreTema } from './catalogo.js'
import LoginDocente from './LoginDocente.jsx'
import EjerciciosDocente from './EjerciciosDocente.jsx'
import Modal from './Modal.jsx'

// Dificultad percibida según el promedio de consultas por sesión.
function nivelDificultad(promedio) {
  if (promedio >= 2.5) return 'alta'
  if (promedio >= 1.5) return 'media'
  return 'baja'
}
const ETIQUETA_DIFICULTAD = { alta: 'Alta', media: 'Media', baja: 'Baja' }

function formatearFecha(fechaTexto) {
  try {
    const fecha = new Date(fechaTexto.replace(' ', 'T') + 'Z')
    return fecha.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return fechaTexto
  }
}

// Tipo de sugerencia -> etiqueta e inicial del ícono (el color va en el CSS).
const TIPOS_SUGERENCIA = {
  reforzar: ['Reforzar', 'R'],
  revisar: ['Revisar', '!'],
  contactar: ['Contactar', '@'],
  positivo: ['Buena señal', '✓'],
  info: ['Información', 'i'],
}

const FILTROS_LENGUAJE = [
  ['todos', 'Todos'],
  ['python', 'Python'],
  ['java', 'Java'],
]

// Muestra el análisis con IA: los títulos (líneas que terminan en ":") en
// negrita y las viñetas como lista. Quita restos de Markdown por si acaso.
function TextoAnalisis({ texto }) {
  const bloques = []
  for (const cruda of String(texto || '').split('\n')) {
    const linea = cruda.replace(/\*\*|__|`/g, '').trim()
    if (!linea || /^[-*_]{3,}$/.test(linea)) continue
    const vineta = linea.match(/^[-*•]\s+(.*)$/)
    if (vineta) {
      const ultimo = bloques[bloques.length - 1]
      if (ultimo && ultimo.tipo === 'lista') ultimo.items.push(vineta[1])
      else bloques.push({ tipo: 'lista', items: [vineta[1]] })
    } else {
      bloques.push({ tipo: /:$/.test(linea) ? 'titulo' : 'parrafo', texto: linea })
    }
  }
  return (
    <div className="dp-analisis-texto">
      {bloques.map((b, i) =>
        b.tipo === 'lista' ? (
          <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>
        ) : b.tipo === 'titulo' ? (
          <b key={i} className="dp-analisis-titulo">{b.texto}</b>
        ) : (
          <p key={i}>{b.texto}</p>
        ),
      )}
    </div>
  )
}

// Contenedor del panel: pide inicio de sesión y separa las dos pestañas.
export default function PanelDocente({ token, cargandoAcceso, onEntrar, onNoAutorizado }) {
  const [pestana, setPestana] = useState('actividad') // 'actividad' | 'ejercicios'

  if (cargandoAcceso) {
    return (
      <div className="dp-pagina ct-entrada">
        <div className="dp-estado">
          Conectando con el servidor… Si estuvo inactivo, puede tardar hasta un minuto.
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="dp-pagina ct-entrada">
        <LoginDocente onEntrar={onEntrar} />
      </div>
    )
  }

  return (
    <div className="dp-fondo">
      <div className="dp-pagina ct-entrada">
        <div role="tablist" aria-label="Secciones del panel" className="dp-pestanas">
          {[
            ['actividad', 'Actividad del curso'],
            ['ejercicios', 'Ejercicios'],
          ].map(([clave, texto]) => (
            <button
              key={clave}
              type="button"
              role="tab"
              id={`pestana-${clave}`}
              aria-selected={pestana === clave}
              aria-controls={`panel-${clave}`}
              className="dp-pestana"
              onClick={() => setPestana(clave)}
            >
              {texto}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`pestana-${pestana}`}>
          {pestana === 'actividad' ? (
            <ActividadCurso onNoAutorizado={onNoAutorizado} />
          ) : (
            <EjerciciosDocente onNoAutorizado={onNoAutorizado} />
          )}
        </div>
      </div>
    </div>
  )
}

function ActividadCurso({ onNoAutorizado }) {
  const [resumen, setResumen] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [sugerencias, setSugerencias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [lenguaje, setLenguaje] = useState('todos')

  // Análisis de las preguntas con IA (a pedido).
  const [analisis, setAnalisis] = useState(null)
  const [analizando, setAnalizando] = useState(false)

  // Modal de detalle de una alerta.
  const [alertaAbierta, setAlertaAbierta] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  function cargar() {
    setCargando(true)
    setError(null)
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
        else setError('No se pudo conectar con el servidor.')
      })
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

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

  async function abrirDetalle(alerta) {
    setAlertaAbierta(alerta)
    setCargandoDetalle(true)
    setDetalle(null)
    try {
      const datos = await fetchDocente(`/docente/detalle/${alerta.sesion_id}/${alerta.ejercicio_id}`)
      setDetalle(datos)
    } catch (err) {
      if (err.codigo === 'NO_AUTORIZADO') return onNoAutorizado()
      setDetalle({ error: true })
    } finally {
      setCargandoDetalle(false)
    }
  }

  if (cargando) return <div className="dp-estado">Cargando la actividad del curso…</div>
  if (error) {
    return (
      <div className="ct-aviso-carga dp-aviso-error" role="alert">
        <span>
          {error} El servidor puede tardar hasta un minuto en despertar si estuvo inactivo.
        </span>
        <button type="button" className="ct-btn ct-btn-accion" onClick={cargar}>
          Reintentar
        </button>
      </div>
    )
  }

  const { kpis, ejercicios } = resumen
  const coincide = (lang) => lenguaje === 'todos' || lang === lenguaje
  const alertasVisibles = alertas.filter((a) => coincide(a.lenguaje))
  const mapaVisible = ejercicios.filter((e) => coincide(e.lenguaje))
  const trabajados = kpis.ejercicios_trabajados ?? 0

  const tarjetas = [
    ['Consultas al tutor', kpis.total_consultas, 'registradas en el curso'],
    ['Sesiones de estudiante', kpis.estudiantes_activos, 'con al menos una consulta'],
    [
      'Casos con 3+ intentos',
      kpis.estudiantes_atascados,
      kpis.estudiantes_atascados ? 'revisar en Alertas' : 'sin casos por ahora',
      kpis.estudiantes_atascados > 0,
    ],
    ['Pidió explicación directa', `${kpis.porcentaje_pidio_directa}%`, 'de las consultas'],
    [
      'Ejecutados sin errores',
      `${kpis.porcentaje_sin_errores ?? 0}%`,
      `${kpis.ejercicios_sin_errores ?? 0} de ${trabajados} ejercicios trabajados`,
    ],
    [
      'Tasa de resolución',
      `${kpis.tasa_resolucion ?? 0}%`,
      `${kpis.ejercicios_resueltos ?? 0} de ${trabajados} con la salida esperada`,
    ],
  ]

  return (
    <div className="dp-seccion">
      <div className="dp-cabecera">
        <div className="dp-cabecera-texto">
          <h1 className="dp-titulo">
            Actividad <b>del curso</b>
          </h1>
          <p className="dp-bajada">Cómo están usando el tutor tus estudiantes, por ejercicio.</p>
        </div>
        <div role="group" aria-label="Filtrar alertas y ejercicios por lenguaje" className="dp-filtros">
          {FILTROS_LENGUAJE.map(([clave, texto]) => (
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

      <div className="dp-kpis">
        {tarjetas.map(([etiqueta, valor, detalleTexto, destacado]) => (
          <div key={etiqueta} className={destacado ? 'dp-kpi dp-kpi-destacado' : 'dp-kpi'}>
            <span className="dp-kpi-etiqueta">{etiqueta}</span>
            <span className="dp-kpi-valor">{valor}</span>
            <span className="dp-kpi-detalle">{detalleTexto}</span>
            <span className="dp-kpi-barra" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="dp-dos-columnas">
        <section aria-labelledby="titulo-sugerencias" className="dp-columna dp-columna-ancha">
          <h2 id="titulo-sugerencias" className="dp-subtitulo">Sugerencias para el docente</h2>
          {sugerencias.map((s, i) => {
            const [tipoTexto, inicial] = TIPOS_SUGERENCIA[s.tipo] || TIPOS_SUGERENCIA.info
            return (
              <div key={i} className={`dp-sugerencia dp-sugerencia-${s.tipo}`}>
                <span className="dp-sugerencia-icono" aria-hidden="true">{inicial}</span>
                <span className="dp-sugerencia-cuerpo">
                  <span className="dp-sugerencia-tipo">{tipoTexto}</span>
                  <span className="dp-sugerencia-texto">{s.texto}</span>
                </span>
              </div>
            )
          })}

          <div className="dp-analisis">
            {(!analisis || analisis.error) && (
              <div className="dp-analisis-fila">
                <span className="dp-analisis-intro">
                  <b>Análisis de las preguntas con IA</b>
                  <span>
                    Claude lee las preguntas recientes y resume qué conceptos cuestan más. Se calcula
                    a pedido y queda guardado 10 minutos.
                  </span>
                </span>
                <button
                  type="button"
                  className="ct-btn ct-btn-accion"
                  onClick={pedirAnalisis}
                  disabled={analizando}
                >
                  {analizando ? 'Analizando…' : 'Analizar con IA'}
                </button>
              </div>
            )}
            {analisis?.error && (
              <p className="dp-analisis-error" role="alert">{analisis.error}</p>
            )}
            {analisis && !analisis.error && (
              <div className="dp-analisis-resultado ct-entrada">
                <span className="dp-analisis-meta">
                  Análisis con IA de {analisis.preguntas_analizadas} preguntas recientes. Es una
                  ayuda para interpretar los datos, no un diagnóstico.
                </span>
                <TextoAnalisis texto={analisis.analisis} />
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="titulo-alertas" className="dp-columna">
          <div className="dp-subtitulo-fila">
            <h2 id="titulo-alertas" className="dp-subtitulo">Alertas</h2>
            <span className="dp-contador">{alertasVisibles.length}</span>
          </div>
          <span className="dp-nota">Estudiantes con 3 o más intentos seguidos en un mismo ejercicio.</span>
          {alertasVisibles.length === 0 ? (
            <div className="dp-vacio">
              Sin alertas por ahora: ningún estudiante lleva 3 o más intentos seguidos en el mismo
              ejercicio{lenguaje !== 'todos' ? ` de ${NOMBRE_LENGUAJE[lenguaje]}` : ''}.
            </div>
          ) : (
            alertasVisibles.map((a) => {
              const estado = a.resuelto ? 'resuelto' : a.ejecuto_sin_errores ? 'sin-errores' : 'pendiente'
              const textoEstado = {
                resuelto: 'Resuelto',
                'sin-errores': 'Ejecutó sin errores, aún no resuelto',
                pendiente: 'Aún sin ejecutar sin errores',
              }[estado]
              return (
                <div key={`${a.sesion_id}-${a.ejercicio_id}`} className="dp-alerta">
                  <span className="dp-alerta-texto">
                    Sesión <b className="dp-mono">{a.sesion_id}</b> lleva <b>{a.intentos} intentos</b>{' '}
                    en «{a.titulo}» ({a.lenguaje})
                  </span>
                  <span className="dp-alerta-pie">
                    <span className={`dp-estado-alerta dp-estado-${estado}`}>{textoEstado}</span>
                    <button
                      type="button"
                      className="ct-btn ct-btn-secundario"
                      onClick={() => abrirDetalle(a)}
                    >
                      Revisar
                    </button>
                  </span>
                </div>
              )
            })
          )}
        </section>
      </div>

      <section aria-labelledby="titulo-mapa" className="dp-columna">
        <h2 id="titulo-mapa" className="dp-subtitulo">Ejercicios · mapa de dificultad</h2>
        {mapaVisible.length === 0 ? (
          <div className="dp-vacio">Todavía no hay consultas al tutor en estos ejercicios.</div>
        ) : (
          <div className="dp-tabla-caja">
            <table className="dp-tabla">
              <thead>
                <tr>
                  <th scope="col">Ejercicio</th>
                  <th scope="col">Lenguaje</th>
                  <th scope="col">Consultas</th>
                  <th scope="col">Prom. intentos</th>
                  <th scope="col">Sin errores</th>
                  <th scope="col">Resueltos</th>
                  <th scope="col">Dificultad percibida</th>
                </tr>
              </thead>
              <tbody>
                {mapaVisible.map((ej) => {
                  const nivel = nivelDificultad(ej.promedio_intentos)
                  const ancho = Math.min(100, Math.round((ej.promedio_intentos / 4) * 100))
                  return (
                    <tr key={ej.ejercicio_id}>
                      <td>
                        <div className="dp-celda-titulo">{ej.titulo}</div>
                        <div className="dp-celda-tema">{nombreTema(ej.tema)}</div>
                      </td>
                      <td><span className="dp-lenguaje">{ej.lenguaje}</span></td>
                      <td>{ej.total_consultas}</td>
                      <td>{ej.promedio_intentos}</td>
                      <td>{ej.sesiones_sin_errores ?? 0} de {ej.sesiones_unicas}</td>
                      <td>{ej.sesiones_resueltas ?? 0} de {ej.sesiones_unicas}</td>
                      <td>
                        <span className="dp-dificultad">
                          <span className="dp-dificultad-barra" aria-hidden="true">
                            <span className={`dp-dificultad-relleno dp-dif-${nivel}`} style={{ width: `${ancho}%` }} />
                          </span>
                          <span className={`dp-dificultad-texto dp-dif-texto-${nivel}`}>
                            {ETIQUETA_DIFICULTAD[nivel]}
                          </span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="dp-aviso-demo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16.5" />
          <line x1="12" y1="7.5" x2="12" y2="7.6" />
        </svg>
        Las sesiones cuyo nombre empieza con «demo-» son datos ficticios de demostración, no
        actividad real de estudiantes.
      </div>

      {alertaAbierta && (
        <Modal
          etiqueta={`Detalle de sesión · ${alertaAbierta.sesion_id}`}
          titulo={alertaAbierta.titulo}
          onCerrar={() => setAlertaAbierta(null)}
        >
          {cargandoDetalle && <div className="dp-estado">Cargando historial…</div>}
          {!cargandoDetalle && detalle?.error && (
            <p className="dp-error" role="alert">No se pudo cargar el detalle de esta sesión.</p>
          )}
          {!cargandoDetalle && detalle && !detalle.error && (
            <>
              <p className="dp-modal-intro">Preguntas que hizo al tutor, en orden:</p>
              <ol className="dp-intentos">
                {detalle.intentos.map((intento, i) => (
                  <li key={i} className="dp-intento">
                    <span className="dp-intento-numero" aria-hidden="true">{i + 1}</span>
                    <span className="dp-intento-cuerpo">
                      <span className="dp-intento-pregunta">«{intento.pregunta}»</span>
                      <span className="dp-intento-meta">
                        Intento {i + 1} · {formatearFecha(intento.creado_en)}
                        {intento.pidio_respuesta_directa ? ' · pidió explicación directa' : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
