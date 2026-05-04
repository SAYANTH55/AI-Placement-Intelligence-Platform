"""
api/learning_routes.py
──────────────────────
REST API surface for the Learning Layer.

Endpoints
─────────
  POST   /learning/predict          End-to-end ML prediction for a user profile
  POST   /learning/log              Log a feedback interaction event
  POST   /learning/train            Trigger model training pipeline
  GET    /learning/status           Health + model info for the Learning Layer
  GET    /learning/dataset/refresh  Rebuild & inspect datasets without retraining
  POST   /learning/recommend        Rank candidate learning paths by expected gain
  GET    /learning/model/info       Detailed currently-loaded model metadata
  POST   /learning/path/outcome     Record a completed learning path outcome
"""

import logging
from fastapi  import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing   import Optional, List

from learning_layer.learning_service import learning_service
from learning_layer.inference_engine import inference_engine
from learning_layer.feature_engineer import engineer_features, explain_features

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/learning", tags=["learning-layer"])


# ──────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ──────────────────────────────────────────────────────────────────────────────

class SkillEntry(BaseModel):
    name:       str
    score:      float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    stability:  float = Field(ge=0.0, le=1.0, default=0.5)


class PredictRequest(BaseModel):
    user_id:    Optional[str] = "anonymous"
    skill_vector: Optional[dict] = {}       # {skill_name: {score, confidence, ...}}
    trajectory:   Optional[dict] = {}       # {velocity, acceleration, trend}
    behavior:     Optional[dict] = {}       # {accuracy, consistency, weak_areas, ...}
    graph_insights: Optional[dict] = {}     # {expanded_gaps, root_cause_gaps, ...}
    time_spent_hours: Optional[float] = 0.0
    attempts:         Optional[float] = 0.0


class FeedbackLogRequest(BaseModel):
    user_id:           str
    before_score:      float = Field(ge=0.0, le=1.0)
    after_score:       float = Field(ge=0.0, le=1.0)
    accuracy:          Optional[float] = 0.0
    consistency:       Optional[float] = 0.0
    time_spent_hours:  Optional[float] = 0.0
    attempts:          Optional[int]   = 0
    topics_completed:  Optional[List[str]] = []
    weak_areas_before: Optional[List[str]] = []
    weak_areas_after:  Optional[List[str]] = []
    graph_gap_depth:   Optional[int]       = 0
    source:            Optional[str]       = "api"


class TrainRequest(BaseModel):
    mode:  Optional[str]  = "classification"   # "classification" | "regression"
    force: Optional[bool] = False              # skip minimum-sample guard


class PathOutcomeRequest(BaseModel):
    user_id:      str
    path_id:      str
    path_topics:  List[str]
    score_before: float = Field(ge=0.0, le=1.0)
    score_after:  float = Field(ge=0.0, le=1.0)


class RecommendRequest(BaseModel):
    user_id:         str
    candidate_paths: List[dict]   # [{"path_id": str, "topics": [...], ...}]
    top_k:           Optional[int] = 3


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/predict")
async def predict_placement_readiness(req: PredictRequest):
    """
    End-to-end ML/heuristic prediction for a user's placement readiness.

    Accepts a raw intelligence profile and returns a prediction dict
    with score, confidence, time-to-ready, risk level, and source.
    """
    try:
        intelligence_profile = {
            "skill_vector":      req.skill_vector,
            "trajectory":        req.trajectory,
            "behavior":          req.behavior,
            "time_spent_hours":  req.time_spent_hours,
            "attempts":          req.attempts,
        }
        prediction = learning_service.get_prediction(
            intelligence_profile=intelligence_profile,
            graph_insights=req.graph_insights,
            user_id=req.user_id,
        )
        features  = learning_service.generate_features(intelligence_profile, req.graph_insights)
        explained = learning_service.explain(features)

        return {
            "status":     "ok",
            "user_id":    req.user_id,
            "prediction": prediction,
            "features":   explained,
        }
    except Exception as exc:
        logger.error("Predict endpoint failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/log")
async def log_feedback(req: FeedbackLogRequest):
    """
    Persist a single feedback interaction record to the training dataset.
    Append-only — no data is ever overwritten.
    """
    try:
        success = learning_service.log_result(req.dict())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to persist feedback record.")
        return {
            "status":  "logged",
            "user_id": req.user_id,
            "delta":   round(req.after_score - req.before_score, 4),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Feedback log endpoint failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/train")
async def trigger_training(req: TrainRequest, background_tasks: BackgroundTasks):
    """
    Trigger the ML model training pipeline.

    Runs in the background so the HTTP response is immediate.
    Poll /learning/status to check when the new model is loaded.
    """
    try:
        # We kick off training asynchronously so the API stays responsive
        def _train():
            result = learning_service.trigger_training_pipeline(
                mode=req.mode,
                force=req.force,
            )
            logger.info("Background training complete: %s", result)

        background_tasks.add_task(_train)
        return {
            "status":  "training_queued",
            "message": "Training pipeline started in the background. Poll /learning/status for updates.",
            "mode":    req.mode,
            "force":   req.force,
        }
    except Exception as exc:
        logger.error("Train endpoint failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/status")
async def learning_layer_status():
    """
    Return a full health snapshot of the Learning Layer:
    model availability, version, feedback log count, retrain flag.
    """
    try:
        return {
            "status": "ok",
            **learning_service.status(),
        }
    except Exception as exc:
        logger.error("Status endpoint failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/dataset/refresh")
async def refresh_dataset():
    """
    Rebuild classification and regression datasets from the feedback log
    and return their statistics. Does NOT retrain the model.
    """
    try:
        stats = learning_service.refresh_dataset()
        return {"status": "ok", "dataset_stats": stats}
    except Exception as exc:
        logger.error("Dataset refresh failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/model/info")
async def get_model_info():
    """Return detailed metadata about the currently loaded ML model."""
    try:
        return {
            "status":     "ok",
            "model_info": inference_engine.model_info(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/path/outcome")
async def record_path_outcome(req: PathOutcomeRequest):
    """
    Record the performance gain from a completed learning path.
    This feeds the recommendation engine's ranking data.
    """
    try:
        learning_service.record_learning_path_outcome(
            user_id=req.user_id,
            path_id=req.path_id,
            path_topics=req.path_topics,
            score_before=req.score_before,
            score_after=req.score_after,
        )
        return {
            "status":  "recorded",
            "path_id": req.path_id,
            "delta":   round(req.score_after - req.score_before, 4),
        }
    except Exception as exc:
        logger.error("Path outcome endpoint failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/recommend")
async def recommend_paths(req: RecommendRequest):
    """
    Rank candidate learning paths by expected performance gain for this user,
    based on historical learning path outcomes.
    """
    try:
        ranked = learning_service.recommend_paths(
            user_id=req.user_id,
            candidate_paths=req.candidate_paths,
            top_k=req.top_k,
        )
        return {
            "status":   "ok",
            "user_id":  req.user_id,
            "ranked_paths": ranked,
        }
    except Exception as exc:
        logger.error("Recommend endpoint failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
