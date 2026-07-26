# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enterprise-grade Documentation suite in `/docs`
- GitHub Issue and Pull Request templates
- Docker and Docker Compose configuration for local multi-container development
- Continuous Integration pipelines via GitHub Actions
- Standalone ATS Analysis Engine
- Profile Strength composite score algorithm
- New Placement Admin Dashboard with analytics funnels

### Changed
- Migrated legacy JSON database structures to normalized relational models
- Consolidated API endpoints into modular routers
- Improved security policies and JWT management
- Enhanced React UI with dynamic Tailwind micro-animations

### Fixed
- Fixed typo in hex color causing CSS parsing errors
- Addressed memory leak in spaCy model loading during bulk resume parsing

## [5.0.0] - 2026-06-15

### Added
- Initial public release of JobMode Placement Intelligence Platform.
- Base machine learning models for role prediction.
- Student and Teacher portals.
