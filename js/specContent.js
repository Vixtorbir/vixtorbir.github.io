/**
 * specContent.js — Fichas técnicas bilingües (case studies STAR) de project.html
 * VÍCTOR CÁRDENAS (Vixtorbir) — Arcade Portfolio
 *
 * Datos puros, sin lógica de DOM. Cada entrada del array `specSheets` se
 * corresponde por índice con `arcadeSystems` (0 = Player 1 ... 5 = Contact)
 * y con el parámetro `project.html?system=N`.
 * Todo el texto es {es, en}. Fuente de verdad: PORTFOLIO_CONTENT.md.
 *
 * Campos por ficha:
 *   code, accent, title, subtitle, badges[], metrics[], gallery[], sections[], actions[]
 *   gallery: [{ src, alt:{es,en}, caption:{es,en} }]  — rutas relativas a /assets
 *   sections: [{ label:{es,en}, blocks:[...] }]        — desglose STAR secuencial
 *
 * Tipos de bloque admitidos por el renderer (project.js):
 *   { type: 'p',     text: {es,en} }
 *   { type: 'h',     text: {es,en} }
 *   { type: 'list',  items: [ {es,en}, ... ] }
 *   { type: 'code',  lang: 'cpp'|'csharp', caption: {es,en}, code: '...' }
 *   { type: 'kv',    rows: [ { k:{es,en}, v:{es,en} }, ... ] }
 *   { type: 'perks', items: [ { name, tag:{es,en}, level:0-4, color, text:{es,en} } ] }
 *   { type: 'note',  text: {es,en} }
 */

export const CONTACT = {
  email: 'victorcarhor@gmail.com',
  phone: '+34 623 187 320',
  github: 'https://github.com/Vixtorbir',
  linkedin: 'https://www.linkedin.com/in/victor-cardenas-gamedev',
  cv: 'assets/Victor_Cardenas_CV.pdf',
  location: { es: 'Barcelona, España', en: 'Barcelona, Spain' }
};

const REPO_ENGINE = 'https://github.com/Mini-Knight-Studio/LoopieEngine';
const REPO_GAME = 'https://github.com/Mini-Knight-Studio/The-Fable-Of-The-Eclipse';
const WEB_FABLE = 'https://mini-knight-studio.github.io/The-Fable-Of-The-Eclipse/';

// ---------------------------------------------------------------------------
// SNIPPETS (idénticos a PORTFOLIO_CONTENT.md)
// ---------------------------------------------------------------------------
const CODE_CREATE_BUS = `// Loopie/src/Loopie/Audio/AudioManager.cpp
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
            current->group->addGroup(group);      // parent volume propagates natively

            auto bus    = std::make_unique<AudioBus>();  // RAII: the tree owns its children
            bus->name   = segment;
            bus->group  = group;
            bus->parent = current;
            current->children[segment] = std::move(bus);
        }
        current = current->children[segment].get();
    }
    return true;
}`;

const CODE_PROCESS_FADING = `// Loopie/src/Loopie/Components/AudioSource.cpp
void AudioSource::ProcessFading(float dt)
{
    if (!m_isTransitioning) return;

    if (m_fadeTimerOut < m_fadeDurationOut)
    {
        m_fadeTimerOut += dt;
        float tOut     = std::min(m_fadeTimerOut / m_fadeDurationOut, 1.0f);
        float curveOut = std::sqrt(1.0f - tOut);   // smooth fall-off, no audible step
        float newVol   = m_startVolumeFadeOut * curveOut;

        if (m_fadingChannel) m_fadingChannel->setVolume(newVol);
        if (m_fadingEvent)   m_fadingEvent->setVolume(newVol);

        if (tOut >= 1.0f) { /* stop fading channel, start pending clip at volume 0 */ }
    }
}`;

const CODE_INTERNAL_CALL_CPP = `// Loopie/src/Loopie/Scripting/ScriptGlue.cpp
static void AudioSource_SetPitch(MonoString* entityID, MonoString* componentID, float pitch)
{
    Entity* entity = Utils::GetEntity(entityID);
    AudioSource* audioSource = Utils::GetComponent<AudioSource>(entity, componentID);
    if (audioSource) audioSource->SetPitch(pitch);
}
// ...
ADD_INTERNAL_CALL(AudioSource_SetPitch);   // mono_add_internal_call("Loopie.InternalCalls::AudioSource_SetPitch", ...)
ADD_INTERNAL_CALL(AudioMixer_SetBusVolume);`;

const CODE_INTERNAL_CALL_CS = `// LoopieScripting/InternalCalls.cs + Components/AudioSource.cs
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
}`;

const CODE_HEALTH_HUD = `// Assets/Scripts/UI/HealtBar/HealthHUD.cs — rebuild only on change (dirty-check)
void OnUpdate()
{
    int currentHealth = Player.Instance.PlayerHealth.GetActualHealth();
    int maxHealth     = Player.Instance.PlayerHealth.GetMaxHealth();

    if (currentHealth != lastKnownHealth || maxHealth != lastKnownMaxHealth)
    {
        if (maxHealth != lastKnownMaxHealth) UpdateHUD(maxHealth);  // animated bar unlock
        UpdateIcons(currentHealth, maxHealth);                       // Full / Half / Empty / Locked
        lastKnownHealth = currentHealth;
        lastKnownMaxHealth = maxHealth;
    }
}`;

const CODE_POOL = `// Gameplay/Player/PlayerShooting.cs — bounded bullet pool; never Instantiate/Destroy at runtime
_bulletPool = new ObjectPool<Bullet>(
    createFunc:      () => Instantiate(bulletPrefab),
    actionOnGet:     b  => b.gameObject.SetActive(true),
    actionOnRelease: b  => b.gameObject.SetActive(false),
    actionOnDestroy: b  => Destroy(b.gameObject),
    defaultCapacity: 20,
    maxSize:         60);

// Gameplay/Weapons/Bullet.cs — idempotent release + interface-based damage
private void OnTriggerEnter2D(Collider2D other)
{
    if (_isReturned) return;
    var damageable = other.GetComponent<IDamageable>() ?? other.GetComponentInParent<IDamageable>();
    damageable?.TakeDamage(1);
    ReturnToPool();                     // _pool.Release(this) — O(1), zero allocations
}`;

const CODE_BOSS_FSM = `// Gameplay/Enemies/Boss/BossStates.cs — reactive transition to enraged phase
public class BossPhase1State : IBossState
{
    private float _shootTimer;
    public void Enter(BossController boss) => _shootTimer = boss.Phase1FireRate;

    public void Update(BossController boss, float deltaTime)
    {
        boss.MoveHorizontally(deltaTime, boss.Phase1Speed);
        if ((_shootTimer -= deltaTime) <= 0f) { boss.FireBossWeapons(); _shootTimer = boss.Phase1FireRate; }

        if (boss.GetDestroyedBarrierRatio() >= 0.5f)   // >50 % barriers down -> Phase 2
            boss.ChangeState(new BossPhase2State());
    }
    public void Exit(BossController boss) { }
}

// Gameplay/Enemies/Boss/BossController.cs — clean subscribe / unsubscribe
private void HandleSegmentDestroyed(BossBarrierSegment segment)
{
    segment.OnSegmentDestroyed -= HandleSegmentDestroyed;
    _destroyedBarrierCount++;
}
private void HandleCoreDestroyed() => ChangeState(new BossDefeatedState());`;

// ---------------------------------------------------------------------------
// FICHAS
// ---------------------------------------------------------------------------
export const specSheets = [

  // =========================================================================
  // 0 — PLAYER 1 // VÍCTOR CÁRDENAS
  // =========================================================================
  {
    code: 'SYS-01 // P1_PROFILE.ROM',
    accent: '#fbbf24',
    title: { es: 'PLAYER 1 // VÍCTOR CÁRDENAS HORMIGO', en: 'PLAYER 1 // VÍCTOR CÁRDENAS HORMIGO' },
    subtitle: {
      es: 'Gameplay & Audio Programmer (C++ / C#) · CITM - UPC, Barcelona · 3er curso',
      en: 'Gameplay & Audio Programmer (C++ / C#) · CITM - UPC, Barcelona · 3rd year'
    },
    badges: ['C++17', 'C# / .NET', 'FMOD Core & Studio', 'Mono InternalCall Bridge', 'Zero-GC ObjectPool<T>', 'FSM / State Pattern', 'Unity', 'Unreal Engine', 'Tracy Profiler', 'Git · 18 devs'],
    metrics: [
      { value: 'C++ / C#', label: { es: 'Lenguajes core', en: 'Core languages' } },
      { value: 'FMOD · Mono', label: { es: 'Audio nativo + puente C#', en: 'Native audio + C# bridge' } },
      { value: '0 B/frame', label: { es: 'Heap en combate (Unity)', en: 'Heap in combat (Unity)' } },
      { value: 'B2 FCE', label: { es: 'Inglés · Cambridge 2022', en: 'English · Cambridge 2022' } }
    ],
    gallery: [
      { src: 'assets/portrait_victor.png', alt: { es: 'Retrato de Víctor Cárdenas', en: 'Portrait of Víctor Cárdenas' }, caption: { es: 'Víctor Cárdenas Hormigo — Gameplay & Audio Programmer', en: 'Víctor Cárdenas Hormigo — Gameplay & Audio Programmer' } },
      { src: 'assets/loopie_logo.png', alt: { es: 'Logotipo de LoopieEngine', en: 'LoopieEngine logo' }, caption: { es: 'LoopieEngine — motor C++ propio (Mini Knight Studio)', en: 'LoopieEngine — custom C++ engine (Mini Knight Studio)' } },
      { src: 'assets/ave_phoenix_icon.png', alt: { es: 'Icono de Ave Phoenix Regen', en: 'Ave Phoenix Regen icon' }, caption: { es: 'Ave Phoenix Regen — proyecto Unity C# en solitario', en: 'Ave Phoenix Regen — solo Unity C# project' } }
    ],
    sections: [
      {
        label: { es: 'PERFIL', en: 'PROFILE' },
        blocks: [
          { type: 'p', text: {
            es: 'He integrado <b>FMOD Core & Studio de forma nativa en un motor C++ propio</b> (jerarquía de buses de mezcla sobre <code>ChannelGroup</code>, espacialización 3D de listener y fuentes, curvas de fundido perceptuales) y lo he expuesto a los programadores de gameplay mediante un <b>puente Mono de <code>InternalCalls</code></b> (<code>AudioSource.Pitch</code>, <code>AudioMixer.SetVolume(...)</code>).',
            en: 'I integrated <b>FMOD Core & Studio natively into a custom C++ engine</b> (hierarchical mix buses over <code>ChannelGroup</code>, 3D listener/source spatialization, perceptual fade curves) and exposed it to gameplay scripters through a <b>Mono <code>InternalCall</code> bridge</b> (<code>AudioSource.Pitch</code>, <code>AudioMixer.SetVolume(...)</code>).'
          } },
          { type: 'p', text: {
            es: 'En gameplay diseño <b>máquinas de estados finitas</b> (<code>IState</code> / <code>IBossState</code>), <b>sistemas de daño dirigidos por eventos</b> (<code>IDamageable</code>) y <b>bucles de combate sobre <code>ObjectPool&lt;T&gt;</code> con 0 B/frame de asignación en Heap</b>. He publicado <i>The Fable of the Eclipse</i> (v1.0) en un estudio universitario de 18 personas bajo Git, y <i>Ave Phoenix Regen</i> en solitario para PC y Android.',
            en: 'On the gameplay side I design <b>finite state machines</b> (<code>IState</code> / <code>IBossState</code>), <b>event-driven damage systems</b> (<code>IDamageable</code>) and <b><code>ObjectPool&lt;T&gt;</code>-backed combat loops with 0 B/frame heap allocation</b>. Shipped <i>The Fable of the Eclipse</i> (v1.0) in an 18-person student studio under Git, and <i>Ave Phoenix Regen</i> solo on PC and Android.'
          } },
          { type: 'note', text: {
            es: '<b>Disponible para Convenio de Prácticas Universitarias — CITM (UPC), Barcelona.</b> Presencial, híbrido o remoto.',
            en: '<b>Available for a University Internship Agreement (Convenio de Prácticas) — CITM (UPC), Barcelona.</b> On-site, hybrid or remote.'
          } },
          { type: 'kv', rows: [
            { k: { es: 'Ubicación', en: 'Location' }, v: { es: 'Barcelona, España', en: 'Barcelona, Spain' } },
            { k: { es: 'Idiomas', en: 'Languages' }, v: { es: 'Castellano (nativo) · Catalán (nativo) · Inglés B2 (FCE Cambridge)', en: 'Spanish (native) · Catalan (native) · English B2 (Cambridge FCE)' } },
            { k: { es: 'Objetivo', en: 'Goal' }, v: { es: 'Prácticas como Gameplay / Audio Programmer', en: 'Internship as Gameplay / Audio Programmer' } }
          ] }
        ]
      },
      {
        label: { es: 'FORMACIÓN', en: 'EDUCATION' },
        blocks: [
          { type: 'kv', rows: [
            { k: { es: '2023 – presente', en: '2023 – present' }, v: {
              es: '<b>Grado en Diseño y Desarrollo de Videojuegos</b> — CITM · Universitat Politècnica de Catalunya (UPC), Barcelona. 3er curso.',
              en: '<b>Bachelor\'s Degree in Video Game Design & Development</b> — CITM · Universitat Politècnica de Catalunya (UPC), Barcelona. 3rd year.'
            } },
            { k: { es: '2021 – 2023', en: '2021 – 2023' }, v: {
              es: '<b>Bachillerato de Ciencias y Tecnología</b> — Stucom (Pelai), Barcelona. Nota media 7,50 · Programa Erasmus en Verona, Italia (2022 – 2023).',
              en: '<b>Science & Technology Baccalaureate</b> — Stucom (Pelai), Barcelona. GPA 7.50/10 · Erasmus Programme in Verona, Italy (2022 – 2023).'
            } },
            { k: { es: 'Jun 2022', en: 'Jun 2022' }, v: {
              es: '<b>First Certificate in English (FCE)</b> — Cambridge · Nivel B2.',
              en: '<b>First Certificate in English (FCE)</b> — Cambridge · B2 level.'
            } }
          ] }
        ]
      },
      {
        label: { es: 'COMPETENCIAS', en: 'SKILLS' },
        blocks: [
          { type: 'kv', rows: [
            { k: { es: 'Lenguajes', en: 'Languages' }, v: { es: 'C++ (motor, FMOD, Mono interop) · C# (Unity, scripting de motor propio) · C', en: 'C++ (engine, FMOD, Mono interop) · C# (Unity, custom-engine scripting) · C' } },
            { k: { es: 'Audio', en: 'Audio' }, v: { es: 'FMOD Core & Studio API · buses / <code>ChannelGroup</code> · espacialización 3D · fundidos perceptuales · mezcladores persistentes · Unity <code>AudioSource</code> / <code>PlayOneShot</code>', en: 'FMOD Core & Studio API · buses / <code>ChannelGroup</code> · 3D spatialization · perceptual fades · persisted mixers · Unity <code>AudioSource</code> / <code>PlayOneShot</code>' } },
            { k: { es: 'Gameplay', en: 'Gameplay' }, v: { es: 'State Pattern (FSM) · daño por interfaz y eventos · pooling sin GC · ScriptableObjects · Input System multiplataforma · game feel', en: 'State Pattern (FSM) · interface/event-driven damage · GC-free pooling · ScriptableObjects · cross-platform Input System · game feel' } },
            { k: { es: 'Motores & tools', en: 'Engines & tools' }, v: { es: 'Unity · Unreal Engine · motor propio (LoopieEngine) · Tracy Profiler · CMake / vcpkg · ImGui · Git / GitHub · Visual Studio · Photoshop · Illustrator', en: 'Unity · Unreal Engine · custom engine (LoopieEngine) · Tracy Profiler · CMake / vcpkg · ImGui · Git / GitHub · Visual Studio · Photoshop · Illustrator' } }
          ] }
        ]
      },
      {
        label: { es: 'SOFT SKILLS', en: 'SOFT SKILLS' },
        blocks: [
          { type: 'list', items: [
            { es: '<b>Rendimiento bajo presión extrema:</b> coordinación y servicio en eventos con más de 60.000 asistentes (Primavera Sound 2024/2025, Festival 150 Aniversario Estrella Damm), con toma de decisiones rápida y adaptación inmediata a equipos nuevos.', en: '<b>Performance under extreme pressure:</b> coordination and service at events with 60,000+ attendees (Primavera Sound 2024/2025, Estrella Damm 150th Anniversary Festival), with fast decision-making and immediate adaptation to new teams.' },
            { es: '<b>Comunicación técnica:</b> profesor particular (2022 – presente) de Matemáticas, Inglés y Catalán para alumnos de ESO — explicar conceptos complejos de forma clara y estructurada, la misma habilidad que exige documentar sistemas y revisar código en equipo.', en: '<b>Technical communication:</b> private tutor (2022 – present) in Maths, English and Catalan for secondary-school students — explaining complex concepts clearly and in a structured way, the same skill needed to document systems and review code in a team.' },
            { es: '<b>Trabajo en equipo Agile:</b> 18 personas en Mini Knight Studio bajo Git, ramas temáticas, escenas de test aisladas y resolución de fusiones en escenas serializadas de más de 127.000 líneas.', en: '<b>Agile teamwork:</b> 18 people at Mini Knight Studio under Git, topic branches, isolated test scenes and merge resolution on serialized scenes of 127,000+ lines.' },
            { es: '<b>Aprendizaje autónomo y atención al detalle:</b> integración de un SDK de audio profesional (FMOD) en un motor sin documentación previa; auditoría de idempotencia y desuscripción de eventos en sistemas pooleados.', en: '<b>Self-learning and attention to detail:</b> integrating a professional audio SDK (FMOD) into an engine with no prior documentation; auditing idempotency and event unsubscription in pooled systems.' }
          ] }
        ]
      }
    ],
    actions: [
      { type: 'link', label: { es: 'GITHUB', en: 'GITHUB' }, href: CONTACT.github, icon: 'gh' },
      { type: 'link', label: { es: 'LINKEDIN', en: 'LINKEDIN' }, href: CONTACT.linkedin, icon: 'in' },
      { type: 'download', label: { es: 'DESCARGAR CV (PDF)', en: 'DOWNLOAD RESUME (PDF)' }, href: CONTACT.cv, icon: 'pdf' },
      { type: 'copy', label: { es: 'COPIAR EMAIL', en: 'COPY EMAIL' }, done: { es: '¡COPIADO!', en: 'COPIED!' }, value: CONTACT.email, icon: 'mail' }
    ]
  },

  // =========================================================================
  // 1 — THE FABLE OF THE ECLIPSE & LOOPIE ENGINE
  // =========================================================================
  {
    code: 'SYS-02 // FABLE_ECLIPSE.LOOP',
    accent: '#38bdf8',
    title: { es: 'THE FABLE OF THE ECLIPSE & LOOPIE ENGINE', en: 'THE FABLE OF THE ECLIPSE & LOOPIE ENGINE' },
    subtitle: {
      es: 'Audio Programmer (motor, C++) · Gameplay / UI Programmer (juego, C#) · Mini Knight Studio · 18 personas · v1.0 (jun 2026)',
      en: 'Audio Programmer (engine, C++) · Gameplay / UI Programmer (game, C#) · Mini Knight Studio · 18 people · v1.0 (Jun 2026)'
    },
    badges: ['C++17', 'FMOD Core & Studio', 'Mono C# Bridge', '3D Spatial Audio', 'Mix Bus Hierarchy', 'Tracy', 'CMake + vcpkg', 'OpenGL', 'Git · 18 devs'],
    metrics: [
      { value: '< 1.5 %', label: { es: 'Frame time en audio (Tracy)', en: 'Frame time on audio (Tracy)' } },
      { value: '60 FPS', label: { es: 'Entrega estable v1.0', en: 'Stable v1.0 delivery' } },
      { value: '17', label: { es: 'InternalCalls de audio C++→C#', en: 'Audio InternalCalls C++→C#' } },
      { value: '127K+', label: { es: 'Líneas por escena fusionada', en: 'Lines per merged scene' } }
    ],
    gallery: [
      { src: 'assets/fable_gameplay_1.png', alt: { es: 'Captura de gameplay de The Fable of the Eclipse', en: 'The Fable of the Eclipse gameplay screenshot' }, caption: { es: 'Gameplay in-engine — música por escena y fuentes 3D (FMOD)', en: 'In-engine gameplay — per-scene music and 3D sources (FMOD)' } },
      { src: 'assets/fable_gameplay_2.png', alt: { es: 'Captura de gameplay de The Fable of the Eclipse', en: 'The Fable of the Eclipse gameplay screenshot' }, caption: { es: 'HUD de salud (HealthHUD / HealthSlot) y HUD de habilidades', en: 'Health HUD (HealthHUD / HealthSlot) and skills HUD' } },
      { src: 'assets/fable_gameplay_3.png', alt: { es: 'Captura de gameplay de The Fable of the Eclipse', en: 'The Fable of the Eclipse gameplay screenshot' }, caption: { es: 'Exploración y puzles — popups modales (UIPopupManager)', en: 'Exploration and puzzles — modal popups (UIPopupManager)' } },
      { src: 'assets/fable_gameplay_4.png', alt: { es: 'Captura de gameplay de The Fable of the Eclipse', en: 'The Fable of the Eclipse gameplay screenshot' }, caption: { es: 'Escena de producción renderizada por LoopieEngine (OpenGL)', en: 'Production scene rendered by LoopieEngine (OpenGL)' } },
      { src: 'assets/fable_eclipse_art.png', alt: { es: 'Arte promocional de The Fable of the Eclipse', en: 'The Fable of the Eclipse key art' }, caption: { es: 'Key art — release v1.0 (junio 2026)', en: 'Key art — v1.0 release (June 2026)' } },
      { src: 'assets/fable_intro_title.png', alt: { es: 'Pantalla de título de The Fable of the Eclipse', en: 'The Fable of the Eclipse title screen' }, caption: { es: 'Pantalla de título — Mini Knight Studio', en: 'Title screen — Mini Knight Studio' } }
    ],
    sections: [
      {
        label: { es: '[S] SITUACIÓN', en: '[S] SITUATION' },
        blocks: [
          { type: 'p', text: {
            es: '<i>LoopieEngine</i> es un motor 3D escrito desde cero en C++ (render OpenGL, escenas serializadas, componentes, scripting C# vía Mono). Cuando me incorporé al subsistema de audio, <b>el motor no tenía ninguna capacidad de sonido</b>: ni carga de clips, ni reproducción, ni mezcla, ni API para los scripters.',
            en: '<i>LoopieEngine</i> is a from-scratch C++ 3D engine (OpenGL renderer, serialized scenes, entity components, C# scripting through Mono). When I joined the audio effort, <b>the engine had no sound at all</b> — no clip loading, playback, mixing or scripting API.'
          } },
          { type: 'p', text: {
            es: 'El juego que se construía encima, <i>The Fable of the Eclipse</i>, necesitaba música por escena, efectos posicionados en 3D, transiciones sin cortes y un mezclador controlable desde C#. Todo ello con un presupuesto de frame compartido con render, física y scripting, y en un repositorio con 18 personas trabajando en paralelo sobre escenas serializadas gigantes.',
            en: 'The game built on top, <i>The Fable of the Eclipse</i>, needed per-scene music, 3D-positioned effects, gap-free transitions and a mixer controllable from C# — all within a frame budget shared with rendering, physics and scripting, in a repository with 18 people working in parallel on very large serialized scenes.'
          } },
          { type: 'kv', rows: [
            { k: { es: 'Stack', en: 'Stack' }, v: { es: 'C++17 · CMake + vcpkg · OpenGL · SDL3 · GLM · Mono Runtime (C#) · FMOD Core & Studio · Tracy · ImGui', en: 'C++17 · CMake + vcpkg · OpenGL · SDL3 · GLM · Mono Runtime (C#) · FMOD Core & Studio · Tracy · ImGui' } },
            { k: { es: 'Estado', en: 'Status' }, v: { es: 'Publicado: releases v0.2 → v1.0 (junio 2026)', en: 'Shipped: releases v0.2 → v1.0 (June 2026)' } }
          ] }
        ]
      },
      {
        label: { es: '[T] TAREA', en: '[T] TASK' },
        blocks: [
          { type: 'list', items: [
            { es: '<b>Integrar FMOD Core & Studio nativamente en C++</b> dentro del ciclo de vida del motor (<code>Init / Update / Shutdown</code>), enlazando las librerías en CMake y vendorizando el SDK (incluidos los plugins Resonance Audio y hápticos).', en: '<b>Integrate FMOD Core & Studio natively in C++</b> into the engine lifecycle (<code>Init / Update / Shutdown</code>), linking the libraries through CMake and vendoring the SDK (including the Resonance Audio and haptics plugins).' },
            { es: '<b>Diseñar los componentes <code>AudioSource</code> y <code>AudioListener</code></b> como componentes de entidad serializables, con inspector ImGui en el editor.', en: '<b>Design the <code>AudioSource</code> and <code>AudioListener</code> components</b> as serializable entity components with an ImGui inspector.' },
            { es: '<b>Diseñar la jerarquía de buses de mezcla</b> (<code>Master/Music</code>, <code>Master/SFX</code>, <code>Master/UI</code>…) persistida en la configuración del proyecto.', en: '<b>Design the mix-bus hierarchy</b> (<code>Master/Music</code>, <code>Master/SFX</code>, <code>Master/UI</code>…) persisted in the project configuration.' },
            { es: '<b>Exponer el audio a C#</b> mediante <code>InternalCalls</code> para que los programadores de gameplay controlen pitch, volumen, pan, distancias 3D, fundidos y el mezclador.', en: '<b>Expose audio to C#</b> through <code>InternalCalls</code> so gameplay programmers can drive pitch, volume, pan, 3D distances, fades and the mixer.' },
            { es: 'En el juego: <b>implementar el HUD de salud (<code>HealthHUD</code> / <code>HealthSlot</code>), el HUD de habilidades (<code>SkillsHUD</code>) y el gestor de popups modales (<code>UIPopupManager</code>)</b> integrados con la máquina de estados global <code>GameManager</code>.', en: 'In the game: <b>implement the health HUD (<code>HealthHUD</code> / <code>HealthSlot</code>), the skills HUD (<code>SkillsHUD</code>) and the modal popup manager (<code>UIPopupManager</code>)</b> integrated with the global <code>GameManager</code> state machine.' }
          ] }
        ]
      },
      {
        label: { es: '[A] AUDIO C++', en: '[A] AUDIO C++' },
        blocks: [
          { type: 'h', text: { es: 'Ciclo de vida del subsistema (RAII)', en: 'Subsystem lifecycle (RAII)' } },
          { type: 'p', text: {
            es: '<code>AudioManager</code> es un subsistema estático del motor: <code>FMOD::Studio::System::create</code> → <code>getCoreSystem</code> → <code>initialize(512 canales virtuales)</code>; <code>Update()</code> bombea <code>StudioSystem->update()</code> una vez por frame; <code>Shutdown()</code> hace <code>unloadAll()</code> + <code>release()</code>. Todos los <code>FMOD_RESULT</code> pasan por <code>FMOD_ErrorString</code> al logger. El bus maestro se gestiona con <code>std::unique_ptr&lt;AudioBus&gt;</code> y cada <code>AudioSource</code> detiene y libera su canal en el destructor.',
            en: '<code>AudioManager</code> is a static engine subsystem: <code>FMOD::Studio::System::create</code> → <code>getCoreSystem</code> → <code>initialize(512 virtual channels)</code>; <code>Update()</code> pumps <code>StudioSystem->update()</code> once per frame; <code>Shutdown()</code> runs <code>unloadAll()</code> + <code>release()</code>. Every <code>FMOD_RESULT</code> is routed through <code>FMOD_ErrorString</code> to the logger. The master bus is owned by a <code>std::unique_ptr&lt;AudioBus&gt;</code> and every <code>AudioSource</code> stops and releases its channel in its destructor.'
          } },
          { type: 'h', text: { es: 'Jerarquía de buses sobre ChannelGroup', en: 'Bus hierarchy over ChannelGroup' } },
          { type: 'p', text: {
            es: '<code>CreateBus("Master/SFX/UI")</code> parsea la ruta, crea los <code>ChannelGroup</code> intermedios que falten y los encadena con <code>parent->group->addGroup(child)</code>, de modo que <b>el volumen se propaga de forma nativa por la jerarquía de FMOD</b> sin recorrer el árbol en cada frame. La configuración del mezclador se serializa a JSON en <code>ProjectConfig</code>.',
            en: '<code>CreateBus("Master/SFX/UI")</code> parses the path, creates missing intermediate <code>ChannelGroup</code>s and chains them with <code>parent->group->addGroup(child)</code>, so <b>volume propagates natively down FMOD\'s graph</b> with no per-frame tree walk. The mixer layout is serialized to JSON in <code>ProjectConfig</code>.'
          } },
          { type: 'code', lang: 'cpp', caption: { es: 'Creación jerárquica de buses', en: 'Hierarchical bus creation' }, code: CODE_CREATE_BUS },
          { type: 'h', text: { es: 'Espacialización 3D y doble ruta Core / Studio', en: '3D spatialization and dual Core / Studio path' } },
          { type: 'p', text: {
            es: '<code>AudioListener::OnUpdate</code> envía posición, <code>Forward()</code> y <code>Up()</code> del <code>Transform</code> a <code>setListenerAttributes</code>. Cada fuente espacial actualiza <code>set3DAttributes</code> por frame, usa <code>FMOD_3D | FMOD_3D_LINEARROLLOFF</code> y expone <code>Set3DMinMaxDistance</code>. <code>AudioSource</code> soporta tanto <code>FMOD::Sound</code> + <code>FMOD::Channel</code> (Core API) como <code>FMOD::Studio::EventInstance</code> (eventos de bancos), enrutados a su bus con <code>setChannelGroup</code>.',
            en: '<code>AudioListener::OnUpdate</code> pushes the transform\'s position, <code>Forward()</code> and <code>Up()</code> to <code>setListenerAttributes</code>. Spatial sources update <code>set3DAttributes</code> every frame, use <code>FMOD_3D | FMOD_3D_LINEARROLLOFF</code> and expose <code>Set3DMinMaxDistance</code>. <code>AudioSource</code> supports both <code>FMOD::Sound</code> + <code>FMOD::Channel</code> (Core API) and <code>FMOD::Studio::EventInstance</code> (bank events), routed to their bus via <code>setChannelGroup</code>.'
          } },
          { type: 'h', text: { es: 'Fundidos sin clicks', en: 'Click-free fades' } },
          { type: 'p', text: {
            es: '<code>Stop(fadeOutTime)</code> y <code>TransitionTo(clip, timeOut, timeIn, crossFade)</code> nunca cortan el canal: lo pasan a un canal <i>en fundido</i> que <code>ProcessFading(dt)</code> atenúa cada frame con una curva <code>sqrt(1 - t)</code> (caída perceptualmente uniforme, sin escalón audible) antes de detenerlo; el clip entrante arranca a volumen 0 y sube. <code>AudioSource::OnUpdate</code> está instrumentado con <code>LP_FUNC()</code> (zona <b>Tracy</b> <code>ZoneScoped</code>).',
            en: '<code>Stop(fadeOutTime)</code> and <code>TransitionTo(clip, timeOut, timeIn, crossFade)</code> never hard-cut: the channel is handed to a <i>fading</i> slot that <code>ProcessFading(dt)</code> attenuates each frame with a <code>sqrt(1 - t)</code> curve (perceptually smooth, no audible step) before stopping; the incoming clip starts at 0 and ramps up. <code>AudioSource::OnUpdate</code> is instrumented with <code>LP_FUNC()</code> (a <b>Tracy</b> <code>ZoneScoped</code> zone).'
          } },
          { type: 'code', lang: 'cpp', caption: { es: 'Fade-out perceptual por frame', en: 'Per-frame perceptual fade-out' }, code: CODE_PROCESS_FADING }
        ]
      },
      {
        label: { es: '[A] PUENTE MONO', en: '[A] MONO BRIDGE' },
        blocks: [
          { type: 'p', text: {
            es: 'Registré las funciones nativas con <code>mono_add_internal_call("Loopie.InternalCalls::AudioSource_SetPitch", ...)</code> en <code>ScriptGlue.cpp</code>. Cada llamada resuelve la entidad y el componente por ID (<code>Utils::GetComponent&lt;AudioSource&gt;(entity, componentID)</code>) y delega en el componente nativo.',
            en: 'Native functions are registered with <code>mono_add_internal_call("Loopie.InternalCalls::AudioSource_SetPitch", ...)</code> in <code>ScriptGlue.cpp</code>. Each call resolves entity and component by ID (<code>Utils::GetComponent&lt;AudioSource&gt;(entity, componentID)</code>) and delegates to the native component.'
          } },
          { type: 'p', text: {
            es: '<b>Superficie expuesta (17 llamadas):</b> <code>Play(startTime)</code>, <code>Stop(fadeTime)</code>, <code>TransitionTo</code>, <code>SetLoop</code>, <code>SetPitch / GetPitch</code>, <code>SetVolume / GetVolume</code>, <code>SetPan / GetPan</code>, <code>Set3DMinMaxDistance</code> (getter por punteros <code>float*</code>), <code>SetPlaybackTime / GetPlaybackTime</code> y <code>AudioMixer_SetBusVolume / GetBusVolume</code>. En C#, <code>AudioMixer</code> incluye conversión perceptual lineal ↔ motor (<code>pow(t, 2.2)</code> / <code>sqrt</code>) para que los sliders de opciones se sientan lineales al oído.',
            en: '<b>Exposed surface (17 calls):</b> <code>Play(startTime)</code>, <code>Stop(fadeTime)</code>, <code>TransitionTo</code>, <code>SetLoop</code>, <code>SetPitch / GetPitch</code>, <code>SetVolume / GetVolume</code>, <code>SetPan / GetPan</code>, <code>Set3DMinMaxDistance</code> (getter via <code>float*</code> out-params), <code>SetPlaybackTime / GetPlaybackTime</code> and <code>AudioMixer_SetBusVolume / GetBusVolume</code>. On the C# side, <code>AudioMixer</code> includes a perceptual linear ↔ engine mapping (<code>pow(t, 2.2)</code> / <code>sqrt</code>) so option sliders feel linear to the ear.'
          } },
          { type: 'code', lang: 'cpp', caption: { es: 'Lado nativo — InternalCall', en: 'Native side — InternalCall' }, code: CODE_INTERNAL_CALL_CPP },
          { type: 'code', lang: 'csharp', caption: { es: 'Lado gestionado — API idiomática para scripters', en: 'Managed side — idiomatic API for scripters' }, code: CODE_INTERNAL_CALL_CS }
        ]
      },
      {
        label: { es: '[A] GAMEPLAY C#', en: '[A] GAMEPLAY C#' },
        blocks: [
          { type: 'h', text: { es: 'HealthHUD / HealthSlot — dirigido por cambios', en: 'HealthHUD / HealthSlot — change-driven' } },
          { type: 'p', text: {
            es: '<code>HealthHUD</code> cachea <code>lastKnownHealth / lastKnownMaxHealth</code> y <b>solo reconstruye la barra cuando el valor cambia</b> (patrón <i>dirty-check</i>): 0 reconstrucciones innecesarias por frame. Cada <code>HealthSlot</code> es una unidad discreta con cuatro estados visuales (<code>Full</code>, <code>Half</code>, <code>Empty</code>, <code>Locked</code>). Al subir la vida máxima (8 → 12 → 16 → 20), una corrutina <code>AnimateUnlocking</code> cambia el fondo de la barra y reproduce la animación de desbloqueo sin bloquear el bucle de juego.',
            en: '<code>HealthHUD</code> caches <code>lastKnownHealth / lastKnownMaxHealth</code> and <b>only rebuilds when a value changes</b> (<i>dirty-check</i>): zero unnecessary rebuilds per frame. Each <code>HealthSlot</code> is a discrete unit with four visual states (<code>Full</code>, <code>Half</code>, <code>Empty</code>, <code>Locked</code>). When max health grows (8 → 12 → 16 → 20) an <code>AnimateUnlocking</code> coroutine swaps the bar background and plays the unlock animation without blocking the game loop.'
          } },
          { type: 'code', lang: 'csharp', caption: { es: 'Reconstrucción solo ante cambios', en: 'Rebuild only on change' }, code: CODE_HEALTH_HUD },
          { type: 'h', text: { es: 'UIPopupManager — pausa lógica desacoplada del reloj', en: 'UIPopupManager — logical pause decoupled from the clock' } },
          { type: 'p', text: {
            es: 'Los popups (tutoriales, gemas recogidas) se muestran con un fundido de <code>CanvasGroup.Alpha</code> en corrutina y ponen el juego en <code>GameManager.GameState.PAUSE</code>. Diseñé la pausa como un <b>estado de gameplay, no como <code>timeScale = 0</code></b>: <code>PAUSE</code> mantiene <code>timeScale = 1</code> y es el <code>PlayerController</code> quien consulta el estado para bloquear la entrada, de modo que los fundidos de UI siguen animándose; <code>FREEZE</code> (<code>timeScale = 0</code>) queda reservado para congelaciones totales.',
            en: 'Popups (tutorials, collected gems) fade in through a <code>CanvasGroup.Alpha</code> coroutine and switch the game to <code>GameManager.GameState.PAUSE</code>. Pause is modelled as a <b>gameplay state, not <code>timeScale = 0</code></b>: <code>PAUSE</code> keeps <code>timeScale = 1</code> and the <code>PlayerController</code> gates input by state, so UI fades keep animating; <code>FREEZE</code> (<code>timeScale = 0</code>) is reserved for hard freezes.'
          } },
          { type: 'h', text: { es: 'Git en equipo grande', en: 'Large-team Git' } },
          { type: 'p', text: {
            es: 'Ramas temáticas (<code>GodMode</code>, <code>Puzzles</code>, <code>Audio-System</code>, <code>UI-System</code>), escena de pruebas aislada (<code>Testing/Gym_HUD.scene</code>) para iterar la UI sin tocar niveles de producción, y fusiones resueltas sobre escenas serializadas de gran tamaño (<code>Level_2_Waterpath_Revamp.scene</code>: <b>más de 127.000 líneas</b>) preservando las referencias a componentes nativos.',
            en: 'Topic branches (<code>GodMode</code>, <code>Puzzles</code>, <code>Audio-System</code>, <code>UI-System</code>), an isolated test scene (<code>Testing/Gym_HUD.scene</code>) to iterate UI without touching production levels, and merges resolved on very large serialized scenes (<code>Level_2_Waterpath_Revamp.scene</code>: <b>127,000+ lines</b>) while preserving native component references.'
          } }
        ]
      },
      {
        label: { es: '[R] RESULTADO', en: '[R] RESULT' },
        blocks: [
          { type: 'list', items: [
            { es: '<b>Subsistema de audio nativo completo</b> en un motor que no tenía sonido: buses jerárquicos, Core + Studio, espacialización 3D, fundidos y mezclador persistente — usado en producción por <i>The Fable of the Eclipse</i> v1.0.', en: '<b>A complete native audio subsystem</b> in an engine that previously had none — hierarchical buses, Core + Studio, 3D spatialization, fades and a persisted mixer — shipped in <i>The Fable of the Eclipse</i> v1.0.' },
            { es: '<b>Cero fugas de memoria</b>: propiedad del árbol de buses con <code>std::unique_ptr</code>, liberación de canales en el destructor de <code>AudioSource</code>, <code>unloadAll() + release()</code> en <code>Shutdown</code>.', en: '<b>Zero memory leaks</b>: <code>unique_ptr</code>-owned bus tree, channel release in the <code>AudioSource</code> destructor, <code>unloadAll() + release()</code> on shutdown.' },
            { es: '<b>Coste de audio inferior al 1,5 % del tiempo de frame</b> medido con las zonas Tracy del motor; el juego se entregó a <b>60 FPS estables</b>.', en: '<b>Audio cost under 1.5 % of frame time</b> measured with the engine\'s Tracy zones; the game shipped at a <b>stable 60 FPS</b>.' },
            { es: '<b>17 <code>InternalCalls</code> de audio</b> (fuente, listener, mezclador) consumidas por el resto del equipo de gameplay desde C# sin tocar C++.', en: '<b>17 audio <code>InternalCalls</code></b> (source, listener, mixer) consumed by the rest of the gameplay team from C# without touching C++.' },
            { es: '<b>HUD sin desincronizaciones</b> entre vida real y representación, y <b>popups modales sin bloqueos de entrada</b> gracias a la pausa lógica por estado.', en: '<b>No HUD desyncs</b> between real and displayed health, and <b>modal popups with no input lockups</b> thanks to state-based logical pause.' }
          ] }
        ]
      }
    ],
    actions: [
      { type: 'link', label: { es: 'REPO MOTOR (C++)', en: 'ENGINE REPO (C++)' }, href: REPO_ENGINE, icon: 'gh' },
      { type: 'link', label: { es: 'REPO JUEGO (C#)', en: 'GAME REPO (C#)' }, href: REPO_GAME, icon: 'gh' },
      { type: 'link', label: { es: 'WEB OFICIAL', en: 'OFFICIAL SITE' }, href: WEB_FABLE, icon: 'web' }
    ]
  },

  // =========================================================================
  // 2 — AVE PHOENIX REGEN
  // =========================================================================
  {
    code: 'SYS-03 // AVE_PHOENIX.REGEN',
    accent: '#fb923c',
    title: { es: 'AVE PHOENIX REGEN — RETRO ARCADE SHMUP', en: 'AVE PHOENIX REGEN — RETRO ARCADE SHMUP' },
    subtitle: {
      es: 'Solo Developer · Unity C# · arquitectura, gameplay, IA del jefe, audio, UI y build (PC + Android)',
      en: 'Solo Developer · Unity C# · architecture, gameplay, boss AI, audio, UI and build (PC + Android)'
    },
    badges: ['Unity C#', 'Zero-GC ObjectPool<T>', 'FSM · IState / IBossState', 'IDamageable Events', 'ScriptableObject Data', 'Unity Input System', 'PC + Android'],
    metrics: [
      { value: '0 B/frame', label: { es: 'Heap durante el combate', en: 'Heap during combat' } },
      { value: '60+ FPS', label: { es: 'Sostenidos PC y Android', en: 'Sustained on PC & Android' } },
      { value: '~5.3K', label: { es: 'Líneas C# · 44 scripts', en: 'C# lines · 44 scripts' } },
      { value: '4 FSM', label: { es: 'Flujo · Escudo · Jefe · Diálogo', en: 'Flow · Shield · Boss · Dialogue' } }
    ],
    gallery: [
      { src: 'assets/ave_phoenix_boss.png', alt: { es: 'Jefe final de Ave Phoenix Regen', en: 'Ave Phoenix Regen final boss' }, caption: { es: 'Jefe multifase — BossController + IBossState', en: 'Multi-phase boss — BossController + IBossState' } },
      { src: 'assets/ave_player_ship.png', alt: { es: 'Nave del jugador de Ave Phoenix Regen', en: 'Ave Phoenix Regen player ship' }, caption: { es: 'Nave del jugador — PlayerShooting sobre ObjectPool<Bullet>', en: 'Player ship — PlayerShooting on ObjectPool<Bullet>' } },
      { src: 'assets/ave_enemy_bird.png', alt: { es: 'Enemigo de oleada de Ave Phoenix Regen', en: 'Ave Phoenix Regen wave enemy' }, caption: { es: 'Enemigo de oleada — un pool por prefab (WaveManager)', en: 'Wave enemy — one pool per prefab (WaveManager)' } },
      { src: 'assets/phoenix_pixel_art.png', alt: { es: 'Pixel art del fénix', en: 'Phoenix pixel art' }, caption: { es: 'Pixel art del fénix — identidad visual del proyecto', en: 'Phoenix pixel art — project visual identity' } }
    ],
    sections: [
      {
        label: { es: '[S] SITUACIÓN', en: '[S] SITUATION' },
        blocks: [
          { type: 'p', text: {
            es: 'Un <i>shoot \'em up</i> arcade exige decenas de proyectiles y enemigos entrando y saliendo de escena cada segundo. El enfoque ingenuo de <code>Instantiate</code> / <code>Destroy</code> genera basura en el Heap y provoca picos del Garbage Collector justo en los momentos de mayor intensidad — el peor lugar posible para un tirón de frame.',
            en: 'An arcade <i>shoot \'em up</i> pushes dozens of projectiles and enemies in and out of the scene every second. The naive <code>Instantiate</code> / <code>Destroy</code> approach allocates on the heap and triggers Garbage Collector spikes exactly during the most intense moments — the worst possible place for a frame hitch.'
          } },
          { type: 'p', text: {
            es: 'Además, el proyecto necesitaba un jefe final con fases reactivas, oleadas configurables sin recompilar y un flujo de juego (menú → historia → arcade) mantenible por una sola persona, con soporte de teclado, mando y pantalla táctil.',
            en: 'The project also needed a boss with reactive phases, waves tunable without recompiling, and a maintainable game flow (menu → story → arcade) for a single developer, with keyboard, gamepad and touch support.'
          } }
        ]
      },
      {
        label: { es: '[T] TAREA', en: '[T] TASK' },
        blocks: [
          { type: 'p', text: {
            es: 'Diseñar e implementar en solitario toda la arquitectura de gameplay: bucle de combate sin asignaciones, máquinas de estados para flujo de juego, jefe y escudo, sistema de daño desacoplado, gestión de oleadas dirigida por datos, game feel (shake, hit-flash, puntuación flotante), gestor de audio, diálogos y build multiplataforma.',
            en: 'Design and implement, solo, the entire gameplay architecture: allocation-free combat loop, state machines for game flow, boss and shield, a decoupled damage system, data-driven wave management, game feel (shake, hit-flash, floating score), audio manager, dialogue and multi-platform build.'
          } },
          { type: 'kv', rows: [
            { k: { es: 'Namespaces', en: 'Namespaces' }, v: { es: '<code>PhoenixReborn.{Core, Gameplay, Systems, Data, UI}</code>', en: '<code>PhoenixReborn.{Core, Gameplay, Systems, Data, UI}</code>' } },
            { k: { es: 'Plataformas', en: 'Platforms' }, v: { es: 'PC (teclado / mando) · Android (táctil) — <code>AndroidBuildPipeline</code> automatiza la APK', en: 'PC (keyboard / gamepad) · Android (touch) — <code>AndroidBuildPipeline</code> automates the APK' } }
          ] }
        ]
      },
      {
        label: { es: '[A] ZERO-GC POOLING', en: '[A] ZERO-GC POOLING' },
        blocks: [
          { type: 'list', items: [
            { es: 'Todos los proyectiles (<code>Bullet</code>, <code>EnemyProjectile</code>) y todos los enemigos de oleada (<code>SmallBirdEnemy</code>, <code>MediumPhoenixEnemy</code>) viven en <code>UnityEngine.Pool.ObjectPool&lt;T&gt;</code> con <code>defaultCapacity</code> / <code>maxSize</code> acotados (balas 20/60, proyectiles del jefe 15/40, enemigos 15/50).', en: 'Every projectile (<code>Bullet</code>, <code>EnemyProjectile</code>) and every wave enemy (<code>SmallBirdEnemy</code>, <code>MediumPhoenixEnemy</code>) lives in a <code>UnityEngine.Pool.ObjectPool&lt;T&gt;</code> with bounded <code>defaultCapacity</code> / <code>maxSize</code> (bullets 20/60, boss projectiles 15/40, enemies 15/50).' },
            { es: '<code>WaveManager</code> mantiene un <code>Dictionary&lt;Enemy, ObjectPool&lt;Enemy&gt;&gt;</code> — <b>un pool por prefab</b>, creado bajo demanda — de modo que cambiar el tipo de enemigo de una oleada no requiere tocar código.', en: '<code>WaveManager</code> keeps a <code>Dictionary&lt;Enemy, ObjectPool&lt;Enemy&gt;&gt;</code> — <b>one pool per prefab</b>, created on demand — so switching a wave\'s enemy type requires no code change.' },
            { es: 'Cada entidad recibe su pool en <code>Init(pool)</code> y se devuelve con <code>_pool.Release(this)</code> al expirar o al impactar; un flag <code>_isReturned</code> garantiza <b>idempotencia</b> frente a dobles colisiones en el mismo frame.', en: 'Each entity receives its pool in <code>Init(pool)</code> and returns itself with <code>_pool.Release(this)</code> on timeout or hit; an <code>_isReturned</code> flag guarantees <b>idempotency</b> against double collisions in the same frame.' },
            { es: 'La colisión no busca por tipo concreto: <code>Bullet</code> resuelve <code>IDamageable</code> y llama a <code>TakeDamage(1)</code>, lo que permite dañar enemigos, segmentos de barrera y núcleo del jefe con el mismo código.', en: 'Collision never checks concrete types: <code>Bullet</code> resolves <code>IDamageable</code> and calls <code>TakeDamage(1)</code>, so the same code damages enemies, barrier segments and the boss core.' }
          ] },
          { type: 'code', lang: 'csharp', caption: { es: 'Pool acotado + devolución idempotente', en: 'Bounded pool + idempotent release' }, code: CODE_POOL }
        ]
      },
      {
        label: { es: '[A] BOSS FSM', en: '[A] BOSS FSM' },
        blocks: [
          { type: 'p', text: {
            es: '<b>FSM genérica del núcleo.</b> <code>IState { Enter(); Tick(dt); Exit(); }</code> + <code>StateMachine.ChangeState(newState)</code>. Una instancia gobierna el flujo global (<code>BootState → MainMenuState → StoryModeState / ArcadeModeState</code>, cada uno cargando su escena aditiva vía <code>SceneLoader</code>); otra gobierna el escudo del jugador (<code>ShieldReadyState → ShieldActiveState → ShieldCooldownState</code>, con <code>Progress</code> expuesto para la UI).',
            en: '<b>Generic core FSM.</b> <code>IState { Enter(); Tick(dt); Exit(); }</code> + <code>StateMachine.ChangeState(newState)</code>. One instance drives global flow (<code>BootState → MainMenuState → StoryModeState / ArcadeModeState</code>, each loading its scene additively via <code>SceneLoader</code>); another drives the player shield (<code>ShieldReadyState → ShieldActiveState → ShieldCooldownState</code>, exposing <code>Progress</code> for the UI).'
          } },
          { type: 'p', text: {
            es: '<b>FSM del jefe (<code>IBossState</code>).</b> Estados con contexto explícito: <code>BossIntroState</code> (descenso <code>Vector3.Lerp</code> en 2,5 s, alarma, aviso en HUD) → <code>BossPhase1State</code> (patrulla acotada al ancho real de la cámara ortográfica) → <b><code>BossPhase2State</code> "enfurecido"</b>, disparado de forma <b>reactiva</b> cuando <code>GetDestroyedBarrierRatio() >= 0.5f</code> → <code>BossDefeatedState</code>.',
            en: '<b>Boss FSM (<code>IBossState</code>).</b> Context-passing states: <code>BossIntroState</code> (2.5 s <code>Vector3.Lerp</code> descent, alarm, HUD warning) → <code>BossPhase1State</code> (patrol clamped to the real orthographic camera width) → <b><code>BossPhase2State</code> "enraged"</b>, triggered <b>reactively</b> when <code>GetDestroyedBarrierRatio() >= 0.5f</code> → <code>BossDefeatedState</code>.'
          } },
          { type: 'p', text: {
            es: '<b>Daño dirigido por eventos.</b> <code>BossBarrierSegment</code> y <code>BossCore</code> implementan <code>IDamageable</code>; al morir emiten <code>OnSegmentDestroyed</code> / <code>OnCoreDestroyed</code>. <code>BossController</code> se suscribe en <code>Awake</code>, <b>se desuscribe en el handler y en <code>OnDestroy</code></b> (sin referencias colgantes) y solo incrementa un contador: la FSM lee el ratio, nunca consulta a los segmentos uno a uno. Las barreras se destruyen individualmente, abriendo huecos físicos hacia el núcleo.',
            en: '<b>Event-driven damage.</b> <code>BossBarrierSegment</code> and <code>BossCore</code> implement <code>IDamageable</code> and raise <code>OnSegmentDestroyed</code> / <code>OnCoreDestroyed</code> on death. <code>BossController</code> subscribes in <code>Awake</code>, <b>unsubscribes in the handler and in <code>OnDestroy</code></b> (no dangling references) and only bumps a counter: the FSM reads the ratio, never polls segments. Barriers die individually, opening physical gaps toward the core.'
          } },
          { type: 'code', lang: 'csharp', caption: { es: 'Transición reactiva a fase enfurecida', en: 'Reactive transition to enraged phase' }, code: CODE_BOSS_FSM }
        ]
      },
      {
        label: { es: '[A] DATOS & GAME FEEL', en: '[A] DATA & GAME FEEL' },
        blocks: [
          { type: 'list', items: [
            { es: '<b><code>WaveDataSO</code> (ScriptableObject).</b> Cada oleada define prefab, <code>SpawnPatternType</code> (<code>RandomStream</code>, <code>GridRowFormation</code>, <code>VShapeFormation</code>, <code>AlternatingWings</code>), total, enemigos por fila, intervalo y ancho. <code>CalculateSpawnPosition</code> <b>clampa el ancho al viewport real</b> (<code>orthographicSize * aspect</code>) para cualquier relación de aspecto móvil.', en: '<b><code>WaveDataSO</code> (ScriptableObject).</b> Each wave defines prefab, <code>SpawnPatternType</code> (<code>RandomStream</code>, <code>GridRowFormation</code>, <code>VShapeFormation</code>, <code>AlternatingWings</code>), totals, per-row count, interval and width. <code>CalculateSpawnPosition</code> <b>clamps the width to the real viewport</b> (<code>orthographicSize * aspect</code>) for any mobile aspect ratio.' },
            { es: '<b><code>ArcadeModeManager</code>.</b> Escalado paramétrico de oleadas, jefe cada 10 oleadas y regla de recuperación: 3 oleadas completas sin daño (o derrotar al jefe) devuelven +1 vida. El disparo se bloquea (<code>CanPlayerFire</code>) hasta que aparece el primer enemigo.', en: '<b><code>ArcadeModeManager</code>.</b> Parametric wave scaling, a boss every 10 waves and a recovery rule: 3 full waves without damage (or beating the boss) returns +1 life. Firing is gated (<code>CanPlayerFire</code>) until the first enemy appears.' },
            { es: '<b><code>StoryDialogueSO</code> / <code>DialogueManager</code>.</b> Diálogos como assets (hablante, avatar, texto, blip). El diálogo pausa con <code>timeScale = 0</code> y anima el texto con <code>Time.unscaledDeltaTime</code>: la máquina de escribir corre mientras el mundo está congelado.', en: '<b><code>StoryDialogueSO</code> / <code>DialogueManager</code>.</b> Dialogue lines as assets (speaker, avatar, text, blip). Dialogue pauses with <code>timeScale = 0</code> and animates the typewriter with <code>Time.unscaledDeltaTime</code>: text keeps flowing while the world is frozen.' },
            { es: '<b>Game feel.</b> <code>CameraShake</code> (corrutina, ignorada si <code>timeScale <= 0</code>), <code>HitFlash</code> (color temporal del <code>SpriteRenderer</code>, cancelable, con reset en <code>OnEnable/OnDisable</code> para objetos pooleados), <code>FloatingScoreManager</code>, <code>VFXManager</code> y <code>AudioManager</code> centralizado con <code>PlayOneShot</code>.', en: '<b>Game feel.</b> <code>CameraShake</code> (coroutine, ignored when <code>timeScale <= 0</code>), <code>HitFlash</code> (temporary <code>SpriteRenderer</code> color, cancellable, reset on <code>OnEnable/OnDisable</code> for pooled objects), <code>FloatingScoreManager</code>, <code>VFXManager</code> and a centralized <code>AudioManager</code> with <code>PlayOneShot</code>.' },
            { es: '<b>Entrada.</b> <code>PlayerInputReader</code> unifica Unity Input System (teclado/mando con deadzone) y arrastre táctil.', en: '<b>Input.</b> <code>PlayerInputReader</code> unifies the Unity Input System (keyboard/gamepad with deadzone) and touch drag.' }
          ] }
        ]
      },
      {
        label: { es: '[R] RESULTADO', en: '[R] RESULT' },
        blocks: [
          { type: 'list', items: [
            { es: '<b>0 B/frame de asignación en Heap durante el combate</b> — balas, proyectiles enemigos y enemigos de oleada viven íntegramente en pools; sin picos de GC en los momentos de máxima densidad.', en: '<b>0 B/frame heap allocation during combat</b> — bullets, enemy projectiles and wave enemies live entirely in pools; no GC spikes at peak density.' },
            { es: '<b>60+ FPS sostenidos</b> en PC y Android con decenas de entidades activas.', en: '<b>60+ FPS sustained</b> on PC and Android with dozens of active entities.' },
            { es: '<b>Jefe multifase reactivo</b> y <b>escudo con cooldown</b> como FSM intercambiables; añadir una fase es añadir una clase <code>IBossState</code>, sin tocar el controlador.', en: '<b>Reactive multi-phase boss</b> and <b>cooldown shield</b> as swappable FSMs; adding a phase means adding one <code>IBossState</code> class, with no controller changes.' },
            { es: '<b>Diseño iterable sin recompilar</b>: oleadas, formaciones y diálogos son assets <code>ScriptableObject</code>.', en: '<b>Iterable design without recompiling</b>: waves, formations and dialogue are <code>ScriptableObject</code> assets.' },
            { es: 'Proyecto completo publicado en solitario: dos modos de juego, historia con diálogos, dedicatoria, build PC + Android.', en: 'A complete solo-shipped project: two game modes, story with dialogue, dedication screen, PC + Android builds.' }
          ] }
        ]
      }
    ],
    actions: [
      { type: 'link', label: { es: 'GITHUB · VIXTORBIR', en: 'GITHUB · VIXTORBIR' }, href: CONTACT.github, icon: 'gh' }
    ]
  },

  // =========================================================================
  // 3 — COMBAT & AI (R&D)
  // =========================================================================
  {
    code: 'SYS-04 // HITBOX_LAB.WIP',
    accent: '#c084fc',
    title: { es: 'COMBAT & AI // HITBOX LAB (I+D)', en: 'COMBAT & AI // HITBOX LAB (R&D)' },
    subtitle: {
      es: 'Roadmap de investigación · prototipos de combate e IA · en desarrollo activo',
      en: 'Research roadmap · combat & AI prototypes · in active development'
    },
    badges: ['WIP', 'C++ / C#', 'FSM', 'Behavior Trees', 'Hitbox Data', 'R&D'],
    metrics: [
      { value: 'WIP', label: { es: 'Estado: investigación activa', en: 'Status: active research' } },
      { value: 'FSM + BT', label: { es: 'Arquitectura objetivo', en: 'Target architecture' } },
      { value: 'C++ / C#', label: { es: 'Unreal y Unity', en: 'Unreal and Unity' } },
      { value: '2026', label: { es: 'Roadmap en curso', en: 'Roadmap in progress' } }
    ],
    gallery: [],
    sections: [
      {
        label: { es: 'ROADMAP I+D', en: 'R&D ROADMAP' },
        blocks: [
          { type: 'note', text: {
            es: '<b>Ficha en desarrollo activo.</b> Este sistema documenta líneas de investigación, no un título publicado. Los case studies con código verificable son SYS-02 y SYS-03.',
            en: '<b>Sheet in active development.</b> This system documents research lines, not a shipped title. The case studies with verifiable code are SYS-02 and SYS-03.'
          } },
          { type: 'list', items: [
            { es: '<b>Datos de hitbox desacoplados del modelo:</b> ventanas activas de golpe definidas por frame (startup / active / recovery) en assets de datos, no en el código del personaje.', en: '<b>Hitbox data decoupled from the model:</b> per-frame active hit windows (startup / active / recovery) defined in data assets, not in character code.' },
            { es: '<b>Controlador de inercia y buffer de entrada:</b> máquina de estados de personaje (idle / walk / attack / hitstun) con aceleración por curva y cola de inputs para cancelaciones limpias.', en: '<b>Inertia controller and input buffer:</b> character state machine (idle / walk / attack / hitstun) with curve-based acceleration and an input queue for clean cancels.' },
            { es: '<b>IA táctica:</b> Behavior Trees que evalúan rango óptimo, secuencias de combo y espaciado, con consultas distribuidas en el tiempo (<i>time-slicing</i>) para no penalizar el frame.', en: '<b>Tactical AI:</b> Behavior Trees that evaluate optimal range, combo sequences and spacing, with time-sliced queries to keep the frame budget intact.' },
            { es: '<b>Herramientas de depuración:</b> renderers de cápsulas de daño (verde / rojo) y conos de visión en tiempo real.', en: '<b>Debug tooling:</b> real-time renderers for damage capsules (green / red) and vision cones.' }
          ] }
        ]
      }
    ],
    actions: [
      { type: 'link', label: { es: 'GITHUB · VIXTORBIR', en: 'GITHUB · VIXTORBIR' }, href: CONTACT.github, icon: 'gh' }
    ]
  },

  // =========================================================================
  // 4 — GAMEPLAY SKILLS & TOOLS (8 PERKS)
  // =========================================================================
  {
    code: 'SYS-05 // LOADOUT.CFG',
    accent: '#38bdf8',
    title: { es: 'GAMEPLAY SKILLS & TOOLS // LOADOUT', en: 'GAMEPLAY SKILLS & TOOLS // LOADOUT' },
    subtitle: {
      es: 'Desglose técnico de los 8 perks: experiencia práctica real en cada uno',
      en: 'Technical breakdown of the 8 perks: real hands-on experience in each'
    },
    badges: ['C++', 'C#', 'C', 'Unreal Engine', 'Unity', 'FMOD', 'Wwise', 'Git'],
    metrics: [
      { value: '3', label: { es: 'Lenguajes (C++ · C# · C)', en: 'Languages (C++ · C# · C)' } },
      { value: '3', label: { es: 'Motores (propio · Unity · Unreal)', en: 'Engines (custom · Unity · Unreal)' } },
      { value: '2', label: { es: 'Middleware de audio', en: 'Audio middleware' } },
      { value: '18', label: { es: 'Devs en el mayor equipo Git', en: 'Devs in largest Git team' } }
    ],
    gallery: [],
    sections: [
      {
        label: { es: 'PERKS', en: 'PERKS' },
        blocks: [
          { type: 'perks', items: [
            { name: 'C++', tag: { es: 'MOTOR · AUDIO NATIVO', en: 'ENGINE · NATIVE AUDIO' }, level: 4, color: '#38bdf8', text: {
              es: 'Subsistema de audio de LoopieEngine: ciclo de vida FMOD, <code>struct AudioBus</code> con <code>unique_ptr</code>, componentes serializables, puente Mono. CMake + vcpkg, Tracy, C++17.',
              en: 'LoopieEngine audio subsystem: FMOD lifecycle, <code>struct AudioBus</code> with <code>unique_ptr</code>, serializable components, Mono bridge. CMake + vcpkg, Tracy, C++17.'
            } },
            { name: 'C#', tag: { es: 'GAMEPLAY · UNITY · SCRIPTING', en: 'GAMEPLAY · UNITY · SCRIPTING' }, level: 4, color: '#c084fc', text: {
              es: 'Ave Phoenix Regen completo (~5.300 líneas): <code>ObjectPool&lt;T&gt;</code>, FSM, eventos, ScriptableObjects. HUD y popups de Fable sobre el runtime C# de LoopieEngine.',
              en: 'Full Ave Phoenix Regen (~5,300 lines): <code>ObjectPool&lt;T&gt;</code>, FSM, events, ScriptableObjects. Fable HUD and popups on LoopieEngine\'s C# runtime.'
            } },
            { name: 'C', tag: { es: 'BASE · MEMORIA', en: 'FOUNDATION · MEMORY' }, level: 3, color: '#60a5fa', text: {
              es: 'Base académica (CITM): punteros, gestión manual de memoria, estructuras de datos. Fundamento del razonamiento sobre Stack / Heap y cache locality que aplico en C++ y C#.',
              en: 'Academic foundation (CITM): pointers, manual memory management, data structures. The basis for the Stack / Heap and cache-locality reasoning I apply in C++ and C#.'
            } },
            { name: 'UNREAL ENGINE', tag: { es: 'C++ · GAMEPLAY FRAMEWORK', en: 'C++ · GAMEPLAY FRAMEWORK' }, level: 2, color: '#f8fafc', text: {
              es: 'Experiencia práctica académica con el Gameplay Framework en C++ (Actors, Components, Blueprints). Línea de I+D activa para los prototipos de combate (SYS-04).',
              en: 'Hands-on academic experience with the C++ Gameplay Framework (Actors, Components, Blueprints). Active R&D line for the combat prototypes (SYS-04).'
            } },
            { name: 'UNITY', tag: { es: 'PRODUCCIÓN · PC + ANDROID', en: 'PRODUCTION · PC + ANDROID' }, level: 4, color: '#ffffff', text: {
              es: 'Proyecto publicado en solitario: Input System, pooling nativo, post-processing, corrutinas, build Android automatizada por script de editor.',
              en: 'Solo-shipped project: Input System, native pooling, post-processing, coroutines, Android build automated through an editor script.'
            } },
            { name: 'FMOD', tag: { es: 'CORE & STUDIO · INTEGRACIÓN', en: 'CORE & STUDIO · INTEGRATION' }, level: 4, color: '#f43f5e', text: {
              es: 'Integración nativa en C++: <code>ChannelGroup</code>, <code>EventInstance</code>, <code>set3DAttributes</code>, <code>FMOD_3D_LINEARROLLOFF</code>, fundidos por frame, mezclador serializado. 17 InternalCalls hacia C#.',
              en: 'Native C++ integration: <code>ChannelGroup</code>, <code>EventInstance</code>, <code>set3DAttributes</code>, <code>FMOD_3D_LINEARROLLOFF</code>, per-frame fades, serialized mixer. 17 InternalCalls to C#.'
            } },
            { name: 'WWISE', tag: { es: 'PIPELINE · FORMACIÓN', en: 'PIPELINE · TRAINING' }, level: 2, color: '#38bdf8', text: {
              es: 'Conocimiento del pipeline de Wwise (Events, RTPCs, buses, SoundBanks) a nivel formativo. La integración en producción la he realizado con FMOD; los conceptos son directamente transferibles.',
              en: 'Working knowledge of the Wwise pipeline (Events, RTPCs, buses, SoundBanks) at training level. Production integration done with FMOD; the concepts transfer directly.'
            } },
            { name: 'GIT / GITHUB', tag: { es: 'EQUIPO DE 18 · RAMAS', en: '18-DEV TEAM · BRANCHES' }, level: 4, color: '#fb923c', text: {
              es: 'Ramas temáticas (<code>Audio-System</code>, <code>GodMode</code>, <code>UI-System</code>), escenas de test aisladas, resolución de fusiones en escenas serializadas de 127K+ líneas, releases v0.2 → v1.0.',
              en: 'Topic branches (<code>Audio-System</code>, <code>GodMode</code>, <code>UI-System</code>), isolated test scenes, merge resolution on 127K+ line serialized scenes, releases v0.2 → v1.0.'
            } }
          ] }
        ]
      }
    ],
    actions: [
      { type: 'link', label: { es: 'GITHUB · VIXTORBIR', en: 'GITHUB · VIXTORBIR' }, href: CONTACT.github, icon: 'gh' },
      { type: 'download', label: { es: 'DESCARGAR CV (PDF)', en: 'DOWNLOAD RESUME (PDF)' }, href: CONTACT.cv, icon: 'pdf' }
    ]
  },

  // =========================================================================
  // 5 — CONTACT & HELP // HIRE INQUIRIES
  // =========================================================================
  {
    code: 'SYS-06 // COMM_LINK.HELP',
    accent: '#f43f5e',
    title: { es: 'CONTACT & HELP // HIRE INQUIRIES', en: 'CONTACT & HELP // HIRE INQUIRIES' },
    subtitle: {
      es: 'Disponible para Convenio de Prácticas Universitarias (CITM - UPC) · Barcelona · presencial / híbrido / remoto',
      en: 'Available for a University Internship Agreement (CITM - UPC) · Barcelona · on-site / hybrid / remote'
    },
    badges: ['CITM - UPC', 'Gameplay Programmer', 'Audio Programmer', 'C++ / C#', 'Barcelona'],
    metrics: [
      { value: 'OPEN', label: { es: 'Convenio de prácticas', en: 'Internship agreement' } },
      { value: 'BCN', label: { es: 'Presencial / híbrido / remoto', en: 'On-site / hybrid / remote' } },
      { value: 'ES · CA · EN', label: { es: 'Nativo · nativo · B2', en: 'Native · native · B2' } },
      { value: '< 24 h', label: { es: 'Respuesta habitual por email', en: 'Typical email response' } }
    ],
    gallery: [],
    sections: [
      {
        label: { es: 'CANALES', en: 'CHANNELS' },
        blocks: [
          { type: 'p', text: {
            es: 'Busco un <b>convenio de prácticas universitarias (CITM - UPC)</b> como <b>Gameplay / Audio Programmer</b> en un estudio donde aportar integración de audio nativo (FMOD, buses, espacialización), máquinas de estados limpias y bucles de gameplay sin asignaciones. Curriculares o extracurriculares, incorporación inmediata.',
            en: 'I am looking for a <b>university internship agreement (CITM - UPC)</b> as a <b>Gameplay / Audio Programmer</b> at a studio where I can contribute native audio integration (FMOD, buses, spatialization), clean state machines and allocation-free gameplay loops. Curricular or extracurricular, immediate start.'
          } },
          { type: 'kv', rows: [
            { k: { es: 'Email', en: 'Email' }, v: { es: `<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>`, en: `<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>` } },
            { k: { es: 'Teléfono', en: 'Phone' }, v: { es: `<a href="tel:${CONTACT.phone.replace(/\s+/g, '')}">${CONTACT.phone}</a>`, en: `<a href="tel:${CONTACT.phone.replace(/\s+/g, '')}">${CONTACT.phone}</a>` } },
            { k: { es: 'GitHub', en: 'GitHub' }, v: { es: `<a href="${CONTACT.github}" target="_blank" rel="noopener noreferrer">github.com/Vixtorbir</a>`, en: `<a href="${CONTACT.github}" target="_blank" rel="noopener noreferrer">github.com/Vixtorbir</a>` } },
            { k: { es: 'LinkedIn', en: 'LinkedIn' }, v: { es: `<a href="${CONTACT.linkedin}" target="_blank" rel="noopener noreferrer">${CONTACT.linkedin.replace('https://www.', '')}</a>`, en: `<a href="${CONTACT.linkedin}" target="_blank" rel="noopener noreferrer">${CONTACT.linkedin.replace('https://www.', '')}</a>` } },
            { k: { es: 'Ubicación', en: 'Location' }, v: { es: 'Barcelona, España · CITM - UPC', en: 'Barcelona, Spain · CITM - UPC' } }
          ] },
          { type: 'note', text: {
            es: 'Usa los botones inferiores para <b>copiar el email o el teléfono al portapapeles</b>, abrir GitHub / LinkedIn o descargar el CV en PDF.',
            en: 'Use the buttons below to <b>copy the email or phone number to the clipboard</b>, open GitHub / LinkedIn or download the PDF resume.'
          } }
        ]
      }
    ],
    actions: [
      { type: 'copy', label: { es: 'COPIAR EMAIL', en: 'COPY EMAIL' }, done: { es: '¡COPIADO!', en: 'COPIED!' }, value: CONTACT.email, icon: 'mail' },
      { type: 'copy', label: { es: 'COPIAR TELÉFONO', en: 'COPY PHONE' }, done: { es: '¡COPIADO!', en: 'COPIED!' }, value: CONTACT.phone, icon: 'tel' },
      { type: 'link', label: { es: 'GITHUB', en: 'GITHUB' }, href: CONTACT.github, icon: 'gh' },
      { type: 'link', label: { es: 'LINKEDIN', en: 'LINKEDIN' }, href: CONTACT.linkedin, icon: 'in' },
      { type: 'download', label: { es: 'CV (PDF)', en: 'RESUME (PDF)' }, href: CONTACT.cv, icon: 'pdf' }
    ]
  }
];

// Textos de UI propios de project.html
export const pageText = {
  es: {
    docTitle: 'Ficha técnica',
    back: '[ ← VOLVER AL ARCADE / ESC ]',
    backAria: 'Volver al arcade (Esc)',
    langAria: 'Idioma de la ficha',
    github: 'GITHUB',
    cv: 'CV (PDF)',
    kicker: 'FICHA TÉCNICA // CASE STUDY',
    metrics: 'MÉTRICAS CLAVE',
    gallery: 'GALERÍA',
    breakdown: 'DESGLOSE TÉCNICO',
    actions: 'ENLACES',
    copy: 'COPIAR CÓDIGO',
    copied: '¡COPIADO!',
    copyFail: 'ERROR AL COPIAR',
    prev: 'SISTEMA ANTERIOR',
    next: 'SIGUIENTE SISTEMA',
    contactTitle: '¿Hablamos?',
    contactBody: 'Disponible para Convenio de Prácticas Universitarias (CITM - UPC) como Gameplay / Audio Programmer. Respuesta habitual en menos de 24 h.',
    contactEmail: 'COPIAR EMAIL',
    contactLinkedin: 'LINKEDIN',
    hint: '[ ESC / ⌫ ] ARCADE   ·   [ ◄ ► ] CAMBIAR SISTEMA   ·   [ TAB ] NAVEGAR',
    hintPad: '[ B ] VOLVER AL ARCADE   ·   [ LB / RB ] PROYECTOS   ·   [ SELECT ] IDIOMA',
    padConnected: '🎮 MANDO DETECTADO: ',
    padDisconnected: '🎮 MANDO DESCONECTADO',
    footer: 'VÍCTOR CÁRDENAS · CITM - UPC · BARCELONA',
    notFound: 'Sistema no encontrado. Volviendo al arcade…'
  },
  en: {
    docTitle: 'Spec sheet',
    back: '[ ← BACK TO ARCADE / ESC ]',
    backAria: 'Back to arcade (Esc)',
    langAria: 'Spec sheet language',
    github: 'GITHUB',
    cv: 'RESUME (PDF)',
    kicker: 'SPEC SHEET // CASE STUDY',
    metrics: 'KEY METRICS',
    gallery: 'GALLERY',
    breakdown: 'TECHNICAL BREAKDOWN',
    actions: 'LINKS',
    copy: 'COPY CODE',
    copied: 'COPIED!',
    copyFail: 'COPY FAILED',
    prev: 'PREVIOUS SYSTEM',
    next: 'NEXT SYSTEM',
    contactTitle: "Let's talk",
    contactBody: 'Available for a University Internship Agreement (CITM - UPC) as a Gameplay / Audio Programmer. Typical reply within 24 h.',
    contactEmail: 'COPY EMAIL',
    contactLinkedin: 'LINKEDIN',
    hint: '[ ESC / ⌫ ] ARCADE   ·   [ ◄ ► ] SWITCH SYSTEM   ·   [ TAB ] NAVIGATE',
    hintPad: '[ B ] BACK TO ARCADE   ·   [ LB / RB ] PROJECTS   ·   [ SELECT ] LANGUAGE',
    padConnected: '🎮 GAMEPAD DETECTED: ',
    padDisconnected: '🎮 GAMEPAD DISCONNECTED',
    footer: 'VÍCTOR CÁRDENAS · CITM - UPC · BARCELONA',
    notFound: 'System not found. Returning to arcade…'
  }
};
