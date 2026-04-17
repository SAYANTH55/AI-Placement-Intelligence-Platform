from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import shutil
import os
import tempfile
from ai_model.resume_parser.parser import parse_resume
from ai_model.prediction_model.predictor import predict_placement
from ai_model.job_matcher.matcher import calculate_role_matches

router = APIRouter()

class JDInput(BaseModel):
    description: str

@router.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...), target_role: Optional[str] = Form(None)):
    # Create a temporary file to store the upload
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse the resume using local ML logic
        parsed_data = parse_resume(file_path)
        
        # Predict placement readiness
        prediction = predict_placement(parsed_data['skills'], parsed_data['experience'])
        
        # Calculate role matches (prioritize target_role if provided)
        role_matches = calculate_role_matches(parsed_data['skills'], target_role=target_role)

        # Clean up
        os.remove(file_path)
        
        return {
            "status": "success",
            "filename": file.filename,
            "data": {
                "extractedText": parsed_data['extracted_text'],
                "skills": parsed_data['skills'],
                "experience": parsed_data['experience'],
                "prediction": prediction,
                "roleMatches": role_matches,
                "targetRole": target_role
            }
        }
    except Exception as e:
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
