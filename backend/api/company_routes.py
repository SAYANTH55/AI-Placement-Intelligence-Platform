from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database.db import get_db
from placement.auth_depends import get_current_user, require_role
from database.models import Company, User

router = APIRouter(prefix="/company", tags=["Company Management"])


class CreateCompanyRequest(BaseModel):
    name: str
    initials: Optional[str] = None
    website: Optional[str] = None


@router.post("/create")
async def create_company(
    request: CreateCompanyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "dept_admin", "pr"]))
):
    existing = db.query(Company).filter(Company.name == request.name).first()
    if existing:
        return {"status": "success", "company_id": existing.id, "message": "Company already exists"}

    company = Company(name=request.name, initials=request.initials, website=request.website)
    db.add(company)
    db.commit()
    db.refresh(company)
    return {"status": "success", "company_id": company.id}


@router.get("/all")
async def get_companies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    companies = db.query(Company).order_by(Company.name).all()
    return {
        "status": "success",
        "data": [
            {"id": c.id, "name": c.name, "initials": c.initials, "website": c.website}
            for c in companies
        ]
    }


@router.get("/search")
async def search_companies(q: str = "", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    companies = db.query(Company).filter(Company.name.ilike(f"%{q}%")).limit(20).all()
    return {
        "status": "success",
        "data": [{"id": c.id, "name": c.name, "initials": c.initials} for c in companies]
    }
