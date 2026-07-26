import sqlite3
import os

"""
WARNING: Ensure the FastAPI development server is STOPPED before running this migration. 
If the server is running with hot-reload, `Base.metadata.create_all()` may race against 
this script and recreate tables out of sync, leading to schema corruption.
"""

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "..", "ai_placement.db")
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. resume_analyses
        print("Migrating resume_analyses...")
        cursor.execute("ALTER TABLE resume_analyses RENAME COLUMN placement_probability TO profile_strength_score")
        cursor.execute("ALTER TABLE resume_analyses RENAME COLUMN placement_readiness TO profile_strength_label")
        
        # 2. resume_predictions
        print("Migrating resume_predictions...")
        cursor.execute("ALTER TABLE resume_predictions RENAME COLUMN placement_probability TO profile_strength_score")
        cursor.execute("ALTER TABLE resume_predictions RENAME COLUMN readiness_score TO profile_strength_label")
        
        # 3. training_dataset_snapshots
        print("Migrating training_dataset_snapshots...")
        cursor.execute("ALTER TABLE training_dataset_snapshots RENAME COLUMN readiness_score TO profile_strength_label")

        # 4. Handle table placement_prediction_snapshots
        print("Migrating table placement_prediction_snapshots...")
        try:
            cursor.execute("ALTER TABLE placement_prediction_snapshots RENAME TO profile_strength_snapshots")
        except sqlite3.OperationalError:
            print("profile_strength_snapshots table might already exist. Copying data...")
            # Assuming create_all already created it
            cursor.execute("INSERT INTO profile_strength_snapshots (id, student_id, predicted_probability, actual_outcome, prediction_date) SELECT id, student_id, predicted_probability, actual_outcome, prediction_date FROM placement_prediction_snapshots")
            cursor.execute("DROP TABLE placement_prediction_snapshots")
        
        conn.commit()
        print("Migration successful.")
    except sqlite3.OperationalError as e:
        print(f"Migration error: {e}. Note: columns might already be renamed.")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
