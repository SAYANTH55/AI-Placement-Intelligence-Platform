import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv(override=True)

# Set environment keys
PRIMARY_KEY = os.environ.get("GEMINI_API_KEY", "")
FALLBACK_KEY = os.environ.get("FALLBACK_GEMINI_API_KEY", "")

# Attempt primary configuration
if PRIMARY_KEY:
    genai.configure(api_key=PRIMARY_KEY)

def configure_fallback():
    if FALLBACK_KEY:
        logger.warning("Primary API Key failed, swapping to fallback key architecture.")
        genai.configure(api_key=FALLBACK_KEY)
        return True
    return False

def get_gemini_model():
    # Dynamically load to catch key updates without server restart
    load_dotenv(override=True)
    pk = os.environ.get("GEMINI_API_KEY", "")
    fk = os.environ.get("FALLBACK_GEMINI_API_KEY", "")
    if pk:
        genai.configure(api_key=pk)
    elif fk:
        genai.configure(api_key=fk)
        
    return genai.GenerativeModel(
        'gemini-1.5-flash',
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    )

def clean_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())

def analyze_with_llm(parsed_data: dict) -> dict:
    """
    Parallel LLM analysis layer strictly limited to inferring additional context.
    Takes structured context (text, skills, experience) to reduce hallucinations.
    Always returns a safe JSON structure, even on failure.
    """
    safe_fallback = {
        "inferred_roles": [],
        "inferred_skills": [],
        "summary": "",
        "strengths": [],
        "weaknesses": []
    }
    
    if not (PRIMARY_KEY or FALLBACK_KEY):
        return safe_fallback

    prompt = f"""
    Analyze this resume and return STRICT JSON.
    Do not hallucinate. Use the provided context to infer additional potential target roles and hidden skills that might not be explicitly stated but are heavily implied by the work experience.
    CRITICAL: Identify the candidate's core domain (e.g., IT/CS, Mechanical, Marketing, etc.). Do NOT hallucinate software/IT skills if the profile is strictly non-IT. Only infer skills that naturally belong to their identified domain.

    Context:
    Experience Years: {parsed_data.get('experience', 0)}
    Already Extracted Skills: {parsed_data.get('skills', [])}
    
    Raw Text:
    {parsed_data.get('text', '')[:6000]} # Limit to avoid context length bloat

    Expected JSON Schema:
    {{
        "inferred_roles": ["Role 1", "Role 2"],
        "inferred_skills": ["Skill 1", "Skill 2"],
        "summary": "2 sentence professional summary.",
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"]
    }}
    Return ONLY JSON.
    """

    try:
        model = get_gemini_model()
        response = model.generate_content(prompt)
        result = clean_json(response.text)
        
        # Ensure contract is met
        for key in safe_fallback.keys():
            if key not in result:
                result[key] = safe_fallback[key]
                
        return result
    except Exception as e:
        logger.error(json.dumps({
            "event": "llm_analyze_primary_failed",
            "error_type": type(e).__name__,
            "error_message": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        if configure_fallback():
            try:
                model = get_gemini_model()
                response = model.generate_content(prompt)
                result = clean_json(response.text)
                for key in safe_fallback.keys():
                    if key not in result:
                        result[key] = safe_fallback[key]
                return result
            except Exception as inner_e:
                logger.error(json.dumps({
                    "event": "llm_analyze_fallback_failed",
                    "error_type": type(inner_e).__name__,
                    "error_message": str(inner_e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }))
        return safe_fallback


def generate_career_insights(structured_data: dict) -> dict:
    """
    Post-process LLM Insight Layer. Generates dynamic career advice based on the 
    determined missing skills, final roles, and ML profile strength score.

    The executive summary should evaluate the candidate's profile strength relative 
    to typical successful candidates, rather than predicting placement probability.
    """
    safe_fallback = {
        "learning_path": [],
        "career_advice": "",
        "explanation": ""
    }

    if not (PRIMARY_KEY or FALLBACK_KEY):
        return safe_fallback

    prompt = f"""
    Generate deeply personalized career insights based on this final candidate evaluation. Return STRICT JSON.
    Use the provided data to suggest specific, non-generic career paths.
    CRITICAL INSTRUCTION: Analyze the provided 'Final Skills' and 'Target Roles Detected' to determine the candidate's core domain. Provide learning paths, personalized jobs, and interview tips that STRICTLY align with that specific domain (e.g., do not suggest learning Python for a Mechanical Engineer unless explicitly relevant).

    Evaluation Data:
    - Final Skills: {structured_data.get('skills', [])}
    - Missing Skills (Gaps): {structured_data.get('missing_skills', [])}
    - Target Roles Detected: {structured_data.get('roles', [])}
    - Placement Readiness Score: {structured_data.get('score', 0)}/100

    Provide:
    1. A progressive learning path addressing the gaps.
    2. 3 Personalized Job Titles with a 'reason' why they fit this specific user.
    3. Industry Trends for their top role.
    4. 3 Tailored Interview Tips based on their profile.
    5. A concise career summary.

    Expected JSON Schema:
    {{
        "learning_path": ["Step 1: Master X", "Step 2: Build Y"],
        "personalized_jobs": [
            {{"title": "Job Title", "reason": "Why it fits"}},
            {{"title": "Job Title", "reason": "Why it fits"}}
        ],
        "industry_trends": "Brief current market trend summary.",
        "interview_tips": ["Tip 1", "Tip 2", "Tip 3"],
        "career_advice": "Detailed tailored strategy.",
        "explanation": "Brief explanation of the readiness score."
    }}
    Return ONLY JSON.
    """

    try:
        model = get_gemini_model()
        response = model.generate_content(prompt)
        result = clean_json(response.text)
        
        # Ensure contract is met
        for key in safe_fallback.keys():
            if key not in result:
                result[key] = safe_fallback[key]
                
        return result
    except Exception as e:
        logger.error(json.dumps({
            "event": "llm_insights_primary_failed",
            "error_type": type(e).__name__,
            "error_message": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        if configure_fallback():
            try:
                model = get_gemini_model()
                response = model.generate_content(prompt)
                result = clean_json(response.text)
                for key in safe_fallback.keys():
                    if key not in result:
                        result[key] = safe_fallback[key]
                return result
            except Exception as inner_e:
                logger.error(json.dumps({
                    "event": "llm_insights_fallback_failed",
                    "error_type": type(inner_e).__name__,
                    "error_message": str(inner_e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }))
        return safe_fallback


def generate_executive_assessment(candidate_intelligence_profile: dict) -> dict:
    """
    Executive Career Assessment Generator.

    Receives ONLY the structured CandidateIntelligenceProfile.
    NEVER receives raw resume text.

    The LLM acts as a Senior Technical Recruiter evaluating pre-computed
    platform intelligence. Every statement must be grounded in supplied
    metrics — no hallucination of skills, experience, or companies.

    Returns a dict:
      - assessment: str  (the full 220-250 word assessment)
      - sections: dict   (parsed into 5 named sections)
      - source: str      ("llm" | "deterministic_fallback")
    """
    safe_fallback = _build_deterministic_assessment(candidate_intelligence_profile)

    if not (PRIMARY_KEY or FALLBACK_KEY):
        return safe_fallback

    exec_inputs = candidate_intelligence_profile.get("meta", {}).get("executive_summary_inputs", {})
    if not exec_inputs:
        return safe_fallback

    prompt = f"""
You are a Senior Technical Recruiter writing an Executive Career Assessment.
You are evaluating a candidate based ONLY on structured platform intelligence supplied below.
Do NOT invent skills, experience, companies, projects, or technologies.
Every observation must reference a supplied metric.
Use professional recruiter language. No motivational clichés. No generic statements.

=== CANDIDATE INTELLIGENCE PROFILE ===

Candidate Persona: {exec_inputs.get('candidate_persona', 'N/A')}
Candidate Stage: {exec_inputs.get('candidate_stage', 'N/A')}
Experience: {exec_inputs.get('experience_years', 0)} years
Domain: {exec_inputs.get('domain', 'IT')}
Career Focus: {exec_inputs.get('career_focus', 'N/A')}
Primary Career Track: {exec_inputs.get('primary_career_track', 'N/A')}

--- Placement Intelligence ---
Profile Strength Index: {exec_inputs.get('placement_score_pct', 0)}%
Placement Outlook: {exec_inputs.get('placement_outlook', 'N/A')}
Improvement Potential: {exec_inputs.get('improvement_potential', 'N/A')}

--- Resume Intelligence ---
ATS Score: {exec_inputs.get('ats_score', 0)}/100
Resume Strength: {exec_inputs.get('resume_strength', 'N/A')}
Highest-Impact Resume Fix: {exec_inputs.get('highest_impact_resume_fix', 'N/A')}

--- Technical Intelligence ---
Technical Maturity: {exec_inputs.get('technical_maturity', 'N/A')}
Technical Depth: {exec_inputs.get('technical_depth_pct', 0)}%
Interview Readiness: {exec_inputs.get('interview_readiness_pct', 0)}%
Company Readiness: {exec_inputs.get('company_readiness', 'N/A')}

--- Skill Intelligence ---
Total Skills Detected: {exec_inputs.get('skill_count', 0)}
Skill Breadth (categories): {exec_inputs.get('skill_breadth', 0)}
Skill Utilization vs Top Role: {exec_inputs.get('skill_utilization_pct', 0)}%
Top 3 Strengths: {', '.join(exec_inputs.get('top_3_strengths', [])) or 'None identified'}
Portfolio Strength: {exec_inputs.get('portfolio_strength', 'N/A')}

--- Role Intelligence ---
Top Role: {exec_inputs.get('top_role', 'N/A')}
Top Role Match: {exec_inputs.get('top_role_match_pct', 0)}%

--- Gap Intelligence ---
Total Skill Gaps: {exec_inputs.get('total_skill_gaps', 0)}
Highest-Impact Missing Skill: {exec_inputs.get('highest_impact_skill') or 'None'}
Top 3 Critical Gaps: {', '.join(exec_inputs.get('top_3_gaps', [])) or 'None'}

--- Recruiter Signal ---
Recruiter Confidence: {exec_inputs.get('recruiter_confidence', 'N/A')}
Supporting Reasons: {'; '.join(exec_inputs.get('recruiter_confidence_reasons', [])) or 'N/A'}

=== INSTRUCTIONS ===

Write a 220-250 word Executive Career Assessment structured into exactly 5 sections:
1. Executive Overview (2-3 sentences: candidate persona, stage, overall readiness)
2. Technical Capability (2-3 sentences: maturity, depth, breadth, strengths)
3. Resume Quality (1-2 sentences: ATS score, formatting, highest-impact fix)
4. Placement Outlook (2 sentences: probability, outlook, improvement potential)
5. Recruiter Verdict (2 sentences: recruiter confidence, decisive recommendation)

Return STRICT JSON in this exact format:
{{
    "executive_overview": "...",
    "technical_capability": "...",
    "resume_quality": "...",
    "placement_outlook": "...",
    "recruiter_verdict": "..."
}}
Return ONLY JSON. No preamble. No markdown. No explanation outside the JSON.
"""

    try:
        model = get_gemini_model()
        response = model.generate_content(prompt)
        result = clean_json(response.text)

        required_keys = ["executive_overview", "technical_capability",
                         "resume_quality", "placement_outlook", "recruiter_verdict"]
        for k in required_keys:
            if k not in result or not result[k]:
                result[k] = safe_fallback["sections"].get(k, "")

        full_text = " ".join([
            result.get("executive_overview", ""),
            result.get("technical_capability", ""),
            result.get("resume_quality", ""),
            result.get("placement_outlook", ""),
            result.get("recruiter_verdict", ""),
        ]).strip()

        return {"assessment": full_text, "sections": result, "source": "llm"}

    except Exception as e:
        logger.error(json.dumps({
            "event": "llm_executive_primary_failed",
            "error_type": type(e).__name__,
            "error_message": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        if configure_fallback():
            try:
                model = get_gemini_model()
                response = model.generate_content(prompt)
                result = clean_json(response.text)
                full_text = " ".join([
                    result.get("executive_overview", ""),
                    result.get("technical_capability", ""),
                    result.get("resume_quality", ""),
                    result.get("placement_outlook", ""),
                    result.get("recruiter_verdict", ""),
                ]).strip()
                return {"assessment": full_text, "sections": result, "source": "llm"}
            except Exception as inner_e:
                logger.error(json.dumps({
                    "event": "llm_executive_fallback_failed",
                    "error_type": type(inner_e).__name__,
                    "error_message": str(inner_e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }))
        return safe_fallback


def _build_deterministic_assessment(cip: dict) -> dict:
    """
    Deterministic fallback assessment when LLM is unavailable.
    Builds a structured assessment from CIP metrics alone — no LLM.
    Returns the same schema as the LLM path.
    """
    e = cip.get("meta", {}).get("executive_summary_inputs", {})
    resume = cip.get("resume", {})
    placement = cip.get("placement", {})

    persona = e.get("candidate_persona", "Software Engineering Candidate")
    stage = e.get("candidate_stage", "Emerging")
    score = e.get("placement_score_pct", 0)
    ats = e.get("ats_score", 0)
    top_role = e.get("top_role", "Software Engineer")
    match_pct = e.get("top_role_match_pct", 0)
    maturity = e.get("technical_maturity", "Foundational")
    depth = e.get("technical_depth_pct", 0)
    skill_count = e.get("skill_count", 0)
    breadth = e.get("skill_breadth", 0)
    strengths = e.get("top_3_strengths", [])
    gaps_list = e.get("top_3_gaps", [])
    portfolio = e.get("portfolio_strength", "Limited")
    recruiter_conf = e.get("recruiter_confidence", "Moderate")
    outlook = e.get("placement_outlook", "Neutral")
    experience = e.get("experience_years", 0)
    impact_fix = e.get("highest_impact_resume_fix", "Improve resume structure")
    impact_skill = e.get("highest_impact_skill")
    resume_strength = resume.get("strength", "Average")

    strengths_str = ", ".join(strengths) if strengths else "foundational technical skills"
    gaps_str = ", ".join(gaps_list) if gaps_list else "minor technical gaps"

    overview = (
        f"This candidate presents as a {persona} at the {stage} stage "
        f"with a placement readiness score of {score}%. "
        f"The profile targets {top_role} with a {match_pct}% role alignment and "
        f"{experience} year{'s' if experience != 1 else ''} of relevant experience. "
        f"Overall, the profile reflects {'solid preparation for competitive roles' if score >= 60 else 'meaningful growth potential with focused development required'}."
    )
    tech = (
        f"Technical capability is assessed at the {maturity} level with a depth score of {depth}%, "
        f"spanning {breadth} skill categories across {skill_count} verified competencies. "
        f"Core strengths in {strengths_str} directly support the {top_role} target. "
        f"{'Practical portfolio evidence reinforces these technical claims.' if portfolio in ['Strong', 'Moderate'] else 'A demonstrable project portfolio is the primary missing evidence of practical capability.'}"
    )
    resume_txt = (
        f"The resume achieved an ATS score of {ats}/100, rated {resume_strength}. "
        f"The single highest-impact improvement: {impact_fix}."
    )
    outlook_txt = (
        f"Placement outlook is {outlook} at the current {score}% readiness level. "
        f"Addressing critical gaps in {gaps_str} represents the highest-leverage path to improved screening outcomes."
    )
    if recruiter_conf in ["High", "Very High"]:
        verdict = (
            f"Recruiter confidence is {recruiter_conf}, supported by an ATS score of {ats} and {match_pct}% role alignment. "
            f"Recommendation: advance to technical screening with focused preparation on {impact_skill or 'remaining gaps'}."
        )
    else:
        verdict = (
            f"Recruiter confidence remains {recruiter_conf} at this stage. "
            f"Priority action: acquire {impact_skill or 'core role competencies'} and improve resume ATS quality before active application."
        )

    full_text = f"{overview} {tech} {resume_txt} {outlook_txt} {verdict}"
    return {
        "assessment": full_text,
        "sections": {
            "executive_overview": overview,
            "technical_capability": tech,
            "resume_quality": resume_txt,
            "placement_outlook": outlook_txt,
            "recruiter_verdict": verdict,
        },
        "source": "deterministic_fallback",
    }
