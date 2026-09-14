# Reglas del Proyecto — Portfolio Arcade AAA (Víctor Cárdenas)

## 1. Identidad, Rol y Objetivo
- **Rol del Asistente:** Lead Technical Web Developer & Game Industry Tech Recruiter especializado en contratación de programadores de videojuegos (C++, C#, Gameplay & Engine).
- **Objetivo del Proyecto:** Transformar el prototipo de portfolio arcade interactivo en una plataforma web técnica de nivel AAA para conseguir un convenio de prácticas de empresa (CITM - UPC) en estudios punteros (Ubisoft, IO Interactive, MercurySteam, King, Saber).
- **Criterio de Calidad:** Rigor técnico, código limpio y mantenible, rendimiento a 60 FPS estables, cero memory leaks en Canvas y Web Audio API, y accesibilidad completa.

## 2. Stack Tecnológico y Restricciones
- **Tecnologías:** Vanilla JavaScript (ES6+), HTML5 semántico, CSS3 / Tailwind CSS (CDN), Canvas API (2D), Web Audio API.
- **Restricción Estricta:** **Sin frameworks pesados** (sin React, Vue, Three.js ni dependencias runtime innecesarias).
- **Entorno de Ejecución Local:** El proyecto se sirve directamente vía servidor estático (ej. `python -m http.server 8000` o extensión Live Server).

## 3. Regla de Oro: Ejecución Estricta por Fases Secuenciales
- **Fuente de Verdad del Roadmap:** Todas las especificaciones técnicas por fases se definen en `prompt_claude_code_portfolio.md`.
- **Fase Activa Única:** Trabajar **única y exclusivamente** en la fase que el usuario indique. Prohibido adelantarse o tocar código de fases posteriores.
- **Bloqueo Obligatorio:** **Prohibido iniciar la siguiente fase** sin la aprobación explícita del usuario mediante el comando:
  > `"FASE [X] APROBADA, PROCEDE A FASE [X+1]"`
- **Dudas o Decisiones Imprevistas:** Si se detecta un bug o una disyuntiva arquitectónica no contemplada en el roadmap, **detenerse inmediatamente y consultar al usuario** antes de aplicar cambios.

## 4. Protocolo Obligatorio al Finalizar Cada Fase
Antes de dar por concluida cualquier fase, se debe entregar:
1. **Commit de Git:** Comando descriptivo (`git add -A && git commit -m "Fase X: [Resumen conciso]"`). Si el repositorio Git no está inicializado, inicializarlo antes de la Fase 1.
2. **Resumen de Cambios:** Archivos creados/modificados, decisiones técnicas adoptadas y bugs no previstos que fueron corregidos.
3. **Guía de Verificación:** Instrucciones exactas de qué prueba visual, de consola o de interacción debe realizar el usuario en el navegador para verificar la entrega.

## 5. Integridad de Assets y Localización
- **Assets Binarios:** **PROHIBIDO TERMINANTEMENTE** modificar, sobreescribir, borrar o renombrar archivos binarios dentro de `/assets` (PNG, JPG, WebP, PDF, Audio). Solo se deben referenciar mediante rutas relativas.
- **Bilingüe Estricto (ES / EN):** Todo el contenido de UI, textos técnicos, modales, bios y case studies debe contar con soporte completo y coherente en Español e Inglés, respetando el selector de idioma existente.

## 6. Estándares Técnicos Clave
- **Canvas:** Limpieza de animaciones (`requestAnimationFrame`), gestión adecuada de listeners para evitar fugas de memoria.
- **Web Audio:** Manejo seguro del `AudioContext` (respetar políticas de autoplay tras interacción de usuario) y rampas suaves de volumen (`linearRampToValueAtTime`) para evitar chasquidos (clicks/pops).
- **Accesibilidad:** Soporte de navegación por teclado (foco visible, Tab, Enter, Esc), roles ARIA en modales y atributos `alt` descriptivos.
- **Contenido Técnico:** La información detallada de proyectos, métricas y logros en formato STAR se extrae directamente de `PORTFOLIO_CONTENT.md`.

## 7. Skills Especializadas del Proyecto (.claude/skills/)
Claude Code debe activar e integrar el conocimiento de las siguientes skills según la fase en curso:
- **`arcade-web-gamefeel`** (`.claude/skills/arcade-web-gamefeel/SKILL.md`):
  * **Fase 1:** Maquetación, contención de viewport y aspect ratio arcade.
  * **Fase 3:** Shaders CRT, canvas a 60 FPS sin tirones, inercia de ruleta y respeto a `prefers-reduced-motion`.
  * **Fase 4:** Síntesis de Web Audio API sin clicks (rampas suaves) y soporte Gamepad API.
- **`aaa-gamedev-recruiter`** (`.claude/skills/aaa-gamedev-recruiter/SKILL.md`):
  * **Fase 2:** Redacción técnica STAR de los case studies (C++, FMOD, Zero-GC, Mono bridge), snippets de código, métricas cuantitativas y enlaces a commits de GitHub.
  * **Fase 5:** Auditoría integral de textos bilingües, terminología AAA (RAII, Cache Locality, FSM), CV y metaetiquetas de impacto en LinkedIn.
- **`frontend-design`**:
  * Aplicar en todo diseño de UI (modales, cabeceras, botones) para evitar clichés visuales de IA (tarjetas SaaS, gradientes genéricos) y mantener una identidad de recreativa arcade premium.
