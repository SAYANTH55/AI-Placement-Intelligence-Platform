"""
Scoping Utility — Returns student IDs visible to the current user based on their role.

Usage:
    from utils.scoping import get_scoped_student_ids

    student_ids = get_scoped_student_ids(db, current_user)
    # Then filter your queries: .filter(Student.id.in_(student_ids))
"""
from sqlalchemy.orm import Session
from database.models import User, Student, PR


def get_scoped_student_ids(db: Session, current_user: User) -> list[int]:
    """
    Return a list of student IDs that the current user is allowed to see.

    - Admin: all students (optionally scoped to department)
    - PR: only students assigned to this PR
    - Student: only their own student record
    """
    if current_user.role == "admin":
        # Admin sees all students in their department (or all if no dept)
        query = db.query(Student.id)
        if current_user.department_id:
            query = query.join(User, Student.user_id == User.id).filter(
                User.department_id == current_user.department_id
            )
        return [row[0] for row in query.all()]

    elif current_user.role == "pr":
        # PR sees only their assigned students
        pr = db.query(PR).filter(PR.user_id == current_user.id).first()
        if not pr:
            return []
        return [row[0] for row in db.query(Student.id).filter(Student.pr_id == pr.id).all()]

    elif current_user.role == "student":
        # Student sees only themselves
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        return [student.id] if student else []

    return []


def get_scoped_students_query(db: Session, current_user: User):
    """
    Return a SQLAlchemy query for Student records scoped to the current user.
    Useful when you need the full Student objects, not just IDs.
    """
    query = db.query(Student)

    if current_user.role == "admin":
        if current_user.department_id:
            query = query.join(User, Student.user_id == User.id).filter(
                User.department_id == current_user.department_id
            )
        return query

    elif current_user.role == "pr":
        pr = db.query(PR).filter(PR.user_id == current_user.id).first()
        if not pr:
            return query.filter(Student.id == -1)  # Return empty
        return query.filter(Student.pr_id == pr.id)

    elif current_user.role == "student":
        return query.filter(Student.user_id == current_user.id)

    return query.filter(Student.id == -1)  # Default: no access
