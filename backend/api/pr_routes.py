from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database.db import get_db
from placement.pr_service import PRService
from placement.auth_depends import get_current_user, require_role
from database.models import User

router = APIRouter(prefix="/pr", tags=["PR Management"])

class CreatePRRequest(BaseModel):
    name: str
    email: str
    password: str
    batch: str

class AssignStudentsRequest(BaseModel):
    pr_id: int
    student_ids: List[int]

@router.post("/create")
async def create_pr(request: CreatePRRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    try:
        pr = PRService.create_pr(db, request.email, request.name, request.password, request.batch)
        return {"status": "success", "pr_id": pr.id, "user_id": pr.user_id, "batch": pr.batch}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/assign_students")
async def assign_students(request: AssignStudentsRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        count = PRService.assign_students(db, request.pr_id, request.student_ids)
        return {"status": "success", "assigned_count": count}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pr_id}/students")
async def get_pr_students(pr_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    # If PR, they can only view their own
    if current_user.role == "pr":
        pr_profile = current_user.pr_profile
        if not pr_profile or pr_profile.id != pr_id:
            raise HTTPException(status_code=403, detail="Not authorized to view these students")
            
    try:
        students = PRService.get_students(db, pr_id)
        return {
            "status": "success", 
            "data": [
                {
                    "id": s.id, 
                    "user_id": s.user_id, 
                    "name": s.user.name, 
                    "email": s.user.email,
                    "batch": s.batch,
                    "cgpa": s.cgpa
                } for s in students
            ]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
