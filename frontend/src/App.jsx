import { useCallback, useEffect, useState } from 'react'
import Encabezado from './Encabezado.jsx'
import Pie from './Pie.jsx'
import PasoLenguaje from './PasoLenguaje.jsx'
import PasoEjercicios from './PasoEjercicios.jsx'
import Workspace from './Workspace.jsx'
import PanelDocente from './PanelDocente.jsx'
import { listarEjercicios } from './api.js'

const FILTROS_VACIOS = { nivel: null, tema: null }

export default function App() {
  // 'lenguaje' (Paso 1) | 'ejercicios' (Paso 2) | 'workspace' | 'docente'
  const [vista, setVista] = useState('lenguaje')
  const [lenguaje, setLenguaje] = useState(null)
  // Los filtros del Paso 2 se guardan aquí para conservarlos al volver de un
  // ejercicio (y para la navegación Anterior/Siguiente).
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null)

  const [ejercicios, setEjercicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  const cargarCatalogo = useCallback(() => {
    setCargando(true)
    setErrorCarga(null)
    listarEjercicios()
      .then((datos) => setEjercicios(datos.ejercicios))
      .catch(() => setErrorCarga('No se pudo cargar el catálogo de ejercicios.'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(cargarCatalogo, [cargarCatalogo])

  const irAlInicio = () => {
    setVista('lenguaje')
    setFiltros(FILTROS_VACIOS)
    // Al volver al inicio se recarga el catálogo por si el docente lo cambió.
    cargarCatalogo()
  }

  // El botón "Panel docente" solo aparece en la pantalla de inicio.
  // El login docente se mantiene hasta que LTI entregue el rol del usuario.
  const acciones =
    vista === 'lenguaje' ? (
      <button type="button" className="ct-btn ct-btn-secundario" onClick={() => setVista('docente')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
        Panel docente
      </button>
    ) : null

  let contenido
  if (vista === 'workspace' && ejercicioSeleccionado) {
    contenido = (
      <Workspace
        key={ejercicioSeleccionado.id}
        ejercicio={ejercicioSeleccionado}
        ejercicios={ejercicios}
        filtros={filtros}
        onVolver={() => setVista('ejercicios')}
        onIr={(ej) => {
          setEjercicioSeleccionado(ej)
          window.scrollTo(0, 0)
        }}
        onSugerencia={(s) => {
          if (s.lenguaje) setLenguaje(s.lenguaje)
          setFiltros(s.filtros)
          setVista('ejercicios')
          window.scrollTo(0, 0)
        }}
      />
    )
  } else if (vista === 'docente') {
    contenido = <PanelDocente onVolver={irAlInicio} />
  } else if (vista === 'ejercicios' && lenguaje) {
    contenido = (
      <PasoEjercicios
        ejercicios={ejercicios}
        cargando={cargando}
        lenguaje={lenguaje}
        filtros={filtros}
        onFiltros={setFiltros}
        onVolver={() => {
          setFiltros(FILTROS_VACIOS)
          setVista('lenguaje')
        }}
        onAbrir={(ej) => {
          setEjercicioSeleccionado(ej)
          setVista('workspace')
          window.scrollTo(0, 0)
        }}
      />
    )
  } else {
    contenido = (
      <>
        {errorCarga && (
          <div className="ct-aviso-carga" role="alert">
            <span>
              {errorCarga} El servidor puede tardar hasta un minuto en despertar si estuvo inactivo.
            </span>
            <button type="button" className="ct-btn ct-btn-accion" onClick={cargarCatalogo}>
              Reintentar
            </button>
          </div>
        )}
        <PasoLenguaje
          ejercicios={ejercicios}
          cargando={cargando}
          onElegir={(lang) => {
            setLenguaje(lang)
            setFiltros(FILTROS_VACIOS)
            setVista('ejercicios')
          }}
        />
      </>
    )
  }

  return (
    <div className="ct-app">
      <Encabezado onInicio={irAlInicio} acciones={acciones} />
      <main className="ct-contenido">{contenido}</main>
      <Pie />
    </div>
  )
}
