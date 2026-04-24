from .user_state_manager import UserStateManager
from .skill_vectorizer import vectorize_skills
from .behavior_tracker import process_behavior_metrics, update_skill_vector_from_behavior
from .progression_model import analyze_progression
from .prediction_engine import AdaptivePredictor
from knowledge_graph.graph_service import graph_service
from learning_layer.learning_service import learning_service
import logging
import uuid
import time

logger = logging.getLogger(__name__)

def compute_avg(vector: dict) -> float:
    """Helper to extract mean skill score from a vector snapshot."""
    scores = [v.get("score", 0.0) if isinstance(v, dict) else 0.0 for v in vector.values()]
    return round(sum(scores) / len(scores), 3) if scores else 0.0

class IntelligenceService:
    def __init__(self, db_session=None):
        self.state_manager = UserStateManager(db_session)
        self.predictor = AdaptivePredictor()
        
    def generate_explanations(self, progression: dict, behavior: dict) -> list:
        exps = []
        if progression.get("trend") == "accelerating":
            exps.append("Your growth trajectory is highly accelerating indicating rapid skill acquisition.")
        elif progression.get("trend") == "stagnating":
            exps.append("Your velocity has stagnated; consider attempting harder topics or varying categories.")
            
        strong = behavior.get("strong_areas", [])
        weak = behavior.get("weak_areas", [])
        
        if strong:
            exps.append(f"Your growth is heavily driven by strong performance in {', '.join(strong[:2])}.")
        if weak:
            exps.append(f"Recurring weakness in {', '.join(weak[:2])} is presently reducing your readiness ceilings.")
            
        if not exps:
            exps.append("Keep practicing to generate enough data for specific explanations.")
            
        return exps

    def build_intelligence_profile(self, student_profile: dict) -> dict:
        """
        Orchestrates the entire intelligence pipeline with trace_id and latency tracking.
        """
        trace_id = str(uuid.uuid4())[:8]
        start_time = time.perf_counter()
        student_id = student_profile.get("student_id")
        
        logger.info(f"[{trace_id}] START Intelligence Pipeline | user={student_id}")
        
        try:
            # 1. State Management
            t_state = time.perf_counter()
            current_state = self.state_manager.fetch_or_initialize_state(student_id)
            logger.debug(f"[{trace_id}] State fetched in {round((time.perf_counter()-t_state)*1000, 2)}ms")
            
            # 2. Vectorization
            t_vec = time.perf_counter()
            base_vector = vectorize_skills(student_profile)
            logger.debug(f"[{trace_id}] Vectorized in {round((time.perf_counter()-t_vec)*1000, 2)}ms")
            
            # 3. Behavior Feedback Loop
            t_beh = time.perf_counter()
            behavior_metrics = process_behavior_metrics(None) 
            active_vector = update_skill_vector_from_behavior(
                base_vector, 
                behavior_metrics, 
                last_updated=current_state.get("last_updated")
            )
            logger.debug(f"[{trace_id}] Behavior processed in {round((time.perf_counter()-t_beh)*1000, 2)}ms")
            
            # Commit updated state
            current_state = self.state_manager.update_state(student_id, active_vector, current_state)
            
            # 4. Temporal Progression Modeling
            progression = analyze_progression(
                active_vector, 
                current_state.get("historical_vectors", []),
                behavior=behavior_metrics
            )
            
            # 5. Build graph insights first so predictor can consume gap depth
            stub_profile = {"skill_vector": active_vector, "behavior": behavior_metrics}
            graph_insights = graph_service.process_insights(stub_profile)
            
            # 5b. Prediction Engine (AdaptivePredictor: ML or Heuristic)
            prediction = self.predictor.predict(active_vector, progression, behavior_metrics, graph_insights)
            
            # 6. Explanations
            explanations = self.generate_explanations(progression, behavior_metrics)
            mode = "normal" if current_state.get("historical_vectors") else "cold_start"
            
            if mode == "cold_start":
                prediction["confidence"] = 0.3
            
            # 7. Global Intelligence Score (PHASE 7 - Configurable Weights)
            # 7. Global Intelligence Score (REFINED: Decision Breakdown)
            SCORE_WEIGHTS = {
                "skills": 0.50,
                "behavior": 0.25,
                "progression": 0.25
            }
            
            norm_vel = min(max(progression.get("velocity", 0.0) * 10, 0), 1)
            skill_comp = prediction.get("current_score", 0.0)
            behavior_comp = behavior_metrics.get("accuracy", 0.0)
            prog_comp = norm_vel
            
            overall = (
                (skill_comp * SCORE_WEIGHTS["skills"]) + 
                (behavior_comp * SCORE_WEIGHTS["behavior"]) + 
                (prog_comp * SCORE_WEIGHTS["progression"])
            )
            
            # ISSUE B: Decision Breakdown
            decision_factors = {
                "skill_strength": round(skill_comp * SCORE_WEIGHTS["skills"], 3),
                "behavior_signal": round(behavior_comp * SCORE_WEIGHTS["behavior"], 3),
                "trajectory_boost": round(prog_comp * SCORE_WEIGHTS["progression"], 3),
                "graph_penalty": round(-(len(graph_insights.get("root_cause_gaps", [])) * 0.05), 3)
            }
            
            intel_score = {
                "overall": round(overall, 2),
                "type": "heuristic",
                "decision_factors": decision_factors, # ISSUE B
                "weights_used": SCORE_WEIGHTS
            }
            
            # 7b. Weighted Confidence Propagation (ISSUE D)
            profile_skills = student_profile.get("skills", [])
            parsing_conf = sum([s.get("weight", 1.0) * s.get("confidence", 1.0) for s in profile_skills]) / len(profile_skills) if profile_skills else 1.0
            behavior_conf = behavior_metrics.get("consistency", 0.5)
            model_conf = prediction.get("confidence", 0.5)
            
            # ISSUE D: Weighted Aggregation (No longer just min())
            system_confidence = round(
                (0.4 * parsing_conf) + 
                (0.3 * behavior_conf) + 
                (0.3 * model_conf), 
            2)
            
            # 7c. Output Realism
            score_point = round(prediction.get("predicted_score", 0.5), 2)
            margin = 0.05 if system_confidence > 0.8 else 0.10 if system_confidence > 0.5 else 0.15
            low_bound = round(max(score_point - margin, 0.0), 2)
            high_bound = round(min(score_point + margin, 1.0), 2)
            prediction["predicted_score_range"] = f"{low_bound} - {high_bound}"
            prediction["predicted_score"] = score_point
            
            # 7d. Proactive Gating (ISSUE G)
            last_score = compute_avg(current_state["historical_vectors"][-1].get("vector", {})) if current_state.get("historical_vectors") else overall
            sudden_jump = abs(overall - last_score) > 0.3
            conflicting_signals = (skill_comp > 0.8 and behavior_comp < 0.3)
            
            # Trigger if Low Confidence OR Suspicious Pattern (ISSUE G)
            requires_verification = (system_confidence < 0.60) or sudden_jump or conflicting_signals
            
            intel_profile = {
                "trace_id": trace_id,
                "student_id": student_id,
                "skill_vector": active_vector,
                "behavior": behavior_metrics,
                "progression": progression,
                "prediction": prediction,
                "intelligence_score": intel_score,
                "system_confidence": system_confidence,
                "requires_verification": requires_verification,
                "verification_reason": "Low confidence" if system_confidence < 0.6 else "Anomalous signal" if (sudden_jump or conflicting_signals) else None,
                "readiness_disclaimer": "This score is an AI estimate based on current data and may vary by ±10%",
                "trajectory": {
                    "velocity": round(progression.get("velocity", 0.0), 3),
                    "acceleration": round(progression.get("acceleration", 0.0), 3),
                    "trend": progression.get("trend")
                },
                "explanations": explanations,
                "mode": mode,
                "latency_ms": round((time.perf_counter() - start_time) * 1000, 2)
            }
            
            # Graph insights already computed above — attach to profile
            intel_profile["graph_insights"] = graph_insights
            
            # 8. Async-compatible Feedback Logging
            learning_service.log_result({
                "user_id": student_id,
                "trace_id": trace_id,
                "before_score": current_state.get("historical_vectors") and compute_avg(current_state["historical_vectors"][-1].get("vector", {})) or prediction.get("current_score", 0),
                "after_score": prediction.get("current_score", 0),
                "accuracy": behavior_metrics.get("accuracy", 0),
                "weak_areas_before": behavior_metrics.get("weak_areas", []),
                "engineered_features": learning_service.generate_features(intel_profile, graph_insights)
            })
            
            logger.info(f"[{trace_id}] COMPLETE Intelligence Pipeline | total_time={intel_profile['latency_ms']}ms")
            return intel_profile
            
        except Exception as e:
            logger.error(f"[{trace_id}] Intelligence processing failed: {e}", exc_info=True)
            return {
                "trace_id": trace_id,
                "error": "Intelligence processing failed", 
                "details": str(e), 
                "mode": "error_fallback"
            }

# Expose a singleton instance for fast endpoint routing
intelligence_service = IntelligenceService()
