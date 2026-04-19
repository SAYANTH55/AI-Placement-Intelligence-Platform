"""
Preparation Engine
==================
Converts identified skill gaps into a structured, tiered learning roadmap.

Strategy: 100% Deterministic — no LLM calls.
  - Uses ROLE_SKILL_MATRIX to determine priority tier (core > secondary > soft)
  - Uses SKILL_TOPICS to expand each skill into concrete sub-topics
  - Groups output into 4 canonical tiers for the frontend:
      Tier 1: Programming Fundamentals
      Tier 2: DSA & Algorithms
      Tier 3: Core CS Concepts
      Tier 4: Domain Specific
"""

import logging
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai_model.data.skills_data import ROLE_SKILL_MATRIX, SKILL_TOPICS

logger = logging.getLogger(__name__)

# ── Canonical Tier Classification ─────────────────────────────────────────────
# Maps skill names to static tiers for the 4-card frontend layout.

PROGRAMMING_FUNDAMENTALS = {
    "Python", "Java", "JavaScript", "TypeScript", "C++", "Go", "C#", "Kotlin",
    "SQL", "OOP", "Design Patterns", "Git", "REST API"
}

DSA_SKILLS = {
    "Data Structures", "Algorithms", "Dynamic Programming", "System Design",
    "Microservices", "Design Patterns", "OOP"
}

CORE_CS_SKILLS = {
    "Operating Systems", "Networking", "DBMS", "SQL", "PostgreSQL", "MySQL",
    "MongoDB", "Redis", "Linux", "Computer Networks", "Database", "ACID",
    "TCP/IP", "HTTP"
}

DOMAIN_SKILLS = {
    "React", "Angular", "Node.js", "Express", "Django", "Flask", "FastAPI",
    "Spring Boot", "Next.js", "Machine Learning", "Deep Learning", "TensorFlow",
    "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "NLP", "MLOps",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "CI/CD",
    "Selenium", "Jest", "Cypress", "Mobile App Developer", "Flutter",
    "React Native", "Kafka", "Apache Spark", "Airflow"
}


def _classify_tier(skill: str) -> str:
    """Classify a skill into one of four canonical tiers."""
    if skill in DSA_SKILLS:
        return "dsa"
    if skill in PROGRAMMING_FUNDAMENTALS:
        return "programming"
    if skill in CORE_CS_SKILLS:
        return "core_cs"
    return "domain"


def _get_priority(skill: str, role: str) -> str:
    """Determine skill priority (high/medium/low) from the role matrix."""
    matrix = ROLE_SKILL_MATRIX.get(role, {})
    if skill in matrix.get("core", []):
        return "high"
    if skill in matrix.get("secondary", []):
        return "medium"
    if skill in matrix.get("soft", []):
        return "low"
    # Default: medium if the role matrix doesn't list it
    return "medium"


def generate_plan(missing_skills: list, top_role: str) -> dict:
    """
    Generate a structured, tiered learning plan from a list of missing skills.

    Args:
        missing_skills: List of skill strings identified as gaps.
        top_role: The top matched role string (e.g., "Backend Developer").

    Returns:
        dict with:
          - target_role
          - learning_plan: list of skill objects with priority, tier, topics
          - tiers: dict grouping skills by tier for the 4-card UI layout
          - total_gaps: int
          - estimated_weeks: int (rough estimate)
    """
    if not missing_skills:
        return {
            "target_role": top_role,
            "learning_plan": [],
            "tiers": {
                "programming": [],
                "dsa": [],
                "core_cs": [],
                "domain": []
            },
            "total_gaps": 0,
            "estimated_weeks": 0
        }

    learning_plan = []
    # Priority order for sorting: high > medium > low
    priority_order = {"high": 0, "medium": 1, "low": 2}

    for skill in missing_skills:
        priority = _get_priority(skill, top_role)
        tier = _classify_tier(skill)
        topics = SKILL_TOPICS.get(skill, [f"Core {skill} concepts", f"Applied {skill}", f"Advanced {skill}"])

        learning_plan.append({
            "skill": skill,
            "priority": priority,
            "tier": tier,
            "topics": topics,
            "topic_count": len(topics)
        })

    # Sort by priority then alphabetically within same priority
    learning_plan.sort(key=lambda x: (priority_order.get(x["priority"], 1), x["skill"]))

    # Group into tiers for the 4-card UI layout
    tiers = {"programming": [], "dsa": [], "core_cs": [], "domain": []}
    for item in learning_plan:
        tier_key = item["tier"]
        if tier_key in tiers:
            tiers[tier_key].append(item)
        else:
            tiers["domain"].append(item)

    # Rough week estimate: high=2 weeks, medium=1.5 weeks, low=1 week per skill
    week_weights = {"high": 2, "medium": 1.5, "low": 1}
    estimated_weeks = int(sum(week_weights.get(item["priority"], 1) for item in learning_plan))

    return {
        "target_role": top_role,
        "learning_plan": learning_plan,
        "tiers": tiers,
        "total_gaps": len(missing_skills),
        "estimated_weeks": estimated_weeks
    }


def get_next_actions(learning_plan: list, completed_topics: list = None) -> list:
    """
    Filter out completed topics and return the top 3 immediate actions.

    Args:
        learning_plan: Output from generate_plan()["learning_plan"]
        completed_topics: List of topic strings already marked complete.

    Returns:
        List of up to 3 next action strings.
    """
    completed = set(completed_topics or [])
    actions = []

    for item in learning_plan:
        if item["priority"] == "high":
            for topic in item["topics"]:
                if topic not in completed:
                    actions.append(f"Learn {item['skill']}: {topic}")
                    if len(actions) >= 3:
                        return actions

    return actions
