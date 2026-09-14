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
const fableArtImg = preload('assets/fable_eclipse_art.png');
const miniKnightImg = preload('assets/mini_knight.png');
const phoenixImg = preload('assets/phoenix_pixel_art.png');

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
// ESCENA 1 — THE FABLE OF THE ECLIPSE // LOOPIE ENGINE (osciloscopio FMOD)
// ---------------------------------------------------------------------------
const fableCache = { w: 0, h: 0, vignette: null };

function drawFableScene(ctx, w, h, t) {
  const u = unit(w, h);
  if (fableCache.w !== w || fableCache.h !== h) {
    fableCache.w = w; fableCache.h = h;
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    v.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    fableCache.vignette = v;
  }

  if (ready(fableArtImg)) {
    ctx.drawImage(fableArtImg, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#1f1035';
    ctx.fillRect(0, 0, w, h);
    drawJaggedMountains(ctx, w, h, 0.52, '#2b0f19', 40);
    drawJaggedMountains(ctx, w, h, 0.70, '#120509', 55);
  }
  ctx.fillStyle = fableCache.vignette;
  ctx.fillRect(0, 0, w, h);

  // Panel de osciloscopio FMOD (banda inferior)
  const panelH = h * 0.26;
  const panelY = h - panelH - h * 0.05;
  const panelX = w * 0.3;
  const panelW = w * 0.66;
  drawPanel(ctx, panelX, panelY, panelW, panelH, 'rgba(3, 6, 13, 0.78)', 'rgba(251, 191, 36, 0.55)');
  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX, panelY, panelW, panelH);
  ctx.clip();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = panelX; gx < panelX + panelW; gx += 18 * u) { ctx.moveTo(gx, panelY); ctx.lineTo(gx, panelY + panelH); }
  for (let gy = panelY; gy < panelY + panelH; gy += 18 * u) { ctx.moveTo(panelX, gy); ctx.lineTo(panelX + panelW, gy); }
  ctx.stroke();

  const mid = panelY + panelH * 0.55;
  const waves = [
    { amp: panelH * 0.22, freq: 0.045, speed: 5.2, color: '#fbbf24', width: 2.2 },
    { amp: panelH * 0.12, freq: 0.09, speed: 8.1, color: 'rgba(253, 224, 71, 0.75)', width: 1.4 },
    { amp: panelH * 0.07, freq: 0.16, speed: 12.5, color: 'rgba(245, 158, 11, 0.45)', width: 1 }
  ];
  for (let k = 0; k < waves.length; k++) {
    const wv = waves[k];
    ctx.strokeStyle = wv.color;
    ctx.lineWidth = wv.width;
    ctx.shadowColor = wv.color;
    ctx.shadowBlur = k === 0 ? 8 : 0;
    ctx.beginPath();
    for (let x = 0; x <= panelW; x += 3) {
      const env = 0.65 + 0.35 * Math.sin(x * 0.012 + t * 1.7);
      const y = mid + Math.sin(x * wv.freq - t * wv.speed) * wv.amp * env;
      if (x === 0) ctx.moveTo(panelX + x, y); else ctx.lineTo(panelX + x, y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  font(ctx, 8 * u, FONT_PIXEL);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('FMOD CORE // SPATIAL AUDIO BUS', panelX + 10 * u, panelY + 14 * u);
  font(ctx, 8.5 * u, FONT_MONO, '600');
  ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
  ctx.textAlign = 'right';
  ctx.fillText(`COMMIT e3b2d96 // ${blink(t, 1) ? 'REC' : '   '} ${(44.1).toFixed(1)}kHz`, panelX + panelW - 10 * u, panelY + 14 * u);

  // Sprite del MiniKnight en primer plano
  if (ready(miniKnightImg)) {
    const kh = h * 0.5;
    const bob = Math.sin(t * 2.2) * 3 * u;
    drawContain(ctx, miniKnightImg, w * 0.04, h - kh - h * 0.11 + bob, w * 0.24, kh, false);
  }

  // Telemetria del motor (panel oscuro para leerse sobre el artwork claro)
  const tx = w * 0.04;
  const ty = h * 0.13;
  const tw = w * 0.62;
  const th = h * 0.13;
  drawPanel(ctx, tx, ty, tw, th, 'rgba(3, 6, 13, 0.78)', 'rgba(56, 189, 248, 0.5)');
  font(ctx, 9.5 * u, FONT_ARCADE, '700');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('LOOPIE ENGINE (C++17, OPENGL 3.3, NATIVE FMOD) // ZERO MEMORY LEAKS', tx + 10 * u, ty + th * 0.42);
  font(ctx, 8.5 * u, FONT_MONO, '600');
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText('THE FABLE OF THE ECLIPSE // 3D ACTION RPG // MONO C# BRIDGE // HUD FSM', tx + 10 * u, ty + th * 0.78);
}

// ---------------------------------------------------------------------------
// ESCENA 2 — AVE PHOENIX REGEN (starfield continuo + formacion)
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
const PHOENIX_LINES = [
  'HEAP ALLOCATION: 0 B/FRAME (ZERO-GC OBJECT POOLING)',
  'GAME MODES: STORY (FAMILY TRIBUTE) + INFINITE ARCADE WAVES',
  'BOSS FSM: MULTI-PHASE ARCHITECTURE'
];

function drawPhoenixScene(ctx, w, h, t) {
  const u = unit(w, h);
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, w, h);

  // Nebulosa tenue
  ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.beginPath();
  ctx.ellipse(w * 0.7, h * 0.35, w * 0.35, h * 0.3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    const x = ((s.x - t * s.speed) % 1 + 1) % 1;
    const twinkle = 0.55 + 0.45 * Math.sin(t * 3 + s.phase);
    ctx.globalAlpha = twinkle;
    ctx.fillRect(x * w, s.y * h, s.size * u, s.size * u);
  }
  ctx.globalAlpha = 1;

  // Formacion: lider + dos escoltas atras
  if (ready(phoenixImg)) {
    const lead = Math.min(w * 0.24, h * 0.34);
    const wing = lead * 0.62;
    const cx = w * 0.62;
    const cy = h * 0.42 + Math.sin(t * 1.8) * 6 * u;
    ctx.save();
    ctx.shadowColor = 'rgba(249, 115, 22, 0.9)';
    ctx.shadowBlur = 20 * u;
    drawContain(ctx, phoenixImg, cx + lead * 0.35, cy - wing / 2 - lead * 0.55 + Math.sin(t * 2.4 + 1) * 4 * u, wing, wing, true);
    drawContain(ctx, phoenixImg, cx + lead * 0.35, cy - wing / 2 + lead * 0.55 + Math.sin(t * 2.4 + 2) * 4 * u, wing, wing, true);
    drawContain(ctx, phoenixImg, cx - lead / 2, cy - lead / 2, lead, lead, true);
    ctx.restore();

    // Estelas de propulsion
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const ty = cy - 10 * u + k * 10 * u;
      const len = (40 + 25 * Math.sin(t * 9 + k)) * u;
      ctx.moveTo(cx + lead * 0.5, ty);
      ctx.lineTo(cx + lead * 0.5 + len, ty);
    }
    ctx.stroke();
  }

  // Panel de telemetria
  const px = w * 0.04;
  const py = h * 0.66;
  const pw = w * 0.56;
  const ph = h * 0.2;
  drawPanel(ctx, px, py, pw, ph, 'rgba(3, 6, 13, 0.8)', 'rgba(56, 189, 248, 0.5)');
  font(ctx, 8 * u, FONT_PIXEL);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fb923c';
  ctx.fillText('AVE PHOENIX REGEN // UNITY C#', px + 10 * u, py + 16 * u);
  font(ctx, 9.5 * u, FONT_MONO, '600');
  ctx.fillStyle = '#7dd3fc';
  for (let i = 0; i < PHOENIX_LINES.length; i++) {
    ctx.fillText('> ' + PHOENIX_LINES[i], px + 10 * u, py + 36 * u + i * 17 * u);
  }

  font(ctx, 9 * u, FONT_PIXEL);
  ctx.fillStyle = blink(t, 1) ? '#fde047' : 'rgba(253, 224, 71, 0.3)';
  ctx.textAlign = 'right';
  ctx.fillText('1UP  ' + String(Math.floor(t * 137) % 999999).padStart(6, '0'), w * 0.96, h * 0.09);
  ctx.textAlign = 'left';
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
// ESCENA 4 — HARDWARE & SKILLS (jerarquia de memoria + nodos)
// ---------------------------------------------------------------------------
const MEM_STAGES = [
  { title: 'CPU CACHE', sub: 'L1 / L2 · CACHE LOCALITY', color: '#38bdf8' },
  { title: 'RAM', sub: 'DATA-ORIENTED LAYOUT', color: '#a855f7' },
  { title: 'GPU PIPELINE', sub: '60 FPS · OPENGL 3.3', color: '#fbbf24' }
];
const SKILL_NODES = [
  { name: 'C++17/20', color: '#38bdf8' },
  { name: 'C#', color: '#a855f7' },
  { name: 'OPENGL 3.3', color: '#34d399' },
  { name: 'FMOD CORE', color: '#f43f5e' },
  { name: 'UNITY', color: '#f8fafc' },
  { name: 'UNREAL', color: '#fbbf24' },
  { name: 'GIT', color: '#fb923c' }
];

function drawHardwareScene(ctx, w, h, t) {
  const u = unit(w, h);
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);
  drawFineGrid(ctx, w, h, 40 * u, 'rgba(56, 189, 248, 0.05)');

  font(ctx, 8 * u, FONT_PIXEL);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('MEMORY HIERARCHY // x86_64', w * 0.04, h * 0.15);

  // Etapas de memoria
  const stageW = w * 0.24;
  const stageH = h * 0.2;
  const gap = (w * 0.92 - stageW * 3) / 2;
  const sy = h * 0.2;
  for (let i = 0; i < MEM_STAGES.length; i++) {
    const st = MEM_STAGES[i];
    const sx = w * 0.04 + i * (stageW + gap);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.5 - i * 1.1);
    ctx.save();
    ctx.shadowColor = st.color;
    ctx.shadowBlur = (6 + 10 * pulse) * u;
    drawPanel(ctx, sx, sy, stageW, stageH, 'rgba(15, 23, 42, 0.92)', st.color);
    ctx.restore();
    ctx.strokeStyle = st.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 0.5, sy + 0.5, stageW - 1, stageH - 1);
    font(ctx, 12 * u, FONT_ARCADE, '800');
    ctx.fillStyle = st.color;
    ctx.textAlign = 'center';
    ctx.fillText(st.title, sx + stageW / 2, sy + stageH * 0.45);
    font(ctx, 7.5 * u, FONT_MONO, '600');
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(st.sub, sx + stageW / 2, sy + stageH * 0.75);

    if (i < MEM_STAGES.length - 1) {
      const ax = sx + stageW;
      const ay = sy + stageH / 2;
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6 * u, 5 * u]);
      ctx.lineDashOffset = -t * 40;
      ctx.beginPath();
      ctx.moveTo(ax + 4, ay);
      ctx.lineTo(ax + gap - 8, ay);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(ax + gap - 8, ay - 6 * u);
      ctx.lineTo(ax + gap, ay);
      ctx.lineTo(ax + gap - 8, ay + 6 * u);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Nodos de tecnologia (arco inferior conectado)
  const ny = h * 0.7;
  const spanX = w * 0.86;
  const startX = w * 0.07;
  const step = spanX / (SKILL_NODES.length - 1);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < SKILL_NODES.length; i++) {
    const nx = startX + i * step;
    const arc = Math.sin((i / (SKILL_NODES.length - 1)) * Math.PI) * h * 0.08;
    const y = ny - arc;
    if (i === 0) ctx.moveTo(nx, y); else ctx.lineTo(nx, y);
  }
  ctx.stroke();
  // bus hacia la RAM
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
  ctx.setLineDash([3 * u, 6 * u]);
  ctx.lineDashOffset = t * 30;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, sy + stageH);
  ctx.lineTo(w * 0.5, ny - h * 0.08 - 18 * u);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < SKILL_NODES.length; i++) {
    const node = SKILL_NODES[i];
    const nx = startX + i * step;
    const arc = Math.sin((i / (SKILL_NODES.length - 1)) * Math.PI) * h * 0.08;
    const y = ny - arc;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.9);
    const r = (15 + 3 * pulse) * u;
    ctx.save();
    ctx.shadowColor = node.color;
    ctx.shadowBlur = (8 + 14 * pulse) * u;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = node.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3 + t * 0.25;
      const px = nx + r * Math.cos(ang);
      const py = y + r * Math.sin(ang);
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    font(ctx, 8.5 * u, FONT_ARCADE, '800');
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, nx, y + r + 14 * u);
  }

  font(ctx, 8.5 * u, FONT_MONO, '600');
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText('HEAP / STACK PROFILING · MULTITHREADING · RAII · ZERO-ALLOCATION LOOPS', w * 0.5, h * 0.93);
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------------------
// ESCENA 5 — CONTACT & HELP (radar BCN + terminal)
// ---------------------------------------------------------------------------
const CONTACT_LINES = [
  ['BASE', 'BARCELONA, SPAIN (BCN)'],
  ['STATUS', 'LOOKING FOR JOBS // GAMEPLAY & SYSTEMS'],
  ['PHONE', '+34 623 187 320'],
  ['EMAIL', 'victorcarhor@gmail.com'],
  ['GITHUB', 'github.com/Vixtorbir'],
  ['LINKEDIN', 'linkedin.com/in/victor-cardenas-gamedev']
];

function drawContactScene(ctx, w, h, t) {
  const u = unit(w, h);
  ctx.fillStyle = '#0a0507';
  ctx.fillRect(0, 0, w, h);
  drawFineGrid(ctx, w, h, 30 * u, 'rgba(244, 63, 94, 0.06)');

  // Radar centrado en BCN (mitad izquierda)
  const rx = w * 0.27;
  const ry = h * 0.52;
  const rr = Math.min(w * 0.22, h * 0.36);
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.28)';
  ctx.lineWidth = 1;
  for (let k = 1; k <= 4; k++) {
    ctx.beginPath();
    ctx.arc(rx, ry, rr * k / 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(rx - rr, ry); ctx.lineTo(rx + rr, ry);
  ctx.moveTo(rx, ry - rr); ctx.lineTo(rx, ry + rr);
  ctx.stroke();
  // barrido
  const sweep = t * 1.6;
  ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.arc(rx, ry, rr, sweep - 0.5, sweep);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx, ry);
  ctx.lineTo(rx + Math.cos(sweep) * rr, ry + Math.sin(sweep) * rr);
  ctx.stroke();
  // blip BCN
  const blipPulse = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = (6 + 10 * blipPulse) * u;
  ctx.beginPath();
  ctx.arc(rx + rr * 0.18, ry + rr * 0.12, (3 + 1.5 * blipPulse) * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  font(ctx, 7 * u, FONT_PIXEL);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('BCN', rx + rr * 0.18 + 8 * u, ry + rr * 0.12 - 6 * u);
  font(ctx, 7.5 * u, FONT_MONO, '600');
  ctx.fillStyle = 'rgba(253, 164, 175, 0.8)';
  ctx.textAlign = 'center';
  ctx.fillText('41.38N 2.17E', rx, ry + rr + 16 * u);

  // Terminal (mitad derecha)
  const px = w * 0.52;
  const py = h * 0.12;
  const pw = w * 0.44;
  const ph = h * 0.76;
  drawPanel(ctx, px, py, pw, ph, 'rgba(3, 6, 13, 0.82)', 'rgba(244, 63, 94, 0.6)');
  drawCornerBrackets(ctx, px - 4, py - 4, pw + 8, ph + 8, 12 * u, '#f43f5e', 2);
  font(ctx, 8 * u, FONT_PIXEL);
  ctx.textAlign = 'left';
  ctx.fillStyle = blink(t, 1.2) ? '#f43f5e' : '#fda4af';
  ctx.fillText('>>> COMM LINK // BCN <<<', px + 12 * u, py + 20 * u);
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.beginPath();
  ctx.moveTo(px + 12 * u, py + 30 * u);
  ctx.lineTo(px + pw - 12 * u, py + 30 * u);
  ctx.stroke();

  const lineH = (ph - 50 * u) / CONTACT_LINES.length;
  for (let i = 0; i < CONTACT_LINES.length; i++) {
    const y = py + 44 * u + i * lineH + lineH * 0.35;
    font(ctx, 8 * u, FONT_MONO, '700');
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('[ ' + CONTACT_LINES[i][0] + ' ]', px + 12 * u, y);
    font(ctx, 9 * u, FONT_MONO, '600');
    ctx.fillStyle = i === 1 ? '#fde047' : '#ffffff';
    ctx.fillText(CONTACT_LINES[i][1], px + 12 * u, y + 13 * u);
  }

  // cursor de terminal
  if (blink(t, 0.9)) {
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(px + 12 * u, py + ph - 16 * u, 7 * u, 10 * u);
  }
  ctx.textAlign = 'left';
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
        status: "3D Action RPG + Motor C++ propio (LoopieEngine)"
      },
      en: {
        role: "Engine & Gameplay Systems Programmer",
        stack: "C++17/20 / FMOD Studio & Core / Mono C# / OpenGL 3.3",
        focus: "Native Audio (FMOD), Mono C# Bridge & HUD State Machines",
        status: "3D Action RPG + Custom C++ Engine (LoopieEngine)"
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
    hardwareHtml: hardwareBox(`<img src="assets/phoenix_pixel_art.png" class="pixelated" alt="Ave Phoenix Pixel Art" />`, 'UNITY C# // ZERO-GC'),
    meta: {
      es: {
        role: "Solo Game Developer & Programmer",
        stack: "Unity C# / UnityEngine.Pool / Decoupled FSM",
        focus: "Zero-GC Object Pooling, Boss FSM Multifase & Modo Historia",
        status: "Juego completo jugable en Unity"
      },
      en: {
        role: "Solo Game Developer & Programmer",
        stack: "Unity C# / UnityEngine.Pool / Decoupled FSM",
        focus: "Zero-GC Object Pooling, Multi-phase Boss FSM & Story Mode",
        status: "Complete playable Unity title"
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
    verticalTitle: "05. HARDWARE & SKILLS // C++ ENGINE",
    trayTag: "x86_64 // C++ CORE",
    trayBrand: "SKILL",
    badgeText: "SKILLS // MEMORY HIERARCHY",
    themeColor: "#38bdf8",
    hardwareHtml: hardwareBox(`<span class="hw-icon text-sky-400">${SVG_CHIP}</span>`, 'x86_64 // C++ CORE'),
    meta: {
      es: {
        role: "Systems & Engine Architect",
        stack: "C++17/20, C#, OpenGL 3.3, FMOD Core, Unity, Unreal, Git",
        focus: "Cache Locality, Heap/Stack Memory Profiling & Multithreading",
        status: "Competencias técnicas validadas en producción"
      },
      en: {
        role: "Systems & Engine Architect",
        stack: "C++17/20, C#, OpenGL 3.3, FMOD Core, Unity, Unreal, Git",
        focus: "Cache Locality, Heap/Stack Memory Profiling & Multithreading",
        status: "Technical competencies validated in production"
      }
    },
    drawScene: drawHardwareScene
  },
  {
    verticalTitle: "06. CONTACT & HELP // HIRE INQUIRIES",
    trayTag: "DEV BADGE // BCN",
    trayBrand: "HELP",
    badgeText: "COMM LINK // BCN",
    themeColor: "#f43f5e",
    hardwareHtml: hardwareBox(`<span class="hw-icon text-rose-400">${SVG_BADGE}</span>`, 'DEV BADGE // BCN'),
    meta: {
      es: {
        role: "Gameplay & Systems Programmer",
        stack: "victorcarhor@gmail.com | +34 623 187 320",
        focus: "LOOKING FOR JOBS // Gameplay & Systems",
        status: "Barcelona (BCN) // GitHub: Vixtorbir // LinkedIn abierto"
      },
      en: {
        role: "Gameplay & Systems Programmer",
        stack: "victorcarhor@gmail.com | +34 623 187 320",
        focus: "LOOKING FOR JOBS // Gameplay & Systems",
        status: "Barcelona (BCN) // GitHub: Vixtorbir // LinkedIn open"
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
