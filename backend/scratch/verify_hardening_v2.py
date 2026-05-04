import sys
import os
import asyncio
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from user_intelligence.intelligence_service import intelligence_service
from learning_layer.calibration_service import calibration_service
from knowledge_graph.graph_service import graph_service

async def run_hardening_test():
    print("STARTING HARDENING 2.0 VERIFICATION")
    
    # 1. Test Trace ID & Intelligence Pipeline
    profile = {
        "student_id": "hardened_user_1",
        "skills": [{"name": "Python", "confidence": 0.4, "weight": 1.0}], # Low confidence for gating test
        "projects": [],
        "experience": {"years": 2}
    }
    
    intel = intelligence_service.build_intelligence_profile(profile)
    
    print("\n--- Pipeline Observability ---")
    print(f"Trace ID: {intel.get('trace_id')}")
    print(f"Latency: {intel.get('latency_ms')} ms")
    print(f"Confidence Gating Triggered: {intel.get('requires_verification')}")
    
    print("\n--- Multi-Signal Velocity ---")
    print(f"Velocity: {intel.get('trajectory', {}).get('velocity')}")
    print(f"Trend: {intel.get('trajectory', {}).get('trend')}")

    # 2. Test Calibration
    print("\n--- Calibration Layer ---")
    calibration_service.record_outcome(0.85, True)
    calibration_service.record_outcome(0.20, False)
    report = calibration_service.get_calibration_report()
    print(f"Brier Score (2 samples): {report['brier_score']}")
    print(f"System Honesty: {report['system_status']}")

    # 3. Test Graph Anchoring
    print("\n--- Graph Anchoring ---")
    from knowledge_graph.reasoning_engine import ReasoningEngine
    ge = graph_service.engine
    
    # Simulate success to boost edge
    ge.boost_edge("Python", "Algorithms")
    edge = next(e for e in ge.adjacency_out[ge._find_node_id_by_name("Python")] if ge.nodes[e['target']].name == "Algorithms")
    print(f"Boosted Weight: {edge['weight']}")
    
    # Simulate decay
    ge.apply_graph_decay()
    print(f"Weight after Decay: {round(edge['weight'], 4)}")

    print("\nHARDENING 2.0 COMPLETE.")

if __name__ == "__main__":
    asyncio.run(run_hardening_test())
