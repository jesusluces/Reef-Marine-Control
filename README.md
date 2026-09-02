# Reef Marine Control v69

Versión reconstruida a partir de v68.

## Química fija

### Objetivos del acuario
- KH: 8.0–8.3 dKH (setpoint Balling interno: 8.2)
- Ca: 420–430 ppm
- Mg: 1380 ppm
- NO3: 5–10 ppm
- PO4: 0.04–0.07 ppm
- Salinidad: 35 ppt

### Correcciones puntuales
- Xepta KH+: 5 g -> +1.5 dKH en 100 L.
- Aquaforest Mg Plus: 10 ml -> +7.5 ppm en 100 L. Máximo +50 ppm/día.
- Aquaforest Ca Plus: 10 ml -> +15 ppm en 100 L. Máximo 20 ml/100 L/día (equivale a +30 ppm/día).

Las correcciones puntuales están disponibles tanto con mantenimiento Manual como con Balling activo. No cambian el método activo ni la dosis 1:1:1. Se registran como intervenciones externas y el motor las descuenta en los intervalos de consumo.

### Xepta Reef Balance Next
- KH Part: 10 ml -> +1 dKH en 100 L.
- Calcium Part: 10 ml -> +6 ppm en 100 L.
- Trace Part: se mantiene 1:1:1. No se inventa una equivalencia ppm de Mg y no se usa para corregir Mg.

## Balanced Reef Salt
La composición declarada a 33 ppt (KH 7.9–8.5, Ca 420–440, Mg 1320–1350) se considera información del agua nueva, no objetivos del acuario y no se escala para decidir si el acuario está correcto.

## Seguridad y datos
- Una corrección de Ca/Mg que exceda el máximo diario muestra el total teórico pero solo permite registrar el tramo diario seguro.
- Después de una corrección se exige nueva medición del mismo parámetro antes de repetirla.
- Un cambio del programa Balling solo se registra después de confirmación física y una recomendación estable confirmada por una medición posterior.
- Persistencia local con copia de seguridad rotatoria y verificación de escritura.
- Exportación/importación JSON desde Ajustes.
- Service Worker y manifest incluidos para funcionamiento PWA/offline de recursos locales.


## v73
- Las etiquetas de valor de las gráficas usan círculo lavanda pastel y números turquesa intenso.
- En modo Corrección Manual se elimina el acceso duplicado “Corrección puntual”; queda únicamente el panel “Mantenimiento manual” con “Registrar corrección”.
- En modo Xepta Reef Balance Next el acceso a correcciones puntuales continúa visible y no desactiva Balling.
- Se corrigió el texto informativo de evaluación química para reflejar los objetivos fijos actuales.


## v73
- La gráfica de Inicio “Evolución KH” muestra las últimas 7 mediciones reales de KH, independientemente de su antigüedad.
- Se mantiene el histórico y almacenamiento de v71/v72 para no perder datos al actualizar.


## v74
- Histórico precargado corregido: 14 mediciones entre 08/05/2026 y 02/09/2026.
- Todas las mediciones históricas conservan salinidad original 1.025 S.G.
- La migración sustituye solo el histórico precargado anterior y conserva mediciones creadas por el usuario.
- Círculos de valores de las gráficas ligeramente más pequeños.
