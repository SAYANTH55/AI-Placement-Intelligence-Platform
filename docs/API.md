# API Documentation

JobMode exposes a comprehensive RESTful API built with FastAPI. 

## OpenAPI Specification

The API is fully self-documenting. When running the backend locally, you can access the OpenAPI schema at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Authentication

Most endpoints require a valid JWT (JSON Web Token).
- Pass the token in the `Authorization` header: `Bearer <token>`
- Obtain a token via `POST /api/login`

## Key Namespaces

- `/api/auth/*`: Login, registration, token refresh.
- `/api/resume/*`: File uploads, parsing triggers, analysis retrieval.
- `/api/engine/*`: Drives, applications, outcomes.
- `/api/learning/*`: Feedback loops and skill gap data.
- `/api/reports/*`: Dossier generation and analytics aggregations.
- `/api/ats/*`: Standalone ATS benchmarking endpoints.

## Error Handling

The API uses standardized HTTP status codes:
- `200 OK`: Success
- `400 Bad Request`: Validation failure (Pydantic will return detailed field errors).
- `401 Unauthorized`: Invalid or missing JWT.
- `403 Forbidden`: User lacks the RBAC permissions for the endpoint.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: Unhandled exception.
