from data_ingestion.sources import ResumeSource, ManualInputSource, AcademicSource
from data_ingestion.schema_builder import build_student_profile
from data_ingestion.validators import validate_student_profile
from database.student_repository import save_student_profile, get_student_profile_by_email
from data_ingestion.merger import merge_profiles
import logging
import traceback

logger = logging.getLogger(__name__)

# Registry of source handlers
SOURCE_HANDLERS = {
    "resume": ResumeSource(),
    "manual": ManualInputSource(),
    "academic": AcademicSource()
}

def process_input(source_type: str, data) -> dict:
    """
    Stateless, scalable orchestration layer for multi-source ingestion.
    Designed for future Celery async-queue consumption.
    """
    logger.info(f"Starting ingestion pipeline for source: {source_type}")
    
    # Ensure source type exists
    if source_type not in SOURCE_HANDLERS:
        logger.error(f"Unknown source type: {source_type}")
        return {"error": "Unknown source type", "flags": ["CRITICAL:SYSTEM_ERROR"]}
        
    handler = SOURCE_HANDLERS[source_type]
    
    try:
        # 1. Processing Phase (Extract via specific Source Handler)
        parsed_data = handler.process(data)
        
        # 2. Schema Building Phase (Normalize & Construct Unified V2 Model)
        student_profile = build_student_profile(parsed_data, source=source_type)
        
        # 3. Validation Phase (Attach state flags rather than crashing)
        student_profile = validate_student_profile(student_profile)
        
        # 3.5. Merging Phase (Lookup disjoint records natively)
        email = student_profile.get("profile", {}).get("email")
        if email:
            existing_profile = get_student_profile_by_email(email)
            if existing_profile:
                logger.info(f"Existing profile found for {email}. Merging resources natively.")
                student_profile = merge_profiles(existing_profile, student_profile)
                student_profile["log"]["status"] = "merged_update"
        
        # 4. Storage Phase (Push to DB resiliently)
        save_success = save_student_profile(student_profile)
        if not save_success:
            student_profile["flags"].append("DB_SAVE_FAILED")
            
        logger.info(f"Successfully processed {source_type} resulting in profile {student_profile.get('student_id')}")
        
        return student_profile
        
    except Exception as e:
        logger.error(f"Fatal error in ingestion pipeline: {e}")
        logger.error(traceback.format_exc())
        # Return fallback partial schema never crash the queue
        return {
            "source": source_type,
            "flags": ["CRITICAL:PIPELINE_CRASH"],
            "error_details": str(e)
        }

# Adapter to maintain easy compatibility for older implementations
def process_resume_upload(file_path: str) -> dict:
    return process_input("resume", file_path)
