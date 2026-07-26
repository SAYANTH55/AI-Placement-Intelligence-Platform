from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import csv
import io

from database.db import get_db
from placement.application_service import ApplicationService
from placement.auth_depends import get_current_user, require_role
from database.models import User, Student, Application, RoundResult, Drive
from ai_model.job_matcher.matcher import calculate_jd_match

try:
    from api.limiter import limiter
except ImportError:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/application", tags=["Application System"])

class ApplyRequest(BaseModel):
    drive_id: int
    resume_path: str
    ai_match_score: Optional[float] = None
    form_responses: Optional[dict] = None

class UpdateRoundRequest(BaseModel):
    application_id: int
    round_id: int | None = None
    round_number: int | None = None
    status: str # "Pass" or "Fail"

class FinalizeRequest(BaseModel):
    application_id: int
    status: str # "Placed" or "Rejected"

class BulkRoundUpdateRequest(BaseModel):
    application_ids: List[int]
    round_id: int | None = None
    round_number: int | None = None
    status: str


@router.get("/match_score/{drive_id}")
async def get_match_score(drive_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        drive = db.query(Drive).filter(Drive.id == drive_id).first()
        if not drive:
            raise HTTPException(status_code=404, detail="Drive not found")
            
        student_profile = current_user.student_profile
        if not student_profile or not student_profile.profile_data:
            return {"status": "success", "score": 0, "message": "No student profile found"}
            
        # Extract skills from profile_data
        # profile_data structure is roughly {"skills": [{"name": "Python", ...}, ...]}
        skills_objs = student_profile.profile_data.get("skills", [])
        user_skills = []
        if isinstance(skills_objs, list):
            for s in skills_objs:
                if isinstance(s, dict) and "name" in s:
                    user_skills.append(s["name"])
                elif isinstance(s, str):
                    user_skills.append(s)
        
        score = calculate_jd_match(user_skills, drive.job_description or drive.description)
        return {"status": "success", "score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/apply")
@limiter.limit("10/minute")
async def apply_to_drive(request: Request, apply_req: ApplyRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        student_profile = current_user.student_profile
        if not student_profile:
             raise HTTPException(status_code=400, detail="User has no student profile")
             
        app = ApplicationService.apply_to_drive(db, student_profile.id, apply_req.drive_id, apply_req.resume_path, ai_match_score=apply_req.ai_match_score, form_responses=apply_req.form_responses)
        return {"status": "success", "application_id": app.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-applications")
async def get_my_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        student_profile = current_user.student_profile
        if not student_profile:
             return {"status": "success", "data": []}
             
        from database.models import Application, RoundResult
        apps = db.query(Application).filter(Application.student_id == student_profile.id).all()
        
        result_data = []
        for a in apps:
            results = db.query(RoundResult).filter(RoundResult.application_id == a.id).all()
            result_data.append({
                "id": a.id,
                "drive_id": a.drive_id,
                "company_name": a.drive.company_name,
                "ai_match_score": a.ai_match_score,
                "status": a.status,
                "form_responses": a.form_responses,
                "created_at": a.created_at,
                "rounds": [
                    {"round_name": r.round.round_name, "status": r.status} for r in results
                ]
            })
        return {"status": "success", "data": result_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drive/{drive_id}")
async def get_drive_applications(
    drive_id: int,
    batch: str | None = None,
    round_number: int | None = None,
    status: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "pr"]))
):
    try:
        pr_id = None
        filter_by_pr = False
        if current_user.role == "pr":
            pr_profile = current_user.pr_profile
            if pr_profile:
                pr_id = pr_profile.id
                filter_by_pr = True
                
        apps = ApplicationService.get_applications(
            db,
            drive_id=drive_id,
            batch=batch,
            round_number=round_number,
            status=status,
            pr_id=pr_id,
            filter_by_pr=filter_by_pr,
            search=search
        )
        
        return {"status": "success", "data": [
            {
                "id": a.id,
                "application_uuid": a.application_uuid,
                "student_id": a.student_id,
                "student_name": a.student.user.name,
                "student_email": a.student.user.email,
                "student_batch": a.student.batch,
                "resume_url": a.resume_url,
                "ai_match_score": a.ai_match_score,
                "form_responses": a.form_responses,
                "status": a.status,
                "final_status": a.final_status,
                "current_round": a.current_round,
                "rounds": [
                    {
                        "round_id": r.round_id,
                        "round_number": r.round.round_number,
                        "round_name": r.round.round_name,
                        "status": r.status
                    } for r in a.round_results
                ]
            } for a in apps
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drive/{drive_id}/export")
async def export_drive_applications(drive_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        apps = ApplicationService.get_applications(db, drive_id=drive_id)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["Application ID", "Student", "Email", "Batch", "Status", "Current Round", "Resume URL"])
        for a in apps:
            writer.writerow([
                a.id,
                a.student.user.name,
                a.student.user.email,
                a.student.batch,
                a.status,
                a.current_round,
                a.resume_url
            ])
        buffer.seek(0)
        headers = {
            "Content-Disposition": f"attachment; filename=drive_{drive_id}_applications.csv"
        }
        return StreamingResponse(buffer, media_type="text/csv", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student/{student_id}")
async def get_student_application_profile(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr", "student"]))):
    try:
        if current_user.role == "student":
            if not current_user.student_profile or current_user.student_profile.id != student_id:
                raise HTTPException(status_code=403, detail="Forbidden: Cannot view application profiles of other students")
                
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        apps = db.query(Application).filter(Application.student_id == student.id).all()
        return {
            "status": "success",
            "data": {
                "student_id": student.id,
                "name": student.user.name,
                "email": student.user.email,
                "batch": student.batch,
                "cgpa": student.cgpa,
                "profile_data": student.profile_data,
                "applications": [
                    {
                        "application_id": a.id,
                        "drive_id": a.drive_id,
                        "company_name": a.drive.company_name,
                        "role": a.drive.role,
                        "status": a.status,
                        "current_round": a.current_round,
                        "rounds": [
                            {
                                "round_id": r.round_id,
                                "round_number": r.round.round_number,
                                "round_name": r.round.round_name,
                                "status": r.status
                            } for r in a.round_results
                        ]
                    } for a in apps
                ]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-round")
async def update_round(request: UpdateRoundRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        from placement.round_service import RoundService
        
        # Enforce PR batch scoping
        if current_user.role == "pr":
            app = db.query(Application).filter(Application.id == request.application_id).first()
            if not app:
                raise HTTPException(status_code=404, detail="Application not found")
            pr_profile = current_user.pr_profile
            if not pr_profile or app.student.pr_id != pr_profile.id:
                raise HTTPException(status_code=403, detail="Forbidden: You are not scoped to manage this student's rounds.")

        result = RoundService.update_round(
            db,
            request.application_id,
            request.status,
            current_user.id,
            round_id=request.round_id,
            round_number=request.round_number
        )
        return {"status": "success", "message": f"Round result updated to {request.status}", "round_id": result.round_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-update")
async def bulk_update_rounds(request: BulkRoundUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        from placement.round_service import RoundService
        
        # Enforce PR batch scoping
        valid_app_ids = set(request.application_ids)
        if current_user.role == "pr":
            pr_profile = current_user.pr_profile
            if not pr_profile:
                raise HTTPException(status_code=403, detail="Forbidden: No PR profile found.")
            apps = db.query(Application).filter(Application.id.in_(request.application_ids)).all()
            for app in apps:
                if app.student.pr_id != pr_profile.id:
                    raise HTTPException(status_code=403, detail=f"Forbidden: You are not scoped to manage application {app.id}.")

        updated = 0
        for application_id in request.application_ids:
            RoundService.update_round(
                db,
                application_id,
                request.status,
                current_user.id,
                round_id=request.round_id,
                round_number=request.round_number
            )
            updated += 1
        return {"status": "success", "updated": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/finalize")
async def finalize_application(request: FinalizeRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        from placement.round_service import RoundService
        outcome = RoundService.finalize_application(db, request.application_id, request.status, updated_by_id=current_user.id)
        return {"status": "success", "message": f"Application finalized as {request.status}.", "outcome_id": outcome.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
