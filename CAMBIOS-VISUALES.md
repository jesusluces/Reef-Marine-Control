# Mi Acuario Marino · Liquid Glass

Rediseño visual sobre Reef Core 0.5.0. Abre `app/dist/acuario.html` en el navegador para utilizar la aplicación. El HTML está completo y no necesita descargar fuentes, imágenes ni librerías.

## Diseño

- Tarjetas translúcidas con desenfoque, reflejos suaves y bordes de cristal.
- Fondo acuático en tonos azul, turquesa y lavanda, con cabecera de vidrio líquido.
- Barra de navegación flotante y selección en forma de cápsula.
- Tipografía del sistema, números más claros y formularios con controles redondeados.
- Modo claro y oscuro según el sistema; respeta la reducción de movimiento y de transparencias cuando el navegador la admite.
- Material sólido de respaldo en navegadores sin `backdrop-filter`.

## Alcance

Solo cambian `app/src/page.html` y `app/dist/acuario.html`. El bloque de estilos `liquid-glass` contiene el tema. No se modifican el motor, las fórmulas, los eventos, el almacenamiento ni las acciones. El JavaScript de la entrega es idéntico al original, byte por byte (SHA-256: `2bf9774a67b41cff835a68b5ca0cd49061010da31a1bff2ab74ccec3305a9c53`).

Se mantienen los scripts de compilación originales: `npm install` y `npm run app` regeneran `app/dist/acuario.html` a partir de las fuentes. No se añaden dependencias.

## Verificación

- 206 pruebas existentes aprobadas, cero fallos. Ejecutadas con Node 24 y `--test-isolation=none` por las restricciones del entorno a los subprocesos.
- Alta del acuario y guardado verificado de seis mediciones de ejemplo.
- Inicio, Mediciones, Dosificación y Gestión revisados a 320, 375, 412 y 768 px, sin desbordamiento horizontal.
- Los doce apartados de Gestión revisados a 375 px, sin desbordamiento horizontal.
- Vistas clara y oscura revisadas en Chromium; sin errores de JavaScript en el navegador. No se ha probado en un iPhone físico.

Las capturas de la entrega muestran datos de prueba. El HTML y las fuentes no incluyen esos registros.

## Iconos «Cómic × Liquid Glass» (23 de octubre de 2026)

La aplicación usa la colección entregada: 47 iconos (IC01–IC47) y 6 ilustraciones (IL01–IL06). La numeración es la del inventario: cada número identifica un sitio de la aplicación.

- `app/assets/iconos/`: los SVG tal como se entregaron. `app/gen-assets.ts` los valida (lista cerrada de elementos, atributos y colores), quita títulos y degradados repetidos y los convierte en `app/src/assets.gen.ts`. `npm run app` lo hace siempre antes de compilar.
- Los seis degradados son iguales en todos los iconos y se insertan una sola vez en el documento (`iconDefs()`).
- El contorno #13394d pasa a `currentColor` (`--icon-ink`): azul tinta en modo claro y casi blanco en modo oscuro, para que los iconos no se pierdan sobre el cristal oscuro.
- `app/assets/ilustraciones/`: los PNG entregados y su versión WebP (calidad 92), que es la que se incrusta: 173 KiB en lugar de 890 KiB.
- IL04 (frasco) es vectorial: la aplicación dibuja dentro del contorno `cuerpo` el líquido de cada parte con su nivel real.
- IL05 sustituye al orbe dibujado con CSS.
- IL02 es un Chelmon rostratus en lugar del pez payaso; la función se llama ahora `fishArt()`.
- Cambios de colocación: KH, Ca, Mg, salinidad, NO₃ y PO₄ tienen icono propio (el magnesio deja de ser el texto «Mg»); los grupos de equipamiento usan IC40–IC47; las insignias de estado muestran IC09, IC15 o IC08 sobre un círculo tintado (verde, ámbar, rojo con borde más grueso, gris); en la barra inferior la pestaña activa va a todo color y las demás algo desaturadas.

Para cambiar un icono basta con sustituir el archivo con el mismo nombre en `app/assets/iconos/` y ejecutar `npm run app`. Para una ilustración, sustituye el PNG y genera el WebP:

```
python3 -c "from PIL import Image; Image.open('IL01_urna.png').save('IL01_urna.webp', 'WEBP', quality=92, method=6)"
```

Comprobado: 212 pruebas, prueba de extremo a extremo, typecheck, los 53 recursos visibles en alguna pantalla, sin errores de JavaScript y sin desbordamiento horizontal a 412 px en modo claro y oscuro. El motor, las fórmulas, los eventos y el almacenamiento no cambian.

## Fondo marino, tipografía y estilo pegatina (24 de octubre de 2026)

- **Fondo (IL07).** `app/assets/ilustraciones/IL07_fondo-mar.png` es la imagen entregada; se incrusta en WebP (calidad 82, 149 KiB) detrás de toda la aplicación. En modo oscuro se cubre con un velo azul noche para que el texto siga legible. Los textos que van directamente sobre el fondo (cabecera de Inicio, notas al pie) llevan un halo, y el cristal de las tarjetas es algo más opaco.
- **Tipografía.** Fredoka (títulos, cifras, botones y barra inferior) y Nunito (texto), de Google Fonts. Sin conexión se usan las fuentes redondeadas del sistema. Se comprobó que nada se desborda a 412 px incluso con una fuente de sustitución más ancha.
- **Iconos más grandes y contrastados.** El mismo tratamiento para los 47, calculado en `gen-assets.ts` a partir de cada silueta: contorno de tinta un 18 % más grueso, borde blanco de pegatina y sombra corta. `icon()` los dibuja un 25 % más grandes; los iconos de sección y de parámetro ya no van dentro de una pastilla de color. Las insignias de estado conservan su círculo verde, ámbar, rojo o gris porque es lo que indica el estado.
- **IC31** se redibuja como tubo de ensayo con tapón, con la misma construcción que el resto (degradados compartidos, tinta y brillos). El original entregado está en `app/assets/originales/`.
- **IL04 (frasco)** se redibuja en código siguiendo las referencias: tapón con estrías, cuerpo de cristal, ola, burbujas y etiqueta con la parte. Colores: KH cian, Ca violeta, Trace verde (también en las barras de nivel). El tercer frasco se rotula «Trace» y no «Mg», para no confundirlo con MG+.
- **IL01, IL02, IL03, IL05 e IL06** reciben el mismo borde blanco de pegatina (`app/assets/webp.py`).

Prueba de extremo a extremo: el caso del almacén simulado pasaba el fallo forzado por `sessionStorage` justo antes de recargar y a veces se perdía; ahora va en la URL.

## Maqueta de Inicio (24 de octubre de 2026, tarde)

Bloque de estilos `maqueta` en `app/src/page.html`, siguiendo la imagen de referencia:

- Cristal color agua con borde blanco de 2,5 px en tarjetas, cabeceras, segmentos y barra inferior.
- Cabecera de Inicio en letras de pegatina: blanco con contorno azul tinta (`--ring-lg`, `--ring-sm`), orbe más grande y campana en un botón de cristal azul.
- Tarjeta de estado con el texto centrado y el icono dentro de una baldosa de cristal de 68 px.
- Mosaicos de parámetros centrados: icono de 60 px, nombre, valor, rango y la insignia de estado en la esquina.
- Barra inferior más alta, con iconos de 46 px y etiquetas en Fredoka.
- Comprobado a 360 y 412 px, con la fuente real de sustitución y con una más ancha, en modo claro y oscuro.

## Estilo inspirado en la app anterior (24 de octubre de 2026, noche)

Sustituye el bloque `maqueta` por `clasico` (`app/src/page.html`), tomando sólo el aspecto de Reef Marine Control v85 (descontinuada); no se reutiliza su código ni sus imágenes:

- Barra superior en todas las pantallas (`appBar()` en `ui.ts`): botones cuadrados de cristal y, en el centro, una placa en cápsula con «Mi Acuario Marino» y el coral IC30.
- Título grande con halo blanco y, encima, una etiqueta con destello (`pageTag()`): «Tu arrecife, de un vistazo», «Datos fiables y con contexto», «Next 1:1:1 · ReefDose 4», «Todo tu acuario en un lugar» y «Gestión» en los apartados.
- Tarjetas blancas con borde azul claro y sombra suave; mosaicos de parámetros en pastel por parámetro (KH turquesa, Ca lavanda, Mg verde menta, salinidad azul, NO₃ rosa, PO₄ lila).
- Botones principales en cápsula azul brillante con texto blanco contorneado; segmentos y chips activos con el mismo azul.
- Barra inferior blanca; la pestaña activa, en una baldosa azul clara.
- Se mantienen el fondo IL07, la tipografía y los iconos IC01–IC47 con borde de pegatina.

## Nombre y tema (24 de octubre de 2026)

- La placa superior y el título de la página dicen «Mi Acuario Marino · Final Boss»; «Final Boss» va en letra manuscrita (Pacifico, de Google Fonts).
- Gestión → Ajustes → Apariencia: Automático, Claro u Oscuro (`app/src/theme.ts`). Se guarda en el navegador de cada dispositivo, nunca en el registro del acuario. En automático manda el visor (app de Claude) o el sistema; una elección explícita se mantiene aunque el visor cambie de tema.

## Sólo modo claro y ventanas más suaves (24 de octubre de 2026)

- Inicio ya no tiene saludo («¡Hola!», etiqueta y orbe): empieza en la barra superior y la tarjeta de estado.
- La aplicación es sólo clara: `theme.ts` fija `data-theme="light"` aunque el móvil o la app de Claude estén en oscuro, y desaparece el selector de Apariencia. Las reglas oscuras antiguas quedan sin efecto.
- Bloque `claro`: bordes de 1,5 px, esquinas de 28 px, sombras en capas difusas, brillo interior en tarjetas y botones, sombra del color de cada mosaico, separador bajo los títulos de panel, texto secundario más oscuro y halo más fuerte en los títulos.

## Iconos como pegatinas (24 de octubre de 2026)

- Los 47 iconos llevan un borde blanco troquelado más ancho (+5,8 en el lienzo de 24) con un filo gris azulado (#c4d8ea) por fuera, calculados a partir de su silueta en `gen-assets.ts`; se dibujan al 84 % del lienzo para que el borde quepa.
- El frasco IL04 y las ilustraciones IL01–IL06 reciben el mismo borde y filo (`art.ts`, `webp.py`).
- Sombra de pegatina común (dos capas: contacto y caída) y algo más de tamaño en mosaicos, secciones y barra inferior; el icono de la pestaña activa se inclina un poco, como una pegatina recién puesta.

## Iconos con el dibujo del fondo marino (25 de octubre de 2026)

- Los 47 iconos toman el estilo del fondo IL07 sin tocar sus SVG: contorno azul marino (#0d2b8a) como los corales, algo más fino; acuarela suave en la paleta del arrecife (verde alga, azul roca, violeta coral, naranja coral, agua azul); motas oscuras y claras como la estrella de mar y semitono en la zona de sombra.
- IC30 (corales) e IC33 (objetivos) pasan del violeta al rosa de la estrella de mar.
- Siguen siendo pegatinas: mismo borde blanco troquelado y sombra. Se genera en `app/gen-assets.ts` (`fondo()`, `fondoDefs()`).

## Activación del Balling y limpieza (29 de octubre de 2026)

- Dosificación → Programas: tarjeta «Activar el Balling» con los tres pasos (Corregir, Verificar, Activar), el estado de KH, Ca y Mg frente a su objetivo, el consumo de KH del historial, las correcciones propuestas y, en el paso 3, la dosis por cabezal con la casilla «Ya está cargado» y el botón «Activar Balling». Si faltan las garrafas, un botón las registra llenas de 5 L.
- Inicio: la tarjeta de estado indica el paso («Paso 1 · Corrige KH», «Paso 2 · Mide KH», «Paso 3 · Activa el Balling»).
- Quitadas la calibración de cabezales, la verificación con patrón, el chip «Sin verificar con patrón» y la tapa antisaltos. «Instrumentos y calibraciones» pasa a «Tests de medición», con la prueba de precisión como opcional.
- Fauna y corales: sin avisos de convivencia ni «Si lo añades»; las fichas muestran nombre, tamaño, calcificación y dieta.
