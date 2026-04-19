"""
Engine API Routes
=================
New routes for the Preparation, Practice, and Tracking engines.
Follows the same pattern as endpoints.py — FastAPI router, Pydantic models, DB session injection.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from database.db import get_db
from services.preparation_engine import generate_plan
from services.practice_engine import get_practice_set
from services import tracking_engine

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request Schemas ───────────────────────────────────────────────────────────

class PreparationRequest(BaseModel):
    missing_skills: List[str]
    top_role: str

class PracticeRequest(BaseModel):
    top_role: str
    skills: Optional[List[str]] = []
    limit_coding: Optional[int] = 10
    limit_aptitude: Optional[int] = 15
    limit_interview: Optional[int] = 12

class SessionRecordRequest(BaseModel):
    user_id: int
    placement_score: Optional[float] = None
    skills_snapshot: Optional[List[str]] = []
    aptitude_score: Optional[float] = None
    coding_score: Optional[float] = None
    interview_score: Optional[float] = None
    target_role: Optional[str] = None
    completed_topics: Optional[List[str]] = []

class FeedbackRequest(BaseModel):
    user_id: int
    current_skills: List[str]
    new_skills: List[str]
    top_role: Optional[str] = None


# ── Preparation Engine Routes ─────────────────────────────────────────────────

@router.post("/preparation/plan")
async def get_preparation_plan(data: PreparationRequest):
    """
    Generate a structured learning roadmap from missing skills and a target role.
    100% Deterministic — no LLM calls.
    """
    try:
        plan = generate_plan(
            missing_skills=data.missing_skills,
            top_role=data.top_role
        )
        return {"status": "success", "data": plan}
    except Exception as e:
        logger.error(f"Preparation plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Practice Engine Routes ────────────────────────────────────────────────────

@router.post("/practice/set")
async def get_practice_questions(data: PracticeRequest):
    """
    Return a role-filtered set of aptitude, coding, and interview questions.
    Sourced from embedded curated dataset — no LLM calls.
    """
    try:
        practice_set = get_practice_set(
            top_role=data.top_role,
            user_skills=data.skills,
            limit_coding=data.limit_coding,
            limit_aptitude=data.limit_aptitude,
            limit_interview=data.limit_interview
        )
        return {"status": "success", "data": practice_set}
    except Exception as e:
        logger.error(f"Practice set error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Tracking Engine Routes ────────────────────────────────────────────────────

@router.post("/tracking/record")
async def record_progress(data: SessionRecordRequest, db: Session = Depends(get_db)):
    """
    Record a practice session snapshot for the authenticated user.
    Persists to the user_progress SQLite table.
    """
    try:
        result = tracking_engine.record_session(
            db=db,
            user_id=data.user_id,
            session_data=data.dict()
        )
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Record progress error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tracking/progress/{user_id}")
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve full practice history for a user, including score evolution timeline.
    """
    try:
        progress = tracking_engine.get_progress(db=db, user_id=user_id)
        return {"status": "success", "data": progress}
    except Exception as e:
        logger.error(f"Get progress error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tracking/feedback")
async def compute_feedback_loop(data: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Feedback loop endpoint: merges new acquired skills into the user's profile,
    re-runs the matcher + ML predictor, and returns the updated placement score.
    """
    try:
        result = tracking_engine.compute_feedback(
            user_skills=data.current_skills,
            new_skills=data.new_skills,
            top_role=data.top_role
        )

        # Auto-record this feedback session in tracking DB
        if result.get("new_score") is not None:
            tracking_engine.record_session(
                db=db,
                user_id=data.user_id,
                session_data={
                    "placement_score": result["new_score"],
                    "skills_snapshot": result["updated_skills"],
                    "target_role": result["top_role"],
                    "completed_topics": []
                }
            )

        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Feedback loop error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
