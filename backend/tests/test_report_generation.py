import os
import sys
import pytest
import time

# Ensure backend directory is in the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from database.db import SessionLocal, engine
from database.models import Base, User, Student, ResumeAnalysis, GeneratedReport
from reports.dossier_builder import generate_dossier
from api.auth import pwd_context
from main import app
import asyncio

client = TestClient(app)

def get_hash(pwd):
    return pwd_context.hash(pwd)

def safe_unlink(path):
    if not path or not os.path.exists(path):
        return
    for i in range(5):
        try:
            os.unlink(path)
            return
        except PermissionError:
            time.sleep(0.5)
    # If it still fails, ignore so it doesn't block the test
    print(f"Warning: Could not delete temp file {path} due to permission lock.")

@pytest.fixture(scope="module")
def db():
    # Reset database structure
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def test_user(db: Session):
    user = User(
        name="John Report Tester",
        email="reporter@test.com",
        phone="9876543210",
        password=get_hash("reportpass"),
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    student = Student(
        user_id=user.id,
        batch="2026",
        cgpa=9.0,
        profile_data={"skills": ["Python", "React"], "experience": "1 year"}
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return user

def test_generate_dossier_builder_with_live_payload(db: Session, test_user: User):
    live_payload = {
        "skills": ["Python", "React", "SQL", "Docker"],
        "jobRoles": [
            {"title": "Software Engineer", "match": 85, "present": ["Python", "SQL"], "missing": ["Docker"]},
            {"title": "Frontend Developer", "match": 70, "present": ["React"], "missing": []}
        ],
        "missing_skills": ["Docker"],
        "prediction": {
            "placement_probability": 0.85,
            "readiness": "High"
        },
        "detected_domain": "Information Technology",
        "domain_confidence": 0.9
    }

    # Generate dossier using the builder directly
    pdf_bytes, pdf_path, analysis_id, report_hash = asyncio.run(generate_dossier(
        user_id=test_user.id,
        db=db,
        live_payload=live_payload
    ))

    assert pdf_bytes is not None
    assert len(pdf_bytes) > 1000
    # PDF Magic bytes check
    assert pdf_bytes.startswith(b"%PDF-1.")
    if pdf_path:
        assert os.path.exists(pdf_path)
    assert analysis_id is None  # Since we used live payload
    assert report_hash is None

    # Clean up generated file
    safe_unlink(pdf_path)

def test_generate_dossier_builder_with_db_record(db: Session, test_user: User):
    # Seed a ResumeAnalysis record
    analysis = ResumeAnalysis(
        user_id=test_user.id,
        filename="resume.pdf",
        file_hash="dummy_hash_12345",
        extracted_skills=["Python", "React", "SQL"],
        experience_years=1,
        placement_probability=0.8,
        placement_readiness="High",
        top_matching_role="Software Engineer",
        top_role_match_percent=80,
        role_matches=[
            {"role": "Software Engineer", "match": 80, "present": ["Python", "SQL"], "missing": []}
        ],
        skill_gaps=["Docker"],
        detected_domain="Information Technology",
        domain_confidence=0.85
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Generate dossier
    pdf_bytes, pdf_path, analysis_id, report_hash = asyncio.run(generate_dossier(
        user_id=test_user.id,
        db=db
    ))

    assert pdf_bytes is not None
    assert pdf_bytes.startswith(b"%PDF-1.")
    assert pdf_path is not None
    assert os.path.exists(pdf_path)
    assert analysis_id == analysis.id
    assert report_hash is not None

    # Test cache reuse
    pdf_bytes_2, pdf_path_2, analysis_id_2, report_hash_2 = asyncio.run(generate_dossier(
        user_id=test_user.id,
        db=db,
        cached_pdf_path=pdf_path,
        cached_analysis_id=analysis_id
    ))

    assert pdf_path_2 == pdf_path
    assert analysis_id_2 == analysis_id
    assert pdf_bytes_2 == pdf_bytes

    # Clean up generated file
    safe_unlink(pdf_path)

def test_report_routes_endpoint_jwt_auth(db: Session, test_user: User):
    # 1. Login user to get JWT token using JSON body
    login_response = client.post("/auth/login", json={
        "email": test_user.email,
        "password": "reportpass"
    })
    assert login_response.status_code == 200
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test generate dossier endpoint with live payload
    live_payload = {
        "skills": ["Python", "React"],
        "jobRoles": [{"title": "Software Engineer", "match": 75, "present": ["Python"], "missing": []}],
        "missing_skills": [],
        "prediction": {"placement_probability": 0.75, "readiness": "Medium"},
        "detected_domain": "Information Technology",
        "domain_confidence": 0.8
    }

    # First clean any previous cached reports in DB
    db.query(GeneratedReport).filter(GeneratedReport.user_id == test_user.id).delete()
    db.commit()

    response = client.post(
        "/reports/generate-dossier",
        json={"live_payload": live_payload},
        headers=headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
    assert response.content.startswith(b"%PDF-1.")

    # 3. Test dossier status endpoint
    status_response = client.get("/reports/dossier-status", headers=headers)
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["has_analysis"] is True  # We seeded one in test_generate_dossier_builder_with_db_record
    assert status_data["report_cached"] is True
