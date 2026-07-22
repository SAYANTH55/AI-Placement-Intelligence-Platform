import os
import sys
from datetime import datetime, timedelta

# Add parent to path to support model imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from database.db import SessionLocal, engine
from database.models import Base, User, Student, PR, Drive, Round, Application, RoundResult, PlacementOutcome, PlacementNotification, Department, Company
from api.auth import pwd_context

def get_hash(pwd):
    return pwd_context.hash(pwd)

def seed(force=False):
    # Always ensure tables exist
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    existing_users = db.query(User).count()
    if existing_users > 0 and not force:
        print(f"Database already has {existing_users} user(s). Skipping seed.")
        print("Run with force=True to wipe and reseed.")
        db.close()
        return

    print("Resetting database...")
    db.close()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Create Admin
        admin = User(
            name="Platform Admin",
            email="admin@university.edu",
            password=get_hash("adminpassword"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("Created Admin: admin@university.edu")

        # 1.5 Create Departments
        mca_dept = Department(name="MCA Wing", level="PG")
        ai_dept = Department(name="MSc AI/ML Wing", level="PG")
        db.add_all([mca_dept, ai_dept])
        db.commit()
        db.refresh(mca_dept)
        db.refresh(ai_dept)
        print("Created Departments: MCA, MSc AI/ML")

        # 2. Create PRs
        prs = []
        for i in range(1, 3):
            pr_user = User(
                name=f"Placement Officer {i}",
                email=f"pr{i}@university.edu",
                password=get_hash("prpassword"),
                role="pr",
                department_id=mca_dept.id if i == 1 else ai_dept.id
            )
            db.add(pr_user)
            db.commit()
            db.refresh(pr_user)
            
            pr_profile = PR(user_id=pr_user.id, batch="2026")
            db.add(pr_profile)
            db.commit()
            db.refresh(pr_profile)
            prs.append(pr_profile)
        print(f"Created {len(prs)} Placement Officers.")

        # 3. Create Students
        students = []
        batches = ["2026", "2025"]
        for i in range(1, 16):
            batch = batches[i % 2]
            user = User(
                name=f"Demo Student {i}",
                email=f"student{i}@test.com",
                password=get_hash("studentpassword"),
                role="student",
                course="MCA" if i <= 10 else "MSAIM",
                department_id=mca_dept.id if i <= 10 else ai_dept.id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Assign first 8 to PR1, rest to PR2
            target_pr = prs[0] if i <= 8 else prs[1]
            
            student = Student(
                user_id=user.id,
                pr_id=target_pr.id,
                batch=batch,
                cgpa=7.0 + (i % 3),
                profile_data={
                    "skills": ["Python", "SQL", "Communication"] if i % 2 == 0 else ["Java", "C++", "DSA"],
                    "experience": f"{i%2} years intern"
                }
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            students.append(student)
        print(f"Created {len(students)} Students and assigned to PRs.")

        # 4. Create Drives
        drives = []
        companies = ["Google", "Amazon", "Microsoft", "TCS", "Infosys"]
        roles = ["Software Engineer", "Data Analyst", "Systems Engineer"]
        descriptions = [
            "Join our core infrastructure team building planetary-scale distributed systems in Python and Go.",
            "Drive business insights by analyzing petabytes of customer transaction data and developing ML models.",
            "Build scalable microservices for Azure cloud enterprise customers using modern .NET and Java stacks.",
            "Kickstart your career as a system engineer handling IT infrastructure and global network operations.",
            "Work on our next-generation digital consulting platforms focused on AI transformation for clients."
        ]
        
        for i, company in enumerate(companies):
            drive = Drive(
                company_name=company,
                role=roles[i % len(roles)],
                description=descriptions[i],
                job_description=f"We are looking for a {roles[i % len(roles)]} with expertise in {'Python, SQL' if i % 2 == 0 else 'Java, Cloud'}.",
                eligibility_criteria="CGPA > 7.5",
                ctc=f"{8 + i} LPA",
                course="ALL" if i < 2 else ("MCA" if i == 2 else "MSAIM"),
                created_by=admin.id,
                deadline=datetime.now() + timedelta(days=7 + i*3),
                status="open" if i < 3 else "closed",
                department_id=mca_dept.id if i == 2 else (ai_dept.id if i == 3 else None)
            )
            db.add(drive)
            db.commit()
            db.refresh(drive)
            drives.append(drive)
            
            # Add Rounds
            for r_num in range(1, 4):
                rnd = Round(drive_id=drive.id, round_number=r_num, round_name=f"Round {r_num}")
                db.add(rnd)
        db.commit()
        print(f"Created {len(drives)} Placement Drives.")

        # 5. Create Applications for top 10 students
        for i in range(10):
            s = students[i]
            d = drives[i % 3]  # Apply to open drives
            application_status = "Applied" if i > 3 else "Placed"
            app = Application(
                student_id=s.id,
                drive_id=d.id,
                status=application_status,
                final_status=application_status if application_status == "Placed" else None
            )
            db.add(app)
            db.flush()

            for drive_round in d.rounds:
                result_status = "Pending"
                if i <= 3 and drive_round.round_number == len(d.rounds):
                    result_status = "Pass"
                elif i <= 3:
                    result_status = "Pass"
                elif i > 3 and drive_round.round_number == 1:
                    result_status = "Pending"
                round_result = RoundResult(
                    application_id=app.id,
                    round_id=drive_round.id,
                    status=result_status
                )
                db.add(round_result)

            if i <= 3:  # Mock some placements
                outcome = PlacementOutcome(
                    user_id=s.user_id,
                    student_id=s.id,
                    drive_id=d.id,
                    got_placed=True,
                    company=d.company_name,
                    role=d.role,
                    package=12.5 + i
                )
                db.add(outcome)
        db.commit()
        print("Seeded Applications and Outcomes.")

        print("\n" + "="*40)
        print("SEEDING COMPLETE")
        print(f"Admin: admin@university.edu / adminpassword")
        print(f"PR: pr1@university.edu / prpassword")
        print(f"Student: student1@test.com / studentpassword")
        print("="*40)

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
