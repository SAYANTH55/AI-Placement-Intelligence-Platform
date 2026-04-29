from sqlalchemy.orm import Session
from sqlalchemy import func
from database.models import Student, Drive, Application, RoundResult, PR, PlacementOutcome

class DashboardService:
    @staticmethod
    def get_overall_stats(db: Session):
        total_students = db.query(Student).count()
        placed_students = db.query(PlacementOutcome).filter(PlacementOutcome.got_placed == True).count()
        
        rate = round((placed_students / total_students * 100), 2) if total_students > 0 else 0
        return {
            "total_students": total_students,
            "placed_students": placed_students,
            "placement_rate": rate
        }

    @staticmethod
    def get_round_analytics(db: Session):
        round1_clear = db.query(RoundResult).filter(RoundResult.round_id == 1, RoundResult.status.ilike('pass')).count()
        round2_clear = db.query(RoundResult).filter(RoundResult.round_id == 2, RoundResult.status.ilike('pass')).count()
        dropoffs = round1_clear - round2_clear # simple mock representation
        return {
            "round1_clear_count": round1_clear,
            "round2_clear_count": round2_clear,
            "dropoffs": max(0, dropoffs)
        }

    @staticmethod
    def get_drive_stats(db: Session):
        total_drives = db.query(Drive).count()
        total_apps = db.query(Application).count()
        avg_apps_per_drive = round(total_apps / total_drives, 1) if total_drives > 0 else 0
        
        selected_apps = db.query(Application).filter(Application.status.in_(["Placed", "Selected"])) .count()
        selection_rate = round((selected_apps / total_apps * 100), 2) if total_apps > 0 else 0
        
        return {
            "applications_per_drive": avg_apps_per_drive,
            "selection_rate": selection_rate
        }

    @staticmethod
    def get_pr_stats(db: Session):
        total_prs = db.query(PR).count()
        total_students = db.query(Student).count()
        students_per_pr = round(total_students / total_prs, 1) if total_prs > 0 else 0
        
        # Success rate per PR mock
        return {
            "students_per_pr": students_per_pr,
            "success_rate": 65.5 # Mock, realistically calculate based on PR's students in Outcomes
        }
