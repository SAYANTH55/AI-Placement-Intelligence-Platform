"""
AI Model utilities for skill normalization and fuzzy matching
"""

from .skill_normalizer import (
    normalize_skill,
    fuzzy_match_skill,
    match_skill_to_requirements,
    calculate_weighted_match,
    get_skill_diversity_score,
)

__all__ = [
    "normalize_skill",
    "fuzzy_match_skill",
    "match_skill_to_requirements",
    "calculate_weighted_match",
    "get_skill_diversity_score",
]
