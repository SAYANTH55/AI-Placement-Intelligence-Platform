"""
ats_recommendations.py
----------------------
Engine 3: Actionable Resume Fixes (Rule-Based Resume Rule Engine)

Each rule is deterministic — no LLM guessing.
Every fix includes: title, category, evidence, why_it_matters,
recommended_fix, estimated_improvement, and priority.

Rules are evaluated in order; the highest-impact fixes are surfaced first.
"""

import re
from typing import List, Dict, Any
from .ats_models import ATSBreakdown, ResumeFix, ATSDimension

# ── Rule definitions ────────────────────────────────────────────────────────
#
# Each rule is a function that takes (parsed_data, raw_text, breakdown)
# and returns a ResumeFix or None.

def _rule_no_quantified_achievements(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: Missing measurable achievements."""
    if bd.achievements.score >= 5:
        return None
    quant_pattern = re.compile(
        r'(\d+\s*%|\$\s*\d+|\d+\s*[kKmM]\+?|\d+x|\b\d+\s+(?:users|clients|projects|systems|teams|requests|queries|seconds|minutes|hours|days|months)|(?:reduced|increased|improved|decreased|optimized)\s+(?:by|to)?\s*\d+)',
        re.IGNORECASE
    )
    found = quant_pattern.findall(raw)
    n = len(found)
    if n >= 2:
        return None

    return ResumeFix(
        title="Weak Achievement Statements",
        category="Achievements",
        evidence=f"Only {n} measurable data point(s) found in resume text.",
        why_it_matters="Recruiters spend 7 seconds on a resume. Quantified results (e.g. '40% faster', '10k users') are the primary differentiator scoring systems and human reviewers both reward.",
        recommended_fix="Add at least one measurable result to every role bullet point. Use numbers, percentages, dollar amounts, or user/team counts. E.g. 'Improved API response time by 35%' or 'Served 12,000+ monthly users'.",
        estimated_improvement="+8 JOB MODE",
        priority="HIGH",
    )


def _rule_passive_language(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: Passive / weak action verbs detected."""
    passive_phrases = [
        "responsible for", "worked on", "helped with", "assisted",
        "participated in", "involved in", "tasked with", "was part of",
    ]
    found = [p for p in passive_phrases if p in raw.lower()]
    if not found:
        return None

    return ResumeFix(
        title="Passive Language Detected",
        category="Language & Style",
        evidence=f"Passive phrase(s) found: {', '.join(repr(f) for f in found[:3])}.",
        why_it_matters="Passive voice makes contributions sound vague and low-impact. Systems rank resumes with strong action verbs higher, and recruiters skip bullet points that don't open with an active verb.",
        recommended_fix=f"Replace '{found[0]}' with a strong action verb: Built, Engineered, Led, Designed, Implemented, Optimised, Delivered, Automated, Architected.",
        estimated_improvement="+5 JOB MODE",
        priority="HIGH",
    )


def _rule_missing_github(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: No GitHub/Portfolio link found."""
    if bd.project_quality.score >= 8:
        return None
    raw_lower = raw.lower()
    if "github.com" in raw_lower or "gitlab.com" in raw_lower or "portfolio" in raw_lower or "bitbucket" in raw_lower:
        return None

    return ResumeFix(
        title="No GitHub or Portfolio Link",
        category="Portfolio",
        evidence="No github.com or portfolio URL detected in the resume.",
        why_it_matters="For technical roles, a GitHub profile is used by 78% of hiring managers to validate skills. Resumes without a portfolio link are often deprioritised even with strong skills listed.",
        recommended_fix="Add your GitHub profile URL (github.com/yourusername) in the header and reference specific repositories in your project descriptions with direct links.",
        estimated_improvement="+6 JOB MODE",
        priority="HIGH",
    )


def _rule_missing_summary(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: No professional summary/objective section."""
    sections = parsed.get("sections", [])
    if isinstance(sections, dict):
        raw_sections = [str(k).lower() for k in sections.keys()]
    elif isinstance(sections, list):
        raw_sections = [str(s).lower() for s in sections]
    else:
        raw_sections = []
        
    raw_lower = raw.lower()
    has_summary = (
        "summary" in raw_sections
        or "objective" in raw_sections
        or "profile" in raw_sections
        or "professional summary" in raw_lower[:600]
        or "career objective" in raw_lower[:600]
        or "summary" in raw_lower[:600]
        or "about me" in raw_lower[:600]
        or "overview" in raw_lower[:600]
        or "profile" in raw_lower[:600]
    )
    if has_summary:
        return None

    return ResumeFix(
        title="Professional Summary Missing",
        category="Structure",
        evidence="No Summary, Objective, or Profile section detected at the top of the resume.",
        why_it_matters="A 2-4 sentence professional summary at the top is the first thing both algorithms and recruiters read. It establishes role fit, seniority, and key value proposition immediately.",
        recommended_fix="Add a 2-3 sentence professional summary below your contact info. Include your current role/title, years of experience, top 2-3 skills, and your value proposition. Keep it keyword-dense.",
        estimated_improvement="+5 JOB MODE",
        priority="MEDIUM",
    )


def _rule_missing_certifications(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: No certifications mentioned."""
    raw_lower = raw.lower()
    cert_signals = [
        "certification", "certified", "certificate", "aws certified", "azure",
        "comptia", "pmp", "gcp", "google cloud", "scrum master", "cism", "cissp",
    ]
    if any(s in raw_lower for s in cert_signals):
        return None

    return ResumeFix(
        title="No Certifications Listed",
        category="Certifications",
        evidence="No certification or credential keywords detected in the resume.",
        why_it_matters="Certifications are a high-signal, objective quality indicator that algorithms rank strongly. Many JD filters require specific certifications, and unmatched resumes are automatically excluded.",
        recommended_fix="Add at least 1 relevant certification to a dedicated 'Certifications' section. Free options: Google Cloud (coursera), AWS Cloud Practitioner, Microsoft Azure Fundamentals, HackerRank certifications.",
        estimated_improvement="+4 JOB MODE",
        priority="MEDIUM",
    )


def _rule_missing_leadership(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: No leadership or mentoring signals."""
    if bd.experience_depth.score >= 12:
        return None
    leadership_words = ["led", "managed", "supervised", "mentored", "founded", "coordinated", "directed", "oversaw"]
    if any(w in raw.lower() for w in leadership_words):
        return None

    return ResumeFix(
        title="Leadership Experience Not Highlighted",
        category="Experience",
        evidence="No leadership or management keywords found (led, managed, mentored, coordinated).",
        why_it_matters="Leadership signals are critical for mid-to-senior roles. Even junior roles benefit from highlighting ownership — team leads and hiring managers specifically scan for this.",
        recommended_fix="Highlight any instances where you took ownership: team lead on a project, mentored an intern, coordinated a deployment, or led code reviews. Even informal leadership counts.",
        estimated_improvement="+4 JOB MODE",
        priority="MEDIUM",
    )


def _rule_no_projects(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: Projects section missing or very weak."""
    if bd.project_quality.score >= 6:
        return None
    projects = parsed.get("projects", [])
    n = len(projects) if isinstance(projects, list) else 0
    
    if n == 0 and any(kw in raw.lower() for kw in ["project", "portfolio", "personal work", "open source"]):
        n = 1
            
    if n >= 1:
        return None

    return ResumeFix(
        title="Projects Section Missing or Thin",
        category="Projects",
        evidence=f"Only {n} project(s) detected. Recommended: 3-5 well-described projects.",
        why_it_matters="For early-career candidates, projects are the primary way to demonstrate practical skills. Resumes without a projects section score significantly lower in parsing systems for technical roles.",
        recommended_fix="Add 3-5 projects with: a clear title, tech stack used (as keywords), a 1-2 sentence outcome, and a GitHub/live URL. Even academic or personal projects count — focus on impact.",
        estimated_improvement="+7 JOB MODE",
        priority="HIGH",
    )


def _rule_low_skill_density(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: Skill density too low."""
    if bd.skill_density.score >= 11:
        return None
    
    raw_skills = parsed.get("skills", [])
    skills = []
    if isinstance(raw_skills, list):
        for s in raw_skills:
            if isinstance(s, dict) and "name" in s:
                skills.append(s["name"].lower())
            elif isinstance(s, str):
                skills.append(s.lower())
    
    skills = set(skills)
    
    # If the text is long but we found very few skills, it's likely a parsing error, don't penalize.
    word_count = len(raw.split())
    if word_count > 400 and len(skills) < 4:
        return None
        
    if len(skills) >= 6:
        return None

    return ResumeFix(
        title="Skills Section Needs Expansion",
        category="Skills",
        evidence=f"Only {len(skills)} distinct skills detected. Scoring systems index the skills section heavily.",
        why_it_matters="Systems parse the skills section first and score resumes based on keyword matches. A thin skills section means your resume may not reach a recruiter even if you're qualified.",
        recommended_fix="Add all tools, languages, frameworks, and platforms you have used — even briefly. Organise into sub-categories: Programming Languages, Frameworks, Databases, Cloud & DevOps, Tools. Aim for 10-20 skills.",
        estimated_improvement="+8 JOB MODE",
        priority="HIGH",
    )


def _rule_no_deployment_evidence(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: Projects exist but no deployment/production evidence."""
    if bd.project_quality.score < 4:
        return None   # no projects at all — handled by the projects rule
    deploy_signals = ["deployed", "production", "live", "vercel", "heroku", "aws", "railway", "netlify", "render", "https://"]
    if any(s in raw.lower() for s in deploy_signals):
        return None

    return ResumeFix(
        title="No Deployment Evidence in Projects",
        category="Projects",
        evidence="Projects mentioned but no deployment, hosting, or production signals detected.",
        why_it_matters="Side projects that are 'just on my laptop' carry significantly less weight than deployed apps. Live, accessible projects demonstrate production readiness — a top hiring signal.",
        recommended_fix="Deploy at least 1-2 projects. Free platforms: Vercel (frontend), Railway/Render (backend), Hugging Face Spaces (ML). Add the live URL to each project description.",
        estimated_improvement="+4 JOB MODE",
        priority="MEDIUM",
    )


def _rule_missing_contact(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: Missing email or LinkedIn."""
    contact = parsed.get("contact", {})
    raw_lower = raw.lower()
    has_email = bool(contact.get("email")) or "@" in raw
    has_linkedin = "linkedin.com" in raw_lower or "linkedin" in raw_lower

    fixes_needed = []
    if not has_email:
        fixes_needed.append("email address")
    if not has_linkedin:
        fixes_needed.append("LinkedIn profile URL")

    if not fixes_needed:
        return None

    return ResumeFix(
        title="Incomplete Contact Information",
        category="Structure",
        evidence=f"Missing: {', '.join(fixes_needed)}.",
        why_it_matters="Systems extract and validate contact information. Missing email or LinkedIn causes parsing failures, and recruiters cannot follow up without contact details.",
        recommended_fix=f"Add your {' and '.join(fixes_needed)} to the resume header. Format LinkedIn as: linkedin.com/in/yourname. Ensure the email is professional (avoid nicknames).",
        estimated_improvement="+3 JOB MODE",
        priority="MEDIUM",
    )


def _rule_formatting_too_short(parsed: Dict, raw: str, bd: ATSBreakdown) -> ResumeFix | None:
    """RULE: Resume text is too short."""
    if bd.formatting.score >= 4:
        return None
    word_count = len(raw.split())
    if word_count >= 200:
        return None

    return ResumeFix(
        title="Resume Content Is Too Sparse",
        category="Formatting",
        evidence=f"Resume contains only ~{word_count} words. Systems typically expect 300-800 words.",
        why_it_matters="Very short resumes give parsing systems insufficient data to score correctly. They also signal a lack of experience depth to recruiters.",
        recommended_fix="Expand each role with 3-5 bullet points. Describe what you did, the technology used, and the measurable outcome. Add sections you may have skipped: Projects, Certifications, Extra-curricular.",
        estimated_improvement="+5 JOB MODE",
        priority="HIGH",
    )


# ── Master rule list ──────────────────────────────────────────────────────
_RULES = [
    _rule_no_quantified_achievements,
    _rule_low_skill_density,
    _rule_no_projects,
    _rule_missing_github,
    _rule_passive_language,
    _rule_missing_summary,
    _rule_no_deployment_evidence,
    _rule_missing_leadership,
    _rule_missing_certifications,
    _rule_missing_contact,
    _rule_formatting_too_short,
]

# Priority ordering for sort
_PRIORITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}


def generate_fixes(
    parsed_data: Dict[str, Any],
    raw_text: str,
    breakdown: ATSBreakdown,
) -> List[ResumeFix]:
    """
    Engine 3 entry point — run all resume audit rules.

    Returns a sorted list of ResumeFix objects (HIGH priority first).
    """
    fixes = []
    for rule_fn in _RULES:
        try:
            result = rule_fn(parsed_data, raw_text, breakdown)
            if result is not None:
                fixes.append(result)
        except Exception:
            continue

    fixes.sort(key=lambda f: _PRIORITY_ORDER.get(f.priority, 2))
    return fixes
