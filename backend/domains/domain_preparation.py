"""
Domain Preparation
==================
Generates a structured, tiered learning roadmap for non-IT domains.
Maps domain-specific skill categories to the frontend's 4-card tier keys:
  - 'programming' -> Basic Fundamentals / Core Strategy
  - 'dsa' -> Methods / Process Design
  - 'core_cs' -> Tools & Technology
  - 'domain' -> Domain-specific practice & advanced topics
"""

import logging
from typing import Dict, List, Optional
from domains.registry import domain_registry

logger = logging.getLogger(__name__)


def generate_plan(missing_skills: List[str], top_role: str, domain: str) -> dict:
    """
    Generate a structured learning plan from missing skills.
    
    Returns a dict with:
      - target_role
      - learning_plan: list of skill objects
      - tiers: dict of tiers grouping skills
      - total_gaps: int
      - estimated_weeks: int
    """
    if not domain_registry.is_registered(domain):
        return {
            "target_role": top_role,
            "learning_plan": [],
            "tiers": {"programming": [], "dsa": [], "core_cs": [], "domain": []},
            "total_gaps": 0,
            "estimated_weeks": 0
        }

    if not missing_skills:
        return {
            "target_role": top_role,
            "learning_plan": [],
            "tiers": {"programming": [], "dsa": [], "core_cs": [], "domain": []},
            "total_gaps": 0,
            "estimated_weeks": 0
        }

    config = domain_registry.get_domain(domain)
    skills_dict = config.get("skills_dictionary", {})
    matrix = domain_registry.get_role_skill_matrix(domain)
    skill_topics = domain_registry.get_skill_topics(domain)

    # Map the domain's skills_dictionary categories to the 4 frontend tier keys
    # Map them dynamically based on order of categories in config
    categories = list(skills_dict.keys())
    tier_mapping = {}
    
    # Simple default mappings
    for idx, cat in enumerate(categories):
        if idx == 0:
            tier_mapping[cat] = "programming"
        elif idx == 1:
            tier_mapping[cat] = "dsa"
        elif idx == 2:
            tier_mapping[cat] = "core_cs"
        else:
            tier_mapping[cat] = "domain"

    # Helper function to classify a skill's tier based on its category
    def get_skill_tier(skill_name: str) -> str:
        for cat, cat_skills in skills_dict.items():
            if any(s.lower() == skill_name.lower() for s in cat_skills):
                return tier_mapping.get(cat, "domain")
        return "domain"

    # Helper function to get priority
    role_matrix = matrix.get(top_role, {})
    core_set = set([s.lower() for s in role_matrix.get("core", [])])
    secondary_set = set([s.lower() for s in role_matrix.get("secondary", [])])
    soft_set = set([s.lower() for s in role_matrix.get("soft", [])])

    def get_skill_priority(skill_name: str) -> str:
        skill_lower = skill_name.lower()
        if skill_lower in core_set:
            return "high"
        elif skill_lower in secondary_set:
            return "medium"
        elif skill_lower in soft_set:
            return "low"
        return "medium"

    learning_plan = []
    priority_order = {"high": 0, "medium": 1, "low": 2}

    for skill in missing_skills:
        priority = get_skill_priority(skill)
        tier = get_skill_tier(skill)
        
        # Get topics or fallback
        topics = []
        for orig_skill, skill_tps in skill_topics.items():
            if orig_skill.lower() == skill.lower():
                topics = skill_tps
                break
        if not topics:
            topics = [f"Core {skill} concepts", f"Applied {skill}", f"Advanced {skill}"]

        learning_plan.append({
            "skill": skill,
            "priority": priority,
            "tier": tier,
            "topics": topics,
            "topic_count": len(topics)
        })

    # Sort: high > medium > low
    learning_plan.sort(key=lambda x: (priority_order.get(x["priority"], 1), x["skill"]))

    # Group into tiers
    tiers = {"programming": [], "dsa": [], "core_cs": [], "domain": []}
    for item in learning_plan:
        tier_key = item["tier"]
        if tier_key in tiers:
            tiers[tier_key].append(item)
        else:
            tiers["domain"].append(item)

    # Week estimate
    week_weights = {"high": 2, "medium": 1.5, "low": 1}
    estimated_weeks = int(sum(week_weights.get(item["priority"], 1) for item in learning_plan))

    return {
        "target_role": top_role,
        "learning_plan": learning_plan,
        "tiers": tiers,
        "total_gaps": len(missing_skills),
        "estimated_weeks": estimated_weeks
    }
