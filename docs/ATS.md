# ATS Benchmarking Engine

The ATS (Applicant Tracking System) Benchmarking Engine is a standalone feature within JobMode that allows students to evaluate their resumes against simulated enterprise ATS parsers.

## How It Works

1. **Text Extraction**: The PDF is parsed using `PyPDF2`/`pdfplumber`.
2. **Section Identification**: Regex and heuristics identify critical sections (Education, Experience, Skills, Projects).
3. **Keyword Density**: The resume is compared against standard job descriptions to calculate keyword matching percentages.
4. **Scoring**: The engine penalizes resumes that use complex formatting (tables, columns) which traditional ATS parsers often fail to read.
5. **Feedback**: Generates actionable recommendations (e.g., "Add an explicit 'Education' header", "Remove multi-column layout").

## API Endpoints
- `POST /api/ats/analyze`: Analyzes a raw file and returns an ATS Score and feedback.
- `POST /api/ats/debug`: Returns the raw trace reasoning of the ATS parser.
