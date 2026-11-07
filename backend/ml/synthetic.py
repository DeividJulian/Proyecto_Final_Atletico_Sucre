"""SYNTHETIC demo dataset for the dropout-risk model.

The club has no history of real dropouts yet, so the first model is trained on generated players. The data is
NOT real: it encodes, with a fixed seed, the rules the coaching staff described as warning signs. When the club
has real history (players who left), `train.py` is re-run with that data and this file is no longer used.

Generation rules (all documented here and in the README):
1. Features are drawn from plausible ranges for a youth football school (ages 4-16, 0-36 months in the club,
   attendance mostly between 50 % and 100 %, few overdue months).
2. About 30 % of the players are "disengaging": lower attendance, longer absence streaks, more overdue fees.
3. A latent risk score combines the warning signs with these weights (log-odds):
       +4.0 × (1 - attendance last 30 days)      low recent attendance is the strongest signal
       +1.5 × (1 - attendance last 60 days)
       +0.45 × consecutive absences (max 6)
       +0.55 × overdue months (max 6)
       +0.40 × rejected payments
       -0.05 × months in the club                 new players leave more often
       +0.12 × (age - 10)                         teenagers leave more often than children
       +0.20 × trains in the morning
       +0.30 × full-day school (fewer sessions available)
       -3.1                                        intercept, so that roughly a quarter of players drop out
   plus gaussian noise (sd 0.6), so the problem is not trivially separable.
4. The label "dropped out" is drawn from Bernoulli(sigmoid(score)).
"""
import numpy as np

from ml.features import FEATURES

SEED = 42
DEFAULT_SIZE = 2000

WEIGHTS = {
    "attendance_gap_30": 4.0,
    "attendance_gap_60": 1.5,
    "consecutive_absences": 0.45,
    "overdue_months": 0.55,
    "rejected_payments": 0.40,
    "tenure_months": -0.05,
    "age_over_10": 0.12,
    "trains_morning": 0.20,
    "full_day_school": 0.30,
}
INTERCEPT = -3.1
NOISE_SD = 0.6


def generate(size: int = DEFAULT_SIZE, seed: int = SEED) -> tuple[np.ndarray, np.ndarray]:
    """Returns (X, y): X has one row per synthetic player with the columns of FEATURES; y is 1 = dropped out."""
    rng = np.random.default_rng(seed)
    disengaging = rng.random(size) < 0.30

    attendance_60 = np.where(disengaging, rng.beta(4, 3, size), rng.beta(9, 1.6, size))
    # Recent attendance moves around the 60-day value, worse for the disengaging group
    attendance_30 = np.clip(attendance_60 + rng.normal(np.where(disengaging, -0.12, 0.02), 0.10, size), 0, 1)
    consecutive = np.minimum(rng.poisson(np.where(disengaging, 2.2, 0.4)), 8)
    overdue = np.minimum(rng.poisson(np.where(disengaging, 1.6, 0.25)), 8)
    rejected = np.minimum(rng.poisson(np.where(disengaging, 0.5, 0.08)), 4)
    tenure = rng.integers(0, 37, size)
    age = rng.integers(4, 17, size)
    trains_morning = (rng.random(size) < 0.45).astype(int)
    full_day = (rng.random(size) < 0.10).astype(int)

    score = (
        INTERCEPT
        + WEIGHTS["attendance_gap_30"] * (1 - attendance_30)
        + WEIGHTS["attendance_gap_60"] * (1 - attendance_60)
        + WEIGHTS["consecutive_absences"] * np.minimum(consecutive, 6)
        + WEIGHTS["overdue_months"] * np.minimum(overdue, 6)
        + WEIGHTS["rejected_payments"] * rejected
        + WEIGHTS["tenure_months"] * tenure
        + WEIGHTS["age_over_10"] * (age - 10)
        + WEIGHTS["trains_morning"] * trains_morning
        + WEIGHTS["full_day_school"] * full_day
        + rng.normal(0, NOISE_SD, size)
    )
    probability = 1 / (1 + np.exp(-score))
    y = (rng.random(size) < probability).astype(int)

    columns = {
        "attendance_rate_30": np.round(attendance_30, 3),
        "attendance_rate_60": np.round(attendance_60, 3),
        "consecutive_absences": consecutive,
        "overdue_months": overdue,
        "rejected_payments": rejected,
        "tenure_months": tenure,
        "age": age,
        "trains_morning": trains_morning,
        "full_day_school": full_day,
    }
    X = np.column_stack([columns[name] for name in FEATURES]).astype(float)
    return X, y
