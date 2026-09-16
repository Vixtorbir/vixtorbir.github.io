/**
 * gamepadManager.js — Soporte Universal de Mandos (Gamepad API W3C)
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Mapeo "standard" (Xbox / PlayStation / Nintendo / Arcade Stick USB):
 * - D-Pad vertical / Stick izq. Y : Navegar ruleta (deadzone 0.45 + cadencia 240 ms)
 * - D-Pad horizontal / Stick X    : Proyecto anterior / siguiente (flanco de subida)
 * - Botón 0  (A / Cross)          : Inspeccionar sistema activo
 * - Botón 1  (B / Circle)         : Volver al arcade (en project.html)
 * - Botón 2/3 (X / Y)             : Volver al Menú Principal (Sistema 0)
 * - Botón 4/5 (LB / RB)           : Proyecto anterior / siguiente
 * - Botón 8  (Select / Back)      : Conmutar idioma ES / EN
 * - Botón 9  (Start)              : Conmutar SFX / Mute
 *
 * Diseño:
 *   - Polling con requestAnimationFrame SOLO mientras hay un mando conectado
 *     y la pestaña es visible (coste cero en el resto de casos).
 *   - Todas las acciones discretas se disparan por flanco de subida (justPressed)
 *     sobre entradas "virtuales" que fusionan D-Pad y stick, para que mantener
 *     un botón no repita la acción.
 *   - La navegación vertical sí repite mientras se mantiene, con cadencia fija
 *     (como el auto-repeat del teclado), y respeta el debounce del consumidor.
 *   - Cero asignaciones en el bucle: estado en Maps pre-alojados.
 */

const NAV_COOLDOWN_MS = 240;
const STICK_DEADZONE = 0.45;

let isPolling = false;
let rafId = null;
let lastNavTime = 0;
let handlers = null;

// Estado anterior por entrada virtual -> boolean (flanco de subida)
const prevState = new Map();

function getConnectedGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (let i = 0; i < pads.length; i++) {
    if (pads[i] && pads[i].connected) return pads[i];
  }
  return null;
}

function isPressed(pad, index) {
  const b = pad.buttons[index];
  if (!b) return false;
  return typeof b === 'object' ? b.pressed : b === 1.0;
}

/** Flanco de subida de una entrada virtual identificada por `key`. */
function justPressed(key, pressed) {
  const was = prevState.get(key) === true;
  prevState.set(key, pressed);
  return pressed && !was;
}

/** Nombre legible del mando para el OSD (XBOX / PLAYSTATION / SWITCH / GAMEPAD) */
export function describeGamepad(pad) {
  const id = (pad && pad.id ? pad.id : '').toLowerCase();
  if (id.includes('xbox') || id.includes('xinput') || id.includes('045e')) return 'XBOX';
  if (id.includes('dual') || id.includes('playstation') || id.includes('054c') || id.includes('wireless controller')) return 'PLAYSTATION';
  if (id.includes('switch') || id.includes('pro controller') || id.includes('057e') || id.includes('joy-con')) return 'SWITCH';
  if (id.includes('arcade') || id.includes('stick') || id.includes('fight')) return 'ARCADE STICK';
  return 'GAMEPAD';
}

export function isGamepadConnected() {
  return !!getConnectedGamepad();
}

function handleInput(pad) {
  const now = performance.now();
  const h = handlers;

  // 1. Vertical: D-Pad (12/13) o stick izquierdo Y (axes[1]) — con cadencia
  const stickY = pad.axes[1] || 0;
  const isUp = isPressed(pad, 12) || stickY < -STICK_DEADZONE;
  const isDown = isPressed(pad, 13) || stickY > STICK_DEADZONE;
  if ((isUp || isDown) && now - lastNavTime >= NAV_COOLDOWN_MS) {
    lastNavTime = now;
    h.onNavigate(isDown ? 1 : -1);
  } else if (!isUp && !isDown) {
    // Al soltar, el siguiente toque responde al instante (sin esperar cooldown)
    lastNavTime = 0;
  }

  // 2. Horizontal: D-Pad (14/15) o stick X (axes[0]) — flanco de subida
  const stickX = pad.axes[0] || 0;
  if (justPressed('left', isPressed(pad, 14) || stickX < -STICK_DEADZONE)) h.onPrevProject();
  if (justPressed('right', isPressed(pad, 15) || stickX > STICK_DEADZONE)) h.onNextProject();

  // 3. Botones de acción (flanco de subida)
  if (justPressed('b0', isPressed(pad, 0))) h.onInspect();     // A / Cross
  if (justPressed('b1', isPressed(pad, 1))) h.onBack();        // B / Circle
  if (justPressed('b2', isPressed(pad, 2))) h.onMainMenu();    // X / Square
  if (justPressed('b3', isPressed(pad, 3))) h.onMainMenu();    // Y / Triangle
  if (justPressed('b4', isPressed(pad, 4))) h.onPrevProject(); // LB / L1
  if (justPressed('b5', isPressed(pad, 5))) h.onNextProject(); // RB / R1
  if (justPressed('b8', isPressed(pad, 8))) h.onToggleLang();  // Select / Back
  if (justPressed('b9', isPressed(pad, 9))) h.onToggleSFX();   // Start
}

function poll() {
  if (!isPolling) return;
  const pad = getConnectedGamepad();
  if (pad) handleInput(pad);
  rafId = requestAnimationFrame(poll);
}

function startPolling() {
  if (isPolling) return;
  isPolling = true;
  prevState.clear();
  lastNavTime = 0;
  rafId = requestAnimationFrame(poll);
}

function stopPolling() {
  isPolling = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Registra los callbacks y arranca la detección. Todos son opcionales.
 * Devuelve una función de limpieza que retira los listeners y detiene el polling.
 */
export function initGamepad(options = {}) {
  const noop = () => {};
  handlers = {
    onNavigate: options.onNavigate || noop,
    onInspect: options.onInspect || noop,
    onMainMenu: options.onMainMenu || noop,
    onBack: options.onBack || noop,
    onPrevProject: options.onPrevProject || noop,
    onNextProject: options.onNextProject || noop,
    onToggleSFX: options.onToggleSFX || noop,
    onToggleLang: options.onToggleLang || noop,
    onConnected: options.onConnected || noop,
    onDisconnected: options.onDisconnected || noop
  };

  const onConnected = (e) => {
    handlers.onConnected(e.gamepad);
    if (!document.hidden) startPolling();
  };
  const onDisconnected = (e) => {
    handlers.onDisconnected(e.gamepad);
    if (!getConnectedGamepad()) stopPolling();
  };
  // Sin mando no hay coste; con la pestaña oculta tampoco (pausa / reanuda)
  const onVisibility = () => {
    if (document.hidden) stopPolling();
    else if (getConnectedGamepad()) startPolling();
  };

  window.addEventListener('gamepadconnected', onConnected);
  window.addEventListener('gamepaddisconnected', onDisconnected);
  document.addEventListener('visibilitychange', onVisibility);

  // Mando ya conectado antes de registrar los eventos (recarga de página):
  // Chrome no vuelve a emitir gamepadconnected hasta que se pulsa un botón.
  if (getConnectedGamepad() && !document.hidden) startPolling();

  return function destroyGamepad() {
    stopPolling();
    window.removeEventListener('gamepadconnected', onConnected);
    window.removeEventListener('gamepaddisconnected', onDisconnected);
    document.removeEventListener('visibilitychange', onVisibility);
    handlers = null;
  };
}
