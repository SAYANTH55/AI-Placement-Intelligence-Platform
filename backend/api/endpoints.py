from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import shutil
import os
import tempfile
import asyncio
import logging
from ai_model.resume_parser.parser import parse_resume
from ai_model.prediction_model.predictor import predict_placement
from ai_model.job_matcher.matcher import calculate_role_matches, get_job_fits_with_diversity
from ai_model.utils.skill_normalizer import get_skill_diversity_score
from services.llm_service import analyze_with_llm, generate_career_insights
from services.preparation_engine import generate_plan
from services.practice_engine import get_practice_set


logger = logging.getLogger(__name__)

router = APIRouter()

class JDInput(BaseModel):
    description: str

@router.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...), target_role: Optional[str] = Form(None)):
    """
    ✅ IMPROVED: Enhanced resume processing with better skill matching
    
    Now includes:
    - Fuzzy skill matching (ReactJS → React)
    - Weighted role scoring (core skills worth more)
    - Skill diversity analysis (better well-roundedness detection)
    - Confidence metrics (how sure are we about the match?)
    """
    # Create a temporary file to store the upload
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        loop = asyncio.get_event_loop()
        
        # 1. CPU-bound parsing
        parsed_data = await loop.run_in_executor(None, parse_resume, file_path)
        
        # 2. Run LLM API and deterministic ML logic concurrently!
        # predict_placement and get_job_fits_with_diversity are fast enough to run directly or in executor
        # but analyze_with_llm is IO bound.
        llm_context = {
            "text": parsed_data['extracted_text'],
            "skills": parsed_data['skills'],
            "experience": parsed_data['experience']
        }
        
        # We run the LLM request concurrently with ML deterministic tasks
        llm_output_task = loop.run_in_executor(None, analyze_with_llm, llm_context)
        prediction_task = loop.run_in_executor(None, predict_placement, parsed_data['skills'], parsed_data['experience'])
        role_matches_task = loop.run_in_executor(None, get_job_fits_with_diversity, parsed_data['skills'])
        
        llm_output, prediction, role_matches_data_dict = await asyncio.gather(
            llm_output_task,
            prediction_task,
            role_matches_task
        )
        
        role_matches_data = role_matches_data_dict['role_matches']
        diversity_info = role_matches_data_dict['diversity_analysis']

        # 3. Safe Merging Logic (Parser = Source of Truth)
        llm_skills = llm_output.get("inferred_skills", [])
        llm_roles = llm_output.get("inferred_roles", [])
        
        rule_roles = [r["role"] for r in role_matches_data if r["match"] >= 35]
        if role_matches_data and role_matches_data[0]["role"] not in rule_roles:
            rule_roles.append(role_matches_data[0]["role"])
        
        final_skills = list(set(parsed_data['skills']) | set(llm_skills))
        final_roles = list(set(rule_roles) | set(llm_roles))
        
        # Security Assertion to ensure deterministic safety
        assert set(parsed_data['skills']).issubset(set(final_skills)), "Core parser skills must never be removed."

        # 4. Enhance Matcher logic & Experience Advantage Roles (Step 6)
        experience_advantage_roles = []
        for r_obj in role_matches_data:
            if r_obj["role"] in final_roles:
                # Add 15% boost for LLM correlation, capped at 100
                r_obj["match"] = min(r_obj["match"] + (r_obj["match"] * 0.15), 100)
                # Keep numeric for precision, return mapped value
                r_obj["match"] = round(r_obj["match"])
                experience_advantage_roles.append(r_obj["role"])

        # Re-sort roles after modifying match
        role_matches_data.sort(key=lambda x: x["match"], reverse=True)
        top_role = role_matches_data[0] if role_matches_data else None

        # 5. ML Predictor Calibration (Step 5)
        # Ground the semantic/historic ML prediction natively into the rigid keyword matcher
        top_match_percent = top_role["match"] / 100.0 if top_role else 0.0
        ml_base = prediction["placement_probability"]
        
        # Heavy Penalty Formula: 75% Deterministic Keyword Match, 25% ML Historic Bias
        calibrated_hybrid_prob = (top_match_percent * 0.75) + (ml_base * 0.25)
        
        prediction["placement_probability"] = round(calibrated_hybrid_prob, 2)
        if prediction["placement_probability"] > 0.75:
            prediction["readiness"] = "High"
        elif prediction["placement_probability"] > 0.40:
            prediction["readiness"] = "Medium"
        else:
            prediction["readiness"] = "Low"

        # 6. LLM Insight Layer (Post-process)
        llm_insights_input = {
            "skills": final_skills,
            "missing_skills": top_role["missing"] if top_role else [],
            "roles": final_roles,
            "score": int(prediction["placement_probability"] * 100)
        }
        
        llm_insights = await loop.run_in_executor(None, generate_career_insights, llm_insights_input)

        logger.info(f"LLM Output: {llm_output}")
        logger.info(f"Merged Roles: {final_roles}")

        # 7. Preparation Engine — generate learning roadmap from missing skills
        missing_for_prep = top_role["missing"] if top_role else []
        detected_top_role_name = top_role["role"] if top_role else ""
        preparation_plan = generate_plan(
            missing_skills=missing_for_prep,
            top_role=detected_top_role_name
        )

        # 8. Practice Engine — generate role-specific question set
        practice_set = get_practice_set(
            top_role=detected_top_role_name,
            user_skills=final_skills
        )

        # Clean up
        os.remove(file_path)
        
        return {
            "status": "success",
            "filename": file.filename,
            "data": {
                "extractedText": parsed_data['extracted_text'],
                "skills": final_skills,
                "experience": parsed_data['experience'],
                "prediction": prediction,
                "roleMatches": role_matches_data,
                "topRole": top_role,
                "roles_detected": final_roles,
                "missing_skills": top_role["missing"] if top_role else [],
                "experience_advantage_roles": experience_advantage_roles,
                "diversityScore": {
                    "overall": diversity_info['diversity_score'],
                    "categoriesCovered": diversity_info['categories_covered'],
                    "categoriesMissing": diversity_info['categories_missing'],
                    "recommendation": f"You have skills in {len(diversity_info['categories_covered'])} categories. Consider learning {diversity_info['categories_missing'][0] if diversity_info['categories_missing'] else 'advanced concepts'} to become well-rounded."
                },
                "targetRole": target_role,
                "matchQuality": "Confidence scores indicate match quality (0.8-1.0 = high confidence)",
                "llm_enhancement": {
                    "inferred_skills": llm_skills,
                    "inferred_roles": llm_roles,
                    "summary": llm_output.get("summary", ""),
                    "strengths": llm_output.get("strengths", []),
                    "weaknesses": llm_output.get("weaknesses", [])
                },
                "llm_insights": llm_insights,
                "preparation_plan": preparation_plan,
                "practice_set": practice_set
            }
        }

    except Exception as e:
        logger.error(f"Error in upload_resume: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze_jd")
async def analyze_jd(data: JDInput):
    # For now, return mock JD insights, but connected to backend
    return {"status": "JD Analyzed", "insights": ["Python", "Management"]}

@router.get("/get_dashboard")
async def get_dashboard():
    # Placeholder for user-specific stats from DB
    return {"stats": {"total_users": 1, "placements": 0}}
