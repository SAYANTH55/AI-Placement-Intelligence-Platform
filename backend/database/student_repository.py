import json
import logging
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .db import Base, SessionLocal

logger = logging.getLogger(__name__)

# SQLAlchemy Model for explicit PostgreSQL / SQLite portability
class StudentProfileDB(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=False)
    source = Column(String, index=True)
    # Storing the entire unified schema as JSON string for SQLite 
    # (In PostgreSQL this can map neatly to JSONB natively)
    profile_data = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

def save_student_profile(profile_dict: dict) -> bool:
    """
    Upserts a student profile into the persistent store.
    """
    db = SessionLocal()
    try:
        student_id = profile_dict.get("student_id")
        if not student_id:
            logger.error("Cannot save profile without student_id")
            return False
            
        existing = db.query(StudentProfileDB).filter(StudentProfileDB.student_id == student_id).first()
        
        if existing:
            existing.profile_data = json.dumps(profile_dict)
            existing.source = profile_dict.get("source", "unknown")
        else:
            new_profile = StudentProfileDB(
                student_id=student_id,
                source=profile_dict.get("source", "unknown"),
                profile_data=json.dumps(profile_dict)
            )
            db.add(new_profile)
            
        db.commit()
        return True
    except Exception as e:
        logger.error(f"DB Save Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def get_student_profile(student_id: str) -> dict:
    """
    Retrieves a student profile from the persistent store.
    """
    db = SessionLocal()
    try:
        record = db.query(StudentProfileDB).filter(StudentProfileDB.student_id == student_id).first()
        if record:
            return json.loads(record.profile_data)
        return None
    except Exception as e:
        logger.error(f"DB Fetch Error: {e}")
        return None
    finally:
        db.close()

def get_student_profile_by_email(email: str) -> dict:
    """
    Retrieves a student profile by matching email inside the JSON payload.
    Provides a bridging mechanism between disjoint uploads.
    """
    if not email:
        return None
    db = SessionLocal()
    try:
        # Fast substring search for SQLite compatibility. 
        # (PostgreSQL uses precise column->>'email' matching)
        records = db.query(StudentProfileDB).filter(StudentProfileDB.profile_data.like(f'%"{email}"%')).all()
        for r in records:
            data = json.loads(r.profile_data)
            if data.get("profile", {}).get("email") == email:
                return data
        return None
    except Exception as e:
        logger.error(f"DB Email Fetch Error: {e}")
        return None
    finally:
        db.close()

