# Release Notes

## Version 5.5.0 (Current)
**Job Mode Scoring & Architecture Revamp**
- Migrated legacy JSON database structures to normalized relational models (`scripts/migrate_json_to_relational.py`).
- Added robust Job Mode Scoring with advanced ML techniques.
- Standalone ATS Analysis Engine introduced.
- Placement Admin Dashboard with analytics funnels added to frontend.
- Fixed global styling issues (hex color typo in `index.css`).
- Startup sequence optimized (`start.bat` updated to v5.5.0).

## Version 5.0.0
**Initial Production Release**
- Core placement intelligence capabilities.
- Basic Resume Parsing (spaCy).
- FastAPI backend and React/Vite frontend.
