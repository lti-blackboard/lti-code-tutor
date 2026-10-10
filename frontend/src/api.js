// Todas las llamadas al backend viven aquí, en un solo lugar.
//
// La URL del backend se lee de una variable de entorno (VITE_API_BASE),
// para poder apuntar a distintos backends sin tocar el código:
// - En desarrollo local, no hace falta configurar nada: usa localhost por defecto.
// - En producción (Vercel), se configura VITE_API_BASE con la URL real del
//   backend desplegado en Render.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

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

// Estado de cada ejercicio para esta sesión: "en_progreso" o "resuelto"
// (los que no aparecen están sin empezar).
export async function obtenerEstados() {
  const params = new URLSearchParams({ sesion_id: obtenerSesionId() })
  const respuesta = await fetch(`${API_BASE}/ejercicios/estado?${params}`)
  if (!respuesta.ok) throw new Error('No se pudo cargar el estado de los ejercicios.')
  return respuesta.json()
}

export async function consultarTutor({
  codigo,
  pregunta,
  lenguaje,
  ejercicioId,
  errorConsola,
  estadoEjecucion,
  salidaConsola,
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
      estado_ejecucion: estadoEjecucion || null,
      salida_consola: salidaConsola ?? null,
      quiere_respuesta_directa: quiereRespuestaDirecta || false,
    }),
  })
  return manejarRespuesta(respuesta)
}

// Consultas al tutor usadas en la ventana de tiempo (para el contador).
export async function obtenerConsultas() {
  const params = new URLSearchParams({ sesion_id: obtenerSesionId() })
  const respuesta = await fetch(`${API_BASE}/ai/consultas?${params}`)
  if (!respuesta.ok) throw new Error('No se pudo cargar el contador de consultas.')
  return respuesta.json()
}

export async function ejecutarCodigo({ codigo, lenguaje, entrada, ejercicioId }) {
  const respuesta = await fetch(`${API_BASE}/sandbox/ejecutar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      codigo,
      lenguaje,
      entrada: entrada || '',
      // Para que el panel docente sepa quién logró ejecutar sin errores.
      sesion_id: obtenerSesionId(),
      ejercicio_id: ejercicioId || null,
    }),
  })
  return manejarRespuesta(respuesta)
}


// ---------- Acceso docente ----------
// El token se guarda en sessionStorage: se borra al cerrar el navegador.
const CLAVE_TOKEN = 'token_docente'

export function obtenerTokenDocente() {
  return sessionStorage.getItem(CLAVE_TOKEN)
}

export function guardarTokenDocente(token) {
  if (token) sessionStorage.setItem(CLAVE_TOKEN, token)
  else sessionStorage.removeItem(CLAVE_TOKEN)
}

export async function loginDocente(usuario, clave) {
  const respuesta = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, clave }),
  })
  const datos = await manejarRespuesta(respuesta)
  guardarTokenDocente(datos.token)
  return datos.token
}

// Llamada a una ruta protegida del panel. Si la sesión venció, borra el
// token y lanza un error con codigo = 'NO_AUTORIZADO'.
export async function fetchDocente(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    headers: {
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opciones.headers || {}),
      Authorization: `Bearer ${obtenerTokenDocente() || ''}`,
    },
  })
  if (respuesta.status === 401) {
    guardarTokenDocente(null)
    const error = new Error('Tu sesión venció. Vuelve a ingresar.')
    error.codigo = 'NO_AUTORIZADO'
    throw error
  }
  return manejarRespuesta(respuesta)
}
