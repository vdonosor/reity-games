# 03 — Tasks: Token Stack

> **Razón de ser de este documento**: descomponer la spec en unidades implementables y verificables, con trazabilidad explícita a criterios de aceptación. Sin esta trazabilidad, el quality gate no tiene contra qué validar.

**Versión**: 1.0 — 2026-06-19
**Spec base**: [`02-spec-sdd.md`](./02-spec-sdd.md)
**PRD base**: [`01-prd.md`](./01-prd.md)

---

## Convenciones de este documento

- Cada task tiene: ID, título, dependencias, criterio de aceptación trazable, definición de terminado.
- **AC-XX.Y** referencia un criterio del PRD.
- **SDD-§N** referencia una sección del SDD.
- Una task NO se marca completada si el playtest headless no corre y pasa después.
- El orden es por dependencias, no por estimación de esfuerzo.

---

## Fase 0 — Setup de infraestructura

### T-001 — Crear cuenta y proyecto Supabase
**Dependencias**: ninguna.
**Acción humana**: Vicente crea cuenta en Supabase, nuevo proyecto `reity-games`.
**Definición de terminado**:
- URL del proyecto + anon key + service role key obtenidos.
- Service role key guardada en gestor de secretos personal.
- Anon key documentada en `.env.example`.
**Trazabilidad**: prerequisito de todo lo demás.

### T-002 — Setup Supabase CLI local
**Dependencias**: T-001.
**Acción agente**: instalar Supabase CLI, `supabase init` en el repo, configurar `supabase/config.toml`.
**Definición de terminado**:
- `supabase start` levanta DB local.
- `supabase db reset` funciona.
- Carpeta `supabase/migrations/` existe.
**Trazabilidad**: SDD-§2.

### T-003 — Conexión Netlify ↔ GitHub
**Dependencias**: ninguna.
**Acción humana**: Vicente conecta Netlify al repo `reity-tech/reity-games`.
**Definición de terminado**:
- Auto-deploy desde `main` configurado.
- Variables de entorno declaradas en Netlify: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Build command: `npm run build`, publish dir: `dist`.
**Trazabilidad**: HU-01.

### T-004 — Agregar dependencias Three.js
**Dependencias**: ninguna.
**Acción agente**: `npm i three @react-three/fiber @react-three/drei`.
**Definición de terminado**:
- Versiones declaradas en `package.json`.
- `npm install` corre sin warnings de peer deps incompatibles.
- ADR-0002 ya existe justificando esta decisión.
**Trazabilidad**: SDD-§5 D-01.

### T-005 — Configurar Playwright para playtest
**Dependencias**: ninguna.
**Acción agente**: `npm i -D @playwright/test`, `npx playwright install chromium`, configuración `playwright.config.js`.
**Definición de terminado**:
- `npm run test:playtest` ejecuta Playwright contra un servidor de dev local.
- Test placeholder corre y pasa.
**Trazabilidad**: SDD-§7.

---

## Fase 1 — Modelo de datos y RLS

### T-101 — Migración inicial: tablas core
**Dependencias**: T-002.
**Acción agente**: crear `supabase/migrations/0001_initial_schema.sql` con tablas `leads`, `game_sessions`, `game_events`.
**Criterio de aceptación**:
- Tablas creadas según SDD-§2.
- Constraints aplicados (UNIQUE rut, CHECK consent=true, etc.).
- Índices: `(event_day, server_score DESC)` en game_sessions.
**Definición de terminado**:
- `supabase db reset` aplica la migración sin errores.
- `SELECT count(*) FROM leads` retorna 0.
**Trazabilidad**: SDD-§2.

### T-102 — Migración: vista materializada daily_leaderboard
**Dependencias**: T-101.
**Acción agente**: crear `supabase/migrations/0002_leaderboard_view.sql` con la vista materializada y un trigger de refresh.
**Criterio de aceptación**:
- Vista existe y consulta por `event_day` retorna scores en orden descendente.
- Trigger refresca la vista cuando `game_sessions.ended_at` se actualiza.
**Definición de terminado**:
- Test SQL: insertar 3 game_sessions con scores, verificar que la vista los ordena correctamente.
**Trazabilidad**: HU-04, SDD-§2.

### T-103 — RLS policies
**Dependencias**: T-101.
**Acción agente**: crear `supabase/migrations/0003_rls_policies.sql`.
**Criterio de aceptación**:
- `leads`: solo service_role puede SELECT/INSERT.
- `game_events`: solo service_role.
- `daily_leaderboard`: lectura pública (anon role).
- `game_sessions`: lectura pública limitada a columnas no sensibles.
**Definición de terminado**:
- Test SQL: usuario anon NO puede leer `leads`, SÍ puede leer `daily_leaderboard`.
**Trazabilidad**: SDD-§2 RLS.

---

## Fase 2 — Engine puro

### T-201 — Engine: estado inicial y reducer básico
**Dependencias**: T-004.
**Acción agente**: crear `src/games/token-stack/engine/stack.js` con `createInitialState(seed)`, `reduce(state, event)`.
**Criterio de aceptación**: AC-03.1, AC-03.2, AC-03.3.
**Definición de terminado**:
- Funciones puras, sin side-effects.
- Tests unitarios cubren: place_block con overlap completo, parcial y cero.
- Cobertura ≥ 80% del archivo.
**Trazabilidad**: HU-03, SDD-§4.

### T-202 — Engine: perfect alignment + scoring
**Dependencias**: T-201.
**Acción agente**: agregar lógica de "perfect" (overlap ≥ 95%) y scoring (+1 normal, +5 perfect).
**Criterio de aceptación**: AC-03.6, AC-03.8.
**Definición de terminado**:
- Tests cubren: perfect simple, perfectStreak, scoring acumulado.
**Trazabilidad**: HU-03.

### T-203 — Engine: curva de dificultad
**Dependencias**: T-202.
**Acción agente**: implementar `speed` como función del score, con cap.
**Criterio de aceptación**: AC-03.5.
**Definición de terminado**:
- Test: speed crece con score, no excede 0.025.
**Trazabilidad**: HU-03.

### T-204 — Engine: determinismo por seed
**Dependencias**: T-201.
**Acción agente**: introducir PRNG seedeable (ej: `mulberry32`); todo lo aleatorio del engine usa el PRNG.
**Criterio de aceptación**: dado un seed + secuencia de events idéntica, el state final es idéntico.
**Definición de terminado**:
- Test: dos ejecuciones con mismo seed y eventos producen el mismo state.
**Trazabilidad**: SDD-§4, prerequisito de anti-cheat server-side.

### T-205 — Validators: RUT y email
**Dependencias**: ninguna.
**Acción agente**: crear `src/games/token-stack/engine/validators.js` con `validateChileanRUT` y `validateEmail`.
**Criterio de aceptación**: AC-02.2, AC-02.3.
**Definición de terminado**:
- Tests con 10 RUTs válidos y 10 inválidos (incluyendo formato `12.345.678-9`, `12345678-K`, etc.).
- Tests con emails válidos e inválidos.
**Trazabilidad**: HU-02.

---

## Fase 3 — Edge Functions

### T-301 — Edge Function start_game
**Dependencias**: T-101, T-205, T-204.
**Acción agente**: crear `supabase/functions/start_game/index.ts`.
**Criterio de aceptación**: AC-02.1, AC-02.5, AC-02.6.
**Definición de terminado**:
- Función deployada en local (supabase functions serve).
- POST con lead válido retorna `{session_id, seed}`.
- POST con RUT inválido retorna 400.
- POST sin consent retorna 400.
- POST con RUT existente reutiliza el lead.
**Trazabilidad**: HU-02, SDD-§3.

### T-302 — Edge Function submit_event
**Dependencias**: T-301.
**Acción agente**: crear `supabase/functions/submit_event/index.ts`.
**Criterio de aceptación**: AC-06.1.
**Definición de terminado**:
- Acepta eventos con `seq` correlativo.
- Rechaza `seq` con gaps o duplicado.
- Rechaza eventos para sesiones cerradas.
**Trazabilidad**: HU-06.

### T-303 — Edge Function end_game con engine server-side
**Dependencias**: T-302, T-204.
**Acción agente**: crear `supabase/functions/end_game/index.ts`. Importar el engine puro de `engine/stack.js` (Deno soporta ES modules).
**Criterio de aceptación**: AC-06.2, AC-06.3, AC-06.4, AC-06.5.
**Definición de terminado**:
- Reconstruye state desde game_events.
- Compara server_score con client_score.
- Aplica validaciones de duración mínima y timing entre placements.
- Actualiza game_sessions con server_score y valid.
- Retorna rank_today y top5.
**Trazabilidad**: HU-04, HU-06, SDD-§3.

### T-304 — Edge Function export_leads (admin)
**Dependencias**: T-101.
**Acción agente**: crear `supabase/functions/export_leads/index.ts`.
**Criterio de aceptación**: AC-05.3, AC-05.4.
**Definición de terminado**:
- Requiere header Authorization válido (hash de password en env).
- Sin auth válida retorna 401.
- Con auth válida retorna CSV con leads del event_day.
**Trazabilidad**: HU-05.

### T-305 — Edge Function leaderboard (lectura pública)
**Dependencias**: T-102.
**Acción agente**: crear `supabase/functions/leaderboard/index.ts` o endpoint REST directo sobre la vista.
**Criterio de aceptación**: AC-04.5.
**Definición de terminado**:
- GET con `?day=YYYY-MM-DD` retorna top scores.
- Sin auth requerida (anon).
**Trazabilidad**: HU-04.

---

## Fase 4 — Frontend UI

### T-401 — Ruta /token-stack en React Router
**Dependencias**: T-004.
**Acción agente**: agregar ruta en `src/App.jsx` o router central.
**Criterio de aceptación**: navegar a `/token-stack` muestra el componente raíz del juego.
**Definición de terminado**:
- Build pasa, ESLint pasa.
**Trazabilidad**: HU-01.

### T-402 — Componente CaptureForm
**Dependencias**: T-205, T-301, T-401.
**Acción agente**: crear `src/games/token-stack/components/CaptureForm.jsx`.
**Criterio de aceptación**: AC-02.1, AC-02.4, AC-02.7.
**Definición de terminado**:
- Form con nombre, email, RUT, consent.
- Validación inline con feedback visual.
- Submit llama `start_game`, almacena `session_id` y `seed` en sessionStorage.
- Si ya hay session activa en sessionStorage, skip al juego.
**Trazabilidad**: HU-02.

### T-403 — Componente GameScene con Three.js
**Dependencias**: T-201, T-401.
**Acción agente**: crear `src/games/token-stack/three/GameScene.jsx` con React Three Fiber.
**Criterio de aceptación**: AC-03.1, AC-03.4, AC-03.9.
**Definición de terminado**:
- Renderiza una escena 3D con base + bloques apilados.
- Cámara isométrica fija con leve tilt.
- Iluminación básica.
- 60 FPS estable en Chrome desktop.
**Trazabilidad**: HU-03.

### T-404 — Wiring: engine ↔ vista 3D
**Dependencias**: T-403, T-203.
**Acción agente**: hook `useGameEngine` que mantiene el state del engine y dispatches events.
**Criterio de aceptación**: AC-03.2, AC-03.3, AC-03.7.
**Definición de terminado**:
- Tap en pantalla → dispatch `place_block`.
- requestAnimationFrame loop dispatches `tick`.
- GameScene re-renderiza con cada cambio de state.
- Animación de "corte" de overhang visible.
**Trazabilidad**: HU-03.

### T-405 — Submit de eventos al server
**Dependencias**: T-404, T-302.
**Acción agente**: cliente envía cada `place_block` a `submit_event` con seq correlativo.
**Criterio de aceptación**: AC-06.1.
**Definición de terminado**:
- Si submit falla, se reintenta hasta 3 veces.
- Si todos los reintentos fallan, la partida sigue jugable pero se marca como "score local" (no entrará al ranking).
**Trazabilidad**: HU-06.

### T-406 — Pantalla GameOver
**Dependencias**: T-404, T-303.
**Acción agente**: crear `src/games/token-stack/components/GameOver.jsx`.
**Criterio de aceptación**: AC-04.1, AC-04.2, AC-04.3, AC-04.4.
**Definición de terminado**:
- Al detectar `state.gameOver`, llama `end_game`.
- Muestra server_score, rank_today, top5.
- Si `valid=false`, muestra "Récord personal" pero no envía a ranking público.
- Botón "Volver a jugar" reinicia partida (mantiene lead).
**Trazabilidad**: HU-04.

### T-407 — Leaderboard en tiempo real
**Dependencias**: T-305, T-406.
**Acción agente**: subscripción a Supabase Realtime channel `scores:day-<YYYYMMDD>`.
**Criterio de aceptación**: AC-04.5.
**Definición de terminado**:
- En GameOver y en una vista de "Ranking del día", el top 5 se actualiza sin recargar página cuando otros jugadores terminan.
**Trazabilidad**: HU-04.

### T-408 — Pantalla admin
**Dependencias**: T-304.
**Acción agente**: ruta `/token-stack/admin` con prompt de password y vista de leaderboard completo + botón export.
**Criterio de aceptación**: AC-05.1, AC-05.2, AC-05.3, AC-05.4.
**Definición de terminado**:
- Prompt de password al cargar.
- Lista completa de scores del día.
- Botón "Exportar CSV" descarga archivo.
- RUT enmascarado en pantalla (visible solo en export).
**Trazabilidad**: HU-05.

### T-409 — Branding sutil Reity
**Dependencias**: T-403.
**Acción agente**: aplicar paleta verde Reity a tokens (variaciones), logo en esquina, fuentes coherentes con design tokens.
**Criterio de aceptación**: el branding es identificable pero no satura el juego (PRD §3).
**Definición de terminado**:
- Logo Reity visible en pantalla de inicio y game over.
- Tokens 3D usan paleta verde + acentos amarillos.
- Tipografía coherente con el resto del monorepo.
**Trazabilidad**: PRD §3.

---

## Fase 5 — Tests y quality gate

### T-501 — Tests unitarios engine
**Dependencias**: T-201, T-202, T-203, T-204, T-205.
**Acción agente**: cobertura completa de `engine/`.
**Definición de terminado**:
- `npm run test` corre y pasa.
- Coverage report ≥ 85% en `engine/`.
**Trazabilidad**: SDD-§7.

### T-502 — Playtest headless determinista (Playwright)
**Dependencias**: T-405, T-406, T-204.
**Acción agente**: crear `tests/playtest/token-stack.spec.js` según SDD-§7.
**Criterio de aceptación**: ver `04-quality-gate.md` sección "Verificador determinista".
**Definición de terminado**:
- `npm run test:playtest` corre 50 partidas simuladas.
- Todas terminan con score coherente.
- Sin errores en consola.
- Bundle < 300KB gzip verificado en el mismo script.
- Lighthouse mobile Performance > 85.
**Trazabilidad**: SDD-§7, quality gate.

### T-503 — CI: GitHub Actions
**Dependencias**: T-501, T-502.
**Acción agente**: crear `.github/workflows/ci.yml` que corre lint, test unit, playtest, build.
**Definición de terminado**:
- PR a `main` corre todos los checks.
- Falla bloquea merge.
**Trazabilidad**: definición de "terminado" del Constitution.

---

## Fase 6 — Despliegue y pre-evento

### T-601 — Deploy de Edge Functions a producción
**Dependencias**: T-301, T-302, T-303, T-304, T-305.
**Acción humana**: `supabase functions deploy` para cada una, con secrets configurados.
**Definición de terminado**:
- 5 funciones desplegadas en proyecto Supabase prod.
- ADMIN_PASSWORD_HASH configurado como secret.
- Test manual: POST a cada endpoint funciona contra prod.

### T-602 — Migración de DB a prod
**Dependencias**: T-101, T-102, T-103.
**Acción humana**: `supabase db push` contra el proyecto prod.
**Definición de terminado**:
- Migraciones aplicadas.
- Verificación: tablas existen, RLS activo, vista funciona.

### T-603 — Deploy frontend a Netlify
**Dependencias**: T-409.
**Acción**: merge a `main`, Netlify auto-deploy.
**Definición de terminado**:
- URL pública accesible.
- QR generado apuntando a la URL.
- Test desde 3 celulares distintos: el juego carga y se puede jugar end-to-end.

### T-604 — Smoke test pre-evento (24h antes)
**Dependencias**: T-601, T-602, T-603.
**Acción humana**: ejecutar todos los criterios de PRD §5.
**Definición de terminado**:
- ✅ 100 partidas en sucesión sin crash.
- ✅ Leaderboard actualiza en <3s.
- ✅ 20 leads sin colisión.
- ✅ Intento de cheating bloqueado.
- ✅ Carga en 4G <3s.
- ✅ Playtest headless pasa.

### T-605 — Plan de contingencia documentado
**Dependencias**: T-604.
**Acción humana**: documento de runbook con:
- Cómo reiniciar Supabase si falla.
- Cómo rotar credenciales si se filtran.
- Quién tiene acceso admin.
- Hotspot 4G de respaldo.
- Modo offline graceful si cae internet en el stand.
**Definición de terminado**: documento revisado y guardado en el equipo del stand.

---

## Tabla maestra de trazabilidad

| Task | Criterio de aceptación | Sección SDD | Verificación |
|---|---|---|---|
| T-001 a T-005 | — (setup) | §1, §2 | manual |
| T-101 a T-103 | HU-02, HU-04, RLS | §2 | tests SQL |
| T-201 a T-205 | AC-02.2, AC-02.3, AC-03.1–8 | §4 | tests unit |
| T-301 a T-305 | AC-02.1, AC-02.5–6, AC-04.x, AC-05.x, AC-06.x | §3 | tests E2E |
| T-401 a T-409 | AC-01.x, AC-02.x, AC-03.x, AC-04.x, AC-05.x | §1 | manual + playtest |
| T-501 a T-503 | quality gate | §7 | automatizado |
| T-601 a T-605 | PRD §5 | despliegue | manual |
