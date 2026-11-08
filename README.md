# Renault — Experiencia interactiva (Trivia + Puzzle)

Actualización de la rama `Puzzle_Renault` del proyecto React + Vite de Moción.

## Qué cambió

- **Pantalla inicial**: dos botones grandes, **TRIVIA** y **PUZZLE**.
- **Puzzle**: conserva el flujo original (cuadrícula 3×5, piezas jigsaw, contador de movimientos y pantalla de finalización). Ahora ofrece los **cuatro modelos** del correo del cliente: RENAULT ARKANA HYBRID E-TECH, RENAULT KOLEOS FULL HYBRID E-TECH, RENAULT DUSTER HYBRID E-TECH 4X4 y RENAULT FILANTE FULL HYBRID E-TECH, con las fotos oficiales de Box recortadas a 16:9 en `public/images/puzzle/`.
- **Trivia**: nueva ruta interna, introducción, cinco preguntas con cuatro respuestas, navegación atrás, progreso, seis resultados personalizados y opción de reiniciar o regresar al menú.
- **Diseño**: tipografías NouvelR Regular/Bold incluidas en el proyecto; paleta oficial Renault `#EFDF00`, `#000000` y `#FFFFFF`, basada en *Renault Digital Standard Guide* (edición 2024, vigente en 2025).

## Requisitos

- Node.js 18 o superior.
- npm.

## Ejecutar en Windows / PC del evento

Abre una terminal en la carpeta que contiene `package.json` y ejecuta:

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Abre la dirección que muestre Vite. Para un paquete optimizado:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Para la lógica de las preguntas, incluso sin instalar paquetes:

```bash
npm run test:trivia
```

**Nota de pruebas:** dentro del entorno en que se preparó el ZIP fue posible ejecutar los tests de lógica y validar sintaxis, pero no descargar todas las dependencias de npm para lanzar el servidor Vite. Ejecuta `npm install` en el equipo final.

## Imágenes de los seis vehículos

Los `.jpg` de `public/images/trivia/` **son las fotos oficiales descargadas de los enlaces Box del cliente** (JPG y TIFF originales de 3000 a 12000 px, convertidos a JPG sRGB de máximo 1600 px). En la trivia se muestran **completas, sin recortes** (`object-fit: contain`), tanto en la galería de la introducción como en el resultado.

Las versiones recortadas a 16:9 para el rompecabezas están en `public/images/puzzle/` (1920×1080). Los archivos `esc1/esc2/esc3.png` ya no se usan y pueden eliminarse.

Correspondencia de archivos, nombre comercial exacto y fuente:

| Nombre de archivo | Nombre comercial EXACTO del cliente | Box |
|---|---|---|
| `kardian.jpg` | RENAULT KARDIAN | https://lion.box.com/s/1qbeo5odlao0qjwtd7pfsvwfy504uuop |
| `arkana.jpg` | RENAULT ARKANA HYBRID E-TECH | https://lion.box.com/s/cabyz7zm8g6whxuu3k7n3h3hszn4ed6a |
| `filante.jpg` | RENAULT FILANTE FULL HYBRID E-TECH | https://lion.box.com/s/qm0067uend3ofu77adu81hsg76wa4yq4 |
| `kwid.jpg` | NUEVO RENAULT KWID | https://lion.box.com/s/kep0gbc46eaw5iq2qpmhb4mno8ra4enr |
| `koleos.jpg` | RENAULT KOLEOS FULL HYBRID E-TECH | https://lion.box.com/s/h5nnq3q3a4giwxkqlm2y8top2fkngdpl |
| `duster.jpg` | RENAULT DUSTER HYBRID E-TECH 4X4 | https://lion.box.com/s/s8z48hs92zf3d9fdr8t4ayctj835fug2 |

Si el cliente entrega nuevas fotos, reemplazar el archivo conservando el nombre; cualquier proporción funciona en la trivia porque no se recorta. Para el puzzle, recortar a 16:9 centrado en el vehículo.

**Los enlaces Box del correo son páginas de compartición, NO URLs directas para `<img>`.** Por eso las imágenes se sirven como recursos locales (funcionan sin internet). Los enlaces también están en la pantalla final para abrir la fuente original cuando haya conexión.

## Reglas de la trivia

Fuente: `Propuesta de trivia Renault (2).pdf` (páginas 2–7).

- Cada una de las 5 preguntas ofrece 4 opciones.
- Cada respuesta asigna **un punto a un vehículo**, según la matriz exacta de la página 3.
- Resultado: modelo con mayor puntaje.
- Desempate 1: si el modelo elegido en la **pregunta 4** está entre los empatados, gana ese modelo.
- Desempate 2: si persiste, se evalúa la **pregunta 5**.
- Último desempate técnico (no especificado en el PDF): primer vehículo empatado elegido a lo largo del cuestionario, para garantizar determinismo.

No hay un formulario de captura de datos personales ni persistencia de las respuestas; el flujo es completamente local.

## Envío de datos a Evius (Datahub)

Cada **puzzle completado** y cada **trivia terminada** se envían a Evius para saber cuántas personas usaron cada experiencia.

- **Puzzle:** al completar un puzzle (Modo A o B) se registra una participación en `EVIUS_EXPERIENCE_ID` con `score` (100 por defecto, `EVIUS_SCORE_PER_COMPLETION`), modelo elegido, modo, movimientos, duración y hora. Antes se registra el asistente.
- **Trivia:** al llegar al resultado se registra UNA participación en `EVIUS_TRIVIA_EXPERIENCE_ID` (una sola experiencia para toda la trivia) con `score` 100 y el carro recomendado como dato: `result` (nombre comercial exacto), `resultId`, las cinco respuestas (`q1`…`q5` y `answers`), los puntos por carro y la duración. Para saber cuántas personas salieron con cada carro se filtra por `result`; no hacen falta seis experiencias.
- **Persona anónima:** el puzzle no pide datos, así que cada sesión (desde que se toca PUZZLE hasta volver al inicio) se identifica con un correo sintético `anon-<sessionId>@puzzle-renault.local` y nombre "Participante anónimo". Evius deduplica asistentes por correo: `/attendees` cuenta personas y `/experiences` cuenta partidas. **Quien administra Evius debe aprobar este esquema antes de producción.**
- **Cómo:** el navegador nunca habla con Evius ni conoce el token. `src/evius/tracker.js` guarda cada partida en una cola en `localStorage` y la envía en segundo plano a `netlify/functions/evius.mjs`, que valida, limpia y llama a `POST /attendees` y `POST /experiences` con `Idempotency-Key`. Si falla, reintenta con espera creciente (1, 2, 4, 8, 16, 30 min); un 401 (token vencido) deja de insistir y avisa en consola.
- **Variables (solo servidor, Netlify > Environment variables):** ver `.env.example`. Solo se envía cuando `EVIUS_MODE=live`. En Netlify marcar como secreta únicamente `EVIUS_TOKEN`.
- **Pruebas:** `npm run evius:off` (valida sin enviar), `npm run evius:ping` (confirma token/URL/evento sin escribir), `npm run evius:live` (envía UN registro marcado "PRUEBA borrar"). Abrir la app con `?prueba` en la URL marca las partidas como PRUEBA.
- **Desarrollo local:** `npm run functions` (levanta la función en el puerto 9999 con el `.env`) y `npm run dev` (Vite hace proxy de `/.netlify/functions`).

## Archivos principales

- `src/App.jsx`: menú y rutas internas, sin agregar React Router.
- `src/ui/Splash.jsx` y `src/ui/experience.css`: menú con TRIVIA / PUZZLE.
- `src/trivia/Trivia.jsx`: interfaces de introducción, pregunta y resultado.
- `src/trivia/triviaData.js`: cinco preguntas, seis modelos, fuentes Box y algoritmo.
- `src/trivia/trivia.css`: diseño visual y adaptación a tablets.
- `tests/trivia.test.mjs`: prueba las 1024 combinaciones posibles, puntajes, seis resultados, desempates, recursos de foto.
- `src/evius/tracker.js` y `netlify/functions/evius.mjs`: cola local y función servidor que envía a Evius (ver sección Evius).

## Recomendaciones para el evento

1. Las seis fotos ya son las originales de Box; verificar con el cliente que sean las versiones definitivas.
2. Probar en la tablet con su resolución real tanto horizontal como vertical.
3. Probar que el botón PUZZLE mantiene ambos modos e imágenes previas.
4. Precargar la página antes de abrir el evento; las fotografías y fuentes son locales.
5. Revisar textos comerciales de versiones y tecnologías híbridas con el cliente antes de producción. El PDF advierte que algunas especificaciones y versiones pueden variar.

## Identidad de marca consultada

- Renault Digital Standard Guide (nov. 2024 / efectivo ene. 2025): https://brandstores.renault.com/sites/default/files/documents/files/renault_m_2024_en.pdf
- Nouvel'R media catalogue: https://brandstores.renault.com/sites/default/files/documents/files/nouvelr_catalogue_v2b_en.pdf
