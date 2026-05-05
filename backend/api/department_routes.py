from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database.db import get_db
from placement.auth_depends import get_current_user, require_role
from database.models import Department, User

router = APIRouter(prefix="/department", tags=["Department Management"])


class CreateDepartmentRequest(BaseModel):
    name: str
    level: Optional[str] = None  # UG / PG


@router.post("/create")
async def create_department(
    request: CreateDepartmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    existing = db.query(Department).filter(Department.name == request.name).first()
    if existing:
        return {"status": "success", "department_id": existing.id, "message": "Department already exists"}

    dept = Department(name=request.name, level=request.level)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"status": "success", "department_id": dept.id}


@router.get("/all")
async def get_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    depts = db.query(Department).order_by(Department.name).all()
    return {
        "status": "success",
        "data": [{"id": d.id, "name": d.name, "level": d.level} for d in depts]
    }
