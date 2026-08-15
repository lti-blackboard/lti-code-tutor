# Cómo integrar el frontend

## 1. Copia los archivos

Copia TODO el contenido de esta carpeta dentro de la carpeta `frontend`
de tu repositorio (`C:\Proyecto Titulo\lti-code-tutor\frontend`),
reemplazando el `PENDIENTE.md` que había ahí antes.

## 2. Instala las dependencias

Necesitas tener Node.js instalado (si no lo tienes, descárgalo de
nodejs.org — el instalador estándar, con las opciones por defecto).

En la terminal, dentro de la carpeta `frontend`:

```
npm install
```

## 3. Asegúrate de que el backend esté corriendo

El frontend se conecta a `http://127.0.0.1:8000`, así que en OTRA
terminal aparte, con el backend, debe estar corriendo:

```
uvicorn main:app --reload
```

## 4. Levanta el frontend

En la terminal de la carpeta `frontend`:

```
npm run dev
```

Te va a mostrar una URL, normalmente `http://localhost:5173`.
Ábrela en el navegador.

## 5. Qué deberías ver

- Una pantalla con el catálogo de ejercicios, agrupados por tema,
  con un selector Python/Java arriba a la derecha.
- Al hacer click en un ejercicio, se abre el editor con el código
  base ya cargado, y el panel de notas del tutor a la derecha.
- Al escribir una pregunta y enviarla, se consulta al backend real
  (y por lo tanto, a la API de Claude — esto sí consume créditos,
  a diferencia de solo navegar por el catálogo).

## Notas

- El botón "+ Agregar el error de consola" permite pegar el error real
  que Python/Java tira, para que el tutor diagnostique con precisión
  (tal como probamos antes en `/docs`).
- Después de 2 intentos sobre el mismo ejercicio, aparece la caja
  ámbar preguntando si quieres la explicación directa o seguir
  intentando — es la misma lógica que ya está en el backend.
- El "sesion_id" se genera automáticamente y se guarda en el navegador
  (localStorage) — no necesitas hacer nada para eso.
