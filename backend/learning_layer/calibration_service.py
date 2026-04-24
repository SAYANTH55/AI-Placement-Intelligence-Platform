from collections import defaultdict
import numpy as np
import logging

logger = logging.getLogger(__name__)

class CalibrationService:
    def __init__(self):
        self.history = [] # List of dicts: {"prob": float, "truth": float, "segment": str, "timestamp": float}
        self.segments = defaultdict(list)
        self.ROLLING_WINDOW = 100

    def record_outcome(self, predicted_prob: float, actual_outcome: bool, metadata: dict = None):
        """
        Stores truth data with SEGMENTATION (A) and timestamps (E).
        """
        import time
        outcome = 1.0 if actual_outcome else 0.0
        
        # Determine segment (e.g., '0-1 yrs backend')
        role = metadata.get("role", "general") if metadata else "general"
        exp = metadata.get("experience", "0-2") if metadata else "0-2"
        segment_id = f"{exp} yrs {role}"
        
        entry = {
            "prob": predicted_prob, 
            "truth": outcome, 
            "segment": segment_id, 
            "time": time.time()
        }
        
        self.history.append(entry)
        self.segments[segment_id].append(entry)
        
        logger.info(f"CALIBRATION | Segment: {segment_id} | Prediction: {predicted_prob} | Reality: {outcome}")

    def _calc_brier(self, entries: list) -> float:
        if not entries: return 0.0
        preds = np.array([e["prob"] for e in entries])
        truths = np.array([e["truth"] for e in entries])
        return float(np.mean((preds - truths) ** 2))

    def get_calibration_report(self) -> dict:
        """
        Actionable report with Drift Detection (E) and Segmented metrics (A).
        """
        overall_brier = self._calc_brier(self.history)
        
        # Rolling Drift Detection
        recent_history = self.history[-self.ROLLING_WINDOW:]
        rolling_brier = self._calc_brier(recent_history)
        drift_detected = rolling_brier > (overall_brier * 1.25) if len(self.history) > 50 else False
        
        segment_stats = {}
        for seg_id, entries in self.segments.items():
            if len(entries) >= 5: # Min samples per segment
                segment_stats[seg_id] = round(self._calc_brier(entries), 4)
        
        status = "HEALTHY"
        action = "None"
        if drift_detected:
            status = "DEGRADED"
            action = "Retrain model / Investigate drift"
        elif overall_brier > 0.15:
            status = "OPTIMISTIC"
            action = "Calibrate probability thresholds"
            
        return {
            "status": status,
            "action": action,
            "overall_brier": round(overall_brier, 4),
            "rolling_brier": round(rolling_brier, 4),
            "drift_detected": drift_detected,
            "segmented_scores": segment_stats,
            "sample_size": len(self.history)
        }

# Singleton
calibration_service = CalibrationService()
