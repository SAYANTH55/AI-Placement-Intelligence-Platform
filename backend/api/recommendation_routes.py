"""
recommendation_routes.py
------------------------
API routes for the Job Recommendation Engine and ML prediction utilities.

Endpoints:
  POST /api/recommendations/jobs       — Top N job matches for a skill set
  POST /api/recommendations/domain     — Predict career domain from resume text
  POST /api/recommendations/role       — Predict top roles from resume text
  GET  /api/recommendations/warmup     — Pre-load embeddings (call on startup)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


# ── Request / Response models ──────────────────────────────────────────────

class JobRecommendRequest(BaseModel):
    skills: List[str]
    top_n: Optional[int] = 5
    domain_filter: Optional[str] = None


class JobRecommendResponse(BaseModel):
    jobs: List[Dict[str, Any]]
    engine: str  # "sentence-transformers" or "tfidf-cosine"
    total: int


class DomainPredictRequest(BaseModel):
    resume_text: str


class RolePredictRequest(BaseModel):
    skills_text: str


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/jobs", response_model=JobRecommendResponse)
async def recommend_jobs(request: JobRecommendRequest):
    """
    🎯 Semantic Job Recommendation Engine

    Accepts a list of candidate skills and returns the top N semantically
    matched job descriptions from our curated corpus using:
      - SentenceTransformer all-MiniLM-L6-v2 (if available)
      - TF-IDF cosine similarity (fallback)
    """
    try:
        from ai_model.job_recommendation_engine import get_top_jobs, _check_st_available
        if not request.skills:
            raise HTTPException(status_code=400, detail="skills list cannot be empty")

        jobs = get_top_jobs(
            candidate_skills=request.skills,
            n=min(request.top_n or 5, 15),
            domain_filter=request.domain_filter,
        )

        engine = "sentence-transformers" if _check_st_available() else "tfidf-cosine"

        return JobRecommendResponse(jobs=jobs, engine=engine, total=len(jobs))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


@router.post("/domain")
async def predict_domain(request: DomainPredictRequest):
    """
    🌐 Career Domain Classifier

    Predicts the career domain (IT, Finance, Healthcare, etc.) from
    resume text using the trained XGBoost Domain Classifier.
    """
    try:
        from ai_model.job_recommendation_engine import predict_domain
        result = predict_domain(request.resume_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Domain prediction error: {str(e)}")


@router.post("/role")
async def predict_role(request: RolePredictRequest):
    """
    🎭 Role Predictor

    Predicts the top matching job roles from a resume skills string
    using the trained XGBoost Role Predictor with confidence scores.
    """
    try:
        from ai_model.job_recommendation_engine import predict_role
        result = predict_role(request.skills_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Role prediction error: {str(e)}")


@router.get("/warmup")
async def warmup_engine(background_tasks: BackgroundTasks):
    """
    🔥 Pre-warm the recommendation engine.

    Loads and caches JD embeddings in the background.
    Call this endpoint once after server startup to avoid
    cold-start latency on the first /jobs request.
    """
    from ai_model.job_recommendation_engine import warmup
    background_tasks.add_task(warmup)
    return {"status": "warming up in background", "message": "JD embeddings will be cached for fast future requests."}


@router.get("/corpus/stats")
async def corpus_stats():
    """📊 Returns statistics about the JD corpus."""
    try:
        from ai_model.data.jd_corpus import get_jd_corpus
        corpus = get_jd_corpus()
        domains = {}
        for jd in corpus:
            d = jd.get("domain", "Unknown")
            domains[d] = domains.get(d, 0) + 1
        return {
            "total_jds": len(corpus),
            "by_domain": domains,
            "avg_skills_per_jd": round(sum(len(jd.get("skills", [])) for jd in corpus) / len(corpus), 1),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
