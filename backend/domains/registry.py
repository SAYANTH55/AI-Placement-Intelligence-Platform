"""
Domain Registry
================
Thread-safe, singleton registry that loads and serves domain configurations
from JSON files in backend/domains/configs/.

Usage:
    from domains.registry import domain_registry
    
    domain_registry.get_domain("finance")      # → full config dict
    domain_registry.list_domains()              # → ["business", "finance", ...]
    domain_registry.get_skills_for_domain("legal")  # → flattened skill list
    domain_registry.get_roles_for_domain("healthcare")  # → role requirements dict

Architecture:
    - Configs are loaded once at import time (matches existing singleton pattern)
    - Hot-reload via registry.reload() for development
    - IT domain is NOT registered here — it uses the protected pipeline
"""

import os
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_CONFIGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "configs")


class DomainRegistry:
    """
    Central registry for all non-IT domain configurations.
    
    Each domain config JSON must contain:
        - domain_name: str
        - display_name: str
        - skills_dictionary: dict[category → list[skill]]
        - role_requirements: dict[role → list[skill]]
        - role_salaries: dict[role → str]
        - role_skill_matrix: dict[role → {core, secondary, soft}]
        - skill_topics: dict[skill → list[topic]]
        - keywords: list[str]  (for classifier Layer 1)
        - education_signals: list[str]  (for classifier Layer 2)
        - certification_signals: list[str]  (for classifier Layer 2)
    """

    def __init__(self):
        self._domains: dict[str, dict] = {}
        self._load_all_configs()

    def _load_all_configs(self):
        """Scan configs/ directory and load all .json files."""
        if not os.path.isdir(_CONFIGS_DIR):
            logger.warning(f"Domain configs directory not found: {_CONFIGS_DIR}")
            return

        loaded = 0
        for filename in sorted(os.listdir(_CONFIGS_DIR)):
            if not filename.endswith(".json"):
                continue
            filepath = os.path.join(_CONFIGS_DIR, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    config = json.load(f)
                domain_name = config.get("domain_name", filename.replace(".json", ""))
                self._domains[domain_name.lower()] = config
                loaded += 1
                logger.info(f"Loaded domain config: {domain_name} ({filename})")
            except Exception as e:
                logger.error(f"Failed to load domain config {filename}: {e}")

        logger.info(f"Domain Registry initialized: {loaded} domains loaded")

    # ── Public API ──────────────────────────────────────────────────────────

    def get_domain(self, name: str) -> Optional[dict]:
        """Get full config for a domain. Returns None if not found."""
        return self._domains.get(name.lower())

    def list_domains(self) -> list[str]:
        """List all registered domain names."""
        return list(self._domains.keys())

    def is_registered(self, name: str) -> bool:
        """Check if a domain is registered."""
        return name.lower() in self._domains

    def get_skills_for_domain(self, name: str) -> list[str]:
        """Get flattened list of all skills for a domain."""
        config = self.get_domain(name)
        if not config:
            return []
        skills_dict = config.get("skills_dictionary", {})
        flat = []
        for category_skills in skills_dict.values():
            if isinstance(category_skills, list):
                flat.extend(category_skills)
        return list(set(flat))

    def get_roles_for_domain(self, name: str) -> dict:
        """Get role requirements dict for a domain."""
        config = self.get_domain(name)
        if not config:
            return {}
        return config.get("role_requirements", {})

    def get_role_salaries(self, name: str) -> dict:
        """Get role salary ranges for a domain."""
        config = self.get_domain(name)
        if not config:
            return {}
        return config.get("role_salaries", {})

    def get_role_skill_matrix(self, name: str) -> dict:
        """Get tiered skill matrix (core/secondary/soft) for a domain."""
        config = self.get_domain(name)
        if not config:
            return {}
        return config.get("role_skill_matrix", {})

    def get_skill_topics(self, name: str) -> dict:
        """Get skill → topics mapping for a domain."""
        config = self.get_domain(name)
        if not config:
            return {}
        return config.get("skill_topics", {})

    def get_keywords(self, name: str) -> list[str]:
        """Get domain-detection keywords for classifier Layer 1."""
        config = self.get_domain(name)
        if not config:
            return []
        return config.get("keywords", [])

    def get_education_signals(self, name: str) -> list[str]:
        """Get education-based signals for classifier Layer 2."""
        config = self.get_domain(name)
        if not config:
            return []
        return config.get("education_signals", [])

    def get_certification_signals(self, name: str) -> list[str]:
        """Get certification-based signals for classifier Layer 2."""
        config = self.get_domain(name)
        if not config:
            return []
        return config.get("certification_signals", [])

    def get_all_domain_keywords(self) -> dict[str, list[str]]:
        """Get keywords for ALL domains (used by classifier)."""
        return {
            name: config.get("keywords", [])
            for name, config in self._domains.items()
        }

    def reload(self):
        """Hot-reload all configs from disk. For development use."""
        self._domains.clear()
        self._load_all_configs()
        logger.info("Domain Registry reloaded")


# ── Module-level singleton (matches existing codebase convention) ────────────
domain_registry = DomainRegistry()
