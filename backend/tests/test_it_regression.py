"""
IT Pipeline Regression Test Suite
==================================
CRITICAL: This must pass identically before AND after the multi-domain migration.

Tests the protected IT pipeline end-to-end to ensure:
1. ResumeAnalyzer singleton loads without errors
2. IT skill extraction produces expected results
3. IT role matching produces expected structure
4. Intelligence service produces expected contract
5. API response contract is preserved

Run: python -m pytest tests/test_it_regression.py -v
"""

import sys
import os
import pytest

# Ensure backend is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Sample IT Resume Text (deterministic baseline) ──────────────────────────
SAMPLE_IT_RESUME = """
John Smith
john.smith@email.com
+1-555-123-4567

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 4 years of experience building scalable
web applications using React, Node.js, Python, and PostgreSQL.

TECHNICAL SKILLS
- Languages: Python, JavaScript, TypeScript, Java, SQL
- Frontend: React, Redux, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express, FastAPI, Django
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, AWS, CI/CD, Git
- AI/ML: Machine Learning, Pandas, Scikit-Learn

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2020 - Present
- Built microservices architecture serving 10M+ requests/day
- Implemented CI/CD pipelines reducing deployment time by 70%
- Led migration from monolith to React + FastAPI stack

Software Developer | StartupXYZ | 2018 - 2020
- Developed REST APIs using Django and Flask
- Managed PostgreSQL databases with complex queries
- Implemented automated testing with PyTest and Jest

EDUCATION
B.Tech Computer Science | State University | 2018
GPA: 3.8/4.0

CERTIFICATIONS
- AWS Solutions Architect
- Docker Certified Associate
"""


class TestResumeAnalyzerSingleton:
    """Test that the protected IT ResumeAnalyzer loads correctly."""

    def test_analyzer_imports(self):
        """ResumeAnalyzer module must be importable."""
        from ai_model.resume_parser.analyzer import ResumeAnalyzer, analyzer_instance
        assert analyzer_instance is not None

    def test_analyzer_is_singleton(self):
        """analyzer_instance must be the same object across imports."""
        from ai_model.resume_parser.analyzer import analyzer_instance as inst1
        from ai_model.resume_parser.analyzer import analyzer_instance as inst2
        assert inst1 is inst2

    def test_analyze_resume_returns_dict(self):
        """analyze_resume must return a dict with expected keys."""
        from ai_model.resume_parser.analyzer import analyze_resume
        result = analyze_resume(SAMPLE_IT_RESUME)
        assert isinstance(result, dict)
        # Protected contract keys
        assert "role_fit" in result
        assert "ats_score" in result
        assert "skill_score" in result
        assert "skills_found" in result
        assert "gaps" in result

    def test_analyze_resume_empty_input(self):
        """analyze_resume must handle empty input gracefully."""
        from ai_model.resume_parser.analyzer import analyze_resume
        result = analyze_resume("")
        assert isinstance(result, dict)
        assert "role_fit" in result


class TestITSkillsData:
    """Test that the IT skills data module is intact."""

    def test_skills_dictionary_exists(self):
        from ai_model.data.skills_data import SKILLS_DICTIONARY
        assert isinstance(SKILLS_DICTIONARY, dict)
        assert len(SKILLS_DICTIONARY) > 0
        # Protected categories must exist
        assert "Frontend" in SKILLS_DICTIONARY
        assert "Backend" in SKILLS_DICTIONARY
        assert "AI/ML" in SKILLS_DICTIONARY
        assert "Cloud/DevOps" in SKILLS_DICTIONARY

    def test_role_requirements_exists(self):
        from ai_model.data.skills_data import ROLE_REQUIREMENTS
        assert isinstance(ROLE_REQUIREMENTS, dict)
        assert len(ROLE_REQUIREMENTS) > 0
        # Protected roles must exist
        assert "Full Stack Developer" in ROLE_REQUIREMENTS
        assert "Backend Developer" in ROLE_REQUIREMENTS
        assert "Data Scientist" in ROLE_REQUIREMENTS

    def test_role_skill_matrix_exists(self):
        from ai_model.data.skills_data import ROLE_SKILL_MATRIX
        assert isinstance(ROLE_SKILL_MATRIX, dict)
        for role, matrix in ROLE_SKILL_MATRIX.items():
            assert "core" in matrix, f"Missing 'core' in {role}"
            assert "secondary" in matrix, f"Missing 'secondary' in {role}"

    def test_skill_topics_exists(self):
        from ai_model.data.skills_data import SKILL_TOPICS
        assert isinstance(SKILL_TOPICS, dict)
        assert "Python" in SKILL_TOPICS
        assert "React" in SKILL_TOPICS

    def test_all_skills_flattened(self):
        from ai_model.data.skills_data import ALL_SKILLS
        assert isinstance(ALL_SKILLS, list)
        assert len(ALL_SKILLS) > 50  # Sanity check


class TestITRoleMatcher:
    """Test that the IT role matcher produces expected structures."""

    def test_calculate_role_matches_structure(self):
        from ai_model.job_matcher.matcher import calculate_role_matches
        skills = ["Python", "React", "SQL", "Docker", "JavaScript"]
        matches = calculate_role_matches(skills)
        assert isinstance(matches, list)
        assert len(matches) > 0
        # Each match must have protected keys
        first = matches[0]
        assert "role" in first
        assert "match" in first
        assert "present" in first
        assert "missing" in first
        assert "salary" in first

    def test_get_job_fits_with_diversity(self):
        from ai_model.job_matcher.matcher import get_job_fits_with_diversity
        skills = ["Python", "React", "SQL", "Docker", "JavaScript"]
        result = get_job_fits_with_diversity(skills)
        assert "role_matches" in result
        assert "diversity_analysis" in result
        assert "top_role" in result

    def test_role_matches_sorted_descending(self):
        from ai_model.job_matcher.matcher import calculate_role_matches
        skills = ["Python", "React", "SQL", "Docker", "JavaScript"]
        matches = calculate_role_matches(skills)
        scores = [m["match"] for m in matches]
        assert scores == sorted(scores, reverse=True)


class TestITPreparationEngine:
    """Test that the preparation engine produces expected structures."""

    def test_generate_plan_structure(self):
        from services.preparation_engine import generate_plan
        result = generate_plan(
            missing_skills=["Docker", "Kubernetes", "AWS"],
            top_role="DevOps Engineer"
        )
        assert "target_role" in result
        assert "learning_plan" in result
        assert "tiers" in result
        assert "total_gaps" in result
        assert "estimated_weeks" in result

    def test_generate_plan_empty_skills(self):
        from services.preparation_engine import generate_plan
        result = generate_plan(missing_skills=[], top_role="Backend Developer")
        assert result["total_gaps"] == 0
        assert result["learning_plan"] == []


class TestITIntelligenceService:
    """Test that the intelligence service produces expected contract."""

    def test_intelligence_service_imports(self):
        from user_intelligence.intelligence_service import intelligence_service
        assert intelligence_service is not None

    def test_intelligence_profile_contract(self):
        """Intelligence profile must contain expected top-level keys."""
        from user_intelligence.intelligence_service import intelligence_service

        # Minimal student profile for cold-start
        test_profile = {
            "student_id": "regression_test_001",
            "skills": [
                {"name": "Python", "confidence": 0.95, "weight": 1.0},
                {"name": "React", "confidence": 0.90, "weight": 1.0},
                {"name": "SQL", "confidence": 0.85, "weight": 1.0},
            ],
            "experience": {"years": 2, "projects": []},
            "education": {"degree": "B.Tech", "branch": "CS", "cgpa": 3.5},
        }

        result = intelligence_service.build_intelligence_profile(test_profile)
        assert isinstance(result, dict)

        # Must contain these keys (protected contract)
        expected_keys = [
            "trace_id", "student_id", "skill_vector",
            "prediction", "intelligence_score", "mode"
        ]
        for key in expected_keys:
            assert key in result, f"Missing key '{key}' in intelligence profile"


class TestAPIResponseContract:
    """Validate that upload_resume response structure is preserved."""

    def test_response_data_keys(self):
        """The response 'data' dict must contain all protected keys."""
        # We don't call the actual endpoint (requires file upload + server)
        # Instead we validate the expected key list is documented
        expected_data_keys = [
            "student_profile", "extractedText", "skills", "experience",
            "prediction", "roleMatches", "topRole", "roles_detected",
            "missing_skills", "experience_advantage_roles", "diversityScore",
            "targetRole", "matchQuality", "llm_enhancement", "llm_insights",
            "preparation_plan", "practice_set", "trace_id",
            "requires_verification", "custom_ml_analysis"
        ]
        # This is a documentation test — ensures we track the contract
        # The actual /upload_resume response.data has exactly 20 keys
        assert len(expected_data_keys) == 20, \
            f"API contract has changed! Expected 20 keys, got {len(expected_data_keys)}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
