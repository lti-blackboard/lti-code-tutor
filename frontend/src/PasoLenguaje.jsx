import { FlechaDerecha } from './Flecha.jsx'
import { plural } from './catalogo.js'

// Código de muestra que se "escribe" al pasar el mouse por la tarjeta.
// n = caracteres de la línea, d = duración, t = retraso (segundos).
const K = ({ children }) => <span className="ct-cod-clave">{children}</span>
const S = ({ children }) => <span className="ct-cod-texto">{children}</span>

const MUESTRAS = {
  python: {
    extension: '.py',
    lineas: [
      { n: 20, d: 0.7, t: 0, c: <><K>def</K> saludar(nombre):</> },
      { n: 28, d: 0.98, t: 0.82, c: <>{'    '}<K>return</K> <S>"Hola, "</S> + nombre</> },
      { n: 22, d: 0.77, t: 1.92, c: <>print(saludar(<S>"UDLA"</S>))</> },
    ],
    salida: 2.81,
  },
  java: {
    extension: '.java',
    lineas: [
      { n: 26, d: 0.91, t: 0, c: <><K>String</K> saludar(String n) {'{'}</> },
      { n: 24, d: 0.84, t: 1.03, c: <>{'    '}<K>return</K> <S>"Hola, "</S> + n;</> },
      { n: 1, d: 0.25, t: 1.99, c: <>{'}'}</> },
      { n: 36, d: 1.26, t: 2.36, c: <>System.out.println(saludar(<S>"UDLA"</S>));</> },
    ],
    salida: 3.74,
  },
}

function TarjetaLenguaje({ lenguaje, nombre, conteo, onElegir }) {
  const m = MUESTRAS[lenguaje]
  return (
    <button type="button" className="ct-lang-card" onClick={onElegir}>
      <span className="ct-lang-cabecera">
        <span className="ct-lang-nombres">
          <span className="ct-sub ct-lang-practicar">Practicar en</span>
          <span className="ct-lang-nombre">{nombre}</span>
        </span>
        <span className="ct-badge">{m.extension}</span>
      </span>
      <span className="ct-lang-codigo">
        {m.lineas.map((l, i) => (
          <span className="ct-lang-linea" key={i}>
            <span className="ct-lang-num">{i + 1}</span>
            <span className="ct-tipo" style={{ '--n': l.n, '--d': `${l.d}s`, '--t': `${l.t}s` }}>
              {l.c}
            </span>
            {i === m.lineas.length - 1 && <span className="ct-cursor" aria-hidden="true" />}
          </span>
        ))}
        <span className="ct-salida" style={{ '--t': `${m.salida}s` }}>&gt; Hola, UDLA</span>
      </span>
      <span className="ct-sub ct-lang-conteo">{conteo}</span>
      <span className="ct-lang-pie">
        <span className="ct-bar" />
        <span className="ct-lang-elegir">
          <span>Elegir {nombre}</span>
          <FlechaDerecha />
        </span>
      </span>
    </button>
  )
}

const PASOS = [
  ['Escribe y ejecuta', 'Corrige el código del ejercicio y ejecútalo para ver qué pasa.'],
  ['Pide una pista', 'El tutor de IA lee tu código y tu error, y te orienta sin darte la solución.'],
  ['Entiende el porqué', 'Si sigues trabado, pide una explicación del concepto y vuelve a intentarlo.'],
]

export default function PasoLenguaje({ ejercicios, cargando, onElegir }) {
  const conteo = (lenguaje) => {
    if (cargando) return 'Cargando ejercicios…'
    const xs = ejercicios.filter((e) => e.lenguaje === lenguaje)
    const temas = new Set(xs.map((e) => e.tema)).size
    return `${plural(xs.length, 'ejercicio', 'ejercicios')} · ${plural(temas, 'tema', 'temas')}`
  }

  return (
    <div className="ct-pagina ct-entrada ct-paso1">
      <div className="ct-intro">
        <div className="ct-paso-etiqueta">
          <span className="ct-paso-marca" aria-hidden="true" />
          <span>Paso 1 de 2</span>
        </div>
        <h1 className="ct-titulo-grande">
          ¿Con qué lenguaje quieres <b>practicar hoy?</b>
        </h1>
        <p className="ct-bajada">
          Elige el lenguaje y después el nivel y el tema que necesites.
        </p>
      </div>

      <div className="ct-lang-grid">
        <TarjetaLenguaje lenguaje="python" nombre="Python" conteo={conteo('python')}
          onElegir={() => onElegir('python')} />
        <TarjetaLenguaje lenguaje="java" nombre="Java" conteo={conteo('java')}
          onElegir={() => onElegir('java')} />
      </div>

      <section aria-label="Cómo funciona" className="ct-como-funciona">
        {PASOS.map(([titulo, texto], i) => (
          <div className="ct-como-paso" key={titulo}>
            <div className="ct-como-numero">{i + 1}</div>
            <div className="ct-como-texto">
              <span className="ct-como-titulo">{titulo}</span>
              <span>{texto}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
