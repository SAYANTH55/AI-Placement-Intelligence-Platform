from pydantic import BaseModel
from .resume_classifier import ResumeClassifier

class ValidationResult(BaseModel):
    is_resume: bool
    confidence: float
    document_type: str
    message: str

async def validate_document(text: str) -> ValidationResult:
    """Async entrypoint for document validation"""
    classifier = ResumeClassifier()
    result = await classifier.classify(text)
    
    return ValidationResult(
        is_resume=result["is_resume"],
        confidence=result["confidence"],
        document_type=result["document_type"],
        message=result["reason"]
    )
