from ai_model.data.skills_data import ROLE_REQUIREMENTS, ROLE_SALARIES

def calculate_role_matches(extracted_skills, target_role=None):
    """
    Compares extracted skills against role requirements and returns matching metrics.
    If target_role is provided, it will be placed first in the results regardless of match %.
    """
    # Normalize extracted skills for comparison
    normalized_extracted = [s.lower() for s in extracted_skills]
    
    matches = []
    target_match = None
    
    for role, required_skills in ROLE_REQUIREMENTS.items():
        # Find overlaps
        present_skills = [s for s in required_skills if s.lower() in normalized_extracted]
        missing_skills = [s for s in required_skills if s.lower() not in normalized_extracted]
        
        # Calculate percentage
        match_percent = 0
        if required_skills:
            match_percent = round((len(present_skills) / len(required_skills)) * 100)
            
        entry = {
            "role": role,
            "match": match_percent,
            "present": present_skills,
            "missing": missing_skills,
            "salary": ROLE_SALARIES.get(role, "$70k - $120k")
        }
        
        # If this is the target role, save it separately
        if target_role and role.lower() == target_role.lower():
            target_match = entry
        else:
            matches.append(entry)
        
    # Sort remaining matches by percentage descending
    matches.sort(key=lambda x: x['match'], reverse=True)
    
    # If a target role was selected, insert it at the top
    if target_match:
        matches.insert(0, target_match)
    
    return matches
