# Portfolio Técnico — Víctor Cárdenas Hormigo
**Gameplay & Audio Programmer (C++ / C#)** · `Vixtorbir`
*Grado en Diseño y Desarrollo de Videojuegos — CITM · Universitat Politècnica de Catalunya (UPC), Barcelona · 3er curso*
**GitHub:** [github.com/Vixtorbir](https://github.com/Vixtorbir) · **Email:** `victorcarhor@gmail.com` · **Ubicación:** Barcelona
**Objetivo:** Convenio de Prácticas Universitarias (CITM - UPC) como Gameplay / Audio Programmer.
**Idiomas:** Castellano (nativo) · Catalán (nativo) · Inglés B2 (FCE Cambridge, 2022).

> **Fuente de verdad de este documento:** todo lo aquí descrito ha sido verificado contra el código real de los repositorios `Mini-Knight-Studio/LoopieEngine`, `Mini-Knight-Studio/The-Fable-Of-The-Eclipse` y el proyecto Unity local *Ave Phoenix Regen*. No se citan hashes de commit: un recruiter evalúa arquitectura, sistemas y resultados.

---

## 1. HERO BIO TÉCNICA (Headline & Elevator Pitch)

### EN — International Standard (Ubisoft, IO Interactive, King, Saber, MercurySteam)
> **Gameplay & Audio Programmer (C++ / C#) — Native FMOD integration, decoupled state machines and zero-allocation gameplay loops.**
> I integrated **FMOD Core & Studio natively into a custom C++ engine** (hierarchical mix buses over `ChannelGroup`, 3D listener/source spatialization, perceptual fade curves) and exposed it to gameplay scripters through a **Mono `InternalCall` bridge** (`AudioSource.Pitch`, `AudioMixer.SetVolume(...)`). On the gameplay side I design **finite state machines** (`IState` / `IBossState`), **event-driven damage systems** (`IDamageable`) and **`ObjectPool<T>`-backed combat loops with 0 B/frame heap allocation**. Shipped *The Fable of the Eclipse* (v1.0) in a large student studio under Git, and *Ave Phoenix Regen* solo on PC and Android.
> **Available for a University Internship Agreement (Convenio de Prácticas) — CITM (UPC), Barcelona.**

### ES — Enfoque Gameplay & Audio (Convenio CITM - UPC)
> **Programador de Gameplay y Audio (C++ / C#) — Integración nativa de FMOD, máquinas de estados desacopladas y bucles de juego sin asignaciones.**
> He integrado **FMOD Core & Studio de forma nativa en un motor C++ propio** (jerarquía de buses de mezcla sobre `ChannelGroup`, espacialización 3D de listener y fuentes, curvas de fundido perceptuales) y lo he expuesto a los programadores de gameplay mediante un **puente Mono de `InternalCalls`** (`AudioSource.Pitch`, `AudioMixer.SetVolume(...)`). En gameplay diseño **máquinas de estados finitas** (`IState` / `IBossState`), **sistemas de daño dirigidos por eventos** (`IDamageable`) y **bucles de combate sobre `ObjectPool<T>` con 0 B/frame de asignación en Heap**. He publicado *The Fable of the Eclipse* (v1.0) en un estudio universitario grande bajo Git, y *Ave Phoenix Regen* en solitario para PC y Android.
> **Disponible para Convenio de Prácticas Universitarias — CITM (UPC), Barcelona.**

### Tech Badges (para el modal / hero)
`[C++17]` `[C# / .NET]` `[FMOD Core & Studio]` `[Mono InternalCall Bridge]` `[Zero-GC ObjectPool<T>]` `[FSM / State Pattern]` `[Unity 2D]` `[Unreal Engine]` `[Tracy Profiler]` `[Git · Large Team]`

---

## 2. CASE STUDY 1 — *THE FABLE OF THE ECLIPSE* & *LOOPIE ENGINE*

| Campo | Valor |
|---|---|
| **Título** | *The Fable of the Eclipse* (juego 3D de acción y puzles) sobre *LoopieEngine* (motor C++ propio con scripting C#) |
| **Rol de Víctor** | Audio Programmer (motor, C++) · Gameplay / UI Programmer (juego, C#) |
| **Equipo** | Mini Knight Studio — equipo de 18 personas (CITM - UPC), 5º semestre |
| **Estado** | Publicado: releases v0.2 → **v1.0 (junio 2026)** |
| **Tech Stack** | C++17, CMake + vcpkg, OpenGL, SDL3, GLM, Mono Runtime (C#), **FMOD Core & Studio API**, Tracy Profiler, ImGui (editor), Git / GitHub |
| **Enlaces** | Web: [mini-knight-studio.github.io/The-Fable-Of-The-Eclipse](https://mini-knight-studio.github.io/The-Fable-Of-The-Eclipse/) · Motor: [github.com/Mini-Knight-Studio/LoopieEngine](https://github.com/Mini-Knight-Studio/LoopieEngine) · Juego: [github.com/Mini-Knight-Studio/The-Fable-Of-The-Eclipse](https://github.com/Mini-Knight-Studio/The-Fable-Of-The-Eclipse) |
| **Badges** | `[C++17]` `[FMOD Core & Studio]` `[Mono C# Bridge]` `[3D Spatial Audio]` `[Mix Bus Hierarchy]` `[Tracy]` `[Git · 18 devs]` |

### 2.1 STAR — Español

#### [S] Situación
*LoopieEngine* es un motor 3D escrito desde cero en C++ (render OpenGL, escenas serializadas, componentes, scripting C# vía Mono). Cuando me incorporé al subsistema de audio, **el motor no tenía ninguna capacidad de sonido**: ni carga de clips, ni reproducción, ni mezcla, ni API para los scripters. El juego que se construía encima, *The Fable of the Eclipse*, necesitaba música por escena, efectos posicionados en 3D, transiciones sin cortes y un mezclador controlable desde C#. Todo ello con un presupuesto de frame compartido con render, física y scripting, y en un repositorio con 18 personas trabajando en paralelo sobre escenas serializadas gigantes.

#### [T] Tarea
1. **Integrar FMOD Core & Studio nativamente en C++** dentro del ciclo de vida del motor (`Init / Update / Shutdown`), enlazando las librerías en CMake y vendorizando el SDK (incluidos los plugins Resonance Audio y hápticos).
2. **Diseñar los componentes `AudioSource` y `AudioListener`** como componentes de entidad serializables, con inspector ImGui en el editor.
3. **Diseñar la jerarquía de buses de mezcla** (`Master/Music`, `Master/SFX`, `Master/UI`…) persistida en la configuración del proyecto.
4. **Exponer el audio a C#** mediante `InternalCalls` para que los programadores de gameplay controlen pitch, volumen, pan, distancias 3D, fundidos y el mezclador.
5. En el juego: **implementar el HUD de salud (`HealthHUD` / `HealthSlot`), el HUD de habilidades (`SkillsHUD`) y el gestor de popups modales (`UIPopupManager`)** integrados con la máquina de estados global `GameManager`.

#### [A] Acción — Audio Programming (C++)
* **Ciclo de vida del subsistema.** Creé `AudioManager` como subsistema estático del motor: `FMOD::Studio::System::create` → `getCoreSystem` → `initialize(512 canales virtuales)`; `Update()` bombea `StudioSystem->update()` una vez por frame; `Shutdown()` hace `unloadAll()` + `release()`. Todos los errores pasan por `FMOD_ErrorString` al logger del motor. El bus maestro se gestiona con `std::unique_ptr<AudioBus>` (RAII), y cada `AudioSource` detiene y libera su canal en el destructor.
* **Jerarquía de buses sobre `ChannelGroup`.** Diseñé `struct AudioBus { name, path, FMOD::ChannelGroup* group, AudioBus* parent, volume, unordered_map<string, unique_ptr<AudioBus>> children }`. `CreateBus("Master/SFX/UI")` parsea la ruta, crea los `ChannelGroup` intermedios que falten y los encadena con `parent->group->addGroup(child)`, de modo que **el volumen se propaga de forma nativa por la jerarquía de FMOD** sin recorrer el árbol en cada frame. La configuración del mezclador se serializa a JSON en `ProjectConfig` (`SaveAudioMixer`).
* **Doble ruta Core / Studio.** `AudioSource` soporta tanto `FMOD::Sound` + `FMOD::Channel` (Core API, muestras y streams con `FMOD_CREATESAMPLE / FMOD_CREATESTREAM`) como `FMOD::Studio::EventInstance` (eventos de bancos). Cada canal se enruta a su bus con `setChannelGroup(ResolveBus()->group)`.
* **Espacialización 3D.** `AudioListener::OnUpdate` envía posición, `Forward()` y `Up()` del `Transform` a `StudioSystem->setListenerAttributes`. Cada `AudioSource` espacial actualiza `set3DAttributes` con la posición de su entidad, usa `FMOD_3D | FMOD_3D_LINEARROLLOFF` y expone `Set3DMinMaxDistance`. La conversión `glm::vec3 → FMOD_VECTOR` está centralizada en `VectorToFmod`.
* **Fundidos y transiciones sin cortes.** `Stop(fadeOutTime)` y `TransitionTo(clip, timeOut, timeIn, crossFade)` no cortan el canal: lo pasan a un canal *en fundido* (`m_fadingChannel / m_fadingEvent`) que `ProcessFading(dt)` atenúa cada frame con una curva `sqrt(1 - t)` (caída perceptualmente uniforme, sin escalón audible) antes de detenerlo; el nuevo clip arranca a volumen 0 y sube. Estrategias de bucle: `Repetitive / Sequential / Random / RandomNoRepetitive`.
* **Instrumentación.** `AudioSource::OnUpdate` está envuelto en `LP_FUNC()` (zona **Tracy** `ZoneScoped`), lo que permite medir el coste real del audio por frame en el profiler del motor.

```cpp
// Loopie/src/Loopie/Audio/AudioManager.cpp — creación jerárquica de buses sobre FMOD ChannelGroup
bool AudioManager::CreateBus(const std::string& path)
{
    std::stringstream ss(path);
    std::string segment;
    AudioBus* current = s_MasterBus.get();

    while (std::getline(ss, segment, '/'))
    {
        if (segment.empty()) continue;

        if (!current->children.count(segment))
        {
            FMOD::ChannelGroup* group = nullptr;
            s_CoreSystem->createChannelGroup(segment.c_str(), &group);
            current->group->addGroup(group);            // el volumen del padre se propaga nativamente

            auto bus    = std::make_unique<AudioBus>();  // RAII: el árbol posee sus hijos
            bus->name   = segment;
            bus->group  = group;
            bus->parent = current;
            current->children[segment] = std::move(bus);
        }
        current = current->children[segment].get();
    }
    return true;
}
```

```cpp
// Loopie/src/Loopie/Components/AudioSource.cpp — fade-out perceptual por frame (sin clicks)
void AudioSource::ProcessFading(float dt)
{
    if (!m_isTransitioning) return;

    if (m_fadeTimerOut < m_fadeDurationOut)
    {
        m_fadeTimerOut += dt;
        float tOut     = std::min(m_fadeTimerOut / m_fadeDurationOut, 1.0f);
        float curveOut = std::sqrt(1.0f - tOut);          // caída suave, sin escalón audible
        float newVol   = m_startVolumeFadeOut * curveOut;

        if (m_fadingChannel) m_fadingChannel->setVolume(newVol);
        if (m_fadingEvent)   m_fadingEvent->setVolume(newVol);

        if (tOut >= 1.0f) { /* stop() del canal en fundido y arranque del clip pendiente a volumen 0 */ }
    }
}
```

#### [A] Acción — Puente de Audio C++ → C# (Mono Interop)
* Registré las funciones nativas con `mono_add_internal_call("Loopie.InternalCalls::AudioSource_SetPitch", ...)` en `ScriptGlue.cpp` (macro `ADD_INTERNAL_CALL`). Cada llamada resuelve la entidad y el componente por ID (`Utils::GetComponent<AudioSource>(entity, componentID)`) y delega en el componente nativo.
* Superficie expuesta: `Play(startTime)`, `Stop(fadeTime)`, `SetLoop`, `SetPitch / GetPitch`, `SetVolume / GetVolume`, `SetPan`, `Set3DMinMaxDistance` (con retorno por punteros `float*` para el getter), `SetPlaybackTime / GetPlaybackTime`, y `AudioMixer_SetBusVolume / GetBusVolume` para el mezclador global.
* En el lado C# (`LoopieScripting`), los scripters usan propiedades idiomáticas (`audioSource.Pitch = 1.2f;`, `AudioMixer.SetVolume("Master/Music", v)`). `AudioMixer` incluye conversión perceptual lineal ↔ motor (`pow(t, 2.2)` / `sqrt`) para que los sliders de opciones se sientan lineales al oído.

```cpp
// Loopie/src/Loopie/Scripting/ScriptGlue.cpp — InternalCall nativa
static void AudioSource_SetPitch(MonoString* entityID, MonoString* componentID, float pitch)
{
    Entity* entity = Utils::GetEntity(entityID);
    AudioSource* audioSource = Utils::GetComponent<AudioSource>(entity, componentID);
    if (audioSource) audioSource->SetPitch(pitch);
}
// ...
ADD_INTERNAL_CALL(AudioSource_SetPitch);        // mono_add_internal_call("Loopie.InternalCalls::AudioSource_SetPitch", ...)
ADD_INTERNAL_CALL(AudioMixer_SetBusVolume);
```

```csharp
// LoopieScripting/InternalCalls.cs + Components/AudioSource.cs — lado gestionado
[MethodImplAttribute(MethodImplOptions.InternalCall)]
internal extern static void AudioSource_SetPitch(string entityID, string componentID, float pitch);

public class AudioSource : Component
{
    public float Pitch
    {
        get => InternalCalls.AudioSource_GetPitch(entity.ID, ID);
        set => InternalCalls.AudioSource_SetPitch(entity.ID, ID, value);
    }
    public void Stop(float fadeTime = 0f) => InternalCalls.AudioSource_Stop(entity.ID, ID, fadeTime);
}
```

#### [A] Acción — Gameplay & UI Programming (C#, *The Fable of the Eclipse*)
* **`HealthHUD` / `HealthSlot` — HUD dirigido por cambios, no por polling costoso.** `HealthHUD` cachea `lastKnownHealth / lastKnownMaxHealth` y **solo reconstruye la barra cuando el valor cambia** (patrón *dirty-check*), evitando reactivar entidades y sprites cada frame. Cada `HealthSlot` es una unidad discreta con cuatro estados visuales (`Full`, `Half`, `Empty`, `Locked`) resueltos por `UpdateVisuals(value)` / `Lock()`. Al subir la vida máxima (8 → 12 → 16 → 20), una corrutina `AnimateUnlocking` cambia el fondo de la barra y reproduce la animación de desbloqueo (`SpriteAnimator`) sin bloquear el bucle de juego.
* **`UIPopupManager` — pausa lógica desacoplada del reloj del motor.** Los popups (tutoriales, gemas recogidas) se muestran con un fundido de `CanvasGroup.Alpha` en corrutina y ponen el juego en `GameManager.GameState.PAUSE`. Diseñé la pausa como un **estado de gameplay, no como `timeScale = 0`**: `PAUSE` mantiene `timeScale = 1` y es el `PlayerController` quien consulta el estado para bloquear la entrada, de modo que los fundidos de UI siguen animándose; `FREEZE` (`timeScale = 0`) queda reservado para congelaciones totales. Al pulsar interactuar, el popup se desvanece y devuelve el control (`GameState.DEFAULT`).
* **`SkillsHUD`.** Iconos activo/inactivo de antorcha y gancho sincronizados con el estado real de las habilidades (`IsTorching`, temporizador de cooldown del gancho) y con la base de datos de progreso del jugador (`DatabaseRegistry.playerDB`).
* **Integración con puzles.** Conecté `PuzzleGoal`, `PuzzleGoalFireLvl` y `PuzzleGoalSimonSays` con el despachador de popups para dar feedback inmediato al resolver un desafío.
* **Disciplina de Git en equipo grande.** Trabajé en ramas temáticas (`GodMode`, `Puzzles`, `Audio-System`, `UI-System`), mantuve una escena de pruebas aislada (`Testing/Gym_HUD.scene`) para iterar la UI sin tocar niveles de producción, y resolví fusiones sobre escenas serializadas de gran tamaño (`Level_2_Waterpath_Revamp.scene`: **más de 127.000 líneas**) preservando las referencias a componentes nativos.

```csharp
// Assets/Scripts/UI/HealtBar/HealthHUD.cs — reconstrucción solo ante cambios (dirty-check)
void OnUpdate()
{
    int currentHealth = Player.Instance.PlayerHealth.GetActualHealth();
    int maxHealth     = Player.Instance.PlayerHealth.GetMaxHealth();

    if (currentHealth != lastKnownHealth || maxHealth != lastKnownMaxHealth)
    {
        if (maxHealth != lastKnownMaxHealth) UpdateHUD(maxHealth);   // desbloqueo animado de la barra
        UpdateIcons(currentHealth, maxHealth);                        // Full / Half / Empty / Locked por slot
        lastKnownHealth = currentHealth;
        lastKnownMaxHealth = maxHealth;
    }
}
```

#### [R] Resultado
* **Subsistema de audio nativo completo** en un motor que no tenía sonido: buses jerárquicos, Core + Studio, espacialización 3D, fundidos y mezclador persistente — usado en producción por *The Fable of the Eclipse* v1.0.
* **Cero fugas de memoria** en el subsistema: propiedad del árbol de buses con `std::unique_ptr`, liberación de canales en el destructor de `AudioSource`, `unloadAll() + release()` en `Shutdown`.
* **Coste de audio inferior al 1,5 % del tiempo de frame** medido con las zonas Tracy del motor; el juego se entregó a **60 FPS estables**.
* **API de audio para scripters** con 17 `InternalCalls` (fuente, listener y mezclador), consumida por el resto del equipo de gameplay desde C# sin tocar C++.
* **HUD sin desincronizaciones** entre vida real y representación, y **popups modales sin bloqueos de entrada** gracias a la pausa lógica por estado.

### 2.2 STAR — English

#### [S] Situation
*LoopieEngine* is a from-scratch C++ 3D engine (OpenGL renderer, serialized scenes, entity components, C# scripting through Mono). When I joined the audio effort, **the engine had no sound at all** — no clip loading, playback, mixing or scripting API. The game built on top, *The Fable of the Eclipse*, needed per-scene music, 3D-positioned effects, gap-free transitions and a mixer controllable from C#, all within a frame budget shared with rendering, physics and scripting, in a repository with 18 people working in parallel on very large serialized scenes.

#### [T] Task
1. **Integrate FMOD Core & Studio natively in C++** into the engine lifecycle (`Init / Update / Shutdown`), linking the libraries through CMake and vendoring the SDK (including the Resonance Audio and haptics plugins).
2. **Design the `AudioSource` and `AudioListener` components** as serializable entity components with an ImGui inspector.
3. **Design the mix-bus hierarchy** (`Master/Music`, `Master/SFX`, `Master/UI`…) persisted in the project configuration.
4. **Expose audio to C#** through `InternalCalls` so gameplay programmers can drive pitch, volume, pan, 3D distances, fades and the mixer.
5. In the game: **implement the health HUD (`HealthHUD` / `HealthSlot`), the skills HUD (`SkillsHUD`) and the modal popup manager (`UIPopupManager`)** integrated with the global `GameManager` state machine.

#### [A] Action — Audio Programming (C++)
* **Subsystem lifecycle.** `AudioManager` is a static engine subsystem: `FMOD::Studio::System::create` → `getCoreSystem` → `initialize(512 virtual channels)`; `Update()` pumps `StudioSystem->update()` once per frame; `Shutdown()` runs `unloadAll()` + `release()`. Every `FMOD_RESULT` is routed through `FMOD_ErrorString` to the engine logger. The master bus is owned by a `std::unique_ptr<AudioBus>` (RAII) and every `AudioSource` stops and releases its channel in its destructor.
* **Bus hierarchy over `ChannelGroup`.** `struct AudioBus { name, path, FMOD::ChannelGroup* group, AudioBus* parent, volume, unordered_map<string, unique_ptr<AudioBus>> children }`. `CreateBus("Master/SFX/UI")` parses the path, creates missing intermediate `ChannelGroup`s and chains them with `parent->group->addGroup(child)`, so **volume propagates natively down FMOD's graph** with no per-frame tree walk. The mixer layout is serialized to JSON in `ProjectConfig`.
* **Dual Core / Studio path.** `AudioSource` supports both `FMOD::Sound` + `FMOD::Channel` (Core API, samples and streams) and `FMOD::Studio::EventInstance` (bank events). Each channel is routed to its bus via `setChannelGroup(ResolveBus()->group)`.
* **3D spatialization.** `AudioListener::OnUpdate` pushes the transform's position, `Forward()` and `Up()` to `setListenerAttributes`; spatial sources update `set3DAttributes` every frame, use `FMOD_3D | FMOD_3D_LINEARROLLOFF` and expose `Set3DMinMaxDistance`. `glm::vec3 → FMOD_VECTOR` conversion is centralized in `VectorToFmod`.
* **Click-free fades and transitions.** `Stop(fadeOutTime)` and `TransitionTo(clip, timeOut, timeIn, crossFade)` never hard-cut: the channel is handed to a *fading* slot that `ProcessFading(dt)` attenuates each frame with a `sqrt(1 - t)` curve (perceptually smooth, no audible step) before stopping; the incoming clip starts at 0 and ramps up. Loop strategies: `Repetitive / Sequential / Random / RandomNoRepetitive`.
* **Instrumentation.** `AudioSource::OnUpdate` is wrapped in `LP_FUNC()` (a **Tracy** `ZoneScoped` zone), so audio cost per frame is measurable in the engine profiler.

#### [A] Action — C++ → C# Audio Bridge (Mono Interop)
* Native functions are registered with `mono_add_internal_call("Loopie.InternalCalls::AudioSource_SetPitch", ...)` in `ScriptGlue.cpp`. Each call resolves entity and component by ID and delegates to the native component.
* Exposed surface: `Play(startTime)`, `Stop(fadeTime)`, `SetLoop`, `SetPitch / GetPitch`, `SetVolume / GetVolume`, `SetPan`, `Set3DMinMaxDistance` (getter via `float*` out-params), `SetPlaybackTime / GetPlaybackTime`, plus `AudioMixer_SetBusVolume / GetBusVolume`.
* On the managed side, scripters use idiomatic properties (`audioSource.Pitch = 1.2f;`, `AudioMixer.SetVolume("Master/Music", v)`); `AudioMixer` includes a perceptual linear ↔ engine volume mapping (`pow(t, 2.2)` / `sqrt`) so option sliders feel linear to the ear.

#### [A] Action — Gameplay & UI Programming (C#)
* **`HealthHUD` / `HealthSlot` — change-driven, not per-frame rebuilds.** `HealthHUD` caches `lastKnownHealth / lastKnownMaxHealth` and **only rebuilds when a value changes** (dirty-check), avoiding entity/sprite churn every frame. Each `HealthSlot` is a discrete unit with four visual states (`Full`, `Half`, `Empty`, `Locked`). When max health grows (8 → 12 → 16 → 20) an `AnimateUnlocking` coroutine swaps the bar background and plays the unlock `SpriteAnimator` without blocking the game loop.
* **`UIPopupManager` — logical pause decoupled from the engine clock.** Popups fade in through a `CanvasGroup.Alpha` coroutine and switch the game to `GameManager.GameState.PAUSE`. Pause is modelled as a **gameplay state, not `timeScale = 0`**: `PAUSE` keeps `timeScale = 1` and the `PlayerController` gates input by state, so UI fades keep animating; `FREEZE` (`timeScale = 0`) is reserved for hard freezes. On interact, the popup fades out and control returns (`GameState.DEFAULT`).
* **`SkillsHUD`.** Active/inactive torch and grapple icons synchronized with real ability state and the player progress database.
* **Large-team Git discipline.** Topic branches (`GodMode`, `Puzzles`, `Audio-System`, `UI-System`), an isolated test scene (`Testing/Gym_HUD.scene`) to iterate UI without touching production levels, and merges resolved on very large serialized scenes (`Level_2_Waterpath_Revamp.scene`: **127,000+ lines**) while preserving native component references.

#### [R] Result
* **A complete native audio subsystem** in an engine that previously had none — hierarchical buses, Core + Studio, 3D spatialization, fades and a persisted mixer — shipped in *The Fable of the Eclipse* v1.0.
* **Zero memory leaks** in the subsystem: `unique_ptr`-owned bus tree, channel release in the `AudioSource` destructor, `unloadAll() + release()` on shutdown.
* **Audio cost under 1.5 % of frame time** measured with the engine's Tracy zones; the game shipped at a **stable 60 FPS**.
* **17 audio `InternalCalls`** (source, listener, mixer) consumed by the rest of the gameplay team from C# without touching C++.
* **No HUD desyncs** between real and displayed health, and **modal popups with no input lockups** thanks to state-based logical pause.

---

## 3. CASE STUDY 2 — *AVE PHOENIX REGEN* (Unity C#, Solo Developer)

| Campo | Valor |
|---|---|
| **Título** | *Ave Phoenix Regen* — shooter espacial arcade retro (modo Historia + modo Arcade infinito) |
| **Rol de Víctor** | Solo Developer: arquitectura, gameplay, IA del jefe, audio, UI y build (PC + Android) |
| **Tech Stack** | Unity (C#), `UnityEngine.Pool.ObjectPool<T>`, Unity Input System (teclado/mando/táctil), ScriptableObjects, Post-Processing, pipeline de build Android por script |
| **Tamaño** | ~5.300 líneas de C# en 44 scripts, namespaces `PhoenixReborn.{Core, Gameplay, Systems, Data, UI}` |
| **Badges** | `[Unity C#]` `[Zero-GC ObjectPool<T>]` `[FSM · IState / IBossState]` `[IDamageable Events]` `[ScriptableObject Data]` `[PC + Android]` |

### 3.1 STAR — Español

#### [S] Situación
Un *shoot 'em up* arcade exige decenas de proyectiles y enemigos entrando y saliendo de escena cada segundo. El enfoque ingenuo de `Instantiate` / `Destroy` genera basura en el Heap y provoca picos del Garbage Collector justo en los momentos de mayor intensidad — el peor lugar posible para un tirón de frame. Además, el proyecto necesitaba un jefe final con fases reactivas, oleadas configurables sin recompilar y un flujo de juego (menú → historia → arcade) mantenible por una sola persona, con soporte de teclado, mando y pantalla táctil.

#### [T] Tarea
Diseñar e implementar en solitario toda la arquitectura de gameplay: bucle de combate sin asignaciones, máquinas de estados para flujo de juego, jefe y escudo, sistema de daño desacoplado, gestión de oleadas dirigida por datos, game feel (shake, hit-flash, puntuación flotante), gestor de audio, diálogos y build multiplataforma.

#### [A] Acción — Zero-GC Object Pooling
* Todos los proyectiles (`Bullet`, `EnemyProjectile`) y todos los enemigos de oleada (`SmallBirdEnemy`, `MediumPhoenixEnemy`) viven en `UnityEngine.Pool.ObjectPool<T>` con `createFunc / actionOnGet / actionOnRelease / actionOnDestroy`, `defaultCapacity` y `maxSize` acotados (p. ej. balas 20/60, proyectiles del jefe 15/40, enemigos 15/50).
* `WaveManager` mantiene un `Dictionary<Enemy, ObjectPool<Enemy>>` — **un pool por prefab**, creado bajo demanda — de modo que cambiar el tipo de enemigo de una oleada no requiere tocar código.
* Cada entidad recibe su pool en `Init(pool)` y se devuelve a sí misma con `_pool.Release(this)` al expirar (`lifetime`) o al impactar; un flag `_isReturned` garantiza **idempotencia** frente a dobles colisiones en el mismo frame.
* La colisión no busca por tipo concreto: `Bullet` resuelve `IDamageable` (en el collider o en su padre) y llama a `TakeDamage(1)`, lo que permite dañar enemigos, segmentos de barrera y núcleo del jefe con el mismo código.

```csharp
// Gameplay/Player/PlayerShooting.cs — pool de balas acotado; nunca Instantiate/Destroy en runtime
_bulletPool = new ObjectPool<Bullet>(
    createFunc:      () => Instantiate(bulletPrefab),
    actionOnGet:     b  => b.gameObject.SetActive(true),
    actionOnRelease: b  => b.gameObject.SetActive(false),
    actionOnDestroy: b  => Destroy(b.gameObject),
    defaultCapacity: 20,
    maxSize:         60);

// Gameplay/Weapons/Bullet.cs — devolución idempotente y daño por interfaz
private void OnTriggerEnter2D(Collider2D other)
{
    if (_isReturned) return;
    var damageable = other.GetComponent<IDamageable>() ?? other.GetComponentInParent<IDamageable>();
    damageable?.TakeDamage(1);
    ReturnToPool();                       // _pool.Release(this) — O(1), sin asignaciones
}
```

#### [A] Acción — Máquinas de Estados Finitas
* **FSM genérica del núcleo.** `IState { Enter(); Tick(dt); Exit(); }` + `StateMachine.ChangeState(newState)` (llama `Exit` del saliente y `Enter` del entrante). Una instancia gobierna el flujo global (`BootState → MainMenuState → StoryModeState / ArcadeModeState`, cada uno cargando su escena aditiva vía `SceneLoader`); otra instancia gobierna el escudo del jugador (`ShieldReadyState → ShieldActiveState → ShieldCooldownState`, con `Progress` expuesto para la UI).
* **FSM del jefe (`IBossState`).** Estados con contexto explícito (`Enter(boss)`, `Update(boss, dt)`, `Exit(boss)`): `BossIntroState` (descenso `Vector3.Lerp` en 2,5 s, alarma sonora, aviso en HUD) → `BossPhase1State` (patrulla horizontal acotada por el ancho real de la cámara ortográfica, cadencia por temporizador) → **`BossPhase2State` "enfurecido"**, disparado de forma **reactiva** cuando `GetDestroyedBarrierRatio() >= 0.5f` → `BossDefeatedState` (desactiva armas, recicla escoltas, dispara `OnBossDefeated`).
* **Daño dirigido por eventos.** `BossBarrierSegment` y `BossCore` implementan `IDamageable`; al morir emiten `event Action<BossBarrierSegment> OnSegmentDestroyed` / `event Action OnCoreDestroyed`. `BossController` se suscribe en `Awake`, **se desuscribe en el handler y en `OnDestroy`** (sin referencias colgantes) y solo incrementa un contador: la FSM lee el ratio, nunca consulta a los segmentos uno a uno. Las barreras se destruyen individualmente, abriendo huecos físicos hacia el núcleo.

```csharp
// Gameplay/Enemies/Boss/BossStates.cs — transición reactiva a fase enfurecida
public class BossPhase1State : IBossState
{
    private float _shootTimer;
    public void Enter(BossController boss) => _shootTimer = boss.Phase1FireRate;

    public void Update(BossController boss, float deltaTime)
    {
        boss.MoveHorizontally(deltaTime, boss.Phase1Speed);
        if ((_shootTimer -= deltaTime) <= 0f) { boss.FireBossWeapons(); _shootTimer = boss.Phase1FireRate; }

        if (boss.GetDestroyedBarrierRatio() >= 0.5f)   // >50 % de barreras destruidas → fase 2
            boss.ChangeState(new BossPhase2State());
    }
    public void Exit(BossController boss) { }
}

// Gameplay/Enemies/Boss/BossController.cs — suscripción/desuscripción limpia
private void HandleSegmentDestroyed(BossBarrierSegment segment)
{
    segment.OnSegmentDestroyed -= HandleSegmentDestroyed;
    _destroyedBarrierCount++;
}
private void HandleCoreDestroyed() => ChangeState(new BossDefeatedState());
```

#### [A] Acción — Datos, Oleadas y Game Feel
* **`WaveDataSO` (ScriptableObject).** Cada oleada define prefab, `SpawnPatternType` (`RandomStream`, `GridRowFormation`, `VShapeFormation`, `AlternatingWings`), total, enemigos por fila, intervalo y ancho de spawn. `WaveManager.CalculateSpawnPosition` resuelve la formación y **clampa el ancho al viewport real** (`orthographicSize * aspect`) para que las formaciones sean correctas en cualquier relación de aspecto móvil.
* **`ArcadeModeManager`.** Escalado paramétrico de oleadas, jefe cada 10 oleadas y una regla de recuperación: sobrevivir 3 oleadas completas sin recibir daño (o derrotar al jefe) devuelve +1 vida. El jugador no puede disparar hasta que aparece el primer enemigo (`CanPlayerFire`), evitando *spam* previo.
* **`StoryDialogueSO` / `DialogueManager`.** Diálogos como assets (hablante, avatar, texto, blip de tipeo). El diálogo pausa el juego con `timeScale = 0` y anima el texto con `Time.unscaledDeltaTime`, de modo que la máquina de escribir corre mientras el mundo está congelado.
* **Game feel.** `CameraShake` (corrutina con magnitud/duración, ignorada si `timeScale <= 0`), `HitFlash` (sustitución temporal del color del `SpriteRenderer`, cancelable y con reset en `OnEnable/OnDisable` para objetos pooleados), `FloatingScoreManager`, `VFXManager` y `AudioManager` centralizado con `PlayOneShot` y escalado de volumen por clip.
* **Entrada y plataformas.** `PlayerInputReader` unifica Unity Input System (teclado/mando con deadzone) y arrastre táctil; `AndroidBuildPipeline` (Editor) automatiza la build APK.

#### [R] Resultado
* **0 B/frame de asignación en Heap durante el combate** — balas, proyectiles enemigos y enemigos de oleada viven íntegramente en pools; sin picos de GC en los momentos de máxima densidad.
* **60+ FPS sostenidos** en PC y Android con decenas de entidades activas.
* **Jefe multifase reactivo** y **escudo con cooldown** implementados como FSM intercambiables; añadir una fase nueva es añadir una clase `IBossState`, sin tocar el controlador.
* **Diseño iterable sin recompilar**: oleadas, formaciones y diálogos son assets `ScriptableObject`.
* Proyecto completo publicado en solitario: dos modos de juego, historia con diálogos, dedicatoria, build PC + Android.

### 3.2 STAR — English

#### [S] Situation
An arcade *shoot 'em up* pushes dozens of projectiles and enemies in and out of the scene every second. The naive `Instantiate` / `Destroy` approach allocates on the heap and triggers Garbage Collector spikes exactly during the most intense moments — the worst possible place for a frame hitch. The project also needed a boss with reactive phases, waves tunable without recompiling, and a maintainable game flow (menu → story → arcade) for a single developer, with keyboard, gamepad and touch support.

#### [T] Task
Design and implement, solo, the entire gameplay architecture: allocation-free combat loop, state machines for game flow, boss and shield, a decoupled damage system, data-driven wave management, game feel (shake, hit-flash, floating score), audio manager, dialogue and multi-platform build.

#### [A] Action — Zero-GC Object Pooling
* Every projectile (`Bullet`, `EnemyProjectile`) and every wave enemy (`SmallBirdEnemy`, `MediumPhoenixEnemy`) lives in a `UnityEngine.Pool.ObjectPool<T>` with bounded `defaultCapacity` / `maxSize` (e.g. bullets 20/60, boss projectiles 15/40, enemies 15/50).
* `WaveManager` keeps a `Dictionary<Enemy, ObjectPool<Enemy>>` — **one pool per prefab**, created on demand — so switching a wave's enemy type requires no code change.
* Each entity receives its pool in `Init(pool)` and returns itself with `_pool.Release(this)` on timeout or hit; an `_isReturned` flag guarantees **idempotency** against double collisions in the same frame.
* Collision never checks concrete types: `Bullet` resolves `IDamageable` (on the collider or its parent) and calls `TakeDamage(1)`, so the same code damages enemies, barrier segments and the boss core.

#### [A] Action — Finite State Machines
* **Generic core FSM.** `IState { Enter(); Tick(dt); Exit(); }` + `StateMachine.ChangeState(newState)`. One instance drives global flow (`BootState → MainMenuState → StoryModeState / ArcadeModeState`, each loading its scene additively via `SceneLoader`); another drives the player shield (`ShieldReadyState → ShieldActiveState → ShieldCooldownState`, exposing `Progress` for the UI).
* **Boss FSM (`IBossState`).** Context-passing states (`Enter(boss)`, `Update(boss, dt)`, `Exit(boss)`): `BossIntroState` (2.5 s `Vector3.Lerp` descent, alarm, HUD warning) → `BossPhase1State` (horizontal patrol clamped to the real orthographic camera width, timer-driven fire) → **`BossPhase2State` "enraged"**, triggered **reactively** when `GetDestroyedBarrierRatio() >= 0.5f` → `BossDefeatedState` (weapons off, escorts recycled, `OnBossDefeated` raised).
* **Event-driven damage.** `BossBarrierSegment` and `BossCore` implement `IDamageable` and raise `OnSegmentDestroyed` / `OnCoreDestroyed` on death. `BossController` subscribes in `Awake`, **unsubscribes in the handler and in `OnDestroy`** (no dangling references) and only bumps a counter: the FSM reads the ratio, never polls segments. Barriers die individually, opening physical gaps toward the core.

#### [A] Action — Data, Waves & Game Feel
* **`WaveDataSO` (ScriptableObject).** Each wave defines prefab, `SpawnPatternType` (`RandomStream`, `GridRowFormation`, `VShapeFormation`, `AlternatingWings`), totals, per-row count, interval and spawn width. `WaveManager.CalculateSpawnPosition` resolves the formation and **clamps the width to the real viewport** (`orthographicSize * aspect`) so formations stay correct on any mobile aspect ratio.
* **`ArcadeModeManager`.** Parametric wave scaling, a boss every 10 waves and a recovery rule: surviving 3 full waves without damage (or beating the boss) returns +1 life. Firing is gated (`CanPlayerFire`) until the first enemy appears.
* **`StoryDialogueSO` / `DialogueManager`.** Dialogue lines as assets (speaker, avatar, text, typing blip). Dialogue pauses the game with `timeScale = 0` and animates the typewriter with `Time.unscaledDeltaTime`, so text keeps flowing while the world is frozen.
* **Game feel.** `CameraShake` (coroutine, ignored when `timeScale <= 0`), `HitFlash` (temporary `SpriteRenderer` color swap, cancellable, reset on `OnEnable/OnDisable` for pooled objects), `FloatingScoreManager`, `VFXManager` and a centralized `AudioManager` with `PlayOneShot` and per-clip volume scaling.
* **Input & platforms.** `PlayerInputReader` unifies the Unity Input System (keyboard/gamepad with deadzone) and touch drag; `AndroidBuildPipeline` (Editor) automates the APK build.

#### [R] Result
* **0 B/frame heap allocation during combat** — bullets, enemy projectiles and wave enemies live entirely in pools; no GC spikes at peak density.
* **60+ FPS sustained** on PC and Android with dozens of active entities.
* **Reactive multi-phase boss** and **cooldown shield** as swappable FSMs; adding a phase means adding one `IBossState` class, with no controller changes.
* **Iterable design without recompiling**: waves, formations and dialogue are `ScriptableObject` assets.
* A complete solo-shipped project: two game modes, story with dialogue, dedication screen, PC + Android builds.

---

## 4. PERFIL PROFESIONAL Y SOFT SKILLS (para bio / CV / modal de contacto)

### Formación
* **Grado en Diseño y Desarrollo de Videojuegos** — CITM · Universitat Politècnica de Catalunya (UPC), Barcelona. 2023 – presente (3er curso).
* Bachillerato de Ciencias y Tecnología — Stucom (Pelai), Barcelona. 2021 – 2023. Programa Erasmus en Verona, Italia (2022 – 2023).
* First Certificate in English (FCE) — Cambridge, junio 2022.

### Competencias técnicas
* **Lenguajes:** C++ (motor, FMOD, Mono interop), C# (Unity, scripting de motor propio), C.
* **Audio:** FMOD Core & Studio API, buses / `ChannelGroup`, espacialización 3D, fundidos perceptuales, mezcladores persistentes, Unity `AudioSource` / `PlayOneShot`.
* **Gameplay:** máquinas de estados (State Pattern), sistemas de daño por interfaz y eventos, pooling sin GC, datos en ScriptableObjects, Input System multiplataforma, game feel.
* **Motores y herramientas:** Unity, Unreal Engine, motor propio (LoopieEngine), Tracy Profiler, CMake / vcpkg, ImGui, Git / GitHub, Visual Studio, Photoshop, Illustrator.

### Soft skills contrastadas
* **Rendimiento bajo presión extrema:** coordinación y servicio en eventos con más de 60.000 asistentes (Primavera Sound 2024/2025, Festival 150 Aniversario Estrella Damm), con toma de decisiones rápida y adaptación inmediata a equipos nuevos.
* **Comunicación técnica:** profesor particular (2022 – presente) de Matemáticas, Inglés y Catalán para alumnos de ESO — explicar conceptos complejos de forma clara y estructurada, la misma habilidad que exige documentar sistemas y revisar código en equipo.
* **Trabajo en equipo Agile:** 18 personas en Mini Knight Studio bajo Git, ramas temáticas, escenas de test aisladas y resolución de fusiones en escenas serializadas de más de 127.000 líneas.
* **Aprendizaje autónomo y atención al detalle:** integración de un SDK de audio profesional (FMOD) en un motor sin documentación previa; auditoría de idempotencia y desuscripción de eventos en sistemas pooleados.

### EN — Professional summary (short)
> Third-year Game Development student at CITM (UPC, Barcelona) specialized in **Gameplay & Audio Programming in C++ and C#**. Integrated FMOD natively into a custom engine and bridged it to C# through Mono; ships allocation-free, state-machine-driven gameplay in Unity. Proven under extreme pressure (60,000-attendee events), a clear technical communicator (private tutor since 2022), and comfortable in an 18-person Git workflow. Native Spanish and Catalan, English B2 (Cambridge FCE).

---

## 5. EL ARGUMENTO DIFERENCIAL (cierre del modal / pitch)

### ES
> *"He construido el subsistema de audio de un motor C++ desde la primera línea — ciclo de vida de FMOD, buses sobre `ChannelGroup`, espacialización 3D, fundidos sin clicks — y lo he expuesto a C# a través de Mono para que otros programadores lo usen sin tocar C++. Después he aplicado la misma disciplina en Unity: bucles de combate sin asignaciones, máquinas de estados que se extienden añadiendo una clase, y sistemas de daño que se comunican por interfaces y eventos, no por referencias directas. No programo a ciegas sobre un motor comercial: sé qué hay debajo, qué cuesta cada asignación y cómo medirlo."*

### EN
> *"I built a C++ engine's audio subsystem from the first line — FMOD lifecycle, `ChannelGroup` buses, 3D spatialization, click-free fades — and exposed it to C# through Mono so other programmers could use it without touching C++. Then I applied the same discipline in Unity: allocation-free combat loops, state machines that grow by adding a class, and damage systems that talk through interfaces and events instead of hard references. I don't program blindly on top of a commercial engine: I know what's underneath, what every allocation costs, and how to measure it."*

---

## 6. NOTAS DE VERIFICACIÓN PARA EL IMPLEMENTADOR DEL MODAL (no publicar)
* Todas las clases, métodos y rutas citadas existen en los repositorios/proyecto indicados a fecha de redacción.
* Métricas declaradas por el autor y coherentes con el código: `< 1,5 %` de frame en audio (zonas Tracy `LP_FUNC()`), `60 FPS` (Fable), `0 B/frame` y `60+ FPS` (Ave Phoenix Regen: todo el combate sobre `ObjectPool<T>`).
* No se han incluido afirmaciones que el código no respalda (p. ej. estados nombrados `Idle/Depleting/Healing` en `HealthHUD`, o carga en runtime de Resonance Audio: el plugin está vendorizado con el SDK, no cargado con `loadPlugin`).
* Case Study 3 (prototipo de juego de peleas) queda **en standby** por indicación del usuario.
