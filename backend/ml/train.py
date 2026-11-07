"""Trains the dropout-risk model and writes ml/model.joblib and ml/REPORT.md.

    cd backend
    python -m ml.train

Reproducible: fixed seed for the data, the folds and the forest. It compares logistic regression and random
forest with 5-fold stratified cross-validation and keeps the model with the best RECALL (missing a child who is
about to leave is worse than a false alarm the admin can dismiss); ROC-AUC breaks ties.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from ml import synthetic
from ml.features import FEATURES

ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_DIR / "model.joblib"
REPORT_PATH = ML_DIR / "REPORT.md"
SCORING = ["accuracy", "precision", "recall", "f1", "roc_auc"]
MODEL_VERSION = "demo-1"


def candidates() -> dict:
    return {
        "logistic_regression": make_pipeline(
            StandardScaler(),
            LogisticRegression(class_weight="balanced", max_iter=1000, random_state=synthetic.SEED),
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=6,
            min_samples_leaf=10,
            class_weight="balanced",
            random_state=synthetic.SEED,
            n_jobs=1,
        ),
    }


def evaluate(X: np.ndarray, y: np.ndarray) -> dict[str, dict[str, float]]:
    folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=synthetic.SEED)
    results = {}
    for name, model in candidates().items():
        scores = cross_validate(model, X, y, cv=folds, scoring=SCORING)
        results[name] = {
            metric: round(float(np.mean(scores[f"test_{metric}"])), 3) for metric in SCORING
        } | {f"{metric}_std": round(float(np.std(scores[f"test_{metric}"])), 3) for metric in SCORING}
    return results


def choose(results: dict[str, dict[str, float]]) -> str:
    return max(results, key=lambda name: (results[name]["recall"], results[name]["roc_auc"]))


def healthy_reference(X: np.ndarray, y: np.ndarray) -> list[float]:
    """Typical values of players who stayed: used to explain which features push each prediction up."""
    return [round(float(v), 3) for v in np.median(X[y == 0], axis=0)]


def write_report(results: dict, chosen: str, size: int, positives: float) -> None:
    names = {"logistic_regression": "Regresión logística", "random_forest": "Random forest"}
    rows = "\n".join(
        f"| {names[n]} | {r['accuracy']:.3f} | {r['precision']:.3f} | {r['recall']:.3f} | {r['f1']:.3f} | {r['roc_auc']:.3f} |"
        for n, r in results.items()
    )
    REPORT_PATH.write_text(
        f"""# Reporte del modelo de riesgo de deserción ({MODEL_VERSION})

> **Modelo de demostración.** Se entrenó con {size} deportistas **sintéticos** (semilla {synthetic.SEED}, reglas en
> `ml/synthetic.py`) porque el club aún no tiene historial real de deserciones. Se reentrena con
> `python -m ml.train` cuando haya datos reales.

- Fecha: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} · scikit-learn {sklearn.__version__}
- Clase positiva (deserta): {positives:.1%} de los ejemplos
- Validación cruzada estratificada de 5 particiones (promedio)

| Modelo | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
{rows}

**Elegido: {names[chosen]}.** Criterio: mayor *recall* (no dejar pasar a un niño en riesgo; una falsa alarma solo
le cuesta al admin una llamada), y ROC-AUC como desempate. Ambos usan `class_weight="balanced"` porque hay menos
casos de deserción que de permanencia.

Variables: {', '.join(f'`{f}`' for f in FEATURES)}.

Niveles en el panel: bajo < 0,35 ≤ medio < 0,65 ≤ alto.
""",
        encoding="utf-8",
    )


def main() -> None:
    X, y = synthetic.generate()
    results = evaluate(X, y)
    chosen = choose(results)
    model = candidates()[chosen].fit(X, y)
    bundle = {
        "model": model,
        "name": chosen,
        "version": MODEL_VERSION,
        "features": FEATURES,
        "healthy_reference": healthy_reference(X, y),
        "metrics": results,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "synthetic": True,
        "sklearn_version": sklearn.__version__,
        "training_size": int(len(y)),
    }
    joblib.dump(bundle, MODEL_PATH, compress=3)
    write_report(results, chosen, len(y), float(y.mean()))
    print(json.dumps({"elegido": chosen, "metricas": results}, indent=2, ensure_ascii=False))
    print(f"Modelo guardado en {MODEL_PATH} ({MODEL_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
