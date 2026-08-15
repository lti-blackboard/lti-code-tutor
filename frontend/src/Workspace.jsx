import { useState } from 'react'
import { consultarTutor } from './api.js'

export default function Workspace({ ejercicio, onVolver }) {
  const [codigo, setCodigo] = useState(ejercicio.codigo_base)
  const [pregunta, setPregunta] = useState('')
  const [errorConsola, setErrorConsola] = useState('')
  const [mostrarErrorConsola, setMostrarErrorConsola] = useState(false)
  const [notas, setNotas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensajeSistema, setMensajeSistema] = useState(null)
  const [ofrecerDecision, setOfrecerDecision] = useState(false)
  const [intentoActual, setIntentoActual] = useState(0)

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
        errorConsola: errorConsola.trim() || undefined,
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
          </div>
          <textarea
            className="editor-textarea"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="margen">
          {notas.length === 0 && (
            <div className="margen-vacio">
              Escribe tu código y pregúntale al tutor cuando tengas una duda o un error.
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
            {mostrarErrorConsola ? (
              <textarea
                className="error-consola-input"
                placeholder="Pega aquí el error exacto que te muestra la consola (opcional, pero ayuda mucho)…"
                value={errorConsola}
                onChange={(e) => setErrorConsola(e.target.value)}
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
                placeholder="Preguntá algo sobre tu código…"
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
