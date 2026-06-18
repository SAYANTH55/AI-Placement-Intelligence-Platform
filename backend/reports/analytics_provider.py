"""
analytics_provider.py
----------------------
Reads from the database and builds the structured DossierPayload.

Priority:
  1. Latest ResumeAnalysis from DB  (normalized tables first, JSON columns as fallback)
  2. live_payload dict from frontend (when no DB record exists)

No section ever returns empty — every list has a fallback.
"""

import hashlib
import logging
from datetime import datetime, date
from typing import Optional

from sqlalchemy.orm import Session

from database.models import (
    User, Student, Department,
    ResumeAnalysis, ResumeSkill, ResumeGap, ResumePrediction, ResumeDomainPrediction,
    Drive, Company,
)
from reports.report_schema import (
    DossierPayload, StudentInfo, ReadinessMetrics, ProbabilityMetrics,
    StrengthItem, GapItem, SkillItem, RoleMatch, CompanyFit,
    DomainInfo, ImprovementStep, RoadmapMonth, LearningPriority, AdvisorVerdict,
)

logger = logging.getLogger(__name__)

# ── Priority colour helpers ──────────────────────────────────────────────────

_PRIORITY_COLOR = {
    "Critical": "#F87171",
    "High":     "#F97316",
    "Medium":   "#F59E0B",
    "Low":      "#34D399",
}

_DOMAIN_FALLBACK_COMPANIES = {
    "default": ["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro"],
    "it":      ["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro"],
    "data science": ["Databricks", "Snowflake", "Palantir", "DataRobot", "Tableau", "MathWorks"],
    "machine learning": ["DeepMind", "OpenAI", "Hugging Face", "Scale AI", "Cohere", "Anthropic"],
    "finance": ["Goldman Sachs", "JP Morgan", "Morgan Stanley", "Deloitte", "PwC", "KPMG"],
    "legal":   ["Cyril Amarchand", "AZB & Partners", "Khaitan & Co.", "Trilegal", "NALSAR Ventures", "Lakshmikumaran"],
    "marketing": ["WPP", "Publicis", "Ogilvy", "Leo Burnett", "Dentsu", "FCB"],
    "operations": ["McKinsey", "BCG", "Bain", "Accenture", "Deloitte", "EY"],
    "mechanical": ["Tata Motors", "Mahindra", "L&T", "Siemens", "ABB", "Bosch"],
    "electrical": ["BHEL", "ABB", "Siemens", "Schneider Electric", "GE", "Honeywell"],
    "civil": ["L&T Construction", "Shapoorji Pallonji", "Tata Projects", "Gammon", "NCC", "AECOM"],
    "biotech": ["Biocon", "Dr. Reddy's", "Cipla", "Sun Pharma", "Serum Institute", "Lupin"],
}


def _color_for_domain(primary_domain: str, index: int) -> str:
    colors = ["#FF7A1A", "#00E6A8", "#7B7CFF", "#F59E0B", "#F87171"]
    return colors[index % len(colors)]


def _priority_label(importance: Optional[str], gap_score: Optional[float]) -> str:
    if importance:
        imp = importance.lower()
        if "critical" in imp or "very high" in imp:
            return "Critical"
        if "high" in imp:
            return "High"
        if "low" in imp:
            return "Low"
    if gap_score is not None:
        if gap_score >= 0.8:
            return "Critical"
        if gap_score >= 0.5:
            return "High"
    return "Medium"


def _compute_hash(analysis_id: int) -> str:
    return hashlib.sha256(str(analysis_id).encode()).hexdigest()[:16]


def _improvement_simulation(base_score: float, gaps: list) -> list[ImprovementStep]:
    """Simulate placement probability gains as student closes skill gaps."""
    steps = []
    score = round(base_score)

    steps.append(ImprovementStep(
        label="Current State",
        score=score,
        action="Baseline placement probability",
        is_current=True,
    ))

    increments = [7, 7, 6, 5]
    labels = [
        (f"Close '{gaps[0].gap_name}'",    f"Complete {gaps[0].gap_name} learning path") if len(gaps) > 0 else ("Close Gap 1", "Complete top priority gap"),
        (f"+ '{gaps[1].gap_name}'",        f"Add {gaps[1].gap_name} to skill set")       if len(gaps) > 1 else ("Close Gap 2", "Complete second gap"),
        ("Add Portfolio Project",           "Build a project showcasing core domain skills"),
        ("Add Domain Certification",        "Earn a recognised industry certification"),
    ]

    for i, (label, action) in enumerate(labels):
        score = min(98, score + increments[i])
        steps.append(ImprovementStep(label=label, score=score, action=action, is_current=False))

    return steps


def _build_roadmap_from_gaps(gaps: list, domain: str, top_role: str) -> list[RoadmapMonth]:
    """Generate a deterministic 3-month roadmap skeleton.
    The LLM in narrative_provider will fill the actual actions."""
    colors = ["#FF7A1A", "#00E6A8", "#7B7CFF"]
    top_gaps = [g.gap_name for g in gaps[:3]]
    if not top_gaps:
        top_gaps = ["Domain Fundamentals", "Portfolio Development", "Interview Readiness"]

    months = [
        RoadmapMonth(
            month=1, title="Foundation & Core Gaps",
            accent_color=colors[0],
            skills_focus=top_gaps[:1],
            actions=["TBD — LLM will populate"]
        ),
        RoadmapMonth(
            month=2, title="Skill Depth & Projects",
            accent_color=colors[1],
            skills_focus=top_gaps[1:2] if len(top_gaps) > 1 else top_gaps,
            actions=["TBD — LLM will populate"]
        ),
        RoadmapMonth(
            month=3, title="Interview Readiness & Applications",
            accent_color=colors[2],
            skills_focus=top_gaps[2:3] if len(top_gaps) > 2 else ["Interview Preparation"],
            actions=["TBD — LLM will populate"]
        ),
    ]
    return months


def _learning_priorities_from_gaps(gaps: list, role_matches: list) -> list[LearningPriority]:
    priorities = []
    gain_map = {"Critical": "+12%", "High": "+8%", "Medium": "+5%", "Low": "+3%"}
    impact_map = {"Critical": "Very High", "High": "High", "Medium": "Moderate", "Low": "Low"}

    for gap in gaps[:5]:
        priorities.append(LearningPriority(
            skill=gap.gap_name,
            priority=gap.priority,
            priority_color=_PRIORITY_COLOR.get(gap.priority, "#F59E0B"),
            expected_impact=impact_map.get(gap.priority, "Moderate"),
            readiness_gain=gain_map.get(gap.priority, "+5%"),
        ))

    if not priorities:
        priorities = [
            LearningPriority(skill="Portfolio Depth", priority="High", priority_color="#F97316",
                             expected_impact="High", readiness_gain="+8%"),
            LearningPriority(skill="Interview Readiness", priority="Medium", priority_color="#F59E0B",
                             expected_impact="Moderate", readiness_gain="+5%"),
            LearningPriority(skill="Domain Certification", priority="High", priority_color="#F97316",
                             expected_impact="High", readiness_gain="+7%"),
        ]
    return priorities


# ── Main entry point ─────────────────────────────────────────────────────────

def build_analytics_payload(
    user_id: int,
    db: Session,
    live_payload: Optional[dict] = None,
) -> tuple[DossierPayload, Optional[int], Optional[str]]:
    """
    Returns (DossierPayload, analysis_id_or_None, report_hash_or_None).
    Falls back to live_payload when no DB record exists.
    """
    # ── 1. Fetch user & student profile ──────────────────────────────────────
    user: User = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")

    student: Optional[Student] = db.query(Student).filter(Student.user_id == user_id).first()
    department_name = ""
    if user.department_id:
        dept = db.query(Department).filter(Department.id == user.department_id).first()
        department_name = dept.name if dept else ""

    batch = student.batch if student else "2024-25"

    # ── 2. Fetch latest analysis ──────────────────────────────────────────────
    analysis: Optional[ResumeAnalysis] = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == user_id)
        .order_by(ResumeAnalysis.created_at.desc())
        .first()
    )

    analysis_id: Optional[int] = None
    report_hash: Optional[str] = None

    if analysis:
        analysis_id = analysis.id
        report_hash = _compute_hash(analysis.id)
        payload = _build_from_db(user, student, department_name, batch, analysis, db)
    elif live_payload:
        logger.info(f"No DB analysis for user {user_id}, falling back to live payload.")
        payload = _build_from_live(user, student, department_name, batch, live_payload)
    else:
        raise ValueError("No resume analysis found and no live payload provided.")

    return payload, analysis_id, report_hash


# ── DB-backed builder ─────────────────────────────────────────────────────────

def _build_from_db(
    user: User,
    student: Optional[Student],
    department_name: str,
    batch: str,
    analysis: ResumeAnalysis,
    db: Session,
) -> DossierPayload:

    # ── Skills (normalized table → JSON fallback) ─────────────────────────────
    db_skills = db.query(ResumeSkill).filter(ResumeSkill.analysis_id == analysis.id).all()
    if db_skills:
        raw_skills = [{"name": s.skill_name, "confidence": s.skill_score or s.confidence or 0.8}
                      for s in db_skills]
    else:
        raw_skills = [{"name": s, "confidence": 0.8}
                      for s in (analysis.extracted_skills or [])]

    skills = [SkillItem(name=s["name"], confidence=s.get("confidence", 0.8)) for s in raw_skills]

    # ── Predictions (normalized → JSON fallback) ──────────────────────────────
    db_preds = (
        db.query(ResumePrediction)
        .filter(ResumePrediction.analysis_id == analysis.id)
        .order_by(ResumePrediction.role_confidence.desc())
        .all()
    )
    if db_preds:
        top_pred = db_preds[0]
        placement_prob = round((top_pred.placement_probability or analysis.placement_probability or 0.5) * 100, 1)
        top_role_name = top_pred.predicted_role or analysis.top_matching_role or "Software Engineer"
        readiness_label = top_pred.readiness_score or analysis.placement_readiness or "Medium"
    else:
        placement_prob = round((analysis.placement_probability or 0.5) * 100, 1)
        top_role_name = analysis.top_matching_role or "Software Engineer"
        readiness_label = analysis.placement_readiness or "Medium"

    # ── Role Matches (JSON column) ────────────────────────────────────────────
    raw_roles = analysis.role_matches or []
    role_colors = ["#FF7A1A", "#00E6A8", "#7B7CFF", "#F59E0B", "#F87171"]
    role_matches = []
    for i, r in enumerate(raw_roles[:8]):
        role_matches.append(RoleMatch(
            role=r.get("role", r.get("title", f"Role {i+1}")),
            match_percent=int(r.get("match", 0)),
            bar_color=role_colors[i % len(role_colors)],
            supporting_skills=r.get("present", [])[:5],
            missing_skills=r.get("missing", [])[:5],
        ))

    if not role_matches:
        role_matches = [RoleMatch(role=top_role_name, match_percent=int(analysis.top_role_match_percent or 75),
                                   bar_color="#FF7A1A")]

    # ── Gaps (normalized table → JSON fallback) ───────────────────────────────
    db_gaps = db.query(ResumeGap).filter(ResumeGap.analysis_id == analysis.id).all()
    if db_gaps:
        raw_gaps_data = [{"name": g.skill_name, "importance": g.importance, "gap_score": g.gap_score}
                         for g in db_gaps]
    else:
        raw_gaps_data = [{"name": g if isinstance(g, str) else g.get("skill", g.get("name", str(g))),
                          "importance": "Medium", "gap_score": 0.6}
                         for g in (analysis.skill_gaps or [])]

    gaps: list[GapItem] = []
    for g in raw_gaps_data[:6]:
        priority = _priority_label(g.get("importance"), g.get("gap_score"))
        gaps.append(GapItem(
            gap_name=g["name"],
            priority=priority,
            priority_color=_PRIORITY_COLOR.get(priority, "#F59E0B"),
            estimated_impact={"Critical": "Very High", "High": "High", "Medium": "Moderate", "Low": "Low"}.get(priority, "Moderate"),
        ))

    if not gaps:
        gaps = [GapItem(
            gap_name="Project Portfolio Depth",
            priority="High",
            priority_color="#F97316",
            estimated_impact="High",
            explanation="No major skill gaps detected. Recommended focus: project depth, portfolio quality, and interview readiness.",
        )]

    # ── Strengths (top 5 skills by confidence or skill_score) ─────────────────
    sorted_skills = sorted(raw_skills, key=lambda s: s.get("confidence", 0.8), reverse=True)
    strengths = [
        StrengthItem(
            skill_name=s["name"],
            strength_score=round(min(100, s.get("confidence", 0.8) * 100), 1),
        )
        for s in sorted_skills[:5]
    ]
    if not strengths:
        strengths = [StrengthItem(skill_name="Core Technical Skills", strength_score=75.0)]

    # ── Domains ───────────────────────────────────────────────────────────────
    db_domains = (
        db.query(ResumeDomainPrediction)
        .filter(ResumeDomainPrediction.analysis_id == analysis.id)
        .all()
    )
    domains: list[DomainInfo] = []
    if db_domains:
        d = db_domains[0]
        domains.append(DomainInfo(
            domain_name=d.primary_domain or "Information Technology",
            confidence=d.confidence or 0.85,
            confidence_percent=int((d.confidence or 0.85) * 100),
            is_primary=True, bar_color="#FF7A1A",
        ))
        if d.secondary_domain:
            domains.append(DomainInfo(
                domain_name=d.secondary_domain,
                confidence=max(0.3, (d.confidence or 0.5) - 0.2),
                confidence_percent=int(max(30, ((d.confidence or 0.5) - 0.2) * 100)),
                is_primary=False, bar_color="#00E6A8",
            ))
    else:
        primary = analysis.detected_domain or "Information Technology"
        conf = analysis.domain_confidence or 0.85
        domains.append(DomainInfo(
            domain_name=primary, confidence=conf,
            confidence_percent=int(conf * 100), is_primary=True, bar_color="#FF7A1A",
        ))
        if analysis.secondary_domain:
            domains.append(DomainInfo(
                domain_name=analysis.secondary_domain,
                confidence=max(0.3, conf - 0.2),
                confidence_percent=int(max(30, (conf - 0.2) * 100)),
                is_primary=False, bar_color="#00E6A8",
            ))

    primary_domain = domains[0].domain_name if domains else "Information Technology"

    # ── Companies ─────────────────────────────────────────────────────────────
    companies = _fetch_companies(db, primary_domain)

    # ── Scores ────────────────────────────────────────────────────────────────
    placement_score = round(placement_prob, 1)
    confidence = round(placement_score * 0.9, 1)
    uncertainty = "LOW" if placement_score >= 75 else "MEDIUM" if placement_score >= 45 else "HIGH"

    # ── Improvement simulation ────────────────────────────────────────────────
    simulation = _improvement_simulation(placement_score, gaps)

    # ── Roadmap skeleton ──────────────────────────────────────────────────────
    roadmap = _build_roadmap_from_gaps(gaps, primary_domain, top_role_name)

    # ── Learning priorities ───────────────────────────────────────────────────
    learning_priorities = _learning_priorities_from_gaps(gaps, role_matches)

    return DossierPayload(
        student=StudentInfo(
            name=user.name or "Unknown Student",
            email=user.email or "",
            department=department_name or user.course or "Technology",
            batch=batch,
            course=user.course or "",
            roll_number=user.roll_number or "",
            generated_date=datetime.now().strftime("%B %d, %Y"),
            primary_domain=primary_domain,
            top_predicted_role=top_role_name,
        ),
        readiness=ReadinessMetrics(
            placement_score=placement_score,
            readiness_label=readiness_label,
            confidence=confidence,
            uncertainty=uncertainty,
            industry_benchmark=72.0,
        ),
        probability=ProbabilityMetrics(
            placement_probability=placement_prob,
            top_role_match_percent=int(role_matches[0].match_percent) if role_matches else 0,
        ),
        strengths=strengths,
        gaps=gaps,
        skills=skills,
        role_matches=role_matches,
        companies=companies,
        domains=domains,
        improvement_simulation=simulation,
        roadmap=roadmap,
        learning_priorities=learning_priorities,
        advisor_verdict=AdvisorVerdict(overall_rating=_readiness_rating(placement_score)),
    )


def _readiness_rating(score: float) -> str:
    if score >= 80: return "Highly Promising"
    if score >= 60: return "Promising"
    if score >= 40: return "Developing"
    return "Early Stage"


def _fetch_companies(db: Session, primary_domain: str) -> list[CompanyFit]:
    """Pull companies from live placement drives; domain-based fallback list."""
    try:
        drive_companies = (
            db.query(Drive.company_name)
            .filter(Drive.status == "open", Drive.company_name.isnot(None))
            .distinct()
            .limit(6)
            .all()
        )
        if drive_companies:
            return [
                CompanyFit(
                    name=c[0],
                    initials="".join(w[0].upper() for w in c[0].split()[:2]),
                    fit_score=75,
                    reasoning="Active placement drive open — strong recruitment signal.",
                )
                for c in drive_companies
            ]
    except Exception:
        pass

    # domain-based fallback
    domain_key = primary_domain.lower()
    names = None
    for key, vals in _DOMAIN_FALLBACK_COMPANIES.items():
        if key in domain_key:
            names = vals
            break
    names = names or _DOMAIN_FALLBACK_COMPANIES["default"]

    return [
        CompanyFit(
            name=n,
            initials="".join(w[0].upper() for w in n.split()[:2]),
            fit_score=max(60, 90 - i * 5),
            reasoning="Strong alignment based on domain profile and skill stack.",
        )
        for i, n in enumerate(names[:6])
    ]


# ── Live-payload (frontend session) builder ───────────────────────────────────

def _build_from_live(
    user: User,
    student: Optional[Student],
    department_name: str,
    batch: str,
    live: dict,
) -> DossierPayload:
    """Build payload from the in-memory analyzedData structure sent from the frontend."""

    skill_names: list[str] = live.get("skills", [])
    skills = [SkillItem(name=s) for s in skill_names]

    role_data: list[dict] = live.get("roleMatches", live.get("jobRoles", []))
    role_colors = ["#FF7A1A", "#00E6A8", "#7B7CFF", "#F59E0B", "#F87171"]
    role_matches = [
        RoleMatch(
            role=r.get("role", r.get("title", f"Role {i+1}")),
            match_percent=int(r.get("match", 0)),
            bar_color=role_colors[i % len(role_colors)],
            supporting_skills=r.get("present", [])[:5],
            missing_skills=r.get("missing", [])[:5],
        )
        for i, r in enumerate(role_data[:8])
    ]

    missing_skills: list[str] = live.get("missing_skills", [])
    gaps = [
        GapItem(
            gap_name=s,
            priority="High",
            priority_color="#F97316",
            estimated_impact="High",
        )
        for s in missing_skills[:6]
    ] or [GapItem(gap_name="Portfolio Depth", priority="High", priority_color="#F97316",
                  estimated_impact="High",
                  explanation="No major skill gaps detected. Focus on portfolio quality and interview readiness.")]

    prediction: dict = live.get("prediction", {})
    prob = round(float(prediction.get("placement_probability", 0.5)) * 100, 1)
    readiness_label = prediction.get("readiness", "Medium")

    strengths = [
        StrengthItem(skill_name=s, strength_score=round(min(100, 80 + i * 2), 1))
        for i, s in enumerate(skill_names[:5])
    ] or [StrengthItem(skill_name="Core Technical Skills", strength_score=75.0)]

    top_role = live.get("topRole", {})
    top_role_name = top_role.get("role", "") if isinstance(top_role, dict) else ""
    if not top_role_name and role_matches:
        top_role_name = role_matches[0].role

    primary_domain = live.get("detected_domain", "Information Technology")
    domain_conf = float(live.get("domain_confidence", 0.85))
    domains = [
        DomainInfo(domain_name=primary_domain, confidence=domain_conf,
                   confidence_percent=int(domain_conf * 100), is_primary=True, bar_color="#FF7A1A")
    ]
    secondary = live.get("secondary_domain")
    if secondary:
        domains.append(DomainInfo(
            domain_name=secondary, confidence=max(0.3, domain_conf - 0.2),
            confidence_percent=int(max(30, (domain_conf - 0.2) * 100)), is_primary=False, bar_color="#00E6A8",
        ))

    simulation = _improvement_simulation(prob, gaps)
    roadmap = _build_roadmap_from_gaps(gaps, primary_domain, top_role_name)
    learning_priorities = _learning_priorities_from_gaps(gaps, role_matches)

    confidence = round(prob * 0.9, 1)
    uncertainty = "LOW" if prob >= 75 else "MEDIUM" if prob >= 45 else "HIGH"

    return DossierPayload(
        student=StudentInfo(
            name=user.name or "Unknown Student",
            email=user.email or "",
            department=department_name or user.course or "Technology",
            batch=batch,
            course=user.course or "",
            roll_number=user.roll_number or "",
            generated_date=datetime.now().strftime("%B %d, %Y"),
            primary_domain=primary_domain,
            top_predicted_role=top_role_name or "Software Engineer",
        ),
        readiness=ReadinessMetrics(
            placement_score=prob,
            readiness_label=readiness_label,
            confidence=confidence,
            uncertainty=uncertainty,
            industry_benchmark=72.0,
        ),
        probability=ProbabilityMetrics(
            placement_probability=prob,
            top_role_match_percent=int(role_matches[0].match_percent) if role_matches else 0,
        ),
        strengths=strengths,
        gaps=gaps,
        skills=skills,
        role_matches=role_matches,
        companies=_domain_companies(primary_domain),
        domains=domains,
        improvement_simulation=simulation,
        roadmap=roadmap,
        learning_priorities=learning_priorities,
        advisor_verdict=AdvisorVerdict(overall_rating=_readiness_rating(prob)),
    )


def _domain_companies(primary_domain: str) -> list[CompanyFit]:
    domain_key = primary_domain.lower()
    names = _DOMAIN_FALLBACK_COMPANIES["default"]
    for key, vals in _DOMAIN_FALLBACK_COMPANIES.items():
        if key in domain_key:
            names = vals
            break
    return [
        CompanyFit(
            name=n,
            initials="".join(w[0].upper() for w in n.split()[:2]),
            fit_score=max(60, 90 - i * 5),
            reasoning="Strong alignment based on domain profile and skill stack.",
        )
        for i, n in enumerate(names[:6])
    ]
