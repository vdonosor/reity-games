# CLAUDE.md

Este archivo es leído automáticamente por Claude Code al iniciar sesión en este repositorio. Contiene las reglas operativas mínimas para que cualquier instancia del agente trabaje correctamente en `reity-games`.

**Documento autoritativo**: `/docs/00-constitution.md`. Este archivo es un resumen pragmático; ante cualquier conflicto, gana la constitution.

---

## Identidad del proyecto

**Repo**: `reity-tech/reity-games` — monorepo de juegos web de Reity SpA (fintech chilena de tokenización inmobiliaria).

**Stack base** (ya instalado, NO migrar sin ADR):
- React 19 + Vite 7 + Tailwind 4
- React Router DOM 7 (multi-juego, una ruta por juego)
- Howler (audio), Lottie (animaciones), react-sounds
- ESLint flat config + vite-plugin-checker + babel-plugin-react-compiler

**Juegos en el monorepo**:
- `/rpg-profiling` — "Aventura Inmobiliaria" (RPG existente)
- `/token-stack` — Token Stack (juego para stand universitario, en construcción)

**Backend compartido**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime). Ver `docs/05-adr/0003`.

**Usuario principal**: Vicente Donoso — abogado, COO de Reity. NO programa. Comunícate en español, técnico y directo, sin condescendencia, sin explicar conceptos básicos del dominio del usuario (es abogado, no le expliques qué es un contrato).

---

## Lectura obligatoria al iniciar sesión

Antes de tocar código en una sesión nueva, lee en este orden:

1. Este archivo (`CLAUDE.md`).
2. `docs/00-constitution.md` — reglas no negociables, gobierna todo.
3. El PRD del juego que vayas a tocar (`docs/01-prd.md` para Token Stack).
4. La spec correspondiente (`docs/02-spec-sdd.md`).
5. La task específica de `docs/03-tasks.md` que se te asignó.
6. ADRs en `docs/05-adr/` relevantes a tu task.

Si el usuario te asigna una task sin haber confirmado que leíste estos documentos en esta sesión, di que vas a leerlos primero antes de proponer cualquier acción.

---

## Cómo trabajamos (protocolo de tasks)

Trabajamos SIEMPRE por tasks numeradas del documento `docs/03-tasks.md`. Una task a la vez. Protocolo estricto:

1. **Anuncia la task** que vas a abordar citando su ID (ej: "Voy a abordar T-201").
2. **Lista los archivos** que vas a crear o modificar.
3. **Verifica dependencias**: confirma que las tasks de las que depende ya están cumplidas.
4. **Pide confirmación explícita** si la task incluye alguna acción que la requiere (lista abajo).
5. **Implementa**.
6. **Ejecuta** los tests y checks asociados.
7. **Cierra la task** verificándola contra su criterio de aceptación y definición de terminado.
8. **Resume** qué quedó listo y propón la siguiente task.

**No avances** a la siguiente task hasta que la actual esté verificada.
**No marques** tasks como completadas si el playtest headless aplicable no corre y pasa.

---

## Acciones que requieren confirmación explícita del usuario

Antes de ejecutar cualquiera de estas, explica qué vas a hacer, por qué, y espera respuesta. Sin excepciones:

1. `git push` a cualquier branch remota.
2. `git commit` con cambios estructurales (crear carpetas nuevas, mover archivos, renombrar).
3. Crear o eliminar tablas en Supabase (incluso en local).
4. Deploy a Netlify.
5. Cargar API keys, secrets o variables de entorno en cualquier sistema.
6. Borrar archivos.
7. Migrar datos.
8. Instalar dependencias npm que NO estén declaradas en un ADR o en la spec.
9. Modificar `src/styles/theme.css` o `tailwind.config.js` (requiere ADR).
10. Cualquier acción que implique gasto de dinero.

Para acciones que NO requieren confirmación (escribir código de una task ya documentada, ejecutar tests locales, crear archivos en carpetas previstas por la spec), procede directo pero reporta al final qué hiciste.

---

## Lo que el agente NUNCA hace

Lista taxativa de la constitution. Si una task implica alguna, DETIENE y pregunta:

1. Introducir dependencias nuevas sin ADR o spec que las justifique.
2. Modificar design tokens (`src/styles/theme.css`) sin ADR aprobado.
3. Crear archivos de configuración paralelos (otro `.eslintrc`, otro `babel.config.js`) en vez de modificar los existentes.
4. Push directo a `main`.
5. Commitear secretos, archivos `.env`, credenciales, API keys, ni dumps de DB con datos personales.
6. Hacer commits con autor falso, ni co-author tags falsos.
7. Marcar una task como completada si el playtest headless no se ejecutó y pasó.
8. Desactivar tests existentes para "que pase CI".
9. Confiar en datos del cliente para scoring, ranking o premios. Validación server-side obligatoria.
10. Introducir telemetría sin declaración en el PRD y consentimiento visible.
11. Generar imágenes, audios, animaciones con copyright ajeno.
12. Asumir que un cambio "menor" puede saltarse el quality gate.

---

## Tareas que el usuario hace manualmente

Estas requieren acción humana en GUIs externas. Cuando una task lo requiera, entrega instrucciones paso a paso describiendo funcionalmente qué hacer (no asumas que conoce las interfaces):

- Crear cuentas Supabase, Netlify, GitHub.
- Conectar GitHub ↔ Netlify para auto-deploy.
- Configurar variables de entorno en Netlify y Supabase secrets.
- Configurar custom domain.
- Deploys finales (autorizar push).

Espera confirmación del usuario antes de continuar después de cada paso manual.

---

## Definición de "terminado"

Un cambio está terminado solo si TODAS estas se cumplen:

1. `npm run build` pasa sin warnings nuevos.
2. `npm run lint` pasa sin errores nuevos.
3. `npm run test` pasa.
4. `npm run test:playtest` pasa (cuando aplique al juego afectado).
5. Criterio de aceptación de la task verificable manualmente al menos una vez.
6. Si toca docs (PRD, spec, tasks, gate), el PR las incluye actualizadas.
7. Si toma decisión arquitectónica, hay ADR en el mismo PR.
8. PR revisado por al menos un humano.
9. Bundle inicial < 300KB gzip (presupuesto de `docs/02-spec-sdd.md` §8).
10. Sin secretos en el bundle (verificable con grep).

---

## Condición de éxito para modo `/goal` (autónomo)

Si el usuario te pide correr autónomo, tu condición de éxito es literal y verificable:

> El comando `npm run test:playtest` debe ejecutarse exitosamente con exit code 0, completando las 50 partidas simuladas en menos de 5 minutos, con todos los `expect` aprobados. Adicionalmente, `npm run build` debe completar sin errores y el archivo principal del bundle (`dist/assets/index-*.js`) tras `gzip -k` debe pesar menos de 300 KB.

**No modifiques el playtest ni sus parámetros para hacer pasar el gate.** Si el playtest falla, arregla el código del juego, no relajes el verificador.

**Límite**: si no puedes cumplir la condición en 4 horas de trabajo autónomo, DETIENE y reporta para intervención humana.

---

## Reglas anti-alucinación

1. **Versiones de librerías**: verifica con `npm view <pkg> version` antes de declarar en `package.json`.
2. **APIs externas** (Supabase, React Three Fiber, Three.js): consulta documentación oficial cuando dudes. NO inventes nombres de funciones, parámetros o flags.
3. **Comandos CLI** (`supabase`, `npm`, `git`): verifica `--help` antes de inventar sintaxis.
4. **Tres veces antes de inventar**: si no sabes con certeza cómo funciona algo, di "voy a verificar" y consulta.
5. **Tests que fallan**: muestra el output exacto, copia el stderr literal, no resumas.
6. **RLS policies**: cada policy nueva viene con un caso de prueba manual ejecutable.
7. **No simules acciones que no hiciste**: si requiere GUI externa, pídele al usuario que lo haga.
8. **Cuando el usuario reporte un error**: pide mensaje exacto, archivo, línea. No diagnostiques al voleo.

---

## Comandos del proyecto

```bash
npm install              # instalar dependencias
npm run dev              # dev server con HMR (puerto 5173)
npm run build            # build de producción
npm run preview          # preview del build
npm run lint             # ESLint
npm run test             # tests unitarios (Vitest) — agregar cuando exista
npm run test:playtest    # playtest headless (Playwright) — agregar cuando exista
supabase start           # DB local + Edge Functions local
supabase db reset        # aplicar todas las migraciones desde cero
supabase functions serve # servir Edge Functions local
```

---

## Estructura de archivos esperada por juego

```
src/
├── games/
│   └── <nombre-juego>/
│       ├── index.jsx              entry point + ruta
│       ├── components/            UI específica del juego
│       ├── engine/                lógica pura (sin React, sin Three)
│       ├── three/                 objetos y escena 3D
│       ├── hooks/                 hooks específicos
│       ├── api/                   clientes Supabase
│       └── __tests__/             tests unitarios
├── shared/                        código compartido entre juegos
│   ├── leaderboard/
│   ├── auth/
│   └── ui/
└── styles/
    └── theme.css                  design tokens (NO TOCAR sin ADR)
```

---

## Comunicación con el usuario

- **Idioma**: español de Chile. Anglicismos técnicos cuando sean estándar (commit, deploy, bundle, etc.).
- **Tono**: técnico y directo, sin rodeos.
- **Términos técnicos nuevos**: define brevemente la primera vez.
- **Comandos de terminal nuevos**: explica qué hacen la primera vez.
- **Estructura de cada sesión**: recap de sesión anterior → objetivo de hoy → pasos concretos → cierre con qué quedó listo y qué pendiente.
- **Cuando dudes, pregunta** antes de asumir. Mejor una pregunta extra que un día en la dirección equivocada.

---

## Mantenimiento de este archivo

Este archivo se actualiza cuando:
- Cambia el stack base (vía ADR).
- Cambia el protocolo operativo de tasks.
- Cambia la lista de acciones que requieren confirmación.
- Aparece un nuevo juego en el monorepo.

Bumpear versión:
- Patch (1.0.0 → 1.0.1): clarificaciones, sin cambio funcional.
- Minor (1.0.0 → 1.1.0): nueva regla o protocolo que se agrega.
- Major (1.0.0 → 2.0.0): cambio que invalida reglas previas.

**Versión actual**: 1.0.0 — 2026-06-19
