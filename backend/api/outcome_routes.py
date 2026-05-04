from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database.db import get_db
from database.models import PlacementOutcome, User
from utils.logger import platform_logger
from learning_layer.learning_service import learning_service

router = APIRouter()

class OutcomeCreate(BaseModel):
    user_id: int
    got_placed: bool
    company: Optional[str] = None
    role: Optional[str] = None
    offer_date: Optional[datetime] = None
    time_to_offer_days: Optional[int] = None
    package: Optional[float] = None

class OutcomeResponse(OutcomeCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/outcomes", response_model=OutcomeResponse)
async def record_outcome(outcome: OutcomeCreate, db: Session = Depends(get_db)):
    """
    Record a placement outcome for a user.
    This serves as the ground truth for ML model validation.
    """
    platform_logger.info(f"Recording outcome for user {outcome.user_id}: placed={outcome.got_placed}")
    
    # Verify user exists
    user = db.query(User).filter(User.id == outcome.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_outcome = PlacementOutcome(**outcome.model_dump())
    db.add(db_outcome)
    db.commit()
    db.refresh(db_outcome)
    
    # Close the loop: Log to the ML feedback layer
    learning_service.log_outcome(str(outcome.user_id), outcome.model_dump())
    
    platform_logger.info(f"Outcome recorded successfully and fed to ML loop with ID {db_outcome.id}")
    return db_outcome

@router.get("/outcomes/{user_id}", response_model=List[OutcomeResponse])
async def get_user_outcomes(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all recorded outcomes for a specific user."""
    outcomes = db.query(PlacementOutcome).filter(PlacementOutcome.user_id == user_id).all()
    return outcomes

@router.get("/analytics/outcomes")
async def get_all_outcomes(db: Session = Depends(get_db)):
    """
    Get aggregated outcome analytics for the placement cell dashboard.
    """
    total = db.query(PlacementOutcome).count()
    placed = db.query(PlacementOutcome).filter(PlacementOutcome.got_placed == True).count()
    
    # Calculate average time to offer for those placed
    placed_outcomes = db.query(PlacementOutcome).filter(PlacementOutcome.got_placed == True).all()
    avg_tto = 0
    if placed_outcomes:
        tto_list = [o.time_to_offer_days for o in placed_outcomes if o.time_to_offer_days is not None]
        if tto_list:
            avg_tto = sum(tto_list) / len(tto_list)
            
    return {
        "total_records": total,
        "placement_rate": (placed / total * 100) if total > 0 else 0,
        "average_time_to_offer_days": round(avg_tto, 1),
        "total_placed": placed
    }
