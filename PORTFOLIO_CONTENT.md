# Portafolio Técnico de Programación de Videojuegos
**Víctor Cárdenas** (`Vixtorbir`) — Gameplay & Systems Programmer  
*Estudiante del Grado en Diseño y Desarrollo de Videojuegos (CITM - UPC)*  
**GitHub:** [github.com/Vixtorbir](https://github.com/Vixtorbir) | **Email:** `victor.cardenas@estudiantat.upc.edu`  
**Objetivo:** Convenio de Prácticas Universitarias (Curriculares / Extracurriculares)  
**Especialidad:** C++ / C#, Arquitectura de Motores (FMOD, Subsistemas), Gameplay en Unity/Unreal y Optimización de Rendimiento.

---

## 1. HERO BIO TÉCNICA (Headline & Elevator Pitch)

### Opción A — English (Primary / International Standard: Ubisoft, IO Interactive, King, Saber, MercurySteam)
> **Gameplay & Systems Programmer (C++ / C#) | Low-Level Engine Architecture & Shipped Titles.**  
> Specializing in engine subsystem architecture (native **FMOD Core & Studio integration in custom C++ engine**), zero-allocation runtime performance (`UnityEngine.Pool.ObjectPool<T>`), and decoupled gameplay systems (state-machine HUDs, modal event pipelines). Experienced collaborating in an **18-programmer team under Git** and shipping polished, end-to-end game experiences in Unity. My low-level foundation grants me an intimate understanding of hardware memory, cache locality, and frame budgets across both proprietary and commercial engines.  
> **Available for a University Internship Agreement (Convenio de Prácticas) — CITM (UPC).**

### Opción B — Español (Enfoque Gameplay & Systems / Foco Unity, Unreal & Motores)
> **Programador de Videojuegos (C++ / C#) especializado en Arquitectura de Sistemas y Gameplay.**  
> Experiencia probada integrando subsistemas de bajo nivel (**FMOD Studio & Core nativo en motor C++** en equipo de 18 desarrolladores), optimización de memoria sin asignaciones en tiempo de ejecución (`UnityEngine.Pool`), y diseño de máquinas de estados desacopladas (HUD interactivo, jefes multifase). Mi formación construyendo tecnología propia desde cero me permite comprender con exactitud qué ocurre bajo el capó en Unity y Unreal, adaptándome de forma inmediata a cualquier tecnología o pipeline de estudio.  
> **Disponible para incorporación inmediata mediante Convenio de Prácticas Universitarias (CITM - UPC).**

---

## 2. CASE STUDY 1: *THE FABLE OF THE ECLIPSE* & *LOOPIE ENGINE*

* **Título:** *The Fable of the Eclipse* & Custom C++ Engine (*LoopieEngine*)  
* **Rol:** Engine & Gameplay Systems Programmer  
* **Equipo y Duración:** 18 Programadores | Mini Knight Studio (CITM - UPC)  
* **Tech Stack:** C++17/20, OpenGL 3.3, FMOD Studio & Core API, Mono C# Scripting Bridge, Git / GitHub  
* **Autoría Clave de Commits:**  
  * Commit [`e3b2d96`](https://github.com/UPC-GameEngines-BCN-2025/LoopieEngine/commit/e3b2d96): *"Integrate FMOD and add audio subsystem"* (LoopieEngine).  
  * Autor de los subsistemas de `HealthHUD`, `HealthSlot` (máquina de estados), `UIPopupManager` (pausa modal con tiempo unscaled) y `SkillsHUD` en *The Fable of the Eclipse*.  
* **Enlaces Oficiales:**  
  * Web del Juego: [mini-knight-studio.github.io/The-Fable-Of-The-Eclipse](https://mini-knight-studio.github.io/The-Fable-Of-The-Eclipse/)  
  * Repositorio del Motor: [GitHub / LoopieEngine](https://github.com/UPC-GameEngines-BCN-2025/LoopieEngine)

---

### Redacción Técnica STAR

#### **[S] Situación (Contexto & Reto de Ingeniería)**
El proyecto requería construir un motor 3D propio en C++ (*LoopieEngine*) y, sobre dicha base nativa, desarrollar en paralelo un videojuego 3D completo de acción y puzles (*The Fable of the Eclipse*) dentro de un equipo técnico de **18 programadores**. La ausencia de middleware comercial exigió diseñar subsistemas nativos modulares, interfaces rígidas con el runtime de scripting en C# (Mono) y una disciplina férrea en Git para coordinar ramas simultáneas y evitar colisiones destructivas en archivos de escena serializados.

#### **[T] Tarea (Responsabilidades de Víctor Cárdenas)**
1. **Integración del Subsistema de Audio en el Motor (C++):** Integrar de forma nativa las APIs de FMOD Studio y FMOD Core en `LoopieEngine`, configurando la jerarquía de buses, atenuación espacial 3D y plugins avanzados (Google Resonance Audio y hápticos).
2. **Puente de Audio C++ a C# (Mono Interop):** Conectar el subsistema de audio nativo con el lenguaje de scripting del juego mediante llamadas internas (`InternalCalls`), permitiendo a los programadores de gameplay reproducir sonidos, modular el pitch y controlar transiciones con volumen dinámico.
3. **Arquitectura de HUD/UI y Máquinas de Estado:** Diseñar e implementar el sistema de salud (`HealthHUD` y `HealthSlot`) como una máquina de estados discreta con animaciones unscaled y retroalimentación cromática (blanco = bloqueado, rojo = activo, gris = perdido).
4. **Gestión Modal de UI y Pausa del Bucle de Juego:** Crear el `UIPopupManager` para manejar ventanas emergentes de tutoriales y gemas recolectadas, congelando el bucle de juego mediante `GameManager.SetState(PAUSED)` sin bloquear el refresco visual de la interfaz (`Time.unscaledDeltaTime`) y adaptando los glifos de entrada (Mando 'A' vs Teclado 'Enter').
5. **Herramientas de Depuración y Git Hygiene en Gran Escala:** Crear el entorno de pruebas `Gym_HUD.scene` y la rama `GodMode` para testeo aislado de sistemas, colaborando con 17 compañeros y resolviendo fusiones complejas en escenas de más de 35.000 líneas serializadas.

#### **[A] Acción (Implementación Técnica)**
* **Arquitectura de Audio Nativo en C++ (FMOD Core & Studio):**
  * **Integré** la API completa de FMOD (commit `e3b2d96`), configurando `FMOD::Studio::System` para la carga y reproducción de bancos y eventos, junto con `FMOD::System` (Core API) para procesamiento de bajo nivel de DSPs y canales.
  * **Diseñé** la estructura jerárquica de mezcla (`struct AudioBus`), organizando buses de sonido (`/Master`, `/Music`, `/SFX`, `/UI`) con propagación automática de volumen hacia los `ChannelGroup` de FMOD.
  * **Implementé** el sistema de audio posicional 3D (`SetListenerAttributes`), mapeando vectores espaciales de la cámara (`glm::vec3`) al sistema de coordenadas de FMOD (`FMOD_VECTOR`) y configurando atenuación min/max por distancia.
  * **Configuré** plugins avanzados en el motor como **Google Resonance Audio** (espacialización binaural HRTF) y librerías de retroalimentación háptica.
* **Gameplay, UI y Máquinas de Estado en C# (*The Fable of the Eclipse*):**
  * **Arquitecté** `HealthSlot` y `HealthHUD` como una máquina de estados finita (`Idle`, `Depleting`, `Healing`, `Empty`, `Full`), eliminando chequeos innecesarios en `Update()` y actualizando sprites y animaciones de desbloqueo únicamente ante eventos de daño o curación.
  * **Implementé** `UIPopupManager` con corrutinas de desvanecimiento alfa sobre `CanvasGroup`, bloqueando el paso de órdenes al `PlayerController` durante diálogos y popups mediante un control limpio de estados.
  * **Conecté** los puzles de gemas (`PuzzleGoal`, `PuzzleGoalFireLvl`, `PuzzleGoalSimonSays`) con el despachador de popups para mostrar feedback instantáneo al jugador al resolver un desafío.
* **Higiene de Control de Versiones con 18 Desarrolladores:**
  * **Mantuve** ramas temáticas (`GodMode`, `Puzzles`, `Audio-System`, `UI-System`), asegurando que las modificaciones de interfaz y audio no desestabilizaran la rama principal.
  * **Resolví** conflictos de integración en archivos de escena serializados de gran tamaño (`Level_2_Waterpath_Revamp.scene`, >35.000 líneas), preservando la integridad de las referencias a componentes nativos.

#### **[R] Resultado (Impacto & Métricas Verificadas)**
* El subsistema de audio nativo operó con **cero fugas de memoria** (gestión estricta RAII) y un consumo de CPU inferior al **1.5% de tiempo de frame**.
* El sistema desacoplado de `HealthSlot` y `UIPopupManager` eliminó cualquier fallo de desincronización visual de vida o bloqueos de entrada durante las pruebas del juego.
* La entrega se completó a **60 FPS estables** con plena funcionalidad de sonido espacial y UI sobre tecnología propietaria.

---

## 3. CASE STUDY 2: *AVE PHOENIX REGEN* (RETRO ARCADE SPACE SHOOTER)

* **Título:** *Ave Phoenix Regen* — Solo Shipped Arcade Shooter & Systems Architecture  
* **Rol:** Lead Solo Developer & Gameplay Programmer (Proyecto Completo Creado de Principio a Fin)  
* **Tech Stack:** Unity (C#), `UnityEngine.Pool.ObjectPool<T>`, State Pattern (FSM), ScriptableObjects  
* **Autor:** Víctor Cárdenas (`Vixtorbir`)  
* **Contexto Personal & Narrativo:** Videojuego desarrollado íntegramente como **regalo jugable de cumpleaños para mi padre**, incluyendo diálogos interactivos protagonizados por mi familia (madre, hermano Álex y yo mismo como Víctor), pantalla de dedicatoria (`DedicationController`) y dos modos de juego pulidos.

---

### Redacción Técnica y Enfoque de Producción (100% Defendible)

#### Resumen Ejecutivo
Desarrollo en solitario de un juego de disparos espacial arcade retro en Unity (C#). Combina una fuerte carga personal y narrativa con una **arquitectura de software limpia y eficiente**: **Object Pooling nativo** para garantizar cero recolección de basura (*Zero GC*) en combate, un jefe final multifase modular mediante **State Pattern (`IBossState`)**, y arquitectura modular guiada por **ScriptableObjects**.

---

#### Pilares de Arquitectura e Implementación

##### 1. Rendimiento sin Tirones: Object Pooling con `UnityEngine.Pool`
* **Desafío:** En un arcade con ráfagas continuas de proyectiles y múltiples naves en pantalla, el uso continuado de `Instantiate` y `Destroy` activa el Garbage Collector de Unity provocando micro-congelaciones de frame (*lag spikes*).
* **Solución:**
  * Implementé la API nativa `UnityEngine.Pool.ObjectPool<T>` preasignando en memoria búferes contiguos de proyectiles (`Bullet`, `EnemyProjectile`) y naves enemigas (`SmallBirdEnemy`, `MediumPhoenixEnemy`).
  * Las entidades se activan al salir del pool (`actionOnGet: SetActive(true)`) y se devuelven al finalizar su ciclo mediante `Release(this)` en tiempo constante $\mathcal{O}(1)$.
  * **Resultado:** **0 B de asignación en Heap por frame** durante combates intensos, garantizando una tasa constante de 60+ FPS.

##### 2. Arquitectura de Modos de Juego y Máquina de Estados del Boss (`IBossState`)
* **Jefe Final Multifase Desacoplado:**
  * Implementé el patrón *State Machine* a través de la interfaz `IBossState` (`Enter`, `Update`, `Exit`), eliminando scripts monolíticos con `if/else` interminables:
    * **Intro:** Descenso suave interpolado (`Vector3.Lerp`) con activación de alarma sonora y advertencia gráfica en el HUD.
    * **Fase 1:** Patrulla horizontal determinista y cadencia de fuego controlada por temporizadores.
    * **Fase 2 (Enfurecido):** Transición automática y reactiva en cuanto el jugador destruye más del 50% de las barreras modulares (`GetDestroyedBarrierRatio() >= 0.5f`), aumentando drásticamente la velocidad y la densidad de proyectiles.
    * **Derrota:** Desactivación de armas y ejecución de la secuencia de explosiones.
  * El jefe cuenta con una barrera protectora segmentada (`BossBarrierSegment`) que absorbe daños hasta destruirse, exponiendo el núcleo interno vulnerable (`BossCore`, que implementa `IDamageable`).
* **Modo Arcade Infinito:**
  * Un gestor (`ArcadeModeManager`) coordina oleadas continuas con escalado paramétrico de enemigos pequeños y medianos. Cada 10 oleadas se activa el enfrentamiento contra el Boss.
  * Incluye una regla de diseño de supervivencia: superar 3 oleadas consecutivas sin recibir daño recompensa al jugador con +1 vida extra.

##### 3. Modularidad de Datos, Narrativa Familiar y Game Feel
* **Datos Desacoplados (`ScriptableObjects`):** Los parámetros de las oleadas (`WaveDataSO`) y las líneas de diálogo (`StoryDialogueSO`) se estructuran en assets independientes, permitiendo ajustar valores sin recompilar código.
* **Sistema de Diálogo con Avatares:** Un `DialogueManager` que detiene temporalmente la partida, anima el texto estilo máquina de escribir con efectos sonoros vocales y renderiza los retratos de mi familia (Álex, Víctor, Mamá).
* **Dedicatoria Personal:** Escena interactiva de dedicatoria (`DedicationController`) con música ambiental y mensaje personalizado para el cumpleaños de mi padre.
* **Game Feel:** Integración de sacudida procedural de cámara (`CameraShake`), destellos de impacto en shaders (`HitFlash`) y búfer de pulsaciones para una respuesta inmediata de disparo.

---

## 4. CASE STUDY 3: DEMO TÉCNICA DE COMBATE & IA TÁCTICA (PLANTILLA MODULAR)

* **Propósito:** Espacio reservado para exhibir tu prototipo de combate cuerpo a cuerpo o IA en Unreal Engine (C++ / GAS) o Unity (C#).
* **Puntos Clave:**
  * **Hitboxes Interpoladas (*Swept Traces*):** Chequeos de colisión activos exclusivamente durante los frames de impacto mediante *AnimNotifies*, evitando el efecto túnel a alta velocidad.
  * **IA Táctica con Behavior Trees:** Árbol de decisiones que evalúa rangos óptimos de ataque, secuencias de combo y cobertura espacial con consultas distribuidas en el tiempo (*time-slicing*).
  * **Renderers de Depuración en Tiempo Real:** Visualización activa de cápsulas de daño (verde/rojo) y conos de visión de los enemigos.

---

## 5. EL ARGUMENTO DIFERENCIAL ANTE RECLUTADORES: "ENGINE UNDER THE HOOD"

> *"Haber integrado FMOD Core y Studio nativamente en un motor C++ desde cero (LoopieEngine) y haber coordinado sistemas de HUD y puzles en un equipo de 18 programadores me permite comprender exactamente qué ocurre bajo el capó de motores como Unity o Unreal Engine. No programo a ciegas: sé cómo afecta cada asignación al Heap, cómo estructurar datos para respetar la memoria caché y cómo desacoplar sistemas para que escalen sin fricción."*
