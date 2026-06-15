import os
import re
import joblib
import logging

# Configure Logging for Production
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeAnalyzer:
    """
    Production-ready Resume Analyzer that loads ML models and provides
    prediction and analysis functionality.
    """
    
    def __init__(self):
        # Use relative pathing to locate the models directory
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.models_dir = os.path.normpath(os.path.join(self.base_dir, "..", "models", "resume_analyzer"))
        
        # Define model filenames
        self.model_files = {
            "role_model": "role_model.pkl",
            "vectorizer_role": "vectorizer_role.pkl",
            "ats_model": "ats_model.pkl",
            "vectorizer_ats": "vectorizer_ats.pkl",
            "skills": "skills.pkl",
            "label_encoder": "label_encoder.pkl"
        }
        
        # Model placeholders
        self.models = {}
        self.is_loaded = self._load_models()

    def _load_models(self):
        """Loads all required models into memory."""
        success = True
        for key, filename in self.model_files.items():
            path = os.path.join(self.models_dir, filename)
            if not os.path.exists(path):
                logger.warning(f"Model file missing: {filename} at {path}")
                logger.warning(f"Note: {filename} is required for advanced resume analysis features.")
                self.models[key] = None
                success = False
                continue
                
            try:
                self.models[key] = joblib.load(path)
                logger.info(f"Successfully loaded {filename}")
            except Exception as e:
                logger.error(f"FAILED to load {filename}: {str(e)}")
                self.models[key] = None
                success = False
        return success

    def clean_text(self, text: str) -> str:
        """Standardizes text for NLP processing."""
        if not text:
            return ""
        text = text.lower()
        # Remove special characters but keep alphanumeric and spaces
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def extract_skills(self, text: str) -> list:
        """Extracts skills based on the loaded skills database."""

        skills_db = self.models.get("skills")
        if not skills_db:
            return []
        found_skills = []
        text_padded = f" {text} "
        
        # Support both list and dictionary (role-mapped) formats for skills.pkl
        skill_list = []
        if isinstance(skills_db, dict):
            for v in skills_db.values():
                if isinstance(v, list): skill_list.extend(v)
            skill_list = list(set(skill_list))
        else:
            skill_list = skills_db
            
        for skill in skill_list:
            if isinstance(skill, str) and f" {skill.lower()} " in text_padded:
                found_skills.append(skill)
                
        return list(set(found_skills))

    def analyze_resume(self, text: str) -> dict:
        """
        Processes a resume text and returns a comprehensive analysis.
        Includes safety fallbacks if models fail to load or predict.
        """
        # Default safe fallback response
        analysis = {
            "role_fit": "Analysis Unavailable",
            "ats_score": 0.0,
            "skill_score": 0.0,
            "skills_found": [],
            "gaps": ["Error: ML models could not be loaded or executed. Check backend logs."]
        }
        
        try:
            # 1. Cleaning & Skill Extraction
            cleaned = self.clean_text(text)
            found_skills = self.extract_skills(cleaned)
            analysis["skills_found"] = found_skills
            
            # 2. Role Prediction
            role = "Unknown"
            role_model = self.models.get("role_model")
            vec_role = self.models.get("vectorizer_role")
            le = self.models.get("label_encoder")
            
            if role_model and vec_role and le:
                role_vec = vec_role.transform([cleaned])
                role_idx = role_model.predict(role_vec)
                role = le.inverse_transform(role_idx)[0]
                analysis["role_fit"] = role
                
            # 3. ATS Score Prediction
            ats_model = self.models.get("ats_model")
            vec_ats = self.models.get("vectorizer_ats")
            if ats_model and vec_ats:
                ats_vec = vec_ats.transform([cleaned])
                analysis["ats_score"] = float(ats_model.predict(ats_vec)[0])
            
            # 4. Skill Gap & Scoring
            skills_db = self.models.get("skills")
            if isinstance(skills_db, dict) and role in skills_db:
                required = set([s.lower() for s in skills_db[role]])
                current = set([s.lower() for s in found_skills])
                
                gaps = list(required - current)
                analysis["gaps"] = gaps
                
                if required:
                    analysis["skill_score"] = (len(current.intersection(required)) / len(required)) * 100.0
            else:
                # Basic fallback score
                analysis["skill_score"] = min(100.0, len(found_skills) * 5.0)
                analysis["gaps"] = ["Ensure resume matches target role keywords."]

        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            analysis["gaps"].append(f"Processing error: {str(e)}")
            
        return analysis

# Singleton instance for the application
analyzer_instance = ResumeAnalyzer()

# Functional wrapper for easy integration in routes
def analyze_resume(text: str) -> dict:
    return analyzer_instance.analyze_resume(text)
