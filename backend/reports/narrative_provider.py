"""
narrative_provider.py
---------------------
LLM layer for the Placement Intelligence Dossier.

The LLM ONLY generates text narratives — it never generates layout,
structure, HTML, or decides which sections exist.

All prompts are strictly scoped and include actual data to prevent
hallucination and generic output.
"""

import logging
from typing import Optional

import google.generativeai as genai

from reports.report_schema import (
    DossierPayload, StrengthItem, GapItem, RoadmapMonth, AdvisorVerdict,
)
import os
import json

logger = logging.getLogger(__name__)

def get_all_keys():
    from dotenv import load_dotenv
    load_dotenv(override=True)
    keys = []
    pk = os.environ.get("GEMINI_API_KEY")
    if pk:
        keys.append(pk)
    fk_str = os.environ.get("FALLBACK_GEMINI_API_KEYS", "")
    if fk_str:
        keys.extend([k.strip() for k in fk_str.split(",") if k.strip()])
    fk_old = os.environ.get("FALLBACK_GEMINI_API_KEY")
    if fk_old and fk_old not in keys:
        keys.append(fk_old)
    return keys

_startup_keys = get_all_keys()
if _startup_keys:
    genai.configure(api_key=_startup_keys[0])


def _model():
    return genai.GenerativeModel(
        "gemini-2.0-flash",
        generation_config={
            "temperature": 0.4,
            "max_output_tokens": 1024,
        },
    )


def _call_gemini(prompt: str, fallback: str) -> str:
    """Call Gemini; return plain text. Falls back gracefully on any error."""
    keys = get_all_keys()
    if not keys:
        return fallback
    for idx, key in enumerate(keys):
        try:
            genai.configure(api_key=key)
            resp = _model().generate_content(prompt)
            if idx > 0:
                logger.warning(f"Succeeded using fallback key #{idx}")
            return resp.text.strip()
        except Exception as e:
            logger.warning(f"[narrative_provider] API Key {idx} failed: {e}")
    logger.error("[narrative_provider] All API keys failed.")
    return fallback


def _json_call(prompt: str, fallback: dict | list) -> dict | list:
    """Call Gemini expecting JSON response."""
    keys = get_all_keys()
    if not keys:
        return fallback
    for idx, key in enumerate(keys):
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(
                "gemini-1.5-flash",
                generation_config={
                    "temperature": 0.3,
                    "response_mime_type": "application/json",
                    "max_output_tokens": 2048,
                },
            )
            resp = model.generate_content(prompt)
            text = resp.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            if idx > 0:
                logger.warning(f"Succeeded using fallback key #{idx}")
            return json.loads(text.strip())
        except Exception as e:
            logger.warning(f"[narrative_provider] JSON call with key {idx} failed: {e}")
    logger.error("[narrative_provider] All API keys failed.")
    return fallback


# ── 1. Executive Assessment (200-250 words) ──────────────────────────────────

def generate_executive_assessment(payload: DossierPayload) -> dict:
    # If the payload already has the advanced structured executive assessment from CandidateIntelligence, use it!
    if isinstance(payload.executive_assessment, dict) and "sections" in payload.executive_assessment:
        return payload.executive_assessment

    student = payload.student
    readiness = payload.readiness
    prob = payload.probability
    top_role = role_matches[0].role if (role_matches := payload.role_matches) else student.top_predicted_role
    skills_list  = ", ".join(s.skill_name for s in payload.strengths[:5]) or "core technical skills"
    gaps_list    = ", ".join(g.gap_name for g in payload.gaps[:3]) or "advanced specializations"

    prompt = f"""
You are a Senior Talent Intelligence Analyst at a top executive search firm.

Write a highly structured executive assessment for the following candidate. 
Return STRICT JSON matching exactly this schema:
{{
    "assessment": "Full combined text...",
    "sections": {{
        "executive_overview": "Overview of readiness and role target...",
        "technical_capability": "Assessment of skills and depth...",
        "resume_quality": "Evaluation of structure and ATS compatibility...",
        "placement_outlook": "Prediction of market success...",
        "recruiter_verdict": "Final recommendation to advance or reject..."
    }}
}}

CANDIDATE DATA (use these exact figures):
- Name: {student.name}
- Domain: {student.primary_domain}
- Top Predicted Role: {top_role}
- Placement Readiness: {readiness.readiness_label} ({readiness.placement_score:.1f}%)
- Profile Strength Score: {prob.profile_strength_score:.1f}%
- Top Role Match: {prob.top_role_match_percent}%
- Key Strengths: {skills_list}
- Critical Gaps: {gaps_list}

INSTRUCTIONS:
- Do NOT use generic phrases like "promising candidate" or "strong potential".
- Reference the actual skills, gaps, domain, and scores explicitly.
- Write in a professional executive consultant voice — confident, data-driven, specific.
- Output ONLY valid JSON, nothing else.
"""
    fallback_text = (
        f"{student.name} demonstrates a {readiness.readiness_label.lower()} readiness profile "
        f"within the {student.primary_domain} domain, with a composite profile strength score of "
        f"{score:.1f}% and a {prob.profile_strength_score:.1f}% predicted profile strength. Core technical strengths in {skills_list} establish a solid "
        f"foundation for roles such as {primary_role}. Closing identified gaps in {gaps_list} represents "
        f"the clearest path to elevating market competitiveness and role eligibility."
    )
    fallback = {
        "assessment": fallback_text,
        "sections": {
            "executive_overview": fallback_text,
            "technical_capability": f"Core technical strengths in {skills_list}.",
            "resume_quality": "Resume parsed successfully.",
            "placement_outlook": f"Profile strength is {prob.profile_strength_score:.1f}%.",
            "recruiter_verdict": f"Targeting {top_role} roles."
        }
    }
    return _json_call(prompt, fallback)



# ── 2. Strength Reasons (1 sentence per strength) ────────────────────────────

def generate_strength_reasons(payload: DossierPayload) -> list[StrengthItem]:
    if not payload.strengths:
        return payload.strengths

    skills_context = ", ".join(s.skill_name for s in payload.strengths)
    top_role = payload.role_matches[0].role if payload.role_matches else payload.student.top_predicted_role
    domain = payload.student.primary_domain

    prompt = f"""
You are a career analyst generating one-sentence skill justifications for a candidate profile.

Candidate Domain: {domain}
Target Role: {top_role}
Skills to justify: {skills_context}

For EACH skill listed, write exactly ONE sentence (15-25 words) explaining why this skill is a
strength for this specific domain and role. Be specific and data-aware — not generic.

Return ONLY a JSON array of strings, one per skill, in the SAME ORDER as the input list.
Example: ["Python enables...", "Machine Learning demonstrates..."]
"""
    fallback = [
        f"Strong {s.skill_name} proficiency enables high performance in {top_role} responsibilities."
        for s in payload.strengths
    ]
    result = _json_call(prompt, fallback)
    if isinstance(result, list) and len(result) == len(payload.strengths):
        reasons = [str(r) for r in result]
    else:
        reasons = fallback

    updated = []
    for i, strength in enumerate(payload.strengths):
        updated.append(StrengthItem(
            skill_name=strength.skill_name,
            strength_score=strength.strength_score,
            reason=reasons[i] if i < len(reasons) else fallback[i] if i < len(fallback) else "",
        ))
    return updated


# ── 3. Gap Explanations (1 sentence per gap) ─────────────────────────────────

def generate_gap_explanations(payload: DossierPayload) -> list[GapItem]:
    if not payload.gaps:
        return payload.gaps

    gap_names = ", ".join(g.gap_name for g in payload.gaps)
    top_role = payload.role_matches[0].role if payload.role_matches else payload.student.top_predicted_role
    domain = payload.student.primary_domain

    prompt = f"""
You are a placement intelligence analyst identifying why specific skill gaps matter.

Candidate Domain: {domain}
Target Role: {top_role}
Skill Gaps to explain: {gap_names}

For EACH gap listed, write exactly ONE sentence (15-25 words) explaining the business impact
of this gap and why closing it increases role eligibility. Be specific — not generic.

Return ONLY a JSON array of strings, one per gap, in the SAME ORDER as the input list.
Example: ["Statistics is critical for...", "TensorFlow proficiency is required for..."]
"""
    fallback = [
        f"Closing {g.gap_name} is essential to meet the technical bar for {top_role} positions in {domain}."
        for g in payload.gaps
    ]
    result = _json_call(prompt, fallback)
    if isinstance(result, list) and len(result) == len(payload.gaps):
        explanations = [str(r) for r in result]
    else:
        explanations = fallback

    updated = []
    for i, gap in enumerate(payload.gaps):
        updated.append(GapItem(
            gap_name=gap.gap_name,
            priority=gap.priority,
            priority_color=gap.priority_color,
            estimated_impact=gap.estimated_impact,
            explanation=explanations[i] if i < len(explanations) else (fallback[i] if i < len(fallback) else ""),
        ))
    return updated


# ── 4. Company Fit Reasoning ──────────────────────────────────────────────────

def generate_company_reasoning(payload: DossierPayload) -> list:
    from reports.report_schema import CompanyFit
    if not payload.companies:
        return payload.companies

    company_names = ", ".join(c.name for c in payload.companies)
    skills = ", ".join(s.skill_name for s in payload.strengths[:4])
    top_role = payload.role_matches[0].role if payload.role_matches else payload.student.top_predicted_role

    prompt = f"""
You are a talent matching analyst writing brief company-fit notes for a candidate.

Candidate Top Skills: {skills}
Candidate Target Role: {top_role}
Companies: {company_names}

For EACH company, write ONE sentence (12-20 words) explaining why this candidate fits
this company's technical culture and hiring signal. Be specific to the company.

Return ONLY a JSON array of strings, one per company, in the SAME ORDER as the input list.
"""
    fallback = [
        f"Strong alignment with {c.name}'s technical requirements and domain culture."
        for c in payload.companies
    ]
    result = _json_call(prompt, fallback)
    if isinstance(result, list) and len(result) == len(payload.companies):
        reasons = [str(r) for r in result]
    else:
        reasons = fallback

    updated = []
    for i, company in enumerate(payload.companies):
        updated.append(CompanyFit(
            name=company.name,
            initials=company.initials,
            fit_score=company.fit_score,
            reasoning=reasons[i] if i < len(reasons) else (fallback[i] if i < len(fallback) else ""),
        ))
    return updated


# ── 5. 90-Day Roadmap ─────────────────────────────────────────────────────────

def generate_roadmap(payload: DossierPayload) -> list[RoadmapMonth]:
    gaps = [g.gap_name for g in payload.gaps[:3]]
    top_role = payload.role_matches[0].role if payload.role_matches else payload.student.top_predicted_role
    domain = payload.student.primary_domain
    skills = [s.skill_name for s in payload.strengths[:3]]

    prompt = f"""
You are a senior career coach building a 90-day career acceleration plan.

Candidate Profile:
- Domain: {domain}
- Target Role: {top_role}
- Current Strengths: {", ".join(skills)}
- Critical Gaps to Close: {", ".join(gaps) or "general skill improvement"}
- Profile Strength Score: {payload.readiness.placement_score:.1f}%

Generate a PRACTICAL 90-day plan split into 3 months. Each month must have:
- A title (5-8 words)
- Exactly 3 specific, measurable actions (one sentence each, 10-18 words)

Rules:
- Actions must be concrete and domain-specific, not generic advice.
- Month 1: Foundation — address top gap
- Month 2: Depth — second gap + portfolio project
- Month 3: Applications — interview prep + target companies

Return ONLY valid JSON in this exact format:
[
  {{"title": "...", "actions": ["...", "...", "..."]}},
  {{"title": "...", "actions": ["...", "...", "..."]}},
  {{"title": "...", "actions": ["...", "...", "..."]}}
]
"""
    colors = ["#FF7A1A", "#00E6A8", "#7B7CFF"]
    fallback_data = [
        {"title": "Foundation & Core Skill Gaps", "actions": [
            f"Complete a structured {gaps[0] if gaps else 'core skill'} online course with daily 2-hour practice sessions.",
            f"Build 1 mini-project applying {gaps[0] if gaps else domain} concepts to demonstrate practical understanding.",
            "Document all learning in a public GitHub repository to build an observable portfolio.",
        ]},
        {"title": "Depth, Projects & Portfolio Build", "actions": [
            f"Develop a complete end-to-end project targeting the {top_role} role using your current skill stack.",
            f"Address the second skill gap ({gaps[1] if len(gaps) > 1 else 'domain tools'}) through focused practice and tutorials.",
            "Participate in at least one domain-specific competition, hackathon, or open-source contribution.",
        ]},
        {"title": "Interview Readiness & Applications", "actions": [
            f"Solve 30 domain-relevant problems and complete 5 mock technical interviews for {top_role} roles.",
            "Finalize resume, LinkedIn, and portfolio with quantified impact metrics from projects completed.",
            f"Apply to at least 10 target companies including {', '.join(c.name for c in payload.companies[:2]) or 'target firms'}.",
        ]},
    ]

    result = _json_call(prompt, fallback_data)
    roadmap = []
    for i in range(3):
        data = result[i] if isinstance(result, list) and i < len(result) else fallback_data[i]
        roadmap.append(RoadmapMonth(
            month=i + 1,
            title=str(data.get("title", fallback_data[i]["title"])),
            accent_color=colors[i],
            actions=data.get("actions", fallback_data[i]["actions"])[:3],
            skills_focus=payload.roadmap[i].skills_focus if i < len(payload.roadmap) else [],
        ))
    return roadmap


# ── 6. AI Advisor Verdict (max 300 words) ─────────────────────────────────────

def generate_advisor_verdict(payload: DossierPayload) -> AdvisorVerdict:
    student = payload.student
    readiness = payload.readiness
    prob = payload.probability
    top_role = payload.role_matches[0].role if payload.role_matches else student.top_predicted_role
    skills = ", ".join(s.skill_name for s in payload.strengths[:4])
    gaps   = ", ".join(g.gap_name for g in payload.gaps[:3])
    score  = readiness.placement_score

    prompt = f"""
You are a Senior Career Consultant with 15 years of experience in technology and business placement.

Write a final advisor verdict for this candidate. This will be the closing section of their
Placement Intelligence Dossier — the last thing a recruiter or placement officer will read.

CANDIDATE DATA (reference these explicitly):
- Name: {student.name}
- Domain: {student.primary_domain}
- Target Role: {top_role}
- Profile Strength Index: {score:.1f}%
- Profile Strength Score: {prob.profile_strength_score:.1f}%
- Strengths: {skills}
- Gaps: {gaps}
- Overall Rating: {payload.advisor_verdict.overall_rating}

INSTRUCTIONS:
- Write a maximum of 300 words (strict limit).
- Sound like a senior consultant — authoritative, specific, actionable.
- DO NOT use generic phrases like "strong potential" or "bright future".
- Reference the actual skills, gaps, domain, and scores explicitly.
- End with a clear recommendation on next steps.
- No bullet points. Flowing paragraphs only.
- Output ONLY the verdict text, nothing else.
"""
    fallback = (
        f"{student.name} presents a {payload.advisor_verdict.overall_rating.lower()} profile "
        f"in the {student.primary_domain} domain, with a composite intelligence score of "
        f"{score:.1f}% and a {prob.profile_strength_score:.1f}% predicted profile strength. "
        f"The demonstrated proficiency in {skills} positions this candidate competitively for "
        f"{top_role} roles. The primary investment should focus on closing the gaps in {gaps}, "
        f"which represent the highest-leverage path to improving market readiness. "
        f"Immediate next steps: close gap #1 within 30 days, build one portfolio project, "
        f"and begin targeted applications to domain-aligned companies."
    )
    text = _call_gemini(prompt, fallback)
    return AdvisorVerdict(verdict_text=text, overall_rating=payload.advisor_verdict.overall_rating)


# ── Master narrative enhancement function ─────────────────────────────────────

def enhance_payload_with_narratives(payload: DossierPayload) -> DossierPayload:
    """
    Enriches the payload with all LLM-generated narrative text.
    Each call is isolated so one failure does not block others.
    """
    try:
        exec_assessment = generate_executive_assessment(payload)
    except Exception as e:
        logger.error(f"executive_assessment failed: {e}")
        exec_assessment = payload.executive_assessment or "Executive assessment unavailable."

    try:
        enhanced_strengths = generate_strength_reasons(payload)
    except Exception as e:
        logger.error(f"strength_reasons failed: {e}")
        enhanced_strengths = payload.strengths

    try:
        enhanced_gaps = generate_gap_explanations(payload)
    except Exception as e:
        logger.error(f"gap_explanations failed: {e}")
        enhanced_gaps = payload.gaps

    try:
        enhanced_companies = generate_company_reasoning(payload)
    except Exception as e:
        logger.error(f"company_reasoning failed: {e}")
        enhanced_companies = payload.companies

    try:
        enhanced_roadmap = generate_roadmap(payload)
    except Exception as e:
        logger.error(f"roadmap failed: {e}")
        enhanced_roadmap = payload.roadmap

    try:
        advisor_verdict = generate_advisor_verdict(payload)
    except Exception as e:
        logger.error(f"advisor_verdict failed: {e}")
        advisor_verdict = payload.advisor_verdict

    return payload.model_copy(update={
        "executive_assessment": exec_assessment,
        "strengths": enhanced_strengths,
        "gaps": enhanced_gaps,
        "companies": enhanced_companies,
        "roadmap": enhanced_roadmap,
        "advisor_verdict": advisor_verdict,
    })
