/**
 * arcadeSystems.js — Catálogo de Sistemas / Base de Datos de Proyectos
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Propiedad de este módulo: los 6 "sistemas" del cabinet (perfil, juegos,
 * skills, contacto), sus assets, sus escenas de Canvas y las traducciones
 * ES/EN de la UI. No conoce el DOM ni el bucle de render: expone un
 * pequeño pub-sub (onAssetLoad) para que el módulo de render decida
 * cuándo repintar tras cargar una imagen.
 *
 * Cada drawScene(ctx, w, h, t) recibe el canvas ya escalado a CSS px y el
 * tiempo acumulado en segundos; no debe asignar objetos por frame salvo
 * gradientes cacheados por tamaño.
 */

const assetLoadListeners = [];

export function onAssetLoad(callback) {
  assetLoadListeners.push(callback);
}

function notifyAssetLoad() {
  assetLoadListeners.forEach((cb) => cb());
}

function preload(src) {
  const img = new Image();
  img.src = src;
  img.onload = notifyAssetLoad;
  return img;
}

const portraitImg = preload('assets/portrait_victor.png');
const fableIntroImg = preload('assets/fable_intro_title.png');  // Portada oficial artística
const fableGameplay2 = preload('assets/fable_gameplay_2.png'); // Escena del río con HUD de vida
const fableGameplay1 = preload('assets/fable_gameplay_1.png'); // Cañón de lava volcánica
const fableGameplay3 = preload('assets/fable_gameplay_3.png'); // Templo de puzles elementales
const fableGameplay4 = preload('assets/fable_gameplay_4.png'); // Bosque con setas luminosas
const miniKnightImg = preload('assets/mini_knight.png');
const phoenixImg = preload('assets/phoenix_pixel_art.png');
const playerShipImg = preload('assets/ave_player_ship.png');
const enemyBirdImg = preload('assets/ave_enemy_bird.png');
const phoenixBossImg = preload('assets/ave_phoenix_boss.png');
const phoenixIconImg = preload('assets/ave_phoenix_icon.png');
// Iconos oficiales de la vitrina HARDWARE & SKILLS (SVG con tamaño intrínseco)
const iconCppImg = preload('assets/icons/cpp.svg');
const iconCsharpImg = preload('assets/icons/csharp.svg');
const iconCImg = preload('assets/icons/c.svg');
const iconUnrealImg = preload('assets/icons/unreal.svg');
const iconUnityImg = preload('assets/icons/unity.svg');
const iconFmodImg = preload('assets/icons/fmod.svg');
const iconWwiseImg = preload('assets/icons/wwise.svg');
const iconGitImg = preload('assets/icons/git.svg');

function ready(img) {
  return img.complete && img.naturalWidth > 0;
}

// ---------------------------------------------------------------------------
// Helpers de dibujo compartidos
// ---------------------------------------------------------------------------
const FONT_ARCADE = "'Chakra Petch', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_PIXEL = "'Press Start 2P', monospace";

function unit(w, h) {
  return Math.max(0.72, Math.min(1.25, Math.min(w / 820, h / 520)));
}

function font(ctx, px, family, weight) {
  ctx.font = `${weight || ''} ${Math.round(px)}px ${family}`.trim();
}

function drawJaggedMountains(ctx, w, h, startYRatio, color, peakVariance) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * startYRatio);
  const step = 28;
  for (let x = 0; x <= w + step; x += step) {
    const yOffset = Math.sin(x * 0.02) * 20 + Math.cos(x * 0.05) * peakVariance;
    ctx.lineTo(x, h * startYRatio + yOffset);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

// Retro blue floor grid with a single vanishing point (CoinOPS / outrun floor)
function drawRetroFloorGrid(ctx, w, h, horizonRatio, rgb, alpha) {
  const a = alpha === undefined ? 1 : alpha;
  const horizon = h * horizonRatio;
  const vpX = w * 0.5;
  const depth = h - horizon;

  ctx.save();
  ctx.globalAlpha = a;

  const glow = ctx.createLinearGradient(0, horizon, 0, horizon + depth * 0.55);
  glow.addColorStop(0, `rgba(${rgb}, 0.28)`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizon, w, depth * 0.55);

  ctx.strokeStyle = `rgba(${rgb}, 0.55)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const spacing = w * 0.11;
  for (let i = -14; i <= 14; i++) {
    ctx.moveTo(vpX, horizon);
    ctx.lineTo(vpX + i * spacing, h);
  }
  const rows = 12;
  for (let r = 1; r <= rows; r++) {
    const tt = r / rows;
    const y = horizon + depth * tt * tt;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  ctx.strokeStyle = `rgba(${rgb}, 0.9)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(w, horizon);
  ctx.stroke();

  ctx.restore();
}

function drawCornerBrackets(ctx, x, y, w, h, size, color, lineWidth) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth || 2;
  ctx.beginPath();
  ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x + w - size, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + size);
  ctx.moveTo(x, y + h - size); ctx.lineTo(x, y + h); ctx.lineTo(x + size, y + h);
  ctx.moveTo(x + w - size, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - size);
  ctx.stroke();
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

function drawFineGrid(ctx, w, h, step, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = 0; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();
}

function blink(t, period) {
  return (t % period) < period * 0.6;
}

// Dibuja una imagen ajustada dentro de una caja (contain) y devuelve el rect usado
function drawContain(ctx, img, x, y, boxW, boxH, pixelated) {
  const ratio = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  const dx = x + (boxW - dw) / 2;
  const dy = y + (boxH - dh) / 2;
  ctx.imageSmoothingEnabled = !pixelated;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.imageSmoothingEnabled = true;
  return { x: dx, y: dy, w: dw, h: dh };
}

// Dibuja una imagen rellenando la caja (cover), recortando el exceso
function drawCover(ctx, img, x, y, boxW, boxH) {
  const ratio = Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, boxW, boxH);
  ctx.clip();
  ctx.drawImage(img, x + (boxW - dw) / 2, y + (boxH - dh) / 2, dw, dh);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// ESCENA 0 — PLAYER 1 SPEC SHEET (buque insignia)
// ---------------------------------------------------------------------------
const P1_BARS = [
  { label: 'C++ / C# ENGINE ARCHITECTURE', pct: 0.99 },
  { label: 'GAMEPLAY & STATE MACHINES', pct: 0.95 },
  { label: 'AUDIO INTEGRATION (FMOD & WWISE)', pct: 0.96 },
  { label: 'ZERO-ALLOC POOLING & MEMORY', pct: 0.92 }
];
// Tamanos minimos absolutos (px CSS): nunca se reducen por debajo, solo crecen
// suavemente en pantallas grandes. Sin shadowBlur en texto de 12-14px: en
// Canvas 2D las sombras emborronan los glifos pequenos.
const P1_TYPE = { title: 24, sub: 13.5, label: 15, pct: 15, badge: 13.5, tag: 12 };
const P1_PANEL_FILL = 'rgba(5, 10, 22, 0.88)';
const P1_PANEL_STROKE = 'rgba(56, 189, 248, 0.25)';
const p1Cache = { w: 0, h: 0, bg: null, bar: null, barX: 0, barW: 0 };

function px(min, u) {
  return Math.max(min, Math.round(min * u));
}

function drawPlayerOneScene(ctx, w, h, t) {
  const u = unit(w, h);
  const r = Math.round;

  if (p1Cache.w !== w || p1Cache.h !== h) {
    p1Cache.w = w; p1Cache.h = h;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0b1424');
    bg.addColorStop(0.55, '#050a14');
    bg.addColorStop(1, '#02040a');
    p1Cache.bg = bg;
    p1Cache.bar = null; // se reconstruye con la geometria de la barra
  }

  ctx.fillStyle = p1Cache.bg;
  ctx.fillRect(0, 0, w, h);
  drawFineGrid(ctx, w, h, 32 * u, 'rgba(56, 189, 248, 0.05)');
  drawRetroFloorGrid(ctx, w, h, 0.8, '56, 189, 248', 0.4);

  // ---- Cabecera sobre panel oscuro ----
  const margin = r(w * 0.05);
  const hx = margin;
  const hy = r(h * 0.11);
  const hw = w - margin * 2;
  const hh = r(P1_TYPE.title * 1.25 + P1_TYPE.sub * 1.4 + 22);
  drawPanel(ctx, hx, hy, hw, hh, P1_PANEL_FILL, P1_PANEL_STROKE);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(hx, hy, 4, hh);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  font(ctx, px(P1_TYPE.title, u), FONT_ARCADE, '800');
  ctx.fillStyle = '#fbbf24';
  const titleBase = hy + 12 + px(P1_TYPE.title, u);
  ctx.fillText('PLAYER 1 // VÍCTOR CÁRDENAS [BCN]', hx + 16, titleBase);
  font(ctx, px(P1_TYPE.sub, u), FONT_MONO, '600');
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SPEC SHEET // GAMEPLAY PROGRAMMER', hx + 16, titleBase + px(P1_TYPE.sub, u) + 8);

  // ---- Retrato con marco biselado ----
  const top = hy + hh + r(h * 0.04);
  const badgeY = r(h * 0.88);
  const areaH = badgeY - r(P1_TYPE.badge * 2.2) - top;
  const frameSize = r(Math.min(areaH - 24, w * 0.3));
  const fx = margin;
  const fy = top;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fx + 10, fy); ctx.lineTo(fx + frameSize - 10, fy); ctx.lineTo(fx + frameSize, fy + 10);
  ctx.lineTo(fx + frameSize, fy + frameSize - 10); ctx.lineTo(fx + frameSize - 10, fy + frameSize);
  ctx.lineTo(fx + 10, fy + frameSize); ctx.lineTo(fx, fy + frameSize - 10); ctx.lineTo(fx, fy + 10);
  ctx.closePath();
  ctx.fillStyle = '#03060d';
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (ready(portraitImg)) {
    drawContain(ctx, portraitImg, fx + 6, fy + 6, frameSize - 12, frameSize - 12, true);
  }
  ctx.restore();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  drawCornerBrackets(ctx, fx - 6, fy - 6, frameSize + 12, frameSize + 12, 14, '#38bdf8', 2);

  // Etiqueta del piloto bajo el retrato
  const tagH = r(P1_TYPE.tag * 1.9);
  const tagY = fy + frameSize + 8;
  drawPanel(ctx, fx, tagY, frameSize, tagH, P1_PANEL_FILL, P1_PANEL_STROKE);
  font(ctx, px(P1_TYPE.tag, u), FONT_ARCADE, '700');
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PILOT: P1 // BCN', fx + frameSize / 2, tagY + tagH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // ---- Barras de energia sobre panel oscuro ----
  const px0 = fx + frameSize + r(w * 0.035);
  const pw = w - margin - px0;
  const py0 = top;
  const ph = frameSize + 8 + tagH;
  drawPanel(ctx, px0, py0, pw, ph, P1_PANEL_FILL, P1_PANEL_STROKE);

  const inner = 16;
  const bx = px0 + inner;
  const bw = pw - inner * 2;
  const labelPx = px(P1_TYPE.label, u);
  const pctPx = px(P1_TYPE.pct, u);
  const barH = 12;
  const rowH = (ph - inner * 2) / P1_BARS.length;
  const rowContent = labelPx + 8 + barH;
  const fillEase = Math.min(1, t / 1.1);
  const eased = 1 - Math.pow(1 - fillEase, 3);

  if (!p1Cache.bar || p1Cache.barX !== bx || p1Cache.barW !== bw) {
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, '#f59e0b');
    g.addColorStop(1, '#38bdf8');
    p1Cache.bar = g;
    p1Cache.barX = bx;
    p1Cache.barW = bw;
  }

  for (let i = 0; i < P1_BARS.length; i++) {
    const bar = P1_BARS[i];
    const rowTop = py0 + inner + i * rowH + (rowH - rowContent) / 2;
    const textBase = r(rowTop + labelPx);
    font(ctx, labelPx, FONT_MONO, '700');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(bar.label, bx, textBase);

    font(ctx, pctPx, FONT_ARCADE, '800');
    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(Math.round(bar.pct * 100 * eased) + '%', bx + bw, textBase);

    const barY = r(textBase + 8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, barY, bw, barH);
    const segments = 12;
    const segGap = 3;
    const segW = (bw - segGap * (segments - 1)) / segments;
    const filled = bar.pct * eased * segments;
    ctx.fillStyle = p1Cache.bar;
    for (let sIdx = 0; sIdx < segments; sIdx++) {
      const sx = bx + sIdx * (segW + segGap);
      const on = sIdx + 1 <= filled;
      const partial = !on && sIdx < filled ? filled - sIdx : 0;
      if (on || partial > 0) {
        ctx.globalAlpha = on ? 1 : partial;
        ctx.fillRect(sx, barY, segW, barH);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, barY + 0.5, bw - 1, barH - 1);
  }

  // ---- Badge inferior parpadeante (sin blur) ----
  const badgePx = px(P1_TYPE.badge, u);
  font(ctx, badgePx, FONT_ARCADE, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const badgeText = '[ 1P PROFILE LOADED // GAMEPLAY & AUDIO SYSTEMS ]';
  const badgeW = r(ctx.measureText(badgeText).width + 28);
  const badgeH = r(badgePx * 2);
  const on = blink(t, 1.2);
  drawPanel(ctx, r(w / 2 - badgeW / 2), badgeY - badgeH / 2, badgeW, badgeH, P1_PANEL_FILL, on ? 'rgba(251, 191, 36, 0.8)' : P1_PANEL_STROKE);
  ctx.fillStyle = on ? '#fbbf24' : 'rgba(251, 191, 36, 0.45)';
  ctx.fillText(badgeText, r(w / 2), badgeY + 1);

  drawCornerBrackets(ctx, r(w * 0.025), r(h * 0.035), r(w * 0.95), r(h * 0.93), 18, 'rgba(251, 191, 36, 0.6)', 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------------------
// ESCENA 1 — THE FABLE OF THE ECLIPSE (attract mode: portada + gameplay)
// ---------------------------------------------------------------------------
// Slideshow continuo de 5 diapositivas. Orden y tiempos pre-calculados fuera
// del bucle: cero asignaciones por frame.
const FABLE_SLIDES = [fableIntroImg, fableGameplay2, fableGameplay1, fableGameplay3, fableGameplay4];
const FABLE_SLIDE_DUR = 4.5;   // segundos por diapositiva
const FABLE_FADE_DUR = 0.8;    // fundido cruzado al final de cada una
const FABLE_TYPE = { title: 24, sub: 14, label: 13.5 };
const fableReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const fableCache = { w: 0, h: 0, warm: null, edge: null };

function smoothstep(x) {
  return x * x * (3 - 2 * x);
}

// Dibuja una diapositiva ya cargada; el fallback es un fondo plano oscuro.
function drawFableSlide(ctx, index, w, h, u) {
  const img = FABLE_SLIDES[index];
  if (index === 0) {
    // Portada: a pantalla completa (cover) con viñeta cálida
    if (ready(img)) {
      drawCover(ctx, img, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0a0612';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = fableCache.warm;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (ready(img)) {
    drawCover(ctx, img, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#0a0612';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = fableCache.edge;
  ctx.fillRect(0, 0, w, h);
}

function drawFableScene(ctx, w, h, t) {
  const u = unit(w, h);
  if (fableCache.w !== w || fableCache.h !== h) {
    fableCache.w = w; fableCache.h = h;
    const cx = w / 2, cy = h / 2;
    const rad = Math.hypot(cx, cy);
    const warm = ctx.createRadialGradient(cx, cy, rad * 0.35, cx, cy, rad);
    warm.addColorStop(0, 'rgba(0, 0, 0, 0)');
    warm.addColorStop(0.7, 'rgba(40, 14, 4, 0.35)');
    warm.addColorStop(1, 'rgba(12, 4, 2, 0.85)');
    fableCache.warm = warm;
    const edge = ctx.createRadialGradient(cx, cy, rad * 0.45, cx, cy, rad);
    edge.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edge.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    fableCache.edge = edge;
  }

  // --- Slideshow automático con fundido cruzado ---------------------------
  const count = FABLE_SLIDES.length;
  const current = Math.floor(t / FABLE_SLIDE_DUR) % count;
  const local = t % FABLE_SLIDE_DUR;
  const fadeStart = FABLE_SLIDE_DUR - FABLE_FADE_DUR;
  drawFableSlide(ctx, current, w, h, u);
  if (local > fadeStart) {
    const mix = smoothstep((local - fadeStart) / FABLE_FADE_DUR);
    ctx.save();
    ctx.globalAlpha = mix;
    drawFableSlide(ctx, (current + 1) % count, w, h, u);
    ctx.restore();
  }

  // --- Mini-Knight presidiendo la derecha ---------------------------------
  const kw = w * 0.29;
  const kh = h * 0.68;
  const kx = w * 0.69;
  const bob = fableReducedMotion.matches ? 0 : Math.sin(t * 2) * 4 * u;
  const ky = h - kh - h * 0.14 + bob;
  if (ready(miniKnightImg)) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 22 * u;
    ctx.shadowOffsetY = 6 * u;
    drawContain(ctx, miniKnightImg, kx, ky, kw, kh, false);
    ctx.restore();
  }
  // Rótulo del estudio bajo el sprite (píldora oscura para legibilidad)
  font(ctx, px(FABLE_TYPE.label, u), FONT_ARCADE, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelX = kx + kw / 2;
  const labelY = h - h * 0.14 + 16 * u + bob * 0.5;
  const labelW = ctx.measureText('MINI-KNIGHT STUDIO').width + 24 * u;
  drawPanel(ctx, labelX - labelW / 2, labelY - 11 * u, labelW, 22 * u, 'rgba(5, 10, 22, 0.78)', 'rgba(251, 191, 36, 0.45)');
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('MINI-KNIGHT STUDIO', labelX, labelY);

  // --- Cabecera arcade minimalista (superior izquierda) -------------------
  const hx = 16; // alineado con .screen-top-badge (left: 16px)
  const hy = Math.max(48, Math.round(h * 0.08));
  const pad = Math.round(10 * u);
  font(ctx, px(FABLE_TYPE.title, u), FONT_ARCADE, '800');
  const titleW = ctx.measureText('THE FABLE OF THE ECLIPSE').width;
  font(ctx, px(FABLE_TYPE.sub, u), FONT_MONO, '600');
  const subW = ctx.measureText('3D ACTION-ADVENTURE // CUSTOM C++ ENGINE').width;
  const hw = Math.max(titleW, subW) + pad * 2;
  const hh = 66 * u;
  drawPanel(ctx, hx, hy, hw, hh, 'rgba(5, 10, 22, 0.85)', 'rgba(56, 189, 248, 0.35)');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  font(ctx, px(FABLE_TYPE.title, u), FONT_ARCADE, '800');
  ctx.fillStyle = '#ffffff';
  ctx.fillText('THE FABLE OF THE ECLIPSE', hx + pad, hy + hh * 0.46);
  font(ctx, px(FABLE_TYPE.sub, u), FONT_MONO, '600');
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('3D ACTION-ADVENTURE // CUSTOM C++ ENGINE', hx + pad, hy + hh * 0.8);
}

// ---------------------------------------------------------------------------
// ESCENA 2 — AVE PHOENIX REGEN (attract mode: caza vs boss, starfield continuo)
// ---------------------------------------------------------------------------
const STARS = [];
for (let i = 0; i < 160; i++) {
  STARS.push({
    x: Math.random(),
    y: Math.random(),
    speed: 0.02 + Math.random() * 0.09,
    size: Math.random() < 0.15 ? 2 : (Math.random() < 0.4 ? 1.4 : 0.9),
    phase: Math.random() * Math.PI * 2
  });
}
// Ráfagas y chispas pre-alojadas: la posición se deriva de t (cero allocs/frame)
const PHOENIX_SHOTS = [];
for (let i = 0; i < 6; i++) {
  PHOENIX_SHOTS.push({ offset: i / 6, lane: i % 2 === 0 ? -1 : 1 });
}
const PHOENIX_SPARKS = [];
for (let i = 0; i < 10; i++) {
  PHOENIX_SPARKS.push({ angle: (i / 10) * Math.PI * 2, phase: Math.random() * Math.PI * 2, len: 0.6 + Math.random() * 0.6 });
}
const PHOENIX_TYPE = { title: 24, sub: 14 };
const phoenixCache = { w: 0, h: 0, bg: null };

// Caza del jugador vectorial (fallback si el icono no ha cargado)
function drawPhoenixShipFallback(ctx, x, y, size) {
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.6, y);
  ctx.lineTo(x - size * 0.4, y - size * 0.32);
  ctx.lineTo(x - size * 0.2, y);
  ctx.lineTo(x - size * 0.4, y + size * 0.32);
  ctx.closePath();
  ctx.fill();
}

function drawPhoenixScene(ctx, w, h, t) {
  const u = unit(w, h);
  if (phoenixCache.w !== w || phoenixCache.h !== h) {
    phoenixCache.w = w; phoenixCache.h = h;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#05070f');
    bg.addColorStop(1, '#02040a');
    phoenixCache.bg = bg;
  }
  ctx.fillStyle = phoenixCache.bg;
  ctx.fillRect(0, 0, w, h);

  // Nebulosa cósmica sutil
  ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.beginPath();
  ctx.ellipse(w * 0.7, h * 0.35, w * 0.35, h * 0.3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(249, 115, 22, 0.04)';
  ctx.beginPath();
  ctx.ellipse(w * 0.78, h * 0.55, w * 0.28, h * 0.32, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Starfield horizontal continuo
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    const x = ((s.x - t * s.speed) % 1 + 1) % 1;
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + s.phase);
    ctx.fillRect(x * w, s.y * h, s.size * u, s.size * u);
  }
  ctx.globalAlpha = 1;

  // --- Boss imponente a la derecha con escoltas en formación --------------
  const bossSize = Math.min(w * 0.34, h * 0.68);
  const bx = w * 0.76;
  const by = h * 0.48 + Math.sin(t * 1.5) * 8 * u;
  const bossImg = ready(phoenixBossImg) ? phoenixBossImg : phoenixImg;
  if (ready(enemyBirdImg)) {
    // El enemigo mira hacia abajo: se rota 90 grados para encarar al jugador
    const wing = bossSize * 0.3;
    ctx.save();
    ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
    ctx.shadowBlur = 12 * u;
    for (let k = 0; k < 2; k++) {
      const ex = bx - bossSize * 0.42;
      const ey = by + (k === 0 ? -bossSize * 0.44 : bossSize * 0.44) + Math.sin(t * 2.4 + k + 1) * 6 * u;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(Math.PI / 2);
      drawContain(ctx, enemyBirdImg, -wing / 2, -wing / 2, wing, wing, true);
      ctx.restore();
    }
    ctx.restore();
  }
  // Estelas de propulsión del boss (salen por detrás, hacia la derecha)
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const ty = by - 12 * u + k * 12 * u;
    const len = (46 + 28 * Math.sin(t * 9 + k)) * u;
    ctx.moveTo(bx + bossSize * 0.3, ty);
    ctx.lineTo(bx + bossSize * 0.3 + len, ty);
  }
  ctx.stroke();
  if (ready(bossImg)) {
    ctx.save();
    ctx.shadowColor = 'rgba(249, 115, 22, 0.95)';
    ctx.shadowBlur = 26 * u;
    drawContain(ctx, bossImg, bx - bossSize / 2, by - bossSize / 2, bossSize, bossSize, bossImg === phoenixImg);
    ctx.restore();
  }

  // --- Caza del jugador a la izquierda ------------------------------------
  const shipSize = Math.min(w * 0.13, h * 0.24);
  const sx = w * 0.16;
  const sy = h * 0.52 + Math.sin(t * 2.2) * 14 * u;
  // Propulsor de plasma cyan parpadeante (detrás del caza)
  const flame = (0.7 + 0.3 * Math.sin(t * 26)) * shipSize * 0.5;
  ctx.save();
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 16 * u;
  ctx.fillStyle = 'rgba(34, 211, 238, 0.85)';
  ctx.beginPath();
  ctx.moveTo(sx - shipSize * 0.42, sy - shipSize * 0.08);
  ctx.lineTo(sx - shipSize * 0.42 - flame, sy);
  ctx.lineTo(sx - shipSize * 0.42, sy + shipSize * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (ready(playerShipImg)) {
    // La nave mira hacia arriba: se rota 90 grados para apuntar a la derecha
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(Math.PI / 2);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 14 * u;
    drawContain(ctx, playerShipImg, -shipSize / 2, -shipSize / 2, shipSize, shipSize, true);
    ctx.restore();
  } else {
    drawPhoenixShipFallback(ctx, sx, sy, shipSize);
  }

  // --- Ráfagas láser gemelas hacia la derecha -----------------------------
  const shotStart = sx + shipSize * 0.5;
  const shotEnd = bx - bossSize * 0.35;
  const shotLen = 26 * u;
  ctx.save();
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10 * u;
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 3 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < PHOENIX_SHOTS.length; i++) {
    const sh = PHOENIX_SHOTS[i];
    const p = (t * 0.9 + sh.offset) % 1;
    const x = shotStart + (shotEnd - shotStart) * p;
    const y = sy + sh.lane * shipSize * 0.22;
    ctx.moveTo(x, y);
    ctx.lineTo(x + shotLen, y);
  }
  ctx.stroke();
  ctx.restore();

  // Chispas de impacto sobre el boss
  const impactX = shotEnd + shotLen;
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
  ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  for (let i = 0; i < PHOENIX_SPARKS.length; i++) {
    const sp = PHOENIX_SPARKS[i];
    const life = (t * 3 + sp.phase) % 1;
    const r = life * 18 * u * sp.len;
    const cy = sy + (i % 2 === 0 ? -1 : 1) * shipSize * 0.22;
    ctx.moveTo(impactX + Math.cos(sp.angle) * r * 0.4, cy + Math.sin(sp.angle) * r * 0.4);
    ctx.lineTo(impactX + Math.cos(sp.angle) * r, cy + Math.sin(sp.angle) * r);
  }
  ctx.stroke();

  // --- Contador retro 1UP (superior derecha) ------------------------------
  font(ctx, 9 * u, FONT_PIXEL);
  ctx.fillStyle = blink(t, 1) ? '#fde047' : 'rgba(253, 224, 71, 0.3)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('1UP  004273', w * 0.96, h * 0.09);

  // --- Cabecera arcade minimalista (superior izquierda) -------------------
  const hx = 16; // alineado con .screen-top-badge (left: 16px)
  const hy = Math.max(48, Math.round(h * 0.08));
  const pad = Math.round(10 * u);
  font(ctx, px(PHOENIX_TYPE.title, u), FONT_ARCADE, '800');
  const titleW = ctx.measureText('AVE PHOENIX REGEN').width;
  font(ctx, px(PHOENIX_TYPE.sub, u), FONT_MONO, '600');
  const subW = ctx.measureText('RETRO SPACE SHMUP // UNITY C#').width;
  const hw = Math.max(titleW, subW) + pad * 2;
  const hh = 66 * u;
  drawPanel(ctx, hx, hy, hw, hh, 'rgba(5, 10, 22, 0.85)', 'rgba(251, 146, 60, 0.4)');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  font(ctx, px(PHOENIX_TYPE.title, u), FONT_ARCADE, '800');
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AVE PHOENIX REGEN', hx + pad, hy + hh * 0.46);
  font(ctx, px(PHOENIX_TYPE.sub, u), FONT_MONO, '600');
  ctx.fillStyle = '#fb923c';
  ctx.fillText('RETRO SPACE SHMUP // UNITY C#', hx + pad, hy + hh * 0.8);
}

// ---------------------------------------------------------------------------
// ESCENA 3 — COMBAT & AI // HITBOX LABORATORY (WIP)
// ---------------------------------------------------------------------------
const DOJO_LINES = [
  'STATUS: IN ACTIVE R&D // COMBAT SYSTEMS',
  'FRAME-ACCURATE HITBOX DATA // DECOUPLED COLLIDERS',
  'AI BEHAVIOR TREES & FINITE STATE MACHINES'
];

function drawFighterSilhouette(ctx, x, groundY, scale, facing, punch, color) {
  // Silueta esquematica: cabeza, torso, brazos, piernas (todo en CSS px * scale)
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(facing, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6 * scale;
  ctx.lineCap = 'round';
  // cabeza
  ctx.beginPath();
  ctx.arc(0, -150 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.fill();
  // torso
  ctx.beginPath();
  ctx.moveTo(0, -130 * scale);
  ctx.lineTo(-4 * scale, -70 * scale);
  ctx.stroke();
  // piernas
  ctx.beginPath();
  ctx.moveTo(-4 * scale, -70 * scale);
  ctx.lineTo(-26 * scale, -8 * scale);
  ctx.moveTo(-4 * scale, -70 * scale);
  ctx.lineTo(22 * scale, -8 * scale);
  ctx.stroke();
  // brazo trasero
  ctx.beginPath();
  ctx.moveTo(0, -118 * scale);
  ctx.lineTo(-24 * scale, -92 * scale);
  ctx.stroke();
  // brazo delantero (punch extiende)
  ctx.beginPath();
  ctx.moveTo(0, -118 * scale);
  ctx.lineTo((24 + 44 * punch) * scale, (-112 + 6 * punch) * scale);
  ctx.stroke();
  ctx.restore();
}

function drawDojoScene(ctx, w, h, t) {
  const u = unit(w, h);
  ctx.fillStyle = '#0a0714';
  ctx.fillRect(0, 0, w, h);

  const stageY = h * 0.72;
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < w; x += 35 * u) { ctx.moveTo(x, 0); ctx.lineTo(x, stageY); }
  for (let y = 0; y < stageY; y += 35 * u) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();
  drawRetroFloorGrid(ctx, w, h, 0.72, '192, 132, 252');

  // Luchadores
  const scale = (h / 520) * 1.2;
  const groundY = stageY + 6 * u;
  const punch = Math.max(0, Math.sin(t * 2.6 + 1.0));
  const p1x = w * 0.42;
  const p2x = w * 0.7;
  drawFighterSilhouette(ctx, p1x, groundY, scale, 1, punch, 'rgba(96, 165, 250, 0.85)');
  drawFighterSilhouette(ctx, p2x, groundY, scale, -1, 0, 'rgba(226, 232, 240, 0.7)');

  // Hurtbox azul (P1 completo)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.fillRect(p1x - 32 * scale, groundY - 170 * scale, 64 * scale, 170 * scale);
  ctx.strokeRect(p1x - 32 * scale, groundY - 170 * scale, 64 * scale, 170 * scale);
  // Hurtbox del rival (blanco tenue)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(p2x - 32 * scale, groundY - 170 * scale, 64 * scale, 170 * scale);
  ctx.setLineDash([]);
  // Hitbox roja del golpe (activa solo en el frame de impacto)
  if (punch > 0.55) {
    const hx = p1x + 20 * scale;
    const hw = (28 + 48 * punch) * scale;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.strokeStyle = '#ef4444';
    ctx.fillRect(hx, groundY - 126 * scale, hw, 26 * scale);
    ctx.strokeRect(hx, groundY - 126 * scale, hw, 26 * scale);
    font(ctx, 7 * u, FONT_PIXEL);
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'left';
    ctx.fillText('HIT', hx, groundY - 132 * scale);
  }

  // Etiquetas de caja
  font(ctx, 7 * u, FONT_PIXEL);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('HURTBOX', p1x - 32 * scale, groundY - 176 * scale);

  // Telemetria
  const px = w * 0.04;
  const py = h * 0.15;
  font(ctx, 8 * u, FONT_PIXEL);
  ctx.fillStyle = '#c084fc';
  ctx.fillText('HITBOX LAB // TRAINING DOJO', px, py + 10 * u);
  font(ctx, 9.5 * u, FONT_MONO, '600');
  ctx.fillStyle = '#e9d5ff';
  for (let i = 0; i < DOJO_LINES.length; i++) {
    ctx.fillText('> ' + DOJO_LINES[i], px, py + 30 * u + i * 16 * u);
  }

  // Sello WIP
  font(ctx, 8 * u, FONT_PIXEL);
  ctx.textAlign = 'right';
  ctx.fillStyle = blink(t, 1.4) ? '#fbbf24' : 'rgba(251, 191, 36, 0.35)';
  ctx.fillText('[ WIP // RESEARCH ]', w * 0.96, h * 0.09);
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// ESCENA 4 — GAMEPLAY SKILLS & TOOLS (cartas perk roguelike flotantes)
// ---------------------------------------------------------------------------
// Dos estantes de cartas de habilidad estilo Hades / Slay the Spire flotando
// sobre polvo estelar arcade. Solo icono oficial + nombre: el desglose técnico
// vive en el modal. Todo el estado se pre-aloja aquí: cero allocs por frame.
const SKILL_PARTICLES = [];
for (let i = 0; i < 40; i++) {
  SKILL_PARTICLES.push({
    x: Math.random(),
    y: Math.random(),
    speedX: 0.012 + Math.random() * 0.03,
    speedY: (Math.random() - 0.5) * 0.008,
    size: Math.random() < 0.25 ? 2.2 : 1.3,
    phase: Math.random() * Math.PI * 2
  });
}
const HW_LANGS = [
  { name: 'C++', color: '#38bdf8', img: iconCppImg },
  { name: 'C#', color: '#c084fc', img: iconCsharpImg },
  { name: 'C', color: '#60a5fa', img: iconCImg }
];
const HW_TOOLS = [
  { name: 'UNREAL ENGINE', color: '#f8fafc', img: iconUnrealImg },
  { name: 'UNITY', color: '#ffffff', img: iconUnityImg },
  { name: 'FMOD', color: '#f43f5e', img: iconFmodImg },
  { name: 'WWISE', color: '#38bdf8', img: iconWwiseImg },
  { name: 'GIT / GITHUB', color: '#fb923c', img: iconGitImg }
];
const HW_TYPE = { title: 24, sub: 14, shelf: 12, langName: 28, toolName: 12.5 };
// Gradientes de carta cacheados por altura de fila (se dibujan en espacio local
// de la carta con translate, así una sola instancia sirve para toda la fila).
const hwCache = { w: 0, h: 0, bg: null, card1: null, card2: null };

function makeCardGradient(ctx, ch) {
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, 'rgba(12, 18, 34, 0.95)');
  g.addColorStop(1, 'rgba(6, 10, 20, 0.96)');
  return g;
}

function pathRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Dibuja un rombo estilizado (gema de perk roguelike)
function drawRoguelikeGem(ctx, cx, cy, size, color, pulse) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6 * pulse;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.75, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.75, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Carta de habilidad roguelike (sin pines ni muescas de cartucho)
function drawSkillCard(ctx, x, y, cw, ch, color, pulse, u, fill) {
  // Fondo degradado con sombra neón (gradiente en espacio local de la carta)
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = (8 + 12 * pulse) * u;
  ctx.fillStyle = fill;
  pathRoundRect(ctx, 0, 0, cw, ch, 6 * u);
  ctx.fill();
  ctx.restore();

  // Borde exterior con color temático neón
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * u;
  pathRoundRect(ctx, x + 0.75 * u, y + 0.75 * u, cw - 1.5 * u, ch - 1.5 * u, 6 * u);
  ctx.stroke();

  // Borde interior biselado (inset frame roguelike)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1 * u;
  pathRoundRect(ctx, x + 4 * u, y + 4 * u, cw - 8 * u, ch - 8 * u, 4 * u);
  ctx.stroke();

  // Gema de rareza roguelike en cabecera superior central
  drawRoguelikeGem(ctx, x + cw / 2, y + 7 * u, 3.5 * u, color, pulse);

  // Micro-indicador LED de sincronización en esquina superior derecha
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5 + 0.5 * pulse;
  ctx.beginPath();
  ctx.arc(x + cw - 9 * u, y + 9 * u, 1.8 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawShelfLabel(ctx, text, color, y, w, u) {
  font(ctx, px(HW_TYPE.shelf, u), FONT_ARCADE, '700');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 16, y);
  const tw = ctx.measureText(text).width;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16 + tw + 12 * u, y + 0.5);
  ctx.lineTo(w - 16, y + 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Remates angulares en las cuatro esquinas de un panel
function drawCornerAccents(ctx, x, y, w, h, len, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
  ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
  ctx.stroke();
}

function drawHardwareScene(ctx, w, h, t) {
  const u = unit(w, h);
  const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';

  const row1H = h * 0.20;
  const row2H = h * 0.255;
  if (hwCache.w !== w || hwCache.h !== h) {
    hwCache.w = w; hwCache.h = h;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#060c18');
    bg.addColorStop(1, '#02040a');
    hwCache.bg = bg;
    hwCache.card1 = makeCardGradient(ctx, row1H);
    hwCache.card2 = makeCardGradient(ctx, row2H);
  }
  ctx.fillStyle = hwCache.bg;
  ctx.fillRect(0, 0, w, h);
  drawFineGrid(ctx, w, h, 40 * u, 'rgba(56, 189, 248, 0.04)');

  // Partículas arcade en suspensión
  ctx.fillStyle = '#7dd3fc';
  for (let i = 0; i < SKILL_PARTICLES.length; i++) {
    const p = SKILL_PARTICLES[i];
    const x = ((p.x + t * p.speedX) % 1 + 1) % 1;
    const y = ((p.y + t * p.speedY) % 1 + 1) % 1;
    ctx.globalAlpha = 0.35 + 0.45 * Math.sin(t * 2.5 + p.phase);
    ctx.fillRect(x * w, y * h, p.size * u, p.size * u);
  }
  ctx.globalAlpha = 1;

  // --- Telemetría retro (superior derecha) bilingüe ---
  font(ctx, 9 * u, FONT_PIXEL);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = blink(t, 1.2) ? '#fbbf24' : 'rgba(251, 191, 36, 0.3)';
  ctx.fillText(isEn ? '[ LOADOUT: 8/8 EQUIPPED ]' : '[ EQUIPAMIENTO: 8/8 HABILIDADES ]', w - 16, h * 0.09);

  // --- Estante 1: LENGUAJES (cartas horizontales) ---
  const gap = 16 * u;
  const labelLangs = isEn ? '[ PROGRAMMING LANGUAGES ]' : '[ LENGUAJES DE PROGRAMACIÓN ]';
  drawShelfLabel(ctx, labelLangs, '#38bdf8', h * 0.285, w, u);
  const row1Y = h * 0.325;
  const cw1 = (w - 32 - gap * 2) / 3;
  for (let i = 0; i < HW_LANGS.length; i++) {
    const c = HW_LANGS[i];
    const x = 16 + i * (cw1 + gap);
    const bob = Math.sin(t * 2.2 + i * 0.85) * 5 * u;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.6 + i * 1.1);
    const y = row1Y + bob;
    drawSkillCard(ctx, x, y, cw1, row1H, c.color, pulse, u, hwCache.card1);

    // Marco interior tenue para el icono
    const iconBoxSize = row1H - 16 * u;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    pathRoundRect(ctx, x + 8 * u, y + 8 * u, iconBoxSize, iconBoxSize, 4 * u);
    ctx.fill();

    const icon = 36 * u;
    if (ready(c.img)) drawContain(ctx, c.img, x + 8 * u + (iconBoxSize - icon) / 2, y + 8 * u + (iconBoxSize - icon) / 2, icon, icon, false);

    font(ctx, px(HW_TYPE.langName, u), FONT_ARCADE, '800');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(c.name, x + cw1 - 18 * u, y + row1H * 0.52);
  }

  // --- Estante 2: HERRAMIENTAS & AUDIO (cartas verticales) ---
  const labelTools = isEn ? '[ TOOLS & AUDIO ]' : '[ HERRAMIENTAS & AUDIO ]';
  drawShelfLabel(ctx, labelTools, '#c084fc', h * 0.585, w, u);
  const row2Y = h * 0.625;
  const cw2 = (w - 32 - gap * 4) / 5;
  for (let i = 0; i < HW_TOOLS.length; i++) {
    const c = HW_TOOLS[i];
    const x = 16 + i * (cw2 + gap);
    const bob = Math.sin(t * 2.0 + (i + 3) * 0.75) * 4.5 * u;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + (i + 3) * 0.9);
    const y = row2Y + bob;
    drawSkillCard(ctx, x, y, cw2, row2H, c.color, pulse, u, hwCache.card2);

    // Marco superior para el icono de la herramienta
    const iconAreaH = row2H * 0.55;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    pathRoundRect(ctx, x + 6 * u, y + 14 * u, cw2 - 12 * u, iconAreaH - 12 * u, 4 * u);
    ctx.fill();

    const icon = Math.min(38 * u, (cw2 - 16 * u) * 0.85);
    if (ready(c.img)) drawContain(ctx, c.img, x + (cw2 - icon) / 2, y + 14 * u + (iconAreaH - 12 * u - icon) / 2, icon, icon, false);

    // Nombre de la herramienta centrado en la mitad inferior
    font(ctx, px(HW_TYPE.toolName, u), FONT_ARCADE, '700');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(c.name, x + cw2 / 2, y + row2H * 0.77);
  }

  // --- Cabecera modular (superior izquierda) con AUDIO y traducción ---
  const hx = 16; // alineado con .screen-top-badge (left: 16px)
  const hy = Math.max(48, Math.round(h * 0.08));
  const pad = Math.round(10 * u);
  const titleStr = 'GAMEPLAY SKILLS & TOOLS';
  const subStr = isEn ? 'GAME PROGRAMMING // C++, C# & AUDIO' : 'PROGRAMACIÓN DE GAMEPLAY // C++, C# & AUDIO';

  font(ctx, px(HW_TYPE.title, u), FONT_ARCADE, '800');
  const titleW = ctx.measureText(titleStr).width;
  font(ctx, px(HW_TYPE.sub, u), FONT_MONO, '600');
  const subW = ctx.measureText(subStr).width;
  const hw = Math.max(titleW, subW) + pad * 2;
  const hh = 66 * u;

  drawPanel(ctx, hx, hy, hw, hh, 'rgba(5, 10, 24, 0.9)', 'rgba(56, 189, 248, 0.4)');
  drawCornerAccents(ctx, hx, hy, hw, hh, 8 * u, 'rgba(56, 189, 248, 0.9)');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  font(ctx, px(HW_TYPE.title, u), FONT_ARCADE, '800');
  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleStr, hx + pad, hy + hh * 0.46);
  font(ctx, px(HW_TYPE.sub, u), FONT_MONO, '600');
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(subStr, hx + pad, hy + hh * 0.8);
}

// ---------------------------------------------------------------------------
// ESCENA 5 — CONTACT & HELP (radar retro arcade + leyenda de contacto)
// ---------------------------------------------------------------------------
// Mitad izquierda: radar vectorial de fósforo con baliza en Barcelona.
// Mitad derecha: leyenda del minimapa con los datos de contacto esenciales.
// Cadenas pre-formateadas por idioma: cero asignaciones por frame.
const CONTACT_TXT = {
  es: {
    legend: '[ LEYENDA DEL MAPA // CONTACTO ]',
    entries: [
      ['ESTADO', 'DISPONIBLE PARA PRÁCTICAS'],
      ['BASE', 'BARCELONA, SPAIN (BCN)'],
      ['EMAIL', 'victorcarhor@gmail.com'],
      ['TELÉFONO', '+34 623 187 320'],
      ['GITHUB', 'github.com/Vixtorbir'],
      ['LINKEDIN', 'linkedin.com/in/victor-cardenas-gamedev']
    ]
  },
  en: {
    legend: '[ MAP LEGEND // CONTACT ]',
    entries: [
      ['STATUS', 'AVAILABLE FOR INTERNSHIP'],
      ['BASE', 'BARCELONA, SPAIN (BCN)'],
      ['EMAIL', 'victorcarhor@gmail.com'],
      ['PHONE', '+34 623 187 320'],
      ['GITHUB', 'github.com/Vixtorbir'],
      ['LINKEDIN', 'linkedin.com/in/victor-cardenas-gamedev']
    ]
  }
};
const CONTACT_TYPE = { title: 24, sub: 14, legend: 12, label: 9.5, value: 12, tiny: 8.5 };
// Posición de la baliza BCN dentro del radar (fracción del radio)
const CONTACT_BCN = { x: 0.22, y: 0.14 };
const contactCache = { w: 0, h: 0, bg: null };

function drawContactScene(ctx, w, h, t) {
  const u = unit(w, h);
  const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
  const txt = isEn ? CONTACT_TXT.en : CONTACT_TXT.es;

  if (contactCache.w !== w || contactCache.h !== h) {
    contactCache.w = w; contactCache.h = h;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0b0710');
    bg.addColorStop(1, '#03040a');
    contactCache.bg = bg;
  }
  ctx.fillStyle = contactCache.bg;
  ctx.fillRect(0, 0, w, h);
  drawFineGrid(ctx, w, h, 40 * u, 'rgba(244, 63, 94, 0.05)');

  // =====================================================================
  // RADAR RETRO ARCADE (mitad izquierda)
  // =====================================================================
  const top = h * 0.26;
  const bottom = h * 0.92;
  const rr = Math.min(w * 0.2, (bottom - top) * 0.42);
  const rx = 16 + w * 0.23;
  const ry = top + (bottom - top) / 2;

  // Anillos de distancia y círculo exterior
  ctx.lineWidth = 1;
  for (let k = 1; k <= 3; k++) {
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.22)';
    ctx.beginPath();
    ctx.arc(rx, ry, rr * k / 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
  ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  ctx.arc(rx, ry, rr, 0, Math.PI * 2);
  ctx.stroke();

  // Retícula en cruz
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx - rr, ry); ctx.lineTo(rx + rr, ry);
  ctx.moveTo(rx, ry - rr); ctx.lineTo(rx, ry + rr);
  ctx.stroke();

  // Haz de barrido con estela de fósforo (3 cuñas decrecientes)
  const sweep = t * 1.5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(rx, ry, rr, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#f43f5e';
  for (let k = 0; k < 3; k++) {
    ctx.globalAlpha = 0.16 - k * 0.05;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.arc(rx, ry, rr, sweep - 0.35 * (k + 1), sweep - 0.35 * k);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.lineTo(rx + Math.cos(sweep) * rr, ry + Math.sin(sweep) * rr);
  ctx.stroke();
  ctx.restore();

  // Marcas cardinales
  font(ctx, px(CONTACT_TYPE.tiny + 1, u), FONT_ARCADE, '800');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('N', rx, ry - rr - 11 * u);
  ctx.fillStyle = 'rgba(253, 164, 175, 0.85)';
  ctx.fillText('S', rx, ry + rr + 11 * u);
  ctx.fillText('E', rx + rr + 11 * u, ry);
  ctx.fillText('W', rx - rr - 11 * u, ry);

  // Baliza de Barcelona
  const bx = rx + rr * CONTACT_BCN.x;
  const by = ry + rr * CONTACT_BCN.y;
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.strokeStyle = '#fbbf24';
  ctx.globalAlpha = 0.6 * (1 - pulse);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bx, by, (6 + 12 * pulse) * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = (6 + 8 * pulse) * u;
  ctx.beginPath();
  ctx.arc(bx, by, 3.5 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  font(ctx, px(CONTACT_TYPE.tiny, u), FONT_PIXEL);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('BCN', bx + 9 * u, by - 6 * u);
  font(ctx, px(CONTACT_TYPE.tiny, u), FONT_MONO, '600');
  ctx.fillStyle = 'rgba(253, 230, 138, 0.8)';
  ctx.fillText('41.38° N, 2.17° E', bx + 9 * u, by + 8 * u);

  // =====================================================================
  // LEYENDA DEL MINIMAPA (mitad derecha)
  // =====================================================================
  const lx = w * 0.5;
  const ly = top;
  const lw = w - 16 - lx;
  const lh = bottom - top;
  drawPanel(ctx, lx, ly, lw, lh, 'rgba(4, 7, 15, 0.85)', 'rgba(244, 63, 94, 0.45)');
  drawCornerAccents(ctx, lx, ly, lw, lh, 10 * u, 'rgba(244, 63, 94, 0.9)');
  const pad = 16 * u;
  font(ctx, px(CONTACT_TYPE.legend, u), FONT_ARCADE, '800');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fb7185';
  ctx.fillText(txt.legend, lx + pad, ly + 24 * u);
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lx + pad, ly + 34 * u);
  ctx.lineTo(lx + lw - pad, ly + 34 * u);
  ctx.stroke();

  const entries = txt.entries;
  const listTop = ly + 44 * u;
  const rowH = (lh - 44 * u - 26 * u) / entries.length;
  for (let i = 0; i < entries.length; i++) {
    const y = listTop + i * rowH;
    font(ctx, px(CONTACT_TYPE.label, u), FONT_MONO, '700');
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(entries[i][0], lx + pad, y + rowH * 0.38);
    font(ctx, px(CONTACT_TYPE.value, u), FONT_MONO, i === 0 ? '700' : '600');
    ctx.fillStyle = i === 0 ? '#fde047' : '#ffffff';
    ctx.fillText(entries[i][1], lx + pad, y + rowH * 0.38 + 17 * u);
  }

  // Cursor de terminal
  if (blink(t, 1.0)) {
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(lx + pad, ly + lh - 18 * u, 7 * u, 11 * u);
  }

  // =====================================================================
  // CABECERA (superior izquierda)
  // =====================================================================
  const hx = 16; // alineado con .screen-top-badge (left: 16px)
  const hy = Math.max(48, Math.round(h * 0.08));
  const hpad = Math.round(10 * u);
  const titleStr = 'CONTACT & HELP';
  const subStr = 'COMM LINK // BARCELONA (BCN)';
  font(ctx, px(CONTACT_TYPE.title, u), FONT_ARCADE, '800');
  const titleW = ctx.measureText(titleStr).width;
  font(ctx, px(CONTACT_TYPE.sub, u), FONT_MONO, '600');
  const subW = ctx.measureText(subStr).width;
  const hw = Math.max(titleW, subW) + hpad * 2;
  const hh = 66 * u;
  drawPanel(ctx, hx, hy, hw, hh, 'rgba(5, 10, 24, 0.9)', 'rgba(244, 63, 94, 0.45)');
  drawCornerAccents(ctx, hx, hy, hw, hh, 8 * u, 'rgba(244, 63, 94, 0.9)');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  font(ctx, px(CONTACT_TYPE.title, u), FONT_ARCADE, '800');
  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleStr, hx + hpad, hy + hh * 0.46);
  font(ctx, px(CONTACT_TYPE.sub, u), FONT_MONO, '600');
  ctx.fillStyle = '#fb7185';
  ctx.fillText(subStr, hx + hpad, hy + hh * 0.8);
}

// ---------------------------------------------------------------------------
// HARDWARE BOX MARKUP (bandeja inferior)
// ---------------------------------------------------------------------------
const SVG_STICK = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
  <rect x="6" y="30" width="36" height="10" rx="2" fill="currentColor" fill-opacity="0.18"/>
  <line x1="24" y1="30" x2="24" y2="16"/>
  <circle cx="24" cy="11" r="6" fill="#ef4444" stroke="#fca5a5"/>
  <circle cx="35" cy="35" r="2.2" fill="#3b82f6" stroke="none"/>
  <circle cx="30" cy="35" r="2.2" fill="#facc15" stroke="none"/>
  <circle cx="13" cy="35" r="2.2" fill="#ef4444" stroke="none"/>
</svg>`;
const SVG_CHIP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
  <rect x="4" y="4" width="16" height="16" rx="2"/>
  <rect x="8" y="8" width="8" height="8" fill="currentColor" fill-opacity="0.3"/>
  <path d="M1 9h3M1 15h3M20 9h3M20 15h3M9 1v3M15 1v3M9 20v3M15 20v3"/>
</svg>`;
const SVG_BADGE = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="8" y="10" width="32" height="30" rx="3"/>
  <rect x="20" y="4" width="8" height="8" rx="1.5" fill="currentColor" fill-opacity="0.35"/>
  <circle cx="18" cy="24" r="4.5" fill="currentColor" fill-opacity="0.3"/>
  <line x1="27" y1="21" x2="35" y2="21"/>
  <line x1="27" y1="27" x2="35" y2="27"/>
  <line x1="13" y1="34" x2="35" y2="34"/>
</svg>`;

function hardwareBox(inner, caption) {
  return `<div class="hw-box-inner">${inner}<span class="hw-caption">${caption}</span></div>`;
}

// ---------------------------------------------------------------------------
// CATALOGO
// ---------------------------------------------------------------------------
export const arcadeSystems = [
  {
    verticalTitle: "01. PLAYER 1 // VÍCTOR CÁRDENAS",
    trayTag: "ROM: BCN-DEV",
    trayBrand: "P1",
    badgeText: "PLAYER 1 // SPEC SHEET",
    themeColor: "#fbbf24",
    hardwareHtml: hardwareBox(`<div class="rom-cartridge"><span class="rom-notch"></span><span class="rom-label">ROM</span><span class="rom-code">BCN-DEV</span></div>`, 'ROM: BCN-DEV // PLAYER 1'),
    meta: {
      es: {
        role: "Gameplay Programmer",
        stack: "C++ / C# / Unity / Unreal Engine",
        focus: "Arquitectura de Motores, Gameplay & Audio (FMOD / Wwise)",
        statusLabel: "Base :",
        status: "Barcelona, España (BCN)"
      },
      en: {
        role: "Gameplay Programmer",
        stack: "C++ / C# / Unity / Unreal Engine",
        focus: "Engine Architecture, Gameplay & Game Audio (FMOD / Wwise)",
        statusLabel: "Base :",
        status: "Barcelona, Spain (BCN)"
      }
    },
    drawScene: drawPlayerOneScene
  },
  {
    verticalTitle: "02. THE FABLE OF THE ECLIPSE // LOOPIE",
    trayTag: "C++ ENGINE // FMOD CORE",
    trayBrand: "LOOP",
    badgeText: "C++ GAME & ENGINE // 3D ACTION RPG",
    themeColor: "#38bdf8",
    hardwareHtml: hardwareBox(`<img src="assets/loopie_logo.png" alt="LoopieEngine Logo" title="LoopieEngine C++" />`, 'C++ ENGINE // FMOD CORE'),
    meta: {
      es: {
        role: "Engine & Gameplay Systems Programmer",
        stack: "C++17/20 / FMOD Studio & Core / Mono C# / OpenGL 3.3",
        focus: "Audio Nativo (FMOD), Puente Mono C# & Máquinas de Estado HUD",
        status: "Lanzado en Itch.io // Motor C++ Propio"
      },
      en: {
        role: "Engine & Gameplay Systems Programmer",
        stack: "C++17/20 / FMOD Studio & Core / Mono C# / OpenGL 3.3",
        focus: "Native Audio (FMOD), Mono C# Bridge & HUD State Machines",
        status: "Released on Itch.io // Custom C++ Engine"
      }
    },
    drawScene: drawFableScene
  },
  {
    verticalTitle: "03. AVE PHOENIX // RETRO SHMUP",
    trayTag: "UNITY C# // ZERO-GC",
    trayBrand: "REGEN",
    badgeText: "UNITY // RETRO SHOOTER",
    themeColor: "#fb923c",
    hardwareHtml: hardwareBox(`<img src="assets/ave_phoenix_icon.png" alt="Ave Phoenix Icon" />`, 'UNITY C# // ZERO-GC'),
    meta: {
      es: {
        role: "Solo Game Developer & Programmer",
        stack: "Unity C# / UnityEngine.Pool / Decoupled FSM",
        focus: "Zero-GC Object Pooling, Boss FSM Multifase & Modo Historia",
        status: "Build Jugable // Optimizado para Móvil"
      },
      en: {
        role: "Solo Game Developer & Programmer",
        stack: "Unity C# / UnityEngine.Pool / Decoupled FSM",
        focus: "Zero-GC Object Pooling, Multi-phase Boss FSM & Story Mode",
        status: "Playable Build // Mobile Optimized"
      }
    },
    drawScene: drawPhoenixScene
  },
  {
    verticalTitle: "04. COMBAT & AI // FIGHTING GAMES",
    trayTag: "SANWA 6-BTN // R&D",
    trayBrand: "VS",
    badgeText: "HITBOX LAB // WIP",
    themeColor: "#c084fc",
    hardwareHtml: hardwareBox(`<span class="hw-icon text-purple-300">${SVG_STICK}</span>`, 'SANWA 6-BTN // R&D ROADMAP'),
    meta: {
      es: {
        role: "Gameplay Systems Researcher (I+D)",
        stack: "C++ / Unity C# / Behavior Trees / Finite State Machines",
        focus: "Hitbox Data desacoplada, Controllers de Inercia & Árboles IA",
        status: "Prototipos de combate en investigación activa"
      },
      en: {
        role: "Gameplay Systems Researcher (R&D)",
        stack: "C++ / Unity C# / Behavior Trees / Finite State Machines",
        focus: "Decoupled Hitbox Data, Inertia Controllers & AI Trees",
        status: "Combat prototypes in active research"
      }
    },
    drawScene: drawDojoScene
  },
  {
    verticalTitle: "05. GAMEPLAY SKILLS // C++, AUDIO & TOOLS",
    trayTag: "x86_64 // C++ CORE",
    trayBrand: "SKILL",
    badgeText: "SKILLS // GAMEPLAY LOADOUT",
    themeColor: "#38bdf8",
    hardwareHtml: hardwareBox(`<span class="hw-icon text-sky-400">${SVG_CHIP}</span>`, 'x86_64 // C++ CORE'),
    meta: {
      es: {
        role: "Systems & Engine Architect",
        stack: "C++17/20, C#, OpenGL 3.3, FMOD Core, Unity, Unreal, Git",
        focus: "Cache Locality, Heap/Stack Memory Profiling & Multithreading",
        status: "Competencias de Gameplay // C++, Audio & Herramientas"
      },
      en: {
        role: "Systems & Engine Architect",
        stack: "C++17/20, C#, OpenGL 3.3, FMOD Core, Unity, Unreal, Git",
        focus: "Cache Locality, Heap/Stack Memory Profiling & Multithreading",
        status: "Gameplay Skills // C++, Audio & Tools"
      }
    },
    drawScene: drawHardwareScene
  },
  {
    verticalTitle: "06. CONTACT & HELP // WORLD MAP",
    trayTag: "DEV BADGE // BCN",
    trayBrand: "HELP",
    badgeText: "MAP // COMM LINK",
    themeColor: "#f43f5e",
    hardwareHtml: hardwareBox(`<span class="hw-icon text-rose-400">${SVG_BADGE}</span>`, 'DEV BADGE // BCN'),
    meta: {
      es: {
        role: "Gameplay & Systems Programmer",
        stack: "victorcarhor@gmail.com | +34 623 187 320",
        focus: "Convenio de Prácticas Universitarias (CITM - UPC)",
        status: "Barcelona (BCN) · Presencial / Híbrido / Remoto // GitHub: Vixtorbir"
      },
      en: {
        role: "Gameplay & Systems Programmer",
        stack: "victorcarhor@gmail.com | +34 623 187 320",
        focus: "University Internship Agreement (CITM - UPC)",
        status: "Barcelona (BCN) · On-site / Hybrid / Remote // GitHub: Vixtorbir"
      }
    },
    drawScene: drawContactScene
  }
];

// Translations for UI labels
export const uiText = {
  es: {
    insert_coin_text: "INSERT COIN: P1 READY",
    cv_btn: "[CV PDF]",
    meta_role_lbl: "Rol :",
    meta_stack_lbl: "Tech Stack :",
    meta_focus_lbl: "Especialidad :",
    meta_status_lbl: "Estado :",
    bottom_main_menu: "MENÚ PRINCIPAL",
    bottom_scroll: "SCROLL PARA CAMBIAR",
    bottom_inspect: "INSPECCIONAR",
    screen_inspect_cta: "[ ↵ CLIC / ENTER: INSPECCIONAR ]",
    mobile_fallback_title: "EXPERIENCIA OPTIMIZADA PARA ESCRITORIO",
    mobile_fallback_msg: "Este cabinet arcade necesita una pantalla de 1024px de ancho o más para mostrarse sin recortes. Abre este portfolio en un ordenador de escritorio o portátil."
  },
  en: {
    insert_coin_text: "INSERT COIN: P1 READY",
    cv_btn: "[RESUME PDF]",
    meta_role_lbl: "Role :",
    meta_stack_lbl: "Tech Stack :",
    meta_focus_lbl: "Focus Area :",
    meta_status_lbl: "Status :",
    bottom_main_menu: "MAIN MENU",
    bottom_scroll: "SCROLL TO NAVIGATE",
    bottom_inspect: "INSPECT / SELECT",
    screen_inspect_cta: "[ ↵ CLICK / ENTER: INSPECT ]",
    mobile_fallback_title: "DESKTOP-OPTIMIZED EXPERIENCE",
    mobile_fallback_msg: "This arcade cabinet needs a screen at least 1024px wide to display without clipping. Please open this portfolio on a desktop or laptop computer."
  }
};
