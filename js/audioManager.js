/**
 * audioManager.js — Síntesis y Control de Web Audio API
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Todos los efectos de sonido del cabinet (tick de navegación, insert coin,
 * fanfarria de arranque) y el estado de mute. El AudioContext solo se crea
 * o reanuda tras una interacción directa del usuario, respetando las
 * políticas de autoplay del navegador.
 */

let audioCtx = null;
let isAudioActive = true;

function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioEnabled() {
  return isAudioActive;
}

export function toggleAudioSFX() {
  isAudioActive = !isAudioActive;
  return isAudioActive;
}

// Web Audio API Retro Arcade Sound Effects
export function playArcadeTick() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;

    // Mechanical click: Snappy high-frequency impulse + low cabinet resonance
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(680, t);
    osc1.frequency.exponentialRampToValueAtTime(110, t + 0.02);
    gain1.gain.setValueAtTime(0.06, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.022);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(240, t);
    osc2.frequency.exponentialRampToValueAtTime(60, t + 0.035);
    gain2.gain.setValueAtTime(0.07, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.038);
  } catch (e) {}
}

export function playCoinSound() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;
    // Classic dual-chime 987Hz -> 1318Hz coin insert sound!
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.setValueAtTime(0.12, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.46);
  } catch (e) {}
}

// Authentic Retro Arcade Start Fanfare (Coin drop + upbeat 8-bit startup arpeggio)
export function playArcadeStartSound() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;

    // 1. Coin Drop Chime (Dual chime B5 -> E6)
    const coinOsc = ctx.createOscillator();
    const coinGain = ctx.createGain();
    coinOsc.type = 'sine';
    coinOsc.frequency.setValueAtTime(987.77, t);
    coinOsc.frequency.setValueAtTime(1318.51, t + 0.07);
    coinGain.gain.setValueAtTime(0.12, t);
    coinGain.gain.setValueAtTime(0.12, t + 0.07);
    coinGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    coinOsc.connect(coinGain);
    coinGain.connect(ctx.destination);
    coinOsc.start(t);
    coinOsc.stop(t + 0.46);

    // 2. Upbeat 80s Retro Arcade Power-Up Arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const startTime = t + 0.14 + (i * 0.065);
      const noteOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      noteOsc.type = 'square';
      noteOsc.frequency.setValueAtTime(freq, startTime);
      noteGain.gain.setValueAtTime(0.08, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
      noteOsc.connect(noteGain);
      noteGain.connect(ctx.destination);
      noteOsc.start(startTime);
      noteOsc.stop(startTime + 0.13);
    });
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// SERVICE MENU (Modal de diagnóstico) — apertura / cierre
// Tonos square filtrados (lowpass) con rampas lineales: micro fade-in de 5 ms
// y fade-out hasta 0.0001 antes de stop() para evitar clicks/pops.
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

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.005);
  gain.gain.setValueAtTime(peak, startAt + duration * 0.55);
  gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.01);
}

// Apertura: dos notas ascendentes cortas (A4 -> E5) + zumbido grave de relé
export function playModalOpenSound() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;
    playFilteredTone(ctx, { freqStart: 440, freqEnd: 440, startAt: t, duration: 0.07, peak: 0.05, cutoff: 1800 });
    playFilteredTone(ctx, { freqStart: 659.25, freqEnd: 659.25, startAt: t + 0.075, duration: 0.11, peak: 0.055, cutoff: 2200 });
    playFilteredTone(ctx, { freqStart: 90, freqEnd: 70, startAt: t, duration: 0.16, peak: 0.035, cutoff: 500, type: 'triangle' });
  } catch (e) {}
}

// Cierre: nota descendente (E5 -> A4) breve y apagada
export function playModalCloseSound() {
  if (!isAudioActive) return;
  try {
    const ctx = ensureContext();
    const t = ctx.currentTime;
    playFilteredTone(ctx, { freqStart: 659.25, freqEnd: 440, startAt: t, duration: 0.12, peak: 0.045, cutoff: 1600 });
    playFilteredTone(ctx, { freqStart: 120, freqEnd: 60, startAt: t + 0.02, duration: 0.12, peak: 0.03, cutoff: 400, type: 'triangle' });
  } catch (e) {}
}
