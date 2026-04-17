"""
Enhanced API endpoints for resume history, JD comparison, and PDF export
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from database.db import get_db as get_session
from database.models import ResumeAnalysis, User
from ai_model.job_matcher.jd_analyzer import parse_job_description
from ai_model.job_matcher.matcher import calculate_role_matches

router = APIRouter(prefix="/api", tags=["resume-history"])


class ResumeHistoryResponse(BaseModel):
    id: int
    filename: str
    created_at: datetime
    top_matching_role: str
    top_role_match_percent: int
    placement_readiness: str
    diversity_score: int
    
    class Config:
        from_attributes = True


class ResumeDetailResponse(ResumeHistoryResponse):
    extracted_skills: List[str]
    experience_years: int
    placement_probability: float
    role_matches: dict
    skill_gaps: dict


class JDComparisonRequest(BaseModel):
    job_description: str
    resume_analysis_id: Optional[int] = None  # If comparing to specific resume
    extracted_skills: Optional[List[str]] = None  # Or provide skills directly


class JDComparisonResponse(BaseModel):
    jd_insights: dict
    role_match: dict
    gap_analysis: dict


@router.get("/resume-history", response_model=List[ResumeHistoryResponse])
async def get_resume_history(
    user_id: int = Query(..., description="User ID"),
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    session: Session = Depends(get_session)
):
    """
    📋 Get user's resume analysis history
    
    Returns: List of past analyses with summary scores
    """
    try:
        analyses = session.query(ResumeAnalysis).filter(
            ResumeAnalysis.user_id == user_id
        ).order_by(
            ResumeAnalysis.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        if not analyses:
            return []
        
        return analyses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        session.close()


@router.get("/resume-history/{analysis_id}", response_model=ResumeDetailResponse)
async def get_resume_detail(
    analysis_id: int,
    user_id: int = Query(...),
    session: Session = Depends(get_session)
):
    """
    📄 Get full details of a specific resume analysis
    
    Returns: Complete analysis with all match details
    """
    try:
        analysis = session.query(ResumeAnalysis).filter(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == user_id
        ).first()
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@router.delete("/resume-history/{analysis_id}")
async def delete_resume_analysis(
    analysis_id: int,
    user_id: int = Query(...),
    session: Session = Depends(get_session)
):
    """🗑️ Delete a resume analysis from history"""
    try:
        analysis = session.query(ResumeAnalysis).filter(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == user_id
        ).first()
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        session.delete(analysis)
        session.commit()
        
        return {"status": "success", "message": "Analysis deleted"}
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@router.post("/compare-jd", response_model=JDComparisonResponse)
async def compare_resume_to_jd(
    request: JDComparisonRequest,
    user_id: int = Query(...),
    session: Session = Depends(get_session)
):
    """
    🔄 Compare resume to job description
    
    Input: Job description text (paste from LinkedIn, indeed, etc)
    Output: Match score, missing skills, better roles for this JD
    """
    try:
        # Parse the job description
        from ai_model.job_matcher.jd_analyzer import parse_job_description
        jd_analysis = parse_job_description(request.job_description)
        
        # Get skills to compare
        if request.resume_analysis_id:
            analysis = session.query(ResumeAnalysis).filter(
                ResumeAnalysis.id == request.resume_analysis_id,
                ResumeAnalysis.user_id == user_id
            ).first()
            if not analysis:
                raise HTTPException(status_code=404, detail="Resume analysis not found")
            skills = analysis.extracted_skills
        elif request.extracted_skills:
            skills = request.extracted_skills
        else:
            raise HTTPException(status_code=400, detail="Provide either resume_analysis_id or extracted_skills")
        
        # Calculate match to JD requirements
        jd_required_skills = jd_analysis.get("required_skills", [])
        from ai_model.utils.skill_normalizer import calculate_weighted_match, get_skill_diversity_score
        
        match_result = calculate_weighted_match(
            skills,
            jd_required_skills,
            role_name=jd_analysis.get("inferred_roles", [{}])[0].get("name", "Unknown"),
            use_weights=False  # Use simple weighting for JD comparison
        )
        
        # Get diversity
        diversity = get_skill_diversity_score(skills)
        
        # Find gap
        gap_analysis = {
            "missing_skills": match_result["missing_skills"],
            "present_skills": match_result["present_skills"],
            "match_score": match_result["match_percent"],
            "learning_path": [
                {
                    "skill": skill,
                    "importance": "high" if skill in jd_required_skills[:3] else "medium"
                }
                for skill in match_result["missing_skills"]
            ]
        }
        
        return {
            "jd_insights": jd_analysis,
            "role_match": {
                "match_percent": match_result["match_percent"],
                "confidence": match_result["confidence"],
                "inferred_roles": jd_analysis.get("inferred_roles", [])
            },
            "gap_analysis": gap_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")
    finally:
        session.close()


@router.get("/export-analysis/{analysis_id}")
async def export_analysis_as_pdf(
    analysis_id: int,
    user_id: int = Query(...),
    session: Session = Depends(get_session)
):
    """
    📥 Export resume analysis as PDF report
    
    Returns: PDF file with scores, gaps, recommendations
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from io import BytesIO
        import io
        
        analysis = session.query(ResumeAnalysis).filter(
            ResumeAnalysis.id == analysis_id,
            ResumeAnalysis.user_id == user_id
        ).first()
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Create PDF in memory
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#F97316',
            spaceAfter=30,
        )
        story.append(Paragraph("Resume Analysis Report", title_style))
        story.append(Spacer(1, 0.3 * 1))
        
        # Summary stats
        summary_data = [
            ["Metric", "Value"],
            ["Top Matching Role", analysis.top_matching_role or "N/A"],
            ["Match Score", f"{analysis.top_role_match_percent}%"],
            ["Placement Readiness", analysis.placement_readiness or "N/A"],
            ["Skill Diversity", f"{analysis.diversity_score}%"],
            ["Experience", f"{analysis.experience_years} years"],
        ]
        
        summary_table = Table(summary_data, colWidths=[300, 200])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), '#F97316'),
            ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, '#cccccc'),
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 0.5 * 1))
        
        # Skills section
        story.append(Paragraph("Extracted Skills", styles['Heading2']))
        skills_text = ", ".join(analysis.extracted_skills[:15])
        if len(analysis.extracted_skills) > 15:
            skills_text += f", ... and {len(analysis.extracted_skills) - 15} more"
        story.append(Paragraph(skills_text, styles['Normal']))
        story.append(Spacer(1, 0.3 * 1))
        
        # Build PDF
        doc.build(story)
        
        pdf_bytes = pdf_buffer.getvalue()
        
        return {
            "status": "success",
            "message": "PDF generated",
            "filename": f"analysis_{analysis_id}_{datetime.now().strftime('%Y%m%d')}.pdf",
            "size_bytes": len(pdf_bytes)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")
    finally:
        session.close()
