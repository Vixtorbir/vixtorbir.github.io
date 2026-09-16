/**
 * app.js — Inicializador, State Machine Principal y Router de Eventos
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Orquesta los módulos de catálogo (arcadeSystems), render (canvasRenderer)
 * y audio (audioManager): mantiene el estado de idioma/sistema activo,
 * actualiza el DOM y conecta los eventos de teclado, rueda del ratón y
 * los handlers invocados desde los atributos onclick de index.html.
 * INSPECCIONAR navega a la ficha técnica dedicada (project.html?system=N).
 * Fase 4: mandos (gamepadManager) con feedback en los Sanwa y OSD en el tubo.
 */

import { arcadeSystems, uiText, onAssetLoad } from './arcadeSystems.js';
import { initCanvasRenderer, renderScreenArtwork, resizeCanvas, startRenderLoop } from './canvasRenderer.js';
import { playArcadeTick, playCoinSound, playArcadeStartSound, playInspectSound, toggleAudioSFX, initAudioState, isAudioContextRunning } from './audioManager.js';
import { initGamepad, describeGamepad } from './gamepadManager.js';

const LANG_KEY = 'victor_portfolio_lang';
const SYSTEM_KEY = 'victor_portfolio_system';

let currentLang = 'es';
let activeSystemIndex = 0;
let isLeaving = false; // true mientras se transiciona hacia project.html

// ---------------------------------------------------------
// GAME FEEL (Fase 3): cadencia de la ruleta + controles hapticos del panel
// ---------------------------------------------------------

// Cadencia minima entre saltos de sistema. 220ms deja ver el frenado
// elastico (0.52s de transicion, el overshoot ocurre en los primeros ~250ms)
// sin que una rafaga de wheel o el auto-repeat del teclado encadene saltos.
const NAV_COOLDOWN_MS = 220;
// Umbral de deltaY: trackpads emiten eventos de 1-4px de inercia residual
// que no deben contar como "un clic de rueda".
const WHEEL_THRESHOLD = 10;
// Tiempos de feedback haptico visible (perceptibles a simple vista)
const SANWA_PRESS_MS = 320;   // boton hundido + halo neon de microswitch
// Retardo antes de saltar a project.html: deja ver el halo dorado del boton
// amarillo y el zoom del chasis (transicion is-leaving) antes de descargar.
const INSPECT_LEAVE_MS = 260;
// Bandera que project.js deja al volver al arcade para sonar la fanfarria
const RETURN_SFX_KEY = 'arcade_play_return_sfx';
let navCooldownUntil = 0;

const sanwaTimers = new Map(); // buttonEl -> timeout id

/**
 * Ilumina y hunde un boton Sanwa del panel (clase .is-pressed) durante
 * SANWA_PRESS_MS, con reinicio del destello si se pulsa en rafaga.
 * @param {HTMLElement|null} btn  contenedor .panel-action del boton
 */
function pressSanwa(btn) {
  if (!btn) return;
  btn.classList.remove('is-pressed');
  void btn.offsetWidth; // fuerza reflow para reiniciar animacion
  btn.classList.add('is-pressed');
  clearTimeout(sanwaTimers.get(btn));
  sanwaTimers.set(btn, setTimeout(() => btn.classList.remove('is-pressed'), SANWA_PRESS_MS));
}

/**
 * Sonido de retorno desde project.html. La bandera llega por sessionStorage
 * y/o `return=1` en la query (el parametro se limpia de la URL). Si el
 * navegador bloquea el autoplay (AudioContext suspendido), la fanfarria se
 * engancha al primer gesto del usuario.
 */
function checkReturnSound() {
  const params = new URLSearchParams(window.location.search);
  const returnedFromProject = sessionStorage.getItem(RETURN_SFX_KEY) === '1' || params.has('return');
  if (!returnedFromProject) return;

  sessionStorage.removeItem(RETURN_SFX_KEY);
  if (params.has('return')) {
    params.delete('return');
    const q = params.toString();
    history.replaceState(null, '', q ? `${window.location.pathname}?${q}` : window.location.pathname);
  }

  playArcadeStartSound();
  if (isAudioContextRunning()) return;

  const playOnce = () => {
    window.removeEventListener('pointerdown', playOnce);
    window.removeEventListener('keydown', playOnce);
    playArcadeStartSound();
  };
  window.addEventListener('pointerdown', playOnce, { once: true });
  window.addEventListener('keydown', playOnce, { once: true });
}

/**
 * Puerta de cadencia compartida por wheel y teclado. Devuelve true si el
 * salto se acepta y arma el cooldown; false si llega dentro de la ventana.
 */
function acceptNavigation() {
  const now = performance.now();
  if (isLeaving || now < navCooldownUntil) return false;
  navCooldownUntil = now + NAV_COOLDOWN_MS;
  return true;
}

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
  localStorage.setItem(SYSTEM_KEY, String(activeSystemIndex));
  playArcadeTick();
  pressSanwa(document.getElementById('scroll-btn'));
  updateLogosView();
}

function selectSystem(index) {
  if (activeSystemIndex === index) return;
  activeSystemIndex = index;
  localStorage.setItem(SYSTEM_KEY, String(activeSystemIndex));
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
  localStorage.setItem(LANG_KEY, lang);
}

// INSPECCIONAR: navega a la ficha técnica dedicada (project.html?system=N).
// Breve fundido del chasis antes de cambiar de página para que la transición
// se sienta como un "zoom" a la pantalla y no como un corte seco.
function inspectSystem() {
  if (isLeaving) return;
  isLeaving = true;
  localStorage.setItem(SYSTEM_KEY, String(activeSystemIndex));
  playInspectSound();
  // El boton amarillo se ilumina en dorado antes de que el chasis haga el zoom
  pressSanwa(document.getElementById('inspect-btn'));

  const target = 'project.html?system=' + activeSystemIndex;
  const chassis = document.querySelector('.arcade-viewport-env');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!chassis || reduced) {
    window.location.href = target;
    return;
  }
  chassis.classList.add('is-leaving');
  setTimeout(() => { window.location.href = target; }, INSPECT_LEAVE_MS);
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
  pressSanwa(document.getElementById('main-menu-btn'));
  if (activeSystemIndex === 0) {
    playCoinSound();
  } else {
    activeSystemIndex = 0;
    playArcadeStartSound();
    updateLogosView();
  }
  pulseChassis();
}

/** Refleja el estado de audio en el botón de la barra superior */
function renderAudioState(active) {
  const label = document.getElementById('sfx-label');
  if (label) label.textContent = active ? '🔊 SFX' : '🔇 MUTE';
  const btn = document.getElementById('sfx-toggle-btn');
  if (btn) btn.setAttribute('aria-pressed', active ? 'false' : 'true');
}

function handleToggleAudioSFX(fromGamepad = false) {
  const active = toggleAudioSFX();
  renderAudioState(active);
  if (fromGamepad) showArcadeOSD(uiText[currentLang][active ? 'osd_sfx_on' : 'osd_sfx_off']);
}

// ---------------------------------------------------------
// OSD retro en el tubo (mando conectado, SFX...)
// ---------------------------------------------------------
const OSD_VISIBLE_MS = 2200;
let osdTimer = null;

function showArcadeOSD(text) {
  const osd = document.getElementById('arcade-osd');
  if (!osd) return;
  osd.textContent = text;
  osd.classList.add('is-visible');
  clearTimeout(osdTimer);
  osdTimer = setTimeout(() => osd.classList.remove('is-visible'), OSD_VISIBLE_MS);
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

  // Estado de audio persistido (mute sobrevive a la recarga)
  renderAudioState(initAudioState());

  // Repaint the active scene whenever a lazily-loaded scene asset finishes loading
  onAssetLoad(() => renderScreenArtwork(activeSystemIndex));

  const savedLang = localStorage.getItem(LANG_KEY);
  if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
    setLanguage(savedLang);
  } else {
    setLanguage('es');
  }

  // Fanfarria de retorno si venimos de project.html (bandera + ?return=1).
  // Va ANTES de leer ?system=N porque ese bloque limpia toda la query.
  checkReturnSound();

  // Mandos (Gamepad API): mismas acciones que el teclado, mismo feedback
  // háptico en los Sanwa (navigateSystem / inspectSystem / goToMainMenu ya
  // iluminan azul / amarillo / rojo) y OSD retro al conectar / desconectar.
  initGamepad({
    onNavigate: (dir) => {
      if (isLeaving) return;
      pressSanwa(document.getElementById('scroll-btn'));
      if (acceptNavigation()) navigateSystem(dir);
    },
    onInspect: () => inspectSystem(),
    onMainMenu: () => { if (!isLeaving) goToMainMenu(); },
    onToggleSFX: () => handleToggleAudioSFX(true),
    onToggleLang: () => setLanguage(currentLang === 'es' ? 'en' : 'es'),
    onConnected: (pad) => showArcadeOSD(uiText[currentLang].osd_pad_connected + describeGamepad(pad)),
    onDisconnected: () => showArcadeOSD(uiText[currentLang].osd_pad_disconnected)
  });

  // Sistema inicial: `?system=N` (retorno desde project.html) > último visitado > 0
  const total = arcadeSystems.length;
  const param = Number.parseInt(new URLSearchParams(window.location.search).get('system') ?? '', 10);
  const saved = Number.parseInt(localStorage.getItem(SYSTEM_KEY) ?? '', 10);
  if (Number.isInteger(param) && param >= 0 && param < total) {
    activeSystemIndex = param;
    // Limpia la query para que un refresco no "fije" el sistema
    history.replaceState(null, '', window.location.pathname);
  } else if (Number.isInteger(saved) && saved >= 0 && saved < total) {
    activeSystemIndex = saved;
  }

  // Boton azul Sanwa: siguiente sistema (mismo detent que ArrowDown). Se
  // ilumina siempre al clic, aunque el debounce descarte el salto.
  const scrollBtn = document.getElementById('scroll-btn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      pressSanwa(scrollBtn);
      if (acceptNavigation()) navigateSystem(1);
    });
  }

  updateLogosView();

  startRenderLoop();

  // INSPECCIONAR: pantalla (clic / Enter / Espacio) y botón amarillo del panel
  const screenViewport = document.querySelector('.scifi-screen-viewport');
  if (screenViewport) {
    screenViewport.addEventListener('click', () => inspectSystem());
    screenViewport.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inspectSystem();
      }
    });
  }
  const inspectBtn = document.getElementById('inspect-btn');
  if (inspectBtn) inspectBtn.addEventListener('click', () => inspectSystem());

  // Al volver con el botón "atrás" desde el bfcache, restaura el chasis
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    isLeaving = false;
    document.querySelector('.arcade-viewport-env')?.classList.remove('is-leaving');
    checkReturnSound();
  });

  // Resize canvas when window resizes
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Mouse Wheel navigation anywhere on screen (debounce de 220ms + umbral
  // anti-trackpad: un gesto rapido produce UN salto, nunca tres)
  window.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < WHEEL_THRESHOLD || isLeaving) return;
    pressSanwa(document.getElementById('scroll-btn'));
    if (!acceptNavigation()) return;
    navigateSystem(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });

  // Keyboard Navigation (Arrow keys, W / S, A = menu principal)
  window.addEventListener('keydown', (e) => {
    if (isLeaving) return;

    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      pressSanwa(document.getElementById('scroll-btn'));
      if (acceptNavigation()) navigateSystem(1);
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      pressSanwa(document.getElementById('scroll-btn'));
      if (acceptNavigation()) navigateSystem(-1);
    } else if ((e.key === 'a' || e.key === 'A') && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Tecla A = boton rojo Sanwa. No interceptar si se escribe en un campo.
      const el = document.activeElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;
      e.preventDefault();
      goToMainMenu();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // ENTER / ESPACIO global: no interceptar si el foco está sobre un control
      // (botones de idioma, mute, CV, enlaces...) para no romper su activación
      const el = document.activeElement;
      const tag = el?.tagName;
      const isControl = tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || el?.isContentEditable;
      if (isControl && el !== document.body) return;
      e.preventDefault();
      inspectSystem();
    }
  });
});
