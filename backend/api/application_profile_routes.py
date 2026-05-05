from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import shutil
import uuid
import urllib.parse

from database.db import get_db
from placement.auth_depends import get_current_user
from database.models import User, StudentApplicationProfile

router = APIRouter(prefix="/application-profile", tags=["Application Profile"])


class ProfileUpdateRequest(BaseModel):
    roll_no: Optional[str] = None
    personal_email: Optional[str] = None
    university_email: Optional[str] = None
    class_name: Optional[str] = None
    course: Optional[str] = None
    backlog_history: Optional[str] = None
    experience: Optional[str] = None
    projects: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    resume_url: Optional[str] = None
    # Top-level user/student fields
    name: Optional[str] = None
    cgpa: Optional[float] = None
    batch: Optional[str] = None


@router.get("/me")
async def get_my_application_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        student_profile = current_user.student_profile
        if not student_profile:
            raise HTTPException(status_code=404, detail="Student profile not found. Only students can access this.")

        app_profile = student_profile.application_profile  # May be None for new users

        return {
            "status": "success",
            "data": {
                # Top-level fields (from User/Student)
                "name": current_user.name,
                "email": current_user.email,
                "batch": student_profile.batch,
                "cgpa": student_profile.cgpa,
                # Application-specific fields (from StudentApplicationProfile)
                "roll_no": app_profile.roll_no if app_profile else None,
                "personal_email": app_profile.personal_email if app_profile else None,
                "university_email": app_profile.university_email if app_profile else None,
                "class_name": app_profile.class_name if app_profile else None,
                "course": app_profile.course if app_profile else None,
                "backlog_history": app_profile.backlog_history if app_profile else None,
                "experience": app_profile.experience if app_profile else None,
                "projects": app_profile.projects if app_profile else None,
                "github": app_profile.github if app_profile else None,
                "linkedin": app_profile.linkedin if app_profile else None,
                "resume_url": app_profile.resume_url if app_profile else None,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me")
async def update_my_application_profile(
    request: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        student_profile = current_user.student_profile
        if not student_profile:
            raise HTTPException(status_code=404, detail="Student profile not found.")

        # Update top-level User and Student fields
        if request.name is not None:
            current_user.name = request.name
        if request.batch is not None:
            student_profile.batch = request.batch
        if request.cgpa is not None:
            student_profile.cgpa = request.cgpa

        # Get or create the application profile record
        app_profile = student_profile.application_profile
        if not app_profile:
            app_profile = StudentApplicationProfile(student_id=student_profile.id)
            db.add(app_profile)
            db.flush()

        # Update application profile fields
        if request.roll_no is not None:
            app_profile.roll_no = request.roll_no
        if request.personal_email is not None:
            app_profile.personal_email = request.personal_email
        if request.university_email is not None:
            app_profile.university_email = request.university_email
        if request.class_name is not None:
            app_profile.class_name = request.class_name
        if request.course is not None:
            app_profile.course = request.course
        if request.backlog_history is not None:
            app_profile.backlog_history = request.backlog_history
        if request.experience is not None:
            app_profile.experience = request.experience
        if request.projects is not None:
            app_profile.projects = request.projects
        if request.github is not None:
            app_profile.github = request.github
        if request.linkedin is not None:
            app_profile.linkedin = request.linkedin
        if request.resume_url is not None:
            app_profile.resume_url = request.resume_url

        db.commit()
        return {"status": "success", "message": "Application profile saved successfully."}
    except HTTPException:
        raise
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-resume")
async def upload_application_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
        filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
        
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "resumes")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        resume_url = f"http://localhost:8000/uploads/resumes/{urllib.parse.quote(filename)}"
        return {"status": "success", "resume_url": resume_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

