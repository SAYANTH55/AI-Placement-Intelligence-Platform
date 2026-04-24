import uuid
import re
from datetime import datetime
from data_ingestion.normalizer import normalize_experience, normalize_skills, normalize_text_fields

def extract_email(text: str) -> str:
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else ""

def extract_phone(text: str) -> str:
    match = re.search(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', text)
    return match.group(0) if match else ""

def extract_name(text: str) -> str:
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        for line in lines[:5]:
            if not re.search(r'\b(resume|curriculum vitae|cv|email|phone)\b', line, re.IGNORECASE):
                words = line.split()
                if 1 < len(words) <= 4:
                    return line.title()
    return ""

def build_student_profile(parsed_data: dict, source: str = "resume") -> dict:
    """
    Constructs a unified Student schema out of raw parsed elements.
    Includes V2 spec: Versioning, Flags, and Source Tracking.
    """
    raw_text = parsed_data.get("extracted_text", "")
    clean_text = normalize_text_fields(raw_text)
    
    extracted_email = extract_email(clean_text)
    extracted_phone = extract_phone(clean_text)
    extracted_name = extract_name(clean_text)

    # Normalize Experience
    exp_years = normalize_experience(parsed_data.get("experience", "0"))

    # Normalize Skills (now an array of objects)
    skills = normalize_skills(parsed_data.get("skills", []))

    # Calculate Data Quality Stub
    quality_score = 0
    issues = []
    
    if extracted_email: quality_score += 25
    else: issues.append("missing_email")
        
    if extracted_phone: quality_score += 15
    else: issues.append("missing_phone")
        
    if extracted_name: quality_score += 20
    else: issues.append("missing_name")
        
    if len(skills) >= 3: quality_score += 20
    elif len(skills) > 0: quality_score += 10
    else: issues.append("missing_skills")
        
    if exp_years > 0: quality_score += 20
    else: issues.append("missing_experience")

    return {
        "student_id": str(uuid.uuid4()),
        "source": source,
        "profile": {
            "name": extracted_name,
            "email": extracted_email,
            "phone": extracted_phone,
        },
        "skills": skills,
        "education": {
            "degree": "", 
            "branch": "Computer Science",
            "cgpa": parsed_data.get("metrics", {}).get("cgpa", None),
            "year": None
        },
        "experience": {
            "years": exp_years,
            "projects": [],
            "internships": []
        },
        "data_quality": {
            "score": round(quality_score / 100.0, 2),
            "issues": issues
        },
        "log": {
            "source": source,
            "status": "processed"
        },
        "flags": [],
        "activity_log": [],
        "metadata": {
            "version": 2,
            "history": [{"action": "created", "timestamp": datetime.utcnow().isoformat(), "source": source}],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "raw_text": raw_text
        }
    }
