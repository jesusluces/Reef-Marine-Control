# Cambios

## 0.8.1 · 2026-10-30

Con el KH ya corregido y verificado, el Balling no se dejaba activar: el botón no aparecía y en Inicio salía «Paso 3 · Casi listo». Ocurría en dos casos:

- **La lectura de verificación era algo más alta de lo esperado** (p. ej. 8,3 con ~7,9 previsto tras 18 g de KH+). Esto entra en el error del test, pero el último tramo parecía «producción neta» y bloqueaba la activación. Ahora ese tramo no bloquea antes de activar, porque la dosis inicial sale del balance de toda la ventana.
- **La corrección no estaba registrada en la app.** El balance completo no daba consumo y la activación se quedaba sin dosis. Ahora se usa el consumo medido antes de la subida (7,6 → 6,7: 0,29 dKH/día), se arranca prudente (70 %) y se avisa: «¿falta registrar alguna corrección?».

En Inicio, «Casi listo» dice ahora qué falta en concreto. Las simulaciones no cambian. Hay 2 pruebas nuevas, 225 en total.

## 0.8.0 · 2026-10-29

Revisión final: código depurado, matemática verificada y todo probado. Detalle en [docs/cambios-0.8.md](docs/cambios-0.8.md).

- Fuera lo que quedaba de versiones anteriores:
  - módulos y scripts sin uso (corrección manual antigua, selectores, almacén en memoria, demo y simulador genérico, flujo de CI duplicado);
  - funciones de calibración y de verificación con patrón;
  - códigos del periodo base;
  - el dibujo del pie oculto y más de 30 reglas CSS sin uso.

  TypeScript más estricto (sin variables ni parámetros sin usar).
- Cada fórmula (KH+, Ca+, MG+, límites diarios, consumo con balance de masas, dosis inicial del Balling, sal escalada y cambio de agua) se ha recalculado de forma independiente con los datos reales y coincide con el motor.
- Tras un cambio de agua con el KH y la salinidad del agua nueva ya no hace falta medir de nuevo Mg y salinidad para que el Balling decida (el efecto se propaga con su incertidumbre). Para el KH se sigue esperando la lectura posterior.
- Las caídas o subidas inesperadas, los desequilibrios y la deriva aparecen en Alertas con su propio título, en vez de «Tendencia de X» en Inicio.
- La prueba de extremo a extremo vuelve a generar sus datos sin la calibración retirada.
- Simulaciones idénticas a 0.7.2. 223 pruebas.

## 0.7.3 · 2026-10-29

- Correcciones: si has añadido más de lo recomendado (p. ej. 18 g de KH+ cuando hoy tocaban 10,7 g), la app ya no lo bloquea. Avisa de cuánto sube el KH con esa cantidad, pide una segunda pulsación por si es un error de tecleo y la registra tal cual. El motor la descuenta en el balance y no propone más corrección hasta que vuelvas a medir.
- El cálculo explica por qué parte de un KH algo menor que la última lectura (sigue bajando desde entonces).
- Sin cambios en las decisiones del motor. 237 pruebas.

## 0.7.2 · 2026-10-29

KH objetivo 8 dKH y cambios de agua con la sal del usuario. Detalle en [docs/cambios-0.7.md](docs/cambios-0.7.md#072--kh-objetivo-8-y-cambios-de-agua-con-la-sal).

- Las correcciones de KH apuntan siempre a 8 dKH (antes de activar el Balling apuntaban a 8,5).
- Cambio de agua: litros (40 por defecto, ±5 L), KH y salinidad del agua nueva. Calcio y magnesio se estiman con Xepta Balanced Reef Salt (ficha a 33 ppt, escalada a la salinidad real); el KH, si no se mide, también. Cada cambio muestra su efecto estimado en el acuario.
- El balance de KH, Ca, Mg y salinidad descuenta el cambio con sus incertidumbres (litros, test y ficha), así que no se confunde con consumo ni dispara avisos o correcciones; el Balling espera la lectura posterior y el seguimiento del nivel no deshace el cambio durante 7 días.
- Simulaciones con un cambio de agua semanal de ~40 L (36–44 L reales). 236 pruebas.

## 0.7.1 · 2026-10-29

Sección «Correcciones» con acciones concretas. Detalle en [docs/cambios-0.7.md](docs/cambios-0.7.md#071--sección-correcciones).

- Dosificación → Correcciones: estado de KH, Ca y Mg y, para cada corrección, «Tu KH actual es 6,7 dKH y el objetivo es 8,0», el cálculo (gramos de KH+ que suben 1 dKH en tus litros y el total necesario), lo que se añade hoy por seguridad y los días siguientes.
- Botón «He añadido la corrección»: queda en el historial, el motor la descuenta en el consumo y pide medir de nuevo tras la mezcla. Lista «Correcciones realizadas» con su verificación.
- El KH primero (lleva el Balling); Ca+ y MG+, en versión más sencilla, sólo si bajan del objetivo.
- Motor: cada corrección incluye `correction` (de dónde a dónde, producto por unidad con el volumen, total y, si hoy ya se corrigió al máximo, desde cuándo se puede seguir). Las decisiones no cambian (simulaciones idénticas). 232 pruebas.

## 0.7.0 · 2026-10-29

Corregir, verificar y activar el Balling, sin periodo base. Detalle en [docs/cambios-0.7.md](docs/cambios-0.7.md).

- Historial inicial: las 12 mediciones del 26 al 29/10/2026 se cargan solas y no se duplican.
- Antes del Balling, KH+, Ca+ y MG+ corrigen lo que esté fuera del objetivo; una lectura nueva lo verifica y el usuario activa el Balling con la dosis calculada con su consumo real (correcciones descontadas). Por seguridad, con un consumo de 0,5 dKH/día o más se puede activar sin esperar.
- Avisos de subidas inesperadas y de desequilibrios de Ca o Mg con el KH bien.
- Sin calibración ni verificación con patrón: los equipos se dan por calibrados.
- Fauna y corales sólo como inventario, sin avisos de riesgo ni compatibilidad.
- Política `peninsula105-policy-v6` (hay que aceptarla de nuevo). 231 pruebas.

## 0.6.1 · 2026-10-29

Revisión con los datos reales del 26 al 29 de octubre (KH 7,6 → 6,7 en tres días, sin prueba de repetibilidad). Detalle en [docs/cambios-0.6.md](docs/cambios-0.6.md#061--datos-reales-del-26-al-29-de-octubre).

- Arranque prudente del Balling: con el KH bajo el objetivo y un descenso claro pero sin cota que excluya el cero, se arranca con el 70 % del consumo medido. Antes el acuario quedaba atrapado entre correcciones de KH+ que reiniciaban el periodo base.
- Lecturas sin lote del mismo método cuentan como el mismo kit (`requireLotForCancellation: false`): al quitar el lote de la app, el motor había perdido la cancelación del sesgo del test (simulación de arranque: 27 correcciones de KH+ y el Balling sin arrancar).
- La app tampoco pide lote en la prueba de repetibilidad ni en la verificación con patrón.
- Política `peninsula105-policy-v5` (hay que aceptarla de nuevo). 232 pruebas.

## App · instalable como PWA (2026-10-25)

- Manifest, service worker (funciona sin conexión) e iconos de instalación; barra «Instalar» en Android y aviso para iPhone. Se genera en la raíz para GitHub Pages. Sin cambios en el motor.

## App · iconos con el dibujo del fondo marino (2026-10-25)

- Contorno azul marino, acuarela en la paleta del arrecife, motas y semitono, manteniendo el estilo pegatina (ver CAMBIOS-VISUALES.md).
- Sin campo de lote en las mediciones. Sin cambios en el motor.

## 0.6.0 · 2026-10-24

Periodo base sin aditar antes del primer Balling, arranque automático con la dosis 1:1:1 calculada a partir del KH y detección de caídas anormales de KH, Ca y Mg con corrección puntual aparte del Balling. Correcciones puntuales y cambios de agua que no mueven el Balling (lectura posterior, histéresis y bloqueo direccional de 7 días), volumen neto medido y KH diario las dos primeras semanas. Política `peninsula105-policy-v4` (hay que aceptarla de nuevo). Detalle en [docs/cambios-0.6.md](docs/cambios-0.6.md).

## App · fondo marino, Fredoka y estilo pegatina (2026-10-24)

- Fondo IL07, tipografía Fredoka/Nunito e iconos con borde blanco y tinta más gruesa, un 25 % más grandes (ver CAMBIOS-VISUALES.md).
- Frasco IL04 nuevo con etiqueta por parte (KH cian, Ca violeta, Trace verde) e IC31 como tubo de ensayo.
- Prueba de extremo a extremo más estable. Sin cambios en el motor.

## App · iconos «Cómic × Liquid Glass» (2026-10-23)

- 47 iconos y 6 ilustraciones nuevos, numerados IC01–IC47 e IL01–IL06 (ver CAMBIOS-VISUALES.md).
- Generador `app/gen-assets.ts` con validación de los SVG; `npm run app` lo ejecuta antes de compilar.
- Iconos propios para cada parámetro y cada grupo de equipamiento. Sin cambios en el motor.

## 0.5.0 · 2026-10-23

Respuesta al informe definitivo de correcciones del Core 0.4.0. Detalle en [docs/cambios-0.5.md](docs/cambios-0.5.md).

- Estrategia única y verificada XEPTA Reef Balance Next 1:1:1 (alias para planes antiguos); proporción 1:1:1 obligatoria en motor, registro y propuestas; Trace Part nunca es un corrector.
- Seguimiento del nivel de KH hacia el ideal y evidencia por correcciones repetidas; métricas de estabilidad en el simulador (48 → 12 días fuera del objetivo en el escenario base; 1 con patrón).
- Confirmación del perfil antes de dosificar (`ProfileConfirmationEvent`, esquema de eventos 3); volumen con el grosor del vidrio medido.
- Acuarios nuevos sólo en Balling; salinidad en densidad rechazada.
- `planImport()`: migración entre identificadores de acuario sin duplicados ni pérdidas.
- Aplicación: diseño móvil de cuatro pantallas (Inicio, Mediciones, Dosificación, Gestión); guardado verificado, bandeja de pendientes, copia local y recuperación de datos ilegibles; importación con resumen previo.
- Repositorio: dependencias fijadas, CI en GitHub Actions, Node ≥ 22.6, informes antiguos en `reports/historico/`.
- Política del perfil `peninsula105-policy-v2` (hay que aceptarla de nuevo).

## 0.4.0 · 2026-10-23

Volumen desde la geometría, incertidumbre de medida descompuesta, programas de bomba como entrega continua, cota de control, deriva observada, política de contexto, aceptación de política, fauna y corales, plan de tests, simulador de lazo cerrado y primera aplicación web. Ver [docs/precision-0.4.md](docs/precision-0.4.md).

## 0.3.0

Contrato de datos y selectores de aplicación; revisión de seguridad de septiembre. Ver [docs/audit-2026-09.md](docs/audit-2026-09.md).
