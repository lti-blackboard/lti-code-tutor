import { useEffect, useRef, useState } from 'react'
import TextoTutor from './TextoTutor.jsx'

function IconoAmpolleta({ color = 'currentColor', tam = 20 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" /><path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </svg>
  )
}

/*
 * Panel del tutor en formato conversación.
 * mensajes: [{ rol: 'estudiante' | 'pista' | 'explicacion', texto }]
 */
export default function Tutor({
  mensajes, cargando, errorSistema, ofrecerDecision, avisoConsultas, bloqueado, adjunto,
  onPreguntar, onSeguir, onExplicar,
}) {
  const [pregunta, setPregunta] = useState('')
  const finRef = useRef(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [mensajes.length, cargando, ofrecerDecision])

  function enviar() {
    const texto = pregunta.trim()
    if (!texto || cargando || bloqueado) return
    onPreguntar(texto)
    setPregunta('')
  }

  let numeroPista = 0

  return (
    <aside aria-label="Tutor" className="ct-tutor">
      <div className="ct-tutor-cabecera">
        <div className="ct-tutor-identidad">
          <div className="ct-tutor-avatar"><IconoAmpolleta color="#FF9A52" /></div>
          <div className="ct-tutor-nombres">
            <span className="ct-tutor-nombre">Tutor</span>
            <span className="ct-tutor-bajada">Te orienta sin darte la solución</span>
          </div>
        </div>
      </div>

      <div className="ct-tutor-mensajes" aria-live="polite">
        {mensajes.length === 0 && !cargando && (
          <p className="ct-tutor-vacio">
            Ejecuta tu código y pregúntame cuando tengas una duda o un error. Te daré pistas para
            que llegues tú a la solución.
          </p>
        )}
        {mensajes.map((m, i) => {
          if (m.rol === 'estudiante') {
            return <div key={i} className="ct-msj-estudiante">{m.texto}</div>
          }
          if (m.rol === 'pista') numeroPista += 1
          return (
            <div key={i} className="ct-msj-tutor">
              <span className="ct-msj-etiqueta">
                {m.rol === 'explicacion' ? 'Explicación' : `Pista ${numeroPista}`}
              </span>
              <div className={m.rol === 'explicacion' ? 'ct-msj-burbuja ct-msj-explicacion' : 'ct-msj-burbuja'}>
                <TextoTutor texto={m.texto} />
              </div>
            </div>
          )
        })}
        {cargando && <div className="ct-tutor-pensando">El tutor está pensando…</div>}
        {errorSistema && <div className="ct-tutor-aviso" role="alert">{errorSistema}</div>}
        {ofrecerDecision && !cargando && (
          <div className="ct-oferta">
            <span>Llevas un par de intentos. ¿Seguimos con pistas o prefieres que te explique el concepto?</span>
            <div className="ct-oferta-botones">
              <button type="button" className="ct-oferta-sec" onClick={onSeguir}>Sigo intentando</button>
              <button type="button" className="ct-oferta-acc" onClick={onExplicar} disabled={bloqueado}>Explícamelo</button>
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="ct-tutor-pie">
        {avisoConsultas && (
          <div className={bloqueado ? 'ct-aviso-consultas ct-aviso-consultas-limite' : 'ct-aviso-consultas'} role="status">
            {avisoConsultas}
          </div>
        )}
        <span className="ct-adjunto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B84506" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.5 12.6 21a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />
          </svg>
          {adjunto}
        </span>
        <div className="ct-tutor-entrada">
          <label htmlFor="ct-pregunta" className="ct-solo-lector">Pregunta para el tutor</label>
          <input
            id="ct-pregunta"
            type="text"
            placeholder="Pregunta algo sobre tu código…"
            value={pregunta}
            maxLength={500}
            onChange={(e) => setPregunta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            disabled={cargando || bloqueado}
          />
          <button type="button" aria-label="Enviar pregunta" onClick={enviar} disabled={cargando || bloqueado || !pregunta.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

export { IconoAmpolleta }
