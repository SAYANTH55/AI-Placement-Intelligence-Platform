"""
candidate_intelligence.py
─────────────────────────
Candidate Intelligence Builder & Aggregation Service.

Acts as the central brain layer for the AI Placement Intelligence Platform.
Aggregates outputs from every intelligence module (Parser, ML Predictor, Matcher,
ATS Analyzer, Domain Router, Preparation Engine, Custom ML Analysis) into a single,
rich, deterministic CandidateIntelligenceProfile (CIP) object.

This service NEVER calls external LLMs directly. All derived features and
classifications are computed using deterministic logic.
"""

from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


def build_candidate_intelligence_profile(
    student_profile: Optional[Dict[str, Any]] = None,
    role_matches: Optional[List[Dict[str, Any]]] = None,
    prediction: Optional[Dict[str, Any]] = None,
    llm_output: Optional[Dict[str, Any]] = None,
    diversity_info: Optional[Dict[str, Any]] = None,
    preparation_plan: Optional[Dict[str, Any]] = None,
    custom_ml_analysis: Optional[Dict[str, Any]] = None,
    domain_result: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Builds a unified, structured CandidateIntelligenceProfile (CIP) from all available
    platform intelligence modules.
    
    Safe & resilient: Degrades gracefully if any input module is missing or None.
    """
    student_profile = student_profile or {}
    role_matches = role_matches or []
    prediction = prediction or {}
    llm_output = llm_output or {}
    diversity_info = diversity_info or {}
    preparation_plan = preparation_plan or {}
    custom_ml_analysis = custom_ml_analysis or {}

    # Extract base metadata
    skills_objs = student_profile.get("skills", [])
    skills_list = [s["name"] if isinstance(s, dict) else str(s) for s in skills_objs]
    if not skills_list and isinstance(student_profile.get("skills"), list):
        skills_list = [str(s) for s in student_profile["skills"]]
        
    raw_exp = student_profile.get("experience", {})
    exp_years = raw_exp.get("years", 0) if isinstance(raw_exp, dict) else 0

    projects = student_profile.get("projects", [])
    education = student_profile.get("education", {})

    # Top role information
    top_role_obj = role_matches[0] if role_matches else {}
    top_role_title = top_role_obj.get("role", "Software Engineer")
    top_role_match_score = top_role_obj.get("match", 0)
    top_role_match_pct = int(top_role_match_score * 100) if top_role_match_score <= 1.0 else int(top_role_match_score)
    top_role_missing = top_role_obj.get("missing", [])

    secondary_role_obj = role_matches[1] if len(role_matches) > 1 else {}
    secondary_role_title = secondary_role_obj.get("role", "Full Stack Developer")
    secondary_role_match_pct = int(secondary_role_obj.get("match", 0) * 100) if secondary_role_obj.get("match", 0) <= 1.0 else int(secondary_role_obj.get("match", 0))

    # Domain classification
    domain_name = "IT"
    domain_confidence = 0.9
    if domain_result:
        domain_name = getattr(domain_result, "domain", "IT")
        domain_confidence = getattr(domain_result, "confidence", 0.9)

    # Profile Strength Index
    prob = prediction.get("placement_probability", prediction.get("current_score", 0.5))
    placement_score_pct = int(prob * 100) if prob <= 1.0 else int(prob)

    # ATS Quality score (from custom ML or estimation)
    ats_score = custom_ml_analysis.get("ats_benchmark_score", 72)
    if not ats_score:
        ats_score = min(95, max(40, len(skills_list) * 4 + (15 if projects else 0)))

    # ── DERIVED FEATURE ENGINES ───────────────────────────────────────────────
    
    # 1. Candidate Persona
    persona = _infer_persona(top_role_title, domain_name, skills_list, projects)

    # 2. Candidate Stage
    stage = _infer_stage(placement_score_pct, ats_score, exp_years, len(projects), top_role_match_pct)

    # 3. Recruiter Confidence & Reasons
    recruiter_conf, conf_reasons = _infer_recruiter_confidence(
        ats_score, placement_score_pct, top_role_match_pct, len(projects), len(skills_list)
    )

    # 4. Resume Strength
    resume_strength, impact_fix = _infer_resume_strength(ats_score, student_profile)

    # 5. Technical Maturity & Depth
    tech_maturity, tech_depth_pct = _infer_technical_maturity(skills_list, projects, top_role_match_pct)

    # 6. Skill Utilization & Breadth
    skill_breadth = len(diversity_info.get("categories_covered", [])) or max(1, len(skills_list) // 3)
    skill_utilization_pct = min(100, int((len(skills_list) / max(1, len(skills_list) + len(top_role_missing))) * 100))

    # 7. Portfolio Strength
    portfolio_strength = _infer_portfolio_strength(projects)

    # 8. Improvement Potential & Placement Outlook
    imp_potential = "Very High" if placement_score_pct < 50 else "High" if placement_score_pct < 75 else "Moderate"
    placement_outlook = "High Readiness" if placement_score_pct >= 75 else "Strong Candidate" if placement_score_pct >= 60 else "Developing Candidate"

    # 9. Strengths & Gaps Ranking
    ranked_strengths = llm_output.get("strengths", [])[:3] or skills_list[:3] or ["Programming Fundamentals", "Problem Solving"]
    ranked_gaps = top_role_missing[:3] or llm_output.get("weaknesses", [])[:3] or ["System Architecture", "Cloud Deployment"]

    # 10. Interview Readiness Confidence
    interview_readiness_pct = min(100, int(placement_score_pct * 0.9 + (10 if exp_years > 0 else 0)))

    # ── STRUCTURED CIP OBJECT ──────────────────────────────────────────────────
    cip = {
        "candidate": {
            "persona": persona,
            "stage": stage,
            "recruiter_confidence": recruiter_conf,
            "recruiter_confidence_reasons": conf_reasons,
            "experience_years": exp_years,
            "education": education.get("degree", "Degree Program") if isinstance(education, dict) else "Student",
        },
        "placement": {
            "score_pct": placement_score_pct,
            "outlook": placement_outlook,
            "readiness": prediction.get("readiness", "Medium"),
            "improvement_potential": imp_potential,
        },
        "resume": {
            "ats_quality": ats_score,
            "strength": resume_strength,
            "highest_impact_fix": impact_fix,
        },
        "technical": {
            "maturity": tech_maturity,
            "depth_pct": tech_depth_pct,
            "interview_readiness_pct": interview_readiness_pct,
            "company_readiness": "Tier-1 & Product Companies" if placement_score_pct >= 70 else "Growing Tech Startups",
        },
        "skills": {
            "total_count": len(skills_list),
            "breadth": skill_breadth,
            "utilization_pct": skill_utilization_pct,
            "detected_list": skills_list,
            "top_strengths": ranked_strengths,
        },
        "role": {
            "primary_role": top_role_title,
            "primary_match_pct": top_role_match_pct,
            "secondary_role": secondary_role_title,
            "secondary_match_pct": secondary_role_match_pct,
        },
        "portfolio": {
            "strength": portfolio_strength,
            "project_count": len(projects),
        },
        "gaps": {
            "total_count": len(top_role_missing),
            "critical_gaps": ranked_gaps,
        },
        "domain": {
            "primary_domain": domain_name,
            "confidence": domain_confidence,
        },

        # Executive summary inputs block consumed directly by llm_service.py
        "meta": {
            "executive_summary_inputs": {
                "candidate_persona": persona,
                "candidate_stage": stage,
                "experience_years": exp_years,
                "domain": domain_name,
                "career_focus": f"{top_role_title} ({domain_name})",
                "primary_career_track": top_role_title,
                "placement_score_pct": placement_score_pct,
                "placement_outlook": placement_outlook,
                "improvement_potential": imp_potential,
                "ats_score": ats_score,
                "resume_strength": resume_strength,
                "highest_impact_resume_fix": impact_fix,
                "technical_maturity": tech_maturity,
                "technical_depth_pct": tech_depth_pct,
                "interview_readiness_pct": interview_readiness_pct,
                "company_readiness": "Tier-1 & Product Companies" if placement_score_pct >= 70 else "Growing Tech Startups",
                "skill_count": len(skills_list),
                "skill_breadth": skill_breadth,
                "skill_utilization_pct": skill_utilization_pct,
                "top_3_strengths": ranked_strengths,
                "portfolio_strength": portfolio_strength,
                "top_role": top_role_title,
                "top_role_match_pct": top_role_match_pct,
                "top_3_gaps": ranked_gaps,
                "recruiter_confidence": recruiter_conf,
                "highest_impact_skill": ranked_gaps[0] if ranked_gaps else "System Design",
            }
        }
    }

    return cip


# ── DETERMINISTIC DERIVATION HELPERS ─────────────────────────────────────────

def _infer_persona(top_role: str, domain: str, skills: List[str], projects: List[Any]) -> str:
    """Classifies the candidate into one of 15 standard personas deterministically."""
    skills_lower = [s.lower() for s in skills]
    role_lower = top_role.lower()

    if any(k in role_lower for k in ["backend", "node", "django", "fastapi", "java"]):
        return "Backend Engineering Candidate"
    if any(k in role_lower for k in ["frontend", "react", "vue", "angular"]):
        return "Frontend Engineering Candidate"
    if any(k in role_lower for k in ["full stack", "fullstack", "web developer"]):
        return "Full Stack Candidate"
    if any(k in role_lower for k in ["data scientist", "machine learning", "ml", "ai"]):
        return "AI / Machine Learning Candidate"
    if any(k in role_lower for k in ["data analyst", "analytics", "business intelligence"]):
        return "Data Science & Analytics Candidate"
    if any(k in role_lower for k in ["devops", "cloud", "aws", "kubernetes"]):
        return "DevOps & Infrastructure Candidate"
    if any(k in role_lower for k in ["mobile", "android", "ios", "flutter", "react native"]):
        return "Mobile Development Candidate"
    
    # Skill-based fallback
    if any(s in skills_lower for s in ["react", "javascript", "css", "html"]):
        if any(s in skills_lower for s in ["python", "node", "sql"]):
            return "Full Stack Candidate"
        return "Frontend Engineering Candidate"
    if any(s in skills_lower for s in ["python", "machine learning", "pandas", "tensorflow"]):
        return "AI / Machine Learning Candidate"

    return "Software Engineering Candidate"


def _infer_stage(score: int, ats: int, exp: int, project_count: int, role_match: int) -> str:
    """Infer candidate maturity stage."""
    if score >= 75 and ats >= 75 and role_match >= 70:
        return "Industry Ready"
    if score >= 65 and (project_count >= 2 or exp >= 1):
        return "Interview Ready"
    if score >= 50 and ats >= 60:
        return "Placement Ready"
    if score >= 35:
        return "Emerging"
    return "Beginner"


def _infer_recruiter_confidence(ats: int, score: int, role_match: int, projects: int, skills: int) -> tuple:
    """Infer recruiter screening confidence and reasons."""
    reasons = []
    points = 0
    
    if ats >= 75:
        points += 2
        reasons.append("High ATS compliance score")
    elif ats >= 60:
        points += 1
    else:
        reasons.append("Resume formatting needs optimization")

    if score >= 65:
        points += 2
        reasons.append("Strong overall placement readiness metric")
    elif score >= 45:
        points += 1

    if role_match >= 70:
        points += 2
        reasons.append("High target role alignment")

    if projects >= 2:
        points += 1
        reasons.append("Verified project portfolio evidence")

    if points >= 6:
        return ("Very High", reasons)
    if points >= 4:
        return ("High", reasons)
    if points >= 2:
        return ("Moderate", reasons)
    return ("Low", reasons)


def _infer_resume_strength(ats: int, profile: Dict[str, Any]) -> tuple:
    """Infer resume strength and top impact fix."""
    if ats >= 80:
        strength = "Excellent"
        fix = "Add quantifiable metrics to key achievements (e.g. 'improved speed by 25%')"
    elif ats >= 65:
        strength = "Strong"
        fix = "Tailor keyword density to match top target role requirements"
    elif ats >= 50:
        strength = "Average"
        fix = "Expand technical project bullet points and add missing core skills"
    else:
        strength = "Weak"
        fix = "Reformat layout with standard ATS section headers and clean typography"
    return (strength, fix)


def _infer_technical_maturity(skills: List[str], projects: List[Any], role_match: int) -> tuple:
    """Infer technical maturity level and depth %."""
    depth = min(100, max(20, len(skills) * 6 + (20 if projects else 0) + int(role_match * 0.3)))
    if depth >= 75:
        maturity = "Advanced"
    elif depth >= 55:
        maturity = "Intermediate"
    else:
        maturity = "Foundational"
    return (maturity, depth)


def _infer_portfolio_strength(projects: List[Any]) -> str:
    """Infer portfolio strength from projects list."""
    count = len(projects)
    if count >= 3:
        return "Strong"
    if count >= 1:
        return "Moderate"
    return "Limited"
