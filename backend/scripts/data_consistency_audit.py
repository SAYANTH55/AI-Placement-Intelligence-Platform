import os
import sys
import logging
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from database.db import SessionLocal
from database.models import ResumeAnalysis, ResumeSkill, ResumePrediction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def audit_consistency():
    db: Session = SessionLocal()
    
    logger.info("Starting Data Consistency Audit...")
    
    report_content = "# Data Consistency Report\n\nThis report compares the legacy JSON arrays against the newly populated normalized relational tables to ensure 100% data fidelity.\n\n"
    
    try:
        analyses = db.query(ResumeAnalysis).all()
        
        mismatched_skills = 0
        mismatched_predictions = 0
        total_records = len(analyses)
        
        for analysis in analyses:
            # Check Skills
            legacy_skills = set()
            if analysis.extracted_skills:
                legacy_skills = set(s.strip() for s in analysis.extracted_skills if isinstance(s, str))
                
            normalized_skills = set(rs.skill_name for rs in db.query(ResumeSkill).filter(ResumeSkill.analysis_id == analysis.id).all())
            
            if legacy_skills != normalized_skills:
                mismatched_skills += 1
                logger.warning(f"Skill mismatch for analysis {analysis.id}: JSON={legacy_skills}, DB={normalized_skills}")
                
            # Check Predictions
            legacy_roles = set()
            if analysis.role_matches:
                legacy_roles = set(match.get("role", "Unknown") for match in analysis.role_matches if isinstance(match, dict))
                
            normalized_roles = set(rp.predicted_role for rp in db.query(ResumePrediction).filter(ResumePrediction.analysis_id == analysis.id).all())
            
            if legacy_roles != normalized_roles:
                mismatched_predictions += 1
                logger.warning(f"Prediction mismatch for analysis {analysis.id}: JSON={legacy_roles}, DB={normalized_roles}")
                
        if mismatched_skills == 0 and mismatched_predictions == 0:
            report_content += f"## Success\nAll {total_records} ResumeAnalysis records have perfect 1:1 mapping between JSON and relational tables.\n\n"
            report_content += "Data drift risk is mitigated. The JSON arrays can be safely designated as read-only."
        else:
            report_content += f"## Failure\nFound mismatches!\n- Skill Mismatches: {mismatched_skills}\n- Prediction Mismatches: {mismatched_predictions}\n\n"
            report_content += "Please review the script logs and fix the ETL migration script."
            
        report_path = os.path.join(os.path.dirname(__file__), "..", "..", "consistency_report.md")
        with open(report_path, "w") as f:
            f.write(report_content)
            
        logger.info(f"Audit completed. Generated {report_path}")
        
    except Exception as e:
        logger.error(f"Audit failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    audit_consistency()
