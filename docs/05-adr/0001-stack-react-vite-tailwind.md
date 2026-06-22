# ADR 0001 — Stack monorepo: React + Vite + Tailwind

**Estado**: Aceptado
**Fecha**: 2026-06-19
**Decisor**: Vicente Donoso (COO Reity) + agente
**Aplica a**: monorepo `reity-tech/reity-games` y todos los juegos que viva dentro.

---

## Contexto

Reity necesita producir juegos web para iniciativas de marketing (stands universitarios, ferias, lanzamientos). Hay un juego previo (`/rpg-profiling` — "Aventura Inmobiliaria") ya implementado en el repo `reity-tech/reity-games` con un stack ya elegido.

La pregunta no es "qué stack usar de cero" sino "qué stack consolidamos para el monorepo, dado que ya hay código y diseño tokens decidido".

Las fuerzas en juego:

- **Velocidad de desarrollo**: las iniciativas son tácticas (feria de un día, lanzamiento de campaña). No hay budget para refactor cada vez.
- **Talento disponible**: Vicente no programa. El stack debe ser navegable por agentes (Claude Code, Cursor) y por un dev contratado eventualmente. React + Tailwind es lo que más dev y agente saben.
- **Performance**: los juegos corren en móvil; el bundle inicial pesa.
- **Reutilización**: design tokens, componentes UI, autenticación, integración con Supabase deben compartirse entre juegos.
- **Lock-in**: cualquier elección crea lock-in; queremos uno que sea estándar y reemplazable.

---

## Decisión

Se mantiene y formaliza el stack ya presente:

- **React 19** como librería de UI.
- **Vite 7** como build tool y dev server.
- **Tailwind CSS 4** con plugin `@tailwindcss/vite` para estilos.
- **React Router DOM 7** para multipágina/multi-juego.
- **Design tokens** definidos en `src/styles/theme.css` con OKLCH y mapeados a utilidades Tailwind en `tailwind.config.js`.
- **ESLint flat config** + **vite-plugin-checker** para lint en dev.
- **Babel plugin React Compiler** para optimización automática de re-renders.

Cada juego nuevo se monta como una ruta independiente bajo `/<nombre-juego>` con su propia carpeta en `src/games/<nombre-juego>/`.

---

## Alternativas y por qué se descartaron

### Next.js 15

**Por qué se consideró**: meta-framework más popular del ecosistema React, SSR/SSG nativo, App Router, optimizaciones automáticas, Vercel integration.

**Por qué se descartó**:
- Los juegos NO necesitan SSR (son SPAs interactivas, no contenido indexable).
- App Router agrega complejidad conceptual (server components, layouts) que no aporta valor en un juego.
- Vendor lock con Vercel (aunque deployable en otras platforms, optimizado para Vercel).
- Bundle base más grande que Vite vanilla.
- Tiempo de build mayor.
- El repo ya está en Vite y migrar tendría costo sin beneficio claro.

### Remix / React Router framework mode

**Por qué se consideró**: misma gente que React Router, foco en data loading y forms.

**Por qué se descartó**:
- Diseñado para apps con muchas rutas y data fetching server-side. Los juegos tienen 1-3 rutas y casi todo es client-side.
- Sobre-engineering para el use case.

### Astro

**Por qué se consideró**: islands architecture, bundles ultra-livianos para sitios mayormente estáticos.

**Por qué se descartó**:
- Los juegos son interactivos en su mayor parte; el modelo de "islas" no aporta tanto.
- Soporte React es excelente pero el dev experience para apps interactivas favorece Vite directo.
- Ecosistema de game-related libs (Three.js, R3F) más maduro en Vite.

### SvelteKit / Vue + Vite

**Por qué se consideró**: ambos performantes y agradables de escribir.

**Por qué se descartó**:
- Vicente y los agentes están más familiarizados con React.
- Ecosistema de juegos web (Three.js, R3F, Phaser bindings) más rico en React.
- Migrar un repo existente solo para cambiar de librería UI sin razón funcional fuerte no se justifica.

### Vanilla JS sin framework

**Por qué se consideró**: bundle mínimo, sin runtime overhead, máxima portabilidad. Es lo que se hizo en el referente Polla Familiar (otro proyecto de Vicente) y funcionó.

**Por qué se descartó para este monorepo**:
- Para múltiples juegos compartiendo UI, leaderboards, captura de leads, mantener vanilla escala mal.
- Reusabilidad de componentes en vanilla requiere conventions ad-hoc; React tiene esto resuelto.
- En el referente Polla Familiar había una sola "app"; aquí habrá N juegos.

### CSS Modules / styled-components en vez de Tailwind

**Por qué se consideró**: encapsulación de estilos por componente.

**Por qué se descartó**:
- Tailwind permite iteración visual mucho más rápida sin context switching a archivos CSS.
- Los design tokens ya están en variables CSS expuestas como utilidades Tailwind; preservar este sistema unificado.
- Bundle de Tailwind purgeado es mínimo.

---

## Consecuencias

### Lo que se gana
- Stack consistente entre juegos: un dev/agente que entiende uno entiende todos.
- Design tokens centralizados → cambio de paleta global gratis.
- Velocidad de desarrollo alta para features UI.
- Ecosistema React Three Fiber disponible para juegos 3D (ver ADR-0002).
- Build rápido con Vite (HMR < 100ms).

### Lo que se pierde / cuesta
- Bundle inicial mayor que vanilla (~80KB gzip de React + ReactDOM).
- Requiere que los devs/agentes manejen modelo mental React (hooks, effects, etc.).
- React Compiler reduce re-renders pero introduce magia que puede confundir en debugging.

### Implicaciones derivadas
- Edge Functions de Supabase usan Deno; el engine puro JS debe escribirse en JS estándar para ser importable desde Deno también.
- Cada juego nuevo replica la estructura `src/games/<nombre>/{components,engine,three,api,hooks,__tests__}` (ver constitution §3).

---

## Reversibilidad

**Costosa pero no irreversible.** Migrar a otro framework requeriría:
- Reescritura de todos los juegos en paralelo (no se puede hacer parcial sin tener dos stacks).
- Recrear el sistema de design tokens en el nuevo stack.
- Costo estimado: 2-4 semanas según número de juegos al momento de la migración.

La decisión se revisa si:
- React 19 introduce breaking changes mayores incompatibles con el ecosistema.
- Vite es deprecado o reemplazado por sucesor oficial (poco probable a corto plazo).
- Las necesidades de SEO o SSR aparecen (improbable para juegos en stand).
