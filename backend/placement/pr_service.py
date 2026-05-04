from sqlalchemy.orm import Session
from database.models import User, PR, Student
from api.auth import pwd_context

class PRService:
    @staticmethod
    def create_pr(db: Session, email: str, name: str, password: str, batch: str) -> PR:
        # Create user
        hashed_password = pwd_context.hash(password)
        new_user = User(name=name, email=email, password=hashed_password, role="pr")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create PR profile
        new_pr = PR(user_id=new_user.id, batch=batch)
        db.add(new_pr)
        db.commit()
        db.refresh(new_pr)
        return new_pr

    @staticmethod
    def assign_students(db: Session, pr_id: int, student_ids: list[int]) -> int:
        pr = db.query(PR).filter(PR.id == pr_id).first()
        if not pr:
            raise ValueError("PR not found")
        
        count = 0
        for s_id in student_ids:
            student = db.query(Student).filter(Student.id == s_id).first()
            if student:
                student.pr_id = pr_id
                count += 1
        db.commit()
        return count

    @staticmethod
    def get_students(db: Session, pr_id: int) -> list[Student]:
        pr = db.query(PR).filter(PR.id == pr_id).first()
        if not pr:
            raise ValueError("PR not found")
            
        students = db.query(Student).filter(Student.pr_id == pr_id).all()
        return students
