# Documentación spec-driven — Reity Games

Este directorio contiene la documentación que gobierna el desarrollo de los juegos del monorepo `reity-games`, comenzando por **Token Stack** (juego para stand universitario).

La estructura sigue el patrón **PRD → SDD → Tasks → Quality Gate**, con una constitución que gobierna a todos y ADRs que preservan el "por qué" de las decisiones.

---

## Flujo

```
┌──────────────────┐
│ 00-constitution  │  Reglas no negociables (stack, convenciones, prohibiciones)
└────────┬─────────┘
         │ gobierna
         ▼
┌──────────────────┐
│ 01-prd           │  Qué y por qué (problema, objetivo, alcance, requisitos)
└────────┬─────────┘
         │ insumo de
         ▼
┌──────────────────┐
│ 02-spec-sdd      │  Cómo (arquitectura, modelo de datos, contratos, trade-offs)
└────────┬─────────┘
         │ se descompone en
         ▼
┌──────────────────┐
│ 03-tasks         │  Unidades implementables y verificables, trazables a 01 y 04
└────────┬─────────┘
         │ validadas por
         ▼
┌──────────────────┐
│ 04-quality-gate  │  Criterios de aceptación y verificador determinista
└──────────────────┘

         ┌──────────────────┐
         │ 05-adr/          │  Decisiones tomadas, con alternativas descartadas
         └──────────────────┘
```

---

## Qué usar según el riesgo del cambio

No todos los cambios merecen los seis artefactos. Aplicarlos sin criterio genera documentos muertos que nadie lee y desincentiva mantenerlos al día.

| Tipo de cambio | Ejemplo | Constitution | PRD | Spec | Tasks | Quality Gate | ADR |
|---|---|---|---|---|---|---|---|
| **Fix trivial** | Tipo en texto, color CSS, ajuste de copy | ✓ leer | — | — | — | — | — |
| **Bug fix funcional** | Score no se guarda al cerrar pestaña | ✓ leer | — | — | ✓ ligero | ✓ test que reproduce | — |
| **Feature pequeña** | Agregar countdown visible al iniciar partida | ✓ leer | ✓ una historia | — | ✓ | ✓ | — |
| **Feature mediana** | Modo difícil con bloques más angostos | ✓ leer | ✓ | ✓ ligero | ✓ | ✓ | ✓ si afecta arquitectura |
| **Feature mayor / nuevo juego** | Token Stack completo, nuevo juego en monorepo | ✓ leer | ✓ completo | ✓ completo | ✓ | ✓ | ✓ |
| **Cambio de stack** | Migrar de Three.js a Babylon.js | ✓ actualizar | — | ✓ actualizar | ✓ | ✓ | ✓ obligatorio |
| **Cambio en contrato externo** | Cambia esquema de Supabase del leaderboard | ✓ leer | — | ✓ actualizar | ✓ | ✓ | ✓ obligatorio |

**Regla práctica**: si la decisión es difícil de revertir o no es obvia para alguien que llega nuevo al proyecto, escríbela en un ADR. Si no, no.

---

## Cómo trabajar con agentes (Claude Code, Cursor, etc.)

El agente debe leer en orden, antes de tocar código:

1. `00-constitution.md` (siempre, en cada sesión)
2. El PRD del feature/juego que vaya a tocar
3. La spec correspondiente
4. Los ADRs relevantes
5. La task específica que se le asignó

Si el agente va a correr en modo autónomo (ej: `/goal` en Claude Code), la **condición de éxito debe ser una frase verificable**, no solo "que pasen los tests". Ver `04-quality-gate.md` para la forma correcta de redactarla.

---

## Estado actual

| Documento | Estado | Última actualización |
|---|---|---|
| 00-constitution | ✅ Vigente | 2026-06-19 |
| 01-prd-token-stack | ✅ Vigente | 2026-06-19 |
| 02-spec-sdd-token-stack | ✅ Vigente | 2026-06-19 |
| 03-tasks-token-stack | ✅ Vigente | 2026-06-19 |
| 04-quality-gate-token-stack | ✅ Vigente | 2026-06-19 |
| 05-adr | 4 ADRs registrados | 2026-06-19 |
