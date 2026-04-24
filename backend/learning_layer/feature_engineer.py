"""
feature_engineer.py
───────────────────
Transforms raw intelligence profile data into a dense, normalized
numerical feature vector ready for XGBoost / LightGBM / Neural Net input.

Feature Set (12 dimensions)
────────────────────────────
 [0]  avg_skill_score         – mean score across all skills
 [1]  weakest_skill_score     – minimum skill score (hardest gap)
 [2]  strongest_skill_score   – maximum skill score (confidence anchor)
 [3]  skill_score_std         – score standard deviation (breadth vs. depth)
 [4]  learning_velocity       – temporal delta per interaction epoch
 [5]  learning_acceleration   – second derivative (is growth accelerating?)
 [6]  consistency_score       – behavioral consistency from practice engine
 [7]  accuracy_score          – correct / total across practice attempts
 [8]  graph_gap_depth         – number of dependency gaps in the KG
 [9]  time_spent_normalised   – log-scaled hours (capped at 1.0)
[10]  attempts_normalised     – log-scaled attempt count (capped at 1.0)
[11]  weak_area_ratio         – weak_areas / total_skills  (0..1)

Design principles
-----------------
* Stateless pure function – no side effects, easy to unit-test
* All outputs clamped to [0.0, 1.0] for stable gradient descent
* Graceful defaults – never raises; missing sub-fields resolve to 0.0
* FeatureNames export kept in sync with the vector index for explainability
"""

import math
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Feature registry — keeps names aligned with indices
# ──────────────────────────────────────────────────────────────────────────────
FEATURE_NAMES: list[str] = [
    "avg_skill_score",
    "weakest_skill_score",
    "strongest_skill_score",
    "skill_score_std",
    "learning_velocity",
    "learning_acceleration",
    "consistency_score",
    "accuracy_score",
    "graph_gap_depth",
    "time_spent_normalised",
    "attempts_normalised",
    "weak_area_ratio",
]

FEATURE_DIM = len(FEATURE_NAMES)


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────


def engineer_features(
    intelligence_profile: dict,
    graph_insights: Optional[dict] = None,
) -> list[float]:
    """
    Transform a fully-assembled intelligence profile into a feature vector with normalization (PHASE 6).
    """
    if graph_insights is None:
        graph_insights = {}

    try:
        # ── 1. Skill vector statistics ─────────────────────────────────────
        skill_vector = intelligence_profile.get("skill_vector", {})
        scores = _extract_scores(skill_vector)

        avg_skill       = _safe_mean(scores)
        weakest_skill   = min(scores) if scores else 0.0
        strongest_skill = max(scores) if scores else 0.0
        std_skill       = _safe_std(scores, avg_skill)

        # ── 2. Temporal progression ────────────────────────────────────────
        trajectory  = intelligence_profile.get("trajectory") or \
                      intelligence_profile.get("progression", {})

        velocity     = float(trajectory.get("velocity",     0.0))
        acceleration = float(trajectory.get("acceleration", 0.0))

        # Clamp: velocity can be negative (regression); map to [0, 1]
        velocity_norm     = _clamp(0.5 + velocity,     0.0, 1.0)
        acceleration_norm = _clamp(0.5 + acceleration, 0.0, 1.0)

        # ── 3. Behavioral metrics ──────────────────────────────────────────
        behavior    = intelligence_profile.get("behavior", {})
        consistency = _clamp(float(behavior.get("consistency", 0.0)), 0.0, 1.0)
        accuracy    = _clamp(float(behavior.get("accuracy",    0.0)), 0.0, 1.0)

        weak_areas   = behavior.get("weak_areas",  [])
        strong_areas = behavior.get("strong_areas", [])
        total_areas  = len(weak_areas) + len(strong_areas)
        weak_ratio   = _clamp(len(weak_areas) / total_areas, 0.0, 1.0) if total_areas else 0.5

        # ── 4. Knowledge-graph insights ────────────────────────────────────
        expanded_gaps = graph_insights.get("expanded_gaps",   [])
        root_gaps     = graph_insights.get("root_cause_gaps", [])
        gap_depth     = float(len(expanded_gaps) + len(root_gaps))
        
        # Normalize gap_depth (cap at 10 for normalization purposes)
        gap_depth_norm = _clamp(gap_depth / 10.0, 0.0, 1.0)

        # ── 5. Practice / time features (from behavior or feedback log) ────
        time_spent = float(intelligence_profile.get("time_spent_hours", 0.0))
        attempts   = float(intelligence_profile.get("attempts",          0.0))

        time_norm    = _clamp(_log_scale(time_spent,  100.0), 0.0, 1.0)
        attempt_norm = _clamp(_log_scale(attempts,    200.0), 0.0, 1.0)

        # ── Assemble vector ────────────────────────────────────────────────
        vector = [
            round(avg_skill,         4),   # [0]
            round(weakest_skill,     4),   # [1]
            round(strongest_skill,   4),   # [2]
            round(std_skill,         4),   # [3]
            round(velocity_norm,     4),   # [4]
            round(acceleration_norm, 4),   # [5]
            round(consistency,       4),   # [6]
            round(accuracy,          4),   # [7]
            round(gap_depth_norm,    4),   # [8]  Normalized integer count (PHASE 6)
            round(time_norm,         4),   # [9]
            round(attempt_norm,      4),   # [10]
            round(weak_ratio,        4),   # [11]
        ]

        logger.info(f"Engineered Features (PHASE 6 Stable): {vector}")
        
        assert len(vector) == FEATURE_DIM, f"Feature dim mismatch: {len(vector)}"
        return vector

    except Exception as exc:
        logger.error("Feature engineering failed: %s — returning zeros.", exc, exc_info=True)
        return [0.0] * FEATURE_DIM

    except Exception as exc:
        logger.error("Feature engineering failed: %s — returning zeros.", exc, exc_info=True)
        return [0.0] * FEATURE_DIM


def explain_features(feature_vector: list[float]) -> dict:
    """
    Return a human-readable dict mapping feature names to their values.
    Used by the explainability / dashboard layer.
    """
    if len(feature_vector) != FEATURE_DIM:
        return {"error": f"Expected {FEATURE_DIM} features, got {len(feature_vector)}"}
    return dict(zip(FEATURE_NAMES, feature_vector))


def features_from_feedback_record(record: dict) -> list[float]:
    """
    Reconstruct features from a raw feedback log record.
    Used by DatasetBuilder when pre-engineered features are absent.
    """
    synthesised_profile = {
        "skill_vector": {},
        "trajectory":   {
            "velocity":     record.get("learning_velocity", 0.0),
            "acceleration": 0.0,
        },
        "behavior": {
            "consistency": record.get("consistency",   0.0),
            "accuracy":    record.get("accuracy",      0.0),
            "weak_areas":  record.get("weak_areas_after",  []),
            "strong_areas": [],
        },
        "time_spent_hours": record.get("time_spent_hours", 0.0),
        "attempts":         record.get("attempts",          0),
    }
    # Use after_score as a proxy for avg skill
    after  = record.get("after_score",  0.0)
    before = record.get("before_score", 0.0)
    synthesised_profile["skill_vector"] = {
        "overall": {"score": after, "confidence": after, "stability": 0.5}
    }
    return engineer_features(synthesised_profile, {
        "expanded_gaps":   ["gap"] * record.get("graph_gap_depth", 0),
        "root_cause_gaps": [],
    })


# ──────────────────────────────────────────────────────────────────────────────
# Utility helpers
# ──────────────────────────────────────────────────────────────────────────────

def _extract_scores(skill_vector: dict) -> list[float]:
    """Pull numeric scores from a skill-vector dict, handling nested or flat dicts."""
    scores = []
    for val in skill_vector.values():
        if isinstance(val, dict):
            scores.append(float(val.get("score", 0.0)))
        elif isinstance(val, (int, float)):
            scores.append(float(val))
    return scores or [0.0]


def _safe_mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _safe_std(values: list[float], mean: float) -> float:
    if len(values) < 2:
        return 0.0
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return min(math.sqrt(variance), 1.0)


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _log_scale(value: float, cap: float) -> float:
    """Map [0, cap] → [0, 1] using a log scale so small values register."""
    if value <= 0:
        return 0.0
    return math.log1p(value) / math.log1p(cap)
