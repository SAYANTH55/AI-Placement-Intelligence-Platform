"""
Unit Tests for 3-Layer Domain Classifier
========================================
Tests that:
1. IT resumes are routed to 'it' domain (IT Affinity Protection).
2. Business, Finance, Legal, Healthcare, and Engineering resumes are routed correctly.
3. Keyword densities and ML models perform as expected.
4. Short or empty inputs default safely to 'it'.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from domains.classifier import DomainClassifier, classify_domain, ClassifierResult

# Resumes for testing
IT_RESUME = """
John Doe
Software Engineer
Python, Java, React, Docker, Kubernetes, AWS, SQL
Developed microservices using FastAPI and deployed on AWS.
Experienced in software development lifecycle, OOP, Git, and CI/CD pipelines.
"""

LEGAL_RESUME = """
Jane Smith
Corporate Lawyer
Bar Exam, LLB, LLM, JD
Drafted contracts, pleadings, NDAs, and handled litigation in court.
Experienced in Westlaw, LexisNexis, corporate governance, and data privacy (GDPR).
"""

FINANCE_RESUME = """
Alice Johnson
Financial Analyst
CFA Charterholder, Financial Modeling, DCF Valuation, LBO Modeling
Analyzed balance sheets, income statements, and cash flow statements.
Used Bloomberg Terminal for equity research and portfolio management.
"""

HEALTHCARE_RESUME = """
Bob Miller
Clinical Data Analyst
MBBS, MD, GCP Certification, clinical trials
Managed health informatics database, medical coding with ICD-10.
Analyzed patient care records using SAS and biostatistics methods.
"""

ENGINEERING_RESUME = """
Charlie Brown
Electrical Design Engineer
BE Electrical Engineering, PCB Design, Circuit Design, Control Systems
Designed hardware circuits, PLC programming, and SCADA systems.
Used AutoCAD, SolidWorks, and MATLAB for FEA simulation.
"""


class TestDomainClassifier:
    
    @pytest.fixture(autouse=True)
    def setup_classifier(self):
        self.classifier = DomainClassifier()

    def test_it_affinity_protection(self):
        """IT resumes must always route to 'it'."""
        result = self.classifier.classify(IT_RESUME)
        assert result.domain == "it"
        assert "it" in result.probabilities
        assert result.probabilities["it"] > 0

    def test_legal_classification(self):
        result = self.classifier.classify(LEGAL_RESUME)
        # Should be classified as legal (either xgboost or keyword/gemini)
        assert result.domain == "legal"

    def test_finance_classification(self):
        result = self.classifier.classify(FINANCE_RESUME)
        assert result.domain == "finance"

    def test_healthcare_classification(self):
        result = self.classifier.classify(HEALTHCARE_RESUME)
        assert result.domain == "healthcare"

    def test_engineering_classification(self):
        result = self.classifier.classify(ENGINEERING_RESUME)
        assert result.domain == "engineering"

    def test_short_empty_fallback(self):
        """Short or empty texts must safely default to 'it'."""
        res_empty = self.classifier.classify("")
        assert res_empty.domain == "it"
        
        res_short = self.classifier.classify("Hello world, this is a short test.")
        assert res_short.domain == "it"

    def test_classify_domain_wrapper(self):
        """Verify the wrapper function works identically."""
        res = classify_domain(IT_RESUME)
        assert isinstance(res, ClassifierResult)
        assert res.domain == "it"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
