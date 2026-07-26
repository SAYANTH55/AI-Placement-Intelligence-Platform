import sys
import os

# Add the backend dir to sys.path so we can import from database
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from database.db import SessionLocal
from database.models import PlacementOutcome, ResumeAnalysis

def run_investigation():
    db = SessionLocal()
    try:
        total_outcomes = db.query(PlacementOutcome).count()
        
        # Joined rows: PlacementOutcome inner join ResumeAnalysis on user_id
        # Note: PlacementOutcome has student_id and user_id. ResumeAnalysis has user_id.
        joined = db.query(PlacementOutcome, ResumeAnalysis).filter(
            PlacementOutcome.user_id == ResumeAnalysis.user_id
        ).all()
        
        # We need to deduplicate in case of multiple resume analyses. Let's just group by outcome ID.
        matched_outcomes = {out.id: out for out, res in joined}
        matched_count = len(matched_outcomes)
        
        positives = sum(1 for o in matched_outcomes.values() if o.got_placed)
        negatives = sum(1 for o in matched_outcomes.values() if not o.got_placed)
        
        time_to_offer_count = sum(1 for o in matched_outcomes.values() if o.time_to_offer_days is not None)
        package_count = sum(1 for o in matched_outcomes.values() if o.package is not None)
        
        print("INVESTIGATION RESULTS:")
        print(f"Total row count in placement_outcomes: {total_outcomes}")
        print(f"Matching resume_analyses count (surviving joined rows): {matched_count}")
        print(f"Class balance of got_placed in joined set: True={positives}, False={negatives}")
        print(f"time_to_offer_days populated: {time_to_offer_count}")
        print(f"package populated: {package_count}")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_investigation()
