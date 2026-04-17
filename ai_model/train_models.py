import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
import joblib
import os

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

if __name__ == "__main__":
    train_placement_model()
    train_skill_matcher()
    print("All models trained and synchronized successfully.")
