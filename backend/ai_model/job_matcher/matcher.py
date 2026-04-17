from ai_model.data.skills_data import ROLE_REQUIREMENTS, ROLE_SALARIES
from ai_model.utils.skill_normalizer import (
    calculate_weighted_match,
    get_skill_diversity_score,
)

def calculate_role_matches(extracted_skills, target_role=None):
    """
    ✅ IMPROVED: Compares extracted skills against role requirements using fuzzy matching & weighted scoring
    
    Changes from original:
    - FIX 1 & 2: Uses normalized synonyms and fuzzy matching (ReactJS now matches React, etc.)
    - FIX 3: Weights core skills higher (Python matters more than Git for backend)
    - Returns confidence scores for transparency on match quality
    
    Args:
        extracted_skills: List of skills extracted from resume
        target_role: Optional specific role to prioritize
    
    Returns:
        List of role matches sorted by weighted match percentage
    """
    
    matches = []
    target_match = None
    
    for role, required_skills in ROLE_REQUIREMENTS.items():
        # Calculate weighted match (FIX 1, 2, 3)
        match_data = calculate_weighted_match(
            extracted_skills,
            required_skills,
            role_name=role,
            use_weights=True
        )
        
        entry = {
            "role": role,
            "match": match_data["match_percent"],  # Weighted percentage
            "present": match_data["present_skills"],
            "missing": match_data["missing_skills"],
            "salary": ROLE_SALARIES.get(role, "$70k - $120k"),
            "confidence": match_data["confidence"],  # New: transparency metric
            "fuzzy_matches": match_data["fuzzy_matches"],  # Debug info
        }
        
        # If this is the target role, save it separately
        if target_role and role.lower() == target_role.lower():
            target_match = entry
        else:
            matches.append(entry)
        
    # Sort remaining matches by weighted percentage + confidence
    matches.sort(key=lambda x: (x['match'], x['confidence']), reverse=True)
    
    # If a target role was selected, insert it at the top
    if target_match:
        matches.insert(0, target_match)
    
    return matches


def get_job_fits_with_diversity(extracted_skills):
    """
    Enhanced version that includes skill diversity scoring (FIX 4 foundation)
    
    Returns both role matches AND diversity analysis
    """
    role_matches = calculate_role_matches(extracted_skills)
    diversity = get_skill_diversity_score(extracted_skills)
    
    return {
        "role_matches": role_matches,
        "diversity_analysis": diversity,
        "top_role": role_matches[0] if role_matches else None,
    }
