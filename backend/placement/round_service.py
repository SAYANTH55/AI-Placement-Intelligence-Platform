from sqlalchemy.orm import Session
from database.models import User, Application, RoundResult, Round, PlacementOutcome
from placement.event_bus import EventBus, EVENT_ROUND_UPDATED, EVENT_FINAL_RESULT

class RoundService:
    @staticmethod
    def _resolve_round(db: Session, app: Application, round_id: int | None = None, round_number: int | None = None) -> Round:
        if round_id is not None:
            return db.query(Round).filter(Round.id == round_id, Round.drive_id == app.drive_id).first()
        if round_number is not None:
            return db.query(Round).filter(Round.drive_id == app.drive_id, Round.round_number == round_number).first()
        raise ValueError("Either round_id or round_number is required")

    @staticmethod
    def update_round(db: Session, application_id: int, status: str, updated_by_id: int, round_id: int | None = None, round_number: int | None = None) -> RoundResult:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError("Application not found")

        target_round = RoundService._resolve_round(db, app, round_id=round_id, round_number=round_number)
        if not target_round:
            raise ValueError("Round not found for this application")

        if target_round.round_number != app.current_round:
            raise ValueError(f"Invalid round order. Expected round {app.current_round}, but got {target_round.round_number}")

        result = db.query(RoundResult).filter(
            RoundResult.application_id == application_id,
            RoundResult.round_id == target_round.id
        ).first()

        if not result:
            result = RoundResult(
                application_id=application_id,
                round_id=target_round.id,
                status="Pending"
            )
            db.add(result)
            db.flush()

        if result.status != "Pending":
            raise ValueError("Round result has already been recorded")

        normalized_status = status.strip().capitalize()
        if normalized_status not in ("Pass", "Fail"):
            raise ValueError("Round status must be 'Pass' or 'Fail'")

        result.status = normalized_status
        result.updated_by = updated_by_id

        total_rounds = len(app.drive.rounds)
        if normalized_status == "Pass":
            if target_round.round_number == total_rounds:
                app.status = "Placed"
                app.final_status = "Placed"
                existing = db.query(PlacementOutcome).filter(PlacementOutcome.student_id == app.student_id, PlacementOutcome.drive_id == app.drive_id).first()
                if not existing:
                    outcome = PlacementOutcome(
                        student_id=app.student_id,
                        user_id=app.student.user_id,
                        drive_id=app.drive_id,
                        company=app.drive.company_name,
                        role=app.drive.role,
                        got_placed=True
                    )
                    db.add(outcome)
                    db.flush()
                    EventBus.emit(db, "PLACEMENT_RESULT", {"application_id": app.id, "student_id": app.student_id, "got_placed": True}, actor_id=updated_by_id)
            else:
                app.status = "In Progress"
                app.final_status = None
        else:
            app.status = "Rejected"
            app.final_status = "Rejected"
            existing = db.query(PlacementOutcome).filter(PlacementOutcome.student_id == app.student_id, PlacementOutcome.drive_id == app.drive_id).first()
            if not existing:
                outcome = PlacementOutcome(
                    student_id=app.student_id,
                    user_id=app.student.user_id,
                    drive_id=app.drive_id,
                    company=app.drive.company_name,
                    role=app.drive.role,
                    got_placed=False
                )
                db.add(outcome)
                db.flush()
                EventBus.emit(db, "PLACEMENT_RESULT", {"application_id": app.id, "student_id": app.student_id, "got_placed": False}, actor_id=updated_by_id)

        msg = f"Update for {app.drive.company_name}: {normalized_status} in {target_round.round_name}."
        EventBus.emit(db, EVENT_ROUND_UPDATED, {
            "application_id": application_id,
            "round_id": target_round.id,
            "round_name": target_round.round_name,
            "company_name": app.drive.company_name,
            "status": normalized_status
        }, actor_id=updated_by_id)
        EventBus.notify_user(db, app.student.user_id, msg)

        db.commit()
        db.refresh(result)
        return result

    @staticmethod
    def finalize_application(db: Session, application_id: int, status: str, updated_by_id: int | None = None) -> PlacementOutcome:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError("Application not found")
            
        normalized_status = status.strip().lower()
        if normalized_status in ("selected", "placed"):
            final_status = "Placed"
        elif normalized_status in ("rejected", "not selected", "not_placed", "not placed"):
            final_status = "Rejected"
        else:
            raise ValueError("Final status must be 'Placed' or 'Rejected'")

        app.status = final_status
        app.final_status = final_status
        existing_outcome = db.query(PlacementOutcome).filter(PlacementOutcome.student_id == app.student_id, PlacementOutcome.drive_id == app.drive_id).first()
        if existing_outcome:
            existing_outcome.got_placed = (final_status == "Placed")
            existing_outcome.company = app.drive.company_name
            existing_outcome.role = app.drive.role
            outcome = existing_outcome
        else:
            outcome = PlacementOutcome(
                student_id=app.student_id,
                user_id=app.student.user_id,
                drive_id=app.drive_id,
                company=app.drive.company_name,
                role=app.drive.role,
                got_placed=(final_status == "Placed")
            )
            db.add(outcome)

        msg = f"Final Result: You have been {final_status} for {app.drive.company_name}!"
        EventBus.emit(db, EVENT_FINAL_RESULT, {
            "application_id": application_id,
            "drive_id": app.drive_id,
            "company_name": app.drive.company_name,
            "result": final_status
        }, actor_id=updated_by_id)
        EventBus.notify_user(db, app.student.user_id, msg)
        
        db.commit()
        db.refresh(outcome)
        
        return outcome
