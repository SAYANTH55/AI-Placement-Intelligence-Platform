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
    
    # Base signal (Score Delta fallback if no history)
    score_delta = curve[-1] - curve[-2]
    
    # Combined Signal (ISSUE 6 - Fix Temporal Model Signal)
    practice_accuracy = behavior.get("accuracy", 0.5) if behavior else 0.5
    completion_rate = behavior.get("completion_rate", 0.5) if behavior else 0.5
    consistency = behavior.get("consistency", 0.5) if behavior else 0.5
    
    # Retrieve previous signal from the last vector if available
    prev_signal = historical_vectors[-1].get("performance_signal", 0.5) if (historical_vectors and "performance_signal" in historical_vectors[-1]) else 0.5

    current_signal = (
        practice_accuracy * 0.6 +
        completion_rate * 0.3 +
        consistency * 0.1
    )
    
    velocity = current_signal - prev_signal
    
    # Store recent signal for future use
    current_vector["performance_signal"] = current_signal
    
    # Acceleration
    if len(historical_vectors) >= 2:
        prev_velocity = historical_vectors[-1].get("velocity", 0.0)
        acceleration = velocity - prev_velocity
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
