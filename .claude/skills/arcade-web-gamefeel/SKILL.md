---
name: arcade-web-gamefeel
description: Technical guidelines and patterns for building high-performance 60FPS retro arcade web experiences, including Canvas 2D render loops, CRT CSS shaders, Web Audio API synthesis without clicks/pops, responsive aspect ratio locking, and Gamepad API integration.
---

# Arcade Web & Game Feel Engineering

Esta skill guía la implementación técnica del front-end arcade para lograr una estética retro auténtica con rendimiento web moderno (60 FPS estables, cero tirones, cero memory leaks y excelente retroalimentación sensorial).

---

## 1. Canvas 2D: Bucle de Renderizado y Rendimiento (60 FPS)

- **Cero Asignaciones en el Bucle:** Prohibido instanciar objetos (`new Object()`, `new Array()`, closures innecesarios) dentro de la función de render o `requestAnimationFrame`. Todo estado debe pre-alojarse o reutilizarse.
- **Gestión Estricta del Contexto:**
  - Siempre emparejar `ctx.save()` y `ctx.restore()` para evitar acumulación de transformaciones o estados de mezcla.
  - Limpiar el buffer eficientemente con `ctx.clearRect(0, 0, width, height)`.
- **Interpolación y Normalización de Tiempo:**
  - Calcular `deltaTime` entre frames (`const dt = Math.min((currentTime - lastTime) / 1000, 0.1)`) para que las animaciones sean independientes de la tasa de refresco del monitor (60Hz, 120Hz, 144Hz).
- **Ciclo de Vida Limpio:**
  - Cancelar `cancelAnimationFrame(animationId)` cuando el componente o canvas no esté visible o se pause el modal, evitando consumo innecesario de GPU/CPU.

---

## 2. Web Audio API: Síntesis Retro Limpia (Cero Clicks o Pops)

- **Lifecycle del AudioContext:**
  - Inicializar o reanudar el `AudioContext` (`ctx.state === 'suspended' ? ctx.resume() : null`) únicamente tras una interacción directa del usuario (clic, tecla, insert coin).
- **Erradicación de "Pops" y "Clicks" de Audio:**
  - **NUNCA** cortar la amplitud bruscamente a 0 con `gainNode.gain.value = 0`.
  - Utilizar siempre rampas suaves de ganancia programadas en el tiempo:
    ```javascript
    // Apagado suave antes de detener el oscilador
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
    oscillator.stop(audioCtx.currentTime + 0.05);
    ```
  - En ataques rápidos, aplicar un micro-fade in de 2 a 5 milisegundos (`linearRampToValueAtTime(targetVol, audioCtx.currentTime + 0.005)`).
- **Tipos de Ondas para Estética Arcade:**
  - `square` o `sawtooth` con filtro paso-bajo (`BiquadFilterNode` tipo `lowpass`, frecuencia 1200-2400Hz) para tonos chiptune auténticos y no estridentes.
  - Generador de ruido blanco mediante `AudioBuffer` para efectos de percusión o estática CRT.
- **Persistencia de Mute:**
  - Guardar el estado de sonido en `localStorage.getItem('arcade_sfx_muted')` y reflejarlo de inmediato en la UI.

---

## 3. Shaders CRT y Estética Retro en CSS

- **Capas de Post-Procesado:**
  1. **Scanlines:** Gradiente lineal repetitivo con opacidad baja (10-15%) superpuesto con `pointer-events: none`.
  2. **Phosphor Glow:** Desenfoque sutil y sombras de texto (`text-shadow: 0 0 4px rgba(..., 0.7)`).
  3. **Viñeta y Curvatura:** Gradiente radial que oscurece los bordes para simular el tubo abombado de un monitor Trinitron.
- **Legibilidad ante todo:**
  - Los efectos visuales de distorsión (scanlines, grano, flicker) deben **desactivarse o atenuarse drásticamente** dentro de los paneles de texto técnico y modales de case studies para garantizar una lectura cómoda a reclutadores.
- **Accesibilidad Obligatoria:**
  - Respetar siempre `@media (prefers-reduced-motion: reduce)`: desactivar parpadeos (flicker), scanlines móviles y transiciones bruscas.

---

## 4. Ruleta de Selección y "Game Feel"

- **Física e Inercia:**
  - Al cambiar de sistema o juego, usar interpolación elástica (lerp o `cubic-bezier(0.34, 1.56, 0.64, 1)`) para transmitir sensación de masa mecánica de recreativa.
- **Feedback Auditivo y Háptico:**
  - Reproducir un tick sutil y seco al saltar cada elemento de la ruleta.
  - Añadir feedback visual en el foco (borde brillante, micro-zoom de 1.02x, resplandor ámbar/cian).

---

## 5. Viewport y Bloqueo de Relación de Aspecto

- **Chasis Centrado:**
  - Mantener la cabina arcade centrada en pantalla con `max-width: 100vw; max-height: 100vh; aspect-ratio: 16/9` (o 4:3 según diseño), usando `overflow: hidden` en el chasis pero permitiendo scroll interno en modales de contenido largo.
- **Adaptabilidad Móvil/Tablet:**
  - En pantallas estrechas (<1024px), colapsar el marco ornamental y priorizar la pantalla CRT legible a pantalla completa con controles táctiles o navegación simplificada.

---

## 6. Soporte para Mandos (Gamepad API)

- Polling en el bucle principal:
  ```javascript
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = gamepads[0];
  if (gp) {
    // D-Pad y Sticks con umbral de zona muerta (deadzone > 0.3)
    // Botón 0 (A / Cruz): Inspeccionar
    // Botón 1 (B / Círculo): Cerrar modal
  }
  ```
