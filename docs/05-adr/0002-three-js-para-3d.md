# ADR 0002 — Three.js + React Three Fiber para render 3D

**Estado**: Aceptado
**Fecha**: 2026-06-19
**Decisor**: Vicente Donoso + agente
**Aplica a**: Token Stack y futuros juegos del monorepo con render 3D.

---

## Contexto

Token Stack requiere render 3D para que la mecánica de "apilar bloques" sea visualmente atractiva. La referencia visual (Stack de Ketchapp) es 3D y la diferenciación visual en un stand universitario importa: el juego tiene que verse atractivo a 2 metros de distancia para que la gente se acerque.

Las fuerzas en juego:

- **Calidad visual** vs **bundle size**: cualquier librería 3D pesa.
- **Curva de aprendizaje** del agente y del dev humano eventual.
- **Integración con React**: el resto del juego está en React; tener un modelo mental coherente facilita mantenimiento.
- **Performance móvil**: 60 FPS en gama media Android es no negociable.
- **Mantenibilidad**: si dentro de 6 meses Reity quiere ajustar el juego, debe ser navegable.

---

## Decisión

Se adopta **Three.js (r170+) con React Three Fiber (R3F) v9 y @react-three/drei** como stack 3D para Token Stack y para juegos futuros del monorepo que requieran 3D.

Dependencias a agregar:

```json
{
  "three": "^0.170.0",
  "@react-three/fiber": "^9.0.0",
  "@react-three/drei": "^10.0.0"
}
```

R3F permite escribir Three.js declarativamente como componentes React, reutilizando el modelo mental ya en uso en el resto del monorepo.

---

## Alternativas y por qué se descartaron

### Canvas 2D vanilla

**Por qué se consideró**: bundle mínimo (~0KB extra), API simple, performance excelente.

**Por qué se descartó**:
- La mecánica visual de Stack (perspectiva 3D, sombras, profundidad) es central a la experiencia.
- Hacerlo en 2D con tricks de perspectiva (isométrico fake) se ve "barato" y va contra el objetivo de diferenciación visual en el stand.
- El tiempo de implementar y ajustar el fake 3D excede el costo de bundle de Three.js.

### Babylon.js

**Por qué se consideró**: motor 3D maduro, focus en gaming, mejor para juegos complejos.

**Por qué se descartó**:
- API imperativa, no se integra con React naturalmente.
- Bundle mayor que Three.js para nuestro use case.
- El ecosistema React Three Fiber alrededor de Three.js es mucho más grande que el de Babylon.

### PixiJS

**Por qué se consideró**: WebGL renderer rápido, bundle moderado.

**Por qué se descartó**:
- PixiJS es 2D-first. Hay extensiones 3D pero no son first-class.
- Misma objeción que Canvas 2D: el efecto visual 3D real es lo que queremos.

### Phaser 3

**Por qué se consideró**: framework de juegos 2D popular.

**Por qué se descartó**:
- Esencialmente 2D.
- Trae su propio gestor de escenas, físicas, etc., que duplica funcionalidad y choca con React.
- Sobre-engineering para un juego de un solo tap.

### Unity / Godot Web Export

**Por qué se consideró**: motores AAA con export a web.

**Por qué se descartó**:
- Bundle de varios MB.
- Tiempo de carga prohibitivo en 4G.
- Workflow completamente separado del resto del monorepo.
- Sobre-engineering brutal para un juego de stand.

### Three.js puro sin R3F

**Por qué se consideró**: menos abstracciones, control directo, bundle ligeramente menor.

**Por qué se descartó**:
- API imperativa de Three.js no se integra fluidamente con React.
- Coordinar el state de React con la escena Three obliga a escribir wrappers ad-hoc.
- R3F resuelve esto con un costo de bundle marginal (~30KB gzip).
- Drei adicional aporta helpers (`OrbitControls`, `useGLTF`, `Text`) que aceleran desarrollo.

---

## Consecuencias

### Lo que se gana
- Calidad visual coherente con la referencia visual (Stack de Ketchapp).
- Modelo declarativo: cambios de escena vía state de React, no via comandos imperativos.
- Ecosistema rico: shaders, postprocessing, instancing, physics (rapier) si se necesita.
- Tipos TS de calidad si en algún momento migramos a TypeScript.

### Lo que se pierde / cuesta
- **Bundle**: ~150KB gzip adicionales (Three.js + R3F + Drei tree-shaken). Aún dentro del budget de 300KB total.
- **Curva de aprendizaje**: matrices de transformación, cámaras, iluminación. El agente debe leer la documentación de R3F al menos una vez.
- **Debug**: errores en shaders o geometrías custom pueden ser opacos.

### Mitigaciones de los costos
- Escena Token Stack usa solo `BoxGeometry`, `DirectionalLight`, `AmbientLight`, cámara ortográfica. Mínima superficie de Three.js usada.
- NO se usan: postprocessing, modelos GLTF, shaders custom, physics. Si en futuro un juego los necesita, se agrega bajo otro ADR.

### Implicaciones derivadas
- El engine puro (`src/games/token-stack/engine/`) NO debe importar Three.js ni R3F. Engine es lógica pura; render es vista. Así el playtest headless puede correr el engine sin levantar WebGL.
- Tests unitarios del engine corren sin jsdom de Three (Vitest puro).
- Playtest headless usa Playwright en Chromium con WebGL habilitado.

---

## Reversibilidad

**Moderadamente costosa.** Si se decide mover a otro renderer 3D:
- La capa engine (lógica pura) NO se ve afectada.
- Solo se reescribe la capa `three/` con componentes equivalentes.
- Costo estimado: 1-3 días por juego.

La separación engine / vista hace que esta decisión sea más reversible que si Three.js estuviera entremezclado con la lógica de juego.

La decisión se revisa si:
- R3F deja de mantenerse o tiene breaking changes mayores incompatibles.
- Aparece una alternativa con bundle significativamente menor (<50KB) y misma DX.
- Se necesitan features 3D que R3F/Three.js no cubren (improbable para juegos de stand).
