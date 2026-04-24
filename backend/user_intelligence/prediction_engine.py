from abc import ABC, abstractmethod
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class BasePredictor(ABC):
    @abstractmethod
    def predict(self, active_vector: dict, progression: dict, behavior: dict, graph_insights: Optional[dict] = None) -> dict:
        pass

class HeuristicPredictor(BasePredictor):
    def predict(self, active_vector: dict, progression: dict, behavior: dict, graph_insights: Optional[dict] = None) -> dict:
        """
        Calculates heuristic probabilities statically.
        """
        if not active_vector:
            return {
                "current_score": 0.1,
                "predicted_score": 0.2,
                "time_to_ready": "Unknown",
                "risk_level": "High"
            }
            
        scores = [v.get("score", 0.0) for v in active_vector.values()]
        strength_scalar = sum(scores) / len(scores) if scores else 0.0
        
        consistency = behavior.get("consistency", 0.5)
        adjusted_score = strength_scalar * consistency * 1.5 
        current_score = min(adjusted_score, 1.0)
        
        vel = progression.get("velocity", 0.0)
        accel = progression.get("acceleration", 0.0)
        predicted_growth = vel * 4 + accel * 2 
        predicted_score = min(current_score + predicted_growth, 1.0)
        
        # Calculate heuristic confidence based on consistency and data volume
        confidence = behavior.get("consistency", 0.5) * 0.8 + 0.1
        uncertainty = "high" if confidence < 0.4 else "medium" if confidence < 0.7 else "low"
        
        if current_score >= 0.75:
            risk = "low"
            ttr = "Ready Now"
        elif current_score >= 0.50:
            risk = "medium"
            if predicted_score > 0.75:
                ttr = "4-6 weeks"
            else:
                ttr = "8-12 weeks"
        else:
            risk = "high"
            ttr = "3+ months"
            
        return {
            "current_score": round(current_score, 2),
            "predicted_score": round(predicted_score, 2),
            "confidence": round(confidence, 2),
            "uncertainty": uncertainty,
            "time_to_ready": ttr,
            "risk_level": risk,
            "source": "heuristic"
        }

class MLPredictor(BasePredictor):
    def predict(self, active_vector: dict, progression: dict, behavior: dict, graph_insights: Optional[dict] = None) -> dict:
        from learning_layer.inference_engine import inference_engine
        from learning_layer.learning_service import learning_service
        from utils.logger import platform_logger
        
        platform_logger.info("Running ML inference for prediction")
        
        stubbed_intel = {
            "skill_vector": active_vector,
            "trajectory": progression,
            "behavior": behavior
        }
        features = learning_service.generate_features(stubbed_intel, graph_insights or {})
        prediction = inference_engine.predict(features)
        
        # ML model already provides confidence, we derive uncertainty from it
        conf = prediction.get("confidence", 0.5)
        uncertainty = "high" if conf < 0.5 else "medium" if conf < 0.8 else "low"
        
        prediction["uncertainty"] = uncertainty
        return prediction

class AdaptivePredictor:
    def __init__(self):
        self.heuristic = HeuristicPredictor()
        self.ml_predictor = MLPredictor()
        
    def predict(self, active_vector: dict, progression: dict, behavior: dict, graph_insights: Optional[dict] = None) -> dict:
        from learning_layer.inference_engine import inference_engine
        from utils.logger import platform_logger
        
        if inference_engine.is_available():
            try:
                # Dynamic ML pipeline interception
                prediction = self.ml_predictor.predict(active_vector, progression, behavior, graph_insights)
                platform_logger.debug(f"ML Prediction successful: score={prediction.get('predicted_score')}")
                
                # Align return wrapper mappings for upstream orchestration 
                return {
                     "current_score": prediction.get("predicted_score"), 
                     "predicted_score": prediction.get("predicted_score"),
                     "confidence": prediction.get("confidence", 0.5),
                     "uncertainty": prediction.get("uncertainty", "medium"),
                     "time_to_ready": prediction.get("time_to_ready", "Unknown"),
                     "risk_level": prediction.get("risk_level", "Medium"),
                     "source": prediction.get("source", "ml_trained")
                }
            except Exception as e:
                platform_logger.error(f"ML Predictor tripped dynamically. Falling back cleanly: {e}")
                return self.heuristic.predict(active_vector, progression, behavior, graph_insights)
        else:
            return self.heuristic.predict(active_vector, progression, behavior, graph_insights)
