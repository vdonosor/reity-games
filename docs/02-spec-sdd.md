# 02 — Spec / SDD: Token Stack

> **Razón de ser de este documento**: definir el "cómo" técnico y dejar registradas las decisiones y trade-offs para que no se reabran cada sesión del agente. Si una task requiere revisitar arquitectura, primero se actualiza esta spec.

**Objetivo técnico**: implementar el juego Token Stack como una ruta nueva (`/token-stack`) dentro del monorepo `reity-tech/reity-games`, cumpliendo todos los requisitos del PRD 01.

**Link al PRD**: [`01-prd.md`](./01-prd.md)

**Versión**: 1.0 — 2026-06-19

---

## 1. Arquitectura

### Diagrama de alto nivel

```
┌──────────────────────────────────────────────────────────┐
│                   Navegador móvil (cliente)              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  React 19 + Vite 7 + Tailwind 4 (bundle estático)  │  │
│  │                                                    │  │
│  │  Ruta /token-stack                                 │  │
│  │  ├─ <CaptureForm/>     captura lead pre-partida    │  │
│  │  ├─ <GameScene/>       Three.js / R3F render 3D    │  │
│  │  ├─ <GameOver/>        score + leaderboard         │  │
│  │  └─ <Leaderboard/>     realtime Supabase           │  │
│  │                                                    │  │
│  │  engine/ (lógica pura JS, sin React, testeable)    │  │
│  │  └─ Stack engine: estado de la partida             │  │
│  │                                                    │  │
│  │  api/                                              │  │
│  │  └─ supabaseClient: queries y realtime             │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTPS + Realtime WebSocket
                   ▼
┌──────────────────────────────────────────────────────────┐
│                       Supabase                            │
│                                                          │
│  PostgreSQL                                              │
│  ├─ leads                                                │
│  ├─ game_sessions                                        │
│  ├─ game_events                                          │
│  └─ scores  (vista materializada)                        │
│                                                          │
│  Edge Functions (Deno)                                   │
│  ├─ start_game()                                         │
│  ├─ submit_event()                                       │
│  ├─ end_game()         ← valida score server-side        │
│  └─ export_leads()     ← admin                           │
│                                                          │
│  Realtime channel                                        │
│  └─ scores:day-<YYYYMMDD>                                │
│                                                          │
│  Row Level Security                                      │
│  └─ leaderboard lectura pública; resto privilegiado       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                       Netlify                            │
│                                                          │
│  Hosting estático + CDN                                  │
│  Auto-deploy desde GitHub main                           │
│  Env vars: SB_URL, SB_ANON_KEY, ADMIN_PASSWORD_HASH      │
└──────────────────────────────────────────────────────────┘
```

### Capas

- **Engine puro**: lógica de juego sin React ni Three.js. Toma `state` + `event`, devuelve `nextState`. 100% testeable.
- **Vista 3D**: Three.js + React Three Fiber. Renderiza el `state` que entrega el engine.
- **API client**: wrappers de Supabase. Toda llamada al server pasa por acá.
- **UI React**: forms, pantallas, leaderboard. Conecta vista 3D con captura de inputs y submit a Supabase.

### Por qué esta separación
Permite que el playtest headless corra el engine puro sin necesidad de levantar render 3D. La verificación determinista de scoring se hace sobre el engine, no sobre el DOM.

---

## 2. Modelo de datos

### Tabla `leads`
Captura única de información del jugador. RUT como llave natural única (un humano, un lead).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `rut` | text UNIQUE NOT NULL | normalizado sin puntos, con guion (`12345678-9`) |
| `nombre` | text NOT NULL | trim + collapse spaces |
| `email` | text NOT NULL | lowercase |
| `consent` | boolean NOT NULL DEFAULT false | debe ser true para insertar (CHECK) |
| `event_day` | date NOT NULL DEFAULT current_date | para filtrar por evento |
| `created_at` | timestamptz DEFAULT now() | |
| `client_fingerprint` | text | hash de navigator info, no PII |

### Tabla `game_sessions`
Una partida. Creada al iniciar, cerrada al terminar.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | gen_random_uuid() |
| `lead_id` | uuid FK leads(id) | |
| `started_at` | timestamptz NOT NULL DEFAULT now() | |
| `ended_at` | timestamptz | null hasta game over |
| `client_score` | int | enviado por el cliente |
| `server_score` | int | calculado server-side a partir de events |
| `valid` | boolean | true si client_score y server_score difieren < 5% |
| `event_day` | date NOT NULL DEFAULT current_date | partition key lógico |
| `seed` | text NOT NULL | seed determinista para reproducir partida |

### Tabla `game_events`
Cada interacción del jugador. Append-only, fuente para reconstruir la partida.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK GENERATED | |
| `session_id` | uuid FK game_sessions(id) | |
| `seq` | int NOT NULL | secuencia 1, 2, 3... por sesión |
| `event_type` | text NOT NULL | enum: 'start', 'place_block', 'end' |
| `payload` | jsonb NOT NULL | datos del evento |
| `client_ts` | bigint NOT NULL | timestamp ms desde inicio de la partida |
| `created_at` | timestamptz DEFAULT now() | timestamp server |
| UNIQUE | (session_id, seq) | |

### Vista materializada `daily_leaderboard`
Top scores válidos del día.

```sql
CREATE MATERIALIZED VIEW daily_leaderboard AS
SELECT
  s.id AS session_id,
  s.event_day,
  l.nombre,
  s.server_score AS score,
  s.ended_at,
  ROW_NUMBER() OVER (PARTITION BY s.event_day ORDER BY s.server_score DESC, s.ended_at ASC) AS rank
FROM game_sessions s
JOIN leads l ON l.id = s.lead_id
WHERE s.valid = true AND s.ended_at IS NOT NULL;
```

Refresh cada 5 segundos vía trigger en game_sessions UPDATE (suficiente para la latencia esperada).

### Row Level Security

- `leads`: solo Edge Functions con service role pueden insertar/leer (no exponer emails a clientes).
- `game_sessions`: insertable solo por Edge Function `start_game`. Updatable solo por `end_game`. Lectura pública limitada a `id` y `server_score` cuando `valid=true`.
- `game_events`: insertable solo por Edge Function `submit_event`. No lectura pública.
- `daily_leaderboard`: lectura pública. Sin RUT ni email expuestos. Solo nombre + score + rank.

---

## 3. Contratos de API

Todas las llamadas pasan por Edge Functions de Supabase para garantizar validación server-side.

### `POST /functions/v1/start_game`

**Request body**:
```json
{
  "lead": {
    "rut": "12345678-9",
    "nombre": "Juan Pérez",
    "email": "juan@uchile.cl",
    "consent": true
  },
  "client_fingerprint": "abc123..."
}
```

**Lógica**:
1. Valida RUT chileno (módulo 11) y email (formato).
2. Si `lead.rut` existe en `leads`, reutiliza el lead_id; si no, crea uno nuevo.
3. Genera `session_id` (uuid) y `seed` (string aleatorio para reproducibilidad).
4. Inserta `game_sessions` con `lead_id`, `seed`.
5. Inserta evento `start` en `game_events`.

**Response 200**:
```json
{
  "session_id": "uuid",
  "seed": "abc123def456"
}
```

**Errores**:
- `400 invalid_rut`
- `400 invalid_email`
- `400 consent_required`
- `429 rate_limited` (más de 10 sessions/min desde misma IP)

### `POST /functions/v1/submit_event`

**Request body**:
```json
{
  "session_id": "uuid",
  "seq": 1,
  "event_type": "place_block",
  "payload": {
    "position_x": 0.42,
    "perfect": false,
    "client_ts": 1342
  }
}
```

**Lógica**:
1. Valida que `session_id` existe y `ended_at` es null.
2. Valida que `seq` es el siguiente esperado (sin gaps).
3. Inserta en `game_events`.
4. No retorna score; solo `{ok:true}`. El cliente NO sabe su server_score hasta `end_game`.

**Response 200**: `{ "ok": true }`

**Errores**:
- `400 session_not_found`
- `400 session_closed`
- `400 sequence_mismatch`
- `400 invalid_payload`

### `POST /functions/v1/end_game`

**Request body**:
```json
{
  "session_id": "uuid",
  "client_score": 27,
  "client_ts": 45120
}
```

**Lógica**:
1. Marca `ended_at` en la sesión.
2. Inserta evento `end`.
3. **Recalcula server_score** desde `game_events` aplicando engine puro server-side (Deno).
4. Compara `server_score` vs `client_score`:
   - Si difieren ≤ 5%, marca `valid=true`.
   - Si no, `valid=false`.
5. Aplica validaciones adicionales:
   - Duración de partida ≥ 5 segundos.
   - Tiempo entre placements consecutivos ≥ 200 ms.
   - Número de placements coherente con score (sin saltos imposibles).
6. Refresca `daily_leaderboard`.

**Response 200**:
```json
{
  "server_score": 27,
  "valid": true,
  "rank_today": 4,
  "top5": [
    { "nombre": "Sofía", "score": 38 },
    { "nombre": "Diego",  "score": 35 },
    ...
  ]
}
```

### `GET /functions/v1/leaderboard?day=YYYY-MM-DD&limit=20`

Lectura pública del top del día. Sin auth.

**Response 200**:
```json
{
  "day": "2026-08-15",
  "scores": [
    { "rank": 1, "nombre": "Sofía", "score": 38, "ended_at": "..." },
    ...
  ]
}
```

### `POST /functions/v1/export_leads`

**Auth**: header `Authorization: Bearer <ADMIN_PASSWORD_HASH>`.

**Response 200**: CSV con todos los leads del día.

### Realtime channel

```
channel: scores:day-2026-08-15
event: new_score
payload: { rank: 3, nombre: "Diego", score: 35 }
```

Cliente se suscribe en pantallas que muestran leaderboard.

---

## 4. Engine del juego (lógica pura)

Independiente de React y Three.js. Testeable headless.

### Estado

```js
{
  seed: "abc123",
  blocks: [
    { x: 0, z: 0, width: 1.0, depth: 1.0, y: 0 },  // base
    { x: 0.02, z: 0, width: 0.96, depth: 1.0, y: 0.1 },
    ...
  ],
  currentBlock: {
    x: -0.5,  // posición inicial fuera del bloque
    z: 0,
    width: 0.96,
    depth: 1.0,
    y: 0.2,
    axis: "x",
    direction: 1,
    speed: 0.012
  },
  score: 3,
  perfectStreak: 0,
  gameOver: false,
  startedAt: 1342,
  events: []
}
```

### Reglas

1. El bloque actual oscila en su eje (`axis`) entre `-1.5 * width` y `+1.5 * width` del bloque anterior.
2. Tap → `place_block`:
   - Calcula overlap con bloque anterior.
   - Si overlap = 0 → `gameOver = true`.
   - Si overlap > 0:
     - El nuevo bloque tiene `width` (o `depth`) = overlap.
     - Se descarta la parte no superpuesta (cae en la animación).
     - Si overlap ≥ 95% del bloque anterior → "perfect": `width` restaurado a su anterior, `score += 5`, `perfectStreak++`.
     - Si no: `score += 1`, `perfectStreak = 0`.
3. Siguiente bloque:
   - `axis` alterna (x → z → x → z).
   - `speed` = `0.012 + score * 0.0003` (cap en 0.025).
   - `y` = anterior + altura constante.

### Pseudo-código

```js
export function reduce(state, event) {
  switch (event.type) {
    case 'tick':
      return tick(state, event.dt);
    case 'place_block':
      return placeBlock(state);
    case 'end':
      return { ...state, gameOver: true };
    default:
      return state;
  }
}
```

El **server replica esta misma función** en una Edge Function Deno para validar.

---

## 5. Decisiones y trade-offs

### D-01: Three.js vs Canvas 2D para el render
**Decisión**: Three.js con React Three Fiber.
**Trade-off**: Bundle más grande (~150KB gzip extra) a cambio de visual 3D impactante que diferencia el juego en el stand.
**ADR**: `05-adr/0002-three-js-para-3d.md`

### D-02: Engine puro separado de la vista
**Decisión**: lógica de juego en `engine/`, sin dependencias de React ni Three.
**Trade-off**: leve overhead de mantener doble layer; a cambio se obtiene 100% testabilidad headless y la posibilidad de correr el mismo engine server-side para anti-cheat.

### D-03: Anti-cheat server-side reconstruyendo la partida
**Decisión**: cada `place_block` se envía al server; al `end_game` el server reejecuta el engine completo.
**Alternativas descartadas**:
- Validar solo timing y duración: insuficiente, un cliente puede modificar el score.
- ZK proofs o crypto: sobre-engineering para un evento de un día.
**Trade-off**: latencia y carga adicional en Supabase; a cambio, score verificable.

### D-04: Captura de lead como pre-requisito
**Decisión**: formulario obligatorio antes de la primera partida.
**Alternativas descartadas**:
- Captura opcional post-partida: convierte mucho menos (los jugadores ya ganaron, no rellenan form).
- Auth via Google: fricción mayor, los estudiantes no quieren dar acceso a su cuenta para un juego.
**Trade-off**: 1-2 segundos de fricción extra al inicio; aceptable dado el objetivo de captura.

### D-05: Three.js OrbitControls deshabilitado
**Decisión**: cámara fija isométrica con leve tilt, NO interactiva.
**Razón**: el juego es de un tap; cualquier control de cámara distrae y complica.

### D-06: Sin tutorial explícito
**Decisión**: el primer bloque oscilando + indicación visual "TAP" en la primera partida es suficiente.
**Razón**: Tower Stack es un género conocido; la mecánica se descubre en 3 segundos.

### D-07: Persistencia de eventos completos vs solo score final
**Decisión**: persistir cada `place_block` en `game_events`.
**Trade-off**: ~30-100 rows por partida × 200 partidas = ~10-20k rows en el día; Supabase free tier lo soporta sin problema. A cambio, podemos auditar disputas y entrenar modelos anti-cheat futuros si se reusa el juego.

### D-08: Sin localStorage para leads (solo session)
**Decisión**: el lead se guarda en `sessionStorage` (se borra al cerrar el navegador), no `localStorage`.
**Razón**: en un stand, varios estudiantes usarían el mismo navegador en distintos celulares; persistir lead entre sesiones generaría confusión.

---

## 6. Glosario de dominio

| Término | Definición |
|---|---|
| **Token** | Bloque que el jugador apila. En la narrativa Reity: una propiedad inmobiliaria tokenizada. |
| **Stack** | La columna de tokens apilados. |
| **Place** | Acción de fijar el token en su posición actual (tap). |
| **Overhang** | Porción del token que queda fuera del anterior y se "cae". |
| **Perfect** | Placement con < 5% de desalineación. Bonus de score + width restaurado. |
| **Streak** | Racha de perfects consecutivos. |
| **Lead** | Estudiante que completó el formulario de captura. |
| **Session** | Partida individual. |
| **Event** | Cada interacción del jugador dentro de una session. |
| **Daily leaderboard** | Top scores del día actual (event_day). |
| **Stand day** | Día del evento universitario. event_day se usa para filtrar. |

---

## 7. Plan de pruebas

### Tests unitarios (Vitest)
- `engine/stack.test.js`:
  - `reduce(state, place_block)` con overlap 100% → state.score++.
  - Con overlap 95%+ → perfect, score += 5, width restaurado.
  - Con overlap 0% → gameOver = true.
  - Con overlap parcial → width reducido, score++.
- `engine/validators.test.js`:
  - validateChileanRUT: casos válidos e inválidos.
  - validateEmail: casos válidos e inválidos.

### Tests de integración (Vitest)
- `api/supabaseClient.test.js`:
  - mock de Supabase, start_game → submit_event(s) → end_game devuelve score esperado.

### Playtest headless determinista (Playwright)
**Crítico**: este es el verificador del quality gate.

Script `tests/playtest/token-stack.spec.js`:
1. Levanta el juego en navegador headless.
2. Inyecta un seed determinista.
3. Simula 50 partidas con un "jugador artificial" que coloca bloques con timing variable (entre 300ms y 2000ms entre placements).
4. Verifica para cada partida:
   - La partida termina (game over alcanzado).
   - El score reportado al server coincide con el score esperado dado el seed + secuencia de tap timestamps.
   - Duración total entre 5 y 120 segundos.
   - No hay errores en consola.
5. Verifica al final:
   - El bundle no excede 300KB gzip.
   - Lighthouse mobile score > 85 en Performance.

Si cualquiera de los puntos falla, el playtest reporta fallo y bloquea el quality gate.

### Tests E2E manuales pre-evento
Documentados en `04-quality-gate.md`.

---

## 8. Performance budget

| Métrica | Budget | Cómo se mide |
|---|---|---|
| Bundle inicial (gzip) | < 300 KB | `vite build` + `gzip -k` |
| Time to Interactive 4G | < 3 s | Lighthouse throttling Slow 4G |
| FPS sostenido | ≥ 60 en gama media Android | Telemetría client-side percentil 50 |
| Carga 3D scene | < 1 s | medición ad-hoc |
| Latencia submit_event → 200 | < 300 ms p95 | Supabase Edge Function metrics |

Cualquier PR que rompa estos budgets debe justificarlo en el PR description y actualizar este budget si corresponde.

---

## 9. Trazabilidad PRD ↔ Spec

| Requisito PRD | Componente / sección de spec |
|---|---|
| HU-01 acceso vía QR | Hosting Netlify + carga estática, sección 1 (Arquitectura) |
| HU-02 captura de lead | Tabla `leads`, Edge Function `start_game`, componente `<CaptureForm/>` |
| HU-03 juego Token Stack | Engine sección 4, vista 3D sección 1 |
| HU-04 game over y leaderboard | Edge Function `end_game`, vista materializada, Realtime channel |
| HU-05 admin | Edge Function `export_leads`, ruta `/token-stack/admin` |
| HU-06 anti-cheat | Decisión D-03, Edge Function `end_game` recalcula |
