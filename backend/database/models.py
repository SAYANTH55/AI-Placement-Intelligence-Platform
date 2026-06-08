import uuid
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Float, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .db import Base

APPLICATION_STATUSES = ["Applied", "In Progress", "Rejected", "Placed"]
ROUND_STATUSES = ["Pending", "Pass", "Fail"]
DRIVE_STATUSES = ["open", "closed", "archived"]
COURSE_OPTIONS = ["MCA", "MSAIM", "ALL"]
UPDATE_TYPES = ["test", "workshop", "announcement"]
EVENT_TYPES = ["new_drive_created", "application_created", "round_updated", "final_result"]

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    password = Column(String)  # Hashed password
    role = Column(String, default="student") # student, pr, dept_admin, admin
    course = Column(String, nullable=True)  # MCA, MSAIM — for students
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    roll_number = Column(String, nullable=True, unique=True, index=True)
    first_login = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    resume_analyses = relationship("ResumeAnalysis", back_populates="user")
    otp_records = relationship("OTPRecord", back_populates="user")
    department = relationship("Department", back_populates="users")


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


class Student(Base):
    """Refined Student profile merging intelligence and placement tracking"""
    __tablename__ = "placement_students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    pr_id = Column(Integer, ForeignKey("placement_prs.id"), nullable=True)
    
    # Intelligence Data (merged from StudentProfileDB)
    profile_data = Column(JSON, nullable=True) # Unified JSON schema for skills/exp/etc
    
    # Tracking Data
    batch = Column(String, index=True)
    cgpa = Column(Float)
    
    # Relationships
    user = relationship("User", back_populates="student_profile")
    pr = relationship("PR", back_populates="assigned_students")
    applications = relationship("Application", back_populates="student")
    application_profile = relationship("StudentApplicationProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")

class PR(Base):
    """Placement Representatives managing student batches"""
    __tablename__ = "placement_prs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    batch = Column(String, index=True)
    
    user = relationship("User", back_populates="pr_profile")
    assigned_students = relationship("Student", back_populates="pr")

class Drive(Base):
    """Placement Drive lifecycle"""
    __tablename__ = "placement_drives"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    role = Column(String)
    description = Column(String)
    job_description = Column(Text, nullable=True)  # Full JD text for AI matching
    eligibility_criteria = Column(String)
    ctc = Column(String, nullable=True)  # CTC / salary info
    course = Column(String, default="ALL")  # MCA, MSAIM, ALL — controls visibility
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    deadline = Column(DateTime(timezone=True))
    status = Column(String, default="open") # open / closed / archived
    application_form_fields = Column(JSON, nullable=True) # list of field keys to collect
    
    creator = relationship("User")
    company = relationship("Company", back_populates="drives")
    department = relationship("Department", back_populates="drives")
    rounds = relationship("Round", back_populates="drive", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="drive")

class Round(Base):
    """Specific rounds within a Drive (Aptitude, Technical, HR)"""
    __tablename__ = "placement_rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"))
    round_number = Column(Integer)
    round_name = Column(String)
    
    drive = relationship("Drive", back_populates="rounds")
    results = relationship("RoundResult", back_populates="round")

class Application(Base):
    """Student applications to specific corporate drives"""
    __tablename__ = "placement_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    application_uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(Integer, ForeignKey("placement_students.id"))
    drive_id = Column(Integer, ForeignKey("placement_drives.id"))
    resume_path = Column(String)
    ai_match_score = Column(Float, nullable=True)  # AI match score against drive JD (0-100)
    status = Column(String, default="Applied")  # Applied / In Progress / Rejected / Placed
    final_status = Column(String, nullable=True)
    form_responses = Column(JSON, nullable=True) # stores the student's dynamic form answers
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    student = relationship("Student", back_populates="applications")
    drive = relationship("Drive", back_populates="applications")
    round_results = relationship("RoundResult", back_populates="application", cascade="all, delete-orphan")

    @property
    def current_round(self) -> int:
        if not self.round_results:
            return 1
            
        if self.status in ("Placed", "Rejected"):
            completed = [r.round.round_number for r in self.round_results if r.status != "Pending"]
            return max(completed) if completed else 1

        sorted_results = sorted(self.round_results, key=lambda x: x.round.round_number)
        for r in sorted_results:
            if r.status == "Pending":
                return r.round.round_number
                
        return len(self.round_results)

    @property
    def resume_url(self):
        return self.resume_path

class RoundResult(Base):
    """Outcome of a specific student in a specific round"""
    __tablename__ = "application_rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("placement_applications.id"))
    round_id = Column(Integer, ForeignKey("placement_rounds.id"))
    status = Column(String, default="Pending")  # Pending / Pass / Fail
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    application = relationship("Application", back_populates="round_results")
    round = relationship("Round", back_populates="results")
    updater = relationship("User")

class PlacementOutcome(Base):
    """Store real-world placement results for ground-truth validation"""
    __tablename__ = "placement_outcomes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    student_id = Column(Integer, ForeignKey("placement_students.id"), nullable=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id"), nullable=True)
    got_placed = Column(Boolean, default=False)
    company = Column(String, nullable=True)
    role = Column(String, nullable=True)
    offer_date = Column(DateTime(timezone=True), nullable=True)
    time_to_offer_days = Column(Integer, nullable=True)
    package = Column(Float, nullable=True)  # Optional: CTC
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="outcomes")
    student = relationship("Student")
    drive = relationship("Drive")

class PlacementNotification(Base):
    """System notifications for placement updates"""
    __tablename__ = "placement_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

class PlacementEvent(Base):
    """Store event bus messages for placement system activity"""
    __tablename__ = "placement_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    payload = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    """Audit trail for admin/user actions in the placement system"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    data = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

# ── New Placement Engine tables ──

class Department(Base):
    """Academic departments (created by admin)"""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g. "MCA Wing", "MSc AI/ML Wing"
    level = Column(String, nullable=True)  # UG / PG
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="department")
    drives = relationship("Drive", back_populates="department")


class Company(Base):
    """Master company list, reused across drives"""
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    initials = Column(String, nullable=True)  # e.g. "GOOG"
    website = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drives = relationship("Drive", back_populates="company")


class PlacementUpdate(Base):
    """Tests, workshops, announcements from placement cell"""
    __tablename__ = "placement_updates"

    id = Column(Integer, primary_key=True, index=True)
    update_type = Column(String, default="announcement")  # test, workshop, announcement
    title = Column(String)
    description = Column(Text, nullable=True)
    course = Column(String, default="ALL")  # MCA, MSAIM, ALL
    action_label = Column(String, nullable=True)  # e.g. "Register Now"
    action_url = Column(String, nullable=True)
    posted_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    poster = relationship("User")


# Update User model to include relationships
User.student_profile = relationship("Student", back_populates="user", uselist=False)
User.pr_profile = relationship("PR", back_populates="user", uselist=False)
User.outcomes = relationship("PlacementOutcome", back_populates="user")


class StudentApplicationProfile(Base):
    """Dedicated table for student application profile data (separate from AI engine profile_data)"""
    __tablename__ = "student_application_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("placement_students.id"), unique=True, nullable=False)

    roll_no = Column(String, nullable=True)
    personal_email = Column(String, nullable=True)
    university_email = Column(String, nullable=True)
    class_name = Column(String, nullable=True)
    course = Column(String, nullable=True)
    backlog_history = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    projects = Column(Text, nullable=True)
    github = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    resume_url = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student", back_populates="application_profile")

