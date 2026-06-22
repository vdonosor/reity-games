# ADR 0003 — Supabase como backend compartido del monorepo

**Estado**: Aceptado
**Fecha**: 2026-06-19
**Decisor**: Vicente Donoso + agente
**Aplica a**: todos los juegos del monorepo `reity-tech/reity-games` que requieran persistencia o backend.

---

## Contexto

Token Stack requiere:
- Captura de leads (datos personales con RUT).
- Leaderboard realtime.
- Anti-cheat server-side (validación de score).
- Endpoint admin para exportar leads.

Estas necesidades aparecerán también en juegos futuros. Tomar una decisión por-juego genera fragmentación. Conviene elegir un backend único para el monorepo.

Fuerzas en juego:

- **Tiempo de implementación**: el evento es en pocas semanas; no hay budget para construir backend custom desde cero.
- **Costo**: el evento es de un día. El backend va a estar mayormente idle. No queremos pagar por nada que no se use.
- **Vicente ya tiene experiencia con Supabase** en otro proyecto en migración (Polla Norte Verde 2026). Reusar conocimiento es valor.
- **Anti-cheat requiere lógica server-side**: el cliente no puede ser autoridad sobre scoring.
- **Realtime importa**: el leaderboard debe actualizar visiblemente sin que el usuario recargue.

---

## Decisión

Se adopta **Supabase** como backend compartido para todo el monorepo, con:

- **PostgreSQL** para persistencia.
- **Row Level Security (RLS)** para control de acceso fino.
- **Edge Functions (Deno)** para lógica server-side custom (anti-cheat, validaciones complejas, exports).
- **Realtime channels** para leaderboard live.
- **Migrations versionadas** en `supabase/migrations/`.

Un solo proyecto Supabase para todos los juegos del monorepo, con prefijo de tabla por juego cuando aplique (`tokenstack_leads`, etc.) o schemas separados si crece.

---

## Alternativas y por qué se descartaron

### Firebase

**Por qué se consideró**: ofrece DB + auth + functions + hosting; vendor maduro de Google.

**Por qué se descartó**:
- DB Firestore es NoSQL; reportes y queries complejas son tediosas. Para leaderboards y exports CSV, SQL es natural.
- Vendor lock más severo (queries específicas, security rules custom).
- Cloud Functions facturan por invocación con sorpresas.
- Vicente no tiene experiencia previa con Firebase.

### Backend custom en Node.js / Hono / Express + DB en algún lado

**Por qué se consideró**: control total, sin vendor lock.

**Por qué se descartó**:
- Necesidad de hostear el backend (Fly.io, Railway, etc.), DB separada, manejar auth, deploys, monitoreo.
- Para un evento de un día, esto es sobre-engineering.
- Tiempo de implementación significativamente mayor.

### AWS Amplify

**Por qué se consideró**: stack robusto AWS.

**Por qué se descartó**:
- Curva de aprendizaje AWS pesada para un evento puntual.
- Costos impredecibles si algo se dispara.
- Vicente no tiene cuenta AWS configurada.

### Pocketbase

**Por qué se consideró**: BaaS open-source self-hosteable, SQLite, single binary.

**Por qué se descartó**:
- Requiere self-hosting (Fly.io, Hetzner) → operaciones adicionales.
- Sin realtime maduro al nivel de Supabase.
- Ecosistema más pequeño; menos garantías para el día del evento.

### Convex

**Por qué se consideró**: backend reactivo moderno, type-safe end-to-end.

**Por qué se descartó**:
- Vendor lock fuerte: la base de datos es propietaria.
- Vicente no tiene experiencia.
- Menos maduro para use cases tradicionales SQL.
- Costo opaco fuera del free tier.

### Backendless: solo localStorage + servicio externo de email/CSV para captura

**Por qué se consideró**: cero backend, máxima simplicidad.

**Por qué se descartó**:
- Sin anti-cheat real (todo en cliente).
- Sin leaderboard compartido entre dispositivos.
- No cumple los requisitos del PRD.

### Postgres directo (Neon, Supabase DB sin Edge Functions)

**Por qué se consideró**: misma DB, menos features.

**Por qué se descartó**:
- Sin Edge Functions, la lógica anti-cheat tendría que vivir en el cliente o en un backend separado.
- Edge Functions de Supabase resuelven exactamente el caso de "código server-side ligero junto a la DB".

---

## Consecuencias

### Lo que se gana

- Stack único para todos los juegos del monorepo.
- Migrations versionadas en git → reproducibilidad.
- RLS resuelve control de acceso sin escribir middleware custom.
- Edge Functions corren en Deno, permiten reusar JS puro del engine (anti-cheat).
- Realtime out-of-the-box (websockets gestionados).
- Auth disponible si en algún juego futuro se necesita.
- Free tier soporta el use case (200 partidas/día está muy lejos de los límites).

### Lo que se pierde / cuesta

- Vendor lock con Supabase (DB se podría migrar a Postgres puro; Edge Functions y RLS no).
- Curva de aprendizaje de RLS para Vicente; en este proyecto se mitiga porque el agente lo asiste.
- Latencia añadida vs cliente puro (no relevante para este use case).
- Free tier tiene cold starts en Edge Functions (~500ms primer hit) — aceptable para un evento de un día.

### Implicaciones derivadas

- Migrations en `supabase/migrations/` se versionan con el código del juego que las introduce.
- Cuando un juego se descontinúa, sus tablas se archivan (no se borran inmediatamente; podrían contener data útil).
- API key anónima de Supabase se commitea al repo (es pública por diseño con RLS). Service role key NUNCA se commitea.
- Edge Functions son por-juego: `supabase/functions/tokenstack-start-game/`, `supabase/functions/tokenstack-end-game/`, etc.

---

## Reversibilidad

**Costosa pero parcial.**

- **Datos**: PostgreSQL es estándar; un dump pg_dump puede migrarse a cualquier Postgres (Neon, RDS, self-hosted).
- **Edge Functions**: hay que reescribir si se migra a otra plataforma serverless (Vercel Functions, Cloudflare Workers).
- **RLS**: lógica de policies tiene que migrarse a middleware del backend nuevo.
- **Realtime**: replicar la funcionalidad de Supabase Realtime requiere implementar pub/sub propio o usar Pusher/Ably.

Costo estimado de migración: 1-2 semanas si Reity decide moverse de Supabase. Razonable como riesgo aceptado.

La decisión se revisa si:
- Supabase cambia su pricing de forma material.
- Los límites del free tier se vuelven restrictivos para el uso real.
- Se requieren features que Supabase no ofrece (queues robustas, jobs largos, etc.).
