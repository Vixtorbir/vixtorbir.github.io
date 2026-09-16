/**
 * project.js — Renderer de la página dedicada de ficha técnica (project.html)
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Responsabilidades:
 *   - Leer `?system=N` (0-5) y el idioma persistido (localStorage) y renderizar
 *     la ficha correspondiente de specContent.js: hero, métricas, galería,
 *     desglose STAR por secciones, paginador y contacto.
 *   - Cambio de idioma en tiempo real, sincronizado con el arcade (misma clave).
 *   - Atajos: ESC / Backspace → arcade · ◄ ► → sistema anterior / siguiente.
 *   - Botones de copiar (código, email, teléfono) con toast de estado.
 *   - Resaltado de sintaxis ligero para C++ / C# (sin dependencias).
 *
 * El retorno al arcade conserva el sistema visitado vía `index.html?system=N`
 * y localStorage, de modo que la ruleta vuelve a la misma posición.
 */

import { specSheets, pageText, CONTACT } from './specContent.js';

const LANG_KEY = 'victor_portfolio_lang';
const SYSTEM_KEY = 'victor_portfolio_system';
const TOTAL = specSheets.length;

let currentLang = 'es';
let currentIndex = 0;
let toastTimer = null;
const copyTimers = new WeakMap();

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function t(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] ?? obj.es ?? '';
}

function ui(key) {
  return pageText[currentLang]?.[key] ?? pageText.es[key] ?? '';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function readSystemParam() {
  const raw = new URLSearchParams(window.location.search).get('system');
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isInteger(n) && n >= 0 && n < TOTAL ? n : null;
}

const RETURN_SFX_KEY = 'arcade_play_return_sfx';
// Margen para que el blip de salida suene entero antes de descargar la pagina
const RETURN_LEAVE_MS = 120;

function arcadeUrl(index) {
  return `index.html?system=${index}&return=1`;
}

/**
 * Blip breve de confirmacion de salida (square 440→880 Hz, 100 ms).
 * Contexto efimero: se cierra al terminar el oscilador para no dejar
 * AudioContexts colgando al navegar. Rampa exponencial hasta 0.001 antes
 * de stop() para evitar el pop de corte.
 */
function playReturnSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => { ctx.close().catch(() => {}); };
    osc.start(t);
    osc.stop(t + 0.1);
  } catch (e) {}
}

function projectUrl(index) {
  return `project.html?system=${index}`;
}

// ---------------------------------------------------------------------------
// Resaltado de sintaxis mínimo (C++ / C#) sobre HTML ya escapado
// ---------------------------------------------------------------------------
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
  // Marcadores en el área de uso privado de Unicode: nunca colisionan con los
  // regex de keywords / números que se aplican después.
  const stash = (html) => {
    tokens.push(html);
    return String.fromCharCode(0xE000 + tokens.length - 1);
  };

  let out = src
    .replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m) => stash(`<span class="tk-c">${m}</span>`))
    .replace(/("(?:[^"\\]|\\.)*")/g, (m) => stash(`<span class="tk-s">${m}</span>`))
    .replace(/(^|\n)(#[^\n]*)/g, (m, nl, d) => nl + stash(`<span class="tk-p">${d}</span>`))
    .replace(/(\[[A-Za-z][^\]\n]*\])/g, (m) => stash(`<span class="tk-p">${m}</span>`));

  out = out
    .replace(KEYWORDS[lang] || KEYWORDS.cpp, '<span class="tk-k">$1</span>')
    .replace(TYPES[lang] || TYPES.cpp, '<span class="tk-t">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?f?)\b/g, '<span class="tk-n">$1</span>');

  return out.replace(/[-]/g, (m) => tokens[m.charCodeAt(0) - 0xE000] ?? m);
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

// Iconos oficiales de /assets/icons para las tarjetas de perks
const PERK_ICONS = {
  'C++': 'assets/icons/cpp.svg',
  'C#': 'assets/icons/csharp.svg',
  'C': 'assets/icons/c.svg',
  'UNREAL ENGINE': 'assets/icons/unreal.svg',
  'UNITY': 'assets/icons/unity.svg',
  'FMOD': 'assets/icons/fmod.svg',
  'WWISE': 'assets/icons/wwise.svg',
  'GIT / GITHUB': 'assets/icons/git.svg'
};

// ---------------------------------------------------------------------------
// Render de bloques
// ---------------------------------------------------------------------------
function renderBlock(block) {
  switch (block.type) {
    case 'p':
      return `<p class="cs-p">${t(block.text)}</p>`;
    case 'h':
      return `<h3 class="cs-h">${t(block.text)}</h3>`;
    case 'note':
      return `<div class="cs-note">${t(block.text)}</div>`;
    case 'list':
      return `<ul class="cs-list">${block.items.map(it => `<li>${t(it)}</li>`).join('')}</ul>`;
    case 'kv':
      return `<dl class="cs-kv">${block.rows.map(r => `<div class="cs-kv-row"><dt>${t(r.k)}</dt><dd>${t(r.v)}</dd></div>`).join('')}</dl>`;
    case 'code': {
      const langLabel = block.lang === 'csharp' ? 'C#' : 'C++';
      return `
        <figure class="cs-code-block">
          <figcaption class="cs-code-head">
            <span class="cs-code-lang">${langLabel}</span>
            <span class="cs-code-caption">${t(block.caption)}</span>
            <button type="button" class="cs-copy" data-copy-code aria-label="${ui('copy')}">${ICONS.copy}<span>${ui('copy')}</span></button>
          </figcaption>
          <pre><code class="language-${block.lang}">${highlight(block.code, block.lang)}</code></pre>
          <textarea class="cs-code-src" hidden aria-hidden="true">${escapeHtml(block.code)}</textarea>
        </figure>`;
    }
    case 'perks':
      return `<div class="cs-perks">${block.items.map(p => {
        const icon = PERK_ICONS[p.name] ? `<img class="cs-perk-icon" src="${PERK_ICONS[p.name]}" alt="" aria-hidden="true">` : '';
        const bars = Array.from({ length: 4 }, (_, i) => `<span class="${i < p.level ? 'on' : ''}"></span>`).join('');
        return `
          <article class="cs-perk" style="--perk-color:${p.color}">
            <div class="cs-perk-head">${icon}<div><div class="cs-perk-name">${p.name}</div><div class="cs-perk-tag">${t(p.tag)}</div></div></div>
            <div class="cs-perk-level" aria-label="${p.level}/4">${bars}</div>
            <p>${t(p.text)}</p>
          </article>`;
      }).join('')}</div>`;
    default:
      return '';
  }
}

function renderAction(a, extraClass = '') {
  const icon = ICONS[a.icon] || '';
  if (a.type === 'copy') {
    return `<button type="button" class="cs-action ${extraClass}" data-copy="${escapeHtml(a.value)}" data-label="${escapeHtml(t(a.label))}" data-done="${escapeHtml(t(a.done))}">${icon}<span>${t(a.label)}</span></button>`;
  }
  if (a.type === 'download') {
    return `<a class="cs-action ${extraClass}" href="${a.href}" download>${icon}<span>${t(a.label)}</span></a>`;
  }
  return `<a class="cs-action ${extraClass}" href="${a.href}" target="_blank" rel="noopener noreferrer">${icon}<span>${t(a.label)}</span></a>`;
}

// Etiqueta de sección: "[A] AUDIO C++" → tag "[A]" + label "AUDIO C++";
// sin prefijo STAR (perfil, perks…) se numera 01, 02…
function splitSectionLabel(label, i) {
  const m = /^\[([A-Z])\]\s*(.+)$/.exec(label);
  if (m) return { tag: `[${m[1]}]`, label: m[2] };
  return { tag: String(i + 1).padStart(2, '0'), label };
}

// ---------------------------------------------------------------------------
// Render de página
// ---------------------------------------------------------------------------
function render() {
  const sheet = specSheets[currentIndex];
  document.documentElement.lang = currentLang;
  document.documentElement.style.setProperty('--accent', sheet.accent);
  document.title = `${t(sheet.title)} — ${ui('docTitle')} · Víctor Cárdenas`;

  // Barra superior
  const back = document.getElementById('cs-back');
  back.href = arcadeUrl(currentIndex);
  back.setAttribute('aria-label', ui('backAria'));
  document.getElementById('cs-back-label').textContent = ui('back');
  document.getElementById('cs-lang').setAttribute('aria-label', ui('langAria'));
  document.getElementById('cs-github-label').textContent = ui('github');
  document.getElementById('cs-cv-label').textContent = ui('cv');
  document.querySelectorAll('.cs-lang-btn').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.lang === currentLang ? 'true' : 'false');
  });

  // Hero
  document.getElementById('cs-kicker').textContent = ui('kicker');
  document.getElementById('cs-code').textContent = sheet.code;
  document.getElementById('cs-title').textContent = t(sheet.title);
  document.getElementById('cs-subtitle').textContent = t(sheet.subtitle);
  document.getElementById('cs-badges').innerHTML = sheet.badges.map(b => `<li class="cs-badge">${escapeHtml(b)}</li>`).join('');
  document.getElementById('cs-actions').innerHTML = sheet.actions.map((a, i) => renderAction(a, i === 0 ? 'cs-action--primary' : '')).join('');

  // Métricas
  document.getElementById('cs-metrics-h').textContent = ui('metrics');
  document.getElementById('cs-metrics').innerHTML = sheet.metrics.map(m => `
    <div class="cs-metric">
      <span class="cs-metric-value">${escapeHtml(m.value)}</span>
      <span class="cs-metric-label">${t(m.label)}</span>
    </div>`).join('');

  // Galería (oculta si el sistema no tiene assets)
  const gallerySection = document.getElementById('cs-gallery-section');
  if (sheet.gallery && sheet.gallery.length) {
    gallerySection.hidden = false;
    document.getElementById('cs-gallery-h').textContent = ui('gallery');
    document.getElementById('cs-gallery').innerHTML = sheet.gallery.map(g => {
      // Logos / sprites con transparencia se muestran completos; capturas a sangre
      const contain = /icon|logo|portrait|pixel_art|player_ship|enemy_bird|phoenix_boss/.test(g.src);
      return `
        <figure class="cs-figure ${contain ? 'cs-figure--contain' : ''}">
          <a href="${g.src}" target="_blank" rel="noopener noreferrer"><img src="${g.src}" alt="${escapeHtml(t(g.alt))}" loading="lazy" decoding="async"></a>
          <figcaption>${t(g.caption)}</figcaption>
        </figure>`;
    }).join('');
  } else {
    gallerySection.hidden = true;
    document.getElementById('cs-gallery').innerHTML = '';
  }

  // Desglose STAR
  document.getElementById('cs-breakdown-h').textContent = ui('breakdown');
  document.getElementById('cs-sections').innerHTML = sheet.sections.map((s, i) => {
    const { tag, label } = splitSectionLabel(t(s.label), i);
    const id = `cs-sec-${i}`;
    return `
      <section class="cs-section" aria-labelledby="${id}">
        <div class="cs-section-aside">
          <div class="cs-section-tag" aria-hidden="true">${tag}</div>
          <h3 class="cs-section-label" id="${id}">${label}</h3>
        </div>
        <div class="cs-section-body">${s.blocks.map(renderBlock).join('')}</div>
      </section>`;
  }).join('');

  // Paginador: sistema anterior / siguiente (cíclico)
  const prevIdx = (currentIndex - 1 + TOTAL) % TOTAL;
  const nextIdx = (currentIndex + 1) % TOTAL;
  const prev = specSheets[prevIdx];
  const next = specSheets[nextIdx];
  document.getElementById('cs-pager').innerHTML = `
    <a class="cs-pager-link cs-pager-link--prev" href="${projectUrl(prevIdx)}" data-nav="${prevIdx}">
      <span class="cs-pager-dir">◄ ${ui('prev')}</span>
      <span class="cs-pager-title">${t(prev.title)}</span>
      <span class="cs-pager-code">${prev.code}</span>
    </a>
    <a class="cs-pager-link cs-pager-link--next" href="${projectUrl(nextIdx)}" data-nav="${nextIdx}">
      <span class="cs-pager-dir">${ui('next')} ►</span>
      <span class="cs-pager-title">${t(next.title)}</span>
      <span class="cs-pager-code">${next.code}</span>
    </a>`;

  // Contacto
  document.getElementById('cs-contact-title').textContent = ui('contactTitle');
  document.getElementById('cs-contact-body').textContent = ui('contactBody');
  document.getElementById('cs-contact-actions').innerHTML =
    renderAction({ type: 'copy', label: { es: ui('contactEmail'), en: ui('contactEmail') }, done: { es: ui('copied'), en: ui('copied') }, value: CONTACT.email, icon: 'mail' }, 'cs-action--primary') +
    renderAction({ type: 'link', label: { es: ui('contactLinkedin'), en: ui('contactLinkedin') }, href: CONTACT.linkedin, icon: 'in' });

  document.getElementById('cs-hint').textContent = ui('hint');
  document.getElementById('cs-footer-brand').textContent = ui('footer');
}

// ---------------------------------------------------------------------------
// Portapapeles y toast
// ---------------------------------------------------------------------------
function showToast(msg) {
  const toast = document.getElementById('cs-toast');
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1600);
}

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (e) { /* cae al fallback */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

function flashButton(btn, doneLabel, ok) {
  const label = btn.querySelector('span');
  const original = btn.dataset.label || label?.textContent || '';
  const icon = btn.querySelector('svg');
  const originalIcon = icon ? icon.outerHTML : '';

  btn.classList.toggle('is-done', ok);
  if (label) label.textContent = ok ? doneLabel : ui('copyFail');
  if (ok && icon) icon.outerHTML = ICONS.check;

  clearTimeout(copyTimers.get(btn));
  copyTimers.set(btn, setTimeout(() => {
    btn.classList.remove('is-done');
    if (label) label.textContent = original;
    const cur = btn.querySelector('svg');
    if (cur && originalIcon) cur.outerHTML = originalIcon;
  }, 1500));
}

async function onClick(e) {
  const copyBtn = e.target.closest('[data-copy]');
  if (copyBtn) {
    const ok = await copyText(copyBtn.dataset.copy);
    flashButton(copyBtn, copyBtn.dataset.done || ui('copied'), ok);
    showToast(ok ? `${ui('copied')} ${copyBtn.dataset.copy}` : ui('copyFail'));
    return;
  }

  const codeBtn = e.target.closest('[data-copy-code]');
  if (codeBtn) {
    const src = codeBtn.closest('.cs-code-block')?.querySelector('.cs-code-src');
    const ok = src ? await copyText(src.value) : false;
    flashButton(codeBtn, ui('copied'), ok);
    return;
  }

  const langBtn = e.target.closest('.cs-lang-btn');
  if (langBtn) {
    setLanguage(langBtn.dataset.lang);
    return;
  }

  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    goToSystem(Number(nav.dataset.nav));
    return;
  }

  // Enlace de retorno: misma ruta que ESC (bandera de audio + blip de salida).
  // Con modificadores (ctrl/cmd/shift) se respeta el comportamiento nativo.
  const back = e.target.closest('#cs-back');
  if (back && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
    e.preventDefault();
    backToArcade();
  }
}

// ---------------------------------------------------------------------------
// Navegación y estado
// ---------------------------------------------------------------------------
function setLanguage(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  if (lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  const y = window.scrollY;
  render();
  window.scrollTo({ top: y, behavior: 'instant' });
}

function goToSystem(index) {
  currentIndex = (index + TOTAL) % TOTAL;
  localStorage.setItem(SYSTEM_KEY, String(currentIndex));
  history.pushState({ system: currentIndex }, '', projectUrl(currentIndex));
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.getElementById('cs-main').focus({ preventScroll: true });
}

let leaving = false;

function backToArcade() {
  if (leaving) return;
  leaving = true;
  localStorage.setItem(SYSTEM_KEY, String(currentIndex));
  sessionStorage.setItem(RETURN_SFX_KEY, '1');
  playReturnSound();
  setTimeout(() => { window.location.href = arcadeUrl(currentIndex); }, RETURN_LEAVE_MS);
}

function onKeydown(e) {
  const el = document.activeElement;
  const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  if (typing) return;

  if (e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault();
    backToArcade();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    goToSystem(currentIndex + 1);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    goToSystem(currentIndex - 1);
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem(LANG_KEY);
  currentLang = savedLang === 'en' ? 'en' : 'es';

  const param = readSystemParam();
  if (param === null) {
    // Parámetro ausente o fuera de rango: usa el último sistema visitado
    const saved = Number.parseInt(localStorage.getItem(SYSTEM_KEY) ?? '', 10);
    currentIndex = Number.isInteger(saved) && saved >= 0 && saved < TOTAL ? saved : 0;
    history.replaceState({ system: currentIndex }, '', projectUrl(currentIndex));
  } else {
    currentIndex = param;
    history.replaceState({ system: currentIndex }, '', projectUrl(currentIndex));
  }
  localStorage.setItem(SYSTEM_KEY, String(currentIndex));

  render();

  document.addEventListener('click', onClick);
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('popstate', (e) => {
    const idx = e.state?.system ?? readSystemParam();
    if (idx === null || idx === undefined) return;
    currentIndex = idx;
    render();
  });

  // Sincroniza el idioma si el arcade lo cambia en otra pestaña
  window.addEventListener('storage', (e) => {
    if (e.key === LANG_KEY && e.newValue && e.newValue !== currentLang) setLanguage(e.newValue);
  });
});
