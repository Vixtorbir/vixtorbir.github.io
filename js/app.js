/**
 * app.js — Inicializador, State Machine Principal y Router de Eventos
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Orquesta los módulos de catálogo (arcadeSystems), render (canvasRenderer)
 * y audio (audioManager): mantiene el estado de idioma/sistema activo,
 * actualiza el DOM y conecta los eventos de teclado, rueda del ratón y
 * los handlers invocados desde los atributos onclick de index.html.
 */

import { arcadeSystems, uiText, onAssetLoad } from './arcadeSystems.js';
import { initCanvasRenderer, renderScreenArtwork } from './canvasRenderer.js';
import { playArcadeTick, playCoinSound, toggleAudioSFX } from './audioManager.js';

let currentLang = 'es';
let activeSystemIndex = 0;
let isThrottled = false;

// Update the Left Side Info (Vertical title, Screen Badge, Hardware Box, Clear Metadata List)
function updateLeftDisplay() {
  const system = arcadeSystems[activeSystemIndex];
  if (!system) return;

  // 1. Vertical Title along the left border
  const vTitle = document.getElementById('vertical-title');
  if (vTitle) vTitle.textContent = system.verticalTitle;

  // 2. Top Screen Badge
  const badge = document.getElementById('screen-badge-text');
  if (badge) badge.textContent = system.badgeText;

  // 3. Personalized Hardware Box (Loads real image or SVG)
  const hwBox = document.getElementById('hardware-box');
  if (hwBox) hwBox.innerHTML = system.hardwareHtml;

  // 4. Metadata List Rows (Crystal-clear monospace typography)
  const meta = system.meta[currentLang];
  const metaRole = document.getElementById('meta-role');
  const metaStack = document.getElementById('meta-stack');
  const metaFocus = document.getElementById('meta-focus');
  const metaStatus = document.getElementById('meta-status');

  if (metaRole) metaRole.textContent = meta.role;
  if (metaStack) metaStack.textContent = meta.stack;
  if (metaFocus) metaFocus.textContent = meta.focus;
  if (metaStatus) metaStatus.textContent = meta.status;

  // 5. Draw Canvas Scene
  renderScreenArtwork(activeSystemIndex);
}

// Update the Curved Wheel Logos
function updateLogosView() {
  const items = document.querySelectorAll('.system-logo-item');
  const total = items.length;

  items.forEach(item => {
    const idx = parseInt(item.getAttribute('data-index'), 10);

    let diff = (idx - activeSystemIndex) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    item.className = 'system-logo-item';

    if (diff === 0) {
      item.classList.add('active');
    } else if (diff === -1) {
      item.classList.add('pos--1');
    } else if (diff === 1) {
      item.classList.add('pos-1');
    } else if (diff === -2) {
      item.classList.add('pos--2');
    } else if (diff === 2) {
      item.classList.add('pos-2');
    } else {
      item.classList.add('pos-hidden');
    }
  });

  updateLeftDisplay();
}

function navigateSystem(delta) {
  const total = arcadeSystems.length;
  activeSystemIndex = (activeSystemIndex + delta + total) % total;
  playArcadeTick();
  updateLogosView();
}

function selectSystem(index) {
  if (activeSystemIndex === index) return;
  activeSystemIndex = index;
  playArcadeTick();
  updateLogosView();
}

// Language Switcher
function setLanguage(lang) {
  if (!uiText[lang]) return;
  currentLang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (uiText[lang][key]) {
      el.innerHTML = uiText[lang][key];
    }
  });

  const btnEn = document.getElementById('lang-btn-en');
  const btnEs = document.getElementById('lang-btn-es');
  if (lang === 'en') {
    btnEn?.classList.add('active');
    btnEs?.classList.remove('active');
    document.documentElement.lang = 'en';
  } else {
    btnEs?.classList.add('active');
    btnEn?.classList.remove('active');
    document.documentElement.lang = 'es';
  }

  updateLeftDisplay();
  localStorage.setItem('victor_portfolio_lang', lang);
}

function handleToggleAudioSFX() {
  const active = toggleAudioSFX();
  const label = document.getElementById('sfx-label');
  if (label) label.textContent = active ? '🔊 SFX' : '🔇 MUTE';
}

// Global window exposure for inline onclick handlers in index.html
window.playCoinSound = playCoinSound;
window.setLanguage = setLanguage;
window.toggleAudioSFX = handleToggleAudioSFX;
window.selectSystem = selectSystem;

// ---------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const canvasEl = document.getElementById('media-canvas');
  initCanvasRenderer(canvasEl);

  // Repaint the active scene whenever a lazily-loaded scene asset finishes loading
  onAssetLoad(() => renderScreenArtwork(activeSystemIndex));

  const savedLang = localStorage.getItem('victor_portfolio_lang');
  if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
    setLanguage(savedLang);
  } else {
    setLanguage('es');
  }

  updateLogosView();

  // Resize canvas when window resizes
  window.addEventListener('resize', () => {
    renderScreenArtwork(activeSystemIndex);
  });

  // Mouse Wheel navigation anywhere on screen
  window.addEventListener('wheel', (e) => {
    if (isThrottled) return;
    isThrottled = true;

    if (e.deltaY > 0) {
      navigateSystem(1);
    } else if (e.deltaY < 0) {
      navigateSystem(-1);
    }

    setTimeout(() => {
      isThrottled = false;
    }, 160);
  }, { passive: true });

  // Keyboard Navigation (Arrow keys, W / S)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      navigateSystem(1);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      navigateSystem(-1);
    }
  });
});
