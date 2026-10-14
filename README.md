# lti-code-tutor

Sistema LTI-Blackboard con tutor de Inteligencia Artificial para la enseñanza de programación en Python y Java.

Proyecto de Título (ACI5947) — Ingeniería de Ejecución en Informática, Universidad de las Américas (UDLA).

## Descripción

Herramienta educativa pensada para integrarse a Blackboard mediante el estándar LTI 1.3. Permite a los estudiantes de la asignatura de Programación escribir y ejecutar código en Python y Java, con un tutor de IA que guía con pistas progresivas en vez de entregar la solución, y un panel con indicadores para el docente.

## Estado del proyecto

Prototipo funcional desplegado en línea (Avance 1).

- Aplicación web: https://lti-code-tutor-frontend.vercel.app
- Documentación de la API: https://lti-code-tutor-backend.onrender.com/docs (plan gratuito: la primera consulta puede tardar hasta un minuto)

**Funcionando:**

- Catálogo base inicial de 14 ejercicios por lenguaje (Python y Java) en 7 temas. Cada ejercicio trae un código base con un error intencional o incompleto y una salida esperada.
- Estado de cada ejercicio para el estudiante (sin empezar, en progreso o resuelto): queda resuelto cuando la salida del programa coincide con la salida esperada.
- Editor con ejecución real de código mediante Judge0, con bloqueo de pegado.
- Tutor de IA con lógica pedagógica: solo pistas en la primera consulta; desde la segunda, el estudiante puede pedir una explicación directa, que explica el error sin entregar el código corregido completo.
- Protecciones del tutor: instrucciones blindadas contra manipulación, validación de entradas, límite de 15 consultas cada 10 minutos por sesión y recorte de errores largos (máximo 20 líneas).
- Panel docente, pestaña "Actividad del curso": consultas al tutor registradas, sesiones de estudiante, tasa de resolución, porcentaje que pidió explicación directa, mapa de dificultad por ejercicio, alertas por casos con 3 o más intentos en un mismo ejercicio e historial por sesión.
- Base de datos permanente en PostgreSQL (Neon).
- Panel docente, pestaña "Ejercicios": el docente puede editar cualquier ejercicio (un ejercicio base editado queda como "Modificado" y se puede restaurar a su versión original), ocultarlo o mostrarlo a los estudiantes, y crear ejercicios propios en Python o Java, con tema, nivel y salida esperada. Solo los ejercicios creados por el docente se pueden eliminar; los del catálogo base se ocultan.
- Acceso al panel docente: en la versión publicada para la evaluación del proyecto, el panel está abierto, sin usuario ni contraseña. El inicio de sesión está implementado y se activa en el servidor (ver "Ejecución local"). Con la integración LTI, el acceso del docente vendrá del rol que entrega Blackboard.
- Sugerencias para el docente por reglas y análisis de las preguntas con IA.

**Pendiente:**

- Integración LTI 1.3 real con Blackboard (los endpoints `/lti` son por ahora un esqueleto), incluida la devolución de notas.
- Traductor Python↔Java.
- Pruebas automatizadas y piloto con estudiantes.

## Stack tecnológico

- **Backend:** Python con FastAPI.
- **Frontend:** React con Vite, desplegado en Vercel.
- **Base de datos:** PostgreSQL en Neon cuando existe la variable `DATABASE_URL` (producción); SQLite local cuando no existe (desarrollo).
- **Ejecución de código:** instancia pública de Judge0 CE (Python 3.8, OpenJDK 13).
- **IA:** API de Claude (Anthropic), modelo configurable (por defecto `claude-sonnet-4-6`).
- **Integración LTI:** LTI 1.3 (OIDC / JWT), planificada con la librería `pylti1p3`.

## Estructura del repositorio

```
/backend    → API y lógica de negocio (FastAPI)
/frontend   → Interfaz del editor y del panel docente (React)
/infra      → Configuración de despliegue (pendiente)
```

## Ejecución local

**Backend** (en la carpeta `backend`):

```
pip install -r requirements.txt
uvicorn main:app --reload
```

Crear un archivo `.env` (nunca subirlo a GitHub) con al menos:

```
ANTHROPIC_API_KEY=tu_clave
```

Panel docente: por defecto queda abierto, sin usuario ni contraseña. Para exigir inicio de sesión, definir `PANEL_DOCENTE_ABIERTO=false` junto con `DOCENTE_USUARIO` y `DOCENTE_CLAVE` (las credenciales van solo en el servidor, nunca en el código). Si se exige inicio de sesión y faltan las credenciales, el panel queda cerrado.

Variables opcionales: `DATABASE_URL` (PostgreSQL; sin ella se usa SQLite local), `MODELO_IA`, `RATE_LIMIT_MAX_CONSULTAS`, `RATE_LIMIT_VENTANA_MINUTOS`, `MAX_CARACTERES_CODIGO`, `MAX_CARACTERES_PREGUNTA`, `DOCENTE_SECRETO` (firma de las sesiones del docente; sin ella se genera una al iniciar el servidor), `LTI_CLIENT_ID`, `LTI_ISSUER`.

La documentación interactiva de la API queda en `http://127.0.0.1:8000/docs`.

**Frontend** (en la carpeta `frontend`):

```
npm install
npm run dev
```

Por defecto se conecta a `http://127.0.0.1:8000`. En producción, la variable `VITE_API_BASE` indica la URL del backend.

**Datos de demostración para el panel docente:**

- En PostgreSQL (Neon): ejecutar `backend/datos_demo_panel.sql` en el SQL Editor. Se puede repetir: primero borra los datos demo anteriores.
- En SQLite local: `python generar_datos_demo.py`.

Las sesiones que empiezan con `demo-` son ficticias y deben declararse como tales en cualquier presentación.

## Equipo

- Roberto Santos Ortiz Valenzuela
- Luis Eduardo Briones Gajardo
- Guillermo Enrique Villalón Pinto
