# 04 — Quality Gate: Token Stack

> **Razón de ser de este documento**: definir "terminado" de forma verificable. Sin esto, el gate no tiene contra qué validar y el agente puede entregar resultados técnicamente correctos pero inútiles.

**Versión**: 1.0 — 2026-06-19
**Spec**: [`02-spec-sdd.md`](./02-spec-sdd.md)
**Tasks**: [`03-tasks.md`](./03-tasks.md)

---

## 1. Cuándo corre el quality gate

El gate se ejecuta automáticamente en:

1. **Cada PR a `main`** vía GitHub Actions.
2. **Antes de cada `npm run deploy`** (script local que invoca el gate).
3. **24 horas antes del evento**, como smoke test integral (T-604).

El gate se ejecuta opcionalmente en:

4. **Antes de marcar una task como completada**, ejecutando solo los checks relevantes a esa task.

---

## 2. Qué bloquea el merge / deploy

Si alguno de estos checks falla, el gate **bloquea**. No hay override automático; la única forma de mergear con un check rojo es:

- Justificación explícita del humano revisor en el PR.
- Issue tracking del fallo con plazo de fix.
- Y solo para checks no críticos (ver clasificación abajo).

### Checks críticos (bloqueo absoluto, sin override)

| ID | Check | Cómo se ejecuta |
|---|---|---|
| QG-C01 | Build production exitoso | `npm run build` |
| QG-C02 | ESLint sin errores | `npm run lint` |
| QG-C03 | Tests unitarios pasan | `npm run test` |
| QG-C04 | **Playtest headless pasa** | `npm run test:playtest` |
| QG-C05 | Anti-cheat funcional verificado | test E2E específico |
| QG-C06 | Bundle inicial < 300KB gzip | medición post-build |
| QG-C07 | Sin secretos en bundle | grep del build |
| QG-C08 | Migraciones SQL idempotentes | `supabase db reset && supabase db push` |

### Checks no críticos (bloqueo soft, override con justificación)

| ID | Check | Cómo se ejecuta |
|---|---|---|
| QG-S01 | Lighthouse Performance mobile > 85 | Lighthouse CI |
| QG-S02 | Coverage tests unit ≥ 80% en `engine/` | Vitest coverage |
| QG-S03 | Trazabilidad spec ↔ código documentada | revisión manual del PR |

---

## 3. Coherencia con la constitution

Antes de cualquier otro check, el gate verifica que **la constitution se respeta**:

- ¿El PR introduce dependencias nuevas? → debe existir referencia en spec o ADR.
- ¿El PR modifica `src/styles/theme.css`? → debe existir ADR aprobado.
- ¿El PR commitea archivos `.env`, `.env.local` o similares? → bloqueo absoluto.
- ¿El PR desactiva tests existentes? → bloqueo absoluto sin justificación en el ADR.

Estos checks son automatizables como hooks pre-commit (ESLint + script bash):

```bash
# pre-commit hook
if git diff --cached --name-only | grep -qE '^\.env'; then
  echo "❌ No commitear archivos .env"
  exit 1
fi
```

---

## 4. Trazabilidad spec ↔ código

Este es el check más crítico y el más fácil de saltarse.

### Regla
Todo archivo de código bajo `src/games/token-stack/` debe poder asociarse a al menos una task del `03-tasks.md`.

### Verificación
Manual durante revisión de PR. El revisor debe preguntarse:

- ¿Qué task implementa este archivo?
- ¿El task está marcado como completado en este PR?
- ¿El criterio de aceptación de esa task se verificó?

Si la respuesta a alguna es "no sé", el PR se devuelve con comentario para que el autor lo trace explícitamente.

---

## 5. El verificador determinista (playtest headless)

**Este es el corazón del quality gate.** Sin un verificador determinista, todos los demás checks pueden pasar sin que el juego sea jugable. Es el error documentado que produce "tests pasan pero el resultado es injugable".

### Cómo se redacta la condición de éxito (regla crítica)

❌ **Mal redactada (solo-verificación)**:
> "Que los tests de playtest pasen."

Esto permite al agente hacer pasar los tests sin resolver el problema real (ej: marcar todos los tests como skipped).

✅ **Bien redactada (captura comportamiento esperado)**:
> "Un jugador artificial que ejecuta 50 partidas con timing variable entre 300ms y 2000ms por placement, usando un seed determinista, debe terminar las 50 partidas con scores entre 5 y 60 puntos, sin crashes, sin errores en consola, en menos de 5 minutos totales. El score reportado al server debe coincidir con el score canónico calculado desde los game_events."

La diferencia: la segunda frase describe **qué tiene que pasar en el juego**, no solo qué verde tienen los checks.

### Implementación del playtest

Archivo: `tests/playtest/token-stack.spec.js`

```js
import { test, expect } from '@playwright/test';

const SEED = 'token-stack-verifier-seed-v1';
const N_GAMES = 50;
const MIN_PLACEMENT_DELAY_MS = 300;
const MAX_PLACEMENT_DELAY_MS = 2000;

test.describe('Playtest headless determinista — Token Stack', () => {
  test(`${N_GAMES} partidas simuladas terminan correctamente`, async ({ page, context }) => {
    const failures = [];
    const scores = [];

    for (let i = 0; i < N_GAMES; i++) {
      await page.goto(`http://localhost:5173/token-stack?test-seed=${SEED}-${i}&headless=1`);

      // Saltar captura de lead (modo headless)
      await page.evaluate(() => sessionStorage.setItem('test-lead', JSON.stringify({ rut: '11111111-1', nombre: 'Test Bot', email: 'bot@test.cl', consent: true })));
      await page.reload();

      const gameStart = Date.now();
      let placements = 0;

      // Esperar a que la escena cargue
      await page.waitForSelector('[data-testid="game-scene-ready"]', { timeout: 5000 });

      // Loop: tap, esperar delay aleatorio (pero determinista por seed+i), repetir hasta game over
      const rng = mulberry32(hashCode(`${SEED}-${i}`));
      while (placements < 200) {
        const delay = MIN_PLACEMENT_DELAY_MS + Math.floor(rng() * (MAX_PLACEMENT_DELAY_MS - MIN_PLACEMENT_DELAY_MS));
        await page.waitForTimeout(delay);

        const gameOver = await page.locator('[data-testid="game-over"]').isVisible();
        if (gameOver) break;

        await page.locator('[data-testid="tap-zone"]').click();
        placements++;
      }

      const score = await page.locator('[data-testid="final-score"]').textContent();
      const valid = await page.locator('[data-testid="score-valid"]').getAttribute('data-valid');
      const errors = await collectConsoleErrors(page);

      scores.push(parseInt(score, 10));

      // Verificaciones por partida
      if (errors.length > 0) failures.push({ game: i, reason: 'console errors', errors });
      if (valid !== 'true') failures.push({ game: i, reason: 'score not valid', score });
      if (Date.now() - gameStart < 5000) failures.push({ game: i, reason: 'game too short' });
      if (Date.now() - gameStart > 120000) failures.push({ game: i, reason: 'game too long' });
    }

    // Verificaciones agregadas
    expect(failures).toEqual([]);
    expect(scores.every(s => s >= 0 && s <= 200)).toBe(true);
    expect(Math.max(...scores)).toBeGreaterThanOrEqual(5); // al menos una partida llegó a score 5
  });

  test('bundle inicial < 300KB gzip', async () => {
    // ejecutar npm run build, medir dist/assets/*.js gzipped
    const size = await measureGzippedBundle();
    expect(size).toBeLessThan(300 * 1024);
  });

  test('lighthouse mobile performance > 85', async ({ page }) => {
    // correr lighthouse contra /token-stack
    const score = await runLighthouse('http://localhost:5173/token-stack');
    expect(score.performance).toBeGreaterThan(85);
  });

  test('anti-cheat: score manipulado en cliente no entra al ranking', async ({ page }) => {
    await page.goto('http://localhost:5173/token-stack?headless=1');
    // ... setup lead ...
    // Forzar client_score = 9999 vía evaluate
    await page.evaluate(() => window.__cheatScore = 9999);
    // Terminar partida rápida
    // ...
    const valid = await page.locator('[data-testid="score-valid"]').getAttribute('data-valid');
    expect(valid).toBe('false'); // anti-cheat lo marcó inválido
  });
});

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashCode(s) { let h = 0; for (const c of s) h = (h << 5) - h + c.charCodeAt(0) | 0; return h; }
```

### Por qué este test resiste el "agente que hace pasar el check sin resolver el problema"

- **El seed es fijo y el resultado es determinista**: si el agente "arregla" el código para hacer pasar el test sin resolver el problema real, el comportamiento será observable (scores absurdos, partidas muy cortas, errores en consola).
- **No mide solo "no crashea"**: mide que el score esté en rango razonable, que la partida dure entre 5-120s, que el anti-cheat marque inválido un score manipulado.
- **Mide bundle, lighthouse y anti-cheat en el mismo gate**: bypassear uno no permite pasar los demás.
- **Captura comportamiento humano realista**: el RNG simula a un jugador real con timing variable, no un bot perfecto que siempre acierta.

---

## 6. Qué pasa al pasar el gate

✅ Todos los checks críticos verdes + todos los no críticos verdes (o con override justificado):

- En PR: merge habilitado.
- En deploy: deploy procede.
- En smoke test pre-evento (T-604): se autoriza el go-live del juego.

---

## 7. Qué pasa al fallar el gate

❌ Cualquier check crítico rojo:

1. El gate publica un comment en el PR con el detalle del fallo (qué check, log, link a línea relevante).
2. Se bloquea el merge.
3. El autor del PR es notificado vía GitHub.
4. Para reintentar: corregir el código, hacer push al mismo branch, el gate corre de nuevo.

❌ Check no crítico rojo:

1. Comentario en el PR.
2. Para mergear, el revisor humano debe agregar etiqueta `override-soft-check` con razón en el comentario.
3. Issue tracking creado automáticamente para el fix.

---

## 8. Revisión humana en el quality gate

El quality gate automatizado **no reemplaza la revisión humana**. La revisión humana cubre cosas que ningún test puede automatizar:

- ¿La UX es razonable? ¿El juego se siente bien jugarlo?
- ¿El texto de consentimiento es claro y legalmente sólido?
- ¿El branding es apropiado o invasivo?
- ¿Hay edge cases obvios que el playtest no cubre (ej: cambio de orientación del celular)?
- ¿Los nombres en código son claros?

Cada PR a `main` requiere al menos **una aprobación humana explícita** además de los checks automatizados.

---

## 9. Condición de éxito para `/goal` autónomo

Si Claude Code corre en modo `/goal` (autónomo, multi-turno, sin supervisión), la condición de éxito redactada para el agente debe ser literal y verificable:

> **Condición de éxito**: "El comando `npm run test:playtest` debe ejecutarse exitosamente con `exit code 0`, completando las 50 partidas simuladas en menos de 5 minutos, con todos los `expect` aprobados. Adicionalmente, `npm run build` debe completar sin errores y el archivo principal del bundle (`dist/assets/index-*.js`) tras `gzip -k` debe pesar menos de 300 KB."

Sin esa formulación específica, el agente puede entregar código que técnicamente compila pero el juego no es jugable.

### Límite de costo recomendado
- Máximo 4 horas de corrida autónoma sin checkpoint humano.
- Límite de tokens / costo: equivalente a USD 50 por corrida.
- Si la condición no se cumple en ese tiempo, el agente detiene y reporta estado para intervención humana.

---

## 10. Smoke test pre-evento (T-604) — checklist humano

24 horas antes del evento, ejecutar esta checklist contra el ambiente de producción:

- [ ] Carga la URL pública del juego en 3 celulares distintos (1 iPhone, 1 Android gama media, 1 Android gama alta).
- [ ] Completar 1 partida en cada uno, verificar que el score se registra.
- [ ] Verificar que los 3 aparecen en el leaderboard público del día.
- [ ] Intentar registrar un 4to con el mismo RUT desde otro celular: debe reusar el lead, no duplicar.
- [ ] Intentar modificar el score vía DevTools antes de submit: debe marcarse `valid=false`.
- [ ] Probar 10 partidas seguidas desde el mismo celular: verificar que no hay degradación de performance.
- [ ] Verificar URL admin con clave correcta: muestra ranking completo.
- [ ] Verificar URL admin con clave incorrecta: bloquea acceso.
- [ ] Botón export CSV descarga archivo válido.
- [ ] Apagar wifi y verificar mensaje claro de "sin conexión, no se puede registrar score".
- [ ] Encender wifi de nuevo y verificar recuperación.
- [ ] Lighthouse mobile en 4G throttling: Performance ≥ 85.
- [ ] Test desde la red 4G del hotspot de respaldo: el juego carga y funciona.

Si cualquier ítem falla, el go-live se posterga o se documenta como riesgo conocido con plan de mitigación.
