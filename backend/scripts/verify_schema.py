import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "ai_placement.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def dump_table_info(table_name):
    try:
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"[{table_name}] Columns: {', '.join(columns)}")
    except Exception as e:
        print(f"Error reading {table_name}: {e}")

print("--- DB SCHEMA VERIFICATION ---")
dump_table_info("resume_analyses")
dump_table_info("resume_predictions")
dump_table_info("training_dataset_snapshots")
dump_table_info("profile_strength_snapshots")
dump_table_info("placement_prediction_snapshots")

conn.close()
