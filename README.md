# Mi Acuario Marino · Final Boss · Reef Core Engine 0.7.0

**0.7.0 · corregir, verificar y activar.** La app parte de las mediciones reales del 26 al 29/10/2026, corrige con KH+, Ca+ o MG+ lo que esté fuera del objetivo, espera una lectura que lo confirme y deja activar el Balling con la dosis calculada con el consumo real. Después la ajusta sola, siempre con confirmación. Avisa de caídas, subidas y desequilibrios. Sin calibraciones; fauna y corales sólo como inventario. Ver [cambios 0.7](docs/cambios-0.7.md).

**0.5.0 · correcciones del informe definitivo.** Estrategia única XEPTA Reef Balance Next 1:1:1 con proporción obligatoria, seguimiento del nivel de KH, confirmación del perfil antes de dosificar, migración de historiales sin pérdidas, guardado verificable y la aplicación móvil de cuatro pantallas. Ver [cambios 0.5](docs/cambios-0.5.md) y [CHANGELOG](CHANGELOG.md).

Revisión de seguridad de septiembre: reservas futuras contra el techo químico, contexto KH para Ca, eventos físicos de volumen, reducción gradual y parada de seguridad, margen por administración e inventario conservador. Ver [informe detallado y compatibilidad](docs/audit-2026-09.md). Los documentos visuales anteriores quedan fuera de esta revisión.

La entrega `0.3.0-data-contract` añade selectores optativos de aplicación para consumir esos datos sin acoplar el motor a una interfaz. Ver [revisión del contrato a partir del prototipo](docs/prototype-data-review.md). La lógica química y la salida existente permanecen intactas.

Motor TypeScript para reconstrucción química y temporal de un acuario de arrecife. Sin UI, DOM, framework, backend ni control de bombas. El núcleo es puro; almacenamiento y ejemplos están fuera de él.

**Regla estructural:** MANUAL/BALLING elige el mantenimiento habitual. `calculateCorrection()` es independiente del modo; KH+, Ca Plus y Mg Plus pueden corregir un parámetro sin dosificar compañeros. Tras una corrección se conserva el balance completo, pero un ajuste de mantenimiento requiere evidencia posterior suficiente. Ver [correcciones transversales](docs/corrections.md).

**Estado: implementación y validación de software; activación química condicionada.** Hay un conflicto en las fuentes oficiales de XEPTA sobre la proporción de Next líquido/Ready Pack. `NEXT_STRATEGY` está `BLOCKED_BY_VALIDATION`; no genera propuestas comerciales Balling. Las simulaciones usan `SIMULATION_STRATEGY`, una hipótesis 1:1:1 explícita. Ca/Mg Plus distinguen formulaciones antiguas y nuevas. Ver [auditoría e incidencias](docs/audit.md).

## Ejecutar

Node.js 22.6 o posterior (probado con 22.22; los scripts pasan `--experimental-strip-types`, que en Node 24 no hace falta pero se acepta). Dependencias de desarrollo fijadas en `pnpm-lock.yaml`; el motor distribuido no necesita dependencias de ejecución.

```sh
npm install
npm run typecheck            # motor y aplicación
npm test                     # 212 pruebas
npm run build                # dist/ del motor
npm run app                  # aplicación en app/dist/acuario.html (un único HTML)
npm run simulate:peninsula   # lazo cerrado del perfil → reports/peninsula-0.7.0.*
npm run e2e                  # prueba en Chromium a 412 px (necesita Playwright)
npm run check                # todo lo anterior salvo simulación y e2e
```

La raíz del repositorio contiene la aplicación instalable (PWA) lista para GitHub Pages: `index.html`, `manifest.webmanifest`, `sw.js` e `icons/`. `npm run app` la regenera (también en `app/dist/pwa/`) junto con `app/dist/acuario.html`, la versión de un solo archivo sin instalación. En GitHub: Settings → Pages → Deploy from a branch → `main` / `(root)`. En Android, Chrome ofrece «Instalar»; en iPhone, Safari → Compartir → «Añadir a pantalla de inicio». Los iconos de instalación salen de `app/assets/pwa/make-icons.mjs`.

Las versiones de desarrollo están fijadas en `package.json` a las probadas. GitHub Actions ejecuta lo mismo en Node 22 y 24 (`.github/workflows/ci.yml`). TypeScript verifica los tipos por separado; ejecutar `.ts` con Node no los comprueba.

`dist/index.js` y `dist/index.d.ts` quedan preparados para importar en la futura aplicación web. El repositorio incluye la compilación inicial como archivo de entrega; `dist/` no se versiona.

## Entrada principal

`computeAquarium()` recibe eventos, `now`, `knownAt`, política con procedencia, estrategia validada, identidades de productos confirmadas, historial de dosis completo desde una fecha, reservas futuras y estado explícito de histéresis. Devuelve estado reconstruido, medidas originales, tendencias observadas, consumo estimado, incertidumbre, recomendaciones, alertas, inventario e información faltante.

Consultar [scripts/demo.ts](scripts/demo.ts) para una llamada completa con el historial solicitado y [src/index.ts](src/index.ts) para la API pública. Las fórmulas pueden usarse por separado:

```ts
import { calculateKhCorrection, dkh, liters, PRODUCTS } from './dist/index.js';

const calculation = calculateKhCorrection({
  deltaDkh: dkh(0.5),
  volumeLiters: liters(180),
  product: PRODUCTS.khPlus,
});
// calculation.amount = { value: 3, unit: 'g' }
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
- `src/application`: orquestación, archivo JSON y almacenamiento en memoria con control de concurrencia.
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
