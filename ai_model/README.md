# AI/ML Engine (Intelligence Layer)

The core intelligence layer performing NLP tasks and predictive analytics.

## Sub-Modules
- `resume_parser/`: Extracts entities (skills, experience, education) from PDF/DOCX.
- `job_matcher/`: Matches resumes against job descriptions using vector embeddings.
- `skill_gap/`: Identifies missing skills based on job market trends.
- `prediction_model/`: Predicts student placement probability using historical data.

## Technologies
- **NLP**: spaCy, NLTK.
- **ML**: scikit-learn, pandas.
- **Data Handling**: PDFMiner, python-docx.

## Getting Started
- Install ML dependencies: `pip install pandas scikit-learn spacy`.
- Download spaCy model: `python -m spacy download en_core_web_sm`.
