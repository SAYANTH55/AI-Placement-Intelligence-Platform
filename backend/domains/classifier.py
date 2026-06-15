"""
Domain Classifier (3-Layer Architecture)
=========================================
1. Layer 1: Keyword Density & Rule Matcher (Fast keyword overlap & signal matching)
2. Layer 2: TF-IDF + Lightweight XGBoost (Probabilistic machine learning classification)
3. Layer 3: Gemini LLM Fallback (Invoked only if confidence < 0.60)

Features IT Affinity Protection:
- If IT domain exhibits significant signals (density >= 0.30) or is the top classification,
  we force routing to the IT pipeline to guarantee zero regression of legacy systems.
"""

import os
import re
import logging
from typing import Dict, List, NamedTuple, Optional
import numpy as np

# sklearn and xgboost imports (loaded inside or at module level)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

from domains.registry import domain_registry
from ai_model.data.skills_data import SKILLS_DICTIONARY

logger = logging.getLogger(__name__)

# List of all available domains for classification
DOMAINS = ["it", "business", "finance", "legal", "healthcare", "engineering"]


class ClassifierResult(NamedTuple):
    domain: str
    confidence: float
    method: str
    probabilities: Dict[str, float]
    secondary_domain: Optional[str] = None


class DomainClassifier:
    """
    3-Layer Domain Classifier:
    - Layer 1: Keyword Density & Rule-Based Matcher
    - Layer 2: Rule-Based Features + TF-IDF + Lightweight XGBoost
    - Layer 3: Gemini LLM Fallback (only if confidence < 0.60)
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500, stop_words="english")
        self.label_encoder = LabelEncoder()
        self.model = None
        self.it_keywords = self._get_it_keywords()
        self.is_trained = False
        self._initialize_classifier()

    def _get_it_keywords(self) -> List[str]:
        """Extract comprehensive IT keywords from the protected skills dictionary."""
        kw = ["software", "developer", "programmer", "coding", "programming", "computer science",
              "information technology", "web developer", "systems engineer", "database administrator",
              "full stack", "frontend", "backend", "devops", "sysadmin", "tech lead", "cto"]
        # Add all skills from skills_data.py
        for category, skills in SKILLS_DICTIONARY.items():
            kw.extend([s.lower() for s in skills])
        return list(set(kw))

    def _initialize_classifier(self):
        """Train a lightweight XGBoost model on synthetic domain prototype documents."""
        try:
            logger.info("Initializing lightweight XGBoost Domain Classifier...")
            
            # Generate synthetic training documents for each domain
            documents = []
            labels = []
            
            # Helper to generate synthetic variations
            def generate_variations(domain_name: str, kws: List[str], edus: List[str], certs: List[str]):
                # Create a set of prototype documents
                for i in range(15):
                    # Combine subsets of keywords and signals
                    np.random.seed(i)
                    kw_sample = np.random.choice(kws, min(len(kws), 8), replace=False) if kws else []
                    edu_sample = np.random.choice(edus, min(len(edus), 2), replace=False) if edus else []
                    cert_sample = np.random.choice(certs, min(len(certs), 2), replace=False) if certs else []
                    
                    text_parts = list(kw_sample) + list(edu_sample) + list(cert_sample)
                    np.random.shuffle(text_parts)
                    doc = " ".join(text_parts)
                    documents.append(doc)
                    labels.append(domain_name)

            # Generate for IT
            generate_variations(
                "it", 
                self.it_keywords, 
                ["computer science", "btech cs", "mca", "mtech cs", "information technology", "bca"], 
                ["aws certified", "red hat certified", "scrum master", "cisco certified"]
            )
            
            # Generate for non-IT domains
            for d in domain_registry.list_domains():
                generate_variations(
                    d,
                    domain_registry.get_keywords(d),
                    domain_registry.get_education_signals(d),
                    domain_registry.get_certification_signals(d)
                )

            # Fit vectorizer & label encoder
            X_text = self.vectorizer.fit_transform(documents).toarray()
            y_encoded = self.label_encoder.fit_transform(labels)
            
            # Fit XGBoost classifier
            self.model = xgb.XGBClassifier(
                n_estimators=30,
                max_depth=3,
                learning_rate=0.2,
                objective="multi:softprob",
                random_state=42
            )
            self.model.fit(X_text, y_encoded)
            self.is_trained = True
            logger.info("XGBoost Domain Classifier initialized successfully.")
            
        except Exception as e:
            logger.error(f"Failed to initialize XGBoost Domain Classifier: {e}", exc_info=True)
            self.is_trained = False

    def clean_text(self, text: str) -> str:
        """Standardize text for domain matching."""
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s#\+\.]', ' ', text)  # Keep chars like # and + for C++ / C#
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _get_keyword_densities(self, text: str) -> Dict[str, float]:
        """Layer 1: Calculate unique keyword matches per domain (absolute counts)."""
        cleaned = f" {self.clean_text(text)} "
        matches_count = {}
        
        # IT unique matches
        it_matches = 0
        for kw in self.it_keywords:
            # Match whole phrase/word using regex or padded search
            if f" {kw.lower()} " in cleaned:
                it_matches += 1
        matches_count["it"] = float(it_matches)
        
        # Non-IT domain unique matches
        for d in domain_registry.list_domains():
            kws = domain_registry.get_keywords(d)
            d_matches = 0
            for kw in kws:
                if f" {kw.lower()} " in cleaned:
                    d_matches += 1
            matches_count[d] = float(d_matches)
            
        # Convert absolute counts to scores normalized relative to the max match
        total_matches = sum(matches_count.values())
        if total_matches == 0:
            return {d: 1.0 / len(DOMAINS) for d in DOMAINS}
            
        return {d: count / total_matches for d, count in matches_count.items()}

    def _get_rule_signals(self, text: str) -> Dict[str, float]:
        """Layer 2 Helper: Identify strong education & certification signals using word boundaries."""
        cleaned = self.clean_text(text)
        signals = {d: 0.0 for d in DOMAINS}
        
        # IT signals
        it_edus = ["computer science", "btech cs", "mca", "mtech cs", "information technology", "bca", "software engineering"]
        it_certs = ["aws certified", "red hat certified", "cisco certified", "google cloud certified", "azure certified", "scrum master"]
        for edu in it_edus:
            if re.search(r'\b' + re.escape(edu) + r'\b', cleaned):
                signals["it"] += 5.0
        for cert in it_certs:
            if re.search(r'\b' + re.escape(cert) + r'\b', cleaned):
                signals["it"] += 5.0
                
        # Non-IT signals
        for d in domain_registry.list_domains():
            for edu in domain_registry.get_education_signals(d):
                if re.search(r'\b' + re.escape(edu.lower()) + r'\b', cleaned):
                    signals[d] += 5.0
            for cert in domain_registry.get_certification_signals(d):
                if re.search(r'\b' + re.escape(cert.lower()) + r'\b', cleaned):
                    signals[d] += 5.0
                    
        return signals

    def _call_gemini_fallback(self, text: str) -> str:
        """Layer 3: Call Gemini LLM for domain classification."""
        try:
            from services.llm_service import get_gemini_model
            model = get_gemini_model()
            
            prompt = f"""
            You are an expert resume classifier. Analyze the following resume text and determine which single domain it best belongs to.
            Available domains: {', '.join(DOMAINS)}
            
            Return ONLY a JSON object in this exact format:
            {{
                "domain": "one of the available domains in lowercase",
                "explanation": "1 sentence explanation"
            }}
            
            Resume Text:
            {text[:3000]}
            """
            
            response = model.generate_content(prompt)
            from services.llm_service import clean_json
            res_dict = clean_json(response.text)
            domain = res_dict.get("domain", "").strip().lower()
            if domain in DOMAINS:
                return domain
        except Exception as e:
            logger.error(f"Gemini domain classification failed: {e}")
        return ""  # Return empty to signify failure, allowing caller to use top prediction

    # ── Public API ──────────────────────────────────────────────────────────

    def classify(self, text: str, parsed_skills: Optional[List[str]] = None) -> ClassifierResult:
        """
        Classifies the domain of the resume using the 3-layer architecture.
        """
        if not text or len(text.strip()) < 50:
            # Safe default for empty or extremely short text
            return ClassifierResult(
                domain="it",
                confidence=1.0,
                method="fallback_empty",
                probabilities={d: 1.0 if d == "it" else 0.0 for d in DOMAINS}
            )

        cleaned = self.clean_text(text)
        
        # 1. LAYER 1: KEYWORD OVERLAP (COUNTS)
        keyword_probs = self._get_keyword_densities(text)
        
        # IT Affinity Protection: If IT keyword density/matches are significant, route to IT immediately
        # Also route if we match strong IT signals
        rule_signals = self._get_rule_signals(text)
        if keyword_probs.get("it", 0.0) >= 0.35 or rule_signals.get("it", 0.0) > 0:
            return ClassifierResult(
                domain="it",
                confidence=1.0,
                method="keyword_it_affinity",
                probabilities=keyword_probs
            )

        # 2. LAYER 2: TF-IDF + XGBOOST + RULE FEATURES
        top_domain = "it"
        top_prob = 0.0
        probs = {d: 0.0 for d in DOMAINS}
        secondary_domain = None

        if self.is_trained and self.model is not None:
            try:
                # Get XGBoost probabilities
                X_vec = self.vectorizer.transform([cleaned]).toarray()
                xgb_probs = self.model.predict_proba(X_vec)[0]
                
                # Map probabilities to classes
                probs = {self.label_encoder.classes_[i]: float(xgb_probs[i]) for i in range(len(xgb_probs))}
                for d in DOMAINS:
                    probs.setdefault(d, 0.0)
                
                # Combine Keyword Overlaps and Rule Signals
                # Formula: final_weight = 0.4 * xgb_prob + 0.4 * keyword_prob + 0.2 * rule_signal
                for d in DOMAINS:
                    probs[d] = 0.4 * probs[d] + 0.4 * keyword_probs.get(d, 0.0)
                    if rule_signals.get(d, 0.0) > 0:
                        probs[d] += rule_signals[d]  # Strong signal override
                
                # Normalize probabilities
                total = sum(probs.values()) or 1.0
                probs = {d: p / total for d, p in probs.items()}
                
                # Sort to find top classes
                sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
                top_domain, top_prob = sorted_probs[0]
                secondary_domain, secondary_prob = sorted_probs[1] if len(sorted_probs) > 1 else (None, 0.0)
                
                # IT Affinity Protection (Level 2): If IT has significant presence, force IT
                if top_domain == "it" or probs.get("it", 0.0) >= 0.35:
                    return ClassifierResult(
                        domain="it",
                        confidence=max(probs.get("it", 0.0), 0.9),
                        method="ml_it_affinity",
                        probabilities=probs,
                        secondary_domain=secondary_domain if secondary_domain != "it" else top_domain
                    )
                
                # If confidence is high enough (>= 0.60), return ML prediction
                if top_prob >= 0.60:
                    return ClassifierResult(
                        domain=top_domain,
                        confidence=top_prob,
                        method="xgboost_hybrid",
                        probabilities=probs,
                        secondary_domain=secondary_domain
                    )
                    
            except Exception as e:
                logger.error(f"XGBoost classification failed: {e}")
                # Fallback to pure keyword overlaps
                probs = keyword_probs
                sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
                top_domain, top_prob = sorted_probs[0]
                secondary_domain = sorted_probs[1][0] if len(sorted_probs) > 1 else None
        else:
            # Fallback to pure keyword overlaps
            probs = keyword_probs
            sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
            top_domain, top_prob = sorted_probs[0]
            secondary_domain = sorted_probs[1][0] if len(sorted_probs) > 1 else None

        # 3. LAYER 3: GEMINI FALLBACK (if confidence < 0.60)
        logger.info(f"Classifier confidence low ({top_prob:.2f}). Triggering Layer 3 Gemini Fallback...")
        llm_domain = self._call_gemini_fallback(text)
        
        if llm_domain:
            return ClassifierResult(
                domain=llm_domain,
                confidence=0.85,
                method="gemini_fallback",
                probabilities=probs,
                secondary_domain=top_domain if top_domain != llm_domain else secondary_domain
            )
        
        # If Gemini fails/offline, fall back to the highest probability domain from Layer 1 / 2
        logger.warning(f"Gemini fallback failed. Defaulting to top ML/Rule prediction: {top_domain}")
        return ClassifierResult(
            domain=top_domain,
            confidence=top_prob,
            method="ml_rule_fallback",
            probabilities=probs,
            secondary_domain=secondary_domain
        )


# Singleton classifier instance
domain_classifier = DomainClassifier()


def classify_domain(text: str, parsed_skills: Optional[List[str]] = None) -> ClassifierResult:
    """Wrapper function to classify domain of a resume."""
    return domain_classifier.classify(text, parsed_skills)
