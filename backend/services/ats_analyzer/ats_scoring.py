"""
ats_scoring.py
--------------
Engine 1: Standalone JOB MODE Benchmark

Evaluates the resume WITHOUT any job description.
Scores across 8 weighted dimensions, each with deterministic rule logic.

Weights:
  Structure            15 pts
  Skill Density        20 pts
  Experience Depth     15 pts
  Project Quality      15 pts
  Keyword Optimization 10 pts
  Education Quality    10 pts
  Achievements         10 pts
  Formatting            5 pts
  ─────────────────────────
  Total               100 pts
"""

import re
from typing import Dict, Any, List, Tuple
from .ats_models import ATSDimension, ATSBreakdown

# ── ATS Keyword Bank (200+ common ATS-indexed keywords) ──────────────────
_ATS_KEYWORDS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "golang", "rust",
    "kotlin", "swift", "ruby", "php", "scala", "r", "matlab", "dart", "bash", "shell", "powershell",
    # Web / Frontend
    "react", "nextjs", "vuejs", "angular", "html", "html5", "css", "css3", "tailwind", "tailwind css",
    "webpack", "vite", "redux", "redux toolkit", "graphql", "rest api", "restful api",
    "responsive design", "accessibility", "a11y", "bootstrap", "sass", "less", "websockets",
    # Backend & Microservices
    "fastapi", "django", "flask", "spring boot", "nodejs", "express", "nestjs",
    "sqlalchemy", "prisma", "hibernate", "microservices", "grpc", "celery", "rabbitmq", "activemq",
    # Databases & Caching
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
    "sqlite", "cassandra", "firebase", "supabase", "snowflake", "bigquery", "memcached", "neo4j",
    # Cloud & DevOps & CI/CD
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "ci/cd", "helm", "argocd", "prometheus", "grafana", "linux", "cloudformation",
    # ML / Data Science / MLOps
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "pandas", "numpy", "xgboost", "nlp", "computer vision", "mlops", "airflow",
    "spark", "pyspark", "kafka", "dbt", "tableau", "power bi", "hugging face", "bert", "llm", "opencv",
    # Software Engineering & QA
    "agile", "scrum", "jira", "git", "github", "gitlab", "unit testing", "tdd", "bdd", "code review",
    "system design", "distributed systems", "algorithms", "data structures", "jest", "pytest", "cypress", "playwright",
    # Certifications & Security
    "aws certified", "azure certified", "gcp certified", "pmp", "cissp", "ceh",
    "comptia", "tensorflow certified", "databricks certified", "ckad", "cka", "security+",
}

# Strong action verbs
_ACTION_VERBS = {
    "built", "developed", "designed", "implemented", "engineered", "architected",
    "optimised", "optimized", "improved", "increased", "reduced", "led", "managed",
    "deployed", "launched", "created", "automated", "integrated", "migrated",
    "scaled", "delivered", "achieved", "established", "streamlined", "contributed",
    "published", "researched", "mentored", "trained", "collaborated", "authored",
    "spearheaded", "formulated", "overhauled", "championed", "orchestrated",
}

# Passive / weak verbs to penalise
_PASSIVE_VERBS = {
    "responsible for", "worked on", "helped with", "assisted", "participated in",
    "involved in", "tasked with", "was part of", "contributed to general",
    "helped in", "tried to", "attempted", "assigned to",
}


def _label(score: int, max_score: int) -> str:
    pct = score / max_score if max_score else 0
    if pct >= 0.85:
        return "Excellent"
    if pct >= 0.65:
        return "Good"
    if pct >= 0.40:
        return "Fair"
    return "Poor"


def _dim(name: str, score: int, max_score: int, issues: List[str], strengths: List[str]) -> ATSDimension:
    return ATSDimension(
        name=name,
        score=max(0, min(score, max_score)),
        max_score=max_score,
        weight=max_score,
        label=_label(score, max_score),
        issues=issues,
        strengths=strengths,
    )


# ══════════════════════════════════════════════════════════════════════════════
# DIMENSION SCORERS
# ══════════════════════════════════════════════════════════════════════════════

def _score_structure(parsed: Dict[str, Any]) -> ATSDimension:
    """Max 15 — Checks for required, recommended, and bonus sections."""
    score = 15
    issues, strengths = [], []

    sections = parsed.get("sections", [])
    if isinstance(sections, dict):
        raw_sections = [str(k).lower() for k in sections.keys()]
    elif isinstance(sections, list):
        raw_sections = [str(s).lower() for s in sections]
    else:
        raw_sections = []
        
    raw_text = parsed.get("raw_text", "").lower()
    
    # Fallback if sections were not parsed correctly
    if not raw_sections:
        for sec in ["experience", "education", "skills", "projects", "summary"]:
            if f"{sec}" in raw_text:
                raw_sections.append(sec)

    required = {
        "experience": "Experience section is missing — critical for ATS.",
        "education": "Education section missing — required by most ATS.",
        "skills": "Skills section missing — primary ATS keyword target.",
    }
    recommended = {
        "summary": "Professional Summary missing — helps ATS role classification.",
        "projects": "Projects section missing — demonstrates applied skills.",
    }

    for sec, msg in required.items():
        if sec in raw_sections or f"{sec}\n" in raw_text or f"{sec}:" in raw_text:
            strengths.append(f"{sec.title()} section present")
        else:
            score -= 4
            issues.append(msg)

    for sec, msg in recommended.items():
        if sec in raw_sections or f"{sec}\n" in raw_text or f"{sec}:" in raw_text:
            strengths.append(f"{sec.title()} section present")
        else:
            score -= 1
            issues.append(msg)

    # Check contact information heuristic
    contact = parsed.get("contact", {})
    email = ""
    if isinstance(contact, dict):
        email = contact.get("email", "")
        
    if not email and re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text):
        email = "found_in_text"
        
    if not email:
        score -= 1
        issues.append("Email address not detected — ensure contact info is ATS-readable.")
    else:
        strengths.append("Contact information (email) present")

    return _dim("Structure & Parseability", score, 15, issues, strengths)


def _score_skill_density(parsed: Dict[str, Any]) -> ATSDimension:
    """Max 20 — Based on number of detected skills relative to ATS expectations."""
    raw_skills = parsed.get("skills", [])
    skills = []
    if isinstance(raw_skills, list):
        for s in raw_skills:
            if isinstance(s, dict) and "name" in s:
                skills.append(s["name"])
            elif isinstance(s, str):
                skills.append(s)
                
    n = len(skills)
    issues, strengths = [], []

    # Scoring curve: 15+ skills = full marks; <5 = near zero
    if n >= 15:
        score = 20
        strengths.append(f"Strong skill profile: {n} skills detected")
    elif n >= 10:
        score = 16
        strengths.append(f"{n} skills detected — good variety")
    elif n >= 6:
        score = 11
        issues.append(f"Only {n} skills detected. Aim for 12-18 to maximise ATS indexing.")
    elif n >= 3:
        score = 6
        issues.append(f"Very few skills detected ({n}). Add more specific tools and technologies.")
    else:
        score = 2
        issues.append("Almost no skills detected. A dedicated skills section is critical for ATS.")

    # Check skill diversity (categories)
    skills_lower = set(s.lower() for s in skills)
    has_lang = any(k in skills_lower for k in {"python", "java", "javascript", "typescript", "golang", "c++"})
    has_tool = any(k in skills_lower for k in {"docker", "kubernetes", "git", "aws", "terraform"})
    has_data = any(k in skills_lower for k in {"sql", "postgresql", "mongodb", "mysql", "redis"})

    if has_lang and has_tool and has_data:
        strengths.append("Good skill diversity across languages, tools, and data technologies")
    elif not has_lang:
        score = max(0, score - 2)
        issues.append("No programming languages detected — a key ATS signal.")

    return _dim("Skill Density", score, 20, issues, strengths)


def _score_experience_depth(parsed: Dict[str, Any]) -> ATSDimension:
    """Max 15 — Looks for internships, research, leadership, years, volunteering."""
    score = 0
    issues, strengths = [], []
    raw = parsed.get("raw_text", "").lower()

    exp_data = parsed.get("experience", {})
    years = 0
    
    if isinstance(exp_data, str):
        match = re.search(r'(\d+)', exp_data)
        if match:
            years = int(match.group(1))
    elif isinstance(exp_data, dict):
        years = exp_data.get("years", 0)
        
    if years == 0:
        match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', raw)
        if match:
            years = int(match.group(1))
            
    if years == 0 and "present" in raw and re.search(r'20\d{2}', raw):
        # Rough heuristic if years aren't cleanly found but "present" is used with a 20XX year
        years = 2

    # Base years score (cap at 8)
    if years >= 5:
        score += 8
        strengths.append(f"{years}+ years of professional experience")
    elif years >= 2:
        score += 5
        strengths.append(f"{years} years of experience")
    elif years >= 1:
        score += 3
        strengths.append(f"{years} year(s) of experience")
    else:
        issues.append("No clear work experience duration detected. Quantify experience in years.")

    # Internship / research / freelance
    experience_signals = {
        "internship": ("Internship experience detected", 2),
        "research": ("Research experience detected", 2),
        "freelance": ("Freelance work detected", 1),
        "volunteer": ("Volunteer/community work detected", 1),
        "hackathon": ("Hackathon participation detected", 1),
        "open source": ("Open source contributions detected", 2),
    }
    for keyword, (msg, pts) in experience_signals.items():
        if keyword in raw:
            score += pts
            strengths.append(msg)

    # Leadership signals
    leadership = ["led", "managed", "supervised", "mentored", "coordinated", "founded"]
    if any(kw in raw for kw in leadership):
        score += 2
        strengths.append("Leadership signals detected")
    else:
        issues.append("No leadership keywords found. Add roles where you led or mentored.")

    if score == 0:
        issues.append("Experience section appears thin or non-parseable.")

    return _dim("Experience Depth", min(score, 15), 15, issues, strengths)


def _score_project_quality(parsed: Dict[str, Any]) -> ATSDimension:
    """Max 15 — Evaluates projects for GitHub links, metrics, tech stack, deployment."""
    raw = parsed.get("raw_text", "").lower()
    projects = parsed.get("projects", [])
    score = 0
    issues, strengths = [], []

    n_projects = len(projects) if isinstance(projects, list) else 0
    
    # Fallback to checking raw text for project indicators if empty
    if n_projects == 0 and "project" in raw:
        # Count occurrences of bullet points followed by common project keywords
        n_projects = raw.count("project") // 2
        if n_projects == 0:
            n_projects = 1

    # Base project count
    if n_projects >= 4:
        score += 5
        strengths.append(f"{n_projects}+ projects detected")
    elif n_projects >= 2:
        score += 3
        strengths.append(f"{n_projects} projects detected")
    elif n_projects == 1:
        score += 1
        issues.append("Only 1 project detected. Aim for 3-5 well-described projects.")
    else:
        issues.append("No projects detected. A Projects section significantly boosts ATS ranking.")

    # GitHub presence
    if "github.com" in raw or "github" in raw:
        score += 3
        strengths.append("GitHub profile/links detected")
    else:
        issues.append("No GitHub link found. Add github.com/yourusername to your projects.")

    # Deployment / live products
    deploy_signals = ["deployed", "production", "live at", "vercel", "heroku", "aws", "railway", "netlify", "render"]
    if any(s in raw for s in deploy_signals):
        score += 2
        strengths.append("Deployed/production projects detected")
    else:
        issues.append("No deployment evidence found. Mention live URLs or hosting platforms.")

    # Metrics / user evidence
    metrics_pattern = re.compile(r'\b\d+[k+]?\s*(users|stars|downloads|requests|clients|contributions)\b')
    if metrics_pattern.search(raw):
        score += 3
        strengths.append("Project impact metrics detected (users/stars/etc.)")
    else:
        issues.append("No project impact metrics found. Add user counts, stars, or downloads.")

    # Tech stack breadth in projects
    tech_stack_words = {"api", "database", "frontend", "backend", "ml", "ai", "cloud", "docker", "microservic"}
    if sum(1 for t in tech_stack_words if t in raw) >= 3:
        score += 2
        strengths.append("Good technical breadth in project descriptions")

    return _dim("Project Quality", min(score, 15), 15, issues, strengths)


def _score_keywords(parsed: Dict[str, Any], raw_text: str) -> ATSDimension:
    """Max 10 — Matches resume text against ATS keyword bank."""
    score = 0
    issues, strengths = [], []
    text_lower = raw_text.lower()

    found = [kw for kw in _ATS_KEYWORDS if kw in text_lower]
    n_found = len(found)

    if n_found >= 20:
        score = 10
        strengths.append(f"Excellent ATS keyword density: {n_found} keywords indexed")
    elif n_found >= 12:
        score = 8
        strengths.append(f"Good ATS keyword coverage: {n_found} keywords")
    elif n_found >= 6:
        score = 5
        issues.append(f"Moderate keyword coverage ({n_found}). Add more tool/tech names.")
    elif n_found >= 2:
        score = 3
        issues.append(f"Low keyword density ({n_found} ATS keywords). Resume may be filtered out early.")
    else:
        score = 1
        issues.append("Very few ATS keywords found. Ensure tool names are explicitly spelled out.")

    # Check for passive verbs
    passive_found = [p for p in _PASSIVE_VERBS if p in text_lower]
    if passive_found:
        score = max(0, score - 2)
        issues.append(f"Passive language detected ({passive_found[0]!r}). Use strong action verbs.")
    elif any(v in text_lower for v in _ACTION_VERBS):
        strengths.append("Strong action verbs detected")

    return _dim("Keyword Optimization", score, 10, issues, strengths)


def _score_education(parsed: Dict[str, Any], raw_text: str) -> ATSDimension:
    """Max 10 — Checks degree, CGPA/GPA, relevant coursework."""
    score = 0
    issues, strengths = [], []
    raw = raw_text.lower()
    edu = parsed.get("education", {})

    has_edu = bool(edu) or "university" in raw or "college" in raw or "bachelor" in raw or "master" in raw

    if has_edu:
        score += 4
        strengths.append("Education section detected")

    # Degree level
    if any(w in raw for w in ["phd", "doctorate", "ph.d"]):
        score += 4
        strengths.append("PhD / Doctorate degree")
    elif any(w in raw for w in ["master", "mba", "m.tech", "msc", "m.s"]):
        score += 3
        strengths.append("Master's degree")
    elif any(w in raw for w in ["bachelor", "b.tech", "b.e", "b.sc", "b.s", "degree"]):
        score += 2
        strengths.append("Bachelor's degree")
    elif any(w in raw for w in ["diploma", "associate"]):
        score += 1
        issues.append("Diploma/Associate qualification detected. Consider further education for some roles.")

    # GPA / CGPA
    gpa_pattern = re.compile(r'\b(gpa|cgpa|grade)\s*[:\-]?\s*(\d+\.\d+)', re.IGNORECASE)
    if gpa_pattern.search(raw_text):
        score += 2
        strengths.append("GPA/CGPA found — helps academic ATS filters")
    else:
        issues.append("No GPA/CGPA found. Include if 3.5+ (or equivalent) for competitive roles.")

    # Relevant coursework / certifications in education
    if any(w in raw for w in ["coursework", "relevant courses", "certified", "certification"]):
        score = min(score + 1, 10)
        strengths.append("Coursework or certifications found")

    if not has_edu:
        issues.append("Education section not detected. This is critical for ATS filtering.")

    return _dim("Education Quality", min(score, 10), 10, issues, strengths)


def _score_achievements(raw_text: str) -> ATSDimension:
    """Max 10 — Looks for quantified achievements, numbers, %, $, impact words."""
    score = 0
    issues, strengths = [], []

    # Pattern: numbers with context (percentage, dollar, K, M, units)
    quant_pattern = re.compile(
        r'(\d+\s*%|\$\s*\d+|\d+\s*[kKmM]\+?|\d+x\b|\b\d+\s+(?:users|clients|projects|systems|teams|reports|papers))',
        re.IGNORECASE
    )
    matches = quant_pattern.findall(raw_text)
    n_quantified = len(matches)

    if n_quantified >= 8:
        score = 10
        strengths.append(f"Excellent quantification: {n_quantified} measurable achievements found")
    elif n_quantified >= 5:
        score = 8
        strengths.append(f"{n_quantified} quantified achievements found")
    elif n_quantified >= 3:
        score = 6
        issues.append(f"Only {n_quantified} quantified achievements. Add more numbers to bullet points.")
    elif n_quantified >= 1:
        score = 4
        issues.append(f"Very few quantified achievements ({n_quantified}). ATS and recruiters reward numbers.")
    else:
        score = 1
        issues.append("No measurable achievements detected. Use numbers, %, $, or user counts in every role.")

    # Impact words
    impact_words = ["improved", "increased", "reduced", "saved", "optimised", "optimized", "accelerated",
                    "grew", "generated", "delivered", "exceeded"]
    found_impact = [w for w in impact_words if w in raw_text.lower()]
    if len(found_impact) >= 3:
        strengths.append(f"Strong impact language: {', '.join(found_impact[:3])}")
    elif not found_impact:
        issues.append("No impact-oriented words found (e.g. improved, reduced, increased).")

    return _dim("Measurable Achievements", min(score, 10), 10, issues, strengths)


def _score_formatting(parsed: Dict[str, Any], raw_text: str) -> ATSDimension:
    """Max 5 — Length, consistency, absence of tables/images."""
    score = 5
    issues, strengths = [], []

    word_count = len(raw_text.split())
    char_count = len(raw_text)

    # Length check
    if word_count < 150:
        score -= 3
        issues.append("Resume is too short (< 150 words). ATS may not extract enough data.")
    elif word_count > 1200:
        score -= 1
        issues.append("Resume may be too long (> 1200 words). Keep to 1-2 pages.")
    else:
        strengths.append(f"Good resume length ({word_count} words)")

    # Bullet consistency (approximate: look for common bullet chars)
    bullet_chars = re.findall(r'^[\-\*\•\u2022\u25cf]', raw_text, re.MULTILINE)
    if len(bullet_chars) >= 5:
        strengths.append(f"Consistent bullet points detected ({len(bullet_chars)})")
    else:
        issues.append("Few bullet points detected. Use bullets for easy ATS parsing.")

    # Table/image heuristic (ASCII tables)
    if raw_text.count("|") > 8:
        score -= 1
        issues.append("Possible table detected. ATS often cannot parse table content — use plain text.")

    return _dim("Formatting & Readability", max(0, score), 5, issues, strengths)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN SCORER
# ══════════════════════════════════════════════════════════════════════════════

def score_resume(parsed_data: Dict[str, Any], raw_text: str) -> ATSBreakdown:
    """
    Run all 8 ATS dimension scorers and return the full ATSBreakdown.

    Args:
        parsed_data: Structured dict from the resume parser.
        raw_text:    Original resume text (for regex-based checks).

    Returns:
        ATSBreakdown with 8 fully scored ATSDimension objects.
    """
    # Inject raw_text into parsed_data so sub-scorers can access it
    parsed_data["raw_text"] = raw_text

    return ATSBreakdown(
        structure=_score_structure(parsed_data),
        skill_density=_score_skill_density(parsed_data),
        experience_depth=_score_experience_depth(parsed_data),
        project_quality=_score_project_quality(parsed_data),
        keyword_optimization=_score_keywords(parsed_data, raw_text),
        education_quality=_score_education(parsed_data, raw_text),
        achievements=_score_achievements(raw_text),
        formatting=_score_formatting(parsed_data, raw_text),
    )


def compute_total(breakdown: ATSBreakdown) -> int:
    """Sum all dimension scores into the final JOB MODE benchmark score."""
    return sum([
        breakdown.structure.score,
        breakdown.skill_density.score,
        breakdown.experience_depth.score,
        breakdown.project_quality.score,
        breakdown.keyword_optimization.score,
        breakdown.education_quality.score,
        breakdown.achievements.score,
        breakdown.formatting.score,
    ])


def score_to_grade(score: int) -> tuple:
    """Convert numeric JOB MODE score to (grade, description) tuple."""
    if score >= 82:
        return "Excellent", "Your resume is highly optimised for parsing systems. Most recruiters will see it."
    if score >= 65:
        return "Good", "Your resume passes most filters. A few targeted improvements will boost visibility."
    if score >= 45:
        return "Fair", "Your resume may be filtered out. Address the key issues below to improve ranking."
    return "Poor", "Your resume is likely being filtered. Significant improvements are needed."
