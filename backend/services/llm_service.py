import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

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
    return genai.GenerativeModel(
        'gemini-1.5-flash-latest',
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
        logger.error(f"LLM analyze_with_llm primary failure: {str(e)}", exc_info=True)
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
                logger.error(f"LLM analyze_with_llm fallback failure: {str(inner_e)}", exc_info=True)
        return safe_fallback


def generate_career_insights(structured_data: dict) -> dict:
    """
    Post-process LLM Insight Layer. Generates dynamic career advice based on the 
    determined missing skills, final roles, and ML placement score.
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
        logger.error(f"LLM generate_career_insights primary failure: {str(e)}", exc_info=True)
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
                logger.error(f"LLM generate_career_insights fallback failure: {str(inner_e)}", exc_info=True)
        return safe_fallback
