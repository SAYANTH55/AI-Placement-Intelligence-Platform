"""
feedback_collector.py
─────────────────────
Append-only, fault-tolerant feedback storage layer.

Every time a user interacts with the Intelligence Pipeline the outcome is
recorded here so the Dataset Builder can convert it into ML training rows.

Design principles
-----------------
* JSON Lines (JSONL) — one record per line, streaming-safe
* No data loss: writes are flushed synchronously
* Schema enforcement: missing fields are defaulted, not silently dropped
* Query helpers allow the trainer to fetch recent or per-user data
"""

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Storage path — lives alongside the module so it survives restarts
# ──────────────────────────────────────────────────────────────────────────────
FEEDBACK_LOG_FILE = os.path.join(os.path.dirname(__file__), "feedback_logs.jsonl")

# ──────────────────────────────────────────────────────────────────────────────
# Canonical schema with sane defaults
# ──────────────────────────────────────────────────────────────────────────────
_SCHEMA_DEFAULTS: dict = {
    "event_id":            None,          # uuid, auto-generated
    "user_id":             "anonymous",
    "timestamp":           None,          # ISO-8601 UTC, auto-generated
    "before_score":        0.0,
    "after_score":         0.0,
    "delta":               0.0,           # computed: after - before
    "topics_completed":    [],
    "weak_areas_before":   [],
    "weak_areas_after":    [],
    "time_spent_hours":    0.0,
    "attempts":            0,
    "accuracy":            0.0,
    "consistency":         0.0,
    "learning_velocity":   0.0,
    "graph_gap_depth":     0,
    "engineered_features": [],
    "got_placed":          None,          # Boolean | None for ground truth
    "placement_company":   None,
    "placement_role":      None,
    "time_to_offer_days":  None,
    "source":              "intelligence_service",  # or "practice_engine"
    "model_version":       "heuristic",             # "heuristic" | "ml_v{n}"
}


class FeedbackCollector:
    """
    Append-only persistent store of interaction outcomes.

    Usage
    -----
    collector = FeedbackCollector()
    collector.log_interaction({
        "user_id": "abc123",
        "before_score": 0.62,
        "after_score":  0.78,
        ...
    })
    """

    # ── Public API ─────────────────────────────────────────────────────────

    def log_interaction(self, feedback_event: dict) -> bool:
        """
        Validates, enriches, and appends a feedback record to the JSONL store.

        Returns True on success, False on any failure (never raises).
        """
        try:
            record = self._build_record(feedback_event)
            self._append(record)
            logger.debug(
                "Feedback logged  event_id=%s  user=%s  delta=%.3f",
                record["event_id"],
                record["user_id"],
                record["delta"],
            )
            return True
        except Exception as exc:
            logger.error("Feedback collection failed: %s", exc, exc_info=True)
            return False

    def get_all_logs(self) -> list[dict]:
        """Read every record from the store (used by DatasetBuilder)."""
        return self._read_all()

    def get_user_logs(self, user_id: str) -> list[dict]:
        """Fetch all records for a specific user — useful for personalised retraining."""
        return [r for r in self._read_all() if r.get("user_id") == user_id]

    def get_recent_logs(self, n: int = 1000) -> list[dict]:
        """Return the last *n* records — for incremental training passes."""
        records = self._read_all()
        return records[-n:]

    def get_log_count(self) -> int:
        """Returns number of stored feedback records (fast, line-count only)."""
        if not os.path.exists(FEEDBACK_LOG_FILE):
            return 0
        with open(FEEDBACK_LOG_FILE, "r", encoding="utf-8") as fh:
            return sum(1 for line in fh if line.strip())

    def is_cold_start(self, user_id: str, threshold: int = 3) -> bool:
        """
        Returns True if the user has fewer than `threshold` logged interactions.
        Cold-start users should fall back to heuristic predictions.
        """
        return len(self.get_user_logs(user_id)) < threshold

    # ── Private helpers ────────────────────────────────────────────────────

    def _build_record(self, raw: dict) -> dict:
        """Merge incoming data onto the canonical schema and compute derived fields."""
        record = _SCHEMA_DEFAULTS.copy()
        record.update(raw)                           # caller values win

        # Auto-inject deterministic metadata
        record["event_id"]  = str(uuid.uuid4())
        record["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Derived delta avoids re-computation in the trainer
        record["delta"] = round(
            float(record.get("after_score", 0.0)) - float(record.get("before_score", 0.0)),
            4,
        )

        # Type-safety guards
        record["before_score"]      = float(record["before_score"])
        record["after_score"]       = float(record["after_score"])
        record["time_spent_hours"]  = float(record.get("time_spent_hours", 0.0))
        record["attempts"]          = int(record.get("attempts", 0))
        record["accuracy"]          = float(record.get("accuracy", 0.0))
        record["consistency"]       = float(record.get("consistency", 0.0))
        record["graph_gap_depth"]   = int(record.get("graph_gap_depth", 0))

        # Lists must be lists
        for list_field in ("topics_completed", "weak_areas_before", "weak_areas_after", "engineered_features"):
            if not isinstance(record[list_field], list):
                record[list_field] = []

        return record

    def _append(self, record: dict) -> None:
        """Synchronously flush one JSON line to disk — no data loss."""
        with open(FEEDBACK_LOG_FILE, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")
            fh.flush()
            os.fsync(fh.fileno())

    def _read_all(self) -> list[dict]:
        """Parse the entire JSONL store, skipping corrupt lines gracefully."""
        if not os.path.exists(FEEDBACK_LOG_FILE):
            return []
        records = []
        with open(FEEDBACK_LOG_FILE, "r", encoding="utf-8") as fh:
            for lineno, line in enumerate(fh, start=1):
                stripped = line.strip()
                if not stripped:
                    continue
                try:
                    records.append(json.loads(stripped))
                except json.JSONDecodeError:
                    logger.warning("Corrupt JSONL record at line %d — skipped.", lineno)
        return records


# ─── Module-level singleton ────────────────────────────────────────────────────
feedback_collector = FeedbackCollector()
