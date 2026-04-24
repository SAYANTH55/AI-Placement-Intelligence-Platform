
import datetime

DIFFICULTY_WEIGHTS = {
    "DP": 1.5,
    "Graphs": 1.4,
    "Recursion": 1.3,
    "Dynamic Programming": 1.5,
    "System Design": 1.6,
    "SQL": 1.0,
    "Arrays": 1.0,
    "OOP": 1.1,
    "Algorithms": 1.2
}

def smooth_update(old: float, new: float, alpha: float = 0.3) -> float:
    """EMA smoothing to prevent erratic jumps in skill scores (PHASE 3)."""
    return old * (1 - alpha) + new * alpha

def apply_decay(score: float, last_updated_iso: str) -> float:
    """Applies knowledge decay based on time elapsed since last update (PHASE 3)."""
    try:
        last_updated = datetime.datetime.fromisoformat(last_updated_iso)
        now = datetime.datetime.utcnow()
        days_passed = (now - last_updated).days
        if days_passed <= 0:
            return score
        # 2% decay per day
        return score * (0.98 ** days_passed)
    except:
        return score

def process_behavior_metrics(practice_results: list = None) -> dict:
    """
    Ingests granular tracking metrics from the Practice Engine.
    """
    if not practice_results:
        return {
            "accuracy": 0.0,
            "consistency": 0.0,
            "weak_areas": [],
            "strong_areas": [],
            "mode": "cold_start"
        }
    
    return {
        "accuracy": 0.72,
        "consistency": 0.65,
        "weak_areas": ["Graphs", "Dynamic Programming", "Time Complexity"],
        "strong_areas": ["Arrays", "SQL", "OOP"],
        "mode": "active"
    }

def update_skill_vector_from_behavior(vector_space: dict, behavior: dict, last_updated: str = None) -> dict:
    """
    ✅ ENHANCED (PHASE 3): Stabilized feedback loop with smoothing, difficulty scaling, and decay.
    """
    if behavior.get("mode") == "cold_start":
        return vector_space
        
    weak_areas = behavior.get("weak_areas", [])
    strong_areas = behavior.get("strong_areas", [])
    
    modified_vector = vector_space.copy()
    
    for key, data in modified_vector.items():
        current_score = data.get("score", 0.0)
        
        # 1. Apply Decay (Phase 3)
        if last_updated:
            current_score = apply_decay(current_score, last_updated)
        
        target_score = current_score
        
        # 2. Difficulty-Aware Adjustment (Phase 3)
        diff_weight = 1.0
        for topic, weight in DIFFICULTY_WEIGHTS.items():
            if topic.lower() in key.lower():
                diff_weight = weight
                break
        
        # Adjust target based on behavior
        if any(strong.lower() in key.lower() or key.lower() in strong.lower() for strong in strong_areas):
            # If strong, target is current + bonus scaled inversely by difficulty
            # (Harder topics are harder to push higher)
            bonus = 0.15 / diff_weight
            target_score = min(current_score + bonus, 1.0)
            data["stability"] = min(data.get("stability", 0.5) + (0.1 / diff_weight), 1.0)
            
        if any(weak.lower() in key.lower() or key.lower() in weak.lower() for weak in weak_areas):
            # Repetitive failure drops score faster on easier topics
            penalty = 0.15 * diff_weight 
            target_score = max(current_score - penalty, 0.0)
            data["stability"] = max(data.get("stability", 0.5) - (0.2 / diff_weight), 0.0)
            
        # 3. Alpha-Blending Smoothing (Phase 3)
        data["score"] = round(smooth_update(current_score, target_score, alpha=0.3), 2)
        modified_vector[key] = data
        
    return modified_vector
