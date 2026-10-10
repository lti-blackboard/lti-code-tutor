import { useRef, useState } from 'react'
import { consultarTutor, ejecutarCodigo } from './api.js'

export default function Workspace({ ejercicio, onVolver }) {
  const [codigo, setCodigo] = useState(ejercicio.codigo_base)
  const [pregunta, setPregunta] = useState('')
  const [errorConsola, setErrorConsola] = useState('')
  const [mostrarErrorConsola, setMostrarErrorConsola] = useState(false)
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensajeSistema, setMensajeSistema] = useState(null)
  const [avisoPegado, setAvisoPegado] = useState(false)

  // Bloqueo de pegado en el editor: el estudiante debe escribir el código
  // para practicar. Cubre Ctrl+V, "Pegar" del menú y arrastrar texto.
  // No es infalible (se puede saltar con las herramientas del navegador);
  // el objetivo es que copiar no sea el camino fácil.
  // La caja del error de consola NO lleva este bloqueo: está hecha para pegar.
  function bloquearPegado(e) {
    e.preventDefault()
    setAvisoPegado(true)
    setTimeout(() => setAvisoPegado(false), 3000)
  }
  const [ofrecerDecision, setOfrecerDecision] = useState(false)
  const [intentoActual, setIntentoActual] = useState(0)

  // Estado de la consola de ejecución (resultado real del sandbox).
  const [consola, setConsola] = useState(null)
  const [ejecutando, setEjecutando] = useState(false)

  // Resultado de la última ejecución, junto con el código que la produjo.
  // Sirve para que el tutor sepa si el código actual ya funcionó, si sigue
  // con error o si fue modificado después de ejecutarlo.
  const [ultimaEjecucion, setUltimaEjecucion] = useState(null)
  // true si el texto de "error de consola" lo puso el sistema al ejecutar
  // (y no el estudiante a mano): ese error se descarta cuando ya no aplica.
  const [errorAutomatico, setErrorAutomatico] = useState(false)

  // Números de línea del editor: la columna se desplaza junto con el texto.
  const numerosRef = useRef(null)
  const totalLineas = codigo.split('\n').length
  function sincronizarScroll(e) {
    if (numerosRef.current) numerosRef.current.scrollTop = e.target.scrollTop
  }

  const ejecucionVigente = ultimaEjecucion !== null && ultimaEjecucion.codigo === codigo

  async function manejarEjecutar() {
    setEjecutando(true)
    setConsola(null)
    try {
      const resultado = await ejecutarCodigo({ codigo, lenguaje: ejercicio.lenguaje })
      setConsola(resultado)

      // Si el código falló (error de ejecución o de compilación), ofrecemos
      // pasar ese error directo al campo de "error de consola" para el tutor,
      // así el estudiante no tiene que copiarlo y pegarlo a mano.
      const textoError = resultado.error_compilacion || resultado.error || null
      setUltimaEjecucion({ codigo, error: textoError, salida: resultado.salida || '' })
      if (textoError) {
        setErrorConsola(textoError)
        setMostrarErrorConsola(true)
        setErrorAutomatico(true)
      } else if (errorAutomatico) {
        // El código ya corre sin errores: el error anterior dejó de aplicar.
        setErrorConsola('')
        setMostrarErrorConsola(false)
        setErrorAutomatico(false)
      }
    } catch (err) {
      setConsola({ fallo: true, mensaje: err.message })
    } finally {
      setEjecutando(false)
    }
  }

  async function enviarPregunta(quiereRespuestaDirecta = false) {
    if (!quiereRespuestaDirecta && !pregunta.trim()) return

    setCargando(true)
    setMensajeSistema(null)
    setOfrecerDecision(false)

    try {
      const resultado = await consultarTutor({
        codigo,
        pregunta: quiereRespuestaDirecta ? 'El estudiante pidió la explicación directa.' : pregunta,
        lenguaje: ejercicio.lenguaje,
        ejercicioId: ejercicio.id,
        // Un error automático solo se envía si corresponde al código actual.
        errorConsola: errorAutomatico && !ejecucionVigente ? undefined : errorConsola.trim() || undefined,
        estadoEjecucion: !ultimaEjecucion
          ? 'sin_ejecutar'
          : !ejecucionVigente
            ? 'modificado'
            : ultimaEjecucion.error
              ? 'con_error'
              : 'ok',
        salidaConsola: ejecucionVigente && !ultimaEjecucion.error ? ultimaEjecucion.salida : undefined,
        quiereRespuestaDirecta,
      })

      setNotas((anteriores) => [
        ...anteriores,
        {
          tipo: quiereRespuestaDirecta ? 'explicacion' : 'pista',
          texto: resultado.respuesta,
          intento: resultado.intento_numero,
        },
      ])
      setIntentoActual(resultado.intento_numero)
      setOfrecerDecision(resultado.se_ofrecio_respuesta_directa)
      setPregunta('')
    } catch (err) {
      setMensajeSistema(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="workspace-page">
      <div className="topbar">
        <button className="volver-btn" onClick={onVolver}>
          ← Volver al catálogo
        </button>
        <div className="curso-info">codetutor · Sesión activa</div>
      </div>

      <div className="ejercicio-header">
        <div className="eyebrow">
          {ejercicio.tema} · {ejercicio.lenguaje === 'python' ? 'Python' : 'Java'}
        </div>
        <h1 className="ejercicio-titulo">{ejercicio.titulo}</h1>
        <p className="ejercicio-enunciado">{ejercicio.enunciado}</p>
        {intentoActual > 0 && (
          <div className="intento-tracker">
            <span>Intento {intentoActual} de esta sesión</span>
          </div>
        )}
      </div>

      <div className="workspace">
        <div className="editor-panel">
          <div className="editor-topline">
            <span className="lang-pill">{ejercicio.lenguaje === 'python' ? 'Python' : 'Java'}</span>
            <button className="run-btn" onClick={manejarEjecutar} disabled={ejecutando}>
              {ejecutando ? 'Ejecutando…' : 'Ejecutar'}
            </button>
          </div>
          <div className="editor-cuerpo">
            <div className="editor-numeros" ref={numerosRef} aria-hidden="true">
              {Array.from({ length: totalLineas }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              className="editor-textarea"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onScroll={sincronizarScroll}
              onPaste={bloquearPegado}
              onDrop={bloquearPegado}
              spellCheck={false}
              wrap="off"
              aria-label="Editor de código"
            />
          </div>
          {avisoPegado && (
            <div className="aviso-pegado" role="status">
              Pegar código está desactivado en el editor: escríbelo tú para practicar.
            </div>
          )}

          {consola && (
            <div className="consola-panel">
              <div className="consola-titulo">Consola</div>
              {consola.fallo ? (
                <div className="consola-linea consola-error">{consola.mensaje}</div>
              ) : (
                <>
                  {consola.error_compilacion && (
                    <pre className="consola-linea consola-error">{consola.error_compilacion}</pre>
                  )}
                  {consola.error && (
                    <pre className="consola-linea consola-error">{consola.error}</pre>
                  )}
                  {consola.salida && (
                    <pre className="consola-linea consola-ok">{consola.salida}</pre>
                  )}
                  {!consola.salida && !consola.error && !consola.error_compilacion && (
                    <div className="consola-linea consola-vacio">
                      El programa no produjo ninguna salida.
                    </div>
                  )}
                  <div className="consola-estado">
                    {consola.estado}
                    {consola.tiempo_segundos && ` · ${consola.tiempo_segundos}s`}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="margen">
          {notas.length === 0 && (
            <div className="margen-vacio">
              Escribe tu código, ejecútalo, y pregúntale al tutor cuando tengas una duda o un error.
            </div>
          )}

          {notas.map((nota, i) => (
            <div className="nota" key={i}>
              <div className="nota-etiqueta">
                {nota.tipo === 'explicacion' ? 'Explicación' : `Pista · intento ${nota.intento}`}
              </div>
              <div className="nota-texto">{nota.texto}</div>
            </div>
          ))}

          {cargando && <div className="nota-cargando">El tutor está pensando…</div>}

          {mensajeSistema && <div className="mensaje-sistema">{mensajeSistema}</div>}

          {ofrecerDecision && (
            <div className="oferta-decision">
              <p className="oferta-texto">
                Llevas un par de intentos con este ejercicio — ¿seguimos con pistas, o prefieres que
                te explique la solución directamente?
              </p>
              <div className="oferta-botones">
                <button
                  className="btn-oferta secundario"
                  onClick={() => setOfrecerDecision(false)}
                >
                  Sigo intentando
                </button>
                <button
                  className="btn-oferta primario"
                  onClick={() => enviarPregunta(true)}
                >
                  Explícamelo
                </button>
              </div>
            </div>
          )}

          <div className="pregunta-zona">
            {mostrarErrorConsola && errorAutomatico && !ejecucionVigente && (
              <div className="aviso-error-antiguo">
                Este error es de una versión anterior de tu código. Vuelve a ejecutar para ver si sigue.
              </div>
            )}
            {mostrarErrorConsola ? (
              <textarea
                className="error-consola-input"
                placeholder="Pega aquí el error exacto que te muestra la consola (opcional, pero ayuda mucho)…"
                value={errorConsola}
                onChange={(e) => {
                  setErrorConsola(e.target.value)
                  setErrorAutomatico(false)
                }}
              />
            ) : (
              <button
                className="link-mostrar-error"
                onClick={() => setMostrarErrorConsola(true)}
              >
                + Agregar el error de consola
              </button>
            )}

            <div className="pregunta-caja">
              <input
                type="text"
                placeholder="Pregunta algo sobre tu código…"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarPregunta(false)}
                disabled={cargando}
              />
              <button
                className="pregunta-enviar"
                onClick={() => enviarPregunta(false)}
                disabled={cargando || !pregunta.trim()}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
