import pytest
import asyncio
from validation.resume_validator.validation_router import validate_document

def test_genuine_resume():
    text = """
    John Doe
    Email: john@example.com | Phone: 123-456-7890
    
    Objective
    Looking for a software engineer role.
    
    Education
    B.S. Computer Science, University of Technology
    
    Work Experience
    Software Engineer, Tech Corp
    - Built web applications
    - Managed databases
    
    Projects
    Personal Website
    
    Skills
    Python, React, SQL
    """
    result = asyncio.run(validate_document(text))
    assert result.is_resume is True
    assert result.confidence >= 0.5
    assert result.document_type == "resume"

def test_research_paper():
    text = """
    A Novel Approach to Machine Learning
    
    Abstract
    This paper introduces a new methodology for deep learning models.
    
    Introduction
    Deep learning has evolved significantly...
    
    Methodology
    We used a dataset of 10,000 images.
    
    Results
    The model achieved 95% accuracy.
    
    Discussion
    These results indicate that our methodology is effective.
    
    References
    [1] Smith, J. et al. (2020)
    """
    result = asyncio.run(validate_document(text))
    assert result.is_resume is False
    assert result.confidence >= 0.5
    assert result.document_type == "research_paper"

def test_invoice():
    text = """
    INVOICE NUMBER: 10293
    Client: ABC Corp
    
    Description        Amount
    Consulting         $500
    Development        $1500
    
    Subtotal: $2000
    Tax: $100
    Amount Due: $2100
    
    Please pay within 30 days.
    """
    result = asyncio.run(validate_document(text))
    assert result.is_resume is False
    assert result.document_type == "invoice"

def test_contract():
    text = """
    NON-DISCLOSURE AGREEMENT
    
    This agreement is made between Party A and Party B.
    
    Terms and Conditions
    Party B hereby agrees to not disclose any confidential information.
    
    In witness whereof, the parties have signed this agreement.
    """
    result = asyncio.run(validate_document(text))
    assert result.is_resume is False
    assert result.document_type == "contract"

def test_assignment():
    text = """
    Student ID: 123456
    Due Date: 12/12/2026
    
    Homework Assignment 3
    
    Question 1: Explain the theory of relativity.
    Answer: The theory of relativity...
    """
    result = asyncio.run(validate_document(text))
    assert result.is_resume is False
    assert result.document_type == "assignment"
