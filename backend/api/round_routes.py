from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.db import get_db
from placement.round_service import RoundService
from placement.auth_depends import get_current_user, require_role
from database.models import User

router = APIRouter(prefix="/round", tags=["Round Management"])

class UpdateRoundRequest(BaseModel):
    application_id: int
    round_id: int
    status: str

@router.post("/update")
async def update_round(request: UpdateRoundRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin", "pr"]))):
    try:
        result = RoundService.update_round(db, request.application_id, request.round_id, request.status, current_user.id)
        return {"status": "success", "message": "Round updated", "round_result_id": result.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
