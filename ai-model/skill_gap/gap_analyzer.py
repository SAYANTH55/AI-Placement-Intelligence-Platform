def analyze_gaps(current_skills, required_skills):
    gaps = set(required_skills) - set(current_skills)
    return list(gaps)
