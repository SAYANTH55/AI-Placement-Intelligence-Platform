def build_feature_vector(profile: dict) -> dict:
    """
    Extracts structured, numerical features from raw JSON profile_data.
    Ensures all ML models receive consistent vector shapes.
    """
    if not profile:
        profile = {}

    skills = profile.get("skills", [])
    projects = profile.get("projects", [])
    
    # Try to safely extract years from an "experience" string (e.g., "2 years intern")
    exp_str = profile.get("experience", "0")
    try:
        years_experience = int(str(exp_str).split()[0])
    except (ValueError, IndexError):
        years_experience = 0

    return {
        "num_skills": len(skills),
        "num_projects": len(projects),
        "years_experience": years_experience,
        "backend_score": calc_backend_score(profile),
        "ml_score": calc_ml_score(profile),
        "skill_depth_python": compute_depth(profile, "Python")
    }

def calc_backend_score(profile: dict) -> float:
    skills = profile.get("skills", [])
    backend_keywords = ["python", "java", "node", "sql", "django", "fastapi"]
    score = sum(1 for s in skills if str(s).lower() in backend_keywords)
    return float(score) / len(backend_keywords)

def calc_ml_score(profile: dict) -> float:
    skills = profile.get("skills", [])
    ml_keywords = ["python", "machine learning", "pytorch", "tensorflow", "data science"]
    score = sum(1 for s in skills if str(s).lower() in ml_keywords)
    return float(score) / len(ml_keywords)

def compute_depth(profile: dict, target_skill: str) -> float:
    skills = profile.get("skills", [])
    # Very rudimentary placeholder for depth calculation
    return 1.0 if any(str(s).lower() == target_skill.lower() for s in skills) else 0.0
