import os
import sys
import logging
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from database.db import engine, SessionLocal
from database.models import (
    ResumeAnalysis, UserProgress, 
    ResumeSkill, ResumePrediction, ResumeGap, ResumeDomainPrediction,
    Skill, SkillHistory
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_data():
    db: Session = SessionLocal()
    
    logger.info("Starting JSON to Relational data migration...")

    # A cache for skills to avoid excessive DB queries
    skill_cache = {}

    def get_or_create_skill(skill_name: str) -> Skill:
        skill_name_lower = skill_name.strip().lower()
        if skill_name_lower in skill_cache:
            return skill_cache[skill_name_lower]
        
        # Try to find in DB
        skill = db.query(Skill).filter(Skill.skill_name == skill_name_lower).first()
        if not skill:
            skill = Skill(skill_name=skill_name_lower)
            db.add(skill)
            db.commit()
            db.refresh(skill)
        
        skill_cache[skill_name_lower] = skill
        return skill

    try:
        # Migrate Resume Analyses
        analyses = db.query(ResumeAnalysis).all()
        for analysis in analyses:
            # 1. Resume Skills
            if analysis.extracted_skills and isinstance(analysis.extracted_skills, list):
                for skill_name in analysis.extracted_skills:
                    if isinstance(skill_name, str):
                        # Add to master skill table
                        get_or_create_skill(skill_name)
                        # Add to resume skills
                        rs = ResumeSkill(
                            analysis_id=analysis.id,
                            skill_name=skill_name.strip(),
                            skill_score=None,
                            confidence=None
                        )
                        db.add(rs)
                        
            # 2. Resume Predictions
            if analysis.role_matches and isinstance(analysis.role_matches, list):
                for match in analysis.role_matches:
                    if isinstance(match, dict):
                        rp = ResumePrediction(
                            analysis_id=analysis.id,
                            predicted_role=match.get("role", "Unknown"),
                            role_confidence=match.get("match_percent", 0.0) / 100.0,
                            profile_strength_score=analysis.profile_strength_score,
                            profile_strength_label=analysis.profile_strength_label
                        )
                        db.add(rp)
            
            # 3. Resume Gaps
            if analysis.skill_gaps and isinstance(analysis.skill_gaps, list):
                for gap in analysis.skill_gaps:
                    if isinstance(gap, dict):
                        rg = ResumeGap(
                            analysis_id=analysis.id,
                            skill_name=gap.get("skill", "Unknown"),
                            importance=gap.get("importance", "medium"),
                            gap_score=gap.get("gap_score", 0.0),
                            recommendation=gap.get("recommendation", "")
                        )
                        db.add(rg)

            # 4. Domain Predictions
            if analysis.detected_domain:
                rdp = ResumeDomainPrediction(
                    analysis_id=analysis.id,
                    primary_domain=analysis.detected_domain,
                    secondary_domain=analysis.secondary_domain,
                    confidence=analysis.domain_confidence
                )
                db.add(rdp)

        # Migrate User Progress (Skills Snapshot)
        progress_records = db.query(UserProgress).all()
        for record in progress_records:
            if record.skills_snapshot and isinstance(record.skills_snapshot, dict):
                for skill_name, score in record.skills_snapshot.items():
                    skill_obj = get_or_create_skill(skill_name)
                    sh = SkillHistory(
                        student_id=record.user_id, # Fallback, ideally we link to Student
                        skill_id=skill_obj.id,
                        score=float(score) if score is not None else None,
                        source="snapshot",
                        timestamp=record.session_date
                    )
                    db.add(sh)

        db.commit()
        logger.info("Data migration completed successfully.")

    except Exception as e:
        logger.error(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_data()
