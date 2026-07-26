# Frequently Asked Questions (FAQ)

## 1. Why does the Resume Parser sometimes miss data?
The parser relies on PyPDF2 and PDFPlumber. Highly visual resumes, dual-column layouts, or resumes built with image-based text (flattened PDFs) can confuse the extraction logic. We recommend standard, single-column formats.

## 2. Can I use JobMode without the ML models?
Yes. The core CRUD placement management (Drives, Applications) will work without the ML models. However, features like ATS Scoring, Role Prediction, and Profile Strength will fail gracefully or return empty data.

## 3. How do I retrain the ML Models?
You can run the `backend/ai_model/train_models.py` script. It will generate new `.pkl` files based on the synthetic training datasets provided in the repository.

## 4. What is the difference between Student, PR, and Admin?
- **Student**: Can upload resumes, view analytics, and apply to drives.
- **PR (Placement Representative)**: Can create drives and update application statuses.
- **Admin**: Has full access to cohort analytics and system configurations.
