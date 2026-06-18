import os
import sys
import json
import glob
import logging
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from database.db import SessionLocal
from database.models import Domain, Skill, SkillAlias

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_taxonomy():
    db: Session = SessionLocal()
    
    logger.info("Starting Taxonomy Seeding...")
    config_dir = os.path.join(os.path.dirname(__file__), "..", "domains", "configs")
    json_files = glob.glob(os.path.join(config_dir, "*.json"))
    
    try:
        total_domains = 0
        total_skills = 0
        
        for file_path in json_files:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            domain_name = data.get("domain_name")
            description = data.get("description", "")
            
            if not domain_name:
                continue
                
            # Create or update domain
            domain = db.query(Domain).filter(Domain.domain_name == domain_name).first()
            if not domain:
                domain = Domain(domain_name=domain_name, description=description)
                db.add(domain)
                db.commit()
                db.refresh(domain)
                total_domains += 1
            
            # Seed skills from skills_dictionary
            skills_dict = data.get("skills_dictionary", {})
            for category, skills_list in skills_dict.items():
                for skill_name in skills_list:
                    skill_name_lower = skill_name.strip().lower()
                    
                    skill = db.query(Skill).filter(Skill.skill_name == skill_name_lower).first()
                    if not skill:
                        skill = Skill(
                            skill_name=skill_name_lower,
                            domain=domain_name,
                            category=category
                        )
                        db.add(skill)
                        db.flush() # Flush to make it visible to subsequent queries and enforce uniqueness
                        total_skills += 1
                    else:
                        # Update domain/category if it's missing
                        if not skill.domain:
                            skill.domain = domain_name
                        if not skill.category:
                            skill.category = category
            
            db.commit()
            
        logger.info(f"Taxonomy Seeding Complete: {total_domains} Domains, {total_skills} New Skills added.")
        
        # Write report
        report_path = os.path.join(os.path.dirname(__file__), "..", "..", "taxonomy_seed_report.md")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("# Taxonomy Seed Report\n\n")
            f.write(f"Successfully seeded {total_domains} new domains and {total_skills} domain-specific skills from config files.\n")
            f.write("\n## Seeded Domains:\n")
            domains = db.query(Domain).all()
            for d in domains:
                f.write(f"- {d.domain_name.capitalize()}: {d.description}\n")

    except Exception as e:
        logger.error(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_taxonomy()
