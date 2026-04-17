import sys
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api import endpoints, auth, resume_routes
from database.db import engine
from database import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Placement Intelligence Platform API",
    description="AI-powered placement prediction and skill matching",
    version="2.0.0"
)

# Allow all origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints.router, tags=["resume-analysis"])
app.include_router(auth.router, tags=["authentication"])
app.include_router(resume_routes.router, tags=["resume-history"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to AI Placement Intelligence Platform API v2",
        "features": [
            "Resume analysis with improved AI/ML scoring",
            "Resume history tracking",
            "Job description comparison",
            "PDF export reports",
            "Rate limiting for abuse prevention"
        ],
        "docs": "/docs"
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
