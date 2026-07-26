# Known Limitations

As JobMode evolves into a production-ready system, the following limitations should be noted:

## 1. Profile Strength Index vs. Ground Truth
The "Profile Strength Index" is currently a heuristic composite of resume signal strength. It is **not** a validated predictor of real-world placement outcomes. The model requires a statistically significant volume of real ground-truth placement outcomes (`placement_outcomes`) before it can accurately predict true placement probability.

## 2. Parsing Complex PDFs
The current PDF parsing pipeline struggles with non-standard, highly visual, or multi-column resumes. Integrating a more robust visual layout parser (like LayoutLM) is planned for the future.

## 3. LLM Rate Limiting
Candidate Intelligence relies heavily on Google Gemini APIs. Free-tier or low-quota API keys will quickly hit rate limits under heavy concurrent usage, resulting in fallback generic messages.

## 4. Schema Migrations
The project currently uses custom python scripts for database migrations. Alembic integration is pending, which means complex schema rollbacks are currently manual.
