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

SECTIONS_KEYWORDS = {
    "skills": ["skills", "technologies", "technical skills", "tech stack", "expertise"],
    "projects": ["projects", "personal projects", "academic projects", "professional projects"],
    "experience": ["experience", "work experience", "professional experience", "employment history"],
    "education": ["education", "academic background", "qualifications"]
}

CONTEXT_MAP = {
    "scalable": "system_design",
    "distributed": "system_design",
    "microservices": "system_design",
    "api": "backend",
    "rest": "backend",
    "graphql": "backend",
    "database": "backend",
    "sql": "backend",
    "nosql": "backend",
    "dashboard": "frontend",
    "ui": "frontend",
    "ux": "frontend",
    "responsive": "frontend",
    "component": "frontend",
    "mobile": "mobile",
    "app": "mobile",
    "android": "mobile",
    "ios": "mobile",
    "cloud": "devops",
    "aws": "devops",
    "azure": "devops",
    "docker": "devops",
    "kubernetes": "devops",
    "ci/cd": "devops",
    "pipeline": "devops"
}

def split_sections(text: str) -> dict:
    """
    Splits resume text into logical sections based on keywords.
    """
    sections = {}
    current_section = "summary"
    lines = text.split('\n')
    
    current_content = []
    
    for line in lines:
        clean_line = line.strip().lower()
        if not clean_line:
            continue
            
        found_header = False
        for section, keywords in SECTIONS_KEYWORDS.items():
            if any(kw in clean_line for kw in keywords) and len(clean_line) < 30:
                # Save previous section
                sections[current_section] = "\n".join(current_content)
                # Reset for new section
                current_section = section
                current_content = []
                found_header = True
                break
        
        if not found_header:
            current_content.append(line)
            
    # Save last section
    sections[current_section] = "\n".join(current_content)
    return sections

def extract_projects(sections: dict) -> list:
    """
    Identifies projects and extracts tech stack and context.
    """
    project_text = sections.get("projects", "") + "\n" + sections.get("summary", "")
    if not project_text.strip():
        return []
        
    projects = []
    # Split by common project markers (bullets, newlines with bold-like names)
    potential_projects = re.split(r'\n(?=[A-Z][\w\s]{2,20}(?:\n|:))', project_text)
    
    for p_block in potential_projects:
        if len(p_block.strip()) < 20: continue
        
        lines = p_block.strip().split('\n')
        name = lines[0].strip()
        description = "\n".join(lines[1:])
        
        # Extract tech stack for this specific project
        project_skills_raw = extract_skills_with_fuzzy_matching(p_block)
        project_skills = [s["name"] for s in project_skills_raw]
        
        # Determine context
        contexts = []
        for kw, ctx in CONTEXT_MAP.items():
            if kw in p_block.lower():
                contexts.append(ctx)
        
        projects.append({
            "name": name,
            "description": description[:200],
            "skills": project_skills,
            "contexts": list(set(contexts)),
            "complexity": "medium" if len(project_skills) > 3 else "basic"
        })
        
    return projects

def extract_skills_with_fuzzy_matching(text: str, SKILL_DICT: list = None, section_context: str = "general") -> list:
    """
    ✅ ENHANCED (PHASE 1): Context-aware skill extraction with weights.
    """
    if SKILL_DICT is None:
        SKILL_DICT = ALL_SKILLS
    
    detected_skills = []
    text_lower = text.lower()
    
    words = re.findall(r'\b[\w\.\+\#]+\b', text_lower)
    phrases = re.findall(r'\b[\w\.\+\#]+[\s][\w\.\+\#]+(?:[\s][\w\.\+\#]+)?\b', text_lower)
    candidates = words + phrases
    
    for candidate in candidates:
        if candidate in SKILL_DICT:
            skill_name = candidate.title()
            # Determine weight based on section
            weight = 1.0
            if section_context == "projects": weight = 1.5
            elif section_context == "experience": weight = 1.3
            elif section_context == "skills": weight = 0.8 # Just listing it is lower signal
            
            detected_skills.append({
                "name": skill_name, 
                "confidence": 1.0, 
                "source": "resume",
                "weight": weight,
                "context_section": section_context
            })
            continue
        
        for skill in SKILL_DICT:
            if fuzzy_match_skill(candidate, skill, threshold=0.80):
                canonical = normalize_skill(candidate)
                for category, skills_list in SKILLS_DICTIONARY.items():
                    for official_skill in skills_list:
                        if normalize_skill(official_skill) == canonical:
                            weight = 0.85
                            if section_context == "projects": weight = 1.2
                            
                            detected_skills.append({
                                "name": official_skill, 
                                "confidence": 0.85, 
                                "source": "resume",
                                "weight": weight,
                                "context_section": section_context
                            })
                            break
                break
    
    seen = {}
    unique_skills = []
    for s_obj in detected_skills:
        skill_norm = normalize_skill(s_obj["name"])
        if skill_norm not in seen:
            seen[skill_norm] = s_obj
            unique_skills.append(s_obj)
        else:
            # If we see same skill in better context, upgrade it
            if s_obj["weight"] > seen[skill_norm]["weight"]:
                seen[skill_norm]["weight"] = s_obj["weight"]
                seen[skill_norm]["context_section"] = s_obj["context_section"]
    
    return unique_skills

def parse_resume(file_path):
    """
    ✅ ENHANCED (PHASE 1): Context-aware parser with section splitting and project extraction.
    """
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    if ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif ext in ['.doc', '.docx']:
        text = extract_text_from_docx(file_path)
    else:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        except:
            pass

    if not text:
        return {"skills": [], "experience": "Unknown", "projects": [], "extracted_text": "Failed to extract text."}

    # Phase 1: Section Splitting
    sections = split_sections(text)
    
    # Phase 1: Context-Aware Skill Extraction
    all_detected_skills = []
    for sec_name, sec_text in sections.items():
        sec_skills = extract_skills_with_fuzzy_matching(sec_text, section_context=sec_name)
        all_detected_skills.extend(sec_skills)
        
    # Deduplicate and keep highest weight
    seen = {}
    final_skills = []
    for s in all_detected_skills:
        name = normalize_skill(s["name"])
        if name not in seen or s["weight"] > seen[name]["weight"]:
            seen[name] = s
            
    final_skills = list(seen.values())

    # Phase 1: Project Extraction
    projects = extract_projects(sections)

    # Estimate experience
    experience_years = extract_experience_years(text)

    return {
        "skills": final_skills,
        "experience": f"{experience_years} years",
        "projects": projects,
        "sections": list(sections.keys()),
        "extracted_text": text[:2000] + ("..." if len(text) > 2000 else "")
    }

def extract_experience_years(text: str) -> str:
    """
    FIX 5: Better experience extraction using multiple patterns
    """
    text_lower = text.lower()
    match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', text_lower)
    if match:
        return match.group(1)
    
    match = re.search(r'since\s+(\d{4})', text_lower)
    if match:
        year = int(match.group(1))
        current_year = 2026
        experience = current_year - year
        if 0 < experience < 70:
            return str(experience)
    
    match = re.search(r'(?:working|employed)\s+for\s+(\d+)\s+(?:years?|yrs?)', text_lower)
    if match:
        return match.group(1)
    
    job_keywords = re.findall(r'\b(?:developer|engineer|analyst|manager|specialist|lead|senior|junior|associate)\b', text_lower)
    if len(job_keywords) >= 3:
        return "5"
    
    return "0"

