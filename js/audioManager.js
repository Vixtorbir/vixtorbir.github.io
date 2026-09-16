/**
 * audioManager.js — Síntesis y Control de Web Audio API
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Todos los efectos de sonido del cabinet (tick de navegación, insert coin,
 * fanfarria de arranque, inspección) y el estado de mute persistido.
 *
 * Fase 4 — Audio limpio:
 *   - Bus master: cada efecto -> masterGain (0.85) -> limitador suave
 *     (DynamicsCompressor como brickwall blando) -> destination. Encadenar
 *     ticks en ráfaga o solapar coin + fanfarria ya no puede recortar (clip).
 *   - Cero clicks/pops: todo oscilador arranca en 0.0001, sube con una
 *     micro-rampa lineal de 2 ms y termina con rampa a 0.0001 ANTES de stop().
 *     Nunca se asigna gain.value = 0 en seco.
 *   - El AudioContext solo se crea o reanuda tras una interacción directa
 *     del usuario (políticas de autoplay).
 *   - Mute persistido en localStorage ('victor_portfolio_sfx': '1' | '0').
 */

const SFX_KEY = 'victor_portfolio_sfx';
const MASTER_GAIN = 0.85;
const ATTACK_S = 0.002;     // micro fade-in universal (2 ms)
const FLOOR = 0.0001;       // "silencio" para rampas exponenciales (nunca 0)

let audioCtx = null;
let masterGain = null;
let limiter = null;
let isAudioActive = true;

// ---------------------------------------------------------------------------
// Estado de mute (persistente)
// ---------------------------------------------------------------------------

/** Lee localStorage y fija el estado inicial. Devuelve true si el audio está activo. */
export function initAudioState() {
  try {
    isAudioActive = localStorage.getItem(SFX_KEY) !== '0';
  } catch (e) {
    isAudioActive = true;
  }
  return isAudioActive;
}

export function isAudioEnabled() {
  return isAudioActive;
}

export function setAudioEnabled(enabled) {
  isAudioActive = !!enabled;
  try { localStorage.setItem(SFX_KEY, isAudioActive ? '1' : '0'); } catch (e) {}
  return isAudioActive;
}

export function toggleAudioSFX() {
  return setAudioEnabled(!isAudioActive);
}

/** true si el AudioContext existe y no está suspendido por la política de autoplay */
export function isAudioContextRunning() {
  return !!audioCtx && audioCtx.state === 'running';
}

// ---------------------------------------------------------------------------
// Bus master
// ---------------------------------------------------------------------------
function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Limitador suave: umbral alto, rodilla ancha y ratio elevado. En uso
    // normal no actúa; solo frena los picos cuando varios efectos se solapan.
    limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 12;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = MASTER_GAIN;

    masterGain.connect(limiter);
    limiter.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Envolvente anti-pop estándar: 0.0001 -> peak en 2 ms, sostenido hasta
 * `holdUntil` y caída (exponencial o lineal) hasta 0.0001 en `endAt`.
 */
function envelope(gainParam, startAt, peak, holdUntil, endAt, exponential = true) {
  gainParam.setValueAtTime(FLOOR, startAt);
  gainParam.linearRampToValueAtTime(peak, startAt + ATTACK_S);
  if (holdUntil > startAt + ATTACK_S) gainParam.setValueAtTime(peak, holdUntil);
  if (exponential) gainParam.exponentialRampToValueAtTime(FLOOR, endAt);
  else gainParam.linearRampToValueAtTime(FLOOR, endAt);
}

/** Oscilador + gain conectados al bus master; stop() 2 ms después del fin de la rampa. */
function voice(ctx, type, startAt, endAt) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startAt);
  osc.stop(endAt + 0.002);
  return { osc, gain };
}

// ---------------------------------------------------------------------------
// Efectos
// ---------------------------------------------------------------------------

// Tick de navegación: impulso agudo (square) + resonancia grave del mueble (triangle)
export function playArcadeTick() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;

    const click = voice(ctx, 'square', t, t + 0.02);
    click.osc.frequency.setValueAtTime(680, t);
    click.osc.frequency.exponentialRampToValueAtTime(110, t + 0.02);
    envelope(click.gain.gain, t, 0.06, t, t + 0.02);

    const thump = voice(ctx, 'triangle', t, t + 0.035);
    thump.osc.frequency.setValueAtTime(240, t);
    thump.osc.frequency.exponentialRampToValueAtTime(60, t + 0.035);
    envelope(thump.gain.gain, t, 0.07, t, t + 0.035);
  } catch (e) {}
}

// Insert coin: doble campana B5 -> E6
export function playCoinSound() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;

    const v = voice(ctx, 'sine', t, t + 0.45);
    v.osc.frequency.setValueAtTime(987.77, t);
    v.osc.frequency.setValueAtTime(1318.51, t + 0.08);
    envelope(v.gain.gain, t, 0.12, t + 0.08, t + 0.45, false);
  } catch (e) {}
}

// Fanfarria de arranque: coin drop + arpegio power-up (C5 -> E5 -> G5 -> C6)
export function playArcadeStartSound() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;

    const coin = voice(ctx, 'sine', t, t + 0.45);
    coin.osc.frequency.setValueAtTime(987.77, t);
    coin.osc.frequency.setValueAtTime(1318.51, t + 0.07);
    envelope(coin.gain.gain, t, 0.12, t + 0.07, t + 0.45, false);

    const notes = [523.25, 659.25, 783.99, 1046.50];
    for (let i = 0; i < notes.length; i++) {
      const at = t + 0.14 + i * 0.065;
      const n = voice(ctx, 'square', at, at + 0.12);
      n.osc.frequency.setValueAtTime(notes[i], at);
      envelope(n.gain.gain, at, 0.08, at, at + 0.12, false);
    }
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// INSPECCIONAR — tonos square filtrados (lowpass) con rampas lineales
// ---------------------------------------------------------------------------
function playFilteredTone(ctx, { freqStart, freqEnd, startAt, duration, peak, cutoff, type = 'square' }) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startAt);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startAt + duration * 0.6);
  }

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, startAt);
  filter.Q.setValueAtTime(0.9, startAt);

  envelope(gain.gain, startAt, peak, startAt + duration * 0.55, startAt + duration, false);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.01);
}

// Dos notas ascendentes cortas (A4 -> E5) + zumbido grave de relé; suena
// durante el fundido del chasis antes de navegar a project.html
export function playInspectSound() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;
    playFilteredTone(ctx, { freqStart: 440, freqEnd: 440, startAt: t, duration: 0.07, peak: 0.05, cutoff: 1800 });
    playFilteredTone(ctx, { freqStart: 659.25, freqEnd: 659.25, startAt: t + 0.075, duration: 0.11, peak: 0.055, cutoff: 2200 });
    playFilteredTone(ctx, { freqStart: 90, freqEnd: 70, startAt: t, duration: 0.16, peak: 0.035, cutoff: 500, type: 'triangle' });
  } catch (e) {}
}
