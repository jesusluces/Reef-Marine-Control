# Mi Acuario Marino · Final Boss · Reef Core Engine 0.8.1

Aplicación móvil (PWA) y motor TypeScript para llevar la química de un acuario de arrecife con Balling XEPTA Reef Balance Next 1:1:1 en una ReefDose de Red Sea. Perfil incluido: Península 105 × 60 × 60 (≈ 375 L efectivos).

**Qué hace.** Parte de las mediciones reales del 26 al 29/10/2026. Antes del Balling corrige con KH+, Ca+ o MG+ lo que esté fuera del objetivo (KH ideal 8 dKH), espera una lectura que lo confirme y deja activar el Balling con la dosis calculada a partir del consumo real, con las correcciones descontadas. Después ajusta el programa solo, siempre con confirmación, y avisa de caídas o subidas inesperadas y de desequilibrios. Los cambios de agua se registran con los litros, el KH y la salinidad del agua nueva; Ca y Mg salen de la ficha de la sal. Fauna y corales son sólo inventario; los equipos se dan por calibrados.

**0.8.0 · revisión final.** Código depurado (restos de versiones anteriores fuera), fórmulas verificadas con cálculos independientes, avisos de vigilancia con título propio en Alertas y, tras un cambio de agua con su química conocida, ya no hace falta repetir Mg y salinidad para que el Balling decida. Ver [CHANGELOG](CHANGELOG.md) y [cambios 0.8](docs/cambios-0.8.md); el historial de versiones anteriores está en `docs/` (cambios 0.5–0.7, auditorías).

**Regla estructural:** el núcleo es puro (sin UI, DOM ni control de bombas) y la aplicación sólo llama al motor. Mantenimiento (Balling) y correcciones (KH+, Ca+, MG+) son independientes: una corrección conserva el balance completo, pero un ajuste del Balling exige evidencia posterior. Ver [correcciones transversales](docs/corrections.md).

**Estrategia.** Las fuentes de XEPTA se contradicen sobre la proporción de Next líquido (1:1:1 frente a 3:1:1), así que la estrategia genérica `NEXT_STRATEGY` queda `BLOCKED_BY_VALIDATION`. El perfil usa `READY_PACK_STRATEGY` (1:1:1), validada con la etiqueta que declaró el usuario. Ver [auditoría](docs/audit.md).

## Ejecutar

Node.js 22.6 o posterior (probado con 22.22; los scripts pasan `--experimental-strip-types`, que en Node 24 no hace falta pero se acepta). Dependencias de desarrollo fijadas en `pnpm-lock.yaml`; el motor distribuido no necesita dependencias de ejecución.

```sh
npm install
npm run typecheck            # motor y aplicación
npm test                     # 225 pruebas
npm run build                # dist/ del motor
npm run app                  # aplicación en app/dist/acuario.html (un único HTML)
npm run simulate:peninsula   # lazo cerrado del perfil → reports/peninsula-<versión>.json
npm run e2e                  # prueba en Chromium a 412 px (PLAYWRIGHT_PATH=…/playwright/index.mjs)
npm run check                # todo lo anterior salvo simulación y e2e
```

La raíz del repositorio contiene la aplicación instalable (PWA) lista para GitHub Pages: `index.html`, `manifest.webmanifest`, `sw.js` e `icons/`. `npm run app` la regenera (también en `app/dist/pwa/`) junto con `app/dist/acuario.html`, la versión de un solo archivo sin instalación. En GitHub: Settings → Pages → Deploy from a branch → `main` / `(root)`. En Android, Chrome ofrece «Instalar»; en iPhone, Safari → Compartir → «Añadir a pantalla de inicio». Los iconos de instalación salen de `app/assets/pwa/make-icons.mjs`.

Las versiones de desarrollo están fijadas en `package.json` a las probadas. GitHub Actions ejecuta lo mismo en Node 22 y 24 (`.github/workflows/ci.yml`). TypeScript verifica los tipos por separado; ejecutar `.ts` con Node no los comprueba.

`dist/index.js` y `dist/index.d.ts` quedan preparados para importar en la futura aplicación web. El repositorio incluye la compilación inicial como archivo de entrega; `dist/` no se versiona.

## Entrada principal

`computeAquarium()` recibe eventos, `now`, `knownAt`, política con procedencia, estrategia validada, identidades de productos confirmadas, historial de dosis completo desde una fecha, reservas futuras y estado explícito de histéresis. Devuelve estado reconstruido, medidas originales, tendencias observadas, consumo estimado, incertidumbre, recomendaciones, alertas, inventario e información faltante.

Consultar [app/src/engine.ts](app/src/engine.ts) para una llamada completa con el perfil y [src/index.ts](src/index.ts) para la API pública. Las fórmulas pueden usarse por separado:

```ts
import { calculateKhCorrection, dkh, liters, PRODUCTS } from './dist/index.js';

const calculation = calculateKhCorrection({
  deltaDkh: dkh(0.5),
  volumeLiters: liters(180),
  product: PRODUCTS.khPlus,
});
// calculation.amount = { value: 3, unit: 'g' }  (0,5 dKH × 180/100 × 5 g / 1,5 dKH)
// Resultado matemático: debe pasar por evaluateSafety() antes de proponer una dosis.
```

## Organización

- `src/core/system`: geometría y volumen con intervalos.
- `src/core/measurement`: métodos de test, incertidumbre, repetibilidad y patrones.
- `src/core/livestock`, `src/core/planning`: fauna/corales y plan de tests.
- `src/profiles`: perfiles de acuarios reales (Península 105).
- `src/application/messages.es.ts`, `guidance.ts`: textos y próximos pasos para la interfaz.
- `app/`: aplicación web (sin química: sólo llama al motor).
- `src/core/types`: unidades, lecturas, eventos, errores.
- `src/core/products`: formulaciones versionadas y registro de fuentes.
- `src/core/chemistry`: fórmulas únicas para dosis, mezcla y normalización.
- `src/core/temporal`: orden, revisiones, replay y propagación afín con cotas.
- `src/core/consumption`, `confidence`: intervalos, mediana/MAD, tendencia y evidencia.
- `src/core/dosing`, `safety`: Balling, correcciones, histéresis, inventario y ventanas móviles.
- `src/core/recommendations`, `alerts`: decisiones explicables y evaluación por peor parámetro.
- `src/application`: orquestación, acciones del usuario como eventos, historial inicial y archivo JSON.
- `src/core/simulation`: simulador reproducible con semilla; políticas exclusivamente sintéticas.
- `tests`: unidades, integración, regresión, propiedades y escenarios de 7/30/90 días.
- `reports`: resultados reproducibles y ejemplo de historial.

## Contrato de seguridad

1. Una medición no se reescribe. Las revisiones y exclusiones quedan en eventos.
2. Efecto desconocido no significa efecto cero. Puede haber un valor nominal calculable sin evidencia suficiente para dosificar.
3. «Consumo» significa desaparición neta equivalente bajo el modelo; no demuestra consumo biológico.
4. Targets, tiempos de mezcla, incertidumbres y límites operativos necesitan configuración justificada para el acuario. Los valores de `simulation/policy.ts` no son recomendaciones de mantenimiento.
5. Los planes son propuestas. La programación real de ReefBeat, sus horarios, zona horaria, cola, compensación de dosis, calibración, precisión y fraccionamiento deben reconciliarse antes de ejecutar. No existe integración de hardware en este repositorio.
6. El motor no declara seguridad biológica ni certificación. No calcula pH ni predice precipitación/equilibrio iónico completo.

Las decisiones de diseño, fórmulas, límites y pruebas están en [algoritmos](docs/algorithms.md), [validación](docs/validation.md), [fuentes](docs/sources.md) y [modelo temporal](docs/temporal-design.md). Cualquier cambio matemático requiere nueva validación y versión; véase `AGENTS.md`.
