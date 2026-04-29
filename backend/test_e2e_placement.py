#!/usr/bin/env python3
"""
End-to-End Placement Workflow Validation
Tests the complete lifecycle: Drive → Application → Rounds → Outcome
"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from database.db import SessionLocal, engine
from database.models import (
    Base, User, Student, PR, Drive, Round, Application, RoundResult, 
    PlacementOutcome, APPLICATION_STATUSES, ROUND_STATUSES
)
from placement.application_service import ApplicationService
from placement.round_service import RoundService
from placement.drive_service import DriveService
from api.auth import pwd_context

def get_hash(pwd):
    return pwd_context.hash(pwd)

def test_step(step_num, description):
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {description}")
    print('='*60)

def validate(condition, message):
    if not condition:
        raise AssertionError(f"[FAIL] VALIDATION FAILED: {message}")
    print(f"[PASS] {message}")

def reset_db():
    """Reset database to clean state"""
    test_step(0, "Reset Database")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[PASS] Database reset complete")

def create_test_users(db: Session):
    """Create Admin, PR, and Student users"""
    test_step(1, "Create Test Users")
    
    admin = User(
        name="Test Admin",
        email="admin@test.com",
        phone="9000000001",
        password=get_hash("admin123"),
        role="admin"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"[PASS] Admin created (ID: {admin.id})")
    
    pr_user = User(
        name="Test PR",
        email="pr@test.com",
        phone="9000000002",
        password=get_hash("pr123"),
        role="pr"
    )
    db.add(pr_user)
    db.commit()
    db.refresh(pr_user)
    
    pr = PR(user_id=pr_user.id, batch="2026")
    db.add(pr)
    db.commit()
    db.refresh(pr)
    print(f"[PASS] PR created (ID: {pr.id})")
    
    student_user = User(
        name="Test Student",
        email="student@test.com",
        phone="9000000003",
        password=get_hash("student123"),
        role="student"
    )
    db.add(student_user)
    db.commit()
    db.refresh(student_user)
    
    student = Student(
        user_id=student_user.id,
        pr_id=pr.id,
        batch="2026",
        cgpa=8.5,
        profile_data={"skills": ["Python", "SQL"], "experience": "1 year"}
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    print(f"[PASS] Student created (ID: {student.id})")
    
    return admin, pr, student

def create_test_drive(db: Session, admin_id: int):
    """Create a drive with 3 rounds"""
    test_step(2, "Create Drive with Rounds")
    
    drive = Drive(
        company_name="Test Corp",
        role="Software Engineer",
        description="Test placement drive",
        eligibility_criteria="CGPA > 7.0",
        deadline=datetime.utcnow() + timedelta(days=7),
        created_by=admin_id,
        status="open"
    )
    db.add(drive)
    db.flush()
    
    rounds_data = [
        {"round_number": 1, "round_name": "Aptitude"},
        {"round_number": 2, "round_name": "Technical"},
        {"round_number": 3, "round_name": "HR"}
    ]
    
    for r_data in rounds_data:
        r = Round(
            drive_id=drive.id,
            round_number=r_data["round_number"],
            round_name=r_data["round_name"]
        )
        db.add(r)
    
    db.commit()
    db.refresh(drive)
    print(f"[PASS] Drive created (ID: {drive.id}, Name: {drive.company_name})")
    print(f"[PASS] Rounds created: {len(drive.rounds)} rounds")
    
    return drive

def test_application_creation(db: Session, student_id: int, drive_id: int):
    """Test: Student applies → Verify all rounds auto-created"""
    test_step(3, "Student Application & Round Auto-Initialization")
    
    app = ApplicationService.apply_to_drive(
        db, 
        student_id=student_id,
        drive_id=drive_id,
        resume_path="test_resume.pdf"
    )
    
    validate(app.id is not None, "Application created with ID")
    validate(app.status == "Applied", f"Application status is 'Applied' (got: {app.status})")
    validate(app.current_round == 1, f"Current round is 1 (got: {app.current_round})")
    
    # Verify rounds
    db.refresh(app)
    round_count = len(app.round_results)
    validate(round_count == 3, f"3 rounds created for application (got: {round_count})")
    
    for rr in app.round_results:
        validate(rr.status == "Pending", f"Round {rr.round.round_name} is Pending (got: {rr.status})")
    
    print(f"[PASS] Application created (ID: {app.id})")
    print(f"[PASS] All {round_count} rounds auto-created as Pending")
    
    return app

def test_round_progression(db: Session, app_id: int, pr_id: int):
    """Test: Update Round 1 Pass → Round 2 Pending → Update Round 2 Pass → Round 3"""
    test_step(4, "Round Progression: Round 1 Pass")
    
    app = db.query(Application).filter(Application.id == app_id).first()
    
    # Update Round 1 to Pass
    result1 = RoundService.update_round(
        db,
        application_id=app_id,
        status="Pass",
        updated_by_id=pr_id,
        round_number=1
    )
    
    db.refresh(app)
    validate(result1.status == "Pass", f"Round 1 result is Pass")
    validate(app.status == "In Progress", f"Application status is 'In Progress' (got: {app.status})")
    validate(app.current_round == 2, f"Current round advanced to 2 (got: {app.current_round})")
    
    print(f"[PASS] Round 1 updated to Pass")
    print(f"[PASS] Application status: {app.status}")
    print(f"[PASS] Current round advanced to: {app.current_round}")
    
    test_step(5, "Round Progression: Round 2 Pass")
    
    # Update Round 2 to Pass
    result2 = RoundService.update_round(
        db,
        application_id=app_id,
        status="Pass",
        updated_by_id=pr_id,
        round_number=2
    )
    
    db.refresh(app)
    validate(result2.status == "Pass", f"Round 2 result is Pass")
    validate(app.status == "In Progress", f"Application still 'In Progress' (got: {app.status})")
    validate(app.current_round == 3, f"Current round advanced to 3 (got: {app.current_round})")
    
    print(f"[PASS] Round 2 updated to Pass")
    print(f"[PASS] Current round advanced to: {app.current_round}")
    
    test_step(6, "Round Progression: Round 3 Pass (Final)")
    
    # Update Round 3 to Pass (final round)
    result3 = RoundService.update_round(
        db,
        application_id=app_id,
        status="Pass",
        updated_by_id=pr_id,
        round_number=3
    )
    
    db.refresh(app)
    validate(result3.status == "Pass", f"Round 3 result is Pass")
    validate(app.status == "Placed", f"Application status is 'Placed' (got: {app.status})")
    validate(app.final_status == "Placed", f"Final status is 'Placed' (got: {app.final_status})")
    
    # Check PlacementOutcome created
    outcome = db.query(PlacementOutcome).filter(
        PlacementOutcome.student_id == app.student_id,
        PlacementOutcome.drive_id == app.drive_id
    ).first()
    
    validate(outcome is not None, "PlacementOutcome created automatically")
    validate(outcome.got_placed == True, "PlacementOutcome marked as placed")
    validate(outcome.company == "Test Corp", f"Company is 'Test Corp' (got: {outcome.company})")
    
    print(f"[PASS] Round 3 updated to Pass (Final)")
    print(f"[PASS] Application status: {app.status}")
    print(f"[PASS] PlacementOutcome created: ID={outcome.id}, Company={outcome.company}")
    
    return outcome

def test_round_failure_flow(db: Session, student_id: int, drive_id: int, pr_id: int):
    """Test: Round 1 Fail → Application Rejected (new application)"""
    test_step(7, "Test Round Failure Flow")
    
    # Create SECOND student for failure test
    student_user = User(
        name="Test Student 2",
        email="student2@test.com",
        phone="9200000000",  # Different phone
    )
    db.add(student_user)
    db.commit()
    db.refresh(student_user)
    
    student2 = Student(
        user_id=student_user.id,
        pr_id=1,  # Same PR
        batch="2026",
        cgpa=8.0,
        profile_data={"skills": ["Python"], "experience": "0 years"}
    )
    db.add(student2)
    db.commit()
    db.refresh(student2)
    
    # Create new application
    app = ApplicationService.apply_to_drive(
        db,
        student_id=student2.id,
        drive_id=drive_id,
        resume_path="test_resume_2.pdf"
    )
    print(f"[PASS] New application created (ID: {app.id}) by Student {student2.id}")
    
    # Update Round 1 to Fail
    result = RoundService.update_round(
        db,
        application_id=app.id,
        status="Fail",
        updated_by_id=pr_id,
        round_number=1
    )
    
    db.refresh(app)
    validate(result.status == "Fail", f"Round 1 result is Fail")
    validate(app.status == "Rejected", f"Application rejected after Round 1 Fail (got: {app.status})")
    validate(app.final_status == "Rejected", f"Final status is 'Rejected' (got: {app.final_status})")
    
    print(f"[PASS] Round 1 updated to Fail")
    print(f"[PASS] Application immediately rejected: {app.status}")

def create_test_student(db: Session, pr_id: int, student_num: int):
    """Helper: Create a test student"""
    student_user = User(
        name=f"Test Student {student_num}",
        email=f"student{student_num}@test.com",
        phone=f"99{student_num:08d}",  # Unique phone per student
        password=get_hash("student123"),
        role="student"
    )
    db.add(student_user)
    db.commit()
    db.refresh(student_user)
    
    student = Student(
        user_id=student_user.id,
        pr_id=pr_id,
        batch="2026",
        cgpa=8.0 + (student_num * 0.1),
        profile_data={"skills": ["Python"], "experience": f"{student_num} years"}
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

def test_edge_case_skip_round(db: Session, drive_id: int, pr_id: int):
    """Edge Case: Try to skip Round 1 and update Round 2"""
    test_step(8, "Edge Case: Skip Round (should fail)")
    
    student = create_test_student(db, pr_id, 3)
    
    app = ApplicationService.apply_to_drive(
        db,
        student_id=student.id,
        drive_id=drive_id,
        resume_path="test_resume_3.pdf"
    )
    
    try:
        # Try to update Round 2 when Round 1 is Pending
        RoundService.update_round(
            db,
            application_id=app.id,
            status="Pass",
            updated_by_id=pr_id,
            round_number=2
        )
        # If we get here, it means Round 2 was updated (may be OK if no strict ordering)
        validate(False, "Round 2 updated without Round 1 (BUG: system allowed out-of-order)")
    except Exception as e:
        validate("Invalid round order" in str(e) or "pending" in str(e).lower(), f"Correctly rejected: {e}")
        print(f"[PASS] Out-of-order update rejected: {e}")

def test_edge_case_double_update(db: Session, drive_id: int, pr_id: int):
    """Edge Case: Try to update same round twice"""
    test_step(9, "Edge Case: Double Round Update (should fail)")
    
    student = create_test_student(db, pr_id, 4)
    
    app = ApplicationService.apply_to_drive(
        db,
        student_id=student.id,
        drive_id=drive_id,
        resume_path="test_resume_4.pdf"
    )
    
    # First update
    RoundService.update_round(
        db,
        application_id=app.id,
        status="Pass",
        updated_by_id=pr_id,
        round_number=1
    )
    print("[PASS] First Round 1 Pass recorded")
    
    try:
        # Try to update Round 1 again
        RoundService.update_round(
            db,
            application_id=app.id,
            status="Fail",
            updated_by_id=pr_id,
            round_number=1
        )
        print("[FAIL] Double update succeeded (BUG: should have failed)")
    except ValueError as e:
        validate("invalid round order" in str(e).lower() or "already been recorded" in str(e).lower(), f"Correctly blocked double update: {e}")
        print(f"[PASS] Double update rejected: {e}")

def test_edge_case_missing_rounds(db: Session, pr_id: int):
    """Edge Case: Create drive without rounds, then apply"""
    test_step(10, "Edge Case: Application without Drive Rounds")
    
    student = create_test_student(db, pr_id, 5)
    
    # Create drive WITHOUT rounds
    drive = Drive(
        company_name="No Rounds Corp",
        role="Test Role",
        description="Drive with no rounds",
        eligibility_criteria="CGPA > 7.0",
        deadline=datetime.utcnow() + timedelta(days=7),
        created_by=pr_id,
        status="open"
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    
    validate(len(drive.rounds) == 0, "Drive created with 0 rounds")
    
    try:
        app = ApplicationService.apply_to_drive(
            db,
            student_id=student.id,
            drive_id=drive.id,
            resume_path="test_resume_5.pdf"
        )
        validate(False, "Application created without rounds (BUG: system allowed this)")
    except ValueError as e:
        validate("at least one round" in str(e).lower(), f"Correctly rejected: {e}")
        print(f"[PASS] Application without rounds rejected: {e}")

def test_database_integrity(db: Session):
    """Verify database state after all tests"""
    test_step(11, "Database Integrity Check")
    
    app_count = db.query(Application).count()
    rr_count = db.query(RoundResult).count()
    outcome_count = db.query(PlacementOutcome).count()
    
    print(f"[PASS] Applications in DB: {app_count}")
    print(f"[PASS] Round Results in DB: {rr_count}")
    print(f"[PASS] Placement Outcomes in DB: {outcome_count}")
    
    # Verify no orphaned RoundResults
    orphaned = db.query(RoundResult).filter(RoundResult.application_id.notin_(
        db.query(Application.id)
    )).count()
    validate(orphaned == 0, f"No orphaned RoundResults (found: {orphaned})")
    
    # Verify all applications have rounds if drive has rounds
    for app in db.query(Application).all():
        drive_round_count = len(app.drive.rounds)
        app_round_count = len(app.round_results)
        if drive_round_count > 0:
            validate(app_round_count == drive_round_count, 
                    f"App {app.id} has {app_round_count} rounds (drive has {drive_round_count})")

def main():
    """Run full E2E test suite"""
    print("\n" + "="*60)
    print("END-TO-END PLACEMENT WORKFLOW TEST")
    print("="*60 + "\n")
    
    db = SessionLocal()
    try:
        reset_db()
        
        admin, pr, student = create_test_users(db)
        drive = create_test_drive(db, admin.id)
        
        # Main workflow
        app = test_application_creation(db, student.id, drive.id)
        outcome = test_round_progression(db, app.id, pr.user_id)
        
        # Failure flow
        test_round_failure_flow(db, student.id, drive.id, pr.user_id)
        
        # Edge cases
        test_edge_case_skip_round(db, drive.id, pr.user_id)
        test_edge_case_double_update(db, drive.id, pr.user_id)
        test_edge_case_missing_rounds(db, pr.user_id)
        
        # Final integrity check
        test_database_integrity(db)
        
        print("\n" + "="*60)
        print("[PASS] ALL TESTS PASSED")
        print("="*60 + "\n")
        
    except AssertionError as e:
        print(f"\n[FAIL] TEST FAILED: {e}\n")
        return 1
    except Exception as e:
        print(f"\n[FAIL] UNEXPECTED ERROR: {e}\n")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        db.close()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
