import sqlite3
import os
import sys

# Add backend to path to import models and recreate
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db import engine, Base
from database.models import ProfileStrengthSnapshot

db_path = os.path.join(os.path.dirname(__file__), "..", "ai_placement.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Dropping profile_strength_snapshots...")
cursor.execute("DROP TABLE IF EXISTS profile_strength_snapshots")
conn.commit()
conn.close()

print("Recreating via SQLAlchemy create_all...")
Base.metadata.create_all(bind=engine)
print("Done.")
