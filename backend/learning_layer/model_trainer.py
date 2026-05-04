"""
model_trainer.py
────────────────
Trains ML models on feedback-derived datasets and persists versioned artifacts.

Strategy
--------
* Primary:  scikit-learn GradientBoostingClassifier / GradientBoostingRegressor
            (stdlib safe; no extra C extension required beyond scikit-learn)
* Optional: XGBoost / LightGBM — automatically used when installed
* Model artifacts are versioned with a timestamp suffix so rollback is possible
* A `model_registry.json` index tracks all available versions

Supported modes
---------------
  "classification"  →  predict *did the user improve?*  (precision / recall)
  "regression"      →  predict *how much will the score change?* (MAE / RMSE)

Usage (standalone)
------------------
    from learning_layer.model_trainer import ModelTrainer
    from learning_layer.dataset_builder import DatasetBuilder

    ds = DatasetBuilder("feedback_logs.jsonl")
    trainer = ModelTrainer()
    result = trainer.train(ds.build_training_set(mode="classification"))
    print(result)  # {"status": "ok", "accuracy": 0.87, ...}
"""

import os
import pickle
import json
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────
_BASE_DIR       = os.path.dirname(__file__)
MODEL_PATH      = os.path.join(_BASE_DIR, "trained_model.pkl")   # latest symlink
REGISTRY_PATH   = os.path.join(_BASE_DIR, "model_registry.json")
MODELS_DIR      = os.path.join(_BASE_DIR, "model_versions")

# ──────────────────────────────────────────────────────────────────────────────
# Minimum samples to allow training
# ──────────────────────────────────────────────────────────────────────────────
MIN_TRAIN_SAMPLES = 10


# ══════════════════════════════════════════════════════════════════════════════

class ModelTrainer:
    """
    Trains, evaluates, and persists ML models for the inference engine.

    Parameters
    ----------
    mode : "classification" | "regression"
        Task type. Controls which estimator family is instantiated.
    """

    def __init__(self, mode: str = "classification") -> None:
        self.mode = mode
        os.makedirs(MODELS_DIR, exist_ok=True)

    # ── Public API ─────────────────────────────────────────────────────────

    def train(self, dataset: dict) -> dict:
        """
        Train a model on a dataset dict produced by DatasetBuilder.

        Returns a result dict with status, metrics, and model path.
        """
        X_train = dataset.get("features",  [])
        y_train = dataset.get("labels",    [])
        X_val   = dataset.get("val_features", [])
        y_val   = dataset.get("val_labels",   [])

        if len(X_train) < MIN_TRAIN_SAMPLES:
            msg = (
                f"Only {len(X_train)} training samples (need {MIN_TRAIN_SAMPLES}). "
                "Deferring to heuristic predictor."
            )
            logger.warning(msg)
            return {"status": "aborted", "reason": msg, "model_path": None}

        try:
            estimator = self._build_estimator()
            estimator.fit(X_train, y_train)

            metrics = self._evaluate(estimator, X_train, y_train, X_val, y_val)

            # Persist versioned artifact
            version_tag = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            versioned_path = os.path.join(MODELS_DIR, f"model_{version_tag}.pkl")
            artifact = self._build_artifact(estimator, version_tag, metrics, dataset)

            with open(versioned_path, "wb") as fh:
                pickle.dump(artifact, fh, protocol=pickle.HIGHEST_PROTOCOL)

            # Overwrite the "latest" pointer
            with open(MODEL_PATH, "wb") as fh:
                pickle.dump(artifact, fh, protocol=pickle.HIGHEST_PROTOCOL)

            self._update_registry(version_tag, versioned_path, metrics)

            logger.info(
                "Model trained successfully | version=%s | train_acc=%.3f",
                version_tag, metrics.get("train_score", 0),
            )
            return {
                "status":       "ok",
                "version":      version_tag,
                "model_path":   versioned_path,
                "estimator":    type(estimator).__name__,
                "mode":         self.mode,
                "train_samples": len(X_train),
                "val_samples":   len(X_val),
                **metrics,
            }

        except Exception as exc:
            logger.error("Training failed: %s", exc, exc_info=True)
            return {"status": "error", "reason": str(exc), "model_path": None}

    def list_versions(self) -> list[dict]:
        """Return all registered model versions from the registry."""
        if not os.path.exists(REGISTRY_PATH):
            return []
        with open(REGISTRY_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh).get("versions", [])

    def rollback_to(self, version_tag: str) -> bool:
        """
        Overwrite the 'latest' model pointer with a specific historic version.
        Useful when a new training run degrades performance.
        """
        target_path = os.path.join(MODELS_DIR, f"model_{version_tag}.pkl")
        if not os.path.exists(target_path):
            logger.error("Version %s not found at %s", version_tag, target_path)
            return False
        try:
            with open(target_path, "rb") as fh:
                artifact = pickle.load(fh)
            with open(MODEL_PATH, "wb") as fh:
                pickle.dump(artifact, fh, protocol=pickle.HIGHEST_PROTOCOL)
            logger.info("Rolled back to model version %s", version_tag)
            return True
        except Exception as exc:
            logger.error("Rollback failed: %s", exc)
            return False

    # ── Private helpers ────────────────────────────────────────────────────

    def _build_estimator(self):
        """
        Attempt to use XGBoost first (best performance), then LightGBM,
        then fall back to scikit-learn GradientBoosting (always available).
        """
        if self.mode == "classification":
            return self._best_classifier()
        else:
            return self._best_regressor()

    def _best_classifier(self):
        try:
            from xgboost import XGBClassifier
            logger.info("Using XGBoost classifier")
            return XGBClassifier(
                n_estimators=150,
                max_depth=4,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                use_label_encoder=False,
                eval_metric="logloss",
                random_state=42,
                verbosity=0,
            )
        except ImportError:
            pass

        try:
            from lightgbm import LGBMClassifier
            logger.info("Using LightGBM classifier")
            return LGBMClassifier(
                n_estimators=150,
                max_depth=4,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
                verbose=-1,
            )
        except ImportError:
            pass

        from sklearn.ensemble import GradientBoostingClassifier
        logger.info("Using sklearn GradientBoostingClassifier (fallback)")
        return GradientBoostingClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
        )

    def _best_regressor(self):
        try:
            from xgboost import XGBRegressor
            logger.info("Using XGBoost regressor")
            return XGBRegressor(
                n_estimators=150,
                max_depth=4,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                verbosity=0,
            )
        except ImportError:
            pass

        try:
            from lightgbm import LGBMRegressor
            logger.info("Using LightGBM regressor")
            return LGBMRegressor(
                n_estimators=150,
                max_depth=4,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
                verbose=-1,
            )
        except ImportError:
            pass

        from sklearn.ensemble import GradientBoostingRegressor
        logger.info("Using sklearn GradientBoostingRegressor (fallback)")
        return GradientBoostingRegressor(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
        )

    def _evaluate(
        self,
        model,
        X_train: list, y_train: list,
        X_val:   list, y_val:   list,
    ) -> dict:
        """Compute train + validation metrics depending on task mode."""
        metrics: dict = {}
        try:
            train_score = model.score(X_train, y_train)
            metrics["train_score"] = round(train_score, 4)

            if X_val and y_val:
                val_score = model.score(X_val, y_val)
                metrics["val_score"] = round(val_score, 4)

                if self.mode == "classification":
                    # Precision / recall require sklearn
                    try:
                        from sklearn.metrics import classification_report
                        y_pred = model.predict(X_val)
                        report = classification_report(y_val, y_pred, output_dict=True, zero_division=0)
                        metrics["val_precision"] = round(report.get("1", {}).get("precision", 0.0), 4)
                        metrics["val_recall"]    = round(report.get("1", {}).get("recall",    0.0), 4)
                        metrics["val_f1"]        = round(report.get("1", {}).get("f1-score",  0.0), 4)
                    except Exception:
                        pass
                else:
                    # MAE for regression
                    try:
                        from sklearn.metrics import mean_absolute_error
                        y_pred = model.predict(X_val)
                        metrics["val_mae"] = round(float(mean_absolute_error(y_val, y_pred)), 4)
                    except Exception:
                        pass
        except Exception as exc:
            logger.warning("Metric computation partially failed: %s", exc)

        return metrics

    def _build_artifact(
        self,
        estimator,
        version_tag: str,
        metrics: dict,
        dataset: dict,
    ) -> dict:
        """Package model + metadata into a single picklable dict."""
        return {
            "model":            estimator,
            "version":          version_tag,
            "mode":             self.mode,
            "estimator_type":   type(estimator).__name__,
            "trained_at":       datetime.now(timezone.utc).isoformat(),
            "train_samples":    len(dataset.get("features", [])),
            "feature_dim":      len(dataset["features"][0]) if dataset.get("features") else 0,
            "metrics":          metrics,
        }

    def _update_registry(self, version_tag: str, path: str, metrics: dict) -> None:
        """Append this version to the JSON registry index."""
        registry: dict = {"versions": []}
        if os.path.exists(REGISTRY_PATH):
            try:
                with open(REGISTRY_PATH, "r", encoding="utf-8") as fh:
                    registry = json.load(fh)
            except Exception:
                pass

        registry["versions"].append({
            "version":     version_tag,
            "path":        path,
            "mode":        self.mode,
            "trained_at":  datetime.now(timezone.utc).isoformat(),
            "metrics":     metrics,
        })
        registry["latest"] = version_tag

        with open(REGISTRY_PATH, "w", encoding="utf-8") as fh:
            json.dump(registry, fh, indent=2)
