# Reef Marine Control v75

Versión v75 revisada para que mediciones, intervenciones, consumo, Balling, inventario, alertas y gráficas deriven del mismo historial temporal.

## Cambios principales

- Las correcciones puntuales ya no crean pseudo-mediciones `correctionBaseline`. El valor previo y el efecto teórico quedan dentro del evento de corrección.
- Las gráficas distinguen mediciones reales de estados teóricos tras correcciones/cambios de agua. Los valores teóricos no aumentan la confianza hasta confirmarse con una medición real.
- El histórico precargado con contexto incompleto continúa visible, pero queda excluido del cálculo automático de consumo.
- El consumo robusto conserva valores negativos como diagnóstico; no los fuerza a cero. Un balance neto no positivo bloquea cambios automáticos de Balling.
- Normalización de KH/Ca/Mg a 35 ppt disponible en Historial. El motor de consumo combina normalización, Balling, correcciones y cambios de agua en el mismo intervalo.
- Rango de Mg fijo 1365–1395 ppm, separado de la incertidumbre del test (±15 ppm por defecto).
- Auditoría de intervalos de consumo: muestra cuáles se usan y por qué se excluyen los demás.
- Medición parcial: se puede registrar cualquier combinación de KH, Ca, Mg, NO3, PO4 y salinidad. KH sigue siendo el parámetro controlador del Balling, pero no es obligatorio en cada registro.
- Salinidad admite entrada en ppt o S.G.; internamente se conserva en ppt y se guarda el S.G. bruto cuando procede.
- Xepta Balanced Reef Salt: puede estimar KH/Ca/Mg del agua nueva escalando los rangos declarados a 33 ppt a la salinidad real preparada. Los valores medidos manualmente tienen prioridad.
- Recomendaciones automáticas de corrección KH/Ca/Mg desde la evaluación química, sin registrar nada hasta que el usuario confirme que lo aplicó físicamente.
- Inventario ampliado a Xepta KH+, Aquaforest Ca Plus y Aquaforest Mg Plus; las correcciones registradas descuentan producto automáticamente.
- H2Ocean P4 Pro: muestra reparto horario, separación aproximada, resolución 0,1 ml y la contribución de la precisión nominal del 0,5 %.
- Anulación auditable de mediciones, cambios de agua y cambios operativos v75 (volumen, método, programa y horarios cuando existe vínculo histórico). Los registros no se destruyen: se marcan como anulados y todo el modelo se reconstruye/recalcula.
- Versión de aplicación, meta HTML y caché PWA unificadas en v75.

## Constantes químicas

### Objetivos del acuario
- KH: 8.0–8.3 dKH (setpoint Balling 8.2)
- Ca: 420–430 ppm
- Mg: 1365–1395 ppm (objetivo 1380)
- NO3: 5–10 ppm
- PO4: 0.04–0.07 ppm
- Salinidad: 34.9–35.1 ppt (objetivo 35)

### Correcciones
- Xepta KH+: 5 g -> +1.5 dKH / 100 L.
- Aquaforest Ca Plus: 10 ml -> +15 ppm / 100 L; máximo 20 ml/100 L/día (+30 ppm/día).
- Aquaforest Mg Plus: 10 ml -> +7.5 ppm / 100 L; máximo +50 ppm/día.

### Xepta Reef Balance Next
- KH Part: 10 ml -> +1 dKH / 100 L.
- Calcium Part: 10 ml -> +6 ppm / 100 L.
- Trace Part: relación 1:1:1; no se asignan ppm de Mg.

### Xepta Balanced Reef Salt
Valores declarados a 33 ppt: KH 7.9–8.5, Ca 420–440 ppm y Mg 1320–1350 ppm. Al preparar a otra salinidad se usan únicamente como estimación escalada para el agua nueva, nunca como objetivos del acuario.
