# Security Policy

## Supported Versions

JobMode is currently in active development. We provide security updates for the latest major version.

| Version | Supported          |
| ------- | ------------------ |
| 5.x.x   | :white_check_mark: |
| < 5.0.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within JobMode, please send an e-mail to our core maintainers at [security@jobmode.local]. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

When reporting a vulnerability, please provide the following information:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Any potential impact on the platform or its users.

We will acknowledge receipt of your vulnerability report within 48 hours and strive to send you regular updates about our progress. If you report a vulnerability that materially affects our services or infrastructure, we will coordinate with you regarding a public disclosure.

## Security Best Practices Built-in

- **JWT Authentication**: Short-lived access tokens with secure HTTP-only configurations.
- **CORS Configuration**: Restricts API access to verified frontends.
- **Data Validation**: Strict Pydantic models to prevent injection attacks.
- **Role-Based Access Control**: Admins, Students, and PRs have rigidly defined API scopes.
