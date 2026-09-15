/**
 * specModal.js — Service Menu / Modal de Diagnóstico Arcade
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Responsabilidades:
 *   - Abrir / cerrar el modal con la ficha del sistema activo (specContent.js).
 *   - Accesibilidad: role="dialog", aria-modal, focus trap (Tab / Shift+Tab),
 *     devolución de foco al disparador, scroll lock del body, Esc para cerrar.
 *   - Pestañas con roving tabindex (◄ ► / Home / End) y paneles ARIA.
 *   - Resaltado de sintaxis ligero para C++ / C# (sin dependencias).
 *   - Botones de acción: enlaces, descarga de CV y copiar al portapapeles.
 *
 * El módulo no conoce el estado global: app.js le pasa el índice y el idioma
 * en open() y vuelve a llamar a refresh() cuando cambia el idioma.
 */

import { specSheets, modalText } from './specContent.js';
import { playModalOpenSound, playModalCloseSound, playArcadeTick } from './audioManager.js';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let root = null;          // #spec-modal (backdrop + dialog)
let dialog = null;        // .spec-dialog
let bodyEl = null;        // .spec-body (scroll interno)
let isOpen = false;
let lastTrigger = null;   // elemento que abrió el modal (para devolver el foco)
let prevBodyOverflow = '';
let currentIndex = 0;
let currentLang = 'es';
let activeTab = 0;
let closeTimer = null;
let onLanguageChange = null; // callback inyectado por app.js (setLanguage)
const copyTimers = new WeakMap();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function t(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] ?? obj.es ?? '';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Resaltado de sintaxis mínimo (C++ / C#): comentarios, strings, keywords,
// tipos, números y preprocesador/atributos. Trabaja sobre HTML ya escapado.
const KEYWORDS = {
  cpp: /\b(auto|bool|break|case|catch|class|const|constexpr|continue|default|delete|do|double|else|enum|explicit|extern|false|float|for|friend|if|inline|int|long|namespace|new|noexcept|nullptr|operator|override|private|protected|public|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|while)\b/g,
  csharp: /\b(abstract|as|base|bool|break|case|catch|class|const|continue|default|delegate|do|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|get|if|implicit|in|int|interface|internal|is|lock|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sealed|set|static|string|struct|switch|this|throw|true|try|typeof|uint|using|var|virtual|void|volatile|while|yield)\b/g
};
const TYPES = {
  cpp: /\b(AudioManager|AudioBus|AudioSource|Entity|FMOD|ChannelGroup|MonoString|Utils|std|string|stringstream|unique_ptr|Studio|System|Sound|Channel|EventInstance)\b/g,
  csharp: /\b(ObjectPool|Bullet|IDamageable|Collider2D|IBossState|BossController|BossPhase1State|BossPhase2State|BossDefeatedState|BossBarrierSegment|AudioSource|Component|InternalCalls|MethodImplAttribute|MethodImplOptions|Player|Instance|PlayerHealth)\b/g
};

function highlight(code, lang) {
  const src = escapeHtml(code);
  const tokens = [];
  // Marcadores en el área de uso privado de Unicode (U+E000+): nunca colisionan
  // con los regex de keywords/números que se aplican después.
  const stash = (html) => {
    tokens.push(html);
    return String.fromCharCode(0xE000 + tokens.length - 1);
  };

  let out = src
    // comentarios de línea y bloque
    .replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m) => stash(`<span class="tk-c">${m}</span>`))
    // strings
    .replace(/("(?:[^"\\]|\\.)*")/g, (m) => stash(`<span class="tk-s">${m}</span>`))
    // preprocesador C++ / atributos C#
    .replace(/(^|\n)(#[^\n]*)/g, (m, nl, d) => nl + stash(`<span class="tk-p">${d}</span>`))
    .replace(/(\[[A-Za-z][^\]\n]*\])/g, (m) => stash(`<span class="tk-p">${m}</span>`));

  out = out
    .replace(KEYWORDS[lang] || KEYWORDS.cpp, '<span class="tk-k">$1</span>')
    .replace(TYPES[lang] || TYPES.cpp, '<span class="tk-t">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?f?)\b/g, '<span class="tk-n">$1</span>');

  return out.replace(/[\uE000-\uF8FF]/g, (m) => tokens[m.charCodeAt(0) - 0xE000] ?? m);
}

const ICONS = {
  gh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
  in: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6m0 0-2.5-2.5M12 17l2.5-2.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  web: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 5 5L20 7"/></svg>'
};

// ---------------------------------------------------------------------------
// Render de bloques
// ---------------------------------------------------------------------------
function renderBlock(block) {
  switch (block.type) {
    case 'p':
      return `<p class="spec-p">${t(block.text)}</p>`;
    case 'h':
      return `<h4 class="spec-h">${t(block.text)}</h4>`;
    case 'note':
      return `<div class="spec-note">${t(block.text)}</div>`;
    case 'list':
      return `<ul class="spec-list">${block.items.map(it => `<li>${t(it)}</li>`).join('')}</ul>`;
    case 'kv':
      return `<dl class="spec-kv">${block.rows.map(r => `<div class="spec-kv-row"><dt>${t(r.k)}</dt><dd>${t(r.v)}</dd></div>`).join('')}</dl>`;
    case 'code': {
      const langLabel = block.lang === 'csharp' ? 'C#' : 'C++';
      return `
        <figure class="spec-code">
          <figcaption><span class="spec-code-lang">${langLabel}</span><span>${t(block.caption)}</span></figcaption>
          <pre tabindex="0"><code class="lang-${block.lang}">${highlight(block.code, block.lang)}</code></pre>
        </figure>`;
    }
    case 'perks':
      return `<div class="spec-perks">${block.items.map(p => `
        <article class="spec-perk" style="--perk:${p.color}">
          <header>
            <span class="spec-perk-name">${p.name}</span>
            <span class="spec-perk-level" aria-label="${p.level}/4">${'■'.repeat(p.level)}${'□'.repeat(4 - p.level)}</span>
          </header>
          <span class="spec-perk-tag">${t(p.tag)}</span>
          <p>${t(p.text)}</p>
        </article>`).join('')}</div>`;
    default:
      return '';
  }
}

function renderAction(a, i) {
  const label = t(a.label);
  if (a.type === 'copy') {
    return `<button type="button" class="spec-action spec-action-copy" data-copy="${a.value}" data-label="${label}" data-done="${t(a.done)}">
      <span class="spec-action-icon">${ICONS[a.icon] || ICONS.copy}</span><span class="spec-action-label">${label}</span></button>`;
  }
  if (a.type === 'download') {
    return `<a class="spec-action" href="${a.href}" download><span class="spec-action-icon">${ICONS.pdf}</span><span class="spec-action-label">${label}</span></a>`;
  }
  return `<a class="spec-action" href="${a.href}" target="_blank" rel="noopener noreferrer"><span class="spec-action-icon">${ICONS[a.icon] || ICONS.web}</span><span class="spec-action-label">${label}</span></a>`;
}

function render() {
  const sheet = specSheets[currentIndex];
  const ui = modalText[currentLang];
  if (!sheet || !dialog) return;

  dialog.style.setProperty('--accent', sheet.accent);
  activeTab = Math.min(activeTab, sheet.tabs.length - 1);

  dialog.innerHTML = `
    <header class="spec-header">
      <div class="spec-header-left">
        <span class="spec-led" aria-hidden="true"></span>
        <span class="spec-service">${ui.service}</span>
        <span class="spec-code-id">${sheet.code}</span>
      </div>
      <div class="spec-header-right">
        <div class="spec-lang" role="group" aria-label="${ui.langAria}">
          <button type="button" class="spec-lang-btn${currentLang === 'en' ? ' is-active' : ''}" data-lang="en" aria-pressed="${currentLang === 'en'}">EN</button>
          <button type="button" class="spec-lang-btn${currentLang === 'es' ? ' is-active' : ''}" data-lang="es" aria-pressed="${currentLang === 'es'}">ES</button>
        </div>
        <button type="button" class="spec-close" id="spec-close-btn" aria-label="${ui.closeAria}">${ui.close}</button>
      </div>
    </header>

    <div class="spec-body" id="spec-body">
      <div class="spec-title-block">
        <h2 id="spec-modal-title" class="spec-title">${t(sheet.title)}</h2>
        <p class="spec-subtitle">${t(sheet.subtitle)}</p>
        <div class="spec-badges" aria-label="Tech badges">${sheet.badges.map(b => `<span class="spec-badge">${b}</span>`).join('')}</div>
      </div>

      <section class="spec-metrics" aria-label="${ui.metrics}">
        ${sheet.metrics.map(m => `<div class="spec-metric"><span class="spec-metric-value">${m.value}</span><span class="spec-metric-label">${t(m.label)}</span></div>`).join('')}
      </section>

      <div class="spec-tabs" role="tablist" aria-label="${ui.tabsAria}">
        ${sheet.tabs.map((tab, i) => `<button type="button" role="tab" id="spec-tab-${i}" aria-selected="${i === activeTab}" aria-controls="spec-panel-${i}" tabindex="${i === activeTab ? 0 : -1}" class="spec-tab${i === activeTab ? ' is-active' : ''}" data-tab="${i}">${t(tab.label)}</button>`).join('')}
      </div>

      ${sheet.tabs.map((tab, i) => `<section role="tabpanel" id="spec-panel-${i}" aria-labelledby="spec-tab-${i}" class="spec-panel" ${i === activeTab ? '' : 'hidden'}>${tab.blocks.map(renderBlock).join('')}</section>`).join('')}

      <section class="spec-actions" aria-label="${ui.actions}">
        ${sheet.actions.map(renderAction).join('')}
      </section>
    </div>

    <footer class="spec-footer">
      <span class="spec-hint">${ui.hint}</span>
      <span class="spec-footer-brand">${ui.footer}</span>
    </footer>`;

  bodyEl = dialog.querySelector('#spec-body');
  dialog.querySelector('#spec-close-btn').addEventListener('click', close);

  dialog.querySelectorAll('.spec-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) return;
      playArcadeTick();
      // app.js actualiza todo el cabinet y vuelve a llamar a refreshSpecModal()
      if (typeof onLanguageChange === 'function') onLanguageChange(lang);
      else refreshSpecModal(lang);
    });
  });

  dialog.querySelectorAll('.spec-tab').forEach(btn => {
    btn.addEventListener('click', () => selectTab(Number(btn.dataset.tab), true));
    btn.addEventListener('keydown', onTabKeydown);
  });

  dialog.querySelectorAll('.spec-action-copy').forEach(btn => {
    btn.addEventListener('click', () => copyToClipboard(btn));
  });
}

// ---------------------------------------------------------------------------
// Pestañas (roving tabindex)
// ---------------------------------------------------------------------------
function selectTab(index, focus) {
  const sheet = specSheets[currentIndex];
  if (!sheet) return;
  index = (index + sheet.tabs.length) % sheet.tabs.length;
  if (index !== activeTab) playArcadeTick();
  activeTab = index;

  dialog.querySelectorAll('.spec-tab').forEach((btn, i) => {
    const on = i === index;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
    if (on && focus) btn.focus();
  });
  dialog.querySelectorAll('.spec-panel').forEach((panel, i) => {
    panel.hidden = i !== index;
  });
  if (bodyEl) {
    // Vuelve al inicio de la pestaña sin salto brusco
    const tabs = dialog.querySelector('.spec-tabs');
    const top = tabs ? tabs.offsetTop - 8 : 0;
    if (bodyEl.scrollTop > top) bodyEl.scrollTo({ top, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
}

function onTabKeydown(e) {
  const i = Number(e.currentTarget.dataset.tab);
  const total = specSheets[currentIndex].tabs.length;
  switch (e.key) {
    case 'ArrowRight': e.preventDefault(); selectTab(i + 1, true); break;
    case 'ArrowLeft':  e.preventDefault(); selectTab(i - 1, true); break;
    case 'Home':       e.preventDefault(); selectTab(0, true); break;
    case 'End':        e.preventDefault(); selectTab(total - 1, true); break;
    default: break;
  }
}

// ---------------------------------------------------------------------------
// Portapapeles
// ---------------------------------------------------------------------------
async function copyToClipboard(btn) {
  const value = btn.dataset.copy;
  const labelEl = btn.querySelector('.spec-action-label');
  const iconEl = btn.querySelector('.spec-action-icon');
  let ok = false;
  try {
    // Carrera contra un timeout: en algunos contextos (sin foco de documento,
    // permisos pendientes) writeText puede no resolver nunca.
    await Promise.race([
      navigator.clipboard.writeText(value),
      new Promise((_, reject) => setTimeout(() => reject(new Error('clipboard timeout')), 600))
    ]);
    ok = true;
  } catch (e) {
    // Fallback para contextos sin Clipboard API (http://localhost sí la permite)
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e2) { ok = false; }
  }

  playArcadeTick();
  btn.dataset.lastResult = ok ? 'ok' : 'fail';
  btn.classList.toggle('is-done', ok);
  btn.classList.toggle('is-fail', !ok);
  if (labelEl) labelEl.textContent = ok ? btn.dataset.done : modalText[currentLang].copyFail;
  if (iconEl && ok) iconEl.innerHTML = ICONS.check;

  clearTimeout(copyTimers.get(btn));
  copyTimers.set(btn, setTimeout(() => {
    btn.classList.remove('is-done', 'is-fail');
    if (labelEl) labelEl.textContent = btn.dataset.label;
    if (iconEl) iconEl.innerHTML = ICONS[btn.dataset.copy.includes('@') ? 'mail' : 'tel'];
  }, 1800));
}

// ---------------------------------------------------------------------------
// Focus trap + teclado global del modal
// ---------------------------------------------------------------------------
function getFocusables() {
  return Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(el => {
    if (el.closest('[hidden]')) return false;
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
  });
}

function onKeydown(e) {
  if (!isOpen) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    close();
    return;
  }

  if (e.key === 'Tab') {
    const focusables = getFocusables();
    if (focusables.length === 0) { e.preventDefault(); dialog.focus(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = dialog.contains(active);

    if (e.shiftKey) {
      if (!inside || active === first) { e.preventDefault(); last.focus(); }
    } else {
      if (!inside || active === last) { e.preventDefault(); first.focus(); }
    }
    return;
  }

  // Mientras el modal está abierto, la navegación de la ruleta queda bloqueada
  if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S', 'Enter', ' '].includes(e.key)) {
    // Enter/Espacio sobre botones y enlaces del modal deben seguir funcionando
    const tag = document.activeElement?.tagName;
    if (!(tag === 'BUTTON' || tag === 'A' || tag === 'PRE')) e.preventDefault();
    e.stopPropagation();
  }
}

// Si el foco escapa (p. ej. clic en el backdrop con ratón), se recupera
function onFocusIn(e) {
  if (!isOpen) return;
  if (!dialog.contains(e.target)) {
    const focusables = getFocusables();
    (focusables[0] || dialog).focus();
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------
export function initSpecModal(options = {}) {
  root = document.getElementById('spec-modal');
  if (!root) return;
  onLanguageChange = options.onLanguageChange || null;
  dialog = root.querySelector('.spec-dialog');

  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.classList.contains('spec-backdrop')) close();
  });

  // Captura: el modal decide antes que los listeners globales de app.js
  window.addEventListener('keydown', onKeydown, true);
  document.addEventListener('focusin', onFocusIn);
}

export function isSpecModalOpen() {
  return isOpen;
}

export function openSpecModal(index, lang, trigger) {
  if (!root || !dialog) return;
  if (isOpen) return;

  clearTimeout(closeTimer);
  currentIndex = index;
  currentLang = lang === 'en' ? 'en' : 'es';
  activeTab = 0;
  lastTrigger = trigger instanceof HTMLElement ? trigger : (document.activeElement instanceof HTMLElement ? document.activeElement : null);

  render();

  prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.documentElement.classList.add('spec-modal-open');

  root.hidden = false;
  root.setAttribute('aria-hidden', 'false');
  // Reflow síncrono: fija el estado inicial (opacity 0) antes de añadir la
  // clase, para que la transición CSS se dispare siempre (rAF puede no
  // ejecutarse en pestañas en segundo plano y dejaría el modal invisible).
  void root.offsetWidth;
  root.classList.add('is-open');

  isOpen = true;
  playModalOpenSound();

  // Foco inicial: el botón de cierre (primer interactivo, evita scroll)
  const closeBtn = dialog.querySelector('#spec-close-btn');
  (closeBtn || dialog).focus({ preventScroll: true });
  if (bodyEl) bodyEl.scrollTop = 0;
}

export function close() {
  if (!isOpen || !root) return;
  isOpen = false;
  playModalCloseSound();

  root.classList.remove('is-open');
  root.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = prevBodyOverflow;
  document.documentElement.classList.remove('spec-modal-open');

  const finish = () => {
    root.hidden = true;
    dialog.innerHTML = '';
    bodyEl = null;
  };
  clearTimeout(closeTimer);
  closeTimer = setTimeout(finish, reducedMotion.matches ? 0 : 220);

  // Devolución de foco inmediata al disparador
  if (lastTrigger && document.contains(lastTrigger)) {
    lastTrigger.focus({ preventScroll: true });
  }
  lastTrigger = null;
}

export const closeSpecModal = close;

// Cambio de idioma con el modal abierto: re-render conservando la pestaña
export function refreshSpecModal(lang) {
  if (!isOpen) return;
  currentLang = lang === 'en' ? 'en' : 'es';
  const prevScroll = bodyEl ? bodyEl.scrollTop : 0;
  const prevActive = document.activeElement;
  const focusSel = prevActive?.classList?.contains('spec-lang-btn') ? `.spec-lang-btn[data-lang="${currentLang}"]`
    : prevActive?.id === 'spec-close-btn' ? '#spec-close-btn'
    : '.spec-tab.is-active';
  render();
  if (bodyEl) bodyEl.scrollTop = prevScroll;
  const target = dialog.querySelector(focusSel);
  (target || dialog).focus({ preventScroll: true });
}
