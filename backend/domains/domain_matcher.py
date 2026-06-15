"""
Domain Matcher
==============
Config-driven Role Matcher and Job Fit evaluator for non-IT domains.
Reuses normalized matching from skill_normalizer.py where appropriate,
but retrieves all roles, requirements, and categories from domain configs.
"""

import logging
from typing import Dict, List, Optional
from domains.registry import domain_registry
from ai_model.utils.skill_normalizer import fuzzy_match_skill, normalize_skill

logger = logging.getLogger(__name__)


def calculate_role_matches(extracted_skills: List[str], domain: str, target_role: Optional[str] = None) -> List[dict]:
    """
    Compares extracted skills against non-IT domain role requirements.
    Uses fuzzy matching and weights (core skills mapped from the config matrix).
    """
    if not domain_registry.is_registered(domain):
        return []

    roles = domain_registry.get_roles_for_domain(domain)
    salaries = domain_registry.get_role_salaries(domain)
    matrix = domain_registry.get_role_skill_matrix(domain)

    matches = []
    target_match = None

    for role, required_skills in roles.items():
        # Get role-specific skill weights from matrix
        # Core skills get weight 1.5, secondary 1.1, soft/others 0.8
        role_matrix = matrix.get(role, {})
        core_set = set([s.lower() for s in role_matrix.get("core", [])])
        secondary_set = set([s.lower() for s in role_matrix.get("secondary", [])])

        present_skills = []
        matched_required = set()
        fuzz_count = 0
        matched_weight = 0.0
        total_weight = 0.0

        # Calculate total weight
        for skill in required_skills:
            skill_lower = skill.lower()
            if skill_lower in core_set:
                total_weight += 1.5
            elif skill_lower in secondary_set:
                total_weight += 1.1
            else:
                total_weight += 0.8

        # Normalize extracted skills
        extracted_norm = [normalize_skill(s) for s in extracted_skills]

        # Match extracted skills to required skills
        for skill in required_skills:
            skill_lower = skill.lower()
            weight = 1.5 if skill_lower in core_set else (1.1 if skill_lower in secondary_set else 0.8)

            match_found = False
            # Try exact match first
            for ext_norm, ext_orig in zip(extracted_norm, extracted_skills):
                if ext_norm == skill_lower or ext_orig.lower() == skill_lower:
                    present_skills.append(ext_orig)
                    matched_weight += weight
                    match_found = True
                    break

            # Try fuzzy match if exact match fails
            if not match_found:
                for ext_orig in extracted_skills:
                    if fuzzy_match_skill(ext_orig, skill, threshold=0.80):
                        present_skills.append(ext_orig)
                        matched_weight += weight * 0.9  # 10% penalty for fuzzy match
                        fuzz_count += 1
                        match_found = True
                        break

        # Calculate percentage
        match_percent = int((matched_weight / max(total_weight, 1.0)) * 100)
        match_percent = min(100, max(0, match_percent))

        # Get missing skills (required but not matched)
        present_lower = set([s.lower() for s in present_skills])
        missing_skills = [s for s in required_skills if s.lower() not in present_lower]

        confidence = 1.0 - (fuzz_count / max(len(required_skills), 1)) * 0.1

        entry = {
            "role": role,
            "match": match_percent,
            "present": list(set(present_skills)),
            "missing": missing_skills,
            "salary": salaries.get(role, "$70k - $120k"),
            "confidence": round(confidence, 2),
            "fuzzy_matches": fuzz_count
        }

        if target_role and role.lower() == target_role.lower():
            target_match = entry
        else:
            matches.append(entry)

    # Sort by match percentage and confidence
    matches.sort(key=lambda x: (x["match"], x["confidence"]), reverse=True)

    if target_match:
        matches.insert(0, target_match)

    return matches


def get_skill_diversity_score(extracted_skills: List[str], domain: str) -> dict:
    """
    Config-driven skill diversity score based on categories defined in domain skills_dictionary.
    """
    if not domain_registry.is_registered(domain):
        return {
            "diversity_score": 0,
            "categories_covered": [],
            "categories_missing": []
        }

    config = domain_registry.get_domain(domain)
    skills_dict = config.get("skills_dictionary", {})

    extracted_norm = set(normalize_skill(s) for s in extracted_skills)
    categories_covered = set()

    for category, category_skills in skills_dict.items():
        cat_skills_norm = set(normalize_skill(s) for s in category_skills)
        if extracted_norm.intersection(cat_skills_norm):
            categories_covered.add(category)

    total_categories = len(skills_dict)
    diversity_percent = int((len(categories_covered) / max(total_categories, 1)) * 100)

    return {
        "diversity_score": diversity_percent,
        "categories_covered": list(categories_covered),
        "categories_missing": [cat for cat in skills_dict.keys() if cat not in categories_covered]
    }


def get_job_fits_with_diversity(extracted_skills: List[str], domain: str) -> dict:
    """
    Orchestrates both role matches and diversity analysis for the domain.
    """
    role_matches = calculate_role_matches(extracted_skills, domain)
    diversity = get_skill_diversity_score(extracted_skills, domain)

    return {
        "role_matches": role_matches,
        "diversity_analysis": diversity,
        "top_role": role_matches[0] if role_matches else None
    }
