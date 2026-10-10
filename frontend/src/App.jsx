import { useState } from 'react'
import Encabezado from './Encabezado.jsx'
import SelectorEjercicios from './SelectorEjercicios.jsx'
import Workspace from './Workspace.jsx'
import PanelDocente from './PanelDocente.jsx'

export default function App() {
  const [vista, setVista] = useState('selector') // 'selector' | 'workspace' | 'docente'
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null)

  const irAlInicio = () => setVista('selector')

  // El botón "Panel docente" solo aparece en la pantalla de inicio.
  // El login docente se mantiene hasta que LTI entregue el rol del usuario.
  const acciones =
    vista === 'selector' ? (
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
    contenido = <Workspace ejercicio={ejercicioSeleccionado} onVolver={irAlInicio} />
  } else if (vista === 'docente') {
    contenido = <PanelDocente onVolver={irAlInicio} />
  } else {
    contenido = (
      <SelectorEjercicios
        onSeleccionar={(ej) => {
          setEjercicioSeleccionado(ej)
          setVista('workspace')
        }}
      />
    )
  }

  return (
    <div className="ct-app">
      <Encabezado onInicio={irAlInicio} acciones={acciones} />
      <main className="ct-contenido">{contenido}</main>
    </div>
  )
}
