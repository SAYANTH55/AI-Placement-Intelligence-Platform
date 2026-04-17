"""
Job Description Analyzer
Extracts requirements, skills, seniority level, salary from job postings
"""

import re
from typing import Dict, List, Optional
from ai_model.data.skills_data import SKILLS_DICTIONARY, ROLE_REQUIREMENTS
from ai_model.utils.skill_normalizer import normalize_skill


def analyze_jd(text):
    """Legacy function - use parse_job_description instead"""
    return parse_job_description(text)


def parse_job_description(jd_text: str) -> Dict:
    """
    ✅ IMPROVED: Parse job description and extract structured requirements
    
    Extracts:
    - Required skills (matched against our skill database)
    - Seniority level (Junior/Mid/Senior)
    - Salary range (if present)
    - Location type (Remote/Onsite/Hybrid)
    - Inferred job roles
    
    Returns: Structured JD analysis
    """
    jd_lower = jd_text.lower()
    
    # 1. Extract skills
    required_skills = extract_skills_from_jd(jd_text)
    
    # 2. Detect seniority level
    seniority = detect_seniority_level(jd_lower)
    
    # 3. Extract salary if present
    salary = extract_salary_range(jd_lower)
    
    # 4. Detect location type
    location_type = detect_location_type(jd_lower)
    
    # 5. Infer job roles based on skills
    inferred_roles = infer_job_roles(required_skills)
    
    return {
        "required_skills": list(set(required_skills)),  # Unique
        "skill_count": len(set(required_skills)),
        "seniority": seniority,
        "salary": salary,
        "location_type": location_type,
        "inferred_roles": inferred_roles,
        "job_category": inferred_roles[0]["name"] if inferred_roles else "Unknown",
        "experience_level": seniority,  # For backward compatibility
    }


def extract_skills_from_jd(jd_text: str) -> List[str]:
    """Extract all mentioned skills from JD"""
    jd_lower = jd_text.lower()
    found_skills = []
    
    # Search through all skill categories
    for category, skills in SKILLS_DICTIONARY.items():
        for skill in skills:
            skill_lower = skill.lower()
            
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
            if re.search(pattern, jd_lower):
                found_skills.append(skill)
    
    return found_skills


def detect_seniority_level(jd_lower: str) -> str:
    """Detect job seniority: Junior / Mid / Senior"""
    
    senior_keywords = ["senior", "lead", "principal", "staff", "architect", "manager", "director"]
    junior_keywords = ["junior", "entry", "intern", "graduate", "fresher", "trainee"]
    
    # Check for senior keywords
    if any(keyword in jd_lower for keyword in senior_keywords):
        return "Senior"
    
    # Check for junior keywords
    if any(keyword in jd_lower for keyword in junior_keywords):
        return "Junior"
    
    # Default to mid-level
    return "Mid-level"


def extract_salary_range(jd_lower: str) -> Optional[str]:
    """Extract salary range if mentioned"""
    
    # Pattern: $XXk - $XXk or $XX,XXX - $XX,XXX
    patterns = [
        r'\$(\d+)k?\s*[-–]\s*\$(\d+)k',  # $120k - $160k
        r'\$(\d+,\d+)\s*[-–]\s*\$(\d+,\d+)',  # $120,000 - $160,000
        r'salary[:\s]+\$(\d+)\s*k?[-–]\s*\$(\d+)\s*k',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, jd_lower)
        if match:
            low, high = match.groups()
            # Normalize to k format
            if ',' in low:
                low = str(int(low.replace(',', '')) // 1000)
            if ',' in high:
                high = str(int(high.replace(',', '')) // 1000)
            return f"${low}k - ${high}k"
    
    return None


def detect_location_type(jd_lower: str) -> str:
    """Detect if Remote, Onsite, or Hybrid"""
    
    if any(word in jd_lower for word in ["remote", "work from home", "wfh", "distributed"]):
        return "Remote"
    elif any(word in jd_lower for word in ["on-site", "onsite", "office", "in-office"]):
        return "On-site"
    elif any(word in jd_lower for word in ["hybrid", "flexible"]):
        return "Hybrid"
    
    return "Not specified"


def infer_job_roles(skills: List[str]) -> List[Dict]:
    """
    Match extracted skills against known role requirements
    to infer what role this JD is for
    
    Returns: Top 3 matching roles with match scores
    """
    role_scores = {}
    
    for role, required_skills in ROLE_REQUIREMENTS.items():
        # Count how many skills overlap
        role_skills_normalized = set(normalize_skill(s) for s in required_skills)
        extracted_normalized = set(normalize_skill(s) for s in skills)
        
        overlap = len(role_skills_normalized & extracted_normalized)
        
        if overlap > 0:
            # Score based on overlap percentage
            match_percent = int((overlap / len(required_skills)) * 100)
            role_scores[role] = {
                "match_count": overlap,
                "match_percent": match_percent,
                "match_skills": [s for s in required_skills if normalize_skill(s) in extracted_normalized]
            }
    
    # Sort by match count descending
    sorted_roles = sorted(
        role_scores.items(),
        key=lambda x: (x[1]["match_count"], x[1]["match_percent"]),
        reverse=True
    )
    
    # Return top 3 with details
    return [
        {
            "name": role,
            "match_percent": data["match_percent"],
            "matching_skills": data["match_skills"][:5],  # Top 5 matching skills
        }
        for role, data in sorted_roles[:3]
    ]
