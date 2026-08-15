# lti-code-tutor

Sistema LTI-Blackboard con tutor de Inteligencia Artificial para la enseñanza de programación en Python y Java.

## Descripción

Herramienta educativa integrada a Blackboard mediante el estándar LTI 1.3, que permite a estudiantes escribir, ejecutar y depurar código en Python y Java directamente dentro de sus cursos, con un asistente de IA que actúa como tutor pedagógico (pistas guiadas, no soluciones directas), un panel de analítica para docentes, y una arquitectura preparada para operar en múltiples LMS.

Proyecto de titulación — Ingeniería en Informática.

## Equipo

- Roberto Santos Ortiz Valenzuela
- Luis Eduardo Briones Gajardo
- Guillermo Enrique Villalón Pinto

## Estructura del repositorio

```
/backend    → API y lógica de negocio (Python, FastAPI)
/frontend   → Interfaz web del editor y panel docente (React)
/infra      → Configuración de servidor, Docker, despliegue
```

## Estado del proyecto

🚧 En desarrollo — Etapa 1: Análisis y diseño

## Stack tecnológico

- Backend: Python (FastAPI)
- Frontend: React
- Base de datos: PostgreSQL
- Ejecución de código: Docker (sandbox aislado)
- Integración LTI: LTI 1.3 (OAuth2 / JWT), librería `pylti1p3`
- IA: API de Claude (Anthropic)
