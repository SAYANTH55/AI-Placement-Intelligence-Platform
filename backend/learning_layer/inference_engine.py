"""
inference_engine.py
────────────────────
Plug-and-play inference layer that replaces heuristic predition with
a trained ML model whenever one is available.

Behaviour matrix
────────────────
  Scenario                            Action
  ─────────────────────────────────── ───────────────────────────────────────
  Model trained, features OK          → ML inference (predict_proba / predict)
  Model not trained yet               → heuristic fallback + warning
  Model available but features bad    → heuristic fallback + error logged
  All fails (exception)               → safe default dict + error logged

Output contract (always returned)
──────────────────────────────────
  {
    "predicted_score":  float   [0.0, 1.0]
    "confidence":       float   [0.0, 1.0]
    "placement_prob":   float   [0.0, 1.0]   # P(improved) from classify head
    "time_to_ready":    str
    "risk_level":       str     "low" | "medium" | "high"
    "source":           str     "ml_trained_v{tag}" | "heuristic_fallback"
    "feature_explained": dict   name → value map
  }

Thread safety
─────────────
  The singleton hot-reloads the model pointer atomically — safe for concurrent
  FastAPI worker threads because dict assignment in CPython is GIL-protected.
"""

import os
import pickle
import logging
from typing import Optional

from .feature_engineer import FEATURE_NAMES, FEATURE_DIM

logger = logging.getLogger(__name__)

# ─── Paths (must match model_trainer.py) ──────────────────────────────────────
_BASE_DIR  = os.path.dirname(__file__)
MODEL_PATH = os.path.join(_BASE_DIR, "trained_model.pkl")


# ══════════════════════════════════════════════════════════════════════════════

class InferenceEngine:
    """
    Wrapper around a trained sklearn-compatible model artifact.

    The engine stays model-agnostic: any object that exposes
    `predict(X)` and optionally `predict_proba(X)` works.
    """

    def __init__(self) -> None:
        self._artifact: Optional[dict] = None
        self._load_model()

    # ── Public API ─────────────────────────────────────────────────────────

    def is_available(self) -> bool:
        """Returns True only when a *real* trained model is loaded."""
        return (
            self._artifact is not None
            and self._artifact.get("model") is not None
            and hasattr(self._artifact["model"], "predict")
        )

    def predict(self, features: list[float]) -> dict:
        """
        Run inference on a pre-engineered feature vector.

        Parameters
        ----------
        features : list[float]  — length must equal FEATURE_DIM (12)

        Returns
        -------
        Prediction dict (see module docstring for full contract).
        """
        if not self.is_available():
            logger.debug("ML model not available — using heuristic fallback.")
            return self._heuristic_fallback(features)

        # Validate dimension
        if len(features) != FEATURE_DIM:
            logger.warning(
                "Feature dimension mismatch: expected %d, got %d — falling back.",
                FEATURE_DIM, len(features),
            )
            return self._heuristic_fallback(features)

        try:
            return self._ml_predict(features)
        except Exception as exc:
            logger.error("ML inference crashed: %s — falling back.", exc, exc_info=True)
            return self._heuristic_fallback(features)

    def reload(self) -> bool:
        """Hot-reload the model from disk (called after training completes)."""
        return self._load_model()

    def model_info(self) -> dict:
        """Metadata about the currently loaded model artifact."""
        if not self._artifact:
            return {"status": "no_model", "source": "heuristic_fallback"}
        return {
            "status":        "loaded",
            "version":       self._artifact.get("version",        "unknown"),
            "estimator":     self._artifact.get("estimator_type", "unknown"),
            "mode":          self._artifact.get("mode",           "unknown"),
            "trained_at":    self._artifact.get("trained_at",     "unknown"),
            "train_samples": self._artifact.get("train_samples",  0),
            "feature_dim":   self._artifact.get("feature_dim",    0),
            "metrics":       self._artifact.get("metrics",        {}),
        }

    # ── Private: ML path ───────────────────────────────────────────────────

    def _ml_predict(self, features: list[float]) -> dict:
        """Full ML inference using predict_proba (if available) + predict."""
        model     = self._artifact["model"]
        mode      = self._artifact.get("mode", "classification")
        version   = self._artifact.get("version", "unknown")
        X         = [features]  # 2-D batch of 1

        placement_prob   = 0.0
        predicted_score  = 0.0
        confidence       = 0.0

        if mode == "classification":
            # predict_proba gives P(class=1) = P(improved)
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(X)[0]
                # proba shape: [P(0), P(1)]
                placement_prob  = float(proba[1]) if len(proba) > 1 else float(proba[0])
                confidence      = float(max(proba))          # certainty of any prediction
            else:
                raw = int(model.predict(X)[0])
                placement_prob = float(raw)
                confidence     = 0.70

            # Map classification probability → a score in [0, 1]
            # We blend: current avg skill (feat[0]) + improvement probability
            avg_skill       = features[0]
            predicted_score = _clamp(avg_skill * 0.6 + placement_prob * 0.4, 0.0, 1.0)

        else:  # regression — predicts the delta directly
            delta           = float(model.predict(X)[0])
            avg_skill       = features[0]
            predicted_score = _clamp(avg_skill + delta, 0.0, 1.0)
            placement_prob  = _clamp(predicted_score, 0.0, 1.0)
            confidence      = _estimate_regression_confidence(features)

        ttr, risk = _score_to_ttr_risk(predicted_score)

        # Uncertainty is inverse of confidence
        uncertainty = "low" if confidence > 0.8 else "medium" if confidence > 0.5 else "high"

        return {
            "predicted_score":   round(predicted_score, 3),
            "confidence":        round(confidence,       3),
            "uncertainty":       uncertainty,
            "placement_prob":    round(placement_prob,   3),
            "time_to_ready":     ttr,
            "risk_level":        risk,
            "source":            f"ml_trained_v{version}",
            "feature_explained": dict(zip(FEATURE_NAMES, features)),
        }

    # ── Private: heuristic fallback ────────────────────────────────────────

    def _heuristic_fallback(self, features: list[float]) -> dict:
        """
        Rule-based prediction when the ML model is not available.
        Mirrors the logic in HeuristicPredictor so scores are comparable.
        """
        # Feature layout — see feature_engineer.py
        avg_skill    = features[0] if len(features) > 0 else 0.5
        weakest      = features[1] if len(features) > 1 else 0.5
        velocity     = features[4] if len(features) > 4 else 0.5   # norm [0,1]
        consistency  = features[6] if len(features) > 6 else 0.5
        accuracy     = features[7] if len(features) > 7 else 0.5
        gap_depth    = features[8] if len(features) > 8 else 0.0

        # Gap penalty: deeper dependency gaps hurt more
        gap_penalty      = min(gap_depth * 0.03, 0.25)
        velocity_boost   = (velocity - 0.5) * 0.15    # velocity > 0.5 → positive

        predicted_score  = _clamp(
            avg_skill * 0.45
            + weakest * 0.15
            + consistency * 0.20
            + accuracy * 0.20
            + velocity_boost
            - gap_penalty,
            0.0, 1.0,
        )

        confidence  = _clamp(consistency * 0.5 + accuracy * 0.5, 0.0, 1.0)
        uncertainty = "high" if confidence < 0.4 else "medium" if confidence < 0.7 else "low"
        ttr, risk   = _score_to_ttr_risk(predicted_score)

        return {
            "predicted_score":   round(predicted_score, 3),
            "confidence":        round(confidence,       3),
            "uncertainty":       uncertainty,
            "placement_prob":    round(predicted_score,  3),
            "time_to_ready":     ttr,
            "risk_level":        risk,
            "source":            "heuristic_fallback",
            "feature_explained": dict(zip(FEATURE_NAMES, features)) if len(features) == FEATURE_DIM else {},
        }

    # ── Private: model loading ─────────────────────────────────────────────

    def _load_model(self) -> bool:
        if not os.path.exists(MODEL_PATH):
            logger.debug("No trained model artifact found at %s", MODEL_PATH)
            return False
        try:
            with open(MODEL_PATH, "rb") as fh:
                artifact = pickle.load(fh)

            # Validate the loaded artifact has a usable model
            if not isinstance(artifact, dict) or "model" not in artifact:
                logger.warning("Model artifact malformed — ignoring.")
                return False

            self._artifact = artifact
            logger.info(
                "ML model loaded | version=%s | estimator=%s",
                artifact.get("version", "?"),
                artifact.get("estimator_type", "?"),
            )
            return True
        except Exception as exc:
            logger.error("Failed to load model artifact: %s", exc, exc_info=True)
            return False


# ──────────────────────────────────────────────────────────────────────────────
# Module-level utilities
# ──────────────────────────────────────────────────────────────────────────────

def _score_to_ttr_risk(score: float) -> tuple[str, str]:
    """Deterministic placement readiness classification from a 0-1 score."""
    if score >= 0.85:
        return "Ready Now",      "low"
    elif score >= 0.70:
        return "2-4 weeks",      "low"
    elif score >= 0.55:
        return "4-8 weeks",      "medium"
    elif score >= 0.40:
        return "2-3 months",     "medium"
    else:
        return "3+ months",      "high"


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _estimate_regression_confidence(features: list[float]) -> float:
    """
    For regression mode: estimate confidence from consistency + accuracy
    since predict_proba is not available.
    """
    consistency = features[6] if len(features) > 6 else 0.5
    accuracy    = features[7] if len(features) > 7 else 0.5
    return _clamp(consistency * 0.5 + accuracy * 0.5, 0.1, 0.95)


# ─── Module-level singleton ────────────────────────────────────────────────────
inference_engine = InferenceEngine()
