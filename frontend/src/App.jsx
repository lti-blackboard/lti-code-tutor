import { useState } from 'react'
import SelectorEjercicios from './SelectorEjercicios.jsx'
import Workspace from './Workspace.jsx'
import PanelDocente from './PanelDocente.jsx'

export default function App() {
  const [vista, setVista] = useState('selector') // 'selector' | 'workspace' | 'docente'
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null)

  if (vista === 'workspace' && ejercicioSeleccionado) {
    return (
      <Workspace
        ejercicio={ejercicioSeleccionado}
        onVolver={() => setVista('selector')}
      />
    )
  }

  if (vista === 'docente') {
    return <PanelDocente onVolver={() => setVista('selector')} />
  }

  return (
    <SelectorEjercicios
      onSeleccionar={(ej) => {
        setEjercicioSeleccionado(ej)
        setVista('workspace')
      }}
      onIrAPanelDocente={() => setVista('docente')}
    />
  )
}
