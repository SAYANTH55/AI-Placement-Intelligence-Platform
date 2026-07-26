# AI Driven Placement Intelligence Platform

AI-driven placement intelligence platform for predicting student placement readiness and recommending skills.

## Project Overview

This platform connects students, teachers, and placement officers with an AI-driven intelligence layer for resume parsing, job matching, and placement prediction.

## Project Structure

- `frontend/`: React-based user interfaces for Student and Teacher portals.
- `backend/`: FastAPI-powered API and database services.
- `ai-model/`: Core intelligence layer for resume analysis and prediction.
- `dataset/`: Training and testing data.
- `docs/`: Project documentation and architecture.
- `tests/`: Automated test suites.

## Getting Started

1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`.
3. Follow module-specific READMEs for setup.

## Team Roles

- **Member 1 (Frontend)**: UI/UX, Student/Teacher Portals.
- **Member 2 (Backend)**: API Development, Database Management.
- **Member 3 (AI/ML)**: Intelligence Layer, NLP, Predictive Models.

## Future Work (Acknowledged)
- **Monitoring Dashboards**: Dedicated operational dashboards to track system health and telemetry.
- **Load Testing**: Formal load and stress testing pipelines.
- **Infrastructure as Code**: Terraform or CloudFormation scripts for automated deployment and scaling.

## Known Limitations
- **Profile Strength Index**: The platform features a "Profile Strength Index" (formerly Placement Readiness Score). It is important to note that this score is a **heuristic composite of resume signal strength**, not a validated predictor of real-world placement outcomes. Currently, it is trained on synthetic heuristics. Once the database accumulates a statistically significant volume of real ground-truth placement outcomes (`placement_outcomes`), the model will be retrained on actual data to predict true placement probability.
