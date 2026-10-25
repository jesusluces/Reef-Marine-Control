# Cambios

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
