import { useEffect, useState } from 'react'
import { listarEjercicios } from './api.js'

const NOMBRES_TEMA = {
  variables: 'Variables y tipos de datos',
  condicionales: 'Condicionales',
  ciclos: 'Ciclos',
  funciones: 'Funciones',
  listas: 'Listas / arreglos',
  recursividad: 'Recursividad',
  poo: 'Programación orientada a objetos',
}

export default function SelectorEjercicios({ onSeleccionar }) {
  const [ejercicios, setEjercicios] = useState([])
  const [lenguaje, setLenguaje] = useState('python')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listarEjercicios()
      .then((data) => setEjercicios(data.ejercicios))
      .catch(() => setError('No se pudo conectar con el backend. ¿Está corriendo el servidor?'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return <div className="estado-carga">Cargando catálogo de ejercicios…</div>
  }

  if (error) {
    return (
      <div className="estado-error">
        <p>{error}</p>
        <p className="estado-error-detalle">
          Verifica que el backend esté corriendo en <code>http://127.0.0.1:8000</code>
        </p>
      </div>
    )
  }

  const ejerciciosFiltrados = ejercicios.filter((e) => e.lenguaje === lenguaje)
  const temas = [...new Set(ejerciciosFiltrados.map((e) => e.tema))]

  return (
    <div className="selector">
      <div className="selector-header">
        <div className="brand">
          code<span>tutor</span>
        </div>
        <div className="lang-toggle">
          <button
            className={lenguaje === 'python' ? 'lang-btn activo' : 'lang-btn'}
            onClick={() => setLenguaje('python')}
          >
            Python
          </button>
          <button
            className={lenguaje === 'java' ? 'lang-btn activo' : 'lang-btn'}
            onClick={() => setLenguaje('java')}
          >
            Java
          </button>
        </div>
      </div>

      <h1 className="selector-titulo">Elige un ejercicio para practicar</h1>

      {temas.map((tema) => (
        <div key={tema} className="tema-grupo">
          <div className="tema-nombre">{NOMBRES_TEMA[tema] || tema}</div>
          <div className="tema-lista">
            {ejerciciosFiltrados
              .filter((e) => e.tema === tema)
              .map((ej) => (
                <button key={ej.id} className="ejercicio-card" onClick={() => onSeleccionar(ej)}>
                  <span className="ejercicio-card-titulo">{ej.titulo}</span>
                  <span className={`nivel-tag nivel-${ej.nivel}`}>{ej.nivel}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
