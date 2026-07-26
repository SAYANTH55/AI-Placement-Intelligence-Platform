# Security Architecture

JobMode implements enterprise-grade security mechanisms to protect student data and platform integrity.

## Authentication (JWT)
The platform uses JSON Web Tokens (JWT) for stateless authentication.
- Tokens are signed using the `SECRET_KEY` (HS256).
- The `access_token` expiration is configurable (default: 30 minutes).
- Passwords are hashed using `bcrypt` before storage.

## Role-Based Access Control (RBAC)
Every user is assigned a specific role upon registration:
- `student`: Can only access their own profile, resumes, and apply to drives.
- `pr` (Placement Representative): Can manage drives and view applications.
- `admin`: Has global read/write access to all resources and analytics.
The FastAPI backend enforces this using dependency injection (`get_current_active_user`).

## Data Validation
We use Pydantic models for all incoming request bodies. This guarantees data type safety and strips unknown fields, heavily mitigating injection attacks.

## File Upload Security
Resumes uploaded by students are validated before processing:
- Size limits are enforced.
- MIME types are strictly verified (only `application/pdf` or `application/msword` allowed).
- Upload paths are sanitized to prevent directory traversal attacks.
