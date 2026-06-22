# 00 — Constitution

> **Razón de ser de este documento**: las reglas persistentes que un agente debe respetar siempre, incluso en corridas autónomas largas. Sin esto, el agente se desvía y nadie lo frena en `/goal`. Es el documento más subestimado y el que gobierna todo lo demás.

**Ámbito**: monorepo `reity-tech/reity-games`. Aplica a Token Stack y a cualquier juego futuro.

**Versión**: 1.0 — 2026-06-19

---

## 1. Stack y entorno

### Stack obligatorio del monorepo
- **Frontend**: React 19 + Vite 7 + Tailwind 4 (configuración ya presente en el repo). NO migrar a Next.js, Remix, Astro u otro framework sin ADR aprobado.
- **Routing**: React Router DOM v7. Cada juego nuevo se monta como ruta independiente (ej: `/token-stack`, `/rpg-profiling`).
- **Estilos**: Tailwind con design tokens semánticos definidos en `src/styles/theme.css` (OKLCH). NO introducir CSS-in-JS, styled-components, ni archivos `.css` sueltos fuera de `src/styles/`.
- **Estado**: hooks de React (`useState`, `useReducer`, `useContext`). NO introducir Redux, Zustand, Jotai u otra librería de estado global sin ADR.
- **Audio**: `howler` y `react-sounds` (ya en `package.json`).
- **Animaciones 2D**: `lottie-web` (ya en `package.json`).
- **Animaciones / render 3D**: `three` + `@react-three/fiber` + `@react-three/drei` (a agregar en Token Stack; ver ADR-0002).
- **Backend / persistencia**: Supabase (PostgreSQL + Auth + Edge Functions). Compartido entre juegos del monorepo cuando aplique (ver ADR-0003).
- **Tests**: Vitest para unit/integration, Playwright para E2E y playtest headless determinista.
- **Lint**: ESLint con la configuración ya presente. `vite-plugin-checker` corre lint en dev.

### Entorno de desarrollo
- Node.js ≥ 20.x (LTS).
- npm como package manager. No mezclar con pnpm/yarn.
- Sistema operativo de referencia: macOS (los devs trabajan en Mac). Compatibilidad Linux/Windows debe mantenerse, pero la verificación principal corre en macOS y CI Linux.

---

## 2. Principios no negociables

Estos principios gobiernan todas las decisiones. Cuando algo en una spec, task o ADR los contradice, gana el principio.

1. **Trazabilidad de extremo a extremo.** Cada línea de código relevante debe rastrearse a una task, cada task a un criterio de aceptación, cada criterio a un requisito del PRD, cada PRD a un problema de negocio.

2. **El verificador determinista es la fuente de verdad del "terminado".** Si el playtest headless no corre y pasa, el feature NO está listo. No importa cuántos tests unitarios pasen.

3. **Anti-cheat server-side por defecto.** Cualquier puntaje que otorgue un premio o ranking público se valida en el server. El cliente nunca es fuente de verdad para scoring.

4. **Captura de datos personales pasa por DPA mental.** Cualquier formulario que recolecte nombre, email o RUT debe tener consentimiento explícito visible, propósito declarado, y la data no se usa para nada distinto a lo declarado.

5. **Mobile-first, touch-first.** El público objetivo juega en su propio celular vía QR. Cualquier interacción debe funcionar con un dedo, sin teclado físico, en pantallas de 360px a 430px de ancho.

6. **Performance importa**. 60 FPS en gama media de Android (Snapdragon 7xx / Apple A13 en adelante). Bundle inicial < 300KB gzip. Sin esto, los usuarios cierran antes de jugar.

7. **Sin secretos en el cliente, nunca**. API keys de Supabase con privilegios sensibles, claves de API-Football o equivalentes van en Edge Functions o Netlify secrets, jamás en el bundle del frontend.

8. **Documentación viva o muerta**. Los siete documentos de `/docs/` se actualizan en el mismo PR que el cambio que los afecta. Un PR que cambia arquitectura sin actualizar la spec se bloquea en el quality gate.

---

## 3. Convenciones

### Estructura de archivos por juego
```
src/
├── games/
│   └── token-stack/
│       ├── index.jsx              # entry point + ruta
│       ├── components/            # UI específica del juego
│       ├── engine/                # lógica pura del juego (sin React)
│       ├── three/                 # objetos y escena Three.js
│       ├── hooks/                 # hooks específicos del juego
│       ├── api/                   # clientes Supabase, contratos
│       └── __tests__/             # tests del juego
├── shared/                        # código compartido entre juegos
│   ├── leaderboard/
│   ├── auth/
│   └── ui/
└── styles/
    └── theme.css                  # design tokens (NO TOCAR sin ADR)
```

### Nombres
- **Archivos React**: `PascalCase.jsx` (componentes) o `camelCase.js` (utilidades).
- **Carpetas**: `kebab-case`.
- **Variables y funciones**: `camelCase`.
- **Constantes globales**: `UPPER_SNAKE_CASE`.
- **Tipos en JSDoc**: `PascalCase`.
- **Tablas Supabase**: `snake_case`.
- **Funciones RPC Supabase**: `snake_case`.

### Ramas
- `main` — producción, siempre desplegable.
- `feature/<juego>-<nombre-corto>` — features nuevos.
- `fix/<juego>-<descripcion>` — bugs.
- `chore/<descripcion>` — mantenimiento, deps, docs.
- Sin push directo a `main`. Siempre PR.

### Commits (Conventional Commits)
```
feat(token-stack): agregar countdown visible
fix(token-stack): corregir cálculo de overhang
chore(deps): bump three a 0.170
docs(token-stack): actualizar spec con nuevo contrato leaderboard
test(token-stack): playtest headless detecta partidas <2s como inválidas
```

### Pull Requests
- Título: igual formato que commits.
- Descripción debe incluir:
  - Qué cambia y por qué (link al PRD o issue).
  - Cómo se probó (humano + automatizado).
  - Checklist del quality gate.
  - Si toca arquitectura: link al ADR (nuevo o modificado).

---

## 4. Lo que el agente nunca debe hacer

Lista taxativa. Si una task implica alguna de estas, el agente DETIENE y pregunta:

1. **Nunca** introducir una dependencia nueva sin que esté declarada en un ADR o en la spec del feature.
2. **Nunca** modificar `src/styles/theme.css` (design tokens) sin ADR aprobado.
3. **Nunca** crear archivos de configuración paralelos (`.eslintrc.json`, `babel.config.js`) cuando ya existe la configuración Vite/ESLint flat. Modificar las existentes.
4. **Nunca** hacer push directo a `main`.
5. **Nunca** commitear secretos, archivos `.env`, credenciales, API keys, ni dumps de DB con datos personales.
6. **Nunca** hacer commits firmados o atribuidos a un humano que no es el dev real. No usar `--author` ni co-author tags falsos.
7. **Nunca** marcar una task como completada si el playtest headless no se ejecutó y pasó.
8. **Nunca** desactivar tests existentes para "que pase CI". Si un test falla, se arregla el código o se actualiza el test con justificación.
9. **Nunca** confiar en datos del cliente para scoring, ranking o premios. Validación server-side obligatoria.
10. **Nunca** introducir telemetría, analytics o tracking de usuarios sin que esté declarado en el PRD y con consentimiento visible.
11. **Nunca** generar imágenes, audios o animaciones con copyright ajeno (sprites de juegos famosos, música conocida, logos de terceros). Solo assets propios o licencia abierta verificada.
12. **Nunca** asumir que un cambio "menor" puede saltarse el quality gate. Lo decide la tabla de riesgo del README, no el agente.

---

## 5. Definición de "terminado" global

Un cambio está terminado cuando **todas** estas condiciones se cumplen. Sin excepciones.

1. ✅ El código compila (`npm run build`) sin warnings nuevos.
2. ✅ ESLint pasa (`npm run lint`) sin errores nuevos.
3. ✅ Tests unitarios pasan (`npm run test`).
4. ✅ El playtest headless del juego afectado pasa (`npm run test:playtest`).
5. ✅ El criterio de aceptación de la task se verifica manualmente al menos una vez.
6. ✅ Si el cambio toca documentación (PRD, spec, tasks, gate), el PR la incluye.
7. ✅ Si el cambio toma una decisión arquitectónica, hay ADR en el mismo PR.
8. ✅ El PR fue revisado por al menos un humano (no solo otro agente).
9. ✅ El bundle inicial sigue bajo el presupuesto declarado en la spec (300KB gzip por defecto).
10. ✅ No se introdujeron secretos en el bundle (verificable con grep del build).

---

## 6. Cómo se evoluciona esta constitución

Esta constitución no es inmutable, pero su modificación requiere:

1. Un ADR proponiendo el cambio, con justificación y alternativas descartadas.
2. Aprobación humana explícita en el PR del ADR.
3. Bumpear la versión en el header (1.0 → 1.1 para reglas nuevas, 2.0 para cambios que invalidan reglas previas).

El agente no puede modificar esta constitución por su cuenta, ni siquiera para "facilitar" una task. Si una task no se puede ejecutar respetando la constitución, se reescribe la task, no la constitución.
