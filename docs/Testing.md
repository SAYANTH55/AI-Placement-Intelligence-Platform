# Testing Guide

Robust testing is critical to JobMode's reliability. The repository supports Unit, Integration, and End-to-End (E2E) testing.

## Backend Testing (Python/Pytest)

The backend uses `pytest`. Tests are located in `backend/tests/`.

### Running Tests
To run all backend tests:
```bash
cd backend
python -m pytest tests/ -v
```

### E2E Testing
We provide specialized E2E state machine validation scripts (e.g., `test_e2e_placement.py`). These create an isolated SQLite database (`e2e_test.db`), run a complete placement scenario (Drive Creation -> Student Application -> Shortlist -> Placement), and verify data consistency.

## Frontend Testing (React/Vitest)

*Placeholder: Frontend unit testing is currently being migrated to Vitest.*

Future guidelines will enforce:
- Unit tests for all utility functions in `src/utils/`.
- Component tests using React Testing Library to verify UI states and accessibility.

## Continuous Integration
GitHub Actions are configured to run linting and unit tests automatically on every Pull Request targeting the `main` branch.
