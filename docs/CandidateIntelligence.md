# Candidate Intelligence (LLM Layer)

JobMode enriches structured ML data with Generative AI (LLMs) to provide human-readable narratives and actionable feedback.

## The Intelligence Pipeline

1. **Structured Input**: The system gathers the user's extracted skills, role predictions, profile strength index, and ATS score.
2. **Prompt Engineering**: The `llm_service.py` constructs a highly structured prompt outlining the candidate's data without exposing raw PII.
3. **Generation**: The prompt is sent to Google Gemini (or a fallback LLM).
4. **Dossier Creation**: The LLM generates a multi-paragraph executive summary highlighting:
   - Core Strengths
   - Primary Skill Gaps
   - Recommended Learning Paths
   - Expected Interview Topics

## Configurations

Ensure you have the following environment variables set:
- `GEMINI_API_KEY`: Primary API Key.
- `FALLBACK_GEMINI_API_KEY`: Used in case of rate limiting on the primary key.

## Future Plans (RAG)
We plan to introduce Retrieval-Augmented Generation (RAG) by embedding standard University curricula, allowing the LLM to recommend specific university courses to fill skill gaps.
