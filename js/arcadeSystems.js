/**
 * arcadeSystems.js — Catálogo de Sistemas / Base de Datos de Proyectos
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Propiedad de este módulo: los 6 "sistemas" del cabinet (perfil, juegos,
 * skills, contacto), sus assets, sus escenas de Canvas y las traducciones
 * ES/EN de la UI. No conoce el DOM ni el bucle de render: expone un
 * pequeño pub-sub (onAssetLoad) para que el módulo de render decida
 * cuándo repintar tras cargar una imagen.
 */

const assetLoadListeners = [];

export function onAssetLoad(callback) {
  assetLoadListeners.push(callback);
}

function notifyAssetLoad() {
  assetLoadListeners.forEach((cb) => cb());
}

// Preloaded authentic game asset images
const phoenixImg = new Image();
phoenixImg.src = 'assets/phoenix_pixel_art.png';
phoenixImg.onload = notifyAssetLoad;

const loopieImg = new Image();
loopieImg.src = 'assets/loopie_logo.png';
loopieImg.onload = notifyAssetLoad;

const victorImg = new Image();
victorImg.src = 'assets/portrait_victor.png';
victorImg.onload = notifyAssetLoad;

const fableArtImg = new Image();
fableArtImg.src = 'assets/fable_eclipse_art.png';
fableArtImg.onload = notifyAssetLoad;

const avePhoenixBossImg = new Image();
avePhoenixBossImg.src = 'assets/ave_phoenix_boss.png';
avePhoenixBossImg.onload = notifyAssetLoad;

const avePhoenixIconImg = new Image();
avePhoenixIconImg.src = 'assets/ave_phoenix_icon.png';
avePhoenixIconImg.onload = notifyAssetLoad;

const phoenixPixelImg = new Image();
phoenixPixelImg.src = 'assets/phoenix_pixel_art.png';
phoenixPixelImg.onload = notifyAssetLoad;

// Helper to draw mountain silhouettes
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

// 6 Core Systems Database (Bilingual ES / EN)
export const arcadeSystems = [
  {
    verticalTitle: "01. PLAYER 1 // VÍCTOR CÁRDENAS",
    badgeText: "CITM // P1 PROFILE",
    themeColor: "#38bdf8",
    // Real asset: Authentic pixel portrait of Victor from Ave Phoenix!
    hardwareHtml: `<img src="assets/portrait_victor.png" class="w-full h-full object-contain" style="image-rendering: pixelated;" alt="Víctor Cárdenas" />`,
    meta: {
      es: {
        role: "Gameplay & Systems Programmer",
        stack: "C++ / C# / Unity / Unreal Engine",
        focus: "Arquitectura de Motores & Low-Level Subsystems",
        status: "Disponible Convenio Prácticas (CITM-UPC)"
      },
      en: {
        role: "Gameplay & Systems Programmer",
        stack: "C++ / C# / Unity / Unreal Engine",
        focus: "Engine Architecture & Low-Level Subsystems",
        status: "Available for Internship Agreement (CITM-UPC)"
      }
    },
    drawScene: function(ctx, w, h) {
      // Martian / Cyber Canyon Sunset (Matching Image 2)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#ff5722");
      grad.addColorStop(0.35, "#b71c1c");
      grad.addColorStop(0.7, "#3e1111");
      grad.addColorStop(1, "#0d0407");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sun Flare
      const sunGrad = ctx.createRadialGradient(w * 0.45, h * 0.22, 10, w * 0.45, h * 0.22, 190);
      sunGrad.addColorStop(0, "rgba(255, 255, 235, 1)");
      sunGrad.addColorStop(0.2, "rgba(255, 200, 100, 0.85)");
      sunGrad.addColorStop(0.55, "rgba(255, 87, 34, 0.4)");
      sunGrad.addColorStop(1, "transparent");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.45, h * 0.22, 190, 0, Math.PI * 2);
      ctx.fill();

      // Jagged Mountains (Matching Image 2 exactly)
      drawJaggedMountains(ctx, w, h, 0.44, "#4a1215", 35);
      drawJaggedMountains(ctx, w, h, 0.58, "#2a0a0d", 45);
      drawJaggedMountains(ctx, w, h, 0.72, "#130406", 60);

      // HUD Overlay Wireframe Vectors
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * 0.08, h * 0.15, w * 0.32, h * 0.26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Chakra Petch'";
      ctx.fillText("CITM-UPC // DEV PROFILE", w * 0.1, h * 0.23);
      ctx.font = "11px 'JetBrains Mono'";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText("SYS.TARGET: INTERNSHIP 2025-26", w * 0.1, h * 0.31);
    }
  },
  {
    verticalTitle: "02. THE FABLE OF THE ECLIPSE // LOOPIE",
    badgeText: "C++ GAME & ENGINE // 18 DEVS",
    themeColor: "#38bdf8",
    // Real assets: Official LoopieEngine logo + MiniKnight character!
    hardwareHtml: `<div class="flex items-center justify-center gap-1.5 w-full h-full p-1"><img src="assets/loopie_logo.png" class="h-full object-contain max-w-[48%]" alt="LoopieEngine Logo" title="LoopieEngine C++" /><img src="assets/mini_knight.png" class="h-full object-contain max-w-[48%]" alt="The Fable of the Eclipse" title="The Fable of the Eclipse" /></div>`,
    meta: {
      es: {
        role: "Engine & Gameplay Systems Programmer",
        stack: "C++17/20 / FMOD Studio & Core / Mono C# / OpenGL",
        focus: "Audio Nativo (FMOD), Puente Mono C# & Máquinas de Estado HUD",
        status: "Juego 3D 'The Fable of the Eclipse' & Motor C++ Desarrollados"
      },
      en: {
        role: "Engine & Gameplay Systems Programmer",
        stack: "C++17/20 / FMOD Studio & Core / Mono C# / OpenGL",
        focus: "Native Audio (FMOD), Mono C# Bridge & HUD State Machines",
        status: "Shipped 3D Game & Custom C++ Engine (18-dev team)"
      }
    },
    drawScene: function(ctx, w, h) {
      if (fableArtImg.complete && fableArtImg.naturalWidth > 0) {
        // Draw the authentic The Fable of the Eclipse in-game cinematic artwork
        ctx.drawImage(fableArtImg, 0, 0, w, h);

        // Ambient darkening vignette for arcade telemetry readability
        const darkVignette = ctx.createLinearGradient(0, 0, 0, h);
        darkVignette.addColorStop(0, "rgba(0, 0, 0, 0.2)");
        darkVignette.addColorStop(0.7, "transparent");
        darkVignette.addColorStop(1, "rgba(0, 0, 0, 0.75)");
        ctx.fillStyle = darkVignette;
        ctx.fillRect(0, 0, w, h);
      } else {
        // Fallback Dark Fantasy Eclipse
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#1f1035");
        grad.addColorStop(0.4, "#481427");
        grad.addColorStop(0.8, "#1a080f");
        grad.addColorStop(1, "#070204");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const eclipseGrad = ctx.createRadialGradient(w * 0.5, h * 0.3, 30, w * 0.5, h * 0.3, 145);
        eclipseGrad.addColorStop(0, "#000000");
        eclipseGrad.addColorStop(0.32, "#000000");
        eclipseGrad.addColorStop(0.36, "rgba(245, 158, 11, 0.95)");
        eclipseGrad.addColorStop(0.65, "rgba(239, 68, 68, 0.45)");
        eclipseGrad.addColorStop(1, "transparent");
        ctx.fillStyle = eclipseGrad;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.3, 145, 0, Math.PI * 2);
        ctx.fill();

        drawJaggedMountains(ctx, w, h, 0.52, "#2b0f19", 40);
        drawJaggedMountains(ctx, w, h, 0.70, "#120509", 55);
      }

      // C++ Engine Audio Waves overlay
      ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 6) {
        const y = h * 0.88 + Math.sin(x * 0.04) * 12 * Math.cos(x * 0.015);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 13px 'Chakra Petch'";
      ctx.fillText("THE FABLE OF THE ECLIPSE // LOOPIE ENGINE AUDIO SUBSYSTEM [Commit: e3b2d96]", w * 0.05, h * 0.85);
    }
  },
  {
    verticalTitle: "03. AVE PHOENIX REGEN",
    badgeText: "UNITY // RETRO SHOOTER",
    themeColor: "#10b981",
    // Real asset: Authentic user-uploaded pixel art Phoenix!
    hardwareHtml: `<img src="assets/phoenix_pixel_art.png" class="w-full h-full object-contain" style="image-rendering: pixelated;" alt="Ave Phoenix Pixel Art" />`,
    meta: {
      es: {
        role: "Solo Game Developer & Programmer",
        stack: "Unity C# / UnityEngine.Pool / Decoupled FSM",
        focus: "Zero-GC Object Pooling, Boss Multi-phase FSM & Family Tribute",
        status: "Juego Completo Jugable en Unity"
      },
      en: {
        role: "Solo Game Developer & Programmer",
        stack: "Unity C# / UnityEngine.Pool / Decoupled FSM",
        focus: "Zero-GC Object Pooling, Multi-phase Boss FSM & Tribute",
        status: "Complete Playable Unity Title"
      }
    },
    drawScene: function(ctx, w, h) {
      // Space Background
      ctx.fillStyle = "#02040a";
      ctx.fillRect(0, 0, w, h);

      // Scrolling Starfield
      ctx.fillStyle = "#ffffff";
      const time = Date.now() * 0.001;
      for (let i = 0; i < 150; i++) {
        // Pseudo-random star positions based on index
        let sx = ((Math.sin(i * 123.45) * 0.5 + 0.5) * w * 2 - (time * (10 + (i%3)*20))) % w;
        if (sx < 0) sx += w;
        let sy = (Math.cos(i * 333.33) * 0.5 + 0.5) * h;
        const sr = (i % 3 === 0) ? 1.5 : (i % 5 === 0 ? 2 : 0.8);
        const alpha = (Math.sin(time * 3 + i) * 0.5 + 0.5) * 0.8 + 0.2;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Draw the Boss / Ship prominently
      if (avePhoenixBossImg.complete && avePhoenixBossImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        const bossSize = Math.min(w * 0.6, h * 0.8);
        // Float animation
        const floatY = Math.sin(time * 2) * 10;
        ctx.drawImage(avePhoenixBossImg, w * 0.5 - bossSize * 0.1, h * 0.5 - bossSize / 2 + floatY, bossSize, bossSize);
      }

      // Draw the Icon big on the left side
      if (avePhoenixIconImg.complete && avePhoenixIconImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        const iconSize = Math.min(w * 0.3, h * 0.4);
        ctx.drawImage(avePhoenixIconImg, w * 0.1, h * 0.1, iconSize, iconSize);
      } else if (phoenixPixelImg.complete && phoenixPixelImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        const pSize = Math.min(w * 0.3, h * 0.4);
        ctx.drawImage(phoenixPixelImg, w * 0.1, h * 0.1, pSize, pSize);
      }

      // Technical overlay
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px 'Chakra Petch'";
      ctx.fillText("ZERO-GC OBJECT POOL & MULTI-PHASE FSM", w * 0.05, h * 0.92);
    }
  },
  {
    verticalTitle: "04. FIGHTING GAMES // COMBAT SYSTEMS",
    badgeText: "GAMEPLAY // FIGHTING",
    themeColor: "#c084fc",
    // Fighting Games Arcade Icon
    hardwareHtml: `<svg class="w-16 h-16 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="2" y="6" width="20" height="12" rx="3"/>
      <circle cx="7" cy="12" r="2.5" fill="currentColor" fill-opacity="0.3"/>
      <line x1="7" y1="9.5" x2="7" y2="14.5"/>
      <line x1="4.5" y1="12" x2="9.5" y2="12"/>
      <circle cx="15" cy="10" r="1.2" fill="currentColor"/>
      <circle cx="17.5" cy="10" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="13.5" r="1.2" fill="currentColor"/>
      <circle cx="17.5" cy="13.5" r="1.2" fill="currentColor"/>
    </svg>`,
    meta: {
      es: {
        role: "Gameplay Systems Researcher",
        stack: "C++ / Unity C# / Behavior Trees / Finite State Machines",
        focus: "Hitbox Data desacoplada, Controllers de Inercia & Árboles IA",
        status: "Prototipos Técnicos de Combate Activos"
      },
      en: {
        role: "Gameplay Systems Researcher",
        stack: "C++ / Unity C# / Behavior Trees / Finite State Machines",
        focus: "Decoupled Hitbox Data, Inertia Controllers & AI Trees",
        status: "Active Combat Technical Prototypes"
      }
    },
    drawScene: function(ctx, w, h) {
      // Tech Grid Dojo
      ctx.fillStyle = "#0a0714";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 35) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 35) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Fighter Hitbox & Hurtbox visualization
      ctx.fillStyle = "rgba(59, 130, 246, 0.28)";
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.fillRect(w * 0.35, h * 0.28, w * 0.12, h * 0.46);
      ctx.strokeRect(w * 0.35, h * 0.28, w * 0.12, h * 0.46);

      ctx.fillStyle = "rgba(239, 68, 68, 0.38)";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.fillRect(w * 0.44, h * 0.38, w * 0.16, h * 0.14);
      ctx.strokeRect(w * 0.44, h * 0.38, w * 0.16, h * 0.14);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Chakra Petch'";
      ctx.fillText("FRAME-ACCURATE HITBOX DATA & BEHAVIOR TREES", w * 0.06, h * 0.88);
    }
  },
  {
    verticalTitle: "05. HARDWARE & SKILLS // TECH STACK",
    badgeText: "SKILLS // HARDWARE",
    themeColor: "#38bdf8",
    // Hardware & CPU Silicon Microchip Icon
    hardwareHtml: `<svg class="w-16 h-16 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="8" y="8" width="8" height="8" fill="currentColor" fill-opacity="0.3"/>
      <path d="M1 9h3M1 15h3M20 9h3M20 15h3M9 1v3M15 1v3M9 20v3M15 20v3"/>
    </svg>`,
    meta: {
      es: {
        role: "Systems & Engine Architect",
        stack: "C++17/20, C#, OpenGL 3.3, FMOD Studio/Core, Git Hygiene",
        focus: "Cache Locality, Heap/Stack Memory Profiling & Multithreading",
        status: "Competencias Técnicas Validadas"
      },
      en: {
        role: "Systems & Engine Architect",
        stack: "C++17/20, C#, OpenGL 3.3, FMOD Studio/Core, Git Hygiene",
        focus: "Cache Locality, Heap/Stack Memory Profiling & Multithreading",
        status: "Verified Technical Competencies"
      }
    },
    drawScene: function(ctx, w, h) {
      // Dark High-Tech Background
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      // Subtle Grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

      const time = Date.now() * 0.001;

      // Define Skills
      const skills = [
        { name: "C++", x: 0.25, y: 0.35, color: "#38bdf8", size: 1.2 },
        { name: "C#", x: 0.75, y: 0.35, color: "#a855f7", size: 1.0 },
        { name: "UNITY", x: 0.25, y: 0.65, color: "#f8fafc", size: 1.1 },
        { name: "UNREAL", x: 0.75, y: 0.65, color: "#fbbf24", size: 1.1 },
        { name: "OPENGL", x: 0.5, y: 0.2, color: "#34d399", size: 0.9 },
        { name: "FMOD", x: 0.5, y: 0.8, color: "#f43f5e", size: 0.9 },
        { name: "C", x: 0.5, y: 0.5, color: "#818cf8", size: 1.4 } // Centerpiece
      ];

      // Draw connecting lines
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      skills.forEach(s1 => {
        skills.forEach(s2 => {
          if (s1 !== s2) {
            ctx.moveTo(w * s1.x, h * s1.y);
            ctx.lineTo(w * s2.x, h * s2.y);
          }
        });
      });
      ctx.stroke();

      // Draw Glowing Nodes
      skills.forEach((skill, i) => {
        const floatY = Math.sin(time * 2 + i) * 6;
        const cx = w * skill.x;
        const cy = h * skill.y + floatY;
        const radius = 35 * skill.size;

        // Glow
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2);
        glow.addColorStop(0, skill.color);
        glow.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2); ctx.fill();

        // Hexagon Node
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = skill.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3 + (time * 0.2);
          const px = cx + radius * Math.cos(angle);
          const py = cy + radius * Math.sin(angle);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold " + (14 * skill.size) + "px 'Chakra Petch'";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(skill.name, cx, cy);
      });
      ctx.textAlign = "left"; // reset
    }
  },
  {
    verticalTitle: "06. CONTACT & HELP // HIRE INQUIRIES",
    badgeText: "CONTACT // HELP",
    themeColor: "#f43f5e",
    // Help / Contact Coin Door Icon
    hardwareHtml: `<svg class="w-16 h-16 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <circle cx="12" cy="16" r="1" fill="currentColor"/>
      <rect x="7" y="6" width="10" height="2" rx="1" fill="currentColor" fill-opacity="0.3"/>
    </svg>`,
    meta: {
      es: {
        role: "Candidato a Prácticas Universitarias",
        stack: "Email: victor.cardenas@estudiantat.upc.edu | GitHub: Vixtorbir",
        focus: "Incorporación inmediata para Convenio de Prácticas 2025-2026",
        status: "Canales de Contacto Directo Abiertos"
      },
      en: {
        role: "University Internship Candidate",
        stack: "Email: victor.cardenas@estudiantat.upc.edu | GitHub: Vixtorbir",
        focus: "Immediate availability for 2025-2026 Internship Agreement",
        status: "Direct Inquiries Open"
      }
    },
    drawScene: function(ctx, w, h) {
      // Incoming Transmission UI Background
      ctx.fillStyle = "#0a0507";
      ctx.fillRect(0, 0, w, h);

      // Radar / Grid
      ctx.strokeStyle = "rgba(244, 63, 94, 0.1)";
      ctx.lineWidth = 1;
      const time = Date.now() * 0.002;
      for (let r = 20; r < w; r += 20) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radar Sweeper
      ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5);
      ctx.arc(w * 0.5, h * 0.5, w * 0.8, time, time + 0.2);
      ctx.fill();

      // UI Tech Frame
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.05, h * 0.1, w * 0.9, h * 0.8);
      // Corner brackets
      ctx.lineWidth = 4;
      ctx.beginPath();
      const s = 15; // bracket size
      // TL
      ctx.moveTo(w*0.05, h*0.1+s); ctx.lineTo(w*0.05, h*0.1); ctx.lineTo(w*0.05+s, h*0.1);
      // TR
      ctx.moveTo(w*0.95-s, h*0.1); ctx.lineTo(w*0.95, h*0.1); ctx.lineTo(w*0.95, h*0.1+s);
      // BL
      ctx.moveTo(w*0.05, h*0.9-s); ctx.lineTo(w*0.05, h*0.9); ctx.lineTo(w*0.05+s, h*0.9);
      // BR
      ctx.moveTo(w*0.95-s, h*0.9); ctx.lineTo(w*0.95, h*0.9); ctx.lineTo(w*0.95, h*0.9-s);
      ctx.stroke();

      // Flashing Warning / Title
      ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? "#f43f5e" : "#fda4af";
      ctx.font = "bold 22px 'Chakra Petch'";
      ctx.textAlign = "center";
      ctx.fillText(">>> DIRECT TRANSMISSION <<<", w * 0.5, h * 0.22);

      // Info text with shadow glows
      ctx.font = "14px 'JetBrains Mono'";
      ctx.shadowBlur = 8;

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(255,255,255,0.5)";
      ctx.fillText("[ COMM ] victor.cardenas@estudiantat.upc.edu", w * 0.5, h * 0.4);

      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "rgba(56,189,248,0.5)";
      ctx.fillText("[ DATA ] github.com/Vixtorbir", w * 0.5, h * 0.52);

      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "rgba(16,185,129,0.5)";
      ctx.fillText("[ INIT ] UPC CITM INTERNSHIP 2025-2026", w * 0.5, h * 0.64);

      ctx.shadowBlur = 0; // reset

      // Bottom Bar
      ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
      ctx.fillRect(w * 0.05, h * 0.8, w * 0.9, h * 0.1);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px 'Chakra Petch'";
      ctx.fillText("EXTRACT PERSONNEL FILE [CV PDF] IN TOP HUB", w * 0.5, h * 0.86);

      ctx.textAlign = "left"; // reset
    }
  }
];

// Translations for UI labels
export const uiText = {
  es: {
    insert_coin_text: "INSERT COIN: PRÁCTICAS ACTIVAS",
    cv_btn: "[CV PDF]",
    meta_role_lbl: "Rol :",
    meta_stack_lbl: "Tech Stack :",
    meta_focus_lbl: "Especialidad :",
    meta_status_lbl: "Estado :",
    bottom_main_menu: "MENÚ PRINCIPAL",
    bottom_scroll: "SCROLL PARA CAMBIAR",
    bottom_inspect: "INSPECCIONAR",
    mobile_fallback_title: "EXPERIENCIA OPTIMIZADA PARA ESCRITORIO",
    mobile_fallback_msg: "Este cabinet arcade necesita una pantalla de 1024px de ancho o más para mostrarse sin recortes. Abre este portfolio en un ordenador de escritorio o portátil."
  },
  en: {
    insert_coin_text: "INSERT COIN: INTERNSHIP READY",
    cv_btn: "[RESUME PDF]",
    meta_role_lbl: "Role :",
    meta_stack_lbl: "Tech Stack :",
    meta_focus_lbl: "Focus Area :",
    meta_status_lbl: "Status :",
    bottom_main_menu: "MAIN MENU",
    bottom_scroll: "SCROLL TO NAVIGATE",
    bottom_inspect: "INSPECT / SELECT",
    mobile_fallback_title: "DESKTOP-OPTIMIZED EXPERIENCE",
    mobile_fallback_msg: "This arcade cabinet needs a screen at least 1024px wide to display without clipping. Please open this portfolio on a desktop or laptop computer."
  }
};
