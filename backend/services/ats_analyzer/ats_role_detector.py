"""
ats_role_detector.py
--------------------
Engine 2: Target Role Alignment

Uses the XGBoost Role Predictor (trained in train_models.py) to identify
best-fit roles, then cross-references with the TAXONOMY to produce:
  - Confidence score per role
  - Matched skills (from candidate)
  - Missing skills (from taxonomy requirement)
  - Evidence string (e.g. "Matched 5 critical competencies")
  - Reason string (1-sentence human-readable summary)

Fallback: If ML models not yet trained, falls back to TAXONOMY-only matching.
"""

import logging
from typing import List
from .ats_models import RolePrediction
from .ats_skill_taxonomy import TAXONOMY

logger = logging.getLogger(__name__)


def _taxonomy_match(candidate_skills_lower: set) -> List[RolePrediction]:
    """Pure rule-based role detection from TAXONOMY (fallback)."""
    predictions = []

    for role_title, reqs in TAXONOMY.items():
        core = set(s.lower() for s in reqs.get("core", []))
        secondary = set(s.lower() for s in reqs.get("secondary", []))

        matched_core = core & candidate_skills_lower
        matched_sec  = secondary & candidate_skills_lower
        missing_core = core - candidate_skills_lower

        if not matched_core:
            continue

        core_pct = len(matched_core) / len(core) if core else 0
        sec_pct  = len(matched_sec) / len(secondary) if secondary else 0
        confidence = round((core_pct * 0.7 + sec_pct * 0.3) * 100, 1)

        if confidence < 5:
            continue

        # Build casing maps
        all_reqs = reqs.get("core", []) + reqs.get("secondary", [])
        req_map  = {s.lower(): s for s in all_reqs}

        matched  = [req_map[s] for s in matched_core | matched_sec if s in req_map]
        missing  = [req_map[s] for s in missing_core if s in req_map][:6]

        n_matched = len(matched)
        evidence  = f"Matched {n_matched} required competenc{'y' if n_matched == 1 else 'ies'}"
        reason    = _build_reason(role_title, matched, missing, confidence)

        predictions.append(RolePrediction(
            title=role_title,
            confidence=confidence,
            matched_skills=matched,
            missing_skills=missing,
            evidence=evidence,
            reason=reason,
        ))

    predictions.sort(key=lambda x: x.confidence, reverse=True)
    return predictions[:5]


def _ml_predict_roles(candidate_skills: List[str]) -> List[str]:
    """
    Use the trained XGBoost Role Predictor to rank roles by confidence.
    Returns a list of role names ordered by probability (highest first).
    """
    try:
        import joblib
        import os
        import sys

        # Resolve backend root — this file is at backend/services/ats_analyzer/
        _dir = os.path.dirname(os.path.abspath(__file__))
        backend_root = os.path.abspath(os.path.join(_dir, "..", ".."))
        if backend_root not in sys.path:
            sys.path.insert(0, backend_root)

        models_dir = os.path.join(backend_root, "ai_model", "models", "resume_analyzer")
        vec = joblib.load(os.path.join(models_dir, "vectorizer_role.pkl"))
        clf = joblib.load(os.path.join(models_dir, "role_model.pkl"))
        le  = joblib.load(os.path.join(models_dir, "label_encoder.pkl"))

        text = " ".join(candidate_skills)
        X    = vec.transform([text])
        prob = clf.predict_proba(X)[0]

        # Rank all roles by probability
        ranked = sorted(
            [(le.inverse_transform([i])[0], float(p)) for i, p in enumerate(prob)],
            key=lambda x: x[1], reverse=True
        )
        return [(name, round(prob * 100, 1)) for name, prob in ranked]

    except Exception as e:
        logger.warning(f"[RoleDetector] ML model unavailable: {e}. Using taxonomy fallback.")
        return []


def _build_reason(role: str, matched: List[str], missing: List[str], confidence: float) -> str:
    """Generate a 1-sentence human-readable reason for the role match."""
    if confidence >= 75:
        level = "strong"
    elif confidence >= 45:
        level = "solid"
    else:
        level = "partial"

    if matched:
        top_skills = ", ".join(matched[:3])
        reason = f"{level.capitalize()} alignment with {role} — key skills {top_skills} detected."
    else:
        reason = f"Partial profile match with {role} requirements."

    if missing:
        reason += f" Add {missing[0]} to strengthen this match."

    return reason


def detect_roles(candidate_skills: List[str]) -> List[RolePrediction]:
    """
    Engine 2 entry point — detect best-fit roles for the candidate.

    Pipeline:
      1. Try XGBoost role predictor for ML-ranked roles
      2. Cross-reference each role with TAXONOMY for matched/missing skills
      3. Fall back to TAXONOMY-only matching if ML unavailable

    Returns top 5 roles sorted by confidence descending.
    """
    candidate_skills_lower = set(s.lower() for s in candidate_skills)

    # Try ML predictions first
    ml_ranked = _ml_predict_roles(candidate_skills)

    if ml_ranked:
        predictions = []
        # ML gives us role probabilities; enrich with taxonomy data
        for role_name, ml_confidence in ml_ranked[:8]:
            reqs = TAXONOMY.get(role_name, {})
            core      = set(s.lower() for s in reqs.get("core", []))
            secondary = set(s.lower() for s in reqs.get("secondary", []))

            matched_core = core & candidate_skills_lower
            matched_sec  = secondary & candidate_skills_lower
            missing_core = (core - candidate_skills_lower)

            all_reqs = reqs.get("core", []) + reqs.get("secondary", [])
            req_map  = {s.lower(): s for s in all_reqs}

            matched = [req_map[s] for s in matched_core | matched_sec if s in req_map]
            missing = [req_map[s] for s in missing_core if s in req_map][:6]

            # Blend ML confidence with taxonomy coverage
            tax_coverage = (len(matched_core) / len(core) * 100) if core else ml_confidence
            final_confidence = round((ml_confidence * 0.6 + tax_coverage * 0.4), 1)

            n_matched = len(matched)
            evidence  = f"Matched {n_matched} required competenc{'y' if n_matched == 1 else 'ies'} (ML confidence: {ml_confidence}%)"
            reason    = _build_reason(role_name, matched, missing, final_confidence)

            predictions.append(RolePrediction(
                title=role_name,
                confidence=final_confidence,
                matched_skills=matched,
                missing_skills=missing,
                evidence=evidence,
                reason=reason,
            ))

        # Sort by final blended confidence
        predictions.sort(key=lambda x: x.confidence, reverse=True)
        return predictions[:5]

    # Fallback to pure taxonomy matching
    return _taxonomy_match(candidate_skills_lower)
