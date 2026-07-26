"""
Domain Pipeline Orchestrator
============================
Orchestrates the resume processing and intelligence generation for non-IT domains.
Returns a data structure that exactly matches the API response contract.
"""

import re
import uuid
import logging
from typing import Dict, List, Optional

from domains.registry import domain_registry
from domains.domain_analyzer import domain_analyzer
from domains.domain_matcher import (
    calculate_role_matches,
    get_skill_diversity_score,
    get_job_fits_with_diversity
)
from domains.domain_preparation import generate_plan
from domains.domain_practice import get_domain_practice_set
from services.llm_service import generate_career_insights

logger = logging.getLogger(__name__)


def run_domain_pipeline(text: str, domain: str, target_role: Optional[str] = None) -> dict:
    """
    Executes the multi-domain pipeline on a non-IT resume.
    Ensures 100% compatibility with the existing 20-key API contract.
    """
    trace_id = f"tr_domain_{domain}_{uuid.uuid4().hex[:8]}"
    logger.info(f"Running Domain Pipeline for domain '{domain}' (Trace: {trace_id})")

    # 1. Domain-Specific Analysis & Skill Extraction
    analysis_res = domain_analyzer.analyze_resume(text, domain, target_role)
    found_skills = analysis_res["skills_found"]
    top_role_name = analysis_res["role_fit"]
    skill_score = analysis_res["skill_score"]
    ats_score = analysis_res["ats_score"]

    # 2. Domain-Specific Role Matching & Diversity Analysis
    role_matches_dict = get_job_fits_with_diversity(found_skills, domain)
    role_matches = role_matches_dict["role_matches"]
    diversity_info = role_matches_dict["diversity_analysis"]
    diversity_score = diversity_info["diversity_score"]

    # Determine top role and fallback
    top_role = role_matches[0] if role_matches else {
        "role": top_role_name,
        "match": int(skill_score),
        "present": found_skills,
        "missing": analysis_res["gaps"],
        "salary": "$60k - $100k",
        "confidence": 1.0
    }

    # 3. Target Role & Match Quality
    target_role_val = target_role or top_role["role"]
    match_pct = top_role["match"]
    if match_pct >= 80:
        match_quality = "Strong Match"
    elif match_pct >= 50:
        match_quality = "Good Match"
    elif match_pct >= 25:
        match_quality = "Moderate Match"
    else:
        match_quality = "Needs Development"

    # 4. Ingestion-compatible Student Profile Construction
    # Map years of experience from simple text search or defaults
    exp_years = 0
    exp_match = re.search(r'(\d+)\+?\s*years?\s+of\s+experience', text.lower())
    if exp_match:
        exp_years = int(exp_match.group(1))
    else:
        # Check single digits
        exp_match2 = re.search(r'\b(\d)\b\s*years?', text.lower())
        if exp_match2:
            exp_years = int(exp_match2.group(1))

    # Format skills list as objects
    skill_objects = []
    for s in found_skills:
        skill_objects.append({
            "name": s,
            "confidence": 1.0,
            "weight": 1.0,
            "source": "resume"
        })

    student_profile = {
        "student_id": f"std_{uuid.uuid4().hex[:8]}",
        "profile": {
            "email": "candidate@example.com",
            "name": "Candidate Name"
        },
        "skills": skill_objects,
        "experience": {
            "years": exp_years,
            "projects": []
        },
        "education": {
            "degree": "Degree",
            "branch": "Branch",
            "cgpa": 0.0
        },
        "metadata": {
            "raw_text": text,
            "detected_domain": domain
        },
        "flags": []
    }

    # 5. Domain-Specific Profile Strength & Readiness Calibration
    # Calculate a proxy profile strength score based on skill score & diversity
    base_prob = (skill_score * 0.7 + diversity_score * 0.3) / 100.0
    placement_probability = min(0.95, max(0.20, base_prob))
    
    if placement_probability >= 0.75:
        readiness = "High"
    elif placement_probability >= 0.40:
        readiness = "Medium"
    else:
        readiness = "Low"

    prediction = {
        "placement_probability": round(placement_probability, 2),
        "readiness": readiness,
        "predicted_score": round(placement_probability, 2)
    }

    # 6. Domain-Specific Preparation Roadmap & Practice Questions
    missing_for_prep = top_role["missing"]
    preparation_plan = generate_plan(missing_for_prep, top_role["role"], domain)
    practice_set = get_domain_practice_set(domain, top_role["role"])

    # 7. LLM Insights Layer
    roles_detected = [r["role"] for r in role_matches]
    llm_insights_input = {
        "skills": found_skills,
        "missing_skills": missing_for_prep,
        "roles": roles_detected,
        "score": int(placement_probability * 100)
    }
    llm_insights = generate_career_insights(llm_insights_input)

    # 8. Experience Advantage Roles (roles matching our core strength)
    experience_advantage_roles = []
    for r in role_matches:
        if r["match"] >= 65:
            experience_advantage_roles.append(r["role"])

    # Build the final 20-key dictionary exactly matching the expected schema
    result = {
        "student_profile": student_profile,
        "extractedText": text,
        "skills": found_skills,
        "experience": f"{exp_years} years",
        "prediction": prediction,
        "roleMatches": role_matches,
        "topRole": top_role,
        "roles_detected": roles_detected,
        "missing_skills": missing_for_prep,
        "experience_advantage_roles": experience_advantage_roles,
        "diversityScore": diversity_score,
        "targetRole": target_role_val,
        "matchQuality": match_quality,
        "llm_enhancement": {
            "inferred_roles": [],
            "inferred_skills": [],
            "summary": "Processed via domain pipeline for " + domain
        },
        "llm_insights": llm_insights,
        "preparation_plan": preparation_plan,
        "practice_set": practice_set,
        "trace_id": trace_id,
        "requires_verification": False,
        "custom_ml_analysis": analysis_res
    }

    return result
