from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Float, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    password = Column(String)  # Hashed password
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    resume_analyses = relationship("ResumeAnalysis", back_populates="user")
    otp_records = relationship("OTPRecord", back_populates="user")


class ResumeAnalysis(Base):
    """Store resume analysis history per user"""
    __tablename__ = "resume_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String)
    file_hash = Column(String, unique=True, index=True)  # For deduplication
    
    # Extracted data
    extracted_skills = Column(JSON)  # List of skills
    experience_years = Column(Integer, default=0)
    extracted_text = Column(Text)  # First 2000 chars
    
    # Analysis results
    placement_probability = Column(Float)  # 0.0-1.0
    placement_readiness = Column(String)  # High/Medium/Low
    top_matching_role = Column(String)
    top_role_match_percent = Column(Integer)
    
    # Comprehensive results
    role_matches = Column(JSON)  # Full role matching results
    diversity_score = Column(Integer)  # 0-100
    skill_gaps = Column(JSON)  # Learning recommendations
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="resume_analyses")
    
    class Config:
        from_attributes = True


class OTPRecord(Base):
    """Store OTP codes with expiration for password reset"""
    __tablename__ = "otp_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    email = Column(String, index=True)
    otp_code = Column(String)  # 6-digit code
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))  # 5 minutes from creation
    
    # Relationships
    user = relationship("User", back_populates="otp_records")
    
    class Config:
        from_attributes = True


class RateLimitTracker(Base):
    """Track API calls per user for rate limiting"""
    __tablename__ = "rate_limit_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    endpoint = Column(String)  # e.g., "/upload_resume"
    request_count = Column(Integer, default=1)
    window_start = Column(DateTime(timezone=True), server_default=func.now())
    window_end = Column(DateTime(timezone=True))  # 1-hour window


class UserProgress(Base):
    """Track user practice sessions and placement score evolution over time"""
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    session_date = Column(DateTime(timezone=True), server_default=func.now())

    # Snapshot of score at this session
    placement_score = Column(Float, nullable=True)

    # Full skill list at this point in time (for skill growth chart)
    skills_snapshot = Column(JSON, nullable=True)

    # Practice engine sub-scores (0-100)
    aptitude_score = Column(Float, nullable=True)
    coding_score = Column(Float, nullable=True)
    interview_score = Column(Float, nullable=True)

    # Context
    target_role = Column(String, nullable=True)
    completed_topics = Column(JSON, nullable=True)  # List of completed topic strings

    # Relationships
    user = relationship("User", backref="progress")

    class Config:
        from_attributes = True


class PlacementOutcome(Base):
    """Store real-world placement results for ground-truth validation"""
    __tablename__ = "placement_outcomes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    got_placed = Column(Boolean, default=False)
    company = Column(String, nullable=True)
    role = Column(String, nullable=True)
    offer_date = Column(DateTime(timezone=True), nullable=True)
    time_to_offer_days = Column(Integer, nullable=True)
    package = Column(Float, nullable=True)  # Optional: CTC
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="outcomes")

# Update User model to include outcomes relationship
User.outcomes = relationship("PlacementOutcome", back_populates="user")
