import sys
import os
sys.path.insert(0, '.')

print("=== Backend Engine Smoke Test ===")

try:
    from services.preparation_engine import generate_plan
    print("[OK] preparation_engine imported")
    result = generate_plan(['Docker', 'AWS', 'Kubernetes', 'PostgreSQL'], 'Backend Developer')
    print(f"[OK] generate_plan: {result['total_gaps']} gaps, {result['estimated_weeks']} weeks est.")
    print(f"     Tiers: programming={len(result['tiers']['programming'])}, domain={len(result['tiers']['domain'])}")
except Exception as e:
    print(f"[FAIL] preparation_engine: {e}")

try:
    from services.practice_engine import get_practice_set
    print("[OK] practice_engine imported")
    ps = get_practice_set('Backend Developer')
    print(f"[OK] get_practice_set: {ps['stats']}")
except Exception as e:
    print(f"[FAIL] practice_engine: {e}")

try:
    from services.tracking_engine import compute_feedback
    print("[OK] tracking_engine imported")
except Exception as e:
    print(f"[FAIL] tracking_engine: {e}")

try:
    from database.models import UserProgress
    print("[OK] UserProgress model imported")
except Exception as e:
    print(f"[FAIL] UserProgress model: {e}")

try:
    from api.engine_routes import router
    print("[OK] engine_routes router imported")
except Exception as e:
    print(f"[FAIL] engine_routes: {e}")

print("\n=== Smoke Test Complete ===")
