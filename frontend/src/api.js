// Todas las llamadas al backend viven aquí, en un solo lugar.
// Si más adelante cambia la URL del backend (por ejemplo, al subirlo
// a un VPS en vez de localhost), solo hay que cambiar esta línea.
const API_BASE = 'http://127.0.0.1:8000'

// El sesion_id identifica al estudiante durante su sesión en el navegador.
// Se genera una sola vez y se guarda en localStorage, para que el backend
// pueda contar correctamente los intentos por ejercicio.
export function obtenerSesionId() {
  let sesionId = localStorage.getItem('sesion_id')
  if (!sesionId) {
    sesionId = crypto.randomUUID()
    localStorage.setItem('sesion_id', sesionId)
  }
  return sesionId
}

async function manejarRespuesta(respuesta) {
  const datos = await respuesta.json()
  if (!respuesta.ok) {
    if (datos.detail) {
      const mensaje =
        typeof datos.detail === 'string'
          ? datos.detail
          : datos.detail.map((d) => d.msg).join(' ')
      throw new Error(mensaje)
    }
    throw new Error('Ocurrió un error inesperado.')
  }
  return datos
}

export async function listarEjercicios() {
  const respuesta = await fetch(`${API_BASE}/ejercicios`)
  if (!respuesta.ok) throw new Error('No se pudo cargar la lista de ejercicios.')
  return respuesta.json()
}

export async function consultarTutor({
  codigo,
  pregunta,
  lenguaje,
  ejercicioId,
  errorConsola,
  quiereRespuestaDirecta,
}) {
  const respuesta = await fetch(`${API_BASE}/ai/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      codigo,
      pregunta,
      lenguaje,
      sesion_id: obtenerSesionId(),
      ejercicio_id: ejercicioId,
      error_consola: errorConsola || null,
      quiere_respuesta_directa: quiereRespuestaDirecta || false,
    }),
  })
  return manejarRespuesta(respuesta)
}

export async function ejecutarCodigo({ codigo, lenguaje, entrada }) {
  const respuesta = await fetch(`${API_BASE}/sandbox/ejecutar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      codigo,
      lenguaje,
      entrada: entrada || '',
    }),
  })
  return manejarRespuesta(respuesta)
}
