"""
ats_models.py
-------------
Pydantic models for the 4-engine Resume Intelligence System.

Engine 1 — Standalone ATS Benchmark  : ATSBreakdown, ATSDimension
Engine 2 — Target Role Alignment      : RolePrediction
Engine 3 — Actionable Resume Fixes    : ResumeFix
Engine 4 — Enterprise JD Matcher      : JDMatchResult

Master Output                          : ResumeIntelligenceResponse
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


# ── ENGINE 1: Standalone ATS Benchmark ────────────────────────────────────

class ATSDimension(BaseModel):
    """One of the 8 scoring dimensions in the ATS Benchmark."""
    name: str
    score: int
    max_score: int
    weight: int          # out of 100
    label: str           # e.g. "Good", "Fair", "Poor"
    issues: List[str]
    strengths: List[str]


class ATSBreakdown(BaseModel):
    """All 8 dimensions of the standalone ATS benchmark."""
    structure: ATSDimension            # max 15
    skill_density: ATSDimension        # max 20
    experience_depth: ATSDimension     # max 15
    project_quality: ATSDimension      # max 15
    keyword_optimization: ATSDimension # max 10
    education_quality: ATSDimension    # max 10
    achievements: ATSDimension         # max 10
    formatting: ATSDimension           # max 5


# ── ENGINE 2: Target Role Alignment ───────────────────────────────────────

class RolePrediction(BaseModel):
    """One predicted role with full evidence."""
    title: str
    confidence: float               # 0-100
    matched_skills: List[str]
    missing_skills: List[str]
    evidence: str                   # e.g. "Matched 5 critical competencies"
    reason: str                     # human-readable 1-sentence summary


# ── ENGINE 3: Actionable Resume Fixes ─────────────────────────────────────

class ResumeFix(BaseModel):
    """A single deterministic, rule-based issue detected in the resume."""
    title: str                        # e.g. "Weak Achievement Statements"
    category: str                     # e.g. "Achievements", "Skills", "Portfolio"
    evidence: str                     # e.g. "No measurable numbers found"
    why_it_matters: str               # recruiter perspective
    recommended_fix: str              # concrete action
    estimated_improvement: str        # e.g. "+8 ATS"
    priority: str                     # "HIGH", "MEDIUM", "LOW"


# ── ENGINE 4: Enterprise JD Matcher ───────────────────────────────────────

class JDMatchResult(BaseModel):
    """Output of the Enterprise ATS Job Description Matcher."""
    semantic_match: float             # 0-100, cosine similarity via SentenceTransformer
    keyword_match: float              # 0-100, normalized keyword overlap
    final_ats: float                  # weighted blend
    matched_skills: List[str]
    missing_skills: List[str]
    inferred_jd_role: str             # best-guess role from JD text
    recommendations: List[str]        # top 3 actionable tips
    total_jd_skills: int
    resume_skill_coverage: float      # % of JD skills covered


# ── MASTER RESPONSE ────────────────────────────────────────────────────────

class ResumeIntelligenceResponse(BaseModel):
    """
    The unified Resume Intelligence Object.
    The frontend renders only this object — it performs no business logic.
    """
    # Meta
    overall_ats_score: int            # 0-100
    grade: str                        # "Excellent", "Good", "Fair", "Poor"
    grade_description: str            # 1-sentence grade context

    # Engine outputs
    breakdown: ATSBreakdown                      # Engine 1
    predicted_roles: List[RolePrediction]        # Engine 2
    actionable_fixes: List[ResumeFix]            # Engine 3
    jd_match: Optional[JDMatchResult] = None     # Engine 4 (only when JD provided)

    # Summary stats (for the statistics panel)
    total_skills_detected: int
    total_fixes: int
    top_role: str
    top_role_confidence: float

    # Parsing diagnostics (pass-through for debugging)
    parsing_diagnostics: Dict[str, Any]
