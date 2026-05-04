from sqlalchemy.orm import Session
from typing import Any

from database.models import PlacementEvent, PlacementNotification, AuditLog, Student

EVENT_NEW_DRIVE = "new_drive_created"
EVENT_APPLICATION_CREATED = "application_created"
EVENT_ROUND_UPDATED = "round_updated"
EVENT_FINAL_RESULT = "final_result"

class EventBus:
    @staticmethod
    def emit(db: Session, event_type: str, payload: dict, actor_id: int | None = None):
        event = PlacementEvent(event_type=event_type, payload=payload)
        db.add(event)
        if actor_id is not None:
            EventBus.audit(db, action=event_type, user_id=actor_id, data=payload)
        return event

    @staticmethod
    def audit(db: Session, action: str, user_id: int | None, data: dict):
        audit = AuditLog(action=action, user_id=user_id, data=data)
        db.add(audit)
        return audit

    @staticmethod
    def notify_user(db: Session, user_id: int, message: str):
        db.add(PlacementNotification(user_id=user_id, message=message))

    @staticmethod
    def notify_students(db: Session, message: str):
        student_ids = [student.user_id for student in db.query(Student).all()]
        for student_user_id in student_ids:
            db.add(PlacementNotification(user_id=student_user_id, message=message))

    @staticmethod
    def get_notification_message(event_type: str, payload: dict) -> str | None:
        if event_type == EVENT_NEW_DRIVE:
            return f"New drive available: {payload.get('company_name')} - {payload.get('role')}"
        if event_type == EVENT_APPLICATION_CREATED:
            return f"Application submitted for {payload.get('company_name')}"
        if event_type == EVENT_ROUND_UPDATED:
            return f"Round update for {payload.get('company_name')}: {payload.get('round_name')} {payload.get('status')}"
        if event_type == EVENT_FINAL_RESULT:
            return f"Final result available for {payload.get('company_name')}: {payload.get('result')}"
        return None
