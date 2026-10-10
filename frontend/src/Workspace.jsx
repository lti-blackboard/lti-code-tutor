import { useEffect, useState } from 'react'
import { consultarTutor, ejecutarCodigo, obtenerConsultas } from './api.js'
import Barras from './Barras.jsx'
import { FlechaDerecha, FlechaIzquierda } from './Flecha.jsx'
import Editor from './ejercicio/Editor.jsx'
import Tutor, { IconoAmpolleta } from './ejercicio/Tutor.jsx'
import { explicarResultado } from './ejercicio/mensajesError.js'
import {
  NIVELES, NOMBRE_LENGUAJE, TEMAS, etiquetaNivel, filtrarEjercicios, nombreCortoTema, nombreTema,
} from './catalogo.js'

const NOMBRE_ARCHIVO = { python: 'main.py', java: 'Main.java' }
const VERSION = { python: 'Python 3', java: 'Java' }
const ESTADO_EJECUCION = {
  Accepted: 'Ejecutado sin errores',
  'Compilation Error': 'Error de compilación',
  'Time Limit Exceeded': 'Tiempo excedido',
}

// El borrador del código se guarda en este navegador, para que "Continuar"
// retome el ejercicio donde quedó.
const claveBorrador = (id) => `borrador:${id}`
function leerBorrador(ejercicio) {
  try {
    return localStorage.getItem(claveBorrador(ejercicio.id)) ?? ejercicio.codigo_base
  } catch {
    return ejercicio.codigo_base
  }
}

/** Siguiente grupo sugerido cuando se llega al último ejercicio de la lista. */
function calcularSugerencia(ejercicios, lenguaje, { nivel, tema }) {
  const hay = (f) => filtrarEjercicios(ejercicios, { lenguaje, ...f }).length > 0
  if (tema) {
    const i = TEMAS.findIndex((t) => t[0] === tema)
    const siguiente = TEMAS.slice(i + 1).find(([clave]) => hay({ nivel, tema: clave }))
    if (siguiente) {
      return {
        filtros: { nivel, tema: siguiente[0] },
        texto: <>¿Seguimos con <b>{siguiente[2]}</b>{nivel ? ` en nivel ${etiquetaNivel(nivel)}` : ''}?</>,
      }
    }
  }
  if (nivel) {
    const i = NIVELES.findIndex((n) => n[0] === nivel)
    const siguiente = NIVELES.slice(i + 1).find(([clave]) => hay({ nivel: clave }))
    if (siguiente) {
      return { filtros: { nivel: siguiente[0], tema: null }, texto: <>¿Seguimos con el nivel <b>{siguiente[1]}</b>?</> }
    }
  }
  const otro = lenguaje === 'python' ? 'java' : 'python'
  if (filtrarEjercicios(ejercicios, { lenguaje: otro }).length) {
    return {
      lenguaje: otro,
      filtros: { nivel: null, tema: null },
      texto: <>¿Practicamos en <b>{NOMBRE_LENGUAJE[otro]}</b>?</>,
    }
  }
  return null
}

export default function Workspace({ ejercicio, ejercicios, filtros, onVolver, onIr, onSugerencia }) {
  const lenguaje = ejercicio.lenguaje
  const [codigo, setCodigo] = useState(() => leerBorrador(ejercicio))
  const [avisoPegado, setAvisoPegado] = useState(false)

  // Consola: resultado real del sandbox y el código que lo produjo.
  const [resultado, setResultado] = useState(null)
  const [codigoEjecutado, setCodigoEjecutado] = useState(null)
  const [ejecutando, setEjecutando] = useState(false)
  const [errorEjecucion, setErrorEjecucion] = useState(null)

  // Tutor
  const [mensajes, setMensajes] = useState([])
  const [cargandoTutor, setCargandoTutor] = useState(false)
  const [errorTutor, setErrorTutor] = useState(null)
  const [ofrecerDecision, setOfrecerDecision] = useState(false)
  // Límite de consultas al tutor (compartido por todos los ejercicios, en una
  // ventana móvil). Solo se muestra cuando quedan pocas o se llegó al límite.
  const [consultas, setConsultas] = useState(null)
  const [disponibleEn, setDisponibleEn] = useState(null) // ms (Date.now) en que se libera un cupo
  const [ahora, setAhora] = useState(Date.now())

  function actualizarConsultas() {
    obtenerConsultas()
      .then((c) => {
        setConsultas(c)
        setDisponibleEn(c.segundos_para_nueva_consulta > 0 ? Date.now() + c.segundos_para_nueva_consulta * 1000 : null)
        setAhora(Date.now())
      })
      .catch(() => {})
  }

  useEffect(actualizarConsultas, [])

  // Mientras está bloqueado, se actualiza el tiempo restante y, al cumplirse,
  // se vuelve a consultar el contador.
  useEffect(() => {
    if (!disponibleEn) return undefined
    const id = setInterval(() => {
      const t = Date.now()
      setAhora(t)
      if (t >= disponibleEn) actualizarConsultas()
    }, 15000)
    return () => clearInterval(id)
  }, [disponibleEn])

  useEffect(() => {
    try {
      localStorage.setItem(claveBorrador(ejercicio.id), codigo)
    } catch {
      /* sin almacenamiento disponible: no se guarda el borrador */
    }
  }, [codigo, ejercicio.id])

  // Bloqueo de pegado en el editor: el estudiante debe escribir el código
  // para practicar. No es infalible; el objetivo es que copiar no sea el
  // camino fácil.
  function bloquearPegado(e) {
    e.preventDefault()
    setAvisoPegado(true)
    setTimeout(() => setAvisoPegado(false), 3000)
  }

  const ejecucionVigente = resultado !== null && codigoEjecutado === codigo
  const textoError = resultado ? resultado.error_compilacion || resultado.error || '' : ''
  const explicacion = resultado ? explicarResultado(resultado, lenguaje) : null
  const lineaError = ejecucionVigente && explicacion?.tipo === 'error' ? explicacion.linea : null

  async function ejecutar() {
    setEjecutando(true)
    setErrorEjecucion(null)
    const codigoActual = codigo
    try {
      const r = await ejecutarCodigo({ codigo: codigoActual, lenguaje, ejercicioId: ejercicio.id })
      setResultado(r)
      setCodigoEjecutado(codigoActual)
    } catch (err) {
      setErrorEjecucion(err.message)
    } finally {
      setEjecutando(false)
    }
  }

  function reiniciar() {
    if (codigo !== ejercicio.codigo_base &&
      !window.confirm('¿Volver al código original del ejercicio? Se perderán tus cambios.')) return
    setCodigo(ejercicio.codigo_base)
    setResultado(null)
    setCodigoEjecutado(null)
  }

  async function preguntar(texto, quiereRespuestaDirecta = false) {
    setCargandoTutor(true)
    setErrorTutor(null)
    setOfrecerDecision(false)
    setMensajes((m) => [...m, { rol: 'estudiante', texto: quiereRespuestaDirecta ? 'Explícamelo' : texto }])
    try {
      const r = await consultarTutor({
        codigo,
        pregunta: quiereRespuestaDirecta ? 'El estudiante pidió la explicación directa.' : texto,
        lenguaje,
        ejercicioId: ejercicio.id,
        // El error se adjunta solo si corresponde al código actual.
        errorConsola: ejecucionVigente && textoError ? textoError : undefined,
        estadoEjecucion: !resultado ? 'sin_ejecutar' : !ejecucionVigente ? 'modificado' : textoError ? 'con_error' : 'ok',
        salidaConsola: ejecucionVigente && !textoError ? resultado.salida || '' : undefined,
        quiereRespuestaDirecta,
      })
      setMensajes((m) => [...m, { rol: quiereRespuestaDirecta ? 'explicacion' : 'pista', texto: r.respuesta }])
      setOfrecerDecision(r.se_ofrecio_respuesta_directa)
      if (r.consultas_maximas) {
        setConsultas(r)
        if (r.consultas_usadas >= r.consultas_maximas) actualizarConsultas()
      }
    } catch (err) {
      setErrorTutor(err.message)
      actualizarConsultas()
    } finally {
      setCargandoTutor(false)
    }
  }

  const restantes = consultas ? Math.max(0, consultas.consultas_maximas - consultas.consultas_usadas) : null
  const bloqueado = restantes === 0
  let avisoConsultas = null
  if (bloqueado) {
    const minutos = disponibleEn ? Math.max(1, Math.ceil((disponibleEn - ahora) / 60000)) : null
    avisoConsultas = minutos
      ? `Llegaste al límite de consultas. Podrás volver a preguntar en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`
      : 'Llegaste al límite de consultas. Podrás volver a preguntar en unos minutos.'
  } else if (restantes !== null && restantes <= 5) {
    avisoConsultas = restantes === 1
      ? 'Te queda 1 consulta en los próximos minutos para cualquier ejercicio.'
      : `Te quedan ${restantes} consultas en los próximos minutos para cualquier ejercicio.`
  }

  let adjunto = 'Se enviará tu código'
  if (ejecucionVigente && textoError) {
    adjunto = lineaError ? `Se enviará tu código y el error de la línea ${lineaError}` : 'Se enviará tu código y el error de la consola'
  } else if (ejecucionVigente) {
    adjunto = 'Se enviará tu código y su salida'
  } else if (resultado) {
    adjunto = 'Se enviará tu código (cambió desde la última ejecución)'
  }

  // Navegación según los filtros del Paso 2.
  const lista = filtrarEjercicios(ejercicios, { lenguaje, ...filtros })
  const indice = lista.findIndex((e) => e.id === ejercicio.id)
  const anterior = indice > 0 ? lista[indice - 1] : null
  const siguiente = indice >= 0 && indice < lista.length - 1 ? lista[indice + 1] : null
  const grupo = [filtros.tema && nombreCortoTema(filtros.tema), filtros.nivel && etiquetaNivel(filtros.nivel)]
    .filter(Boolean).join(' · ') || 'Todos los ejercicios'
  const esUltimo = indice >= 0 && !siguiente
  const sugerencia = esUltimo ? calcularSugerencia(ejercicios, lenguaje, filtros) : null

  return (
    <div className="ct-ejercicio-pagina">
      <div className="ct-ejercicio-cabecera">
        <div className="ct-ejercicio-info">
          <div className="ct-ejercicio-migas">
            <button type="button" className="ct-btn ct-btn-secundario ct-volver" onClick={onVolver}>
              <FlechaIzquierda />
              Volver a ejercicios
            </button>
            <span className="ct-migas-texto">
              {NOMBRE_LENGUAJE[lenguaje]} <span aria-hidden="true">›</span> {nombreTema(ejercicio.tema)}
            </span>
            <span className="ct-migas-nivel">
              <Barras nivel={ejercicio.nivel} />
              <span>{etiquetaNivel(ejercicio.nivel)}</span>
            </span>
          </div>
          <h1 className="ct-ejercicio-titulo">{ejercicio.titulo}</h1>
          <p className="ct-ejercicio-enunciado">{ejercicio.enunciado}</p>
        </div>

        {indice >= 0 && (
          <nav aria-label="Navegación entre ejercicios" className="ct-navegacion">
            <span className="ct-nav-posicion">Ejercicio {indice + 1} de {lista.length} · {grupo}</span>
            <div className="ct-nav-botones">
              {anterior && (
                <button type="button" className="ct-btn ct-btn-secundario" title={`Anterior: ${anterior.titulo}`}
                  onClick={() => onIr(anterior)}>
                  <FlechaIzquierda ancho={18} alto={12} />
                  Anterior
                </button>
              )}
              {siguiente ? (
                <button type="button" className="ct-btn ct-btn-negro" title={`Siguiente: ${siguiente.titulo}`}
                  onClick={() => onIr(siguiente)}>
                  Siguiente
                  <FlechaDerecha ancho={18} alto={12} />
                </button>
              ) : (
                <button type="button" className="ct-btn ct-btn-negro" title="Volver a la lista con tus filtros"
                  onClick={onVolver}>
                  Elegir más ejercicios
                  <FlechaDerecha ancho={18} alto={12} />
                </button>
              )}
            </div>
            {esUltimo && <span className="ct-nav-nota">Es el último de {grupo === 'Todos los ejercicios' ? 'la lista' : grupo}</span>}
            {sugerencia && (
              <button type="button" className="ct-sugerencia" onClick={() => onSugerencia(sugerencia)}>
                <IconoAmpolleta tam={16} />
                <span>{sugerencia.texto}</span>
              </button>
            )}
          </nav>
        )}
      </div>

      <div className="ct-ejercicio-cuerpo">
        <section aria-label="Editor y consola" className="ct-editor-panel">
          <div className="ct-editor-barra">
            <div className="ct-editor-archivo">
              <span className="ct-archivo">{NOMBRE_ARCHIVO[lenguaje]}</span>
              <span className="ct-version">{VERSION[lenguaje]}</span>
            </div>
            <div className="ct-editor-acciones">
              <button type="button" className="ct-btn-oscuro" onClick={reiniciar}>Reiniciar código</button>
              <button type="button" className="ct-btn ct-btn-accion" onClick={ejecutar} disabled={ejecutando}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
                {ejecutando ? 'Ejecutando…' : 'Ejecutar'}
              </button>
            </div>
          </div>

          <Editor
            codigo={codigo}
            onCambio={setCodigo}
            lenguaje={lenguaje}
            lineaError={lineaError}
            onPegadoBloqueado={bloquearPegado}
          />
          {avisoPegado && (
            <div className="ct-aviso-pegado" role="status">
              Pegar código está desactivado en el editor: escríbelo tú para practicar.
            </div>
          )}

          <div className="ct-consola" aria-live="polite">
            <div className="ct-consola-cabecera">
              <span className="ct-consola-titulo">Consola</span>
              {resultado && (
                <span className="ct-consola-estado">
                  {ESTADO_EJECUCION[resultado.estado] ||
                    (/^Runtime Error/.test(resultado.estado || '') ? 'Error de ejecución' : resultado.estado)}
                  {resultado.tiempo_segundos && ` · ${resultado.tiempo_segundos} s`}
                  {!ejecucionVigente && ' · el código cambió desde esta ejecución'}
                </span>
              )}
            </div>
            {ejecutando && <p className="ct-consola-vacia">Ejecutando tu código…</p>}
            {!ejecutando && errorEjecucion && (
              <div className="ct-consola-mensaje ct-consola-mensaje-error" role="alert">{errorEjecucion}</div>
            )}
            {!ejecutando && !errorEjecucion && !resultado && (
              <p className="ct-consola-vacia">Ejecuta tu código para ver aquí el resultado.</p>
            )}
            {!ejecutando && !errorEjecucion && resultado && (
              <>
                <div className={`ct-consola-mensaje ct-consola-mensaje-${['error', 'tiempo'].includes(explicacion.tipo) ? 'error' : explicacion.tipo === 'resuelto' ? 'resuelto' : 'info'}`}>
                  <span><b>{explicacion.titulo}</b> {explicacion.texto}</span>
                </div>
                {textoError && <pre className="ct-consola-salida ct-consola-salida-error">{textoError}</pre>}
                {resultado.salida && <pre className="ct-consola-salida">{resultado.salida}</pre>}
              </>
            )}
          </div>
        </section>

        <Tutor
          mensajes={mensajes}
          cargando={cargandoTutor}
          errorSistema={errorTutor}
          ofrecerDecision={ofrecerDecision}
          avisoConsultas={avisoConsultas}
          bloqueado={bloqueado}
          adjunto={adjunto}
          onPreguntar={(texto) => preguntar(texto)}
          onSeguir={() => setOfrecerDecision(false)}
          onExplicar={() => preguntar('', true)}
        />
      </div>
    </div>
  )
}
