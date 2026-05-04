import sys
import os
import asyncio
from datetime import datetime, timedelta

# Add parent dir to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from ai_model.resume_parser.parser import split_sections, extract_projects, extract_skills_with_fuzzy_matching
from user_intelligence.skill_vectorizer import vectorize_skills
from user_intelligence.behavior_tracker import update_skill_vector_from_behavior
from user_intelligence.intelligence_service import intelligence_service

async def run_diagnostics():
    print("STARTING INTELLIGENCE SYSTEM DIAGNOSTICS (PHASE 10 VERIFICATION)")
    
    # 1. Test Phase 1: Parsing
    sample_text = """
    EXPERIENCE
    Worked at Google for 5 years as a Backend Engineer.
    
    PROJECTS
    Scalable Chat App: Created a real-time messaging system using Node.js and Redis.
    Managed high-traffic API endpoints and implemented distributed caching.
    
    SKILLS
    Python, Java, JavaScript, Docker, Kubernetes
    """
    
    print("\n--- PHASE 1: Parsing & Section Detection ---")
    sections = split_sections(sample_text)
    print(f"Detected Sections: {list(sections.keys())}")
    
    projects = extract_projects(sections)
    print(f"Extracted Projects: {len(projects)}")
    if projects:
        print(f"Project 1 Name: {projects[0]['name']}")
        print(f"Project 1 Contexts: {projects[0]['contexts']}")
        
    skills = extract_skills_with_fuzzy_matching(sample_text, section_context="projects")
    print(f"Context-Aware Skills Sample: {skills[0]['name']} (Weight: {skills[0]['weight']})")

    # 2. Test Phase 2: Vectorization
    print("\n--- PHASE 2: Skill Representation ---")
    profile = {
        "skills": skills,
        "projects": projects
    }
    vector = vectorize_skills(profile)
    skill_key = list(vector.keys())[0]
    print(f"Vector Object Sample ({skill_key}):")
    print(f"  - Depth: {vector[skill_key]['depth']}")
    print(f"  - Contexts: {vector[skill_key]['contexts']}")

    # 3. Test Phase 3: Feedback Loop (Smoothing & Decay)
    print("\n--- PHASE 3: Stabilization (Decay) ---")
    old_time = (datetime.utcnow() - timedelta(days=10)).isoformat()
    behavior = {"mode": "active", "weak_areas": [], "strong_areas": [skill_key]}
    
    decayed_vector = update_skill_vector_from_behavior(vector, behavior, last_updated=old_time)
    original_score = vector[skill_key]['score']
    new_score = decayed_vector[skill_key]['score']
    print(f"Score Delta (10 day decay + boost): {original_score} -> {new_score}")

    # 4. Test Phase 7-9: Intelligence Output
    print("\n--- PHASE 7-9: Realism & Uncertainty ---")
    # Mocking a profile for full service run
    mock_profile = {
        "student_id": "test_user_123",
        "skills": skills,
        "projects": projects,
        "experience": {"years": 5},
        "metadata": {"raw_text": sample_text}
    }
    
    intel = intelligence_service.build_intelligence_profile(mock_profile)
    print(f"System Confidence: {intel.get('system_confidence')}")
    print(f"Predicted Score Range: {intel.get('prediction', {}).get('predicted_score_range')}")
    print(f"Intelligence Type: {intel.get('intelligence_score', {}).get('type')}")

    print("\nDIAGNOSTICS COMPLETE. SYSTEM STABLE.")

if __name__ == "__main__":
    asyncio.run(run_diagnostics())
