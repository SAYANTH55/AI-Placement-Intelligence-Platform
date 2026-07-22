"""
job_recommendation_engine.py
-----------------------------
SentenceTransformer-based Job Recommendation Engine.

Pipeline:
  1. Load JD corpus (75 curated real-world job descriptions)
  2. Encode all JDs to embeddings using all-MiniLM-L6-v2
  3. Cache embeddings to disk (only computed once)
  4. Accept candidate skills string → encode → cosine similarity → ranked JDs

Fallback: If sentence-transformers / torch is unavailable,
          falls back to TF-IDF cosine similarity automatically.
"""

import os
import json
import logging
import numpy as np
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_THIS_DIR    = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR  = os.path.join(_THIS_DIR, "models")
_CACHE_FILE  = os.path.join(_MODELS_DIR, "jd_embeddings_cache.npz")
_TFIDF_CACHE = os.path.join(_MODELS_DIR, "jd_tfidf_cache.pkl")

# ── Lazy singletons ────────────────────────────────────────────────────────
_st_model   = None
_jd_corpus  = None
_jd_texts   = None
_embeddings = None  # ST embeddings
_tfidf_vec  = None  # fallback
_tfidf_mat  = None  # fallback
_use_st     = None  # None = not yet determined

# ── Check availability once ────────────────────────────────────────────────
def _check_st_available() -> bool:
    global _use_st
    if _use_st is not None:
        return _use_st
    try:
        import sentence_transformers  # noqa
        import torch  # noqa
        _use_st = True
        logger.info("[RecommendationEngine] SentenceTransformers available — using semantic embeddings.")
    except ImportError:
        _use_st = False
        logger.warning("[RecommendationEngine] SentenceTransformers/torch not found — using TF-IDF cosine fallback.")
    return _use_st


def _get_corpus():
    global _jd_corpus, _jd_texts
    if _jd_corpus is None:
        import sys
        backend_root = os.path.dirname(_THIS_DIR)
        if backend_root not in sys.path:
            sys.path.insert(0, backend_root)
        from ai_model.data.jd_corpus import get_jd_corpus, get_jd_texts
        _jd_corpus = get_jd_corpus()
        _jd_texts  = get_jd_texts()
    return _jd_corpus, _jd_texts


# ══════════════════════════════════════════════════════════════════════════════
# SENTENCE TRANSFORMER PATH
# ══════════════════════════════════════════════════════════════════════════════

def _get_st_model():
    global _st_model
    if _st_model is None:
        from sentence_transformers import SentenceTransformer
        model_dir = os.path.join(_MODELS_DIR, "sentence_model")
        os.makedirs(model_dir, exist_ok=True)
        logger.info("[RecommendationEngine] Loading all-MiniLM-L6-v2...")
        _st_model = SentenceTransformer("all-MiniLM-L6-v2", cache_folder=model_dir)
    return _st_model


def _get_st_embeddings():
    global _embeddings
    if _embeddings is not None:
        return _embeddings

    _, jd_texts = _get_corpus()

    # Load from disk cache if available
    if os.path.exists(_CACHE_FILE):
        try:
            loaded = np.load(_CACHE_FILE)
            _embeddings = loaded["embeddings"]
            logger.info(f"[RecommendationEngine] Loaded JD embeddings from cache ({_embeddings.shape[0]} JDs).")
            return _embeddings
        except Exception as e:
            logger.warning(f"[RecommendationEngine] Cache load failed: {e} — recomputing...")

    # Compute and cache
    model = _get_st_model()
    logger.info(f"[RecommendationEngine] Encoding {len(jd_texts)} JDs...")
    _embeddings = model.encode(jd_texts, show_progress_bar=False, normalize_embeddings=True)
    os.makedirs(_MODELS_DIR, exist_ok=True)
    np.savez_compressed(_CACHE_FILE, embeddings=_embeddings)
    logger.info("[RecommendationEngine] JD embeddings cached to disk.")
    return _embeddings


# ══════════════════════════════════════════════════════════════════════════════
# TF-IDF FALLBACK PATH
# ══════════════════════════════════════════════════════════════════════════════

def _get_tfidf():
    global _tfidf_vec, _tfidf_mat
    if _tfidf_vec is not None:
        return _tfidf_vec, _tfidf_mat

    import joblib
    _, jd_texts = _get_corpus()

    if os.path.exists(_TFIDF_CACHE):
        try:
            cached = joblib.load(_TFIDF_CACHE)
            _tfidf_vec = cached["vec"]
            _tfidf_mat = cached["mat"]
            return _tfidf_vec, _tfidf_mat
        except Exception:
            pass

    from sklearn.feature_extraction.text import TfidfVectorizer
    _tfidf_vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=10000, sublinear_tf=True)
    _tfidf_mat = _tfidf_vec.fit_transform(jd_texts)

    joblib.dump({"vec": _tfidf_vec, "mat": _tfidf_mat}, _TFIDF_CACHE)
    return _tfidf_vec, _tfidf_mat


def _cosine_sim_tfidf(query_text: str) -> np.ndarray:
    from sklearn.metrics.pairwise import cosine_similarity
    vec, mat = _get_tfidf()
    q_vec = vec.transform([query_text])
    scores = cosine_similarity(q_vec, mat).flatten()
    return scores


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def get_top_jobs(candidate_skills: List[str], n: int = 5, domain_filter: str = None) -> List[Dict[str, Any]]:
    """
    Main recommendation function.

    Args:
        candidate_skills: List of skills from the candidate's resume.
        n: Number of top jobs to return.
        domain_filter: Optional — filter by domain (e.g., "Data Science", "Backend").

    Returns:
        List of dicts with keys: title, company_type, domain, skills, match_score, reason.
    """
    corpus, jd_texts = _get_corpus()
    query = " ".join(candidate_skills)

    # Compute similarity scores
    if _check_st_available():
        try:
            model = _get_st_model()
            q_emb  = model.encode([query], normalize_embeddings=True)
            embs   = _get_st_embeddings()
            scores = (embs @ q_emb.T).flatten()
        except Exception as e:
            logger.error(f"[RecommendationEngine] ST scoring failed: {e}. Falling back to TF-IDF.")
            scores = _cosine_sim_tfidf(query)
    else:
        scores = _cosine_sim_tfidf(query)

    # Apply domain filter
    indices = list(range(len(corpus)))
    if domain_filter:
        indices = [i for i in indices if corpus[i].get("domain", "").lower() == domain_filter.lower()]

    # Sort by score
    ranked = sorted(indices, key=lambda i: scores[i], reverse=True)[:n]

    results = []
    for i in ranked:
        jd = corpus[i]
        score = float(scores[i])

        # Find matching skills
        candidate_lower = set(s.lower() for s in candidate_skills)
        jd_skills_lower = set(s.lower() for s in jd.get("skills", []))
        matched = [s for s in jd.get("skills", []) if s.lower() in candidate_lower]
        missing = [s for s in jd.get("skills", []) if s.lower() not in candidate_lower]

        # Generate a human-readable reason
        match_pct = round(len(matched) / max(len(jd.get("skills", [1])), 1) * 100)
        if matched:
            reason = f"Matched {len(matched)} required skills: {', '.join(matched[:3])}{'...' if len(matched) > 3 else ''}."
        else:
            reason = f"Role aligns with your profile based on semantic similarity."

        results.append({
            "title":        jd["title"],
            "company_type": jd.get("company_type", ""),
            "domain":       jd.get("domain", ""),
            "skills":       jd.get("skills", []),
            "matched_skills": matched,
            "missing_skills": missing[:5],
            "match_score":  round(score * 100, 1),
            "skill_match_pct": match_pct,
            "reason":       reason,
            "description":  jd.get("description", ""),
        })

    return results


def warmup():
    """
    Pre-load and cache embeddings at server startup.
    Call this in a background thread to avoid first-request latency.
    """
    try:
        logger.info("[RecommendationEngine] Warming up JD embeddings...")
        if _check_st_available():
            _get_st_embeddings()
        else:
            _get_tfidf()
        logger.info("[RecommendationEngine] Warmup complete.")
    except Exception as e:
        logger.warning(f"[RecommendationEngine] Warmup failed (non-critical): {e}")


def predict_domain(resume_text: str) -> Dict[str, Any]:
    """Predict career domain from resume text using the trained Domain Classifier."""
    try:
        import sys, joblib
        backend_root = os.path.dirname(_THIS_DIR)
        if backend_root not in sys.path:
            sys.path.insert(0, backend_root)

        vec  = joblib.load(os.path.join(_MODELS_DIR, "vectorizer_domain.pkl"))
        clf  = joblib.load(os.path.join(_MODELS_DIR, "domain_classifier.pkl"))
        le   = joblib.load(os.path.join(_MODELS_DIR, "label_encoder_domain.pkl"))

        X    = vec.transform([resume_text])
        pred = clf.predict(X)[0]
        prob = clf.predict_proba(X)[0]

        domain = le.inverse_transform([pred])[0]
        confidence = round(float(max(prob)) * 100, 1)

        return {"domain": domain, "confidence": confidence}
    except Exception as e:
        logger.error(f"[RecommendationEngine] Domain prediction failed: {e}")
        return {"domain": "IT", "confidence": 0.0}


def predict_role(skills_text: str) -> Dict[str, Any]:
    """Predict job role from resume skills text using the trained Role Predictor."""
    try:
        import sys, joblib
        backend_root = os.path.dirname(_THIS_DIR)
        if backend_root not in sys.path:
            sys.path.insert(0, backend_root)

        vec  = joblib.load(os.path.join(_MODELS_DIR, "resume_analyzer", "vectorizer_role.pkl"))
        clf  = joblib.load(os.path.join(_MODELS_DIR, "resume_analyzer", "role_model.pkl"))
        le   = joblib.load(os.path.join(_MODELS_DIR, "resume_analyzer", "label_encoder.pkl"))

        X    = vec.transform([skills_text])
        pred = clf.predict(X)[0]
        prob = clf.predict_proba(X)[0]

        role = le.inverse_transform([pred])[0]
        confidence = round(float(max(prob)) * 100, 1)

        # All role probabilities ranked
        all_probs = sorted(
            [(le.inverse_transform([i])[0], round(float(p) * 100, 1)) for i, p in enumerate(prob)],
            key=lambda x: x[1], reverse=True
        )

        return {
            "predicted_role": role,
            "confidence": confidence,
            "all_roles": all_probs[:5],
        }
    except Exception as e:
        logger.error(f"[RecommendationEngine] Role prediction failed: {e}")
        return {"predicted_role": "Software Engineer", "confidence": 0.0, "all_roles": []}
