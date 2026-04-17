import spacy
import pdfplumber
import docx
import os
import re
from ai_model.data.skills_data import ALL_SKILLS, SKILLS_DICTIONARY

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return text

def extract_text_from_docx(file_path):
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX {file_path}: {e}")
    return text

def parse_resume(file_path):
    """
    Parses a resume file and extracts technical skills and metadata.
    """
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    if ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif ext in ['.doc', '.docx']:
        text = extract_text_from_docx(file_path)
    else:
        # Fallback for plain text
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        except:
            pass

    if not text:
        return {"skills": [], "experience": "Unknown", "extracted_text": "Failed to extract text."}

    # Normalize text for skill matching
    clean_text = text.lower()
    
    # Identify skills from our "Hardcoded" Dictionary
    detected_skills = []
    for skill in ALL_SKILLS:
        # Use word boundaries to avoid partial matches (e.g. "Go" in "Google")
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, clean_text):
            detected_skills.append(skill.title())

    # Limit to unique skills
    detected_skills = sorted(list(set(detected_skills)))

    # Estimate experience (simple heuristic: look for year numbers or "experience" keywords)
    experience_match = re.search(r'(\d+)\+?\s*years?\s*experience', clean_text)
    experience_years = experience_match.group(1) if experience_match else "0"

    return {
        "skills": detected_skills,
        "experience": f"{experience_years} years",
        "extracted_text": text[:2000] + ("..." if len(text) > 2000 else "")
    }
