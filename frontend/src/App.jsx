import { useState } from 'react'
import SelectorEjercicios from './SelectorEjercicios.jsx'
import Workspace from './Workspace.jsx'

export default function App() {
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null)

  if (ejercicioSeleccionado) {
    return (
      <Workspace
        ejercicio={ejercicioSeleccionado}
        onVolver={() => setEjercicioSeleccionado(null)}
      />
    )
  }

  return <SelectorEjercicios onSeleccionar={setEjercicioSeleccionado} />
}
