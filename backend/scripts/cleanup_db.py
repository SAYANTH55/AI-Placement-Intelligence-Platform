import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "ai_placement.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Dropping legacy tables...")
    cursor.execute("DROP TABLE IF EXISTS placement_prediction_snapshots")
    cursor.execute("DROP TABLE IF EXISTS profile_strength_snapshots")
    
    # Let SQLAlchemy recreate it properly through create_all on the next run
    # or we can create it right here
    cursor.execute('''
    CREATE TABLE profile_strength_snapshots (
        id INTEGER PRIMARY KEY,
        student_id INTEGER,
        profile_strength_score FLOAT,
        actual_outcome BOOLEAN,
        snapshot_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES placement_students(id)
    )
    ''')
    cursor.execute("CREATE INDEX ix_profile_strength_snapshots_id ON profile_strength_snapshots(id)")
    cursor.execute("CREATE INDEX ix_profile_strength_snapshots_student_id ON profile_strength_snapshots(student_id)")
    cursor.execute("CREATE INDEX ix_profile_strength_snapshots_snapshot_date ON profile_strength_snapshots(snapshot_date)")
    
    conn.commit()
    print("Cleanup successful.")
except Exception as e:
    print(f"Error during cleanup: {e}")
    conn.rollback()
finally:
    conn.close()
