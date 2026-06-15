"""
Domain Analyzer
===============
Config-driven Resume Analyzer for non-IT domains (Business, Finance, Legal, Healthcare, Engineering).
Provides skill extraction, skill scoring, ATS scoring, and skill gap detection.
"""

import re
import logging
from typing import Dict, List, Optional
from domains.registry import domain_registry

logger = logging.getLogger(__name__)


class DomainAnalyzer:
    """
    Analyzes resumes using domain-specific configuration JSONs.
    """

    def clean_text(self, text: str) -> str:
        """Standardizes text for skill extraction."""
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s#\+\.]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def extract_skills(self, text: str, domain: str) -> List[str]:
        """Extracts skills belonging to the specified domain using word boundaries."""
        if not text or not domain_registry.is_registered(domain):
            return []

        cleaned = self.clean_text(text)
        domain_skills = domain_registry.get_skills_for_domain(domain)
        found_skills = []

        # Loop through skills and match exact word boundaries
        for skill in domain_skills:
            if re.search(r'\b' + re.escape(skill.lower()) + r'\b', cleaned):
                found_skills.append(skill)

        return list(set(found_skills))

    def analyze_resume(self, text: str, domain: str, target_role: Optional[str] = None) -> dict:
        """
        Main analysis method. Returns an identical structure to the IT ResumeAnalyzer's output.
        """
        analysis = {
            "role_fit": "Analysis Unavailable",
            "ats_score": 0.0,
            "skill_score": 0.0,
            "skills_found": [],
            "gaps": []
        }

        if not text:
            return analysis

        try:
            cleaned = self.clean_text(text)
            found_skills = self.extract_skills(cleaned, domain)
            analysis["skills_found"] = found_skills

            # Determine target/fit role
            roles = domain_registry.get_roles_for_domain(domain)
            if not roles:
                analysis["gaps"] = ["No roles configured for this domain."]
                return analysis

            # If no target role specified, determine the best fit role based on skill overlap
            if not target_role or target_role not in roles:
                best_role = list(roles.keys())[0]
                max_overlap = -1
                for role, req_skills in roles.items():
                    req_set = set([s.lower() for s in req_skills])
                    curr_set = set([s.lower() for s in found_skills])
                    overlap = len(req_set.intersection(curr_set))
                    if overlap > max_overlap:
                        max_overlap = overlap
                        best_role = role
                target_role = best_role

            analysis["role_fit"] = target_role

            # Calculate Skill Gaps & Skill Score
            required_skills = roles.get(target_role, [])
            required_lower = set([s.lower() for s in required_skills])
            current_lower = set([s.lower() for s in found_skills])

            missing_lower = required_lower - current_lower
            
            # Map back to original casing
            missing_skills = []
            for s in required_skills:
                if s.lower() in missing_lower:
                    missing_skills.append(s)

            analysis["gaps"] = missing_skills

            # Skill Score: percentage of required skills present
            if required_skills:
                analysis["skill_score"] = (len(current_lower.intersection(required_lower)) / len(required_lower)) * 100.0
            else:
                analysis["skill_score"] = min(100.0, len(found_skills) * 10.0)

            # ATS Score: simulated based on keyword densities, certifications, and skills present
            # Base ATS score is the skill score, modified by certification signals
            cert_signals = domain_registry.get_certification_signals(domain)
            cert_matches = 0
            for cert in cert_signals:
                if re.search(r'\b' + re.escape(cert.lower()) + r'\b', cleaned):
                    cert_matches += 1
            
            ats_score = analysis["skill_score"] * 0.7 + min(100.0, cert_matches * 15.0) * 0.3
            analysis["ats_score"] = round(min(100.0, max(10.0, ats_score)), 1)

        except Exception as e:
            logger.error(f"Error analyzing resume in domain {domain}: {e}", exc_info=True)
            analysis["gaps"].append(f"Analysis error: {str(e)}")

        return analysis


# Singleton instance
domain_analyzer = DomainAnalyzer()
