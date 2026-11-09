# Cambios

## 0.10.0 · 2026-11-09

Gráficas con sus causas, balance diario y KH 7,7–8,3. Detalle en [docs/cambios-0.10.md](docs/cambios-0.10.md).

- **Datos del 6 al 9/11 precargados**: KH 7,5 (6/11), 7,6 (8/11), KH+ 5 g (8/11) y KH 8,1 (9/11), con Ca, Mg, NO₃, PO₄ y salinidad del 6 y del 9/11. Al abrir la app se añade lo que falte sin duplicar nada; sobre un registro como el del móvil sólo se añade el nuevo objetivo del KH.
- **KH objetivo 7,7–8,3** (ideal 8), aplicado una vez a registros anteriores y nunca por encima de un cambio tuyo posterior. Con un rango más estrecho que la exactitud declarada del test, el techo de seguridad de las correcciones y de la pausa preventiva es 9,0 (ideal + 1, política v8): sin él, el 8/11 no se podía proponer ningún KH+; ahora 5,9 g hacia 8. Si se propone un KH+ que hoy cubre al menos la mitad de lo necesario, el Balling sólo iguala el consumo (antes también empujaba hacia el ideal el mismo día y el KH se pasaba). Una subida anormal sin confirmar ya no para el Balling.
- **Gráficas algo más grandes** (236 px de alto en el móvil, textos de 12,5 px, cinco marcas en el eje) con **las intervenciones marcadas**: + correcciones, gota cambios de agua, B cambios del Balling, i otras; la lectura que muestra el efecto lleva un anillo del mismo color, y debajo va la lista con la fecha y el efecto previsto (p. ej. «KH+ en polvo 18 g · +1,44 dKH»). Las barras de cada lectura son la precisión aprendida de tu test (KH ±0,27 dKH) en vez de la exactitud del fabricante (±0,7).
- **Balance debajo de cada gráfica**: consumo, aporte del Balling y qué parte cubre (KH, Ca, Mg; estimado), o la variación diaria de las lecturas (NO₃, PO₄, salinidad; medido), con el veredicto («Compensa», «No llega», «Se pasa», «Estable», «Sube», «Baja») y si se mantiene en el objetivo. Caso real del 9/11: KH compensa (84 %, la diferencia está dentro del margen), Ca no llega (48 %, Ca+ al bajar de 400), Mg se mantiene.
- Arreglos: la previsión a 7 días del asistente ya no sale «7,9–7,9»; una propuesta de 0 ml/día ya no hace fallar el análisis.
- Simulación de un acuario como el tuyo (24 escenarios de 90 días, rango anterior frente al nuevo con el mismo motor): el KH queda igual o algo más cerca de 8 (0,257 → 0,254 dKH; con lecturas difíciles 0,277 → 0,262) y oscila algo menos (σ 0,216 → 0,209), con más correcciones pequeñas (0,3 → 1,3 cada 90 días) y nunca fuera del rango seguro. En el informe de siempre, los escenarios con el Balling en marcha quedan como en 0.9.1; el arranque de un acuario sin Balling es más lento con el rango estrecho (ver la limitación en el detalle).
- 267 pruebas (19 nuevas: 11 en `tests/charts.test.ts` y 8 de lazo cerrado con el objetivo nuevo) y la prueba en el navegador, con un escenario nuevo que carga la versión sobre un registro como el del móvil.
- La política pasa a `peninsula105-policy-v8`: hay que aceptarla de nuevo en Gestión → Ajustes.

## 0.9.1 · 2026-11-05

Auditoría de 0.9.0 aplicada; detalle hallazgo por hallazgo en [docs/cambios-0.9.1.md](docs/cambios-0.9.1.md).

- **La ReefDose hace 3 dosis al día** (el registro decía 24): el historial y el programa actual se corrigen una sola vez (mismos ml/día), las propuestas usan las dosis que hace la bomba y, con menos de 24 dosis a horas desconocidas, el margen de fase es el de un día entero.
- **Salinidad ideal 34 ppt** (objetivo 33–35, seguro 32–36), aplicada una vez a registros anteriores. Los objetivos se pueden cambiar en Gestión → Objetivos y rangos, con validación.
- **Sólo programas posibles en la ReefDose 4**: 1–24 dosis, 0,2–1000 ml/día en pasos de 0,1 ml y ≥ 0,2 ml por dosis, con el motivo en castellano; los registros antiguos se siguen leyendo y avisan en Alertas.
- **Efecto de cada cambio de agua** con el volumen y el nivel estimado justo antes (modelo), no con los de ahora ni con la última lectura.
- **Mediciones**: «1.350» se entiende como 1350 en Mg (y se dice), lo ambiguo se pregunta y un valor muy raro pide confirmar. «Hoy/ayer» y el progreso del día cuadran con el cambio de hora. Aviso de potencia al elegir Ca+ o MG+ en solución.
- 7 pruebas nuevas (`tests/audit.test.ts`).

## 0.9.0 · 2026-11-04

Modelo del acuario, asistente y todo el historial desde el primer día. Detalle y análisis completo de la aplicación en [docs/cambios-0.9.md](docs/cambios-0.9.md).

- **Historial completo incluido.** Las 28 mediciones del 26/10 al 3/11, el KH+ de 18 g del 29/10, las garrafas nuevas y el programa de 5,5 ml/día del 30/10 y el cambio de agua de 40 L del 1/11 (KH 7,7 y 34 ppt, datos confirmados por el usuario) vienen en la aplicación. Al abrirla se añade lo que falte en el registro, sin duplicar nada (se compara por tipo y hora, nunca por valor). Si el cambio de agua del 1/11 quedó con otros datos (p. ej. los 35 ppt que proponía el formulario), se corrige con una revisión; el original se conserva.
- **Consumo con todas las lecturas a la vez.** Antes se comparaban lecturas de dos en dos con el peor error del test sumado dos veces, y desde el 31/10 el motor se quedaba en «repite el test» sin proponer nada mientras la bomba cubría sólo ~65 % del consumo. Ahora un balance de masas bayesiano usa todas las lecturas, lo dosificado, las correcciones y los cambios de agua, y aprende la precisión real del test (±0,15 dKH con tus lecturas, frente a ±0,7 supuestos). Caso real: consumo ≈ 0,22 dKH/día (0,15–0,30); con 5,5 ml/día el KH bajaría de 7,5 en unos 2 días; propuesta: 11,0 ml/día por cabezal, con tu confirmación.
- **Asistente.** En Inicio, como mucho dos notas con lo importante; en Gestión → Análisis, todo con sus números: KH (consumo, nivel estimado, previsión a 7 días), calcio y magnesio, nutrientes (NO₃ a 0 y PO₄ 0,25 → 0,03 en una semana), salinidad en el límite bajo y la precisión de tu test. Cada nota dice si es medido, estimado o ambos. Las alertas ya no repiten lo que explica el asistente. La gráfica de Mediciones añade la previsión a 7 días sin cambios (punteada, con su margen).
- **Lecturas raras y adiciones sin registrar.** Una lectura que no encaja con las demás ni con lo dosificado (más allá de la exactitud del test) pide repetir antes de tocar nada. Si otra lectura la confirma al mismo nivel, se trata como una adición sin registrar: el consumo sale de las lecturas anteriores y la app pregunta si falta registrar algo.
- **Ajustes más rápidos cuando los datos son concluyentes.** Si el modelo ya era concluyente tras cada una de las dos o más últimas lecturas con el programa actual (separadas 36 h o más), esa es la confirmación que pide la histéresis. Antes había que tener la app abierta entre una lectura y otra. Además, el paso puede superar el 10 % cuando el KH no puede pasar de 9 antes de volver a medir.
- **Resumen para compartir** (Gestión → Exportar / importar): todo el historial y el estado en un texto corto para enviarlo por chat o correo; la copia JSON se descarga como archivo también desde la app instalada. El diario va por fecha y los cambios de agua muestran el KH y la salinidad del agua nueva; el formulario propone la salinidad del último cambio en vez de 35.
- Simulaciones (20 escenarios de 60–90 días): días fuera del objetivo 233 → 139 y correcciones de KH 53 → 26. Con lecturas difíciles (ruido de ±0,25 dKH, 5 % erróneas, horas variables): 805 → 292 días fuera del objetivo, 157 → 3 fuera del rango seguro y 156 → 25 correcciones de KH. 241 pruebas.
- La política pasa a `peninsula105-policy-v7`: hay que aceptarla de nuevo en Gestión → Ajustes. Esquema de eventos 4 (lee los anteriores).

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
