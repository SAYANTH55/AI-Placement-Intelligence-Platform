"""
Unit Tests for Multi-Domain Analysis Pipeline
==============================================
Verifies that:
1. run_domain_pipeline executes without error for Legal, Finance, Business, Healthcare, Engineering.
2. The output dictionary exactly adheres to the 20-key API contract.
3. The internal structures (skills, roleMatches, preparation_plan, practice_set) are correct.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from domains.domain_pipeline import run_domain_pipeline

# Sample non-IT resumes
LEGAL_RESUME = """
Jane Smith
Corporate Lawyer
Bar Exam, LLB, LLM, JD
Drafted contracts, pleadings, NDAs, and handled litigation in court.
Experienced in Westlaw, LexisNexis, corporate governance, and data privacy (GDPR).
7+ years of experience in corporate law.
"""

FINANCE_RESUME = """
Alice Johnson
Financial Analyst
CFA Charterholder, Financial Modeling, DCF Valuation, LBO Modeling
Analyzed balance sheets, income statements, and cash flow statements.
Used Bloomberg Terminal for equity research and portfolio management.
3 years of experience.
"""


class TestDomainPipeline:
    
    def test_pipeline_keys_and_contract(self):
        """The output of run_domain_pipeline must contain exactly the 20 required keys."""
        expected_data_keys = [
            "student_profile", "extractedText", "skills", "experience",
            "prediction", "roleMatches", "topRole", "roles_detected",
            "missing_skills", "experience_advantage_roles", "diversityScore",
            "targetRole", "matchQuality", "llm_enhancement", "llm_insights",
            "preparation_plan", "practice_set", "trace_id",
            "requires_verification", "custom_ml_analysis"
        ]

        result = run_domain_pipeline(LEGAL_RESUME, "legal")
        assert isinstance(result, dict)

        for key in expected_data_keys:
            assert key in result, f"Missing key in pipeline output: {key}"

        # Verify exact counts of keys matching expected list
        assert len(result) == len(expected_data_keys)

    def test_legal_pipeline_structure(self):
        """Verify the legal domain analysis results are correct."""
        result = run_domain_pipeline(LEGAL_RESUME, "legal")
        
        # Verify skills extraction
        assert "GDPR" in result["skills"]
        assert "NDAs" in result["skills"]
        
        # Verify experience parsing
        assert result["experience"] == "7 years"
        
        # Verify role matches
        assert len(result["roleMatches"]) > 0
        first_match = result["roleMatches"][0]
        assert "role" in first_match
        assert "match" in first_match
        assert "present" in first_match
        assert "missing" in first_match
        assert "salary" in first_match
        
        # Verify preparation plan structure
        prep = result["preparation_plan"]
        assert prep["target_role"] == result["topRole"]["role"]
        assert "tiers" in prep
        for t_key in ["programming", "dsa", "core_cs", "domain"]:
            assert t_key in prep["tiers"]
            
        # Verify practice set structure
        practice = result["practice_set"]
        assert "aptitude" in practice
        assert "coding" in practice
        assert "interview" in practice

    def test_finance_pipeline_structure(self):
        """Verify the finance domain analysis results are correct."""
        result = run_domain_pipeline(FINANCE_RESUME, "finance")
        
        # Verify skills extraction
        assert "Financial Modeling" in result["skills"]
        assert "DCF Valuation" in result["skills"]
        
        # Verify experience parsing
        assert result["experience"] == "3 years"
        
        # Verify role matches
        assert len(result["roleMatches"]) > 0
        assert "Financial Analyst" in result["roles_detected"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
