# Reef Marine Control · PWA v23

Versión optimizada para uso instalado en Android y ajustada especialmente al vivo X300 Pro.

## Pantalla objetivo
- vivo X300 Pro
- 6,78 pulgadas
- 2800 × 1260 píxeles
- 452 ppp
- PWA vertical, mobile-first
- CSS optimizado alrededor de 400–440 px de viewport lógico

## Cambios v23
- Nuevo icono RMC con Chelmon rostratus.
- Iconos 180, 192, 512 y maskable 512.
- Ajustes de safe-area para OriginOS/Android.
- Inputs y botones optimizados para uso táctil.
- Gráficas con mayor altura en la pantalla del X300 Pro.
- Espaciado, tarjetas, navegación y tipografía ajustados al viewport lógico del teléfono.
- Sigue siendo responsive para otros móviles.
- Service Worker actualizado a `reef-marine-control-v23`.

## Actualizar GitHub Pages
1. Descomprime el ZIP.
2. En el repositorio GitHub: `Add file` → `Upload files`.
3. Arrastra TODOS los archivos del ZIP.
4. Confirma el reemplazo de los archivos existentes.
5. Pulsa `Commit changes`.
6. GitHub Pages desplegará automáticamente la nueva versión.

Los datos del usuario siguen almacenándose en localStorage con la misma clave, por lo que actualizar la PWA no borra el historial local del dispositivo.

## v24 — Interfaz limpia
- La dosificadora concreta deja de mostrarse en la interfaz.
- Sus tolerancias, resolución y límites continúan usándose internamente por el motor matemático.
- Se eliminan las referencias visibles a Red Sea, ReefDose y ReefBeat.
- En Historial, los títulos quedan como: Calcio, Magnesio, NO₃, PO₄ y Salinidad.
- Service Worker actualizado a v24.

## v25 — Dosificación sin ambigüedad
- `Dosis automática calculada` pasa a `Mantenimiento diario 1:1:1`.
- Eliminada la tarjeta independiente `Corrección KH`.
- El ajuste de KH se integra dentro del mantenimiento como `Ajuste puntual de KH`.
- El ajuste puntual solo aparece si KH está más de 0,20 dKH por debajo del objetivo.
- Se deja explícito que el ajuste puntual es una acción única y no modifica la dosis diaria 1:1:1.
- Se actualizan eventos, mensajes y textos para usar la misma terminología.
- Service Worker actualizado a v25.

## v26 — Fondo marino ilustrado
- Se usa la imagen suministrada por el usuario como fondo principal.
- Fondo optimizado: `reef-background.webp` (841 × 1870 px).
- La ilustración permanece fija detrás de la interfaz al desplazarse.
- Las burbujas animadas existentes siguen moviéndose por encima del fondo.
- El fondo se incluye en la caché offline de la PWA.
- Service Worker actualizado a v26.


## v27 — Ventanas más Liquid Glass
- Paneles y ventanas con acabado más tipo Liquid Glass.
- Más transparencia, blur, brillo especular y borde luminoso.
- Reflejos internos y aurora suave dentro de tarjetas, navbar y modales.
- Inputs, tabs y chips también reciben tratamiento glass.
- El fondo marino y las burbujas animadas se mantienen.
- Service Worker actualizado a v27.


## v28 — Panel Medición completa mejorado
- Rediseño visual del bloque `Medición completa (opcional)` tomando como referencia la imagen aportada.
- Filas tipo ficha con icono marino a la izquierda, nombre + unidad con más jerarquía y valor grande editable a la derecha.
- Colores individuales por parámetro: Ca, Mg, NO3, PO4 y Salinidad.
- Decoración de mini burbujas a la derecha y cabecera más expresiva.
- Se mantienen los mismos ids de inputs y la misma lógica de guardado.
- Service Worker actualizado a v28.


## v29 — Panel Medición completa más kawaii
- Rehecho el panel `Medición completa` con una estética más kawaii y tierna.
- Título y cabecera más suaves, con chip decorativo y onda marina.
- Cada fila se convierte en una cute card con icono, subtítulo y burbujitas.
- Los valores siguen siendo editables y mantienen los mismos ids de inputs.
- Se conserva toda la lógica de guardado.
- Service Worker actualizado a v29.


## v30 — Panel Medición completa con iconos reales
- Se rehace `Medición completa` usando las imágenes proporcionadas por el usuario.
- Se asignan iconos ilustrados a Calcio, Magnesio, Nitrato, Fosfato y Salinidad.
- Se ajusta la ventana para integrarlos mejor visualmente.
- Se mantiene intacta la lógica de inputs y guardado.
- Service Worker actualizado a v30.


## v31 — Panel de medición más compacto
- Se reduce el alto de cada opción de `Medición completa` para que el panel sea menos largo.
- Se ajustan iconos, tipografía, padding y tamaño del valor numérico.
- Se sustituye la imagen de PO4 por la nueva aportada por el usuario.
- Se mantiene intacta la lógica de inputs y guardado.
- Service Worker actualizado a v31.


## v32 — Botes ilustrados en Dosificación
- Se sustituyen únicamente los tres botes visuales de KH Part, Calcium Part y Trace Part por las imágenes suministradas por el usuario.
- No se modifica ningún cálculo, texto, panel ni comportamiento adicional.
- Service Worker actualizado a v32.


## v33 — Botes de dosificación más grandes
- Se agrandan los botes de KH Part, Calcium Part y Trace Part en la sección Dosificación.
- No se modifica nada más de la aplicación.
- Service Worker actualizado a v33.


## v34 — Botes de dosificación mucho más grandes y con movimiento
- Se agrandan claramente los botes de KH Part, Calcium Part y Trace Part en Dosificación.
- Se añade una animación suave de balanceo/levitación para que se muevan ligeramente.
- No se modifica nada más de la aplicación.
- Service Worker actualizado a v34.


## v35 — Iconos personalizados en la barra inferior
- Se reemplazan los iconos de Inicio, Medición, Dosificación e Historial por las imágenes aportadas por el usuario.
- Se integran visualmente en el dock inferior, respetando estados activos y hover.
- No se modifica ningún otro panel, cálculo o comportamiento.
- Service Worker actualizado a v35.


## v36 — Título superior sustituido por imagen personalizada
- Se reemplaza el texto superior de la app por la imagen proporcionada por el usuario.
- Se adapta el header para que el nuevo título encaje visualmente con los iconos laterales.
- Se mantienen intactos el resto de paneles, cálculos y estilos.
- Service Worker actualizado a v36.


## v37 — Motor interno H2Ocean P4 Pro (D-D)
- La dosificadora técnica de referencia pasa a H2Ocean P4 Pro.
- 4 canales.
- Rango programable interno: 0,1–9.999 ml.
- 1–24 dosificaciones por día y canal.
- Precisión de referencia: < ±0,5 %.
- La tolerancia física de la bomba se incorpora como cota adicional en los rangos predictivos de KH y Ca.
- Se registran internamente capacidades de calibración individual, ciclos hasta 99 días, programación semanal, control de líquido restante, reloj interno y memoria tras corte.
- No se muestra la marca/modelo en la interfaz.
- Service Worker actualizado a v37.


## v38 — Auditoría matemática y simplificación
- Eliminado `Próxima acción` de Inicio.
- Eliminado el panel `Predicción con el programa actual` de Dosificación.
- Eliminado el panel explicativo Mantenimiento/Ajuste/Reparto.
- Eliminado el ajuste puntual KH duplicado de Dosificación; las correcciones se centralizan en Historial > Eventos.
- Nuevo evento `Corrección de parámetros` para KH, Mg y Ca con cálculo automático según volumen neto.
- Xepta KH+: gramos = incremento dKH × volumen L / 30.
- Aquaforest MG Plus: ml = incremento ppm × volumen L / 50.
- Aquaforest Ca Plus: ml = incremento ppm × volumen L / 100.
- Los eventos estructurados de corrección KH/Ca se incorporan directamente al balance químico de consumo sin descontar inventario Balling; el propio evento es la fuente única del dato.
- H2Ocean P4 Pro: validación del mínimo 0,1 ml por toma y reparto exacto en incrementos de trabajo de 0,1 ml.
- Sustituido el antiguo control Ca del 25 % por deriva prevista frente a incertidumbre estadística.
- Service Worker actualizado a v38.


## v39 — Correcciones funcionales e integradas
- Corrección de parámetros pasa de “incremento deseado” a `nivel actual → nivel objetivo`.
- La app calcula internamente la diferencia y la cantidad exacta de Xepta KH+, Aquaforest MG Plus o Aquaforest Ca Plus.
- El botón cambia a `Aplicar corrección`; nada entra en el modelo hasta que el usuario confirma que la corrección se realizó físicamente.
- El nivel actual se almacena como medición real de referencia si no existe ya una medición de ese parámetro en la misma fecha/hora.
- El nivel objetivo NO se almacena como medición real; queda como objetivo de la intervención.
- Se crea un ledger estructurado `parameterCorrections` que pasa a ser parte del motor matemático.
- KH y Ca incorporan el efecto de las correcciones en el cálculo de consumo, mantenimiento y predicción.
- Las predicciones parten del último valor medido más cualquier corrección aplicada posteriormente y aún no confirmada por una nueva medición.
- Las gráficas de KH, Ca y Mg muestran marcadores rosas en el momento de cada corrección, sin representar el objetivo como lectura real.
- Los resúmenes de gráfica indican cuántas correcciones ocurrieron en el periodo.
- Se migran automáticamente las correcciones estructuradas de v38.
- Service Worker actualizado a v39.

## v40 — Clarificación de la corrección KH+
- La fórmula matemática de Xepta KH+ se mantiene: `g = ΔKH × volumen / 30`.
- Para 300 L: 15 g = +1,5 dKH; 10 g = +1,0 dKH.
- La calculadora muestra ahora la equivalencia completa para evitar confundir la dosis de +1,5 dKH con la de +1,0 dKH.
- No se altera la lógica de consumo, eventos ni mantenimiento.
- Service Worker actualizado a v40.

## v41 — Modal Registro de evento corregido
- El modal queda centrado y limitado siempre al alto visible del móvil.
- La cabecera y el botón `Guardar evento` permanecen visibles.
- Solo la zona central del formulario hace scroll.
- Se respetan las safe areas superior e inferior.
- Se adapta también a pantallas bajas y al teclado virtual mediante `dvh/svh`.
- No se modifica ninguna matemática ni lógica de eventos.
- Service Worker actualizado a v41.

## v42 — Robustez matemática y lógica
- Inicio separa medición real de estado estimado tras una corrección.
- Dosificación intradía por tomas discretas, según repartos y ventana horaria configurada.
- Snapshots de dosis guardan cantidad, repartos y horarios.
- Histéresis basada en incertidumbre: los cambios posteriores del mantenimiento requieren dos mediciones KH independientes.
- 0,1 ml se conserva como paso conservador del modelo; la ficha oficial confirma 0,1 ml como mínimo programable.
- Correcciones retroactivas usan el volumen histórico disponible.
- Correcciones requieren confirmación física en dos pasos, detectan duplicados y pueden anularse.
- Ca pierde confianza si la salinidad cambia >0,20 ppt; >0,50 ppt excluye el intervalo.
- Se elimina lógica muerta de predicción y del antiguo ajuste KH en Dosificación.
- Service Worker v42.
