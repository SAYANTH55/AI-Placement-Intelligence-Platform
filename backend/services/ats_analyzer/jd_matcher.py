"""
jd_matcher.py
-------------
Engine 4: Enterprise ATS Job Description Matcher

Pipeline:
  1. Extract skills from resume (already parsed)
  2. Extract skills from JD text using regex + skill taxonomy NER
  3. Normalize skill names for comparison
  4. Compute semantic similarity (SentenceTransformer) between resume & JD
  5. Compute keyword overlap score
  6. Identify matched / missing skills
  7. Estimate ATS compatibility via weighted blend
  8. Return JDMatchResult

Fallback: If sentence-transformers unavailable, uses TF-IDF cosine similarity.
"""

import re
import logging
from typing import List, Tuple, Dict, Any
from .ats_models import JDMatchResult

logger = logging.getLogger(__name__)


# ── Skill extraction from raw JD text ─────────────────────────────────────
# Extended ATS keyword bank for JD extraction
_KNOWN_SKILLS = {
    # Languages
    "python", "java", "javascript", "typescript", "golang", "go", "rust", "c++",
    "c#", "ruby", "php", "scala", "kotlin", "swift", "dart", "r", "matlab",
    # Frontend
    "react", "next.js", "nextjs", "vue", "vue.js", "vuejs", "angular", "svelte",
    "html", "css", "sass", "tailwind", "tailwindcss", "webpack", "vite", "redux",
    "framer motion", "storybook",
    # Backend
    "fastapi", "django", "flask", "spring boot", "node.js", "nodejs", "express",
    "express.js", "nest.js", "nestjs", "laravel", "rails", "gin", "chi", "axum",
    "graphql", "rest api", "grpc", "websocket",
    # Databases
    "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "cassandra",
    "dynamodb", "firebase", "supabase", "elasticsearch", "opensearch", "neo4j",
    "snowflake", "bigquery", "redshift", "duckdb",
    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform",
    "ansible", "helm", "argocd", "jenkins", "github actions", "gitlab ci", "ci/cd",
    "prometheus", "grafana", "nginx", "linux", "bash",
    # ML / AI
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
    "scikit-learn", "sklearn", "xgboost", "lightgbm", "hugging face", "transformers",
    "nlp", "computer vision", "mlops", "mlflow", "airflow", "spark", "pyspark",
    "langchain", "openai", "llm", "rag", "vector database", "pinecone", "faiss",
    # Data
    "pandas", "numpy", "sql", "dbt", "kafka", "flink", "beam", "tableau", "power bi",
    "looker", "data warehouse", "etl", "elt", "data lake", "delta lake",
    # Mobile
    "flutter", "react native", "swift", "kotlin", "android", "ios", "xcode",
    # Testing
    "pytest", "jest", "cypress", "selenium", "playwright", "junit",
    # Concepts
    "microservices", "api", "rest", "oauth", "jwt", "agile", "scrum", "devops",
    "system design", "algorithms", "data structures", "distributed systems",
    "event driven", "cqrs", "serverless",
}

# Normalisation map (aliases → canonical name)
_NORMALISE = {
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "nestjs": "NestJS",
    "nest.js": "NestJS",
    "expressjs": "Express",
    "express.js": "Express",
    "sk-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "scikit-learn": "Scikit-Learn",
    "k8s": "Kubernetes",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "tailwindcss": "Tailwind CSS",
    "tailwind": "Tailwind CSS",
    "aws": "AWS",
    "azure": "Azure",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "github actions": "GitHub Actions",
    "hugging face": "Hugging Face",
    "rest api": "REST API",
    "ci/cd": "CI/CD",
}


def _extract_jd_skills(jd_text: str) -> List[str]:
    """
    Extract skills from JD text using keyword matching.
    Returns normalised, deduplicated list of skills.
    """
    jd_lower = jd_text.lower()
    found = set()

    for skill in _KNOWN_SKILLS:
        # Use word-boundary matching
        pattern = re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)
        if pattern.search(jd_lower):
            canonical = _NORMALISE.get(skill.lower(), skill.title())
            found.add(canonical)

    return sorted(found)


def _normalise_skills(skills: List[str]) -> set:
    """Lowercase + normalise a skill list for comparison."""
    result = set()
    for s in skills:
        lower = s.lower().strip()
        canonical = _NORMALISE.get(lower, lower)
        result.add(canonical)
    return result


def _semantic_similarity(text1: str, text2: str) -> float:
    """
    Compute cosine similarity between two texts.
    Uses SentenceTransformer if available; falls back to TF-IDF.
    """
    try:
        import sys, os
        _dir = os.path.dirname(os.path.abspath(__file__))
        backend_root = os.path.abspath(os.path.join(_dir, "..", "..", ".."))
        if backend_root not in sys.path:
            sys.path.insert(0, backend_root)

        from ai_model.job_recommendation_engine import _get_st_model
        model = _get_st_model()
        import numpy as np
        embs = model.encode([text1, text2], normalize_embeddings=True)
        score = float(np.dot(embs[0], embs[1]))
        return round(max(0.0, min(score, 1.0)) * 100, 1)

    except Exception:
        # TF-IDF fallback
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
            mat = vec.fit_transform([text1, text2])
            score = float(cosine_similarity(mat[0], mat[1])[0][0])
            return round(max(0.0, min(score, 1.0)) * 100, 1)
        except Exception as e2:
            logger.warning(f"[JDMatcher] Both similarity methods failed: {e2}")
            return 0.0


def _infer_jd_role(jd_text: str) -> str:
    """Infer the target role from the JD text using keyword heuristics."""
    jd_lower = jd_text.lower()

    role_signals = {
        "Data Scientist": ["data scientist", "machine learning", "statistical model", "sklearn", "model training"],
        "ML Engineer": ["ml engineer", "mlops", "model deployment", "model serving", "feature store"],
        "Backend Developer": ["backend", "api development", "rest api", "microservices", "database design"],
        "Frontend Developer": ["frontend", "react developer", "ui engineer", "nextjs", "angular developer"],
        "Full Stack Developer": ["full stack", "fullstack", "mern", "mean stack", "end-to-end"],
        "DevOps Engineer": ["devops", "site reliability", "infrastructure", "kubernetes", "ci/cd pipeline"],
        "Data Engineer": ["data engineer", "etl", "data pipeline", "apache spark", "airflow"],
        "Cybersecurity Analyst": ["security analyst", "penetration testing", "siem", "threat hunting"],
        "Mobile Developer": ["mobile developer", "ios developer", "android developer", "flutter developer"],
    }

    scores = {}
    for role, signals in role_signals.items():
        scores[role] = sum(1 for s in signals if s in jd_lower)

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Software Engineer"


def _generate_recommendations(
    matched: List[str],
    missing: List[str],
    semantic_score: float,
    keyword_score: float,
) -> List[str]:
    """Generate 3 actionable JD-match recommendations."""
    recs = []

    if missing:
        top_missing = missing[:3]
        recs.append(
            f"Add the following missing skills to your resume: {', '.join(top_missing)}. "
            f"Even basic exposure to these will significantly increase your match score."
        )

    if keyword_score < 60:
        recs.append(
            "Your keyword overlap with the JD is low. Mirror the JD's exact technology names "
            "in your Skills section (e.g. if JD says 'PostgreSQL', use 'PostgreSQL' not just 'databases')."
        )

    if semantic_score < 55:
        recs.append(
            "The semantic alignment between your resume and this JD is weak. Tailor your "
            "Professional Summary and Experience bullet points to reflect the JD's core requirements."
        )
    elif semantic_score < 75:
        recs.append(
            "Your semantic match is decent, but could be improved. Try incorporating more "
            "industry-specific terminology and context from the JD into your project descriptions."
        )

    if len(recs) < 5 and matched:
        recs.append(
            f"Strengthen descriptions of your {matched[0]} experience with specific metrics and impact. "
            "Recruiters reviewing this JD will specifically validate these skills."
        )

    if len(recs) < 5:
        recs.append(
            "Consider adding a tailored cover letter referencing specific JD requirements — "
            "this boosts ATS scores in systems that combine both documents."
        )
        
    if len(recs) < 5 and len(matched) > 2:
        recs.append(
            f"You have a solid foundation with {matched[0]} and {matched[1]}. Ensure these "
            "are prominently featured at the top of your resume to catch the recruiter's eye immediately."
        )

    return recs[:5]


def match_jd(
    resume_skills: List[str],
    resume_text: str,
    jd_text: str,
) -> JDMatchResult:
    """
    Engine 4 entry point — Compare resume against a job description.

    Args:
        resume_skills: Skills already extracted from the resume.
        resume_text:   Full raw resume text.
        jd_text:       Raw job description text.

    Returns:
        JDMatchResult with semantic score, keyword score, matched/missing skills, and recommendations.
    """
    import sys
    from services.llm_service import extract_jd_details_with_llm

    # 0. Extract True JD Title and mandatory skills via LLM
    jd_details = extract_jd_details_with_llm(jd_text)
    inferred_role = jd_details.get("job_title", "Software Engineer")
    mandatory_skills = jd_details.get("mandatory_skills", [])

    # 1. Extract JD skills
    heuristic_jd_skills = _extract_jd_skills(jd_text)
    jd_skills = sorted(list(set(heuristic_jd_skills + mandatory_skills)))
    
    # 1.5 Extract additional skills directly from resume text as fallback
    direct_resume_skills = _extract_jd_skills(resume_text)

    # 2. Normalise both skill sets (combining parsed + directly extracted)
    combined_resume_skills = resume_skills + direct_resume_skills
    resume_norm = _normalise_skills(combined_resume_skills)
    jd_norm     = _normalise_skills(jd_skills)
    mandatory_norm = _normalise_skills(mandatory_skills)

    # 3. Match / Missing
    matched = [s for s in jd_skills if _normalise_skills([s]) & resume_norm]
    missing = [s for s in jd_skills if not (_normalise_skills([s]) & resume_norm)]

    # 4. Keyword match score
    keyword_score = round(len(matched) / max(len(jd_norm), 1) * 100, 1) if jd_norm else 0.0

    # 5. Semantic similarity
    resume_repr = f"{resume_text[:4000]} {' '.join(combined_resume_skills)}"
    jd_repr     = f"{jd_text[:4000]}"
    semantic_score = _semantic_similarity(resume_repr, jd_repr)

    # 6. Tailored Final ATS Score
    # Calculate how many of the *mandatory* skills were matched
    mandatory_matched = [s for s in mandatory_skills if _normalise_skills([s]) & resume_norm]
    mandatory_coverage = len(mandatory_matched) / max(len(mandatory_norm), 1) if mandatory_norm else 1.0

    # Base weighted score
    base_score = (semantic_score * 0.55) + (keyword_score * 0.45)
    
    # Apply Mandatory Skills Multiplier (Penalty if missing core skills, Boost if present)
    multiplier = 0.7 + (0.4 * mandatory_coverage)  # Ranges from 0.7 (if 0% mandatory matched) to 1.1 (if 100%)
    final_ats = round(min(base_score * multiplier, 100.0), 1)

    # 7. Coverage stat
    coverage = round(len(matched) / max(len(jd_norm), 1) * 100, 1)

    # 8. Recommendations
    recommendations = _generate_recommendations(matched, missing, semantic_score, keyword_score)

    return JDMatchResult(
        semantic_match=semantic_score,
        keyword_match=keyword_score,
        final_ats=final_ats,
        matched_skills=matched,
        missing_skills=missing,
        inferred_jd_role=inferred_role,
        recommendations=recommendations,
        total_jd_skills=len(jd_norm),
        resume_skill_coverage=coverage,
    )
