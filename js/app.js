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
import { initCanvasRenderer, renderScreenArtwork, resizeCanvas, startRenderLoop } from './canvasRenderer.js';
import { playArcadeTick, playCoinSound, playArcadeStartSound, toggleAudioSFX } from './audioManager.js';
import { initSpecModal, openSpecModal, isSpecModalOpen, refreshSpecModal } from './specModal.js';

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

  // 3. Personalized Hardware Box (Loads real image or SVG) + tray chassis tags
  const hwBox = document.getElementById('hardware-box');
  if (hwBox) hwBox.innerHTML = system.hardwareHtml;

  const trayTag = document.getElementById('tray-tag');
  if (trayTag) trayTag.textContent = system.trayTag;
  const trayBrand = document.getElementById('tray-brand');
  if (trayBrand) trayBrand.textContent = system.trayBrand;

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

  // Decal de la pantalla: refleja el estado del sistema activo en el idioma actual
  const decal = document.getElementById('screen-decal-text');
  if (decal) decal.textContent = meta.status;

  // La 4a fila puede renombrarse por sistema (p. ej. "Base :" en Player 1)
  const statusLabel = document.querySelector('[data-i18n="meta_status_lbl"]');
  if (statusLabel) statusLabel.textContent = meta.statusLabel || uiText[currentLang].meta_status_lbl;

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
  refreshSpecModal(lang);
  localStorage.setItem('victor_portfolio_lang', lang);
}

// Service Menu: abre la ficha técnica del sistema activo
function inspectSystem(trigger) {
  if (isSpecModalOpen()) return;
  openSpecModal(activeSystemIndex, currentLang, trigger);
}

let chassisPulseTimer = null;

function pulseChassis() {
  const chassis = document.querySelector('.arcade-viewport-env');
  if (!chassis) return;
  chassis.classList.remove('chassis-pulse');
  void chassis.offsetWidth; // reinicia la animacion si se pulsa en rafaga
  chassis.classList.add('chassis-pulse');
  // Timeout en vez de animationend: con prefers-reduced-motion la animacion
  // es none y el evento nunca llega, dejando la clase pegada.
  clearTimeout(chassisPulseTimer);
  chassisPulseTimer = setTimeout(() => chassis.classList.remove('chassis-pulse'), 500);
}

function goToMainMenu() {
  if (activeSystemIndex === 0) {
    playCoinSound();
  } else {
    activeSystemIndex = 0;
    playArcadeStartSound();
    updateLogosView();
  }
  pulseChassis();
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
window.goToMainMenu = goToMainMenu;
window.inspectSystem = inspectSystem;

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

  startRenderLoop();

  // Service Menu (modal de diagnóstico): disparadores de apertura
  initSpecModal({ onLanguageChange: setLanguage });
  const screenViewport = document.querySelector('.scifi-screen-viewport');
  if (screenViewport) {
    screenViewport.addEventListener('click', () => inspectSystem(screenViewport));
    screenViewport.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inspectSystem(screenViewport);
      }
    });
  }
  const inspectBtn = document.getElementById('inspect-btn');
  if (inspectBtn) inspectBtn.addEventListener('click', () => inspectSystem(inspectBtn));

  // Resize canvas when window resizes
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Mouse Wheel navigation anywhere on screen
  window.addEventListener('wheel', (e) => {
    if (isThrottled || isSpecModalOpen()) return;
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
    if (isSpecModalOpen()) return;

    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      navigateSystem(1);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      navigateSystem(-1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      // ENTER / ESPACIO global: no interceptar si el foco está sobre un control
      // (botones de idioma, mute, CV, enlaces...) para no romper su activación
      const el = document.activeElement;
      const tag = el?.tagName;
      const isControl = tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || el?.isContentEditable;
      if (isControl && el !== document.body) return;
      e.preventDefault();
      inspectSystem(document.querySelector('.scifi-screen-viewport'));
    }
  });
});
