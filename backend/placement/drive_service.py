from sqlalchemy.orm import Session
from database.models import Drive, Round
from datetime import datetime
from placement.event_bus import EventBus, EVENT_NEW_DRIVE

class DriveService:
    @staticmethod
    def create_drive(db: Session, company_name: str, role: str, description: str, eligibility_criteria: str, deadline: datetime, user_id: int, rounds_data: list[dict] | None = None) -> Drive:
        drive = Drive(
            company_name=company_name,
            role=role,
            description=description,
            eligibility_criteria=eligibility_criteria,
            deadline=deadline,
            created_by=user_id,
            status="open"
        )
        db.add(drive)
        db.flush()

        if rounds_data:
            for r_data in rounds_data:
                r = Round(
                    drive_id=drive.id,
                    round_number=r_data.get("round_number"),
                    round_name=r_data.get("round_name")
                )
                db.add(r)

        EventBus.emit(db, EVENT_NEW_DRIVE, {
            "drive_id": drive.id,
            "company_name": company_name,
            "role": role,
            "deadline": deadline.isoformat() if hasattr(deadline, "isoformat") else str(deadline)
        }, actor_id=user_id)
        EventBus.notify_students(db, EventBus.get_notification_message(EVENT_NEW_DRIVE, {"company_name": company_name, "role": role}))

        db.commit()
        db.refresh(drive)
        return drive

    @staticmethod
    def close_expired_drives(db: Session):
        now = datetime.utcnow()
        expired_drives = db.query(Drive).filter(Drive.status == "open", Drive.deadline < now).all()
        for expired in expired_drives:
            expired.status = "closed"
        if expired_drives:
            db.commit()

    @staticmethod
    def get_drives(db: Session, active_only: bool = False) -> list[Drive]:
        DriveService.close_expired_drives(db)
        query = db.query(Drive)
        if active_only:
            query = query.filter(Drive.status == "open")
        return query.all()

    @staticmethod
    def get_drive(db: Session, drive_id: int) -> Drive:
        drive = db.query(Drive).filter(Drive.id == drive_id).first()
        if not drive:
            raise ValueError("Drive not found")
        if drive.status == "open" and drive.deadline and drive.deadline < datetime.utcnow():
            drive.status = "closed"
            db.commit()
            db.refresh(drive)
        return drive

    @staticmethod
    def add_rounds(db: Session, drive_id: int, rounds_data: list[dict]) -> list[Round]:
        drive = db.query(Drive).filter(Drive.id == drive_id).first()
        if not drive:
            raise ValueError("Drive not found")
        
        rounds = []
        for r_data in rounds_data:
            r = Round(
                drive_id=drive_id,
                round_number=r_data.get("round_number"),
                round_name=r_data.get("round_name")
            )
            db.add(r)
            rounds.append(r)
        
        db.commit()
        for r in rounds:
            db.refresh(r)
        return rounds
