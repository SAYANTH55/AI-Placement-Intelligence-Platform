from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional

from database.db import get_db
from placement.drive_service import DriveService
from placement.auth_depends import get_current_user, require_role
from database.models import User, Application, Drive, Company, Round

router = APIRouter(prefix="/drive", tags=["Drive Management"])

class CreateRoundItem(BaseModel):
    round_number: int
    round_name: str

class CreateDriveRequest(BaseModel):
    company_name: str
    company_id: Optional[int] = None
    role: str
    description: str
    job_description: Optional[str] = None
    eligibility_criteria: str
    ctc: Optional[str] = None
    course: str = "ALL"  # MCA, MSAIM, ALL
    deadline: datetime
    rounds: Optional[List[CreateRoundItem]] = None
    application_form_fields: Optional[List[str]] = None

class AddRoundsRequest(BaseModel):
    rounds: List[CreateRoundItem]

@router.post("/create")
async def create_drive(request: CreateDriveRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "dept_admin", "pr"]))):
    try:
        # Duplicate drive prevention: same company + role within 30 days in same dept
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        existing_drive = db.query(Drive).filter(
            Drive.company_name == request.company_name,
            Drive.role == request.role,
            Drive.status.in_(["open", "closed"]),
            Drive.deadline > thirty_days_ago
        ).first()

        if existing_drive:
            return {
                "status": "duplicate",
                "drive_id": existing_drive.id,
                "message": f"This drive already exists (ID: {existing_drive.id}). Created on {existing_drive.deadline}."
            }

        # Auto-create company if company_id not provided
        if not request.company_id:
            company = db.query(Company).filter(Company.name == request.company_name).first()
            if not company:
                company = Company(name=request.company_name)
                db.add(company)
                db.flush()
            request.company_id = company.id

        drive = DriveService.create_drive(
            db, request.company_name, request.role, request.description,
            request.eligibility_criteria, request.deadline, current_user.id,
            rounds_data=[r.dict() for r in request.rounds] if request.rounds else None,
            job_description=request.job_description,
            ctc=request.ctc,
            course=request.course,
            company_id=request.company_id,
            department_id=current_user.department_id,
            application_form_fields=request.application_form_fields
        )
        return {"status": "success", "drive_id": drive.id}
    except Exception as e:
        print(f"Error creating drive: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/s")
async def get_drives_short(
    active_only: bool = False,
    course: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Auto-filter by student course
        filter_course = course
        if current_user.role == "student" and current_user.course and not course:
            filter_course = current_user.course

        drives = DriveService.get_drives(db, active_only, course=filter_course)
        return {"status": "success", "data": [
            {
                "id": d.id,
                "company_name": d.company_name,
                "role": d.role,
                "description": d.description,
                "job_description": d.job_description,
                "ctc": d.ctc,
                "course": d.course,
                "deadline": d.deadline,
                "status": d.status,
                "application_form_fields": d.application_form_fields,
                "application_count": db.query(Application).filter(Application.drive_id == d.id).count(),
                "round_count": len(d.rounds)
            } for d in drives
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
async def get_drives(
    active_only: bool = False,
    course: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        filter_course = course
        if current_user.role == "student" and current_user.course and not course:
            filter_course = current_user.course

        drives = DriveService.get_drives(db, active_only, course=filter_course)
        return {"status": "success", "data": [
            {
                "id": d.id,
                "company_name": d.company_name,
                "role": d.role,
                "description": d.description,
                "job_description": d.job_description,
                "eligibility_criteria": d.eligibility_criteria,
                "ctc": d.ctc,
                "course": d.course,
                "deadline": d.deadline,
                "status": d.status,
                "application_form_fields": d.application_form_fields,
                "application_count": db.query(Application).filter(Application.drive_id == d.id).count(),
                "round_count": len(d.rounds)
            } for d in drives
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/archived")
async def get_archived_drives(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "dept_admin"]))):
    try:
        drives = db.query(Drive).filter(Drive.status == "archived").all()
        return {"status": "success", "data": [
            {
                "id": d.id,
                "company_name": d.company_name,
                "role": d.role,
                "deadline": d.deadline,
                "status": d.status,
                "application_count": db.query(Application).filter(Application.drive_id == d.id).count(),
            } for d in drives
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{drive_id}/archive")
async def archive_drive(drive_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "dept_admin"]))):
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    drive.status = "archived"
    db.commit()
    return {"status": "success", "message": f"Drive {drive_id} archived"}

@router.get("/{drive_id}")
async def get_drive(drive_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        drive = DriveService.get_drive(db, drive_id)
        return {"status": "success", "data": {
            "id": drive.id, "company_name": drive.company_name, "role": drive.role,
            "description": drive.description, "job_description": drive.job_description,
            "eligibility_criteria": drive.eligibility_criteria,
            "ctc": drive.ctc, "course": drive.course,
            "deadline": drive.deadline, "status": drive.status,
            "application_form_fields": drive.application_form_fields,
            "rounds": [{"id": r.id, "round_number": r.round_number, "round_name": r.round_name} for r in drive.rounds]
        }}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{drive_id}/rounds")
async def add_rounds(drive_id: int, request: AddRoundsRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "dept_admin", "pr"]))):
    try:
        rounds_data = [item.dict() for item in request.rounds]
        rounds = DriveService.add_rounds(db, drive_id, rounds_data)
        return {"status": "success", "added_rounds": len(rounds)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UpdateDriveRequest(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    eligibility_criteria: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None  # open / closed / archived
    application_form_fields: Optional[List[str]] = None

@router.patch("/{drive_id}")
async def update_drive(drive_id: int, request: UpdateDriveRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "dept_admin", "pr"]))):
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    if request.company_name is not None:
        drive.company_name = request.company_name
    if request.role is not None:
        drive.role = request.role
    if request.description is not None:
        drive.description = request.description
    if request.eligibility_criteria is not None:
        drive.eligibility_criteria = request.eligibility_criteria
    if request.deadline is not None:
        drive.deadline = request.deadline
    if request.status is not None:
        drive.status = request.status
    if request.application_form_fields is not None:
        drive.application_form_fields = request.application_form_fields
    db.commit()
    db.refresh(drive)
    return {"status": "success", "message": f"Drive {drive_id} updated"}

@router.delete("/{drive_id}")
async def delete_drive(drive_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "dept_admin"]))):
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    # Delete associated rounds first
    db.query(Round).filter(Round.drive_id == drive_id).delete()
    # Delete applications
    db.query(Application).filter(Application.drive_id == drive_id).delete()
    
    db.delete(drive)
    db.commit()
    return {"status": "success", "message": f"Drive {drive_id} deleted permanently"}
