import pandas as pd
import joblib
import os

# Get path relative to this script
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "placement_predictor.pkl")

def load_placement_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def predict_placement(skills, experience_str):
    """
    Predicts placement readiness using the trained ML model.
    """
    model = load_placement_model()
    if not model:
        return {"placement_probability": 0.5, "status": "Model not found", "readiness": "Medium"}

    # Extract numeric experience
    try:
        experience = float(experience_str.split()[0])
    except:
        experience = 0.0

    skills_count = len(skills)
    
    # We don't have GPA and Projects from current basic parser, 
    # so we'll use average defaults or derive from text extensions later
    gpa = 3.5 
    projects = 3 if skills_count > 5 else 1

    # Format for model input
    input_data = pd.DataFrame([{
        'experience': experience,
        'skills_count': skills_count,
        'gpa': gpa,
        'projects': projects
    }])

    # Get probability of being "Placed" (class 1)
    prob = model.predict_proba(input_data)[0][1]
    
    # Determine readiness level
    readiness = "High" if prob > 0.75 else "Medium" if prob > 0.4 else "Low"
    
    return {
        "placement_probability": round(prob, 2),
        "readiness": readiness,
        "features": {
            "experience": experience,
            "skills_count": skills_count
        }
    }
