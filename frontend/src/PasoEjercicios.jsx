import { useEffect, useState } from 'react'
import Barras from './Barras.jsx'
import { FlechaDerecha, FlechaIzquierda } from './Flecha.jsx'
import { obtenerEstados } from './api.js'
import {
  NIVELES, NOMBRE_LENGUAJE, TEMAS, etiquetaNivel, filtrarEjercicios, nombreTema, plural,
} from './catalogo.js'

const ACCION = { sin_empezar: 'Empezar', en_progreso: 'Continuar', resuelto: 'Repasar' }

function IconoResuelto() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconoProgreso() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  )
}

export default function PasoEjercicios({ ejercicios, cargando, lenguaje, filtros, onFiltros, onVolver, onAbrir }) {
  const [estados, setEstados] = useState({})

  // El estado (sin empezar / en progreso / resuelto) se consulta cada vez que
  // se entra a esta pantalla, por ejemplo al volver de un ejercicio.
  useEffect(() => {
    obtenerEstados()
      .then((datos) => setEstados(datos.estados || {}))
      .catch(() => setEstados({}))
  }, [])

  const { nivel, tema } = filtros
  const delLenguaje = filtrarEjercicios(ejercicios, { lenguaje })
  const porNivel = filtrarEjercicios(ejercicios, { lenguaje, nivel })
  const lista = filtrarEjercicios(ejercicios, { lenguaje, nivel, tema })
  const estadoDe = (id) => estados[id] || 'sin_empezar'

  function elegirNivel(clave) {
    const nuevo = nivel === clave ? null : clave
    // Si el tema elegido no tiene ejercicios del nuevo nivel, se quita.
    let nuevoTema = tema
    if (nuevoTema && nuevo && !delLenguaje.some((e) => e.tema === nuevoTema && e.nivel === nuevo)) {
      nuevoTema = null
    }
    onFiltros({ nivel: nuevo, tema: nuevoTema })
  }

  const temasVisibles = TEMAS.filter(([clave]) => porNivel.some((e) => e.tema === clave))
  const resueltos = lista.filter((e) => estadoDe(e.id) === 'resuelto').length
  const hayFiltros = Boolean(nivel || tema)

  const textoTemas = nivel
    ? `Mostrando ${plural(temasVisibles.length, 'tema', 'temas')} con ejercicios de nivel ${etiquetaNivel(nivel).toLowerCase()}.`
    : 'Elige uno para ver solo sus ejercicios.'

  const resumen =
    plural(lista.length, 'ejercicio', 'ejercicios') +
    (nivel ? ` · nivel ${etiquetaNivel(nivel).toLowerCase()}` : '') +
    ` · ${plural(resueltos, 'resuelto', 'resueltos')}`

  return (
    <div className="ct-pagina ct-entrada ct-paso2">
      <div className="ct-paso2-cabecera">
        <div>
          <button type="button" className="ct-btn ct-btn-secundario ct-volver" onClick={onVolver}>
            <FlechaIzquierda />
            Volver
          </button>
        </div>
        <div className="ct-paso-etiqueta">
          <span className="ct-paso-marca" aria-hidden="true" />
          <span>Paso 2 de 2</span>
        </div>
        <div className="ct-paso2-titulo">
          <h1 className="ct-titulo-medio">
            ¿Qué quieres <b>practicar?</b>
          </h1>
          <span className="ct-etiqueta-lenguaje">
            <span className="ct-etiqueta-lenguaje-icono">&lt;/&gt;</span>
            {NOMBRE_LENGUAJE[lenguaje]}
          </span>
        </div>
      </div>

      <section aria-label="Nivel" className="ct-seccion">
        <div className="ct-seccion-titulo">
          <h2>Nivel</h2>
          <span>Elige uno, o déjalo sin marcar para ver todos.</span>
        </div>
        <div className="ct-niveles">
          {NIVELES.map(([clave, etiqueta]) => {
            const activo = nivel === clave
            const xs = delLenguaje.filter((e) => e.nivel === clave)
            const temas = [...new Set(xs.map((e) => e.tema))]
              .map((t) => (TEMAS.find((x) => x[0] === t) || [t, t, t])[2])
              .join(', ')
            return (
              <button
                key={clave}
                type="button"
                className={activo ? 'ct-nivel ct-nivel-activo' : 'ct-nivel'}
                aria-pressed={activo}
                onClick={() => elegirNivel(clave)}
              >
                <span className="ct-nivel-cabecera">
                  <span className="ct-sub">Nivel</span>
                  <Barras nivel={clave} grande />
                </span>
                <span className="ct-nivel-nombre">{etiqueta}</span>
                <span className="ct-sub ct-nivel-temas">{temas || 'Sin ejercicios por ahora'}</span>
                <span className="ct-sub">{plural(xs.length, 'ejercicio', 'ejercicios')}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-label="Tema" className="ct-seccion">
        <div className="ct-seccion-titulo">
          <h2>Tema</h2>
          <span>{textoTemas}</span>
        </div>
        <div role="group" aria-label="Filtrar por tema" className="ct-pildoras">
          {temasVisibles.map(([clave, , corto]) => {
            const activo = tema === clave
            const n = porNivel.filter((e) => e.tema === clave).length
            return (
              <button
                key={clave}
                type="button"
                className={activo ? 'ct-pill ct-pill-activa' : 'ct-pill'}
                aria-pressed={activo}
                onClick={() => onFiltros({ nivel, tema: activo ? null : clave })}
              >
                {corto} <span className="ct-pill-conteo">{n}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-label="Ejercicios" className="ct-seccion">
        <div className="ct-lista-cabecera">
          <div className="ct-lista-titulo">
            <h2>{tema ? nombreTema(tema) : 'Todos los ejercicios'}</h2>
            <span>{resumen}</span>
          </div>
          {hayFiltros && (
            <button type="button" className="ct-limpiar" onClick={() => onFiltros({ nivel: null, tema: null })}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {cargando ? (
          <p className="ct-vacio">Cargando ejercicios… El servidor puede tardar hasta un minuto en despertar.</p>
        ) : lista.length === 0 ? (
          <p className="ct-vacio">No hay ejercicios con estos filtros. Prueba con otro nivel o tema.</p>
        ) : (
          <div className="ct-filas">
            {lista.map((ej) => {
              const estado = estadoDe(ej.id)
              return (
                <button key={ej.id} type="button" className="ct-fila" onClick={() => onAbrir(ej)}>
                  <span className="ct-fila-info">
                    <span className="ct-fila-meta">
                      <Barras nivel={ej.nivel} />
                      <span className="ct-fila-nivel">{etiquetaNivel(ej.nivel)}</span>
                      <span className="ct-fila-tema">{nombreTema(ej.tema)}</span>
                    </span>
                    <span className="ct-fila-titulo">{ej.titulo}</span>
                    <span className="ct-fila-enunciado">{ej.enunciado}</span>
                  </span>
                  <span className="ct-fila-acciones">
                    {estado === 'resuelto' && (
                      <span className="ct-estado ct-estado-resuelto"><IconoResuelto />Resuelto</span>
                    )}
                    {estado === 'en_progreso' && (
                      <span className="ct-estado ct-estado-progreso"><IconoProgreso />En progreso</span>
                    )}
                    <span className={estado === 'resuelto' ? 'ct-fila-boton ct-repasar' : 'ct-fila-boton ct-empezar'}>
                      {ACCION[estado]}
                      <FlechaDerecha ancho={22} alto={14} />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
