import re

def normalize_experience(experience_value) -> float:
    """
    Converts experience descriptors like '2 years' or '5+ yrs' to a float like 2.0 or 5.0
    """
    if isinstance(experience_value, (int, float)):
        return float(experience_value)
    
    val = str(experience_value).lower()
    match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)?', val)
    if match:
        return float(match.group(1))
    
    return 0.0

def normalize_skills(skills_list: list) -> list:
    """
    Standardize skills by removing exact duplicates while preserving high-confidence hits.
    Also ensures they fit the required {"name":, "confidence":, "source":} format.
    """
    normalized = {}
    for skill in skills_list:
        if isinstance(skill, str):
            skill = {"name": skill, "confidence": 0.85, "source": "unknown"}
            
        name_lower = skill.get("name", "").lower().strip()
        if not name_lower:
            continue
            
        if name_lower not in normalized or skill.get("confidence", 0) > normalized[name_lower].get("confidence", 0):
            # Prefer higher confidence match if duplicate exists
            skill["name"] = skill["name"].title() # Consistency
            normalized[name_lower] = skill
            
    return list(normalized.values())

def normalize_text_fields(text: str) -> str:
    """
    Cleans up stray characters or excessive whitespaces.
    """
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
