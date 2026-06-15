"""
Domain Intelligence Package
============================
Provides multi-domain career intelligence capabilities.

Phase 1 Domains: IT (existing), Business, Finance, Legal, Healthcare, Engineering
Phase 2+: HR, Marketing, Education, Research, Biotech, Mechanical, Civil

IT domain continues to use the protected pipeline in ai_model/.
All non-IT domains use config-driven analysis from this package.
"""

from domains.registry import domain_registry

__all__ = ["domain_registry"]
