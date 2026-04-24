from datetime import datetime

def compute_overall_score(vector: dict) -> float:
    if not vector: return 0.0
    scores = [v.get("score", 0.0) for v in vector.values()]
    return sum(scores) / len(scores)

def analyze_progression(current_vector: dict, historical_vectors: list, behavior: dict = None) -> dict:
    """
    ✅ ENHANCED (ISSUE 6): Multi-signal temporal modeling.
    Velocity = f(Score Delta, Accuracy, Activity Intensity)
    """
    current_score = compute_overall_score(current_vector)
    accuracy = behavior.get("accuracy", 0.5) if behavior else 0.5
    
    if not historical_vectors:
        return {
            "velocity": 0.0,
            "acceleration": 0.0,
            "trend": "baseline",
            "historical_curve": [current_score]
        }
    
    curve = [compute_overall_score(h.get("vector", {})) for h in historical_vectors]
    curve.append(current_score)
    
    # Base velocity (Score Delta)
    score_delta = curve[-1] - curve[-2]
    
    # Combined Velocity (ISSUE 6)
    # We weight score delta (0.6), actual accuracy (0.3), and consistency (0.1)
    consistency = behavior.get("consistency", 0.5) if behavior else 0.5
    velocity = (score_delta * 0.6) + (accuracy * 0.05) + (consistency * 0.01)
    
    # Acceleration
    if len(curve) >= 3:
        prev_score_delta = curve[-2] - curve[-3]
        acceleration = score_delta - prev_score_delta
    else:
        acceleration = 0.0
        
    # Trend
    if velocity > 0.01 and acceleration >= 0:
        trend = "accelerating"
    elif velocity > 0:
        trend = "increasing"
    elif velocity > -0.01:
        trend = "stagnating"
    else:
        trend = "regressing"
        
    return {
        "velocity": round(velocity, 3),
        "acceleration": round(acceleration, 3),
        "trend": trend,
        "historical_curve": [round(c, 2) for c in curve]
    }
