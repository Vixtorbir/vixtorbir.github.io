/**
 * canvasRenderer.js — Bucle de Renderizado del Canvas 2D
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Encapsula el <canvas> de la pantalla CRT: dimensionado a devicePixelRatio
 * acotado a 1.25 (las escenas dibujan en CSS px), bucle requestAnimationFrame
 * limitado a 60 FPS con deltaTime acotado, pausa cuando la pestaña no es
 * visible y frame unico estatico bajo prefers-reduced-motion. No conoce
 * estado de UI (idioma, indice persistido) — eso vive en app.js.
 */

import { arcadeSystems } from './arcadeSystems.js';

let canvas = null;
let ctx = null;
let activeIndex = 0;
let cssW = 0;
let cssH = 0;
let dpr = 1;

let rafId = null;
let lastTime = 0;
let elapsed = 0;

// Limitador de tasa de cuadros: 60 FPS fijo (intervalo ~16.6ms). En monitores
// de 120/144/240Hz el RAF dispararia 2-4x mas frames sin ganancia visual.
const TARGET_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
let lastFrameTime = 0;

// Tope de DPR: en 4K/Retina o Windows al 150-200% el canvas cuadruplicaba
// los pixeles por frame. 1.25 conserva la nitidez retro con ~60% menos fillrate.
const MAX_DPR = 1.25;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Con reduced-motion se pinta un unico frame ya "asentado" (barras llenas,
// animaciones de entrada terminadas) en vez del frame t=0.
const SETTLED_TIME = 2.5;

function drawFrame() {
  if (!ctx || cssW === 0 || cssH === 0) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const system = arcadeSystems[activeIndex];
  if (system && system.drawScene) {
    ctx.save();
    system.drawScene(ctx, cssW, cssH, elapsed);
    ctx.restore();
  }
}

function loop(now) {
  rafId = requestAnimationFrame(loop);

  // Evita sobrecargas en pantallas de 120Hz/144Hz/240Hz
  const delta = now - lastFrameTime;
  if (delta < FRAME_INTERVAL_MS - 1) return;

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  // Resta el resto del intervalo para no acumular deriva (drift) del limitador
  lastFrameTime = now - (delta % FRAME_INTERVAL_MS);
  elapsed += dt;

  drawFrame();
}

export function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  cssW = rect.width;
  cssH = rect.height;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  drawFrame();
}

export function startRenderLoop() {
  if (rafId !== null) return;
  if (reducedMotion.matches) {
    elapsed = SETTLED_TIME;
    drawFrame();
    return;
  }
  lastTime = performance.now();
  lastFrameTime = lastTime;
  rafId = requestAnimationFrame(loop);
}

export function stopRenderLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export function initCanvasRenderer(canvasElement) {
  canvas = canvasElement;
  // alpha:false — las escenas pintan el fondo completo, asi el compositor
  // trata el canvas como opaco. desynchronized — bypass del compositor.
  ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  resizeCanvas();

  // Pausa instantanea si la pestaña no esta visible (0 consumo en segundo plano)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRenderLoop();
    else startRenderLoop();
  });

  reducedMotion.addEventListener('change', () => {
    stopRenderLoop();
    startRenderLoop();
  });
}

/* Cambia la escena activa y pinta un frame inmediato (sin esperar al RAF),
   reiniciando el reloj para que las animaciones de entrada arranquen de 0. */
export function renderScreenArtwork(index) {
  if (index !== activeIndex) elapsed = reducedMotion.matches ? SETTLED_TIME : 0;
  activeIndex = index;
  drawFrame();
}
