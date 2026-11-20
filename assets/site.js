// Site behaviour: theme toggle and the looping gameplay video.
(() => {
  const root = document.documentElement;

  // Theme: follows the system until the visitor picks one, then remembers it.
  const dark = matchMedia("(prefers-color-scheme: dark)");
  document.querySelector(".theme")?.addEventListener("click", () => {
    const isDark = root.dataset.theme ? root.dataset.theme === "dark" : dark.matches;
    root.dataset.theme = isDark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });

  // Looping videos (like a GIF, much lighter): play while on screen, pause off screen,
  // never start by themselves under prefers-reduced-motion, and always have a pause button (WCAG 2.2.2).
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const es = root.lang === "es";
  const label = (paused) => es ? (paused ? "Reproducir el vídeo de la partida" : "Pausar el vídeo de la partida")
                               : (paused ? "Play the gameplay video" : "Pause the gameplay video");
  const loops = [...document.querySelectorAll("video.loop")];
  if (!loops.length) return;
  const held = new WeakSet(); // videos the visitor paused
  const show = (v) => {
    const btn = v.parentElement.querySelector(".loop-toggle");
    if (btn) { btn.setAttribute("aria-pressed", String(v.paused)); btn.setAttribute("aria-label", label(v.paused)); }
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting && !reduce.matches && !held.has(v)) v.play().catch(() => {});
      else v.pause();
    }
  }, { threshold: 0.25 });
  for (const v of loops) {
    io.observe(v);
    v.addEventListener("play", () => show(v));
    v.addEventListener("pause", () => show(v));
    show(v);
    v.parentElement.querySelector(".loop-toggle")?.addEventListener("click", () => {
      if (v.paused) { held.delete(v); v.play().catch(() => {}); }
      else { held.add(v); v.pause(); }
    });
  }
  reduce.addEventListener("change", () => { if (reduce.matches) loops.forEach((v) => v.pause()); });
})();
