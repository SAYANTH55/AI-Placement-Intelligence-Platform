# Backend Module (API & Database)

Built with FastAPI for high performance and scalability. Handles data storage, user authentication, and interfaces with the AI/ML Engine.

## Structure
- `api/`: Route definitions and endpoint handlers.
- `database/`: Database connection and ORM models.
- `models/`: Pydantic schemas for data validation.
- `services/`: Business logic and AI engine integration.

## API Endpoints
- `POST /upload_resume`: Process uploaded resume files.
- `POST /analyze_jd`: Parse job descriptions.
- `POST /match_resume`: Compute match score between resume and JD.
- `POST /predict_placement`: Get placement readiness prediction.
- `GET /get_dashboard`: Fetch analytics for portals.

## Getting Started
1. Install requirements: `pip install -r ../requirements.txt`.
2. Set up your environment variables:
   - Make a copy of `.env.example` and rename it to `.env`.
   - Fill in `.env` with your own database and SMTP/API credentials.
   - Do not commit your real `.env` file to version control.
3. Run server: `uvicorn main:app --reload`.
