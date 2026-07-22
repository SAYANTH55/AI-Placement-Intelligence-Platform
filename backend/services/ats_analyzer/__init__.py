"""
services/ats_analyzer/__init__.py
----------------------------------
Master orchestrator for the 4-engine Resume Intelligence System.

Exports:
  run_full_analysis(parsed_data, raw_text, jd_text=None) -> ResumeIntelligenceResponse
"""

from typing import Dict, Any, Optional

from .ats_models import ResumeIntelligenceResponse
from .ats_scoring import score_resume, compute_total, score_to_grade
from .ats_role_detector import detect_roles
from .ats_recommendations import generate_fixes
from .jd_matcher import match_jd


def run_full_analysis(
    parsed_data: Dict[str, Any],
    raw_text: str,
    jd_text: Optional[str] = None,
) -> ResumeIntelligenceResponse:
    """
    Master entry point — runs all 4 engines and aggregates into
    the unified ResumeIntelligenceResponse object.

    Args:
        parsed_data: Structured dict from resume parser.
        raw_text:    Original resume text (for regex-based rules).
        jd_text:     Optional job description text for Engine 4.

    Returns:
        ResumeIntelligenceResponse (all engines aggregated).
    """
    skills = parsed_data.get("skills", [])

    # ── ENGINE 1: Standalone ATS Benchmark ────────────────────────────────
    breakdown = score_resume(parsed_data, raw_text)
    overall   = compute_total(breakdown)
    grade, grade_desc = score_to_grade(overall)

    # ── ENGINE 2: Target Role Alignment ───────────────────────────────────
    predicted_roles = detect_roles(skills)

    # ── ENGINE 3: Actionable Resume Fixes ─────────────────────────────────
    actionable_fixes = generate_fixes(parsed_data, raw_text, breakdown)

    # ── ENGINE 4: Enterprise JD Matcher (optional) ────────────────────────
    jd_result = None
    if jd_text and jd_text.strip():
        jd_result = match_jd(skills, raw_text, jd_text)

    # ── Summary stats ──────────────────────────────────────────────────────
    top_role       = predicted_roles[0].title if predicted_roles else "Unknown"
    top_confidence = predicted_roles[0].confidence if predicted_roles else 0.0

    return ResumeIntelligenceResponse(
        overall_ats_score=overall,
        grade=grade,
        grade_description=grade_desc,
        breakdown=breakdown,
        predicted_roles=predicted_roles,
        actionable_fixes=actionable_fixes,
        jd_match=jd_result,
        total_skills_detected=len(skills),
        total_fixes=len(actionable_fixes),
        top_role=top_role,
        top_role_confidence=top_confidence,
        parsing_diagnostics=parsed_data.get("diagnostics", {
            "sections_found": parsed_data.get("sections", []),
            "skills_detected": skills,
            "experience_years": parsed_data.get("experience", {}).get("years", 0),
        }),
    )
