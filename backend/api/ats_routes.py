"""
ats_routes.py
-------------
API routes for the 4-engine Resume Intelligence System.

Endpoints:
  POST /api/ats/analyze       — Full 4-engine analysis (Engines 1, 2, 3 + optional 4)
  POST /api/ats/match-jd      — Engine 4 only: JD matcher (standalone)
  GET  /api/ats/schema        — Returns the ResumeIntelligenceResponse schema for frontend dev
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from services.ats_analyzer import run_full_analysis
from services.ats_analyzer.ats_models import ResumeIntelligenceResponse, JDMatchResult
from services.ats_analyzer.jd_matcher import match_jd

router = APIRouter(prefix="/api/ats", tags=["resume-intelligence"])


# ── Request models ─────────────────────────────────────────────────────────

class FullAnalysisRequest(BaseModel):
    """
    Full Resume Intelligence analysis request.
    parsed_data: The structured dict from the resume parser.
    raw_text:    The original resume text string.
    jd_text:     Optional — if provided, Engine 4 (JD Matcher) will also run.
    """
    parsed_data: Dict[str, Any]
    raw_text: str = ""
    jd_text: Optional[str] = None


class JDMatchRequest(BaseModel):
    """Engine 4 standalone: compare a skill list + resume text against a JD."""
    resume_skills: List[str]
    resume_text: str = ""
    jd_text: str


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=ResumeIntelligenceResponse)
async def full_analysis(request: FullAnalysisRequest):
    """
    **Resume Intelligence System — Full Analysis**

    Runs all 4 engines in sequence:
      - Engine 1: Standalone ATS Benchmark (8 weighted dimensions, 100pts)
      - Engine 2: Target Role Alignment (XGBoost + Taxonomy, confidence + evidence)
      - Engine 3: Actionable Resume Fixes (11 rule-based rules, +X ATS per fix)
      - Engine 4: Enterprise JD Matcher (semantic + keyword, only if jd_text provided)

    Returns a unified `ResumeIntelligenceResponse` object.
    The frontend renders only this object and performs no business logic.
    """
    try:
        result = run_full_analysis(
            parsed_data=request.parsed_data,
            raw_text=request.raw_text,
            jd_text=request.jd_text,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume Intelligence analysis failed: {str(e)}")


@router.post("/match-jd", response_model=JDMatchResult)
async def match_job_description(request: JDMatchRequest):
    """
    **Engine 4: Enterprise ATS Job Description Matcher**

    Compare resume skills + text against a pasted job description.
    Returns semantic similarity, keyword match, matched/missing skills,
    inferred JD role, and 3 actionable recommendations.
    """
    try:
        if not request.jd_text.strip():
            raise HTTPException(status_code=400, detail="jd_text cannot be empty")

        result = match_jd(
            resume_skills=request.resume_skills,
            resume_text=request.resume_text,
            jd_text=request.jd_text,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD matching failed: {str(e)}")


@router.get("/schema")
async def get_schema():
    """Returns the full ResumeIntelligenceResponse JSON schema for frontend development."""
    return ResumeIntelligenceResponse.model_json_schema()
