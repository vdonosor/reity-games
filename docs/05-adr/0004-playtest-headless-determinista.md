# ADR 0004 — Playtest headless determinista como gate de calidad

**Estado**: Aceptado
**Fecha**: 2026-06-19
**Decisor**: Vicente Donoso + agente
**Aplica a**: Token Stack y todos los juegos del monorepo donde el playtest sea automatizable.

---

## Contexto

El framework PRD-SDD-Tasks-Gate tiene un punto de falla documentado: si la condición de éxito se redacta como "que los tests pasen", un agente que corre autónomo (`/goal` o equivalente) puede entregar código donde los tests pasan pero el producto está roto. Específicamente, en juegos esto se manifiesta como: el código compila, las funciones del engine devuelven los tipos correctos, pero **el juego no es jugable** (físicas mal, balance roto, transiciones que no disparan, etc.).

Esto se le llama "condición de solo-verificación": valida que los checks estén verdes, pero no que el comportamiento del producto sea el esperado.

Fuerzas en juego:

- Necesitamos un gate de calidad automatizado para CI y para `/goal`.
- El gate debe ser ejecutable sin humano supervisor.
- Pero el gate debe **capturar comportamiento real del juego**, no solo "que las funciones retornen objetos".
- El costo del gate (tiempo, complejidad) debe ser razonable; no podemos construir QA humano automatizado.

---

## Decisión

Se adopta como gate de calidad un **playtest headless determinista**, ejecutado con **Playwright** contra el build de producción local.

**Características del playtest**:

1. **Determinista**: usa seed fijo + RNG controlado para que el resultado sea reproducible. La misma corrida en la misma versión de código produce el mismo resultado.
2. **Headless**: corre sin display. Apto para CI.
3. **Captura comportamiento real**: simula un jugador (no solo tests unitarios sobre funciones). Tap timing variable, decisiones realistas.
4. **Multi-partida**: ejecuta N=50 partidas, no solo una. Cubre variabilidad.
5. **Verifica comportamiento esperado, no solo "no crashea"**:
   - Score termina en rango razonable (no 0, no millones).
   - Partida dura entre 5 y 120 segundos.
   - Sin errores en consola.
   - El score reportado al server coincide con el score canónico calculado desde los game_events.
   - Bundle no excede budget.
   - Lighthouse Performance mobile > 85.
   - Anti-cheat marca inválido un score manipulado.

---

## Alternativas y por qué se descartaron

### Solo tests unitarios del engine (Vitest)

**Por qué se consideró**: rápido, determinista, fácil de escribir.

**Por qué se descartó como único gate**:
- No captura el problema de "engine ok pero la integración React/Three está rota".
- Un agente puede hacer pasar tests unitarios mockeando el comportamiento, sin que el juego real funcione.
- No mide bundle, performance, lighthouse.
- Se mantienen como complemento, no como gate principal.

### Solo tests E2E con Playwright sin determinismo (RNG no controlado)

**Por qué se consideró**: cubre flow completo de usuario.

**Por qué se descartó como único gate**:
- Sin determinismo, el test es flaky: a veces pasa, a veces falla por timing/RNG.
- En CI esto produce desgaste (re-runs, ignored failures).
- No permite reproducir un bug específico a partir de un seed.

### Visual regression testing (Chromatic, Percy)

**Por qué se consideró**: detecta cambios visuales no intencionados.

**Por qué se descartó como gate principal**:
- Cubre apariencia, no jugabilidad.
- Para un juego 3D animado, los snapshots son inestables (cualquier frame distinto rompe).
- Complementario opcional, pero no central.

### QA humano manual antes de cada release

**Por qué se consideró**: humano detecta cosas que ningún test puede.

**Por qué se descartó como gate único**:
- No escalable: un humano no puede correr 50 partidas antes de cada commit.
- Sí se mantiene como complemento obligatorio para PRs (revisión humana en el gate), pero no como verificación primaria.

### Property-based testing del engine (fast-check)

**Por qué se consideró**: encuentra casos edge que el dev no pensó.

**Por qué se descartó como gate único**:
- Cubre lógica pura, no integración React/Three/Supabase.
- Útil como complemento al unit testing del engine, no como gate end-to-end.

### Confiar en monitoring de producción (Sentry, error tracking)

**Por qué se descartó**:
- "Producción" para este evento es UN día. No hay tiempo de detectar y arreglar bugs post-deploy.
- El gate debe correr ANTES de production.

---

## Consecuencias

### Lo que se gana

- **El gate captura el comportamiento esperado, no solo el check verde.** Resiste el patrón de "agente que hace pasar el test sin resolver el problema".
- Reproducibilidad: un fallo viene con seed que permite re-ejecutarlo localmente.
- Cubre integración completa: React render + engine + cliente Supabase + anti-cheat.
- Mide performance budget en el mismo gate.
- CI puede correr el gate sin intervención humana (apto para `/goal`).

### Lo que se pierde / cuesta

- **Tiempo de ejecución**: 50 partidas en serie tarda ~5-8 minutos. Tolerable para CI.
- **Mantenimiento**: si el juego cambia mucho, el playtest se debe ajustar.
- **Complejidad de escribir**: requiere un "jugador artificial" que ejerza el juego. Más complejo que un test unit.
- **No reemplaza humano**: la UX subjetiva (¿se siente bien?) no la mide el playtest. Sigue siendo necesaria revisión humana.

### Cómo se mitiga la complejidad de escribir el playtest

- El playtest se escribe UNA vez por juego, no por feature.
- Cada feature que cambia mecánica de juego requiere actualizar el playtest junto con la implementación.
- El propio playtest se versiona junto con el código del juego.

### Implicaciones derivadas

- El engine puro debe ser **determinista por seed**. Sin esto, el playtest no es reproducible (decisión D-04 en SDD).
- Las pantallas del juego deben exponer `data-testid` claros para que Playwright pueda interactuar (`game-scene-ready`, `tap-zone`, `game-over`, `final-score`, `score-valid`).
- El bundle build debe correr antes del playtest; el gate orquesta esa secuencia.
- El playtest se ejecuta contra `npm run preview` (preview server de Vite sobre el build de prod), no contra el dev server. Así medimos lo que se va a desplegar.

### Limitaciones reconocidas del playtest

- No detecta bugs visuales (z-fighting, sombras feas) — eso se cubre con revisión humana.
- No detecta problemas de UX subjetiva — eso también es humano.
- No detecta bugs específicos de iOS Safari u otros browsers que no sean Chromium — para eso, smoke test pre-evento en dispositivos reales (T-604).

---

## Reversibilidad

**Fácilmente reversible.** El playtest es código de tests; si en futuro se decide cambiar la estrategia (ej: migrar a Cypress, agregar property-based, eliminar playtest porque el juego dejó de necesitarlo), es solo mover/borrar archivos en `tests/playtest/`.

Lo que NO es fácilmente reversible es la **decisión cultural**: que el equipo (humanos + agentes) confíe en el playtest como gate. Esto se cultiva con disciplina: cada PR que pasa el playtest pero rompe producción se analiza para mejorar el playtest, no para descartar el gate.

La decisión se revisa si:
- El tiempo de ejecución supera 15 minutos (entonces es muy costoso).
- Se descubren múltiples casos donde el playtest pasó y la producción se rompió (señal de que captura poco comportamiento real).
- Aparece una herramienta de mejor relación costo-beneficio para el mismo propósito.
