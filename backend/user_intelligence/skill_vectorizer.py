
from ai_model.data.skills_data import SKILLS_DICTIONARY, SKILL_TOPICS
import logging

logger = logging.getLogger(__name__)

def estimate_depth(skill_name: str, projects: list) -> str:
    """
    Logic-based depth estimation (PHASE 2).
    """
    # Count how many projects mention this skill
    project_count = 0
    high_complexity = False
    
    for p in projects:
        if skill_name in p.get("skills", []):
            project_count += 1
            if p.get("complexity") == "medium":
                high_complexity = True
                
    if project_count >= 2 and high_complexity:
        return "advanced"
    elif project_count >= 1:
        return "intermediate"
    else:
        return "basic"

def vectorize_skills(student_profile: dict) -> dict:
    """
    ✅ ENHANCED (PHASE 2): Hierarchical vectorization with depth and context.
    """
    skills_array = student_profile.get("skills", [])
    projects = student_profile.get("projects", [])
    vector_space = {}
    
    if not skills_array:
        return vector_space
        
    for skill_obj in skills_array:
        name = skill_obj.get("name", "")
        if not name: continue
        
        confidence = skill_obj.get("confidence", 0.5)
        weight = skill_obj.get("weight", 1.0)
        
        # Phase 2: Context Aggregation
        contexts = []
        for p in projects:
            if name in p.get("skills", []):
                contexts.extend(p.get("contexts", []))
        
        # Phase 2: Depth Estimation
        depth = estimate_depth(name, projects)
        
        # Stability logic (PHASE 2 stub)
        stability = 0.5 + (0.1 if depth == "advanced" else 0)
        
        # Initial score blending
        base_score = round(min(confidence * weight, 1.0), 2)
        
        subskills = {}
        category_match = None
        for cat, top_skills in SKILLS_DICTIONARY.items():
            if name in top_skills:
                category_match = cat
                break
                
        if category_match:
            sub_matches = SKILL_TOPICS.get(category_match, [])
            for sub in sub_matches[:3]:
                subskills[sub] = round(base_score * 0.85, 2)
        else:
             subskills["Core Mechanics"] = round(base_score * 0.85, 2)
        
        vector_space[name] = {
            "score": base_score,
            "depth": depth,
            "contexts": list(set(contexts)),
            "confidence": confidence,
            "stability": round(stability, 2),
            "subskills": subskills
        }
        
    return vector_space
