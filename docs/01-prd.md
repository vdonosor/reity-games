# 01 — PRD: Token Stack

> **Razón de ser de este documento**: justificar que el producto resuelve el problema correcto. Sin contexto y métrica de éxito clara, el agente puede entregar algo técnicamente impecable que no le sirve a nadie.

**Producto**: Token Stack
**Sponsor**: Reity SpA
**Plataforma**: web móvil (acceso vía QR)
**Versión del PRD**: 1.0 — 2026-06-19
**Decision owner**: Vicente Donoso (COO Reity)

---

## 1. Contexto y problema

Reity SpA, fintech chilena de tokenización inmobiliaria regulada bajo Ley 21.521, tendrá un stand en una feria universitaria (audiencia: estudiantes de pregrado, mayoritariamente facultades de Ingeniería Comercial, Derecho e Ingeniería Civil; rango etario 18-25).

**El problema concreto que resuelve el juego no es "entretener"; es:**

1. **Atraer foot traffic al stand.** Los stands universitarios compiten por la atención. Un juego corto, visualmente atractivo y con leaderboard público genera tracción y atrae cluster de gente que a su vez atrae más gente.
2. **Capturar leads cualificados.** Reity necesita una base de prospects estudiantes (futuros profesionales con ingresos disponibles en 3-5 años). Pedir nombre + email + RUT para participar en el ranking convierte el juego en un mecanismo de captura.
3. **Educar sobre tokenización inmobiliaria de forma implícita.** Los "tokens" del juego son propiedades inmobiliarias tokenizadas. Apilarlas refuerza la mecánica de fraccionamiento.
4. **Diferenciar a Reity de los otros stands**, que típicamente entregan folletos y stickers. Un juego con premio relevante posiciona a Reity como una marca tech y juvenil.

Sin un mecanismo activo de atracción, la conversión de foot traffic en leads es típicamente <2% en stands universitarios.

---

## 2. Objetivo y métrica de éxito

### Objetivo
Convertir al menos un **20% del foot traffic frente al stand en leads cualificados** (registro completo con nombre + email + RUT verificado por formato + acceptación de comunicaciones), medido durante el día del evento.

### Métricas
| Métrica | Meta | Cómo se mide |
|---|---|---|
| **Partidas jugadas** | ≥ 200 en el día | Conteo en Supabase de `game_sessions` |
| **Leads cualificados** | ≥ 80 (40% de partidas jugadas) | Registros únicos en tabla `leads` con email válido + RUT con formato chileno válido |
| **Tasa de finalización** | ≥ 70% | (Partidas terminadas / Partidas iniciadas) |
| **Tiempo medio de partida** | 30-90 segundos | Diferencia entre `started_at` y `ended_at` |
| **Performance** | ≥ 60 FPS en gama media Android | Telemetría client-side con percentil 50 |
| **Tasa de error técnico** | < 2% de partidas | Conteo de partidas con error vs total |

### Cómo NO se va a medir
- No se mide engagement post-feria (es un evento puntual de un día).
- No se mide conversión a cliente Reity (eso es responsabilidad del proceso comercial posterior).

---

## 3. Alcance

### Dentro del alcance (MVP del día del evento)

**Funcional**:
- Juego Token Stack jugable en móvil con un solo tap.
- Pantalla de inicio con CTA "Jugar" y branding Reity sutil.
- Formulario de captura de lead pre-partida: nombre, email, RUT, checkbox de consentimiento.
- Validación de formato de email y RUT chileno.
- Persistencia de leads en Supabase.
- Leaderboard público del día (top 20) actualizado en tiempo real.
- Anti-cheat server-side (puntaje validado, no aceptado del cliente sin verificar).
- Pantalla de game over con puntaje, posición en leaderboard y CTA para volver a jugar.
- Banner con info de premio al top del día.
- Pantalla de admin separada para ver el ranking completo y exportar leads.

**No-funcional**:
- Mobile-first, optimizado para 360px–430px de ancho.
- Carga en < 3 segundos en 4G.
- Funciona offline después de carga inicial (excepto submit de score).
- Branding Reity sutil: paleta verde + logo en esquina, "tokens" tematizados como propiedades.

### Fuera del alcance (explícito)

- Multiplayer en tiempo real.
- Autenticación con email/contraseña o redes sociales (solo formulario de captura).
- Modos de dificultad (solo un modo).
- Power-ups, items, mecánicas avanzadas.
- Sonido de gran calidad (audio simple es suficiente).
- Tutorial extenso (el juego debe ser intuitivo en < 5 segundos).
- Soporte de cuentas o progresión entre partidas.
- App nativa iOS/Android (solo web).
- Compartir en redes sociales (post-MVP si hay tiempo).
- Animaciones cinematográficas (transiciones simples bastan).
- Localización a otros idiomas (solo español de Chile).

---

## 4. Requisitos funcionales (historias de usuario)

### HU-01 — Acceso vía QR
**Como** estudiante universitario que pasa frente al stand
**Quiero** escanear un QR con mi celular y empezar a jugar en segundos
**Para** no tener que descargar nada ni autenticarme

**Criterios de aceptación**:
- AC-01.1: Escanear el QR abre directamente la pantalla de inicio del juego en el navegador móvil.
- AC-01.2: La pantalla de inicio carga en < 3 segundos en 4G estándar.
- AC-01.3: No se requiere instalar ninguna app.
- AC-01.4: Funciona en iOS Safari ≥ 15 y Chrome Android ≥ 100.

### HU-02 — Captura de lead pre-partida
**Como** Reity SpA
**Quiero** que el estudiante registre su nombre, email y RUT antes de poder competir por el ranking
**Para** capturar leads cualificados

**Criterios de aceptación**:
- AC-02.1: Antes de la primera partida del navegador, se muestra un formulario obligatorio con: nombre completo, email, RUT, checkbox de consentimiento.
- AC-02.2: El email debe tener formato válido (`a@b.c`); si no, no se puede continuar.
- AC-02.3: El RUT debe pasar validación de formato chileno con dígito verificador correcto; si no, no se puede continuar.
- AC-02.4: El checkbox de consentimiento es obligatorio. Texto debe declarar uso para "contacto comercial de Reity".
- AC-02.5: Los datos se guardan en Supabase tabla `leads` con timestamp.
- AC-02.6: Si el RUT ya existe en `leads`, se reutiliza el lead (no se duplica registro).
- AC-02.7: En partidas siguientes del mismo navegador (mismo `localStorage`), no se vuelve a pedir el formulario.

### HU-03 — Juego Token Stack
**Como** jugador
**Quiero** apilar tokens (propiedades) uno sobre otro con un tap, intentando alinearlos
**Para** acumular puntos y subir en el ranking

**Criterios de aceptación**:
- AC-03.1: Al iniciar la partida, hay una base estática y un primer token oscilando horizontalmente sobre ella.
- AC-03.2: Un tap en cualquier parte de la pantalla "fija" el token en su posición actual.
- AC-03.3: La parte del token que queda fuera del bloque anterior se "corta" (cae visualmente).
- AC-03.4: El siguiente token aparece a una altura mayor, perpendicular al anterior, oscilando.
- AC-03.5: La velocidad de oscilación aumenta gradualmente (curva de dificultad).
- AC-03.6: Si la alineación es perfecta (tolerancia ≤ 5% del ancho), se otorga bonus y el ancho del token se restaura.
- AC-03.7: Si el token cae completamente fuera del bloque anterior, la partida termina.
- AC-03.8: El puntaje sube en 1 por cada bloque colocado, +5 bonus por alineación perfecta.
- AC-03.9: El score es visible durante toda la partida en la parte superior.

### HU-04 — Game over y leaderboard
**Como** jugador
**Quiero** ver mi puntaje final y mi posición vs el resto
**Para** saber si gané, motivarme a reintentar o ver al top del día

**Criterios de aceptación**:
- AC-04.1: Al terminar la partida (token caído), se muestra pantalla de game over con: puntaje final, posición en ranking del día, top 5 del día.
- AC-04.2: El puntaje se envía al server y se valida antes de incluirlo en el ranking.
- AC-04.3: Si el puntaje no pasa la validación anti-cheat, no se incluye en el ranking (pero la pantalla muestra el puntaje del cliente como "Récord personal").
- AC-04.4: Hay un botón "Volver a jugar" prominente.
- AC-04.5: El leaderboard del top 5 se actualiza en tiempo real (Supabase Realtime).

### HU-05 — Vista de admin
**Como** equipo Reity en el stand
**Quiero** una pantalla con el ranking completo y un botón para exportar leads
**Para** premiar al ganador al final del día y exportar la base para CRM

**Criterios de aceptación**:
- AC-05.1: Existe una URL admin (ej: `/token-stack/admin`) accesible con clave configurable vía env.
- AC-05.2: La pantalla muestra el ranking completo con nombre, puntaje, hora, RUT enmascarado.
- AC-05.3: Hay un botón "Exportar CSV" que descarga todos los leads del día.
- AC-05.4: La URL no es accesible sin la clave correcta.

### HU-06 — Anti-cheat y validación server-side
**Como** Reity SpA con un premio relevante en juego
**Quiero** que el puntaje sea verificable y no manipulable desde devtools
**Para** evitar disputas y trampas

**Criterios de aceptación**:
- AC-06.1: Cada vez que el jugador coloca un bloque, el cliente envía evento `place_block` al server con timestamp + posición.
- AC-06.2: El server reconstruye el estado de la partida y calcula el score canónico.
- AC-06.3: Al terminar la partida, el cliente envía evento `end_game`; el server compara su score canónico con el del cliente.
- AC-06.4: Si difieren en más de 5%, el score se marca como inválido y no entra al ranking público.
- AC-06.5: La validación incluye: tiempo entre placements coherente (> 200ms), número de placements coherente con score, partida de duración mínima 5 segundos.

---

## 5. Criterios de aceptación a nivel producto

El producto está listo para producción cuando, en un test integral end-to-end realizado al menos 24 horas antes del evento:

- ✅ **100 partidas simuladas en sucesión** desde un mismo dispositivo móvil real (iPhone gama media o Android Snapdragon 7xx) terminan correctamente sin crash ni degradación de performance perceptible.
- ✅ El **leaderboard se actualiza en < 3 segundos** después de terminar una partida.
- ✅ **20 leads distintos** se pueden registrar sin colisión en Supabase, con datos consistentes en la export CSV.
- ✅ **Un intento de trampa documentado** (modificar score vía DevTools) NO entra al ranking público.
- ✅ La carga inicial en 4G es **< 3 segundos** verificado con throttling.
- ✅ El **playtest headless** (ver `04-quality-gate.md`) corre 50 partidas simuladas y todas terminan con score coherente, sin crashes, en menos de 5 minutos totales.

---

## 6. Riesgos y mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|
| Sin conexión wifi en el stand | Alto | Media | Hotspot 4G de respaldo; juego funciona offline excepto submit (queue local) |
| Performance pobre en celulares antiguos | Medio | Media | Test en gama media Android antes del evento; render simplificado si FPS < 30 |
| Intento de cheating coordinado en el stand | Bajo | Alta | Anti-cheat server-side; auditoría manual del top 3 antes de premiar |
| Captura de leads bloqueada por privacidad | Alto | Baja | Texto de consentimiento revisado por legal antes del evento; opt-out claro |
| Bug crítico día del evento | Alto | Media | Freeze de código 48h antes; staging idéntico a prod; rollback plan listo |
| Premio mal calibrado (muy caro = pocos, muy barato = no atrae) | Medio | Media | Definido fuera de scope técnico, pero documentar valor mínimo en el banner |
