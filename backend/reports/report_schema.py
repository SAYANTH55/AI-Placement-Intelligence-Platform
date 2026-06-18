"""
report_schema.py
----------------
Typed Pydantic models for the Placement Intelligence Dossier payload.
Every field has a sane default so no section can ever be empty.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class StudentInfo(BaseModel):
    name: str = "Unknown Student"
    email: str = ""
    department: str = "Technology"
    batch: str = "2024-25"
    course: str = ""
    roll_number: str = ""
    generated_date: str = ""
    primary_domain: str = "Information Technology"
    top_predicted_role: str = "Software Engineer"


class ReadinessMetrics(BaseModel):
    placement_score: float = 0.0          # 0-100
    readiness_label: str = "Medium"       # High / Medium / Low
    confidence: float = 0.0              # 0-100 (score * 0.9)
    uncertainty: str = "MEDIUM"
    industry_benchmark: float = 72.0     # typical industry figure


class ProbabilityMetrics(BaseModel):
    placement_probability: float = 0.0   # 0-100
    top_role_match_percent: int = 0


class StrengthItem(BaseModel):
    skill_name: str
    strength_score: float = 80.0         # 0-100 visual bar
    reason: str = ""                     # LLM-generated, 1 sentence


class GapItem(BaseModel):
    gap_name: str
    priority: str = "Medium"             # Critical / High / Medium / Low
    priority_color: str = "#F59E0B"
    estimated_impact: str = "Moderate"
    explanation: str = ""                # LLM-generated, 1 sentence


class SkillItem(BaseModel):
    name: str
    confidence: float = 0.8
    source: str = "resume"


class RoleMatch(BaseModel):
    role: str
    match_percent: int = 0
    bar_color: str = "#FF7A1A"
    supporting_skills: List[str] = []
    missing_skills: List[str] = []


class CompanyFit(BaseModel):
    name: str
    initials: str = ""
    fit_score: int = 75
    reasoning: str = ""


class DomainInfo(BaseModel):
    domain_name: str
    confidence: float = 0.8
    confidence_percent: int = 80
    is_primary: bool = True
    bar_color: str = "#FF7A1A"


class ImprovementStep(BaseModel):
    label: str
    score: int
    action: str
    is_current: bool = False


class RoadmapMonth(BaseModel):
    month: int
    title: str
    accent_color: str = "#FF7A1A"
    actions: List[str] = []
    skills_focus: List[str] = []


class LearningPriority(BaseModel):
    skill: str
    priority: str = "High"
    priority_color: str = "#FF7A1A"
    expected_impact: str = "High"
    readiness_gain: str = "+5%"


class AdvisorVerdict(BaseModel):
    verdict_text: str = ""
    overall_rating: str = "Promising"


class DossierPayload(BaseModel):
    student: StudentInfo = Field(default_factory=StudentInfo)
    readiness: ReadinessMetrics = Field(default_factory=ReadinessMetrics)
    probability: ProbabilityMetrics = Field(default_factory=ProbabilityMetrics)
    executive_assessment: str = ""
    strengths: List[StrengthItem] = []
    gaps: List[GapItem] = []
    skills: List[SkillItem] = []
    role_matches: List[RoleMatch] = []
    companies: List[CompanyFit] = []
    domains: List[DomainInfo] = []
    improvement_simulation: List[ImprovementStep] = []
    roadmap: List[RoadmapMonth] = []
    learning_priorities: List[LearningPriority] = []
    advisor_verdict: AdvisorVerdict = Field(default_factory=AdvisorVerdict)
