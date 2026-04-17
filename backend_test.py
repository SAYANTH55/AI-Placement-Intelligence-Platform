#!/usr/bin/env python
"""
Backend Diagnostic Script
Tests all critical imports and dependencies before starting the server
Run this from the project root: python backend_test.py
"""

import sys
import os

# Add parent directory to path like main.py does
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

print("=" * 60)
print("AI Placement Intelligence Platform - Backend Diagnostics")
print("=" * 60)
print()

# Test 1: Python version
print("[1/8] Checking Python version...")
print(f"   Version: {sys.version}")
if sys.version_info < (3, 8):
    print("   ❌ ERROR: Python 3.8+ required")
    sys.exit(1)
print("   ✓ Python version OK")
print()

# Test 2: Core dependencies
print("[2/8] Checking core dependencies...")
try:
    import fastapi
    print(f"   ✓ FastAPI: {fastapi.__version__}")
except ImportError as e:
    print(f"   ❌ FastAPI import failed: {e}")
    sys.exit(1)

try:
    import sqlalchemy
    print(f"   ✓ SQLAlchemy: {sqlalchemy.__version__}")
except ImportError as e:
    print(f"   ❌ SQLAlchemy import failed: {e}")
    sys.exit(1)

try:
    import pydantic
    print(f"   ✓ Pydantic: {pydantic.__version__}")
except ImportError as e:
    print(f"   ❌ Pydantic import failed: {e}")
    sys.exit(1)

print()

# Test 3: AI/ML dependencies
print("[3/8] Checking AI/ML dependencies...")
try:
    import spacy
    print(f"   ✓ spacy: {spacy.__version__}")
except ImportError as e:
    print(f"   ❌ spacy import failed: {e}")
    sys.exit(1)

try:
    import pdfplumber
    print(f"   ✓ pdfplumber")
except ImportError as e:
    print(f"   ❌ pdfplumber import failed: {e}")
    sys.exit(1)

try:
    import docx
    print(f"   ✓ python-docx")
except ImportError as e:
    print(f"   ❌ python-docx import failed: {e}")
    sys.exit(1)

print()

# Test 4: Load spaCy model
print("[4/8] Loading spaCy model...")
try:
    nlp = spacy.load("en_core_web_sm")
    print(f"   ✓ spaCy model loaded: en_core_web_sm")
except OSError as e:
    print(f"   ❌ spaCy model not found: {e}")
    print("   Run: python -m spacy download en_core_web_sm")
    sys.exit(1)

print()

# Test 5: Database imports
print("[5/8] Checking database module...")
try:
    from backend.database.db import engine, SessionLocal
    print(f"   ✓ Database engine initialized")
except Exception as e:
    print(f"   ❌ Database module failed: {e}")
    sys.exit(1)

print()

# Test 6: API imports
print("[6/8] Checking API routes...")
try:
    from backend.api import endpoints
    print(f"   ✓ endpoints module loaded")
except Exception as e:
    print(f"   ❌ endpoints import failed: {e}")
    sys.exit(1)

try:
    from backend.api import auth
    print(f"   ✓ auth module loaded")
except Exception as e:
    print(f"   ❌ auth import failed: {e}")
    sys.exit(1)

try:
    from backend.api import resume_routes
    print(f"   ✓ resume_routes module loaded")
except Exception as e:
    print(f"   ❌ resume_routes import failed: {e}")
    sys.exit(1)

print()

# Test 7: AI Model imports
print("[7/8] Checking AI Model components...")
try:
    from ai_model.resume_parser.parser import parse_resume
    print(f"   ✓ Resume parser loaded")
except Exception as e:
    print(f"   ❌ Resume parser import failed: {e}")
    sys.exit(1)

try:
    from ai_model.prediction_model.predictor import predict_placement
    print(f"   ✓ Placement predictor loaded")
except Exception as e:
    print(f"   ❌ Placement predictor import failed: {e}")
    sys.exit(1)

try:
    from ai_model.job_matcher.matcher import get_job_fits_with_diversity
    print(f"   ✓ Job matcher loaded")
except Exception as e:
    print(f"   ❌ Job matcher import failed: {e}")
    sys.exit(1)

print()

# Test 8: Create FastAPI app
print("[8/8] Creating FastAPI application...")
try:
    from backend.main import app
    print(f"   ✓ FastAPI app created successfully")
except Exception as e:
    print(f"   ❌ Failed to create app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()
print("=" * 60)
print("✅ All checks passed! Backend is ready to start.")
print("=" * 60)
print()
print("To start the backend server, run:")
print()
print("   cd backend")
print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
print()
