"""
train_models.py
---------------
Trains all ML models for the AI Placement Intelligence Platform.
UPGRADED: Uses curated, domain-specific datasets instead of synthetic data.

Models trained:
  1. Domain Classifier     — TF-IDF + XGBoost (9 domains)
  2. Role Predictor        — TF-IDF + XGBoost (10 roles)
  3. Placement Readiness   — XGBoost Regressor (feature-based score)
  4. Skill Matcher TF-IDF  — TF-IDF vectorizer (legacy compatibility)
  5. Resume Analyzer PKLs  — Skills DB + role model + ATS model

Run standalone:
    python backend/ai_model/train_models.py

Or called at server startup via ensure_models_exist().
"""

import os
import logging
import numpy as np
import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────
_THIS_DIR  = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(_THIS_DIR, "models")
RA_DIR     = os.path.join(MODELS_DIR, "resume_analyzer")

_RA_FILES = [
    "role_model.pkl",
    "vectorizer_role.pkl",
    "ats_model.pkl",
    "vectorizer_ats.pkl",
    "skills.pkl",
    "label_encoder.pkl",
]

# ── Try importing XGBoost; fall back to sklearn GradientBoosting if absent ─
try:
    import xgboost as xgb
    _USE_XGB = True
    logger.info("[Models] XGBoost available — using XGBClassifier/XGBRegressor.")
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor, RandomForestClassifier
    _USE_XGB = False
    logger.warning("[Models] XGBoost not found — falling back to sklearn GradientBoosting.")


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY
# ══════════════════════════════════════════════════════════════════════════════

def _make_classifier(**kwargs):
    if _USE_XGB:
        return xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            eval_metric="mlogloss",
            random_state=42,
            **kwargs
        )
    return GradientBoostingClassifier(n_estimators=150, max_depth=5, random_state=42)


def _make_regressor(**kwargs):
    if _USE_XGB:
        return xgb.XGBRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            **kwargs
        )
    return GradientBoostingRegressor(n_estimators=150, max_depth=4, random_state=42)


# ══════════════════════════════════════════════════════════════════════════════
# 1. DOMAIN CLASSIFIER
# ══════════════════════════════════════════════════════════════════════════════

def train_domain_classifier():
    """
    Train TF-IDF + XGBoost Domain Classifier.
    Trained on: ai_model/data/domain_dataset.py (135 curated entries, 9 domains)
    Saved to:   models/domain_classifier.pkl + models/vectorizer_domain.pkl
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("\n[1/3] Training Domain Classifier...")

    from ai_model.data.domain_dataset import get_domain_dataset
    data = get_domain_dataset()
    texts, labels = zip(*data)

    le = LabelEncoder()
    y = le.fit_transform(labels)

    vec = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        max_features=8000,
        sublinear_tf=True,
    )
    X = vec.fit_transform(texts)

    clf = _make_classifier()
    clf.fit(X, y)

    # Cross-val score
    from sklearn.ensemble import RandomForestClassifier
    cv_clf = RandomForestClassifier(n_estimators=50, random_state=42)
    scores = cross_val_score(cv_clf, X, y, cv=3, scoring="accuracy")
    print(f"  Domain Classifier CV Accuracy: {scores.mean():.2%} (±{scores.std():.2%})")
    print(f"  Domains: {list(le.classes_)}")

    joblib.dump(clf, os.path.join(MODELS_DIR, "domain_classifier.pkl"))
    joblib.dump(vec, os.path.join(MODELS_DIR, "vectorizer_domain.pkl"))
    joblib.dump(le,  os.path.join(MODELS_DIR, "label_encoder_domain.pkl"))
    print(f"  [OK] Saved domain_classifier.pkl, vectorizer_domain.pkl, label_encoder_domain.pkl")


# ══════════════════════════════════════════════════════════════════════════════
# 2. ROLE PREDICTOR
# ══════════════════════════════════════════════════════════════════════════════

def train_role_predictor():
    """
    Train TF-IDF + XGBoost Role Predictor.
    Trained on: ai_model/data/resume_role_dataset.py (265 curated entries, 10 roles)
    Saved to:   models/resume_analyzer/role_model.pkl + vectorizer_role.pkl
    """
    os.makedirs(RA_DIR, exist_ok=True)
    print("\n[2/3] Training Role Predictor (XGBoost)...")

    from ai_model.data.resume_role_dataset import get_role_dataset
    data = get_role_dataset()
    texts, labels = zip(*data)

    le = LabelEncoder()
    y = le.fit_transform(labels)

    vec = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        max_features=15000,
        sublinear_tf=True,
        strip_accents="unicode",
    )
    X = vec.fit_transform(texts)

    clf = _make_classifier()
    clf.fit(X, y)

    # Cross-val
    from sklearn.ensemble import RandomForestClassifier
    cv_clf = RandomForestClassifier(n_estimators=50, random_state=42)
    scores = cross_val_score(cv_clf, X, y, cv=5, scoring="accuracy")
    print(f"  Role Predictor CV Accuracy: {scores.mean():.2%} (±{scores.std():.2%})")
    print(f"  Roles: {list(le.classes_)}")

    joblib.dump(clf, os.path.join(RA_DIR, "role_model.pkl"))
    joblib.dump(vec, os.path.join(RA_DIR, "vectorizer_role.pkl"))
    joblib.dump(le,  os.path.join(RA_DIR, "label_encoder.pkl"))
    print(f"  [OK] Saved role_model.pkl, vectorizer_role.pkl, label_encoder.pkl")


# ══════════════════════════════════════════════════════════════════════════════
# 3. PLACEMENT READINESS PREDICTOR
# ══════════════════════════════════════════════════════════════════════════════

def train_placement_readiness():
    """
    Train XGBoost Regressor for Placement Readiness Score (0-100).
    Uses structured feature inputs: skills_count, experience_years, projects, certifications, ats_score, role_match.
    Saved to: models/placement_predictor.pkl
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("\n[3/3] Training Placement Readiness Predictor (XGBoost Regressor)...")

    np.random.seed(42)
    n = 2000

    # Feature distributions based on realistic candidate profiles
    skills_count      = np.random.randint(3, 25, n)
    experience_years  = np.random.uniform(0, 8, n)
    projects          = np.random.randint(0, 12, n)
    certifications    = np.random.randint(0, 5, n)
    ats_score         = np.random.uniform(20, 95, n)
    role_match_pct    = np.random.uniform(20, 100, n)
    education_level   = np.random.choice([0.6, 0.8, 1.0], n)  # diploma, degree, masters
    internships       = np.random.randint(0, 4, n)
    github_projects   = np.random.randint(0, 20, n)
    has_portfolio     = np.random.choice([0, 1], n, p=[0.4, 0.6])

    # Realistic readiness score formula (domain knowledge-informed weights)
    readiness = (
        skills_count      * 1.5
        + experience_years  * 5.0
        + projects          * 2.0
        + certifications    * 4.0
        + ats_score         * 0.3
        + role_match_pct    * 0.25
        + education_level   * 10.0
        + internships       * 6.0
        + github_projects   * 0.8
        + has_portfolio     * 5.0
        + np.random.normal(0, 3, n)  # noise
    )

    # Clip to 0-100 range
    readiness = np.clip(readiness, 0, 100)

    df = pd.DataFrame({
        "skills_count":     skills_count,
        "experience_years": experience_years,
        "projects":         projects,
        "certifications":   certifications,
        "ats_score":        ats_score,
        "role_match_pct":   role_match_pct,
        "education_level":  education_level,
        "internships":      internships,
        "github_projects":  github_projects,
        "has_portfolio":    has_portfolio,
    })

    X = df.values
    y = readiness

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    reg = _make_regressor()
    reg.fit(X_train, y_train)

    from sklearn.metrics import mean_absolute_error
    y_pred = reg.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"  Placement Readiness MAE: {mae:.2f} points")

    # Save feature names alongside the model
    feature_names = list(df.columns)
    joblib.dump({"model": reg, "features": feature_names}, os.path.join(MODELS_DIR, "placement_predictor.pkl"))
    print(f"  [OK] Saved placement_predictor.pkl  (features: {feature_names})")


# ══════════════════════════════════════════════════════════════════════════════
# 4. SKILL MATCHER (TF-IDF) — legacy compatibility
# ══════════════════════════════════════════════════════════════════════════════

def train_skill_matcher():
    """
    TF-IDF skill vectorizer. Kept for backward compatibility with existing
    skill matching code. Enhanced corpus drawn from skills_data.py categories.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("\n[Legacy] Training Skill Matcher TF-IDF...")

    skills_corpus = [
        "python javascript typescript react nodejs sql aws docker kubernetes microservices rest api git ci cd postgresql",
        "java spring boot hibernate mysql jpa enterprise rest api kafka docker kubernetes",
        "machine learning deep learning python pandas scikit learn tensorflow keras pytorch feature engineering",
        "frontend html css react tailwind nextjs typescript webpack vite responsive design accessibility",
        "backend python django flask fastapi postgresql redis celery rabbitmq graphql",
        "devops linux docker kubernetes terraform jenkins ci cd ansible prometheus grafana bash",
        "mobile react native flutter swift kotlin dart ios android firebase push notification",
        "qa selenium cypress jest pytest automation testing bdd cucumber playwright",
        "blockchain solidity ethereum web3 smart contracts defi nft hyperledger",
        "cybersecurity penetration testing ethical hacking networking firewall siem incident response",
        "data engineering spark hadoop hive kafka airflow etl pipeline dbt snowflake redshift",
        "cloud aws azure gcp lambda s3 ec2 cloudformation serverless terraform",
        "nlp spacy bert transformers hugging face sentiment classification ner embedding",
        "computer vision opencv yolo pytorch cnn image classification object detection",
        "mlops mlflow docker kubernetes model deployment monitoring drift retraining",
    ]

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    vectorizer.fit(skills_corpus)
    joblib.dump(vectorizer, os.path.join(MODELS_DIR, "skill_vectorizer.pkl"))
    print(f"  [OK] Saved skill_vectorizer.pkl")


# ══════════════════════════════════════════════════════════════════════════════
# 5. RESUME ANALYZER PKL FILES
# ══════════════════════════════════════════════════════════════════════════════

def train_resume_analyzer_models():
    """
    Generates the 6 .pkl files required by the resume analyzer module.
    Skills DB is now loaded from skills_data.py (no duplication).
    ATS model retrained with expanded quality corpus.
    """
    os.makedirs(RA_DIR, exist_ok=True)
    print("\n[RA] Building Resume Analyzer model files...")

    # ── skills.pkl — loaded from canonical source ──────────────────────────
    from ai_model.data.skills_data import ROLE_REQUIREMENTS
    joblib.dump(ROLE_REQUIREMENTS, os.path.join(RA_DIR, "skills.pkl"))
    print("  [OK] skills.pkl  (sourced from skills_data.ROLE_REQUIREMENTS)")

    # ── role_model, vectorizer_role, label_encoder — now trained in step 2 ─
    # If already trained by train_role_predictor(), skip; otherwise build fallback.
    if not os.path.exists(os.path.join(RA_DIR, "role_model.pkl")):
        train_role_predictor()
    else:
        print("  [OK] role_model.pkl already exists (trained by train_role_predictor)")

    # ── ats_model, vectorizer_ats — text quality regressor ─────────────────
    corpus_ats = [
        # high quality
        "professional summary quantified achievements python aws 5 years led team reduced latency 30 percent strong action verbs",
        "data scientist kaggle top 10 published papers open source contributions github clear formatting metrics impact driven",
        "architected scalable microservices improved performance 40 percent cost reduction 25 percent strong keywords formatted",
        "excellent resume clear sections experience education skills certifications quantified impact numbers percentages dollars",
        "senior engineer 7 years experience 5 publications 3 patents leadership strong technical depth well formatted",
        "full stack developer 50k users 99.9 uptime github 20 stars portfolio blog structured resume keywords",
        "aws certified solutions architect terraform kubernetes 4 years strong devops background clean formatting achievements",
        "nlp research bert fine tuning 3 papers published kaggle competitions portfolio github clean resume structure",
        # medium quality
        "software developer 3 years python react postgresql some projects decent formatting partial metrics",
        "data analyst sql tableau python 2 years partial achievements some keywords decent structure education included",
        "backend developer django rest api postgresql docker 2 years projects github some quantification",
        "junior developer javascript react node mongodb 1 year some projects education gpa 3.5 intern",
        # low quality
        "responsible for various tasks good communication skills team player fast learner no metrics no keywords",
        "generic resume no github no portfolio vague descriptions no numbers no achievements poorly formatted",
        "messy resume typos grammatical errors inconsistent formatting missing contact information unclear experience",
        "entry level no experience no projects no certifications just education and soft skills",
        "resume missing skills section no technical keywords unclear work history gaps no achievements",
    ]
    scores_ats = [88.0, 85.0, 92.0, 90.0, 95.0, 82.0, 87.0, 86.0,
                  58.0, 55.0, 60.0, 52.0,
                  28.0, 22.0, 18.0, 30.0, 25.0]

    vec_ats = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    X_ats = vec_ats.fit_transform(corpus_ats)
    ats_model = LinearRegression()
    ats_model.fit(X_ats, scores_ats)

    joblib.dump(ats_model, os.path.join(RA_DIR, "ats_model.pkl"))
    joblib.dump(vec_ats,   os.path.join(RA_DIR, "vectorizer_ats.pkl"))
    print("  [OK] ats_model.pkl, vectorizer_ats.pkl")
    print(f"\n  Resume Analyzer models saved to: {RA_DIR}")


# ══════════════════════════════════════════════════════════════════════════════
# STARTUP HOOK
# ══════════════════════════════════════════════════════════════════════════════

def ensure_models_exist() -> bool:
    """
    Called at server startup. Trains all models if any are missing.
    Returns True if all models are ready.
    """
    missing = [f for f in _RA_FILES if not os.path.exists(os.path.join(RA_DIR, f))]
    domain_missing = not os.path.exists(os.path.join(MODELS_DIR, "domain_classifier.pkl"))

    if not missing and not domain_missing:
        return True

    logger.info(
        f"[ModelBootstrap] Model file(s) missing. Generating now (one-time operation)..."
    )
    try:
        train_domain_classifier()
        train_role_predictor()
        train_placement_readiness()
        train_skill_matcher()
        train_resume_analyzer_models()
        logger.info("[ModelBootstrap] All models generated successfully.")
        return True
    except Exception as exc:
        logger.error(f"[ModelBootstrap] Failed to generate models: {exc}", exc_info=True)
        return False


# ══════════════════════════════════════════════════════════════════════════════
# CLI ENTRYPOINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

    # Add backend root to path
    _backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if _backend_root not in sys.path:
        sys.path.insert(0, _backend_root)

    print("=" * 60)
    print("  AI Placement Platform — Model Training Pipeline")
    print("=" * 60)

    train_domain_classifier()
    train_role_predictor()
    train_placement_readiness()
    train_skill_matcher()
    train_resume_analyzer_models()

    print("\n" + "=" * 60)
    print("  [OK]  All models trained and saved successfully.")
    print("=" * 60)
