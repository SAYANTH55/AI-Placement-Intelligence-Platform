import warnings
# Suppress non-actionable FutureWarning from google-api-core about Python 3.10 EOL.
# This does not affect functionality; upgrade Python when convenient (3.11+).
warnings.filterwarnings("ignore", category=FutureWarning, module="google.api_core")

import sys
import os

from dotenv import load_dotenv
load_dotenv(override=True)

import sys
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Add backend directory and parent workspace root to sys.path so imports work from different launch contexts
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Add the repository root (one level up from backend) so `api` can be imported
REPO_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
sys.path.append(REPO_ROOT)
sys.path.append(BASE_DIR)
# Ensure domains package is discoverable
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from api import endpoints, auth, resume_routes, engine_routes, learning_routes, outcome_routes, ats_routes, recommendation_routes
from database.db import engine
from database import models

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from api.limiter import limiter

# Create All Unified Database Tables
models.Base.metadata.create_all(bind=engine)

# Auto-seed if database is empty (safe — won't overwrite existing data)
try:
    from database.db import SessionLocal as _SL
    _db = _SL()
    _user_count = _db.query(models.User).count()
    _db.close()
    if _user_count == 0:
        import logging as _logging
        _logging.getLogger(__name__).info("Database is empty — running auto-seed...")
        import sys as _sys, os as _os
        _sys.path.insert(0, BASE_DIR)
        from seed_placement import seed as _seed
        _seed()
except Exception as _e:
    import logging as _logging
    _logging.getLogger(__name__).warning(f"Auto-seed skipped: {_e}")

# ── Auto-generate missing ML model files (one-time, first boot) ─────────────
try:
    import sys as _sys
    _sys.path.insert(0, BASE_DIR)
    from ai_model.train_models import ensure_models_exist as _ensure_models
    _ensure_models()
except Exception as _me:
    import logging as _logging
    _logging.getLogger(__name__).warning(f"Model bootstrap skipped: {_me}")

app = FastAPI(
    title="AI Placement Intelligence Platform API",
    description="AI-powered placement prediction and skill matching",
    version="4.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow all origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api import pr_routes, drive_routes, application_routes, round_routes, dashboard_routes, company_routes, department_routes, placement_update_routes, application_profile_routes, provisioning_routes, report_routes

os.makedirs(os.path.join(BASE_DIR, "uploads/resumes"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=os.path.join(BASE_DIR, "uploads")), name="uploads")

# Include routers
app.include_router(endpoints.router, tags=["resume-analysis"])
app.include_router(auth.router, tags=["authentication"])
app.include_router(resume_routes.router, tags=["resume-history"])
app.include_router(engine_routes.router, tags=["engines"])
app.include_router(learning_routes.router, tags=["learning-layer"])
app.include_router(outcome_routes.router, tags=["outcomes"])
app.include_router(pr_routes.router)
app.include_router(drive_routes.router)
app.include_router(application_routes.router)
app.include_router(application_profile_routes.router)
app.include_router(round_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(company_routes.router)
app.include_router(department_routes.router)
app.include_router(placement_update_routes.router)
app.include_router(provisioning_routes.router)
app.include_router(report_routes.router)
app.include_router(ats_routes.router)  # ← ATS Analyzer (isolated, additive)
app.include_router(recommendation_routes.router)  # ← Job Recommendation Engine

# Warm up JD embeddings in background on startup
@app.on_event("startup")
async def startup_event():
    import threading
    from ai_model.job_recommendation_engine import warmup
    t = threading.Thread(target=warmup, daemon=True)
    t.start()


@app.get("/")
async def root():
    return {
        "message": "Welcome to AI Placement Intelligence Platform API v2",
        "features": [
            "Resume analysis with improved AI/ML scoring",
            "Resume history tracking",
            "Job description comparison",
            "Rate limiting for abuse prevention"
        ],
        "docs": "/docs"
    }

@app.get("/debug/db-path")
async def get_db_path():
    from database.db import SQLALCHEMY_DATABASE_URL
    import os
    return {
        "database_url": SQLALCHEMY_DATABASE_URL,
        "absolute_path": os.path.abspath("ai_placement.db"),
        "cwd": os.getcwd()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api_version": "2.0.0",
        "features": "All systems operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
