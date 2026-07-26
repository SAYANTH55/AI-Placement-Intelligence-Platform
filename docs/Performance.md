# Performance Guidelines

JobMode is designed for efficiency, but handling ML models and bulk PDF parsing can be resource-intensive.

## Backend Optimizations

1. **Async Operations**: All database I/O and external LLM API calls must use `async`/`await` to prevent blocking the event loop.
2. **Model Caching**: Machine Learning models (`.pkl` files) and spaCy NLP pipelines (`en_core_web_sm`) are large. They should be loaded into memory **once** during application startup, not per-request.
3. **Pagination**: All list endpoints (e.g., fetching students, applications) must implement offset/limit pagination to prevent memory overflow on large cohorts.

## Frontend Optimizations

1. **Lazy Loading**: Use `React.lazy` and `Suspense` for large route components (like the Placement Admin Dashboard) to reduce the initial JS bundle size.
2. **Memoization**: Use `useMemo` and `useCallback` for complex data transformations (e.g., preparing data for Recharts).
3. **Debouncing**: Search inputs in the UI should be debounced to prevent flooding the backend with API requests.
