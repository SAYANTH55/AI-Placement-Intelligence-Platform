import pandas as pd
import joblib
import os

# Get path relative to this script
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "placement_predictor.pkl")

def load_placement_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def predict_placement(parsed_data):
    """
    Predicts placement readiness using the trained ML model dynamically extracting data.
    """
    model = load_placement_model()
    if not model:
        return {"placement_probability": 0.5, "status": "Model not found", "readiness": "Medium"}

    # Use the dynamic experience parsed, default to 0.0
    experience = parsed_data.get('experience_years', 0.0)

    skills_count = len(parsed_data.get('skills', []))
    
    # Use dynamic GPA if available, otherwise default average 3.0
    gpa = parsed_data.get('gpa')
    if gpa is None:
        gpa = 3.0
        
    # Use dynamic projects if available, otherwise default based on skills
    projects = parsed_data.get('projects_count')
    if projects is None or projects == 0:
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
            "skills_count": skills_count,
            "gpa": gpa,
            "projects_count": projects
        }
    }
