from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from placement.dashboard_service import DashboardService
from placement.auth_depends import get_current_user, require_role
from database.models import User

router = APIRouter(prefix="/admin", tags=["Admin Dashboard Analytics"])

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        return {"status": "success", "data": DashboardService.get_overall_stats(db)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/round-analytics")
async def get_round_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        return {"status": "success", "data": DashboardService.get_round_analytics(db)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drive-stats")
async def get_drive_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        return {"status": "success", "data": DashboardService.get_drive_stats(db)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pr-stats")
async def get_pr_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        return {"status": "success", "data": DashboardService.get_pr_stats(db)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/drive/{drive_id}/batch-status")
async def get_batch_application_status(drive_id: int, batch: str, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        from database.models import Student, Application
        query = db.query(Student).filter(Student.batch == batch)
        if current_user.role == "pr" and current_user.pr_profile:
            query = query.filter(Student.pr_id == current_user.pr_profile.id)
        students = query.all()
        
        # Get all applications for this drive
        apps = db.query(Application).filter(Application.drive_id == drive_id).all()
        applied_student_ids = {a.student_id for a in apps}
        
        result = []
        for s in students:
            result.append({
                "id": s.id,
                "name": s.user.name,
                "email": s.user.email,
                "phone": s.user.phone,
                "applied": s.id in applied_student_ids
            })
            
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
