"""Loads the saved model (lazily: scikit-learn is only imported the first time the admin opens the risk panel,
so the API keeps its low memory on Render's free plan) and explains each prediction.

Explanation (model-agnostic): for each feature, the value is replaced by the typical value of players who stayed
(`healthy_reference`, saved at training time) and the drop in risk is measured in log-odds (logit). Log-odds are
used instead of probability because near 0.99 a probability barely moves even when a factor is decisive. The 2-3
features with the biggest drop are the ones that weigh most for that player.
"""
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

from ml.features import FEATURE_LABELS, FEATURES, PlayerFeatures

MODEL_PATH = Path(__file__).resolve().parent / "model.joblib"

LOW_BELOW = 0.35
HIGH_FROM = 0.65
MIN_IMPACT = 0.15  # log-odds; smaller contributions are not shown
EPSILON = 1e-6
MAX_FACTORS = 3


class ModelUnavailable(RuntimeError):
    pass


@dataclass(frozen=True)
class Factor:
    feature: str
    label: str
    detail: str
    impact: float


@dataclass(frozen=True)
class Prediction:
    probability: float
    level: str
    factors: list[Factor]


def level_for(probability: float) -> str:
    if probability >= HIGH_FROM:
        return "high"
    if probability >= LOW_BELOW:
        return "medium"
    return "low"


def describe(feature: str, value: float) -> str:
    n = int(round(value))
    match feature:
        case "attendance_rate_30":
            return f"Asistencia de {round(value * 100)} % en los últimos 30 días"
        case "attendance_rate_60":
            return f"Asistencia de {round(value * 100)} % en los últimos 60 días"
        case "consecutive_absences":
            return f"{n} falta(s) seguida(s) en los últimos entrenamientos"
        case "overdue_months":
            return f"{n} mes(es) de mensualidad en mora"
        case "rejected_payments":
            return f"{n} pago(s) rechazado(s)"
        case "tenure_months":
            return f"Lleva {n} mes(es) en el club (los nuevos se retiran más)"
        case "age":
            return f"Tiene {n} años (los adolescentes abandonan más)"
        case "trains_morning":
            return "Entrena en la jornada de la mañana"
        case "full_day_school":
            return "Colegio de jornada única (menos entrenamientos disponibles)"
    return FEATURE_LABELS.get(feature, feature)


class RiskModel:
    _instance: "RiskModel | None" = None
    _lock = Lock()

    def __init__(self, bundle: dict):
        if bundle.get("features") != FEATURES:
            raise ModelUnavailable("El modelo guardado no corresponde a las variables actuales; reentrénalo.")
        self.bundle = bundle
        self.model = bundle["model"]
        self.reference = bundle["healthy_reference"]

    @classmethod
    def get(cls, path: Path = MODEL_PATH) -> "RiskModel":
        with cls._lock:
            if cls._instance is None:
                try:
                    import joblib  # imported here on purpose (memory, see module docstring)

                    cls._instance = cls(joblib.load(path))
                except (ImportError, FileNotFoundError, OSError) as error:
                    raise ModelUnavailable(f"El modelo de riesgo no está disponible en el servidor ({error}).") from error
            return cls._instance

    def info(self) -> dict:
        name = self.bundle["name"]
        return {
            "name": name,
            "version": self.bundle["version"],
            "synthetic": self.bundle.get("synthetic", True),
            "trained_at": self.bundle["trained_at"],
            "training_size": self.bundle["training_size"],
            "metrics": {k: v for k, v in self.bundle["metrics"][name].items() if not k.endswith("_std")},
            "compared": {
                other: {k: v for k, v in metrics.items() if not k.endswith("_std")}
                for other, metrics in self.bundle["metrics"].items()
            },
        }

    def predict(self, rows: list[PlayerFeatures]) -> list[Prediction]:
        if not rows:
            return []
        import numpy as np

        def logit(p):
            p = np.clip(p, EPSILON, 1 - EPSILON)
            return np.log(p / (1 - p))

        X = np.array([row.vector() for row in rows], dtype=float)
        base = self.model.predict_proba(X)[:, 1]
        base_logit = logit(base)

        # Risk (log-odds) when each feature takes the "healthy" value, one feature at a time
        impacts = np.zeros_like(X)
        for column, healthy in enumerate(self.reference):
            altered = X.copy()
            altered[:, column] = healthy
            impacts[:, column] = base_logit - logit(self.model.predict_proba(altered)[:, 1])

        predictions = []
        for i, probability in enumerate(base):
            order = np.argsort(-impacts[i])
            factors = [
                Factor(
                    feature=FEATURES[j],
                    label=FEATURE_LABELS[FEATURES[j]],
                    detail=describe(FEATURES[j], X[i, j]),
                    impact=round(float(impacts[i, j]), 3),
                )
                for j in order[:MAX_FACTORS]
                if impacts[i, j] >= MIN_IMPACT
            ]
            predictions.append(Prediction(probability=round(float(probability), 3), level=level_for(float(probability)), factors=factors))
        return predictions
