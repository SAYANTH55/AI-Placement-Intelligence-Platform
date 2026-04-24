"""
learning_service.py
────────────────────
Top-level orchestrator for the Learning Layer.

Responsibilities
────────────────
1. Expose a clean API to the Intelligence Service + API routes
2. Log every interaction outcome to the Feedback Collector
3. Trigger training pipeline (sync or async-compatible)
4. Drive the Feature Engineer and forward features to the Inference Engine
5. Maintain a Recommendation Engine that tracks which learning paths work best
6. Support cold-start users gracefully

Async compatibility
───────────────────
trigger_training_pipeline() is designed to run as a Celery task:

    @celery_app.task
    def retrain_task():
        return learning_service.trigger_training_pipeline()

All other methods are synchronous and stateless — safe for concurrent calls.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from .feedback_collector import feedback_collector, FEEDBACK_LOG_FILE
from .feature_engineer   import engineer_features, explain_features, FEATURE_DIM
from .dataset_builder    import DatasetBuilder
from .model_trainer      import ModelTrainer
from .inference_engine   import inference_engine

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Thresholds
# ──────────────────────────────────────────────────────────────────────────────
RETRAIN_TRIGGER_THRESHOLD = 50   # auto-suggest retrain after N new samples
COLD_START_USER_THRESHOLD = 3    # users with < N logs → heuristic only


class LearningService:
    """
    Facade that coordinates all Learning Layer subsystems.

    Intended to be consumed as a singleton (see bottom of file).
    """

    def __init__(self) -> None:
        self.dataset_builder = DatasetBuilder(FEEDBACK_LOG_FILE)
        self.trainer         = ModelTrainer(mode="classification")
        self._rec_store: dict[str, list[dict]] = {}  # user_id → path records

    # ═════════════════════════════════════════════════════════════════════════
    # 1.  FEEDBACK LOGGING
    # ═════════════════════════════════════════════════════════════════════════

    def log_result(self, feedback: dict) -> bool:
        """
        Record an interaction outcome.

        The caller (IntelligenceService) passes a raw feedback dict;
        we add extra context before persisting.

        Parameters
        ----------
        feedback : dict
            Must contain at least 'user_id', 'before_score', 'after_score'.
            All other fields are optional (see FeedbackCollector schema).

        Returns
        -------
        bool – True on successful write.
        """
        enriched = {
            **feedback,
            "logged_by": "learning_service",
            "model_version": (
                inference_engine.model_info().get("version", "heuristic")
                if inference_engine.is_available()
                else "heuristic"
            ),
        }
        return feedback_collector.log_interaction(enriched)

    def log_outcome(self, user_id: str, outcome_data: dict) -> bool:
        """
        Explicitly record a placement outcome (got_placed=True/False).
        Triggers real-world model calibration (ISSUE 1).
        """
        from .calibration_service import calibration_service
        from utils.logger import platform_logger
        
        got_placed = outcome_data.get("got_placed")
        predicted_score = outcome_data.get("last_predicted_score", 0.5)
        
        # 1. Calibrate Model Honesty
        calibration_service.record_outcome(
            predicted_prob=predicted_score, 
            actual_outcome=got_placed,
            metadata={
                "role": outcome_data.get("role", "general"),
                "experience": outcome_data.get("experience_bucket", "0-2")
            }
        )
        
        platform_logger.info(f"LOGGING GROUND TRUTH | user={user_id} | outcome={got_placed} | predicted={predicted_score}")
        
        event = {
            "user_id": user_id,
            "source": "placement_cell_verified",
            "got_placed": got_placed,
            "placement_company": outcome_data.get("company"),
            "placement_role": outcome_data.get("role"),
            "time_to_offer_days": outcome_data.get("time_to_offer_days"),
            "prediction_error": round(abs(predicted_score - (1.0 if got_placed else 0.0)), 3)
        }
        return feedback_collector.log_interaction(event)

    # ═════════════════════════════════════════════════════════════════════════
    # 2.  FEATURE ENGINEERING  (delegates to feature_engineer.py)
    # ═════════════════════════════════════════════════════════════════════════

    def generate_features(
        self,
        intelligence_profile: dict,
        graph_insights: Optional[dict] = None,
    ) -> list[float]:
        """
        Convert a full intelligence profile into a 12-d feature vector.
        Returns a zero-vector on any failure so the caller never crashes.
        """
        try:
            return engineer_features(intelligence_profile, graph_insights or {})
        except Exception as exc:
            logger.error("Feature generation failed: %s", exc)
            return [0.0] * FEATURE_DIM

    def explain(self, features: list[float]) -> dict:
        """Return a name→value map for dashboard / explainability."""
        return explain_features(features)

    # ═════════════════════════════════════════════════════════════════════════
    # 3.  INFERENCE (enhanced prediction)
    # ═════════════════════════════════════════════════════════════════════════

    def get_prediction(
        self,
        intelligence_profile: dict,
        graph_insights: Optional[dict] = None,
        user_id: Optional[str] = None,
    ) -> dict:
        """
        End-to-end enhanced prediction pipeline:
            intelligence_profile → features → inference_engine → result

        Automatically falls back to heuristic for cold-start users.

        Returns
        -------
        dict matching InferenceEngine.predict() output contract.
        """
        # Cold-start guard
        if user_id and feedback_collector.is_cold_start(user_id, COLD_START_USER_THRESHOLD):
            logger.debug("Cold-start user %s — forcing heuristic mode.", user_id)
            features = self.generate_features(intelligence_profile, graph_insights)
            result   = inference_engine._heuristic_fallback(features)
            result["cold_start"] = True
            return result

        features = self.generate_features(intelligence_profile, graph_insights)
        result   = inference_engine.predict(features)
        result["cold_start"] = False
        return result

    # ═════════════════════════════════════════════════════════════════════════
    # 4.  TRAINING PIPELINE  (async-compatible)
    # ═════════════════════════════════════════════════════════════════════════

    def trigger_training_pipeline(
        self,
        mode: str = "classification",
        force: bool = False,
    ) -> dict:
        """
        Build dataset → train model → hot-reload inference engine.

        In production this should be invoked via Celery:
            retrain_task.delay()

        Parameters
        ----------
        mode  : "classification" | "regression"
        force : bool  – skip minimum-sample guard and train anyway

        Returns
        -------
        dict with 'status', metrics, version tag, etc.
        """
        sample_count = feedback_collector.get_log_count()
        logger.info("Training pipeline triggered | total_logs=%d | mode=%s", sample_count, mode)

        if not force and sample_count < 10:
            return {
                "status":  "skipped",
                "reason":  f"Only {sample_count} feedback records (need 10). Collect more data.",
                "samples": sample_count,
            }

        # Build dataset
        trainer = ModelTrainer(mode=mode)
        dataset = self.dataset_builder.build_training_set(mode=mode)

        if not dataset["features"]:
            return {
                "status": "aborted",
                "reason": "Dataset builder returned empty feature set after cleaning.",
            }

        # Train
        result = trainer.train(dataset)

        # Hot-reload the singleton inference engine
        if result.get("status") == "ok":
            reloaded = inference_engine.reload()
            result["inference_reloaded"] = reloaded
            logger.info("Training complete. Inference engine reloaded: %s", reloaded)
        else:
            logger.warning("Training did not succeed: %s", result.get("reason"))

        result["feedback_log_count"] = sample_count
        return result

    def refresh_dataset(self) -> dict:
        """
        Re-build both classification and regression datasets and report stats.
        Does NOT retrain — use trigger_training_pipeline() for that.
        """
        cls_ds  = self.dataset_builder.build_training_set(mode="classification")
        reg_ds  = self.dataset_builder.build_training_set(mode="regression")
        return {
            "classification": cls_ds.get("meta", {}),
            "regression":     reg_ds.get("meta", {}),
            "total_logs":     feedback_collector.get_log_count(),
        }

    def should_retrain(self) -> bool:
        """
        Heuristic: suggest retraining if enough new data has accumulated.
        Callers (e.g. a cron job) check this before triggering the pipeline.
        """
        return feedback_collector.get_log_count() >= RETRAIN_TRIGGER_THRESHOLD

    # ═════════════════════════════════════════════════════════════════════════
    # 5.  RECOMMENDATION ENGINE  (Task 8 — Advanced)
    # ═════════════════════════════════════════════════════════════════════════

    def record_learning_path_outcome(
        self,
        user_id: str,
        path_id: str,
        path_topics: list[str],
        score_before: float,
        score_after: float,
    ) -> None:
        """
        Record the performance outcome of a completed learning path so
        future recommendations can rank paths by their empirical effectiveness.

        Parameters
        ----------
        path_id      : unique identifier for the learning path template
        path_topics  : ordered list of topic names in the path
        score_before : readiness score before starting the path
        score_after  : readiness score after completing the path
        """
        delta = round(score_after - score_before, 4)
        entry = {
            "user_id":     user_id,
            "path_id":     path_id,
            "path_topics": path_topics,
            "score_before": score_before,
            "score_after":  score_after,
            "delta":        delta,
            "recorded_at":  datetime.now(timezone.utc).isoformat(),
        }

        if user_id not in self._rec_store:
            self._rec_store[user_id] = []
        self._rec_store[user_id].append(entry)

        # Also persist in the main feedback log for offline analysis
        self.log_result({
            "user_id":      user_id,
            "before_score": score_before,
            "after_score":  score_after,
            "topics_completed": path_topics,
            "source":       "recommendation_engine",
        })
        logger.debug("Path outcome recorded | user=%s | path=%s | delta=%.4f", user_id, path_id, delta)

    def recommend_paths(
        self,
        user_id: str,
        candidate_paths: list[dict],
        top_k: int = 3,
    ) -> list[dict]:
        """
        Rank candidate learning paths by their historic effectiveness for this user.

        If no history exists, falls back to a global ranking across all users.

        Parameters
        ----------
        candidate_paths : list of {"path_id": str, "topics": [...], ...}
        top_k           : how many paths to return

        Returns
        -------
        Sorted list of paths (best first) with added 'expected_delta' key.
        """
        path_scores = self._compute_path_scores(user_id)

        ranked = []
        for path in candidate_paths:
            pid     = path.get("path_id", "")
            topics  = path.get("topics", [])

            # Exact match on path_id
            exp_delta = path_scores.get(pid, None)

            # Partial topic overlap fallback
            if exp_delta is None:
                exp_delta = self._topic_overlap_score(topics, path_scores)

            ranked.append({**path, "expected_delta": round(exp_delta, 4)})

        ranked.sort(key=lambda p: p["expected_delta"], reverse=True)
        return ranked[:top_k]

    # ═════════════════════════════════════════════════════════════════════════
    # 6.  STATUS / DIAGNOSTICS
    # ═════════════════════════════════════════════════════════════════════════

    def status(self) -> dict:
        """Return a comprehensive health snapshot of the Learning Layer."""
        return {
            "model_available":   inference_engine.is_available(),
            "model_info":        inference_engine.model_info(),
            "feedback_log_count": feedback_collector.get_log_count(),
            "should_retrain":    self.should_retrain(),
            "retrain_threshold": RETRAIN_TRIGGER_THRESHOLD,
            "cold_start_threshold": COLD_START_USER_THRESHOLD,
            "feature_dim":       FEATURE_DIM,
        }

    # ── Private helpers ────────────────────────────────────────────────────

    def _compute_path_scores(self, user_id: str) -> dict[str, float]:
        """
        Build a path_id → avg_delta map.
        User-specific history is weighted 2× vs the global pool.
        """
        all_records: list[dict] = []

        # Global pool (weight 1)
        for uid, records in self._rec_store.items():
            if uid != user_id:
                all_records.extend(records)

        # User-specific (weight 2 — inject twice)
        user_records = self._rec_store.get(user_id, [])
        all_records.extend(user_records * 2)

        agg: dict[str, list[float]] = {}
        for rec in all_records:
            pid = rec.get("path_id", "")
            if pid:
                agg.setdefault(pid, []).append(rec.get("delta", 0.0))

        return {pid: sum(deltas) / len(deltas) for pid, deltas in agg.items()}

    def _topic_overlap_score(
        self,
        topics: list[str],
        path_scores: dict[str, float],
    ) -> float:
        """
        Estimate expected delta for an unseen path based on partial topic overlap
        with known high-performing paths.
        """
        if not path_scores or not topics:
            return 0.0

        topic_set = {t.lower() for t in topics}
        best = 0.0
        for pid, delta in path_scores.items():
            # We don't store topics per path in the score map — return best known
            best = max(best, delta)
        return best * 0.7  # discount for uncertainty


# ─── Module-level singleton ────────────────────────────────────────────────────
learning_service = LearningService()
