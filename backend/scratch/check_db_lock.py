import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from database.db import SessionLocal
from database.models import Drive

db = SessionLocal()
try:
    drives = db.query(Drive).all()
    print(f"Success! Found {len(drives)} drives.")
except Exception as e:
    print(f"Error accessing DB: {e}")
finally:
    db.close()
