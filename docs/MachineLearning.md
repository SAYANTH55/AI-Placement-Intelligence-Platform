# Machine Learning Documentation

The Intelligence Layer of JobMode utilizes classic machine learning pipelines to process resumes and evaluate candidates.

## 1. Role Prediction Model
- **Algorithm**: XGBoost Classifier (wrapped in OneVsRest for multi-label).
- **Purpose**: Predicts which job families (e.g., Frontend, Backend, Data Science) a candidate is best suited for based on their extracted skills.
- **Input**: TF-IDF vectorized skill arrays.
- **Output**: Array of roles with confidence scores.

## 2. ATS Simulation Model
- **Algorithm**: Scikit-Learn Random Forest Classifier.
- **Purpose**: Simulates whether an enterprise ATS system would flag a resume for manual review or discard it based on structural integrity and keyword density.
- **Features Used**: Missing skills, missing sections, formatting density, word count.

## 3. Profile Strength Index
The Profile Strength Index is a heuristic composite score (0-100). It acts as a proxy for "Placement Readiness" by aggregating signals like:
- Extracted Skill Count vs Baseline
- Recognized Certifications
- Extracted Projects/Experience duration

*Note: Future versions will train a dedicated Gradient Boosting model directly on `placement_outcomes` data to predict true placement probability.*
