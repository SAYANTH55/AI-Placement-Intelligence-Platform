import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
import joblib
import os
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LinearRegression

# Create models directory if it doesn't exist
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

def generate_synthetic_data(n_samples=1000):
    """
    Generates synthetic data for student placement readiness prediction.
    Features: Years of Experience, Technical Skills Count, GPA, Project Count.
    Target: Placed (0 or 1)
    """
    np.random.seed(42)
    
    experience = np.random.uniform(0, 5, n_samples)
    skills_count = np.random.randint(1, 15, n_samples)
    gpa = np.random.uniform(2.5, 4.0, n_samples)
    projects = np.random.randint(0, 8, n_samples)
    
    # Simple logic for placement probability
    # Higher experience, skills, and GPA increase placement chance
    noise = np.random.normal(0, 0.5, n_samples)
    score = (experience * 2) + (skills_count * 0.5) + (gpa * 3) + (projects * 1.5) + noise
    threshold = np.percentile(score, 60) # Top 40% are "placed"
    
    placed = (score >= threshold).astype(int)
    
    df = pd.DataFrame({
        'experience': experience,
        'skills_count': skills_count,
        'gpa': gpa,
        'projects': projects,
        'placed': placed
    })
    
    return df

def train_placement_model():
    print("Generating synthetic data for placement prediction...")
    df = generate_synthetic_data()
    
    X = df.drop('placed', axis=1)
    y = df['placed']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    accuracy = model.score(X_test, y_test)
    print(f"Placement Model Accuracy: {accuracy:.2f}")
    
    model_path = os.path.join(MODELS_DIR, "placement_predictor.pkl")
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

def train_skill_matcher():
    """
    Trains a simple TF-IDF vectorizer on a corpus of technical skills 
    to enable semantic similarity matching.
    """
    print("Training Skill Matcher (TF-IDF)...")
    
    # Corpus of typical technical areas/skills
    skills_corpus = [
        "python javascript react nodejs sql aws docker",
        "java spring boot hibernate mysql microservices",
        "machine learning data science python pandas scikit-learn",
        "frontend html css react tailwind nextjs typescipt",
        "backend python django flask postgresql redis",
        "devops linux docker kubernetes terraform jenkins",
        "mobile react-native flutter swift kotlin ionic",
        "qa selenium cypress jest automation testing",
        "blockchain solidity ethereum web3 smart contracts",
        "security penetration testing ethical hacking networking"
    ]
    
    vectorizer = TfidfVectorizer()
    vectorizer.fit(skills_corpus)
    
    vec_path = os.path.join(MODELS_DIR, "skill_vectorizer.pkl")
    joblib.dump(vectorizer, vec_path)
    print(f"Skill Vectorizer saved to {vec_path}")

def train_resume_analyzer_models():
    print("Training Resume Analyzer Models (Synthetic Data)...")
    ra_dir = os.path.join(MODELS_DIR, "resume_analyzer")
    if not os.path.exists(ra_dir):
        os.makedirs(ra_dir)
        
    # 1. skills.pkl
    skills_db = {
        "Software Engineer": ["python", "java", "c++", "react", "sql", "javascript", "node", "aws"],
        "Data Scientist": ["python", "r", "sql", "machine learning", "pandas", "numpy", "tensorflow"],
        "Mechanical Engineer": ["cad", "solidworks", "thermodynamics", "manufacturing", "ansys"],
        "Marketing": ["seo", "content creation", "social media", "google analytics", "campaign"]
    }
    joblib.dump(skills_db, os.path.join(ra_dir, "skills.pkl"))
    
    # 2. role_model, vectorizer_role, label_encoder
    corpus = [
        "software engineer developing scalable applications python java react node aws",
        "data scientist machine learning models python pandas sql tensorflow",
        "mechanical engineer cad solidworks thermodynamics design ansys",
        "marketing manager seo content creation social media campaign analytics"
    ]
    labels = ["Software Engineer", "Data Scientist", "Mechanical Engineer", "Marketing"]
    
    le = LabelEncoder()
    y = le.fit_transform(labels)
    vec_role = TfidfVectorizer()
    X = vec_role.fit_transform(corpus)
    
    role_model = RandomForestClassifier(n_estimators=10, random_state=42)
    role_model.fit(X, y)
    
    joblib.dump(role_model, os.path.join(ra_dir, "role_model.pkl"))
    joblib.dump(vec_role, os.path.join(ra_dir, "vectorizer_role.pkl"))
    joblib.dump(le, os.path.join(ra_dir, "label_encoder.pkl"))
    
    # 3. ats_model, vectorizer_ats
    corpus_ats = [
        "clear well formatted resume with measurable achievements python java",
        "messy resume bad formatting no keywords",
        "excellent professional summary strong skills bullet points solidworks"
    ]
    scores = [85.0, 30.0, 90.0]
    vec_ats = TfidfVectorizer()
    X_ats = vec_ats.fit_transform(corpus_ats)
    ats_model = LinearRegression()
    ats_model.fit(X_ats, scores)
    
    joblib.dump(ats_model, os.path.join(ra_dir, "ats_model.pkl"))
    joblib.dump(vec_ats, os.path.join(ra_dir, "vectorizer_ats.pkl"))
    print("Resume Analyzer models saved to:", ra_dir)


if __name__ == "__main__":
    train_placement_model()
    train_skill_matcher()
    train_resume_analyzer_models()
    print("All models trained and synchronized successfully.")
