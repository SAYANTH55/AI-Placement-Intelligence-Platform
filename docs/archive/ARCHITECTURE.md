# Project Architecture

## High-Level Architecture

The platform follows a classic three-tier architecture:

1. **Presentation Layer**: React-based frontend portals.
2. **Application Layer**: Python-based backend APIs and services.
3. **Intelligence Layer**: Specialized ML models for NLP and prediction.

## Module Interaction

1. `Frontend` sends Resume/JD data to `Backend`.
2. `Backend` forwards data to `AI-Model` for processing.
3. `AI-Model` returns structured insights (Scores, Predictions).
4. `Backend` stores data in `Database` and returns results to `Frontend`.

## Technology Stack

- **Frontend**: React
- **Backend**: FastAPI
- **Intelligence**: Python (scikit-learn, spaCy)
- **Database**: MySQL/MongoDB
