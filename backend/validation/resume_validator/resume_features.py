# Positive indicators for a resume
RESUME_INDICATORS = [
    "education", "work experience", "professional experience", "employment history",
    "projects", "personal projects", "academic projects", "skills", "technical skills",
    "internships", "certifications", "achievements", "contact information",
    "email", "phone number", "linkedin", "github", "summary", "objective"
]

# Negative indicators for non-resumes (research papers, invoices, assignments, etc.)
NON_RESUME_INDICATORS = [
    "abstract", "introduction", "literature review", "methodology", "results",
    "discussion", "references", "bibliography", "chapter", "table of contents",
    "invoice number", "purchase order", "terms and conditions", "meeting notes",
    "agenda", "research objectives", "conclusion", "appendix", "homework",
    "assignment", "due date", "amount due", "client", "contract"
]

# Specific document type hints
DOCUMENT_TYPE_HINTS = {
    "research_paper": ["abstract", "literature review", "methodology", "references", "bibliography", "figure"],
    "invoice": ["invoice number", "amount due", "purchase order", "total", "subtotal", "tax"],
    "assignment": ["homework", "assignment", "due date", "question", "answer", "student id"],
    "contract": ["terms and conditions", "hereby", "agreement", "party", "witness whereof"],
    "meeting_notes": ["meeting notes", "agenda", "action items", "attendees", "minutes"],
    "book": ["chapter", "table of contents", "preface", "epilogue"]
}
