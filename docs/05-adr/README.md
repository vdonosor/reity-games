# 05 — ADRs (Architecture Decision Records)

> **Razón de ser de esta carpeta**: que el "por qué" de las decisiones arquitectónicas no se evapore entre sesiones del agente. Un ADR sin la sección de "alternativas descartadas y por qué" es solo un changelog y no aporta valor real.

## Formato de cada ADR

```
NNNN-titulo-breve.md
```

- `NNNN` es secuencial (0001, 0002, ...).
- Título en kebab-case.
- Una decisión por archivo.

## Estructura interna obligatoria

Cada ADR debe tener:

1. **Estado** — Propuesto / Aceptado / Superseded por NNNN / Deprecado.
2. **Fecha** — cuando se tomó la decisión.
3. **Contexto** — las fuerzas en juego, el problema que se está resolviendo.
4. **Decisión** — qué se decidió hacer, en presente.
5. **Alternativas y por qué se descartaron** — sección obligatoria, el corazón del ADR.
6. **Consecuencias** — qué cambia, qué se gana, qué se pierde.
7. **Reversibilidad** — fácil / costosa / irreversible.

Si la sección 5 está vacía o tiene "no se evaluaron alternativas", el ADR está mal escrito y se devuelve para reescritura.

## Cuándo escribir un ADR

Ver la tabla del [`README.md`](../README.md). En resumen: cuando la decisión es difícil de revertir o no es obvia para quien llega nuevo.

## Lista de ADRs vigentes

| ID | Título | Estado | Fecha |
|---|---|---|---|
| [0001](./0001-stack-react-vite-tailwind.md) | Stack monorepo: React + Vite + Tailwind | Aceptado | 2026-06-19 |
| [0002](./0002-three-js-para-3d.md) | Three.js + R3F para render 3D | Aceptado | 2026-06-19 |
| [0003](./0003-supabase-backend-compartido.md) | Supabase como backend compartido del monorepo | Aceptado | 2026-06-19 |
| [0004](./0004-playtest-headless-determinista.md) | Playtest headless determinista como gate de calidad | Aceptado | 2026-06-19 |
