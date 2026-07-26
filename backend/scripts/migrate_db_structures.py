import os
import sys
import re

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database.models import Drive

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ai_placement.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE placement_drives ADD COLUMN ctc_min FLOAT;"))
            print("Added ctc_min to placement_drives.")
        except Exception as e:
            print("ctc_min may already exist:", e)

        try:
            conn.execute(text("ALTER TABLE placement_drives ADD COLUMN ctc_max FLOAT;"))
            print("Added ctc_max to placement_drives.")
        except Exception as e:
            print("ctc_max may already exist:", e)

        try:
            conn.execute(text("ALTER TABLE placement_drives ADD COLUMN structured_eligibility JSON;"))
            print("Added structured_eligibility to placement_drives.")
        except Exception as e:
            print("structured_eligibility may already exist:", e)
        conn.commit()

def create_indexes():
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_app_student_id ON placement_applications(student_id);",
        "CREATE INDEX IF NOT EXISTS idx_app_drive_id ON placement_applications(drive_id);",
        "CREATE INDEX IF NOT EXISTS idx_drive_status ON placement_drives(status);",
        "CREATE INDEX IF NOT EXISTS idx_drive_course ON placement_drives(course);",
        "CREATE INDEX IF NOT EXISTS idx_ra_user_id ON resume_analyses(user_id);"
    ]
    with engine.connect() as conn:
        for idx_query in indexes:
            try:
                conn.execute(text(idx_query))
                print(f"Executed: {idx_query}")
            except Exception as e:
                print(f"Error creating index: {e}")
        conn.commit()

def parse_ctc(ctc_str):
    if not ctc_str:
        return None, None
        
    ctc_str = ctc_str.upper().strip()
    
    # Range matching: 8 - 12 LPA, 8-12 LPA, 8.5-12.5
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:LPA|LAKHS?)?", ctc_str)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))
        
    # Single value matching: 12 LPA, 12 LAKHS, 12.5 LPA
    single_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:LPA|LAKHS?)", ctc_str)
    if single_match:
        return float(single_match.group(1)), float(single_match.group(1))
        
    # Raw value matching: 12,00,000, 1200000
    raw_match = re.search(r"^([\d,]+)$", ctc_str)
    if raw_match:
        val_str = raw_match.group(1).replace(",", "")
        try:
            val = float(val_str)
            # convert to LPA if it's large
            if val >= 100000:
                val = val / 100000.0
            return val, val
        except ValueError:
            pass
            
    return None, None

def migrate_ctc():
    db = SessionLocal()
    drives = db.query(Drive).all()
    updated_count = 0
    failed = []
    
    for drive in drives:
        if drive.ctc:
            ctc_min, ctc_max = parse_ctc(drive.ctc)
            if ctc_min is not None and ctc_max is not None:
                drive.ctc_min = ctc_min
                drive.ctc_max = ctc_max
                updated_count += 1
            else:
                failed.append(drive.ctc)
    
    db.commit()
    db.close()
    
    print(f"\nMigrated {updated_count} drives with CTC.")
    if failed:
        print(f"Failed to confidently parse the following CTC strings (left as NULL):")
        for f in set(failed):
            print(f"  - '{f}'")

if __name__ == "__main__":
    print("Starting DB migration...")
    add_columns()
    create_indexes()
    migrate_ctc()
    print("Migration completed.")
