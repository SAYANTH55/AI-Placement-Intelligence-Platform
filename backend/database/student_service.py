import json
import logging
from sqlalchemy.orm import Session
from database.models import Student, User

logger = logging.getLogger(__name__)

class StudentService:
    @staticmethod
    def save_student_profile(db: Session, email: str, profile_dict: dict) -> bool:
        """
        Upserts a student profile linked to a User via email.
        """
        try:
            # 1. Find the User by email
            user = db.query(User).filter(User.email == email).first()
            if not user:
                logger.error(f"Cannot save profile: No user found for email {email}")
                return False
                
            # 2. Find or create the Student profile
            student = db.query(Student).filter(Student.user_id == user.id).first()
            
            if student:
                student.profile_data = profile_dict
            else:
                student = Student(
                    user_id=user.id,
                    profile_data=profile_dict,
                    batch="Unknown", # To be updated by PR or student later
                    cgpa=0.0
                )
                db.add(student)
                
            db.commit()
            return True
        except Exception as e:
            logger.error(f"StudentService Save Error: {e}")
            db.rollback()
            return False

    @staticmethod
    def get_student_profile_by_email(db: Session, email: str) -> dict:
        """
        Retrieves a student profile by matching email.
        First checks User table, then falls back to JSON search in profile_data.
        """
        if not email:
            return None
            
        # 1. Try direct User link
        user = db.query(User).filter(User.email == email).first()
        if user and user.student_profile:
            return user.student_profile.profile_data
            
        # 2. Fallback to JSON search if user doesn't exist yet but profile exists (unlikely in this new perfection)
        # But for robustness during ingestion:
        records = db.query(Student).filter(Student.profile_data.like(f'%"{email}"%')).all()
        for s in records:
            if s.profile_data.get("profile", {}).get("email") == email:
                return s.profile_data
        return None
