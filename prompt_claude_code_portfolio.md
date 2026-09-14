# ROADMAP TÉCNICO — Portfolio Arcade AAA (Víctor Cárdenas)

> **Directivas Globales:** Reglas de rol, stack, git y restricciones en `CLAUDE.md`.
> **Skills del Proyecto:** Definidas en `.claude/skills/` (`arcade-web-gamefeel` y `aaa-gamedev-recruiter`).
> **Regla de Ejecución:** Trabajar **única y exclusivamente** en la fase activa solicitada. Prohibido avanzar sin el comando de aprobación del usuario.

---

## 📋 COMANDOS RÁPIDOS PARA LA CONSOLA DE CLAUDE CODE
Para ahorrar tokens y evitar duplicar contexto, utiliza únicamente estos comandos cortos en la terminal:

- **Iniciar Fase 0:** `Inicia la FASE 0 según prompt_claude_code_portfolio.md. Solo lectura, no modifiques ningún archivo.`
- **Aprobar y pasar a Fase 1:** `FASE 0 APROBADA, PROCEDE A FASE 1. Opción arquitectónica elegida: [ES Modules nativos / Vite].`
- **Aprobar y pasar a Fase 2:** `FASE 1 APROBADA, PROCEDE A FASE 2.`
- **Aprobar y pasar a Fase 3:** `FASE 2 APROBADA, PROCEDE A FASE 3.`
- **Aprobar y pasar a Fase 4:** `FASE 3 APROBADA, PROCEDE A FASE 4.`
- **Aprobar y pasar a Fase 5:** `FASE 4 APROBADA, PROCEDE A FASE 5.`

---

## 🎯 ESPECIFICACIÓN TÉCNICA POR FASES

### FASE 0: AUDITORÍA TÉCNICA (SOLO LECTURA — NO MODIFICAR CÓDIGO)
Auditar `index.html`, `app.js`, `styles.css` y `PORTFOLIO_CONTENT.md`. Entregar un informe estructurado que cubra:
1. **Bugs conocidos a confirmar y cuantificar:**
   - Bloque residual de HTML pegado al final de `styles.css` (a partir de `.intro-entering-screen` hasta `</html>`).
   - Estado de la pantalla de intro/attract mode: clases `.arcade-intro-overlay` presentes en CSS pero ausentes en `index.html`. Determinar si se rescata o descarta.
   - Referencia rota `onclick="showAttractScreen()"` en el botón "MENÚ PRINCIPAL" y cualquier otra función no implementada en JS.
2. **Inconsistencias del proyecto:** IDs duplicados, event listeners redundantes o assets faltantes en `/assets`.
3. **Diagnóstico Responsive/Viewport:** Evaluación del layout fijo `100vw/100vh` con `overflow: hidden` en pantallas <1024px y dispositivos móviles.
4. **Diagnóstico de Accesibilidad:** Navegación por teclado (foco visible, Tab/Enter/Esc), roles ARIA y contraste.
5. **Propuesta de Arquitectura Modular (Fase 1):** Presentar pros y contras de:
   - *Opción A:* ES Modules nativos (`<script type="module">`) sin dependencias ni build step.
   - *Opción B:* Bundler ultra-ligero (Vite).
   *Esperar la elección del usuario antes de aplicar cambios.*

---

### FASE 1: ARQUITECTURA MODULAR, ESTADO Y LIMPIEZA *(Skill: arcade-web-gamefeel & code-review)*
1. **Inicialización Git:** Inicializar el repositorio Git si no existe (`git init`).
2. **Modularización:** Dividir `app.js` según la arquitectura aprobada en Fase 0:
   - `arcadeSystems.js`: Base de datos y catálogo de proyectos/sistemas.
   - `canvasRenderer.js`: Lógica y bucle de renderizado del Canvas 2D.
   - `audioManager.js`: Síntesis y control de Web Audio API.
   - `app.js`: Inicializador, state machine principal y router de eventos.
3. **Limpieza de Bugs:**
   - Eliminar el bloque de HTML residual dentro de `styles.css`.
   - Resolver la función huérfana `showAttractScreen()` y la decisión tomada sobre el attract mode.
4. **Estabilidad de Viewport:**
   - Bloquear el aspect-ratio del chasis arcade para evitar scrolls no deseados en monitores estándar.
   - Añadir breakpoint responsive para tablet/móvil (adaptación fluida o pantalla retro de fallback optimizada para desktop).

---

### FASE 2: SISTEMA DE INSPECCIÓN PROFESIONAL *(Skills: aaa-gamedev-recruiter & frontend-design)*
1. **Modal de Diagnóstico Arcade:**
   - Al pulsar `ENTER`, `ESPACIO` o clic en `[INSPECCIONAR]`, desplegar un overlay técnico interactivo estilo *Service Menu / Arcade Diagnostic*.
2. **Accesibilidad Estricta:**
   - `role="dialog"`, `aria-modal="true"`, foco atrapado (focus trap) mientras está abierto, cierre con `ESC` o botón de retorno y devolución del foco al elemento disparador.
3. **Integración STAR desde `PORTFOLIO_CONTENT.md`:**
   - **Case Study 1:** *The Fable of the Eclipse* & *LoopieEngine* (C++, commit `e3b2d96` integración FMOD, puente Mono C#, FSM de `HealthHUD`).
   - **Case Study 2:** *Ave Phoenix Regen* (Unity Zero-GC `ObjectPool<T>`, Boss FSM, arquitectura de oleadas).
   - **Case Study 3:** Prototipos de Combate (Hitboxes, IA basada en estados).
4. **Elementos de Alto Impacto Técnico:**
   - Bloques con resaltado de sintaxis para snippets de C++ y C#.
   - Insignias de stack y métricas de rendimiento (60 FPS, 0B Heap allocation en bucle, latencia de audio).
   - Enlaces directos a los commits y repositorios oficiales de GitHub.

---

### FASE 3: SHADERS CRT, ASSETS Y GAME FEEL *(Skill: arcade-web-gamefeel)*
1. **Canvas Dinámico:**
   - Reemplazar gráficos provisionales por un sistema híbrido capaz de mostrar capturas reales de gameplay, sprites o demos dinámicas de cada juego.
2. **Post-procesado CRT:**
   - Pulir efectos CSS de scanlines, phosphor glow y viñeta sin degradar la legibilidad de los textos técnicos.
   - Respetar rigurosamente la directiva `prefers-reduced-motion`.
3. **Feedback Háptico Visual:**
   - Ruleta de selección de sistemas con inercia elástica al cambiar entre proyectos.

---

### FASE 4: WEB AUDIO API Y SOPORTE GAMEPAD *(Skill: arcade-web-gamefeel)*
1. **Audio Limpio:**
   - Sintetizador Web Audio optimizado con curvas de ganancia exponenciales/lineales (`linearRampToValueAtTime`) para erradicar clicks y pops.
   - Mute seguro y persistencia del estado de sonido en `localStorage`.
2. **Gamepad API:**
   - Soporte nativo para mandos (D-Pad / Stick para navegar la ruleta, Botón A para inspeccionar, Botón B para cerrar modal).

---

### FASE 5: AUDITORÍA DE RECLUTADOR AAA, SEO Y CIERRE *(Skill: aaa-gamedev-recruiter)*
1. **Revisión de Copy y Terminología AAA:**
   - Textos pulidos en Español e Inglés enfocados a reclutadores técnicos de estudios de videojuegos (RAII, Cache Locality, State Machines, Zero-Allocation).
2. **Assets y Metadata:**
   - Enlace verificado y funcional al CV en PDF (`assets/Victor_Cardenas_CV.pdf`).
   - Metaetiquetas OpenGraph y Twitter Cards para previews en LinkedIn y redes.
3. **Verificación Final:**
   - Pase completo de accesibilidad (contraste de color, navegación 100% por teclado, atributos alt).
