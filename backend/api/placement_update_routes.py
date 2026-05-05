from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database.db import get_db
from placement.auth_depends import get_current_user, require_role
from database.models import PlacementUpdate, User

router = APIRouter(prefix="/placement-updates", tags=["Placement Updates"])


class CreateUpdateRequest(BaseModel):
    update_type: str = "announcement"  # test, workshop, announcement
    title: str
    description: Optional[str] = None
    course: str = "ALL"  # MCA, MSAIM, ALL
    action_label: Optional[str] = None
    action_url: Optional[str] = None


class UpdateUpdateRequest(BaseModel):
    update_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    course: Optional[str] = None
    action_label: Optional[str] = None
    action_url: Optional[str] = None


@router.post("/create")
async def create_update(
    request: CreateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "dept_admin", "pr"]))
):
    update = PlacementUpdate(
        update_type=request.update_type,
        title=request.title,
        description=request.description,
        course=request.course,
        action_label=request.action_label,
        action_url=request.action_url,
        posted_by=current_user.id
    )
    db.add(update)
    db.commit()
    db.refresh(update)
    return {"status": "success", "update_id": update.id}


@router.get("/all")
async def get_updates(
    course: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PlacementUpdate).order_by(PlacementUpdate.created_at.desc())

    # For students, auto-filter by their course
    if current_user.role == "student" and current_user.course:
        query = query.filter(PlacementUpdate.course.in_([current_user.course, "ALL"]))
    elif course and course != "ALL":
        query = query.filter(PlacementUpdate.course.in_([course, "ALL"]))

    updates = query.limit(50).all()
    return {
        "status": "success",
        "data": [
            {
                "id": u.id,
                "update_type": u.update_type,
                "title": u.title,
                "description": u.description,
                "course": u.course,
                "action_label": u.action_label,
                "action_url": u.action_url,
                "posted_by_name": u.poster.name if u.poster else None,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in updates
        ]
    }


@router.delete("/{update_id}")
async def delete_update(
    update_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "dept_admin"]))
):
    update = db.query(PlacementUpdate).filter(PlacementUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    db.delete(update)
    db.commit()
    return {"status": "success", "message": "Update deleted"}


@router.patch("/{update_id}")
async def edit_update(
    update_id: int,
    request: UpdateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "dept_admin", "pr"]))
):
    update = db.query(PlacementUpdate).filter(PlacementUpdate.id == update_id).first()
    if not update:
        raise HTTPException(status_code=404, detail="Update not found")
    
    if request.update_type is not None:
        update.update_type = request.update_type
    if request.title is not None:
        update.title = request.title
    if request.description is not None:
        update.description = request.description
    if request.course is not None:
        update.course = request.course
    if request.action_label is not None:
        update.action_label = request.action_label
    if request.action_url is not None:
        update.action_url = request.action_url
        
    db.commit()
    db.refresh(update)
    return {"status": "success", "message": "Update modified"}
