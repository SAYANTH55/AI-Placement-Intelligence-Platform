"""
Tracking Engine
===============
Persists user practice sessions and enables a closed feedback loop:
  record_session → stored in UserProgress table
  get_progress   → history with score_evolution for charting
  compute_feedback → re-runs matcher with updated skills → new placement score

Strategy: 100% Deterministic — no LLM calls.
"""

import logging
import sys
import os
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logger = logging.getLogger(__name__)


def record_session(db, user_id: int, session_data: dict) -> dict:
    """
    Write a practice session snapshot to the UserProgress table.

    Args:
        db: SQLAlchemy Session object (injected by FastAPI dependency).
        user_id: Authenticated user's ID.
        session_data: {
            placement_score, skills_snapshot, aptitude_score,
            coding_score, interview_score, target_role, completed_topics
        }

    Returns:
        dict with the created record's id and timestamp.
    """
    from database.models import UserProgress

    try:
        progress = UserProgress(
            user_id=user_id,
            placement_score=session_data.get("placement_score"),
            skills_snapshot=session_data.get("skills_snapshot", []),
            aptitude_score=session_data.get("aptitude_score"),
            coding_score=session_data.get("coding_score"),
            interview_score=session_data.get("interview_score"),
            target_role=session_data.get("target_role"),
            completed_topics=session_data.get("completed_topics", [])
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        logger.info(f"Recorded session for user {user_id}: score={session_data.get('placement_score')}")
        return {"id": progress.id, "recorded_at": str(progress.session_date)}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record session: {e}")
        raise


def get_progress(db, user_id: int) -> dict:
    """
    Retrieve the full practice history for a user.

    Returns:
        dict with:
          - sessions: list of all session records
          - score_evolution: [{date, placement_score}] for line chart
          - skill_growth: [{date, skills_count}] for area chart
          - latest_session: most recent session object
          - total_sessions: int
          - best_score: float
    """
    from database.models import UserProgress

    sessions = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id)
        .order_by(UserProgress.session_date.asc())
        .all()
    )

    if not sessions:
        return {
            "sessions": [],
            "score_evolution": [],
            "skill_growth": [],
            "latest_session": None,
            "total_sessions": 0,
            "best_score": None
        }

    session_list = []
    score_evolution = []
    skill_growth = []

    for s in sessions:
        date_str = s.session_date.strftime("%Y-%m-%d") if s.session_date else "Unknown"
        session_obj = {
            "id": s.id,
            "date": date_str,
            "placement_score": s.placement_score,
            "aptitude_score": s.aptitude_score,
            "coding_score": s.coding_score,
            "interview_score": s.interview_score,
            "target_role": s.target_role,
            "skills_count": len(s.skills_snapshot) if s.skills_snapshot else 0,
            "completed_topics": s.completed_topics or []
        }
        session_list.append(session_obj)

        if s.placement_score is not None:
            score_evolution.append({"date": date_str, "score": round(s.placement_score, 1)})

        skill_count = len(s.skills_snapshot) if s.skills_snapshot else 0
        skill_growth.append({"date": date_str, "skills_count": skill_count})

    best_score = max((s.placement_score for s in sessions if s.placement_score is not None), default=None)

    return {
        "sessions": session_list,
        "score_evolution": score_evolution,
        "skill_growth": skill_growth,
        "latest_session": session_list[-1] if session_list else None,
        "total_sessions": len(sessions),
        "best_score": round(best_score, 1) if best_score else None
    }


def compute_feedback(user_skills: list, new_skills: list, top_role: str = None) -> dict:
    """
    Feedback loop: merge new skills with existing skills and re-run the matcher
    to compute an updated placement score.

    Args:
        user_skills: Current known skills list.
        new_skills: Newly acquired skills to add.
        top_role: Optional role to focus the score on.

    Returns:
        dict with:
          - updated_skills: merged skill list
          - new_score: updated placement probability (0-100)
          - score_delta: change from a recalculated baseline
          - top_role: best matched role after update
          - message: human-readable feedback
    """
    from ai_model.job_matcher.matcher import get_job_fits_with_diversity
    from ai_model.prediction_model.predictor import predict_placement

    # Merge skills (union, deduplication)
    merged_skills = list(set(user_skills) | set(new_skills))
    newly_added = [s for s in new_skills if s not in set(user_skills)]

    try:
        # Re-run deterministic matcher
        role_data = get_job_fits_with_diversity(merged_skills)
        role_matches = role_data["role_matches"]

        # Find the top role (either specified or auto-detected)
        if top_role:
            target_match = next((r for r in role_matches if r["role"] == top_role), None)
            best_match = target_match or (role_matches[0] if role_matches else None)
        else:
            best_match = role_matches[0] if role_matches else None

        top_match_percent = (best_match["match"] / 100.0) if best_match else 0.0

        # Re-run ML predictor
        experience = 0  # Tracking only adds skills; experience unchanged
        ml_prediction = predict_placement(merged_skills, experience)
        ml_base = ml_prediction.get("placement_probability", 0.5)

        # Apply same 75/25 calibration formula
        new_score_raw = (top_match_percent * 0.75) + (ml_base * 0.25)
        new_score = round(min(new_score_raw * 100, 100), 1)

        # Baseline: score without the new skills
        old_role_data = get_job_fits_with_diversity(user_skills)
        old_top = old_role_data["role_matches"][0] if old_role_data["role_matches"] else None
        old_top_pct = (old_top["match"] / 100.0) if old_top else 0.0
        old_ml = predict_placement(user_skills, experience).get("placement_probability", 0.5)
        old_score = round(min(((old_top_pct * 0.75) + (old_ml * 0.25)) * 100, 100), 1)

        score_delta = round(new_score - old_score, 1)
        detected_role = best_match["role"] if best_match else "Unknown"

        if score_delta > 0:
            message = f"Adding {len(newly_added)} skill(s) improved your placement score by +{score_delta}% for {detected_role}."
        elif score_delta == 0:
            message = f"Skills merged. Your score remains at {new_score}% — focus on core skill gaps next."
        else:
            message = f"Score recalculated at {new_score}%. Focus on high-priority skills for {detected_role}."

        return {
            "updated_skills": merged_skills,
            "newly_added": newly_added,
            "new_score": new_score,
            "old_score": old_score,
            "score_delta": score_delta,
            "top_role": detected_role,
            "message": message
        }

    except Exception as e:
        logger.error(f"compute_feedback failed: {e}")
        return {
            "updated_skills": merged_skills,
            "newly_added": newly_added,
            "new_score": None,
            "old_score": None,
            "score_delta": 0,
            "top_role": top_role or "Unknown",
            "message": f"Could not recalculate score: {str(e)}"
        }
