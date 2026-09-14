/**
 * canvasRenderer.js — Bucle de Renderizado del Canvas 2D
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Encapsula el <canvas> de la pantalla CRT: dimensionado a devicePixelRatio
 * y despacho al drawScene del sistema activo. No conoce estado de UI
 * (idioma, índice activo persistido, etc.) — eso vive en app.js.
 */

import { arcadeSystems } from './arcadeSystems.js';

let canvas = null;
let ctx = null;

export function initCanvasRenderer(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
}

export function renderScreenArtwork(activeSystemIndex) {
  if (!canvas || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * (window.devicePixelRatio || 1);
  canvas.height = rect.height * (window.devicePixelRatio || 1);

  const system = arcadeSystems[activeSystemIndex];
  if (system && system.drawScene) {
    system.drawScene(ctx, canvas.width, canvas.height);
  }
}
