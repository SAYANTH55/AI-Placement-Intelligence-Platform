"""
dataset_builder.py
──────────────────
Converts raw feedback JSONL logs into ML-ready feature matrices.

Pipeline
--------
  JSONL logs
    → parse & validate
    → clean (remove nulls, outliers)
    → aggregate per user (optional)
    → dual-label generation
        • binary  : 1 if delta >= 0.05 else 0   (readiness classification)
        • regression: delta itself               (score improvement magnitude)
    → train / validation split
    → return typed Dataset

Design principles
-----------------
* Pure Python + numpy-only (no pandas dependency required)
* Supports both classification and regression targets
* Reproducible: caller controls random seed
* All transformations are logged for auditability
"""

import json
import os
import random
import logging
from typing import Optional

# Import canonical dimension so every row is always the same length
from .feature_engineer import FEATURE_DIM, features_from_feedback_record

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────
IMPROVEMENT_THRESHOLD = 0.05   # delta >= this → positive class
MIN_SAMPLES_REQUIRED  = 10     # refuse to build if fewer than this


class DatasetBuilder:
    """
    Converts persistent feedback logs into structured training datasets
    for both classification (improved/not) and regression (score delta).

    Parameters
    ----------
    log_path : str
        Absolute path to the feedback_logs.jsonl file.
    val_split : float
        Fraction of data to reserve for validation (default 0.15).
    seed : int
        Random seed for reproducible splits.
    """

    def __init__(
        self,
        log_path: str,
        val_split: float = 0.15,
        seed: int = 42,
    ) -> None:
        self.log_path  = log_path
        self.val_split = val_split
        self.seed      = seed

    # ── Public API ─────────────────────────────────────────────────────────

    def build_training_set(self, mode: str = "classification") -> dict:
        """
        Build a feature/label dataset from the feedback log.

        Parameters
        ----------
        mode : "classification" | "regression"
            classification → binary label (1 = improved, 0 = stagnated)
            regression     → continuous label (after_score − before_score)

        Returns
        -------
        dict with keys:
            features      : list[list[float]]   – X matrix
            labels        : list[float | int]   – y vector
            val_features  : list[list[float]]   – validation X
            val_labels    : list[float | int]   – validation y
            meta          : dict                – sample counts, label stats
        """
        raw_records = self._load_log()
        if not raw_records:
            logger.warning("No feedback records found at %s", self.log_path)
            return self._empty_dataset()

        clean = self._clean(raw_records)
        if len(clean) < MIN_SAMPLES_REQUIRED:
            logger.warning(
                "Only %d clean records (need %d). Returning empty dataset.",
                len(clean), MIN_SAMPLES_REQUIRED,
            )
            return self._empty_dataset()

        X, y = self._extract_features_and_labels(clean, mode)
        X_train, y_train, X_val, y_val = self._split(X, y)

        meta = self._compute_meta(y_train, y_val, mode)
        logger.info(
            "Dataset built | mode=%s | train=%d | val=%d",
            mode, len(X_train), len(X_val),
        )
        return {
            "features":     X_train,
            "labels":       y_train,
            "val_features": X_val,
            "val_labels":   y_val,
            "meta":         meta,
        }

    def build_multi_target_set(self) -> dict:
        """
        Build one dataset with BOTH regression and classification labels —
        useful for multi-output models or label switching at inference time.
        """
        raw_records = self._load_log()
        clean = self._clean(raw_records)
        if len(clean) < MIN_SAMPLES_REQUIRED:
            return self._empty_dataset()

        X_all, y_cls, y_reg = [], [], []
        for rec in clean:
            feats = self._record_to_features(rec)
            delta = rec.get("delta", 0.0)
            X_all.append(feats)
            y_cls.append(1 if delta >= IMPROVEMENT_THRESHOLD else 0)
            y_reg.append(round(delta, 4))

        return {
            "features":           X_all,
            "classification_labels": y_cls,
            "regression_labels":     y_reg,
            "meta": {
                "total_samples": len(X_all),
                "feature_dim":   len(X_all[0]) if X_all else 0,
            },
        }

    def get_sample_count(self) -> int:
        """Quick count of valid training rows — used to decide if retraining is worthwhile."""
        return len(self._clean(self._load_log()))

    # ── Private helpers ────────────────────────────────────────────────────

    def _load_log(self) -> list[dict]:
        if not os.path.exists(self.log_path):
            return []
        records = []
        with open(self.log_path, "r", encoding="utf-8") as fh:
            for lineno, line in enumerate(fh, start=1):
                stripped = line.strip()
                if not stripped:
                    continue
                try:
                    records.append(json.loads(stripped))
                except json.JSONDecodeError:
                    logger.warning("Skipping corrupt line %d in feedback log.", lineno)
        return records

    def _clean(self, records: list[dict]) -> list[dict]:
        """
        Remove records that are missing critical fields or have impossible values.
        Guarantees every surviving record produces a FEATURE_DIM-length vector.
        """
        cleaned = []
        for rec in records:
            # Must have both scores
            before = rec.get("before_score")
            after  = rec.get("after_score")
            if before is None or after is None:
                continue
            try:
                if not (0.0 <= float(before) <= 1.0 and 0.0 <= float(after) <= 1.0):
                    continue
            except (TypeError, ValueError):
                continue

            # Enforce canonical feature dimension — upgrade legacy short vectors
            stored = rec.get("engineered_features", [])
            if isinstance(stored, list) and len(stored) == FEATURE_DIM:
                # Already the right shape — keep as-is
                pass
            else:
                # Re-synthesize from raw fields (handles old 5-dim records too)
                synth = features_from_feedback_record(rec)
                if len(synth) != FEATURE_DIM:
                    logger.debug(
                        "Dropping record (cannot produce %d-dim vector): %s",
                        FEATURE_DIM, rec.get("event_id", "?")
                    )
                    continue
                rec = {**rec, "engineered_features": synth}

            cleaned.append(rec)
        return cleaned
    def _extract_features_and_labels(
        self, clean: list[dict], mode: str
    ) -> tuple[list, list]:
        X, y = [], []
        for rec in clean:
            feats = self._record_to_features(rec)
            delta = rec.get("delta", float(rec.get("after_score", 0)) - float(rec.get("before_score", 0)))
            
            if mode == "outcome":
                # Real-world ground truth (True/False)
                val = rec.get("got_placed")
                if val is None: continue # Skip if no ground truth
                label = 1 if val else 0
            elif mode == "regression":
                label = round(float(delta), 4)
            else:
                # Default: interaction improvement
                label = 1 if delta >= IMPROVEMENT_THRESHOLD else 0
                
            X.append(feats)
            y.append(label)
        return X, y

    def _record_to_features(self, rec: dict) -> list[float]:
        """
        Return a *guaranteed* FEATURE_DIM-length float list.
        _clean() already normalised all records, so stored features are
        always the right length here — but we add a hard defensive guard.
        """
        stored = rec.get("engineered_features", [])
        if isinstance(stored, list) and len(stored) == FEATURE_DIM:
            return [float(v) for v in stored]
        # Defensive path: re-synthesize (should not reach here after _clean)
        fallback = features_from_feedback_record(rec)
        if len(fallback) == FEATURE_DIM:
            return fallback
        # Last resort: zero-pad or truncate to FEATURE_DIM
        padded = (fallback + [0.0] * FEATURE_DIM)[:FEATURE_DIM]
        return padded

    def _synthesize_features(self, rec: dict) -> list[float]:
        """
        Kept for backward compatibility; delegates to feature_engineer.
        """
        return features_from_feedback_record(rec)

    def _split(self, X: list, y: list) -> tuple:
        """Shuffle and split into train / validation sets."""
        rng = random.Random(self.seed)
        combined = list(zip(X, y))
        rng.shuffle(combined)
        cut = max(1, int(len(combined) * (1 - self.val_split)))
        train, val = combined[:cut], combined[cut:]
        X_tr = [row[0] for row in train]
        y_tr = [row[1] for row in train]
        X_vl = [row[0] for row in val]
        y_vl = [row[1] for row in val]
        return X_tr, y_tr, X_vl, y_vl

    def _compute_meta(self, y_train: list, y_val: list, mode: str) -> dict:
        all_y = y_train + y_val
        meta: dict = {
            "total_samples":     len(all_y),
            "train_samples":     len(y_train),
            "val_samples":       len(y_val),
            "label_mode":        mode,
            "improvement_threshold": IMPROVEMENT_THRESHOLD,
        }
        if mode == "classification" and all_y:
            pos = sum(1 for v in all_y if v == 1)
            meta["class_balance"] = {
                "positive": pos,
                "negative": len(all_y) - pos,
                "positive_rate": round(pos / len(all_y), 3),
            }
        if mode == "regression" and all_y:
            meta["label_stats"] = {
                "mean":  round(sum(all_y) / len(all_y), 4),
                "min":   min(all_y),
                "max":   max(all_y),
            }
        return meta

    @staticmethod
    def _empty_dataset() -> dict:
        return {
            "features":     [],
            "labels":       [],
            "val_features": [],
            "val_labels":   [],
            "meta":         {"total_samples": 0, "label_mode": "unknown"},
        }
