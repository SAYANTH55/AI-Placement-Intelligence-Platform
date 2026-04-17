import spacy
import pdfplumber
import docx
import os
import re
from ai_model.data.skills_data import ALL_SKILLS, SKILLS_DICTIONARY
from ai_model.utils.skill_normalizer import normalize_skill, fuzzy_match_skill

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

def extract_skills_with_fuzzy_matching(text: str, SKILL_DICT: list = None) -> list:
    """
    ✅ IMPROVED (FIX 2): Extract skills using fuzzy matching
    
    Instead of exact regex matching, this:
    1. Splits text into words/phrases
    2. Attempts fuzzy match against skill dictionary
    3. Returns canonical skill name if high-confidence match
    
    This catches: "ReactJS" → "React", "PostgreSQL" → "SQL", etc.
    """
    if SKILL_DICT is None:
        SKILL_DICT = ALL_SKILLS
    
    detected_skills = []
    text_lower = text.lower()
    
    # Split into words and phrases (2-3 word combinations)
    words = re.findall(r'\b[\w\.\+\#]+\b', text_lower)
    phrases = re.findall(r'\b[\w\.\+\#]+[\s][\w\.\+\#]+(?:[\s][\w\.\+\#]+)?\b', text_lower)
    
    candidates = words + phrases
    
    for candidate in candidates:
        # Exact match first (fast path)
        if candidate in SKILL_DICT:
            detected_skills.append(candidate.title())
            continue
        
        # Fuzzy match against all skills (threshold=0.80 for extraction, slightly lower)
        for skill in SKILL_DICT:
            if fuzzy_match_skill(candidate, skill, threshold=0.80):
                # Normalize to canonical form
                canonical = normalize_skill(candidate)
                # Map back to proper title case from SKILLS_DICTIONARY
                for category, skills_list in SKILLS_DICTIONARY.items():
                    for official_skill in skills_list:
                        if normalize_skill(official_skill) == canonical:
                            detected_skills.append(official_skill)
                            break
                break
    
    # Limit to unique skills (preserve order of first occurrence)
    seen = set()
    unique_skills = []
    for skill in detected_skills:
        skill_norm = normalize_skill(skill)
        if skill_norm not in seen:
            seen.add(skill_norm)
            unique_skills.append(skill)
    
    return unique_skills


def parse_resume(file_path):
    """
    ✅ IMPROVED (FIX 2 & 5): Parses resume with fuzzy skill matching and better date extraction
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

    # Extract skills using fuzzy matching (FIX 2)
    detected_skills = extract_skills_with_fuzzy_matching(text)

    # Estimate experience (FIX 5: Better patterns)
    experience_years = extract_experience_years(text)

    return {
        "skills": detected_skills,
        "experience": f"{experience_years} years",
        "extracted_text": text[:2000] + ("..." if len(text) > 2000 else "")
    }


def extract_experience_years(text: str) -> str:
    """
    FIX 5: Better experience extraction using multiple patterns
    
    Catches: "5 years", "5+ years", "5yrs", "Since 2020", etc.
    """
    text_lower = text.lower()
    
    # Pattern 1: Explicit "N years" pattern
    match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', text_lower)
    if match:
        return match.group(1)
    
    # Pattern 2: "Since YYYY" pattern
    match = re.search(r'since\s+(\d{4})', text_lower)
    if match:
        year = int(match.group(1))
        current_year = 2026
        experience = current_year - year
        if 0 < experience < 70:  # Sanity check
            return str(experience)
    
    # Pattern 3: "Currently working for N years"
    match = re.search(r'(?:working|employed)\s+for\s+(\d+)\s+(?:years?|yrs?)', text_lower)
    if match:
        return match.group(1)
    
    # Pattern 4: Multiple jobs listed (rough estimate)
    job_keywords = re.findall(r'\b(?:developer|engineer|analyst|manager|specialist|lead|senior|junior|associate)\b', text_lower)
    if len(job_keywords) >= 3:
        # Rough heuristic: 3+ job titles = likely 5+ years
        return "5"
    
    # Default
    return "0"

