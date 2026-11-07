# Reporte del modelo de riesgo de deserción (demo-1)

> **Modelo de demostración.** Se entrenó con 2000 deportistas **sintéticos** (semilla 42, reglas en
> `ml/synthetic.py`) porque el club aún no tiene historial real de deserciones. Se reentrena con
> `python -m ml.train` cuando haya datos reales.

- Fecha: 2026-11-07 22:50 UTC · scikit-learn 1.9.1
- Clase positiva (deserta): 27.7% de los ejemplos
- Validación cruzada estratificada de 5 particiones (promedio)

| Modelo | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Regresión logística | 0.847 | 0.702 | 0.791 | 0.743 | 0.899 |
| Random forest | 0.843 | 0.695 | 0.776 | 0.733 | 0.889 |

**Elegido: Regresión logística.** Criterio: mayor *recall* (no dejar pasar a un niño en riesgo; una falsa alarma solo
le cuesta al admin una llamada), y ROC-AUC como desempate. Ambos usan `class_weight="balanced"` porque hay menos
casos de deserción que de permanencia.

Variables: `attendance_rate_30`, `attendance_rate_60`, `consecutive_absences`, `overdue_months`, `rejected_payments`, `tenure_months`, `age`, `trains_morning`, `full_day_school`.

Niveles en el panel: bajo < 0,35 ≤ medio < 0,65 ≤ alto.
