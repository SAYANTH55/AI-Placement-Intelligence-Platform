from sqlalchemy.orm import Session
from sqlalchemy import or_
from database.models import Application, Student, Drive, RoundResult, User
from placement.event_bus import EventBus, EVENT_APPLICATION_CREATED

class ApplicationService:
    @staticmethod
    def _initialize_application_rounds(db: Session, app: Application):
        for drive_round in app.drive.rounds:
            round_result = RoundResult(
                application_id=app.id,
                round_id=drive_round.id,
                status="Pending"
            )
            db.add(round_result)

    @staticmethod
    def apply_to_drive(db: Session, student_id: int, drive_id: int, resume_path: str) -> Application:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError("Student profile not found")
            
        drive = db.query(Drive).filter(Drive.id == drive_id).first()
        if not drive:
            raise ValueError("Drive not found")
        if len(drive.rounds) == 0:
            raise ValueError("Drive must have at least one round configured before applications are accepted.")
            
        existing = db.query(Application).filter(Application.student_id == student_id, Application.drive_id == drive_id).first()
        if existing:
            raise ValueError("Already applied to this drive")
            
        app = Application(
            student_id=student_id,
            drive_id=drive_id,
            resume_path=resume_path,
            status="Applied"
        )
        db.add(app)
        db.flush()

        ApplicationService._initialize_application_rounds(db, app)

        EventBus.emit(db, EVENT_APPLICATION_CREATED, {
            "application_id": app.id,
            "student_id": student_id,
            "drive_id": drive_id,
            "company_name": drive.company_name,
            "role": drive.role
        }, actor_id=student.user_id)
        notification = EventBus.get_notification_message(EVENT_APPLICATION_CREATED, {
            "company_name": drive.company_name
        })
        if notification:
            EventBus.notify_user(db, student.user_id, notification)

        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def get_applications(db: Session, drive_id: int = None, batch: str = None, round_number: int = None, status: str = None, pr_id: int = None, filter_by_pr: bool = False, search: str | None = None) -> list[Application]:
        query = db.query(Application)
        if drive_id is not None:
            query = query.filter(Application.drive_id == drive_id)
        if batch:
            query = query.join(Student).filter(Student.batch == batch)
        if status:
            query = query.filter(Application.status == status)
        if filter_by_pr and pr_id is not None:
            query = query.join(Student).filter(Student.pr_id == pr_id)
        if round_number is not None:
            query = query.filter(Application.round_results.any(RoundResult.round.has(round_number=round_number)))
        if search:
            query = query.join(Student).join(User).filter(
                or_(
                    User.name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%")
                )
            )
        return query.distinct().all()
