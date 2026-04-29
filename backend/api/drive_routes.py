from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from database.db import get_db
from placement.drive_service import DriveService
from placement.auth_depends import get_current_user, require_role
from database.models import User, Application

router = APIRouter(prefix="/drive", tags=["Drive Management"])

class CreateRoundItem(BaseModel):
    round_number: int
    round_name: str

class CreateDriveRequest(BaseModel):
    company_name: str
    role: str
    description: str
    eligibility_criteria: str
    deadline: datetime
    rounds: Optional[List[CreateRoundItem]] = None

class AddRoundsRequest(BaseModel):
    rounds: List[CreateRoundItem]

@router.post("/create")
async def create_drive(request: CreateDriveRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        print(f"Creating drive for {request.company_name} by user {current_user.id}")
        drive = DriveService.create_drive(
            db, request.company_name, request.role, request.description, 
            request.eligibility_criteria, request.deadline, current_user.id,
            rounds_data=[r.dict() for r in request.rounds] if request.rounds else None
        )
        print(f"Drive created successfully with ID {drive.id}")
        return {"status": "success", "drive_id": drive.id}
    except Exception as e:
        print(f"Error creating drive: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/s")
async def get_drives_short(active_only: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        drives = DriveService.get_drives(db, active_only)
        return {"status": "success", "data": [
            {
                "id": d.id,
                "company_name": d.company_name,
                "role": d.role,
                "deadline": d.deadline,
                "status": d.status,
                "application_count": db.query(Application).filter(Application.drive_id == d.id).count(),
                "round_count": len(d.rounds)
            } for d in drives
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
async def get_drives(active_only: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        drives = DriveService.get_drives(db, active_only)
        return {"status": "success", "data": [
            {
                "id": d.id,
                "company_name": d.company_name,
                "role": d.role,
                "deadline": d.deadline,
                "status": d.status,
                "application_count": db.query(Application).filter(Application.drive_id == d.id).count(),
                "round_count": len(d.rounds)
            } for d in drives
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{drive_id}")
async def get_drive(drive_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        drive = DriveService.get_drive(db, drive_id)
        # 🔗 AI INTEGRATION (PLACEHOLDER ONLY): When student views drive
        if current_user.role == "student":
            # AI HOOK: call get_ai_readiness(student_id, drive_role)
            pass
            
        return {"status": "success", "data": {
            "id": drive.id, "company_name": drive.company_name, "role": drive.role,
            "description": drive.description, "eligibility_criteria": drive.eligibility_criteria,
            "deadline": drive.deadline, "status": drive.status,
            "rounds": [{"id": r.id, "round_number": r.round_number, "round_name": r.round_name} for r in drive.rounds]
        }}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{drive_id}/rounds")
async def add_rounds(drive_id: int, request: AddRoundsRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        rounds_data = [item.dict() for item in request.rounds]
        rounds = DriveService.add_rounds(db, drive_id, rounds_data)
        return {"status": "success", "added_rounds": len(rounds)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
