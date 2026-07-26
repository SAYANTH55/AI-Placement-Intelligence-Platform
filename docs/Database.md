# Database Documentation

JobMode utilizes a relational database architecture. In development, it defaults to **SQLite** (`ai_placement.db`), but the SQLAlchemy ORM ensures it is fully compatible with **PostgreSQL** for production.

## Core Entities

1. **Users (`users`)**: Stores authentication credentials, roles (`student`, `admin`, `pr`), and profile information.
2. **Resumes (`resumes`)**: Stores file metadata and paths for uploaded documents.
3. **Analyses (`resume_analyses`)**: Stores the ML and parsing outputs (skills, predictions) linked to a resume.
4. **Drives (`placement_drives`)**: Represents a recruitment event by a company, including CTC limits and hard eligibility filters.
5. **Applications (`placement_applications`)**: Tracks the many-to-many relationship between Students and Drives, including current status (`applied`, `shortlisted`, `placed`).
6. **Outcomes (`placement_outcomes`)**: The ground-truth record of a successful placement, used to train future ML models.

## Migrations

Currently, the schema is managed via custom Python migration scripts (`backend/scripts/migrate_*.py`) and SQLAlchemy's `create_all()`. Moving forward, integrating **Alembic** is highly recommended for robust schema versioning.
