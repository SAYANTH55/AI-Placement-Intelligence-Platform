"""
Provisioning Routes — Bulk student import, student management, PR-student mapping.
"""
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional

from database.db import get_db
from database.models import User, Student, PR
from placement.auth_depends import require_role
from api.auth import pwd_context

router = APIRouter(prefix="/provisioning", tags=["Provisioning"])


# ── Schemas ──────────────────────────────────────────────

class AssignRequest(BaseModel):
    pr_id: int
    student_ids: List[int]


class UnassignRequest(BaseModel):
    student_ids: List[int]


class AddStudentRequest(BaseModel):
    name: str
    email: str
    roll_number: str
    course: str        # MCA or MSAIM
    batch: str
    cgpa: Optional[float] = 0.0


# ── Add Single Student ───────────────────────────────────

@router.post("/add-student")
async def add_single_student(
    request: AddStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "pr", "staff"]))
):
    """
    Manually add a single student account.
    Password is auto-set to the roll_number. first_login=True forces a reset.
    """
    email = request.email.strip().lower()
    roll = request.roll_number.strip()
    course = request.course.strip().upper()

    if course not in ("MCA", "MSAIM"):
        raise HTTPException(status_code=400, detail="Course must be MCA or MSAIM")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail=f"Email '{email}' is already in use")

    if db.query(User).filter(User.roll_number == roll).first():
        raise HTTPException(status_code=400, detail=f"Roll number '{roll}' is already in use")

    hashed_pw = pwd_context.hash(roll)
    new_user = User(
        name=request.name.strip(),
        email=email,
        phone=None,
        password=hashed_pw,
        role="student",
        course=course,
        department_id=current_user.department_id,
        roll_number=roll,
        first_login=True
    )
    db.add(new_user)
    db.flush()

    new_student = Student(
        user_id=new_user.id,
        batch=request.batch.strip(),
        cgpa=request.cgpa or 0.0,
        profile_data={"skills": [], "experience": ""}
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "status": "success",
        "message": f"Student '{new_user.name}' created. Temporary password: {roll}",
        "student": {
            "id": new_student.id,
            "user_id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "roll_number": roll,
            "course": course,
            "batch": new_student.batch
        }
    }


# ── CSV Template ─────────────────────────────────────────

@router.get("/csv-template")
async def download_csv_template(current_user: User = Depends(require_role(["admin"]))):
    """Download a blank CSV template for bulk student import."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "email", "roll_number", "course", "batch"])
    writer.writerow(["John Doe", "john@college.edu", "MCA2025001", "MCA", "MCA 2025 A"])
    writer.writerow(["Jane Smith", "jane@college.edu", "MSAIM2025001", "MSAIM", "MSAIM 2025 A"])
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_import_template.csv"}
    )


# ── Bulk Import ──────────────────────────────────────────

@router.post("/bulk-import")
async def bulk_import_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Upload a CSV file to create student accounts in bulk.
    Expected columns: name, email, roll_number, course, batch
    Password is auto-set to the roll_number (student changes on first login).
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # Handle BOM from Excel
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    # Validate headers
    required = {"name", "email", "roll_number", "course", "batch"}
    if not required.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have columns: {', '.join(required)}. Found: {reader.fieldnames}"
        )

    created = 0
    skipped = 0
    errors = []

    for idx, row in enumerate(reader, start=2):  # start=2 because row 1 is header
        name = (row.get("name") or "").strip()
        email = (row.get("email") or "").strip().lower()
        roll_number = (row.get("roll_number") or "").strip()
        course = (row.get("course") or "").strip().upper()
        batch = (row.get("batch") or "").strip()

        # Validate row
        if not all([name, email, roll_number, course, batch]):
            errors.append(f"Row {idx}: Missing required fields")
            continue

        if course not in ("MCA", "MSAIM"):
            errors.append(f"Row {idx}: Invalid course '{course}'. Must be MCA or MSAIM.")
            continue

        # Check duplicates
        if db.query(User).filter((User.email == email) | (User.roll_number == roll_number)).first():
            skipped += 1
            continue

        try:
            # Create user account
            hashed_pw = pwd_context.hash(roll_number)
            new_user = User(
                name=name,
                email=email,
                phone=None,
                password=hashed_pw,
                role="student",
                course=course,
                department_id=current_user.department_id,
                roll_number=roll_number,
                first_login=True
            )
            db.add(new_user)
            db.flush()  # Get user ID without committing

            # Create student profile
            new_student = Student(
                user_id=new_user.id,
                batch=batch,
                cgpa=0.0,
                profile_data={"skills": [], "experience": ""}
            )
            db.add(new_student)
            created += 1

        except Exception as e:
            errors.append(f"Row {idx} ({email}): {str(e)}")
            db.rollback()
            continue

    # Commit all successful records
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")

    return {
        "status": "success",
        "summary": {
            "created": created,
            "skipped": skipped,
            "errors": errors,
            "total_processed": created + skipped + len(errors)
        }
    }


# ── Student List ─────────────────────────────────────────

@router.get("/students")
async def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "pr"])),
    batch: Optional[str] = None
):
    """List all students with their PR assignment and account status."""
    query = db.query(Student).options(
        joinedload(Student.user),
        joinedload(Student.pr).joinedload(PR.user)
    )
    if batch:
        query = query.filter(Student.batch == batch)
    # PR scoping: only show their assigned students
    if current_user.role == "pr" and current_user.pr_profile:
        query = query.filter(Student.pr_id == current_user.pr_profile.id)
    students = query.all()
    result = []
    for s in students:
        if not s.user:
            continue
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "name": s.user.name,
            "email": s.user.email,
            "roll_number": s.user.roll_number,
            "course": s.user.course,
            "batch": s.batch,
            "cgpa": s.cgpa,
            "pr_id": s.pr_id,
            "pr_name": s.pr.user.name if s.pr and s.pr.user else None,
            "account_status": "pending" if s.user.first_login else "active",
            "created_at": s.user.created_at.isoformat() if s.user.created_at else None
        })
    return {"status": "success", "data": result}



# ── PR List with Counts ──────────────────────────────────

@router.get("/prs")
async def list_prs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
    batch: Optional[str] = None
):
    """List all PRs with their assigned student count."""
    prs = db.query(PR).options(
        joinedload(PR.user),
        joinedload(PR.assigned_students)
    )
    if batch:
        prs = prs.filter(PR.batch == batch)
    result = []
    for pr in prs:
        if not pr.user:
            continue
        result.append({
            "id": pr.id,
            "user_id": pr.user_id,
            "name": pr.user.name,
            "email": pr.user.email,
            "batch": pr.batch,
            "student_count": len(pr.assigned_students),
            "student_ids": [s.id for s in pr.assigned_students]
        })
    return {"status": "success", "data": result}
async def list_prs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """List all PRs with their assigned student count."""
    prs = db.query(PR).options(
        joinedload(PR.user),
        joinedload(PR.assigned_students)
    ).all()

    result = []
    for pr in prs:
        if not pr.user:
            continue
        result.append({
            "id": pr.id,
            "user_id": pr.user_id,
            "name": pr.user.name,
            "email": pr.user.email,
            "batch": pr.batch,
            "student_count": len(pr.assigned_students),
            "student_ids": [s.id for s in pr.assigned_students]
        })

    return {"status": "success", "data": result}


# ── Assign Students to PR ────────────────────────────────

@router.post("/assign")
async def assign_students_to_pr(
    request: AssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Assign a list of students to a specific PR, ensuring batch consistency."""
    pr = db.query(PR).filter(PR.id == request.pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    # Ensure PR has a defined batch
    pr_batch = pr.batch
    if not pr_batch:
        raise HTTPException(status_code=400, detail="PR batch not defined")
    assigned = 0
    for sid in request.student_ids:
        student = db.query(Student).filter(Student.id == sid).first()
        if not student:
            continue
        if student.batch != pr_batch:
            raise HTTPException(status_code=400, detail=f"Student {student.id} batch '{student.batch}' does not match PR batch '{pr_batch}'")
        student.pr_id = request.pr_id
        assigned += 1
    db.commit()
    return {
        "status": "success",
        "message": f"Assigned {assigned} students to PR {pr.user.name}",
        "assigned_count": assigned
    }

# Duplicate assign_students_to_pr definition removed – original kept above


# ── Unassign Students from PR ────────────────────────────

@router.post("/unassign")
async def unassign_students(
    request: UnassignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Remove PR assignment from students (set pr_id to None)."""
    unassigned = 0
    for sid in request.student_ids:
        student = db.query(Student).filter(Student.id == sid).first()
        if student and student.pr_id is not None:
            student.pr_id = None
            unassigned += 1

    db.commit()
    return {
        "status": "success",
        "message": f"Unassigned {unassigned} students",
        "unassigned_count": unassigned
    }


# ── Delete Student ───────────────────────────────────────

@router.delete("/student/{student_id}")
async def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete a student account and their user record."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    user = db.query(User).filter(User.id == student.user_id).first()

    # Delete student profile first (FK constraint)
    db.delete(student)
    if user:
        db.delete(user)

    db.commit()
    return {"status": "success", "message": "Student account deleted"}
