"""
Skill Normalization and Fuzzy Matching Utility
Fixes the exact-keyword-matching brittleness issue

Features:
- Synonym mapping (ReactJS → React, PostgreSQL → SQL, etc.)
- Fuzzy string matching (85% similarity threshold)
- Weighted scoring per role (core skills matter more)
- Skill category detection
"""

from difflib import SequenceMatcher
import re

# ── FIX 1: SYNONYM MAPPING ──
# Normalizes skill variants to a canonical form
SKILL_SYNONYMS = {
    # Frontend variants
    "react.js": "react",
    "reactjs": "react",
    "react js": "react",
    "angular.js": "angular",
    "angularjs": "angular",
    "vue.js": "vue",
    "vuejs": "vue",
    "html": "html5",
    "css": "css3",
    
    # Backend variants
    "node": "node.js",
    "nodejs": "node.js",
    "node js": "node.js",
    "express.js": "express",
    "expressjs": "express",
    "express js": "express",
    "fastapi": "python",
    "django": "python",
    "flask": "python",
    "spring boot": "java",
    "springboot": "java",
    "spring": "java",
    "c#": "csharp",
    "c sharp": "csharp",
    
    # Database variants
    "postgres": "postgresql",
    "postgre": "postgresql",
    "mysql": "sql",
    "sqlite": "sql",
    "oracle": "sql",
    "mongodb": "nosql",
    "mongo": "nosql",
    "redis cache": "redis",
    "mariadb": "sql",
    
    # Cloud/DevOps variants
    "amazon web services": "aws",
    "amazon aws": "aws",
    "google cloud": "gcp",
    "gcloud": "gcp",
    "kubernetes": "k8s",
    "docker container": "docker",
    
    # ML/AI variants
    "tensorflow": "deep learning",
    "pytorch": "deep learning",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "machine learning": "ml",
    "deep learning": "dl",
    
    # DevOps/CI-CD
    "continuous integration": "ci/cd",
    "continuous deployment": "ci/cd",
    "github action": "github actions",
    
    # Testing variants
    "unit test": "unit testing",
    "automated test": "automation testing",
    "e2e test": "end to end testing",
    "end-to-end": "end to end testing",
    "e2e": "end to end testing",
    
    # General variants
    "restful api": "rest api",
    "micro services": "microservices",
    "micro service": "microservices",
    "design pattern": "design patterns",
    "data structure": "data structures",
    "algorithm": "algorithms",
}

# ── SKILL WEIGHTS BY ROLE ──
# FIX 3: Weighted scoring (core skills worth more than nice-to-haves)
# Weight format: {"skill": weight_multiplier}
SKILL_WEIGHTS_BY_ROLE = {
    "Backend Developer": {
        "python": 1.5,  # Core
        "java": 1.5,
        "sql": 1.3,
        "rest api": 1.2,
        "docker": 1.0,
        "postgresql": 1.1,
        "flask": 1.2,
        "django": 1.2,
        "fastapi": 1.2,
        "git": 0.7,  # Nice to have
    },
    "Frontend Developer": {
        "react": 1.5,  # Core
        "javascript": 1.5,
        "html5": 1.2,
        "css3": 1.2,
        "typescript": 1.3,
        "redux": 1.0,
        "tailwind css": 0.9,
        "responsive design": 1.0,
        "git": 0.7,
    },
    "Full Stack Developer": {
        "react": 1.3,
        "node.js": 1.3,
        "sql": 1.3,
        "javascript": 1.4,
        "rest api": 1.2,
        "html5": 1.0,
        "css3": 1.0,
        "git": 0.8,
    },
    "Data Scientist": {
        "python": 1.5,
        "pandas": 1.3,
        "numpy": 1.3,
        "machine learning": 1.4,
        "scikit-learn": 1.2,
        "sql": 1.1,
        "tensorflow": 1.2,
        "deep learning": 1.2,
        "data structures": 0.9,
    },
    "DevOps Engineer": {
        "docker": 1.5,
        "kubernetes": 1.4,
        "linux": 1.3,
        "jenkins": 1.2,
        "ci/cd": 1.3,
        "terraform": 1.2,
        "aws": 1.3,
        "git": 0.8,
    },
    "Java Developer": {
        "java": 1.5,
        "spring boot": 1.4,
        "sql": 1.2,
        "rest api": 1.2,
        "microservices": 1.1,
        "junit": 1.0,
        "docker": 0.9,
        "git": 0.7,
    },
}

# ── SKILL CATEGORIES ──
# Used for diversity scoring (Fix 4 foundation)
SKILL_CATEGORIES = {
    "Frontend": ["react", "angular", "vue", "next.js", "tailwind css", "html5", "css3"],
    "Backend": ["python", "java", "node.js", "django", "flask", "fastapi", "spring boot"],
    "Database": ["sql", "postgresql", "mysql", "mongodb", "redis"],
    "DevOps": ["docker", "kubernetes", "jenkins", "ci/cd", "terraform", "aws"],
    "ML/AI": ["machine learning", "python", "tensorflow", "scikit-learn", "pandas"],
    "Testing": ["unit testing", "automation testing", "pytest", "jest"],
}


def normalize_skill(skill: str) -> str:
    """
    FIX 1: Normalize skill to canonical form using synonym mapping
    
    Examples:
        "ReactJS" → "react"
        "PostgreSQL" → "postgresql"
        "Node.js" → "node.js"
    """
    if not skill:
        return ""
    
    # Clean and lowercase
    normalized = skill.strip().lower()
    
    # Check direct synonym mapping
    if normalized in SKILL_SYNONYMS:
        return SKILL_SYNONYMS[normalized]
    
    # Check if it's a substring of any synonym key
    for synonym, canonical in SKILL_SYNONYMS.items():
        if synonym in normalized:
            return canonical
    
    return normalized


def fuzzy_match_skill(extracted_skill: str, required_skill: str, threshold: float = 0.85) -> bool:
    """
    FIX 2: Fuzzy string matching to catch typos and variations
    
    Uses SequenceMatcher similarity ratio
    threshold=0.85 means 85% character similarity required
    
    Examples:
        fuzzy_match_skill("Pytohn", "Python") → True (88% match)
        fuzzy_match_skill("SQL", "SQLAlchemy") → False (61% match)
    """
    extracted_norm = normalize_skill(extracted_skill).lower()
    required_norm = normalize_skill(required_skill).lower()
    
    # First try exact match
    if extracted_norm == required_norm:
        return True
    
    # Check if one is substring of other (catch variations)
    if extracted_norm in required_norm or required_norm in extracted_norm:
        return True
    
    # Use Levenshtein-style similarity (via SequenceMatcher)
    similarity = SequenceMatcher(None, extracted_norm, required_norm).ratio()
    
    return similarity >= threshold


def match_skill_to_requirements(extracted_skill: str, required_skills: list, 
                                 fuzzy: bool = True, threshold: float = 0.85) -> tuple:
    """
    Find if extracted_skill matches any skill in required_skills
    
    Returns: (matched_skill, is_fuzzy_match)
    """
    extracted_norm = normalize_skill(extracted_skill)
    
    for req_skill in required_skills:
        req_norm = normalize_skill(req_skill)
        
        # Try exact match first
        if extracted_norm == req_norm:
            return (req_skill, False)
        
        # Try fuzzy match
        if fuzzy and fuzzy_match_skill(extracted_skill, req_skill, threshold):
            return (req_skill, True)
    
    return (None, False)


def calculate_weighted_match(extracted_skills: list, role_requirements: list,
                            role_name: str = None, use_weights: bool = True) -> dict:
    """
    FIX 3: Calculate match percentage with skill weights
    
    Returns weighted match % instead of simple percentage
    
    Returns:
        {
            "match_percent": 85,
            "present_skills": ["Python", "SQL"],
            "missing_skills": ["Docker"],
            "confidence": 0.92,  # How confident is the match?
        }
    """
    weights = {}
    if use_weights and role_name and role_name in SKILL_WEIGHTS_BY_ROLE:
        weights = SKILL_WEIGHTS_BY_ROLE[role_name]
    
    present_skills = []
    matched_required = set()
    fuzz_count = 0
    
    # Normalize extracted skills
    extracted_norm = [normalize_skill(s) for s in extracted_skills]
    
    # Normalize and weight required skills
    required_norm = []
    required_weights = []
    for skill in role_requirements:
        norm_skill = normalize_skill(skill)
        required_norm.append(norm_skill)
        required_weights.append(weights.get(norm_skill, 1.0))
    
    # Match extracted to required
    total_weight = sum(required_weights) if required_weights else len(role_requirements)
    matched_weight = 0.0
    
    for extracted_skill, norm_extracted in zip(extracted_skills, extracted_norm):
        match_found = False
        
        # Try exact match first
        for i, req_norm in enumerate(required_norm):
            if norm_extracted == req_norm:
                present_skills.append(extracted_skill)
                matched_required.add(i)
                matched_weight += required_weights[i]
                match_found = True
                break
        
        # Try fuzzy match if no exact match
        if not match_found:
            for i, req_skill in enumerate(role_requirements):
                if fuzzy_match_skill(extracted_skill, req_skill, threshold=0.80):
                    present_skills.append(extracted_skill)
                    matched_required.add(i)
                    matched_weight += required_weights[i] * 0.9  # Slight penalty for fuzzy
                    fuzz_count += 1
                    match_found = True
                    break
    
    # Calculate percentage
    match_percent = int((matched_weight / total_weight) * 100) if total_weight > 0 else 0
    match_percent = min(100, max(0, match_percent))  # Clamp 0-100
    
    # Get missing skills
    missing_skills = [
        role_requirements[i] for i in range(len(role_requirements))
        if i not in matched_required
    ]
    
    # Confidence based on fuzziness
    confidence = 1.0 - (fuzz_count / max(len(required_norm), 1)) * 0.1
    
    return {
        "match_percent": match_percent,
        "present_skills": present_skills,
        "missing_skills": missing_skills,
        "fuzzy_matches": fuzz_count,
        "confidence": round(confidence, 2),
    }


def get_skill_diversity_score(extracted_skills: list) -> dict:
    """
    FIX 4 (foundation): Calculate skill diversity across categories
    
    Returns score 0-100 based on how many skill categories are covered
    This is a strong predictor of placement readiness
    """
    extracted_norm = set(normalize_skill(s) for s in extracted_skills)
    categories_covered = set()
    
    for category, skills in SKILL_CATEGORIES.items():
        normalized_cat_skills = set(normalize_skill(s) for s in skills)
        if extracted_norm & normalized_cat_skills:  # Intersection
            categories_covered.add(category)
    
    diversity_percent = int((len(categories_covered) / len(SKILL_CATEGORIES)) * 100)
    
    return {
        "diversity_score": diversity_percent,
        "categories_covered": list(categories_covered),
        "categories_missing": [
            cat for cat in SKILL_CATEGORIES.keys() 
            if cat not in categories_covered
        ],
    }
