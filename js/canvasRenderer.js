/**
 * canvasRenderer.js — Bucle de Renderizado del Canvas 2D
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Encapsula el <canvas> de la pantalla CRT: dimensionado a devicePixelRatio
 * (las escenas dibujan en CSS px), bucle requestAnimationFrame con deltaTime
 * acotado, pausa cuando la pestaña no es visible y frame unico estatico
 * bajo prefers-reduced-motion. No conoce estado de UI (idioma, indice
 * persistido) — eso vive en app.js.
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
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  elapsed += dt;
  drawFrame();
  rafId = requestAnimationFrame(loop);
}

export function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
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
  ctx = canvas.getContext('2d');
  resizeCanvas();

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
