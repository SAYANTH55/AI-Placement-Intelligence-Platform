# Backend Documentation

The backend of JobMode is powered by **FastAPI** (Python 3.9+). It provides a high-performance, asynchronous REST API.

## Directory Structure

- `ai_model/`: Contains machine learning training scripts and the `models/` directory where `.pkl` files are stored.
- `api/`: API routers categorized by domain (`resume_routes.py`, `engine_routes.py`, etc.).
- `database/`: SQLAlchemy declarative base, session makers, and models.
- `placement/`: Core logic for drives and applications.
- `services/`: Integrations with LLMs, ATS benchmarking, and tracking engines.
- `main.py`: The FastAPI application instance and CORS configuration.

## Key Technologies

- **FastAPI**: For high-performance async endpoints.
- **SQLAlchemy**: For robust ORM interactions.
- **Pydantic**: For strict request/response data validation.
- **spaCy**: For Natural Language Processing (NER) during resume parsing.
- **Uvicorn**: ASGI server used for serving the app.

## Running Locally

1. Create and activate a virtual environment.
2. Install dependencies: `pip install -r requirements.txt`.
3. Download spaCy model: `python -m spacy download en_core_web_sm`.
4. Run server: `uvicorn main:app --reload --port 8000`.
