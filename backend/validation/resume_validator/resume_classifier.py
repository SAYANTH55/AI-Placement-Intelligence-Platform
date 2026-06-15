import re
from typing import Dict, Any, Tuple
from .resume_features import RESUME_INDICATORS, NON_RESUME_INDICATORS, DOCUMENT_TYPE_HINTS

class ResumeClassifier:
    def __init__(self):
        self.min_text_length = 50
        self.max_text_length = 20000

    def layer_1_rule_based(self, text: str) -> Tuple[bool, str]:
        """Layer 1: Rule-Based Filtering"""
        if not text or len(text.strip()) < self.min_text_length:
            return False, "Text too short"
        if len(text) > self.max_text_length:
            return False, "Text too long (likely a book, research paper, or report)"
        return True, "Pass"

    def layer_2_structure_scoring(self, text: str) -> float:
        """Layer 2: Resume Structure Scoring"""
        text_lower = text.lower()
        score = 0.0
        
        # Count unique positive indicators present
        found_positives = sum(1 for ind in RESUME_INDICATORS if ind in text_lower)
        
        if found_positives >= 5:
            score += 0.5
        elif found_positives >= 3:
            score += 0.3
        else:
            score += 0.1
            
        # Email and Phone are strong indicators
        has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+', text))
        has_phone = bool(re.search(r'\b\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}\b', text))
        
        if has_email: score += 0.15
        if has_phone: score += 0.15
        
        return min(score, 1.0)

    def layer_3_keyword_density(self, text: str) -> Tuple[float, str]:
        """Layer 3: Keyword Density Analysis (Ratio of positive vs negative)"""
        text_lower = text.lower()
        
        pos_count = sum(text_lower.count(ind) for ind in RESUME_INDICATORS)
        neg_count = sum(text_lower.count(ind) for ind in NON_RESUME_INDICATORS)
        
        detected_type = "unknown"
        if neg_count > 0:
            type_scores = {}
            for dtype, hints in DOCUMENT_TYPE_HINTS.items():
                t_score = sum(text_lower.count(hint) for hint in hints)
                type_scores[dtype] = t_score
            best_type = max(type_scores.items(), key=lambda x: x[1])
            if best_type[1] > 0:
                detected_type = best_type[0]
                
        total = pos_count + neg_count
        if total == 0:
            return 0.0, detected_type
            
        density_score = pos_count / total
        return density_score, detected_type

    async def layer_4_gemini_fallback(self, text: str) -> Tuple[bool, float]:
        """Layer 4: Gemini Fallback (Tie-breaker for edge cases)"""
        import os
        import google.generativeai as genai
        import logging
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return True, 0.6
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Analyze the following document text and determine if it is a professional Resume/CV.
        Reply ONLY in JSON format: {{"is_resume": true/false, "confidence": 0.0-1.0}}
        
        Text excerpt (first 2000 chars):
        {text[:2000]}
        """
        
        try:
            response = await model.generate_content_async(prompt)
            resp_text = response.text.strip().replace('```json', '').replace('```', '')
            import json
            data = json.loads(resp_text)
            return data.get("is_resume", True), data.get("confidence", 0.6)
        except Exception as e:
            logging.error(f"Gemini fallback validation failed: {e}")
            return True, 0.6

    async def classify(self, text: str) -> Dict[str, Any]:
        """Layer 5: Final Confidence Calculation"""
        
        l1_pass, l1_reason = self.layer_1_rule_based(text)
        if not l1_pass:
            doc_type = "book_or_report" if "long" in l1_reason else "invalid_short_text"
            return {
                "is_resume": False,
                "confidence": 0.99,
                "document_type": doc_type,
                "reason": l1_reason
            }
            
        l2_score = self.layer_2_structure_scoring(text)
        l3_score, detected_type = self.layer_3_keyword_density(text)
        
        initial_confidence = (l2_score * 0.4) + (l3_score * 0.6)
        
        final_confidence = initial_confidence
        is_resume = initial_confidence > 0.5
        reason = "Heuristic thresholds met."
        
        if 0.40 <= initial_confidence <= 0.70:
            gemini_is_resume, gemini_conf = await self.layer_4_gemini_fallback(text)
            final_confidence = (initial_confidence + gemini_conf) / 2
            is_resume = final_confidence > 0.5
            reason = "Gemini tie-breaker invoked."
            
        if final_confidence < 0.40:
            is_resume = False
            if detected_type == "unknown":
                detected_type = "random_document"
            reason = f"Strong negative indicators for {detected_type}."
            
        output_confidence = final_confidence if is_resume else (1.0 - final_confidence)
        
        return {
            "is_resume": is_resume,
            "confidence": round(output_confidence, 2),
            "document_type": "resume" if is_resume else detected_type,
            "reason": reason
        }
