"""
Domain Practice
===============
Config-driven and domain-specific practice sets for non-IT domains.
Reuses the general aptitude questions from services.practice_engine.py,
but replaces coding/programming with analytical case studies and domain interview questions.
"""

import logging
import random
from typing import Dict, List, Optional
from domains.registry import domain_registry
from services.practice_engine import APTITUDE_QUESTIONS, INTERVIEW_QUESTIONS

logger = logging.getLogger(__name__)

# ── DOMAIN-SPECIFIC ANALYTICAL CASE PROBLEMS (Matches the "coding" problem structure) ──
DOMAIN_CASE_PROBLEMS = {
    "finance": [
        {
            "id": "fin_case_001", "difficulty": "easy", "topic": "Financial Analysis",
            "title": "WACC Calculation",
            "problem": "Given a company with a 60/40 debt-to-equity ratio, a cost of equity of 10%, a pre-tax cost of debt of 5%, and a tax rate of 20%, calculate the Weighted Average Cost of Capital (WACC).",
            "hint": "Formula: WACC = (E/V * Re) + (D/V * Rd * (1 - T)). Note that E/V = 0.4 and D/V = 0.6.",
            "role_tags": ["Financial Analyst", "Investment Banker", "Corporate Finance Manager"]
        },
        {
            "id": "fin_case_002", "difficulty": "medium", "topic": "Valuation",
            "title": "DCF Free Cash Flow Projection",
            "problem": "Calculate the Free Cash Flow to Firm (FCFF) for next year given: EBIT = $150M, Depreciation = $20M, CapEx = $30M, Change in Working Capital = -$5M, and a tax rate of 25%.",
            "hint": "Formula: FCFF = EBIT * (1 - T) + D&A - CapEx - Change in Working Capital.",
            "role_tags": ["Financial Analyst", "Investment Banker", "Portfolio Manager"]
        },
        {
            "id": "fin_case_003", "difficulty": "hard", "topic": "LBO Modeling",
            "title": "Debt Paydown Sensitivity",
            "problem": "A target company is acquired for $500M with 70% debt. If the company generates $45M in annual FCF dedicated purely to principal paydown, calculate the remaining debt balance at the end of Year 3.",
            "hint": "Initial debt = $350M. Subtract annual paydown. Consider if there's any compounding interest if unspecified (assume pure principal reduction here).",
            "role_tags": ["Investment Banker", "Private Equity Analyst"]
        }
    ],
    "legal": [
        {
            "id": "leg_case_001", "difficulty": "easy", "topic": "Contract Review",
            "title": "NDA Redline Analysis",
            "problem": "Review an NDA clause stating: 'Receiving Party shall remain bound by confidentiality obligations under this Agreement in perpetuity for all Information disclosed.' Identify the primary commercial concern.",
            "hint": "Perpetual obligations for general commercial trade secrets are highly restrictive; standard business practice limits this to 2-5 years.",
            "role_tags": ["Corporate Lawyer", "Legal Analyst", "Paralegal"]
        },
        {
            "id": "leg_case_002", "difficulty": "medium", "topic": "Privacy Compliance",
            "title": "GDPR Controller vs. Processor Breach Response",
            "problem": "A cloud service provider experiences a data breach. Analyze whether they are acting as a Controller or a Processor, and outline their notification timeline under GDPR.",
            "hint": "Processors must notify controllers 'without undue delay'. Controllers must notify the supervisory authority within 72 hours.",
            "role_tags": ["Data Privacy Counsel", "Compliance Officer"]
        },
        {
            "id": "leg_case_003", "difficulty": "hard", "topic": "M&A Due Diligence",
            "title": "Intellectual Property Ownership Risk",
            "problem": "During M&A due diligence, you discover the target company's core software was built by a contractor who did not sign an IP assignment agreement. Assess the risk and propose a remediation plan.",
            "hint": "Risk: contractor may own the copyright. Remedy: obtain a retroactive assignment or clean-break release/license agreement before closing.",
            "role_tags": ["Corporate Lawyer", "IP Attorney"]
        }
    ],
    "business": [
        {
            "id": "bus_case_001", "difficulty": "easy", "topic": "Product Management",
            "title": "GTM Pricing Optimization",
            "problem": "A SaaS product has a CAC of $120. If the monthly subscription is $15 with a churn rate of 5%, calculate the LTV and the LTV:CAC ratio.",
            "hint": "LTV = ARPU / Churn Rate. LTV:CAC is LTV divided by CAC.",
            "role_tags": ["Product Manager", "Marketing Specialist"]
        },
        {
            "id": "bus_case_002", "difficulty": "medium", "topic": "Project Management",
            "title": "Agile Sprint Velocity Recovery",
            "problem": "A scrum team's velocity drops from 45 to 30 story points over three consecutive sprints. Detail the diagnostic steps and immediate retrospective actions to take.",
            "hint": "Identify external dependencies, scope creep, quality/testing bottlenecks, or team capacity changes during retrospective.",
            "role_tags": ["Project Manager", "Scrum Master", "Operations Manager"]
        },
        {
            "id": "bus_case_003", "difficulty": "hard", "topic": "Operations",
            "title": "Supply Chain Bottleneck Analysis",
            "problem": "A retail brand faces a 20% delay in supplier delivery, leading to stockouts. Model a safety stock level calculation to prevent future stockouts given lead time variance.",
            "hint": "Safety stock formula: Z * Standard Deviation of Lead Time * Average Demand.",
            "role_tags": ["Operations Manager", "Business Analyst", "Supply Chain Analyst"]
        }
    ],
    "healthcare": [
        {
            "id": "hea_case_001", "difficulty": "easy", "topic": "Clinical Workflow",
            "title": "Patient Throughput Optimization",
            "problem": "Analyze a clinic workflow where patient intake takes 15 mins, doctor consultation takes 20 mins, and billing takes 10 mins. Find the bottleneck and calculate max patients per hour.",
            "hint": "The bottleneck is the step with the longest duration (doctor consultation = 20 mins). Max throughput = 60 / 20 = 3 patients/hour.",
            "role_tags": ["Healthcare Administrator", "Clinical Coordinator"]
        },
        {
            "id": "hea_case_002", "difficulty": "medium", "topic": "Regulatory Compliance",
            "title": "HIPAA Patient Authorization Verification",
            "problem": "A research institute wants to use patient records for a study. Analyze under what conditions they can do this without explicit patient authorization under HIPAA.",
            "hint": "Requires de-identification of the data (Safe Harbor or Expert Determination methods) or obtaining an IRB/Privacy Board waiver.",
            "role_tags": ["Compliance Officer", "Healthcare Administrator", "Medical Research Associate"]
        }
    ],
    "engineering": [
        {
            "id": "eng_case_001", "difficulty": "easy", "topic": "Stress Analysis",
            "title": "Tensile Stress Calculation",
            "problem": "A structural steel rod (yield strength 250 MPa) of cross-sectional area 0.002 m² is subjected to an axial tensile load of 300 kN. Calculate the factor of safety.",
            "hint": "Stress = Force / Area. Factor of Safety = Yield Strength / Calculated Stress.",
            "role_tags": ["Structural Engineer", "Mechanical Engineer", "Civil Engineer"]
        },
        {
            "id": "eng_case_002", "difficulty": "medium", "topic": "Fluid Dynamics",
            "title": "Pipe Pressure Drop",
            "problem": "Using the Bernoulli equation and Darcy-Weisbach friction factor, analyze the head loss in a 50m long, 0.1m diameter pipe transporting water at 2 m/s.",
            "hint": "Head loss = f * (L/D) * (v² / 2g).",
            "role_tags": ["Civil Engineer", "Chemical Engineer", "Mechanical Engineer"]
        }
    ]
}

# ── DOMAIN-SPECIFIC TECHNICAL INTERVIEW QUESTIONS (Matches the "interview" structure) ──
DOMAIN_INTERVIEW_QUESTIONS = {
    "finance": [
        {
            "id": "fin_int_001", "type": "technical",
            "question": "What are the three core financial statements and how do they link together?",
            "sample_answer": "Income Statement, Balance Sheet, Cash Flow Statement. Net Income from IS flows into Retained Earnings on the BS and is the starting point for CFS. Changes in BS working capital flow into CFS operating activities. Ending Cash from CFS matches Cash on the BS.",
            "role_tags": ["Financial Analyst", "Investment Banker", "Corporate Finance Manager"]
        },
        {
            "id": "fin_int_002", "type": "technical",
            "question": "Walk me through a Discounted Cash Flow (DCF) valuation.",
            "sample_answer": "1. Project Free Cash Flows (5-10 years). 2. Calculate Weighted Average Cost of Capital (WACC) as the discount rate. 3. Discount projected FCFs to Present Value. 4. Determine Terminal Value using perpetuity growth or exit multiple, and discount it. 5. Sum PV of FCFs and Terminal Value to get Enterprise Value.",
            "role_tags": ["Financial Analyst", "Investment Banker", "Portfolio Manager"]
        }
    ],
    "legal": [
        {
            "id": "leg_int_001", "type": "technical",
            "question": "What are the essential elements of a binding contract?",
            "sample_answer": "1. Offer (clear terms). 2. Acceptance (unconditional agreement). 3. Consideration (something of value exchanged). 4. Mutual Intent to create legal relations. 5. Capacity of the parties to contract.",
            "role_tags": ["Corporate Lawyer", "Legal Analyst", "Paralegal"]
        },
        {
            "id": "leg_int_002", "type": "technical",
            "question": "What is the difference between a Controller and a Processor under GDPR?",
            "sample_answer": "A Controller determines the purposes and means of processing personal data. A Processor processes personal data only on behalf of and under the instruction of the Controller.",
            "role_tags": ["Data Privacy Counsel", "Compliance Officer"]
        }
    ],
    "business": [
        {
            "id": "bus_int_001", "type": "technical",
            "question": "What is the difference between Agile and Waterfall methodologies? When would you use each?",
            "sample_answer": "Agile is iterative, flexible, and values collaboration, ideal for projects with evolving requirements (e.g. software development). Waterfall is sequential, structured, and documentation-heavy, best for predictable projects with fixed requirements (e.g. construction).",
            "role_tags": ["Project Manager", "Scrum Master", "Operations Manager"]
        },
        {
            "id": "bus_int_002", "type": "technical",
            "question": "How would you conduct a SWOT Analysis for a new product launch?",
            "sample_answer": "S (Strengths): proprietary tech, brand value. W (Weaknesses): limited budget, lack of sales channels. O (Opportunities): untapped market segment, regulatory changes. T (Threats): aggressive competitor response, supply chain issues. Create strategies that match strengths to opportunities and mitigate weaknesses and threats.",
            "role_tags": ["Business Analyst", "Product Manager", "Marketing Specialist"]
        }
    ],
    "healthcare": [
        {
            "id": "hea_int_001", "type": "technical",
            "question": "What are the core requirements for HIPAA compliance in electronic records?",
            "sample_answer": "1. Administrative Safeguards (training, risk assessments). 2. Physical Safeguards (secure workstations, access controls). 3. Technical Safeguards (encryption, audit logs, unique user IDs). 4. Business Associate Agreements (BAAs) with third-party vendors.",
            "role_tags": ["Compliance Officer", "Healthcare Administrator"]
        },
        {
            "id": "hea_int_002", "type": "technical",
            "question": "Explain the difference between EMR (Electronic Medical Record) and EHR (Electronic Health Record).",
            "sample_answer": "EMRs are digital versions of paper charts within a single clinical practice, used primarily for diagnosis and treatment there. EHRs are designed to be shared across multiple healthcare providers, containing a broader, longitudinal view of patient health.",
            "role_tags": ["Healthcare Administrator", "Clinical Coordinator"]
        }
    ],
    "engineering": [
        {
            "id": "eng_int_001", "type": "technical",
            "question": "Explain the difference between Stress and Strain. How do they relate?",
            "sample_answer": "Stress is the internal resistive force per unit area acting on a material. Strain is the physical deformation or elongation per unit length. They relate linearly through Young's Modulus (Hooke's Law: Stress = E * Strain) within the elastic limit.",
            "role_tags": ["Structural Engineer", "Mechanical Engineer", "Civil Engineer"]
        },
        {
            "id": "eng_int_002", "type": "technical",
            "question": "What is the first and second law of thermodynamics?",
            "sample_answer": "First Law: Energy cannot be created or destroyed, only transformed (Conservation of Energy). Second Law: In any cyclic process, the entropy of an isolated system will always increase over time; heat cannot flow spontaneously from a cooler to a hotter body.",
            "role_tags": ["Mechanical Engineer", "Chemical Engineer"]
        }
    ]
}


def get_domain_practice_set(domain: str, top_role: str, limit_coding: int = 5, limit_aptitude: int = 10, limit_interview: int = 8) -> dict:
    """
    Returns a complete practice set customized for the given non-IT domain.
    """
    if not domain_registry.is_registered(domain):
        domain = "business"  # Fallback

    # 1. Aptitude (General is completely applicable)
    shuffled_apt = random.sample(APTITUDE_QUESTIONS, min(limit_aptitude, len(APTITUDE_QUESTIONS)))

    # 2. Case Studies ("coding" slots)
    cases = DOMAIN_CASE_PROBLEMS.get(domain, DOMAIN_CASE_PROBLEMS["business"])
    # Filter by role tags or fallback to all domain cases
    role_cases = [c for c in cases if top_role in c.get("role_tags", [])]
    if not role_cases:
        role_cases = cases
    
    filtered_cases = role_cases[:limit_coding]

    # 3. Technical Interview Questions
    tech_questions = DOMAIN_INTERVIEW_QUESTIONS.get(domain, DOMAIN_INTERVIEW_QUESTIONS["business"])
    role_tech = [q for q in tech_questions if top_role in q.get("role_tags", [])]
    if not role_tech:
        role_tech = tech_questions

    # Standard HR questions (reused)
    hr_questions = [q for q in INTERVIEW_QUESTIONS if q["type"] == "hr"]
    shuffled_hr = random.sample(hr_questions, min(4, len(hr_questions)))

    interview_set = role_tech[:limit_interview - len(shuffled_hr)] + shuffled_hr

    return {
        "target_role": top_role,
        "aptitude": shuffled_apt,
        "coding": filtered_cases,  # Frontend maps 'coding' to practice problems card
        "interview": interview_set,
        "stats": {
            "total_coding": len(filtered_cases),
            "total_aptitude": len(shuffled_apt),
            "total_interview": len(interview_set),
            "technical_count": len([q for q in interview_set if q["type"] == "technical"]),
            "hr_count": len([q for q in interview_set if q["type"] == "hr"])
        }
    }
